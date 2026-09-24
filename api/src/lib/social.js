import { defaultDisplayName, isModerator } from './principal.js'

/**
 * Community features: shared likes, comments with pre-moderation, reports,
 * a leaderboard and the moderator queue. Pure over an injected store.
 *
 * Every write is validated here; nothing from the request is trusted. A
 * comment from anyone but a moderator waits in the queue and is visible only
 * to its author until approved.
 */

const EDITION = /^\d{4}-\d{2}-\d{2}$/
const STORY = /^[a-z0-9][a-z0-9-]{0,199}$/
const COMMENT_ID = /^\d{13}-[a-z0-9]{6}$/
const MAX_COMMENT = 1000
const MAX_NAME = 40
const COMMENTS_PER_HOUR = 10

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code)
    this.status = status
    this.code = code
  }
}

const fail = (status, code, message) => {
  throw new HttpError(status, code, message)
}

/**
 * `AWARE_COMMUNITY`: `on` opens community features to everyone, `preview`
 * only to moderators (a soft launch), `off` to nobody. Unset means `on`, so
 * configuring storage alone behaves as it always has; anything else is `off`.
 */
export function communityMode(value = process.env.AWARE_COMMUNITY) {
  const mode = String(value ?? '').trim().toLowerCase()
  if (!mode) return 'on'
  return mode === 'on' || mode === 'preview' ? mode : 'off'
}

export function communityOpenTo(principal, mode = communityMode(), moderators) {
  if (mode === 'on') return true
  if (mode === 'preview') return isModerator(principal, moderators)
  return false
}

function cleanText(value, max) {
  if (typeof value !== 'string') return ''
  // Control characters other than newlines never reach storage or other readers.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)
}

function storyRef(input) {
  const edition = typeof input?.edition === 'string' ? input.edition : ''
  const storyId = typeof input?.storyId === 'string' ? input.storyId : ''
  if (!EDITION.test(edition)) fail(400, 'bad_edition')
  if (!STORY.test(storyId)) fail(400, 'bad_story')
  return { edition, storyId, key: `${edition}|${storyId}` }
}

function requireUser(principal) {
  if (!principal) fail(401, 'sign_in_required')
  return principal
}

function publicComment(entity, viewer) {
  return {
    id: entity.rowKey,
    storyKey: entity.partitionKey,
    text: entity.text,
    author: entity.displayName,
    createdAt: entity.createdAt,
    status: entity.status,
    mine: Boolean(viewer && viewer.userId === entity.userId),
  }
}

export function createSocial({ store, now = () => Date.now(), moderators, random = Math.random } = {}) {
  const moderatorOf = (principal) => isModerator(principal, moderators)
  const pause = () => new Promise((resolve) => setTimeout(resolve, 5 + Math.floor(random() * 40)))

  /**
   * Recounts a story's likes and visible comments from their own rows and
   * writes the totals. Counting instead of incrementing means a lost race or a
   * failed write is corrected by the next change to the story; it can never
   * drift permanently or drop a reader's like.
   */
  async function syncStats(ref, meta) {
    let totals = { likes: 0, comments: 0 }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const [likes, comments] = await Promise.all([
        store.partition('likes', ref.key),
        store.partition('comments', ref.key),
      ])
      totals = { likes: likes.length, comments: comments.filter((row) => row.status === 'visible').length }
      const current = await store.get('storystats', ref.edition, ref.storyId)
      const next = {
        partitionKey: ref.edition,
        rowKey: ref.storyId,
        ...totals,
        headline: current?.headline || cleanText(meta?.headline, 300),
        category: current?.category || cleanText(meta?.category, 60),
      }
      try {
        if (current) await store.replace('storystats', next, current.etag)
        else await store.insert('storystats', next)
        return totals
      } catch (error) {
        if (error?.statusCode !== 409 && error?.statusCode !== 412) throw error
        await pause()
      }
    }
    // Contended for every attempt: the rows are already right, and the next
    // change to this story rewrites the totals from them.
    return totals
  }

  /**
   * Reserves one comment in the reader's current clock hour with a conditional
   * write, so concurrent requests cannot all pass the check before any insert.
   */
  async function reserveCommentSlot(userId) {
    const bucket = String(Math.floor(now() / 3_600_000))
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const row = await store.get('ratelimits', userId, bucket)
      try {
        if (!row) {
          await store.insert('ratelimits', { partitionKey: userId, rowKey: bucket, count: 1 })
          return
        }
        if ((row.count || 0) >= COMMENTS_PER_HOUR) fail(429, 'slow_down', 'That is a lot of comments in an hour. Try again later.')
        await store.replace('ratelimits', { ...row, count: (row.count || 0) + 1 }, row.etag)
        return
      } catch (error) {
        if (error?.statusCode !== 409 && error?.statusCode !== 412) throw error
        await pause()
      }
    }
    fail(429, 'slow_down', 'Too many comments at once. Try again in a moment.')
  }

  return {
    async me(principal) {
      if (!principal) return { signedIn: false, moderator: false }
      return {
        signedIn: true,
        moderator: moderatorOf(principal),
        provider: principal.provider,
        displayName: defaultDisplayName(principal),
      }
    },

    async stats(principal, { edition }) {
      if (!EDITION.test(edition || '')) fail(400, 'bad_edition')
      const rows = await store.partition('storystats', edition)
      const stats = Object.fromEntries(rows.map((row) => [row.rowKey, { likes: row.likes || 0, comments: row.comments || 0 }]))
      let mine = []
      if (principal) {
        const liked = await store.partition('userlikes', principal.userId)
        mine = liked.filter((row) => row.rowKey.startsWith(`${edition}|`)).map((row) => row.rowKey.slice(edition.length + 1))
      }
      return { edition, stats, mine }
    },

    async toggleLike(principal, input) {
      const user = requireUser(principal)
      const ref = storyRef(input)
      const existing = await store.get('likes', ref.key, user.userId)
      if (existing) {
        await store.remove('likes', ref.key, user.userId)
        await store.remove('userlikes', user.userId, ref.key)
      } else {
        try {
          await store.insert('likes', { partitionKey: ref.key, rowKey: user.userId, likedAt: now() })
        } catch (error) {
          if (error?.statusCode !== 409) throw error
        }
        await store.insert('userlikes', { partitionKey: user.userId, rowKey: ref.key, likedAt: now() }).catch((error) => {
          if (error?.statusCode !== 409) throw error
        })
      }
      const totals = await syncStats(ref, input)
      return { liked: !existing, likes: totals.likes }
    },

    async listComments(principal, input) {
      const ref = storyRef(input)
      const rows = await store.partition('comments', ref.key)
      const moderator = moderatorOf(principal)
      const visible = rows
        .filter((row) => row.status === 'visible' || (principal && row.userId === principal.userId && row.status === 'pending'))
        .sort((a, b) => a.rowKey.localeCompare(b.rowKey))
        .map((row) => publicComment(row, principal))
      return { comments: visible, canModerate: moderator }
    },

    async addComment(principal, input) {
      const user = requireUser(principal)
      const ref = storyRef(input)
      const text = cleanText(input?.text, MAX_COMMENT + 1)
      if (!text) fail(400, 'empty_comment')
      if (text.length > MAX_COMMENT) fail(400, 'comment_too_long')
      let name = cleanText(input?.displayName, MAX_NAME + 1).replace(/\s+/g, ' ')
      if (name.length > MAX_NAME || name.includes('@')) fail(400, 'bad_display_name', 'Names can be up to 40 characters and cannot be an email address.')
      if (!name) name = defaultDisplayName(user)

      const moderator = moderatorOf(user)
      if (!moderator) await reserveCommentSlot(user.userId)

      const createdAt = now()
      const suffix = Math.floor(random() * 36 ** 6).toString(36).padStart(6, '0').slice(-6)
      const entity = {
        partitionKey: ref.key,
        rowKey: `${String(createdAt).padStart(13, '0')}-${suffix}`,
        userId: user.userId,
        displayName: name,
        text,
        createdAt,
        status: moderator ? 'visible' : 'pending',
        reported: false,
        reports: 0,
        headline: cleanText(input?.headline, 300),
      }
      await store.insert('comments', entity)
      if (entity.status === 'visible') await syncStats(ref, input)
      return { comment: publicComment(entity, user) }
    },

    async report(principal, input) {
      const user = requireUser(principal)
      const ref = storyRef(input)
      const commentId = typeof input?.commentId === 'string' ? input.commentId : ''
      if (!COMMENT_ID.test(commentId)) fail(400, 'bad_comment')
      const entity = await store.get('comments', ref.key, commentId)
      if (!entity || entity.status !== 'visible') fail(404, 'not_found')
      if (entity.userId === user.userId) return { reported: false }
      const reporters = String(entity.reporters || '').split(',').filter(Boolean)
      if (!reporters.includes(user.userId)) {
        reporters.push(user.userId)
        await store.replace('comments', {
          ...entity,
          reported: true,
          reports: reporters.length,
          reporters: reporters.slice(-50).join(','),
        }, entity.etag)
      }
      return { reported: true }
    },

    async leaderboard(principal, { days = 7, today } = {}) {
      const span = Math.min(30, Math.max(1, Number(days) || 7))
      const end = EDITION.test(today || '') ? new Date(`${today}T00:00:00Z`) : new Date(now())
      const start = new Date(end.getTime() - (span - 1) * 86_400_000).toISOString().slice(0, 10)
      const rows = await store.partitionsFrom('storystats', start)
      const top = rows
        .filter((row) => (row.likes || 0) > 0)
        .sort((a, b) => (b.likes || 0) - (a.likes || 0) || (b.comments || 0) - (a.comments || 0) || b.partitionKey.localeCompare(a.partitionKey))
        .slice(0, 10)
        .map((row) => ({
          edition: row.partitionKey,
          storyId: row.rowKey,
          headline: row.headline || 'Untitled story',
          category: row.category || '',
          likes: row.likes || 0,
          comments: row.comments || 0,
        }))
      return { since: start, days: span, stories: top }
    },

    async moderationQueue(principal) {
      const user = requireUser(principal)
      if (!moderatorOf(user)) fail(403, 'moderators_only')
      const pending = await store.where('comments', 'status', 'pending')
      const reported = (await store.where('comments', 'reported', true)).filter((row) => row.status === 'visible')
      const view = (row) => ({ ...publicComment(row, user), headline: row.headline || '', reports: row.reports || 0 })
      return {
        pending: pending.sort((a, b) => a.rowKey.localeCompare(b.rowKey)).map(view),
        reported: reported.sort((a, b) => (b.reports || 0) - (a.reports || 0)).map(view),
      }
    },

    async moderate(principal, input) {
      const user = requireUser(principal)
      if (!moderatorOf(user)) fail(403, 'moderators_only')
      const storyKey = typeof input?.storyKey === 'string' ? input.storyKey : ''
      const [edition, storyId] = storyKey.split('|')
      const ref = storyRef({ edition, storyId })
      const commentId = typeof input?.commentId === 'string' ? input.commentId : ''
      if (!COMMENT_ID.test(commentId)) fail(400, 'bad_comment')
      const action = input?.action
      const entity = await store.get('comments', ref.key, commentId)
      if (!entity) fail(404, 'not_found')

      const transitions = {
        approve: { from: ['pending', 'hidden'], to: 'visible', delta: 1 },
        reject: { from: ['pending'], to: 'rejected', delta: 0 },
        hide: { from: ['visible'], to: 'hidden', delta: -1 },
        dismiss: { from: ['visible'], to: 'visible', delta: 0 },
      }
      const rule = transitions[action]
      if (!rule) fail(400, 'bad_action')
      if (!rule.from.includes(entity.status)) fail(409, 'wrong_state', `Cannot ${action} a ${entity.status} comment.`)

      await store.replace('comments', {
        ...entity,
        status: rule.to,
        reported: action === 'dismiss' || action === 'hide' || action === 'approve' ? false : entity.reported,
        reports: action === 'dismiss' || action === 'approve' ? 0 : entity.reports,
        reporters: action === 'dismiss' || action === 'approve' ? '' : entity.reporters || '',
        moderatedAt: now(),
      }, entity.etag)
      if (rule.delta) await syncStats(ref, { headline: entity.headline })
      return { id: commentId, status: rule.to }
    },
  }
}

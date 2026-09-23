import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultDisplayName, isModerator, moderatorList, readPrincipal } from '../src/lib/principal.js'
import { createSocial, HttpError } from '../src/lib/social.js'
import { createMemoryStore } from '../src/lib/store.js'
import { createLocalNews, editionFor, parseRss, searchQuery, validPlace } from '../src/lib/local.js'

const headerOf = (value) => ({ get: (name) => (name === 'x-ms-client-principal' ? value : null) })
const encode = (object) => Buffer.from(JSON.stringify(object)).toString('base64')
const reader = (id, details = `reader${id}`, provider = 'github', roles = ['anonymous', 'authenticated']) =>
  readPrincipal(headerOf(encode({ identityProvider: provider, userId: `user${id}abcdef`, userDetails: details, userRoles: roles })))

const ref = { edition: '2026-09-03', storyId: 'chevron-and-eni-sign-deals-abc123', headline: 'Chevron and Eni sign deals', category: 'business' }

async function rejects(promise, code) {
  await assert.rejects(promise, (error) => error instanceof HttpError && error.code === code)
}

test('principal parsing rejects missing, malformed and anonymous headers', () => {
  assert.equal(readPrincipal(headerOf(null)), null)
  assert.equal(readPrincipal(headerOf('not base64 json')), null)
  assert.equal(readPrincipal(headerOf(encode({ userId: 'x', userRoles: ['anonymous'] }))), null)
  const principal = reader(1)
  assert.equal(principal.provider, 'github')
  assert.equal(principal.userDetails, 'reader1')
})

test('moderators come from roles or AWARE_MODERATORS entries', () => {
  const list = moderatorList('github:Avinash215, someone@example.com')
  assert.equal(isModerator(reader(1, 'Avinash215'), list), true)
  assert.equal(isModerator(reader(2, 'Avinash215', 'aad'), list), false)
  assert.equal(isModerator(reader(3, 'someone@example.com', 'aad'), list), true)
  assert.equal(isModerator(reader(4, 'x', 'github', ['authenticated', 'moderator']), []), true)
  assert.equal(isModerator(null, list), false)
})

test('display names never expose an email address', () => {
  assert.equal(defaultDisplayName(reader(1, 'octocat')), 'octocat')
  assert.match(defaultDisplayName(reader(2, 'person@example.com', 'aad')), /^Reader user2a/)
})

test('likes toggle per reader and keep one shared count', async () => {
  const social = createSocial({ store: createMemoryStore(), moderators: [] })
  await rejects(social.toggleLike(null, ref), 'sign_in_required')
  assert.deepEqual(await social.toggleLike(reader(1), ref), { liked: true, likes: 1 })
  assert.deepEqual(await social.toggleLike(reader(2), ref), { liked: true, likes: 2 })
  assert.deepEqual(await social.toggleLike(reader(1), ref), { liked: false, likes: 1 })
  const stats = await social.stats(reader(2), { edition: ref.edition })
  assert.deepEqual(stats.stats[ref.storyId], { likes: 1, comments: 0 })
  assert.deepEqual(stats.mine, [ref.storyId])
  assert.deepEqual((await social.stats(null, { edition: ref.edition })).mine, [])
})

test('invalid story references are refused before touching storage', async () => {
  const social = createSocial({ store: createMemoryStore() })
  await rejects(social.toggleLike(reader(1), { ...ref, edition: '2026-9-3' }), 'bad_edition')
  await rejects(social.toggleLike(reader(1), { ...ref, storyId: '../../etc' }), 'bad_story')
  await rejects(social.stats(null, { edition: 'nope' }), 'bad_edition')
})

test('comments are pre-moderated, visible to their author, then approved', async () => {
  let clock = 1_790_000_000_000
  const social = createSocial({ store: createMemoryStore(), moderators: ['github:avinash215'], now: () => clock })
  const author = reader(1)
  const other = reader(2)
  const moderator = reader(9, 'Avinash215')

  await rejects(social.addComment(null, { ...ref, text: 'hi' }), 'sign_in_required')
  await rejects(social.addComment(author, { ...ref, text: '   ' }), 'empty_comment')
  await rejects(social.addComment(author, { ...ref, text: 'x'.repeat(1001) }), 'comment_too_long')
  await rejects(social.addComment(author, { ...ref, text: 'hi', displayName: 'me@example.com' }), 'bad_display_name')

  const { comment } = await social.addComment(author, { ...ref, text: 'Worth watching oil prices.\u0007' })
  assert.equal(comment.status, 'pending')
  assert.equal(comment.text, 'Worth watching oil prices.')
  assert.equal((await social.listComments(author, ref)).comments.length, 1)
  assert.equal((await social.listComments(other, ref)).comments.length, 0)
  assert.equal((await social.listComments(null, ref)).comments.length, 0)

  await rejects(social.moderationQueue(author), 'moderators_only')
  const queue = await social.moderationQueue(moderator)
  assert.equal(queue.pending.length, 1)
  await social.moderate(moderator, { storyKey: queue.pending[0].storyKey, commentId: queue.pending[0].id, action: 'approve' })
  assert.equal((await social.listComments(null, ref)).comments.length, 1)
  assert.equal((await social.stats(null, { edition: ref.edition })).stats[ref.storyId].comments, 1)
  await rejects(social.moderate(moderator, { storyKey: queue.pending[0].storyKey, commentId: queue.pending[0].id, action: 'reject' }), 'wrong_state')

  clock += 1000
  const own = await social.addComment(moderator, { ...ref, text: 'Moderator note' })
  assert.equal(own.comment.status, 'visible')
  assert.equal((await social.stats(null, { edition: ref.edition })).stats[ref.storyId].comments, 2)
})

test('reports queue a visible comment and hiding removes it from the count', async () => {
  const social = createSocial({ store: createMemoryStore(), moderators: ['github:avinash215'] })
  const moderator = reader(9, 'Avinash215')
  const { comment } = await social.addComment(moderator, { ...ref, text: 'A visible comment' })
  assert.deepEqual(await social.report(moderator, { ...ref, commentId: comment.id }), { reported: false })
  await social.report(reader(1), { ...ref, commentId: comment.id })
  await social.report(reader(1), { ...ref, commentId: comment.id })
  const queue = await social.moderationQueue(moderator)
  assert.equal(queue.reported.length, 1)
  assert.equal(queue.reported[0].reports, 1)
  await social.moderate(moderator, { storyKey: comment.storyKey, commentId: comment.id, action: 'hide' })
  assert.equal((await social.listComments(null, ref)).comments.length, 0)
  assert.equal((await social.stats(null, { edition: ref.edition })).stats[ref.storyId].comments, 0)
  assert.equal((await social.moderationQueue(moderator)).reported.length, 0)
})

test('comment rate limit applies to readers, not moderators', async () => {
  const social = createSocial({ store: createMemoryStore(), moderators: ['github:avinash215'] })
  for (let index = 0; index < 10; index += 1) await social.addComment(reader(1), { ...ref, text: `comment ${index}` })
  await rejects(social.addComment(reader(1), { ...ref, text: 'one more' }), 'slow_down')
  for (let index = 0; index < 12; index += 1) await social.addComment(reader(9, 'Avinash215'), { ...ref, text: `note ${index}` })
})

test('leaderboard ranks liked stories within the window', async () => {
  const social = createSocial({ store: createMemoryStore(), now: () => Date.parse('2026-09-10T12:00:00Z') })
  await social.toggleLike(reader(1), ref)
  const later = { ...ref, edition: '2026-09-09', storyId: 'another-story-1', headline: 'Another' }
  await social.toggleLike(reader(1), later)
  await social.toggleLike(reader(2), later)
  const board = await social.leaderboard(null, { days: 7 })
  assert.equal(board.since, '2026-09-04')
  assert.deepEqual(board.stories.map((story) => story.storyId), ['another-story-1'])
  const wide = await social.leaderboard(null, { days: 30 })
  assert.deepEqual(wide.stories.map((story) => [story.storyId, story.likes]), [['another-story-1', 2], [ref.storyId, 1]])
})

const RSS = `<?xml version="1.0"?><rss><channel>
<item><title>New ferry terminal opens in Jersey City - PIX11</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Tue, 22 Sep 2026 14:00:00 GMT</pubDate><source url="https://pix11.com">PIX11</source></item>
<item><title>New ferry terminal opens in Jersey City - CBS News</title><link>https://news.google.com/rss/articles/def</link><pubDate>Tue, 22 Sep 2026 13:00:00 GMT</pubDate><source url="https://cbsnews.com">CBS News</source></item>
<item><title>Council &amp; mayor clash over &#8216;fixed assets&#8217; - Hudson County View</title><link>https://news.google.com/rss/articles/ghi</link><pubDate>Tue, 22 Sep 2026 15:00:00 GMT</pubDate><source url="https://hudsoncountyview.com">Hudson County View</source></item>
<item><title>Broken link</title><link>javascript:alert(1)</link></item>
</channel></rss>`

test('RSS parsing strips outlet suffixes, decodes entities and drops unsafe links', () => {
  const items = parseRss(RSS)
  assert.equal(items.length, 3)
  assert.equal(items[0].title, 'New ferry terminal opens in Jersey City')
  assert.equal(items[0].source, 'PIX11')
  assert.equal(items[2].title, 'Council & mayor clash over ‘fixed assets’')
})

test('local headlines validate the place, dedupe, sort and cache', async () => {
  let calls = 0
  let requested = ''
  const fetchImpl = async (url) => {
    calls += 1
    requested = url
    return { ok: true, text: async () => RSS }
  }
  const local = createLocalNews({ fetchImpl, now: () => 1_000 })
  await assert.rejects(local({ place: '<script>' }), (error) => error.code === 'bad_place')
  const result = await local({ place: 'Jersey City, NJ', country: 'United States' })
  assert.equal(result.items.length, 2)
  assert.equal(result.items[0].source, 'Hudson County View')
  assert.match(decodeURIComponent(requested), /q="Jersey City" NJ when:3d/)
  assert.match(requested, /gl=US&ceid=US:en/)
  await local({ place: 'jersey city,  nj', country: 'United States' })
  assert.equal(calls, 1, 'case and spacing variants share one cached result')
  await local({ place: 'Jersey City, NJ', country: 'United Kingdom' })
  assert.equal(calls, 2, 'a different Google News edition is fetched separately')
})

test('local helpers', () => {
  assert.equal(editionFor('United Kingdom'), 'GB')
  assert.equal(editionFor('Brazil'), 'US')
  assert.equal(searchQuery('Portland, Maine'), '"Portland" Maine when:3d')
  assert.equal(validPlace('  São Paulo  '), 'São Paulo')
  assert.equal(validPlace('a'), '')
})

test('upstream failures surface as 502 without leaking details', async () => {
  const local = createLocalNews({ fetchImpl: async () => { throw new Error('ECONNRESET secret') } })
  await assert.rejects(local({ place: 'Leeds', country: 'United Kingdom' }), (error) => error.status === 502 && error.code === 'upstream_unreachable')
  const notOk = createLocalNews({ fetchImpl: async () => ({ ok: false, text: async () => '' }) })
  await assert.rejects(notOk({ place: 'Leeds' }), (error) => error.status === 502)
})

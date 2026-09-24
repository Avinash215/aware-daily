/**
 * Browser-local personal features: interests, location, likes, follows and
 * quiz scores. Pure functions only; the persisted stores live in
 * `hooks/usePersonal.js`.
 *
 * Everything here chooses from the loaded edition. Nothing is sent anywhere,
 * nothing changes what Aware publishes, and every match carries the reason it
 * was made so the UI can show why a story appears.
 */

import { QUIZ_RESULT_FORMAT, validQuizResult } from './quizResults.js'

/** The category-rail key for the personal view; never a real category key. */
export const FOR_YOU = '__aware_for_you'

const MAX_KEYWORDS = 20
const MAX_SECTIONS = 20
const MAX_TEXT = 1000
const MAX_LIKES = 500
const MAX_FOLLOWS = 100
const MAX_QUIZ_EDITIONS = 30

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
const str = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const num = (value, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)

function uniqueStrings(list, max, length = 60) {
  const seen = new Set()
  const out = []
  for (const entry of Array.isArray(list) ? list : []) {
    const text = str(entry, length)
    const folded = text.toLowerCase()
    if (!text || seen.has(folded)) continue
    seen.add(folded)
    out.push(text)
    if (out.length >= max) break
  }
  return out
}

/* ------------------------------------------------------------------ prefs */

export const emptyPrefs = () => ({ sections: [], keywords: [], instructions: '', country: '', region: '', place: '' })

export function sanitizePrefs(raw) {
  const value = isObject(raw) ? raw : {}
  return {
    sections: uniqueStrings(value.sections, MAX_SECTIONS),
    keywords: uniqueStrings(value.keywords, MAX_KEYWORDS, 40),
    instructions: typeof value.instructions === 'string' ? value.instructions.slice(0, MAX_TEXT) : '',
    country: str(value.country, 60),
    region: str(value.region, 40),
    place: str(value.place, 80),
  }
}

export const hasInterests = (prefs) => Boolean(prefs.sections.length || prefs.keywords.length)
export const hasLocation = (prefs) => Boolean(prefs.country || prefs.region || prefs.place)

/** Splits "AI, Azure; India" into clean keywords. */
export function parseKeywords(text) {
  return uniqueStrings(String(text ?? '').split(/[,;\n]/), MAX_KEYWORDS, 40)
}

/* --------------------------------------------------------- story snapshots */

/** The minimum a like or follow needs to stay meaningful after the edition rotates. */
export function storySnapshot(story, category, edition) {
  if (!story || typeof story.id !== 'string' || !story.id) return null
  return {
    key: `${edition || 'unknown'}::${story.id}`,
    id: story.id,
    edition: edition || '',
    headline: str(story.headline, 300) || 'Untitled story',
    category: str(story.category, 60),
    categoryLabel: str(category?.label, 60) || str(story.category, 60),
    region: str(story.region, 40),
    countries: uniqueStrings((story.countries || []).map((country) => country?.name), 8),
    topics: uniqueStrings(story.topics, 12, 40),
  }
}

function sanitizeSnapshot(raw) {
  if (!isObject(raw)) return null
  const id = str(raw.id, 200)
  const edition = str(raw.edition, 40)
  if (!id) return null
  return {
    key: `${edition || 'unknown'}::${id}`,
    id,
    edition,
    headline: str(raw.headline, 300) || 'Untitled story',
    category: str(raw.category, 60),
    categoryLabel: str(raw.categoryLabel, 60),
    region: str(raw.region, 40),
    countries: uniqueStrings(raw.countries, 8),
    topics: uniqueStrings(raw.topics, 12, 40),
  }
}

function sanitizeEntries(raw, max, extra) {
  const seen = new Set()
  const out = []
  for (const entry of Array.isArray(raw?.entries) ? raw.entries : []) {
    const base = sanitizeSnapshot(entry)
    if (!base || seen.has(base.key)) continue
    seen.add(base.key)
    out.push({ ...base, ...extra(entry) })
  }
  return { entries: out.slice(-max) }
}

export const emptyEntries = () => ({ entries: [] })

export const sanitizeLikes = (raw) =>
  sanitizeEntries(raw, MAX_LIKES, (entry) => ({
    likedAt: num(entry.likedAt),
    note: typeof entry.note === 'string' ? entry.note.slice(0, MAX_TEXT) : '',
  }))

export const sanitizeFollows = (raw) =>
  sanitizeEntries(raw, MAX_FOLLOWS, (entry) => ({ followedAt: num(entry.followedAt) }))

export const entryKey = (edition, id) => `${edition || 'unknown'}::${id}`

/* ------------------------------------------------------------------ quiz */

export const emptyQuiz = () => ({ editions: {} })

function sanitizeQuizRecord(value) {
  const record = {
    best: Math.max(0, Math.floor(num(value.best))),
    total: Math.max(0, Math.floor(num(value.total))),
    attempts: Math.max(0, Math.floor(num(value.attempts))),
    lastAt: num(value.lastAt),
  }
  // Old four-field records must round-trip unchanged through the strict read gate.
  // Only a new completed attempt introduces evidence; old maxima stay unverified.
  if (value.format === QUIZ_RESULT_FORMAT && validQuizResult(value.best, value.total) &&
      Number.isFinite(value.bestAt)) {
    record.format = QUIZ_RESULT_FORMAT
    record.bestAt = value.bestAt
    if (isObject(value.legacy)) {
      record.legacy = {
        best: Math.max(0, Math.floor(num(value.legacy.best))),
        total: Math.max(0, Math.floor(num(value.legacy.total))),
        attempts: Math.max(0, Math.floor(num(value.legacy.attempts))),
        lastAt: num(value.legacy.lastAt),
      }
    }
  }
  return record
}

export function sanitizeQuiz(raw) {
  const editions = isObject(raw?.editions) ? raw.editions : {}
  const rows = Object.entries(editions)
    .filter(([key, value]) => typeof key === 'string' && key && isObject(value))
    .map(([key, value]) => [key.slice(0, 40), sanitizeQuizRecord(value)])
    .sort((a, b) => a[1].lastAt - b[1].lastAt)
    .slice(-MAX_QUIZ_EDITIONS)
  return { editions: Object.fromEntries(rows) }
}

/* -------------------------------------------------------------- matching */

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function wordPattern(keyword) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(keyword)}(?=$|[^\\p{L}\\p{N}])`, 'iu')
}

function storyText(story) {
  return [story.headline, story.dek, story.so_what, (story.topics || []).join(' ')].join(' \n ')
}

function byRankThenScore(a, b) {
  return b.score - a.score || (a.story.rank ?? 999) - (b.story.rank ?? 999)
}

/**
 * Stories in this edition that match the reader's sections, keywords, or the
 * topics of stories they liked. A keyword counts only as a whole word.
 */
export function interestMatches(stories, prefs, likes = [], { labelFor = (key) => key, limit = 12 } = {}) {
  const sections = new Set(prefs.sections)
  const patterns = prefs.keywords.map((keyword) => [keyword, wordPattern(keyword)])
  const likedTopics = new Set(likes.flatMap((entry) => entry.topics.map((topic) => topic.toLowerCase())))
  const likedIds = new Set(likes.map((entry) => entry.id))

  const matches = []
  for (const story of stories) {
    const reasons = []
    let score = 0
    const text = storyText(story)
    for (const [keyword, pattern] of patterns) {
      if (pattern.test(text)) {
        score += 3
        reasons.push(`“${keyword}”`)
      }
    }
    if (sections.has(story.category)) {
      score += 1
      reasons.push(labelFor(story.category))
    }
    if (likedTopics.size && !likedIds.has(story.id)) {
      const shared = (story.topics || []).filter((topic) => likedTopics.has(topic.toLowerCase()))
      if (shared.length >= 2) {
        score += 1
        reasons.push('Close to stories you liked')
      }
    }
    if (score > 0) matches.push({ story, score, reasons })
  }
  // Keyword and like matches first; a section alone never outranks them.
  return matches.sort(byRankThenScore).slice(0, limit)
}

/** Stories about the reader's chosen country, then others in their region. */
export function locationMatches(stories, prefs, { limit = 5 } = {}) {
  const country = prefs.country
  const region = prefs.region
  const pattern = country ? wordPattern(country) : null
  const out = []
  const used = new Set()

  // Only stories that are about the place: it is a principal actor, or the
  // headline names it. A passing mention in the body (or a secondary tag on a
  // big country that appears everywhere) does not make a story local to you.
  if (country) {
    for (const story of stories) {
      const actor = (story.countries || []).some((entry) =>
        entry.name?.toLowerCase() === country.toLowerCase() && (entry.role || 'actor') === 'actor')
      const headline = pattern.test(story.headline || '')
      if (actor || headline) {
        out.push({ story, score: (actor ? 2 : 0) + (headline ? 1 : 0), reasons: [headline ? `Names ${country}` : `About ${country}`] })
        used.add(story.id)
      }
    }
  }
  if (region) {
    for (const story of stories) {
      if (used.has(story.id)) continue
      if (story.region && story.region.toLowerCase() === region.toLowerCase()) {
        out.push({ story, score: 0, reasons: [region] })
      }
    }
  }
  return out.sort(byRankThenScore).slice(0, limit)
}

/**
 * What the loaded edition holds for each followed story: a catch-up that
 * names it, and later coverage sharing at least two of its topics. A story
 * followed today has nothing newer yet, and says so rather than guessing.
 */
export function followMatches(stories, recaps, follows, edition) {
  return follows
    .slice()
    .sort((a, b) => b.followedAt - a.followedAt)
    .map((follow) => {
      const topics = new Set(follow.topics.map((topic) => topic.toLowerCase()))
      const recap = recaps.find((entry) => entry.story_ids.includes(follow.id)) || null
      const sameEdition = follow.edition === edition
      const related = []
      for (const story of stories) {
        if (story.id === follow.id) continue
        const shared = (story.topics || []).filter((topic) => topics.has(topic.toLowerCase()))
        const sameCountry = (story.countries || []).some((entry) => follow.countries.includes(entry.name))
        if (shared.length >= 3 || (shared.length >= 2 && (sameCountry || story.category === follow.category))) {
          related.push({ story, shared })
        }
      }
      related.sort((a, b) => b.shared.length - a.shared.length || (a.story.rank ?? 999) - (b.story.rank ?? 999))
      const linkedRecap = recap || related.map((entry) => entry.story.recap_id).filter(Boolean)
        .map((id) => recaps.find((entry) => entry.id === id)).find(Boolean) || null
      return { follow, sameEdition, recap: linkedRecap, related: related.slice(0, 3) }
    })
}

/* ----------------------------------------------------------- leaderboard */

function tally(values) {
  const counts = new Map()
  for (const value of values) {
    if (!value) continue
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** The reader's own ranking of what they liked, by section, country and topic. */
export function likeLeaderboard(likes) {
  return {
    sections: tally(likes.map((entry) => entry.categoryLabel || entry.category)).slice(0, 6),
    countries: tally(likes.flatMap((entry) => entry.countries)).slice(0, 6),
    topics: tally(likes.flatMap((entry) => entry.topics.map((topic) => topic.toLowerCase()))).slice(0, 8),
  }
}

/** A plain JSON block of the reader's curation settings, for the owner's persona. */
export function curationExport(prefs, likes) {
  const board = likeLeaderboard(likes)
  return JSON.stringify({
    interests: { sections: prefs.sections, keywords: prefs.keywords },
    location: { place: prefs.place || null, country: prefs.country || null, region: prefs.region || null },
    instructions: prefs.instructions.trim() || null,
    liked_topics: board.topics.map((entry) => entry.label),
  }, null, 2)
}

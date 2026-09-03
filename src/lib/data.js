/**
 * The data layer for Aware Daily.
 *
 * The whole app reads the briefing through this module. Everything here is
 * defensive: a missing, partial or wrongly-typed payload degrades to empty
 * arrays and empty strings, never a thrown error and never a white screen.
 */

import payload from '../data/daily.json'

/** Category keys we ship accent tokens for, in slate order. */
const KNOWN_CATEGORY_KEYS = [
  'geopolitics',
  'business',
  'technology',
  'science',
  'climate',
  'health',
  'sports',
  'culture',
]

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const asObject = (value) => (isObject(value) ? value : {})

const asArray = (value) => (Array.isArray(value) ? value : [])

const asString = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

const asNumber = (value, fallback = null) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

/** Numbers keyed by string, with every non-numeric entry dropped. */
const asNumberMap = (value) => {
  const out = {}
  for (const [key, raw] of Object.entries(asObject(value))) {
    const num = asNumber(raw)
    if (num !== null) out[key] = num
  }
  return out
}

const asStringList = (value) =>
  asArray(value)
    .map((entry) => asString(entry).trim())
    .filter(Boolean)

const normaliseCountry = (raw) => {
  const country = asObject(raw)
  return {
    name: asString(country.name),
    flag: asString(country.flag),
    role: asString(country.role),
  }
}

const normaliseSource = (raw) => {
  const source = asObject(raw)
  return {
    source: asString(source.source),
    title: asString(source.title),
    url: asString(source.url),
  }
}

const normaliseActor = (raw) => {
  const actor = asObject(raw)
  return {
    name: asString(actor.name).trim(),
    flag: asString(actor.flag).trim(),
    role: asString(actor.role).trim(),
    position: asString(actor.position).trim(),
  }
}

const normaliseBeat = (raw) => {
  const beat = asObject(raw)
  return {
    date: asString(beat.date).trim(),
    headline: asString(beat.headline).trim(),
    what: asString(beat.what).trim(),
    why_it_mattered: asString(beat.why_it_mattered).trim(),
  }
}

/** The app-wide confidence vocabulary. Anything else degrades to `reported`. */
const CONFIDENCE_LEVELS = ['confirmed', 'reported', 'disputed']

/**
 * One recap, coerced to the shape the recap contract fixes. Exported because
 * `useSavedRecaps` stores whole recap objects in localStorage and must run
 * anything it reads back through exactly the same coercion, so a recap saved
 * by an older build can never reach the view in a shape it does not expect.
 *
 * Returns `null` for anything without an id: nothing could link to it.
 */
export const normaliseRecap = (raw) => {
  if (!isObject(raw)) return null

  const id = asString(raw.id).trim()
  if (!id) return null

  const confidence = asString(raw.confidence).trim().toLowerCase()

  return {
    ...raw,
    id,
    slug: asString(raw.slug).trim(),
    title: asString(raw.title).trim(),
    as_of: asString(raw.as_of).trim(),
    days_covered: asNumber(raw.days_covered, 0) ?? 0,
    story_ids: asStringList(raw.story_ids),
    orient: asString(raw.orient).trim(),
    ground: asStringList(raw.ground),
    cast: asArray(raw.cast)
      .map(normaliseActor)
      .filter((actor) => actor.name || actor.role || actor.position),
    path: asArray(raw.path)
      .map(normaliseBeat)
      .filter((beat) => beat.date || beat.headline || beat.what),
    now: asString(raw.now).trim(),
    stakes: asString(raw.stakes).trim(),
    next: asStringList(raw.next),
    sources: asArray(raw.sources).map(normaliseSource).filter((s) => s.url || s.source),
    confidence: CONFIDENCE_LEVELS.includes(confidence) ? confidence : 'reported',
    coverage_note: asString(raw.coverage_note).trim(),
    generated_by: asString(raw.generated_by).trim(),
  }
}

/**
 * The accent CSS custom property *name* for a category, e.g.
 * `'--accent-geopolitics'`. Unknown keys fall back to a token that is always
 * defined so consumers can use the value unconditionally.
 */
const accentFor = (key) =>
  KNOWN_CATEGORY_KEYS.includes(key) ? `--accent-${key}` : '--text-primary'

const normaliseStory = (raw, index) => {
  if (!isObject(raw)) return null

  return {
    ...raw,
    id: asString(raw.id).trim() || `story-${index}`,
    category: asString(raw.category).trim(),
    rank: asNumber(raw.rank, index + 1),
    tier: asString(raw.tier).trim() || 'standard',
    score: asNumber(raw.score),
    headline: asString(raw.headline),
    dek: asString(raw.dek),
    body: asString(raw.body),
    so_what: asString(raw.so_what),
    what_now: asString(raw.what_now),
    region: asString(raw.region),
    pattern: asString(raw.pattern),
    topics: asStringList(raw.topics),
    countries: asArray(raw.countries).map(normaliseCountry).filter((c) => c.name || c.flag),
    read_time_min: asNumber(raw.read_time_min),
    date: asString(raw.date),
    sources: asArray(raw.sources).map(normaliseSource).filter((s) => s.url || s.source),
    source_count: asNumber(raw.source_count, 0),
    why_ranked: asString(raw.why_ranked),
    scores: asNumberMap(raw.scores),
    consequence: asNumberMap(raw.consequence),
    recap_id: asString(raw.recap_id).trim(),
  }
}

const normaliseCategory = (raw, index) => {
  if (!isObject(raw)) return null

  const key = asString(raw.key).trim()
  if (!key) return null

  return {
    ...raw,
    key,
    label: asString(raw.label).trim() || key,
    emoji: asString(raw.emoji),
    blurb: asString(raw.blurb),
    count: asNumber(raw.count, 0),
    order: index,
    accent: accentFor(key),
  }
}

/** The raw payload, exactly as it sits on disk. */
export const daily = isObject(payload) ? payload : {}

/** Every story, in payload order, with each field coerced to a safe shape. */
export const stories = asArray(daily.stories)
  .map(normaliseStory)
  .filter(Boolean)

const byRank = (a, b) => {
  const left = a.rank === null ? Number.MAX_SAFE_INTEGER : a.rank
  const right = b.rank === null ? Number.MAX_SAFE_INTEGER : b.rank
  return left - right
}

const storiesFor = (key) => stories.filter((story) => story.category === key).sort(byRank)

/**
 * Every category from the payload, each augmented with its own `stories`
 * (rank ascending) and the `accent` custom property name for its colour.
 */
export const categories = asArray(daily.categories)
  .map(normaliseCategory)
  .filter(Boolean)
  .map((category) => ({ ...category, stories: storiesFor(category.key) }))

/**
 * Every recap in this edition, in payload order. The key is optional: an
 * edition built before the recap unit shipped simply has none, and every
 * consumer must treat an empty array as the normal case.
 */
export const recaps = asArray(daily.recaps)
  .map(normaliseRecap)
  .filter(Boolean)

const storyIndex = new Map(stories.map((story) => [story.id, story]))
const categoryIndex = new Map(categories.map((category) => [category.key, category]))
const recapIndex = new Map(recaps.map((recap) => [recap.id, recap]))

/**
 * The single highest-priority story: the lowest-ranked `lead`, falling back to
 * the first story in the payload. `null` when the briefing is empty.
 */
export const leadStory =
  stories.filter((story) => story.tier === 'lead').sort(byRank)[0] ?? stories[0] ?? null

/** Look up one story by id. Returns `null` when it does not exist. */
export function getStory(id) {
  if (typeof id !== 'string' || !id) return null
  return storyIndex.get(id) ?? null
}

/** Look up one category by key. Returns `null` when it does not exist. */
export function getCategory(key) {
  if (typeof key !== 'string' || !key) return null
  return categoryIndex.get(key) ?? null
}

/**
 * Look up one recap by id. Returns `null` when it does not exist, which is the
 * ordinary answer for every story until the pipeline emits recaps.
 */
export function getRecap(id) {
  if (typeof id !== 'string') return null
  const key = id.trim()
  if (!key) return null
  return recapIndex.get(key) ?? null
}

/** Stories in a category, rank ascending. Always an array. */
export function storiesByCategory(key) {
  const category = getCategory(key)
  if (category) return category.stories
  if (typeof key !== 'string' || !key) return []
  return storiesFor(key)
}

const totals = asObject(daily.totals)

/** Masthead-level facts about this briefing. */
export const meta = {
  date: asString(daily.date),
  generatedAt: asString(daily.generated_at),
  persona: asString(daily.persona),
  publishedCount: asNumber(totals.published, stories.length) ?? stories.length,
  categoryCount: asNumber(totals.categories, categories.length) ?? categories.length,
}

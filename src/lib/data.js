/**
 * The data layer for Aware Daily.
 *
 * The whole app reads the briefing through this module. Everything here is
 * defensive: a missing, partial or wrongly-typed payload degrades to empty
 * arrays and empty strings, never a thrown error and never a white screen.
 */

import payload from '../data/daily.json'
import { normaliseSources } from './sources.js'

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
    sources: normaliseSources(raw.sources),
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
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null
  if (![raw.headline, raw.dek, raw.body].some((text) => typeof text === 'string' && text.trim())) return null

  return {
    ...raw,
    id: raw.id,
    category: asString(raw.category),
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
    sources: normaliseSources(raw.sources),
    source_count: asNumber(raw.source_count, 0),
    why_ranked: asString(raw.why_ranked),
    scores: asNumberMap(raw.scores),
    consequence: asNumberMap(raw.consequence),
    recap_id: asString(raw.recap_id).trim(),
  }
}

const normaliseCategory = (raw, index) => {
  if (!isObject(raw)) return null

  const key = raw.key
  if (typeof key !== 'string' || !key.trim()) return null

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

const diagnostics = {
  invalidStoryCollection: Number(!Array.isArray(daily.stories)),
  invalidCategoryCollection: Number(!Array.isArray(daily.categories)),
  discardedStories: 0,
  duplicateStoryIds: 0,
  discardedCategories: 0,
  duplicateCategories: 0,
  recoveredStories: 0,
  mismatchedTotals: 0,
}

/** Only the first usable record for each original ID enters the edition. */
export const stories = []
const usableIds = new Set()
const seenIds = new Set()
asArray(daily.stories).forEach((raw, index) => {
  const id = isObject(raw) && typeof raw.id === 'string' && raw.id.trim() ? raw.id : null
  if (id !== null) {
    if (seenIds.has(id)) diagnostics.duplicateStoryIds += 1
    seenIds.add(id)
  }
  const story = normaliseStory(raw, index)
  if (!story) {
    diagnostics.discardedStories += 1
  } else if (!usableIds.has(story.id)) {
    usableIds.add(story.id)
    stories.push(story)
  }
})

const byRank = (a, b) => {
  const left = a.rank === null ? Number.MAX_SAFE_INTEGER : a.rank
  const right = b.rank === null ? Number.MAX_SAFE_INTEGER : b.rank
  return left - right
}

/** Membership is display metadata, never a replacement editorial subject. */
export const categories = []
const categoryIndex = new Map()
asArray(daily.categories).forEach((raw, index) => {
  const category = normaliseCategory(raw, index)
  if (!category) {
    diagnostics.discardedCategories += 1
  } else if (categoryIndex.has(category.key)) {
    diagnostics.duplicateCategories += 1
  } else {
    const group = { ...category, stories: [], count: 0 }
    categoryIndex.set(group.key, group)
    categories.push(group)
  }
})

const storyCategoryIndex = new Map()
let recovery = null
for (const story of stories) {
  let group = categoryIndex.get(story.category)
  if (!group || group === recovery) {
    diagnostics.recoveredStories += 1
    if (!recovery) {
      let key = '__aware_other_stories'
      while (categoryIndex.has(key)) key += '_'
      recovery = { key, label: 'Other stories', emoji: '', blurb: '', count: 0,
        order: categories.length, accent: '--text-primary', stories: [] }
      categories.push(recovery)
      categoryIndex.set(key, recovery)
    }
    group = recovery
  }
  group.stories.push(story)
  storyCategoryIndex.set(story.id, group)
}
for (const group of categories) {
  group.stories.sort(byRank)
  group.count = group.stories.length
}

// A null selection is All; supplied keys (including "all") are always groups.
export const ALL_CATEGORIES = null
export const categoryDomId = (key) =>
  `category-${Array.from(key, (character) => character.codePointAt(0).toString(16)).join('-')}`
export const categoryTabId = (key) => key === ALL_CATEGORIES ? 'tab-all' : `tab-${categoryDomId(key)}`

/**
 * Every recap in this edition, in payload order. The key is optional: an
 * edition built before the recap unit shipped simply has none, and every
 * consumer must treat an empty array as the normal case.
 */
export const recaps = asArray(daily.recaps)
  .map(normaliseRecap)
  .filter(Boolean)

const storyIndex = new Map(stories.map((story) => [story.id, story]))
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

export function getStoryCategory(id) {
  return storyCategoryIndex.get(id) ?? null
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
  return getCategory(key)?.stories ?? []
}

const totals = asObject(daily.totals)
for (const [field, actual] of [['published', stories.length], ['categories', categories.length]]) {
  if (totals[field] !== undefined && asNumber(totals[field]) !== actual) diagnostics.mismatchedTotals += 1
}

/** Fixed-size, counts-only local diagnostics: never content, IDs or storage. */
export const editionDiagnostics = Object.freeze(diagnostics)
export const partialEdition = Object.values(editionDiagnostics).some((count) => count > 0)
if (partialEdition) console.warn('Aware Daily: partial edition', editionDiagnostics)

/** Masthead-level facts about this briefing. */
export const meta = {
  date: asString(daily.date),
  generatedAt: asString(daily.generated_at),
  persona: asString(daily.persona),
  publishedCount: stories.length,
  categoryCount: categories.length,
}

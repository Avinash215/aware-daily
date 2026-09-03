import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Reading depth — how much of each story the FEED CARDS show.
 *
 * Today's edition is 55 stories: ~2 minutes as headlines, ~14 as headline +
 * dek + So what, ~51 with the reporting inline. The promise is "one finishable
 * briefing", so the reader picks the length. This module owns:
 *
 *   - the three modes and the persisted choice (`aware-daily:depth`)
 *   - `bodyAfterDek`, the duplication guard Full mode depends on
 *   - `estimateDepthMinutes`, the read-time payoff, measured from real data
 *
 * The reader is deliberately not involved: once someone taps into a story they
 * have committed, and that is not the moment to ration text.
 */

const DEPTH_STORAGE_KEY = 'aware-daily:depth'

/** Average adult reading speed for news prose. */
const WORDS_PER_MINUTE = 230

/** How much of the dek we fingerprint when matching it against paragraph one. */
const FINGERPRINT_CHARS = 60

/** A fingerprint shorter than this is too generic to trust as a match. */
const MIN_FINGERPRINT_CHARS = 20

export const DEFAULT_DEPTH = 'brief'

/** The three modes, in order. `label` is what the control renders. */
export const DEPTH_MODES = [
  { key: 'skim', label: 'Skim', hint: 'Headlines only' },
  { key: 'brief', label: 'Brief', hint: 'Headline, dek and So what' },
  { key: 'full', label: 'Full', hint: 'Headline, dek, So what and the reporting' },
]

const DEPTH_KEYS = DEPTH_MODES.map((mode) => mode.key)

/** True only for a key this app actually renders. */
export function isDepth(value) {
  return typeof value === 'string' && DEPTH_KEYS.includes(value)
}

/** The mode descriptor for a key, falling back to the default mode. */
export function depthMode(value) {
  return DEPTH_MODES.find((mode) => mode.key === value) ?? DEPTH_MODES.find((mode) => mode.key === DEFAULT_DEPTH)
}

function readDepth() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_DEPTH
    const raw = window.localStorage.getItem(DEPTH_STORAGE_KEY)
    // Anything unknown, corrupt or hand-edited falls back to Brief.
    return isDepth(raw) ? raw : DEFAULT_DEPTH
  } catch {
    return DEFAULT_DEPTH
  }
}

function writeDepth(depth) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(DEPTH_STORAGE_KEY, depth)
  } catch {
    // Blocked or full storage: the choice still holds for this session.
  }
}

/**
 * Fold the cosmetic differences between two separately generated strings:
 * curly quotes, dashes, ellipses and runs of whitespace. Without this, two
 * stories in today's edition read as "different" purely because the dek was
 * exported with straight quotes and the body with typographic ones.
 */
function fingerprint(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019\u201a\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Body split on blank lines, trimmed, with empties dropped. Always an array. */
export function paragraphsOf(body) {
  return String(body ?? '')
    .split(/\r?\n\s*\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/**
 * True when a paragraph is the source the dek was cut from.
 *
 * The comparison is on normalised, case-folded leading characters because the
 * two strings are generated separately — two stories in today's edition differ
 * only in straight versus curly quotes.
 */
function repeatsDek(paragraph, dek) {
  const dekPrint = fingerprint(dek).replace(/[.…\s]+$/, '')
  if (!dekPrint) return false

  const opening = fingerprint(paragraph)
  const key = dekPrint.slice(0, FINGERPRINT_CHARS)

  // A very short dek is too generic for a prefix test, so it has to match the
  // whole paragraph before we treat it as a repeat.
  return key.length < MIN_FINGERPRINT_CHARS
    ? opening.replace(/[.…\s]+$/, '') === dekPrint
    : opening.startsWith(key)
}

/**
 * The paragraphs Full mode may safely add underneath the opening.
 *
 * `dek` is literally the opening sentence of `body` on 55 of today's 55
 * stories — the exporter derives it that way — so rendering the body whole
 * would make every card repeat its own first sentence. That bug shipped once
 * already. Guard rails, in order:
 *
 *   - a body with a single paragraph yields nothing extra, never a repeat
 *   - paragraph one is dropped when it opens with the dek
 *
 * Returns `[]` when there is nothing to add.
 */
export function bodyAfterDek(body, dek) {
  const paragraphs = paragraphsOf(body)
  if (paragraphs.length <= 1) return []
  if (!fingerprint(dek).replace(/[.…\s]+$/, '')) return paragraphs.slice(1)

  return repeatsDek(paragraphs[0], dek) ? paragraphs.slice(1) : paragraphs
}

/**
 * What Full mode renders: `{ opening, rest }`.
 *
 * The dek is a teaser — the exporter cuts it mid-clause and ends it in an
 * ellipsis — which is right for Skim and Brief and wrong for the one mode
 * where the reader has asked for everything. So Full swaps the teaser for the
 * paragraph it was cut from and picks the body up at paragraph two. A card
 * that has no body, or whose dek is a standfirst rather than a cut of
 * paragraph one, keeps the dek and loses nothing.
 *
 * Either way the opening text appears exactly once.
 */
export function fullTextFor(body, dek) {
  const paragraphs = paragraphsOf(body)
  const dekText = String(dek ?? '').trim()
  const first = paragraphs[0] ?? ''

  return {
    opening: first && repeatsDek(first, dekText) ? first : dekText,
    rest: bodyAfterDek(body, dek),
  }
}

function countWords(value) {
  const text = String(value ?? '').trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

/** Whole minutes at `WORDS_PER_MINUTE`, floored at 1 so nothing reads "0 min". */
export function minutesForWords(words) {
  const value = typeof words === 'number' && Number.isFinite(words) ? words : 0
  return Math.max(1, Math.round(value / WORDS_PER_MINUTE))
}

/**
 * Minutes to get through the WHOLE briefing in each mode, measured from the
 * loaded edition rather than hardcoded. Shape: `{ skim, brief, full }`.
 */
export function estimateDepthMinutes(stories) {
  const list = Array.isArray(stories) ? stories : []

  let skimWords = 0
  let briefWords = 0
  let fullWords = 0

  for (const story of list) {
    if (!story || typeof story !== 'object') continue

    const headline = countWords(story.headline)
    const soWhat = countWords(story.so_what)
    const { opening, rest } = fullTextFor(story.body, story.dek)
    const reporting = rest.reduce((total, paragraph) => total + countWords(paragraph), 0)

    skimWords += headline
    briefWords += headline + countWords(story.dek) + soWhat
    fullWords += headline + countWords(opening) + soWhat + reporting
  }

  return {
    skim: minutesForWords(skimWords),
    brief: minutesForWords(briefWords),
    full: minutesForWords(fullWords),
  }
}

/**
 * The persisted reading depth. Returns `{ depth, setDepth }`.
 *
 * Every storage touch is wrapped: private mode, a full quota or a corrupted
 * value degrades to Brief, never a thrown error and never a white screen.
 */
export function useReadingDepth() {
  const [depth, setDepthState] = useState(readDepth)

  useEffect(() => {
    writeDepth(depth)
  }, [depth])

  // Keep two open tabs of the briefing in step.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onStorage = (event) => {
      if (event.key !== DEPTH_STORAGE_KEY) return
      setDepthState(readDepth())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setDepth = useCallback((next) => {
    if (isDepth(next)) setDepthState(next)
  }, [])

  return useMemo(() => ({ depth, setDepth }), [depth, setDepth])
}

export default useReadingDepth

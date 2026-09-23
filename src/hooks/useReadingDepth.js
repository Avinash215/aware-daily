import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Reading depth — how much of each story the FEED CARDS show.
 *
 * The promise is "one finishable briefing", so the reader picks the length.
 * This module owns:
 *
 *   - the three modes and the persisted choice (`aware-daily:depth`)
 *   - `fullTextFor`, the complete opening/rest composition for Full mode
 *   - `estimateDepthMinutes`, the read-time payoff, measured from real data
 *
 * The reader is deliberately not involved: once someone taps into a story they
 * have committed, and that is not the moment to ration text.
 */

const DEPTH_STORAGE_KEY = 'aware-daily:depth'

/** Average adult reading speed for news prose. */
const WORDS_PER_MINUTE = 230

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
 * Compare the entire normalised dek, not a fixed-length shared prefix.
 * Only a trailing ellipsis may be removed: sentence punctuation must still
 * match, and an excerpt must end at a boundary rather than inside a word.
 */
function repeatsDek(paragraph, dek) {
  const dekPrint = fingerprint(dek).replace(/\.{3,}$/, '').trimEnd()
  if (!dekPrint) return false

  const opening = fingerprint(paragraph)
  return opening === dekPrint || (
    opening.startsWith(dekPrint) &&
    /^[\s.,!?;:)"'\]-]/.test(opening.slice(dekPrint.length))
  )
}

/**
 * The paragraphs following Full mode's composed opening. Delegate to the same
 * composition used by cards and estimates so the opening and rest cannot drift.
 */
export function bodyAfterDek(body, dek) {
  return fullTextFor(body, dek).rest
}

/**
 * What Full mode renders: `{ opening, rest }`.
 *
 * An absent dek or a teaser derived from paragraph one uses that complete
 * paragraph as the opening. A distinct standfirst keeps every body paragraph
 * beneath it. With no body, retain the supplied dek. Later repeated paragraphs
 * are reporting, not teasers, and are always preserved.
 */
export function fullTextFor(body, dek) {
  const paragraphs = paragraphsOf(body)
  const dekText = String(dek ?? '').trim()
  const first = paragraphs[0] ?? ''

  if (!dekText || repeatsDek(first, dekText)) {
    return { opening: first, rest: paragraphs.slice(1) }
  }

  return { opening: dekText, rest: paragraphs }
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

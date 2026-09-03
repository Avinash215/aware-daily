import { useCallback, useEffect, useMemo, useState } from 'react'
import { normaliseRecap } from '../lib/data.js'

/**
 * Saved recaps, persisted to localStorage under `aware-daily:saved-recaps`.
 *
 * The API mirrors `useSavedStories` on purpose, but the stored value does not:
 * that hook keeps ids, and `daily.json` is overwritten every day, so an id
 * saved today resolves to nothing tomorrow. A recap is self-contained by
 * contract, so this hook stores the **whole recap object**. A saved catch-up
 * therefore stays readable for as long as the browser keeps it, no matter how
 * many editions have rotated past.
 *
 * Every storage touch is wrapped: private browsing, a full quota or a corrupted
 * value must degrade to "nothing saved", never throw. Anything read back is put
 * through `normaliseRecap`, the same coercion the live edition gets, so an
 * object written by an older build can never reach the view malformed.
 *
 * Returns `{ savedRecaps, savedRecapIds, isSaved, toggleSave, clearAll }` where
 * `savedRecaps` is newest-first.
 */

const SAVED_RECAPS_KEY = 'aware-daily:saved-recaps'

/**
 * The stable cluster key. `id` is `recap-<slug>-<as_of>`, so the same running
 * story saved on two different days has two different ids but one slug.
 */
function clusterKeyOf(recap) {
  return recap.slug || recap.id
}

function sanitise(value) {
  if (!Array.isArray(value)) return []

  const seen = new Set()
  const list = []
  for (const entry of value) {
    const recap = normaliseRecap(entry)
    if (!recap || seen.has(recap.id)) continue
    seen.add(recap.id)
    list.push(recap)
  }
  return list
}

function readSaved() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = window.localStorage.getItem(SAVED_RECAPS_KEY)
    if (!raw) return []
    return sanitise(JSON.parse(raw))
  } catch {
    return []
  }
}

/**
 * Recaps are far larger than ids, so a full quota is a real outcome rather than
 * a theoretical one. Drop the oldest entries and try again instead of losing
 * the save the reader just made.
 */
function writeSaved(list) {
  if (typeof window === 'undefined' || !window.localStorage) return

  for (let size = list.length; size > 0; size -= 1) {
    try {
      window.localStorage.setItem(SAVED_RECAPS_KEY, JSON.stringify(list.slice(0, size)))
      return
    } catch {
      // Quota, or storage blocked entirely. Retry smaller, then give up
      // silently: saving stays in-memory for this session.
    }
  }

  try {
    window.localStorage.removeItem(SAVED_RECAPS_KEY)
  } catch {
    // Nothing further to do; the in-memory list is still correct.
  }
}

export function useSavedRecaps() {
  const [savedRecaps, setSavedRecaps] = useState(readSaved)

  useEffect(() => {
    writeSaved(savedRecaps)
  }, [savedRecaps])

  // Keep two open tabs of the briefing in step.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onStorage = (event) => {
      if (event.key !== SAVED_RECAPS_KEY) return
      setSavedRecaps(readSaved())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const savedRecapIds = useMemo(() => savedRecaps.map((recap) => recap.id), [savedRecaps])

  const savedLookup = useMemo(() => new Set(savedRecapIds), [savedRecapIds])

  const isSaved = useCallback((id) => savedLookup.has(id), [savedLookup])

  /**
   * Accepts a whole recap object to save, or a bare id to unsave. An id on its
   * own carries no content to store, so it can only ever remove.
   */
  const toggleSave = useCallback((entry) => {
    const incoming = typeof entry === 'string' ? null : normaliseRecap(entry)
    const id = typeof entry === 'string' ? entry.trim() : (incoming?.id ?? '')
    if (!id) return

    setSavedRecaps((current) => {
      const list = Array.isArray(current) ? current : []

      if (list.some((recap) => recap.id === id)) {
        return list.filter((recap) => recap.id !== id)
      }

      if (!incoming) return list

      // A recap deepens each day, so the copy in hand is the deepest one. Drop
      // any shallower snapshot of the same cluster saved from an older edition
      // rather than keeping both.
      const cluster = clusterKeyOf(incoming)
      return [incoming, ...list.filter((recap) => clusterKeyOf(recap) !== cluster)]
    })
  }, [])

  const clearAll = useCallback(() => {
    setSavedRecaps([])
  }, [])

  return useMemo(
    () => ({ savedRecaps, savedRecapIds, isSaved, toggleSave, clearAll }),
    [savedRecaps, savedRecapIds, isSaved, toggleSave, clearAll],
  )
}

export default useSavedRecaps

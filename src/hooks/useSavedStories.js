import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Saved-story ids, persisted to localStorage under `aware-daily:saved`.
 *
 * Every storage touch is wrapped: private browsing, a full quota or a
 * corrupted value must degrade to "nothing saved", never throw. A stored
 * value that is not an array of non-empty strings is discarded.
 *
 * Returns `{ savedIds, isSaved, toggleSave, clearAll }` where `savedIds` is
 * newest-first.
 */

const SAVED_KEY = 'aware-daily:saved'

function sanitise(value) {
  if (!Array.isArray(value)) return []

  const seen = new Set()
  const ids = []
  for (const entry of value) {
    const id = typeof entry === 'string' ? entry.trim() : ''
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

function readSaved() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = window.localStorage.getItem(SAVED_KEY)
    if (!raw) return []
    return sanitise(JSON.parse(raw))
  } catch {
    return []
  }
}

function writeSaved(ids) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
  } catch {
    // Storage is unavailable or full — saving stays in-memory for this session.
  }
}

export function useSavedStories() {
  const [savedIds, setSavedIds] = useState(readSaved)

  useEffect(() => {
    writeSaved(savedIds)
  }, [savedIds])

  // Keep two open tabs of the briefing in step.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onStorage = (event) => {
      if (event.key !== SAVED_KEY) return
      setSavedIds(readSaved())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const savedLookup = useMemo(() => new Set(savedIds), [savedIds])

  const isSaved = useCallback((id) => savedLookup.has(id), [savedLookup])

  const toggleSave = useCallback((id) => {
    const key = typeof id === 'string' ? id.trim() : ''
    if (!key) return

    setSavedIds((current) => {
      const list = Array.isArray(current) ? current : []
      return list.includes(key) ? list.filter((entry) => entry !== key) : [key, ...list]
    })
  }, [])

  const clearAll = useCallback(() => {
    setSavedIds([])
  }, [])

  return useMemo(
    () => ({ savedIds, isSaved, toggleSave, clearAll }),
    [savedIds, isSaved, toggleSave, clearAll],
  )
}

export default useSavedStories

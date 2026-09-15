import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createReadProgressStore, READ_STORAGE_KEY, sanitizeReadIds } from '../lib/readProgress.js'

export function useReadProgress(editionKey, stories) {
  const [store] = useState(() => createReadProgressStore(() => window.localStorage))
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const validIds = useMemo(() => [...new Set(stories.map((story) => story?.id)
    .filter((id) => typeof id === 'string' && id.length > 0))], [stories])
  const readStoryIds = useMemo(() => sanitizeReadIds(state.store[editionKey], validIds),
    [editionKey, state.store, validIds])
  const readLookup = useMemo(() => new Set(readStoryIds), [readStoryIds])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === READ_STORAGE_KEY || event.key === null) store.refresh()
    }
    window.addEventListener('storage', onStorage)
    store.refresh()
    return () => window.removeEventListener('storage', onStorage)
  }, [store])

  const toggleRead = useCallback((id) => {
    if (!validIds.includes(id)) return
    store.update(editionKey, validIds, (ids) =>
      ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id])
  }, [editionKey, store, validIds])
  const markAllRead = useCallback(() => store.update(editionKey, validIds, () => validIds),
    [editionKey, store, validIds])
  const resetRead = useCallback(() => store.update(editionKey, validIds, () => []),
    [editionKey, store, validIds])

  return { readStoryIds, readLookup, toggleRead, markAllRead, resetRead, storageMessage: state.message }
}

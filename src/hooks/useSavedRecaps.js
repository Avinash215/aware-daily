import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createSavedRecapStore, SAVED_RECAPS_KEY } from '../lib/savedRecaps.js'

export function useSavedRecaps() {
  const [store] = useState(() => createSavedRecapStore(() => window.localStorage))
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === SAVED_RECAPS_KEY || event.key === null) store.refresh()
    }
    window.addEventListener('storage', onStorage)
    store.refresh()
    return () => window.removeEventListener('storage', onStorage)
  }, [store])
  const savedRecapIds = useMemo(() => state.entries.map((entry) => entry.id), [state.entries])
  const lookup = useMemo(() => new Set(savedRecapIds), [savedRecapIds])
  const isSaved = useCallback((id) => lookup.has(id), [lookup])
  return {
    savedRecaps: state.entries, savedRecapIds, isSaved,
    toggleSave: store.toggle, clearAll: store.clear, retry: store.retry,
    storageMessage: state.message, hasPendingChanges: state.pending,
  }
}

export default useSavedRecaps

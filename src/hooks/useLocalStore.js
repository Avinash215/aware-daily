import { useEffect, useSyncExternalStore } from 'react'

/** Subscribes a component to one `createLocalStore` record, synced across tabs. */
export function useLocalStore(store) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === store.key || event.key === null) store.refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [store])

  return snapshot
}

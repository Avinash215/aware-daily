import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getCategory, getRecap, getStory, meta } from '../lib/data.js'
import { createSavedStoryStore, createStorySnapshot, LEGACY_SAVED_KEY, SAVED_STORIES_KEY, storyKey } from '../lib/savedStories.js'

export function snapshotForCurrentStory(id) {
  const story = getStory(id)
  return story ? createStorySnapshot(story, meta, getCategory(story.category), getRecap(story.recap_id)) : null
}

export function useSavedStories() {
  const [store] = useState(() => createSavedStoryStore(() => window.localStorage, snapshotForCurrentStory))
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  useEffect(() => {
    store.start()
    const onStorage = (event) => {
      if (event.key === SAVED_STORIES_KEY || event.key === LEGACY_SAVED_KEY || event.key === null) store.refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [store])

  const lookup = useMemo(() => new Set(state.entries.map((entry) => entry.key)), [state.entries])
  const isSaved = useCallback((id) => lookup.has(storyKey(id, meta)), [lookup])
  const isSnapshotSaved = useCallback((entry) => lookup.has(entry?.key), [lookup])
  const toggleSave = useCallback((id) => {
    const entry = snapshotForCurrentStory(id)
    if (entry) store.toggle(entry)
  }, [store])
  const savedIds = useMemo(() => state.entries.filter((entry) => entry.key === storyKey(entry.id, meta))
    .map((entry) => entry.id), [state.entries])

  return {
    savedIds, savedStories: state.entries, isSaved, isSnapshotSaved, toggleSave,
    toggleSnapshot: store.toggle, removeSnapshot: store.remove, clearAll: store.clear,
    storageMessage: state.message,
  }
}

export default useSavedStories

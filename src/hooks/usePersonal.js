import { useCallback, useMemo, useState } from 'react'
import { createLocalStore } from '../lib/localStore.js'
import { INVALID_QUIZ_RESULT, recordQuizResult, validQuizResult } from '../lib/quizResults.js'
import {
  emptyEntries,
  emptyPrefs,
  emptyQuiz,
  entryKey,
  sanitizeFollows,
  sanitizeLikes,
  sanitizePrefs,
  sanitizeQuiz,
  storySnapshot,
} from '../lib/personal.js'
import { useLocalStore } from './useLocalStore.js'

let stores = null

function personalStores() {
  if (!stores) {
    stores = {
      prefs: createLocalStore({ key: 'aware-daily:prefs', empty: emptyPrefs, sanitize: sanitizePrefs }),
      likes: createLocalStore({ key: 'aware-daily:likes', empty: emptyEntries, sanitize: sanitizeLikes, merge: 'entries' }),
      follows: createLocalStore({ key: 'aware-daily:follows', empty: emptyEntries, sanitize: sanitizeFollows, merge: 'entries' }),
      quiz: createLocalStore({ key: 'aware-daily:quiz', empty: emptyQuiz, sanitize: sanitizeQuiz, merge: 'editions' }),
    }
  }
  return stores
}

/**
 * Interests, location, likes (with private notes), follows and quiz scores.
 * All of it lives in this browser only.
 */
export function usePersonal(edition) {
  const { prefs: prefsStore, likes: likesStore, follows: followsStore, quiz: quizStore } = personalStores()
  const prefsState = useLocalStore(prefsStore)
  const likesState = useLocalStore(likesStore)
  const followsState = useLocalStore(followsStore)
  const quizState = useLocalStore(quizStore)
  const [quizError, setQuizError] = useState('')

  const prefs = prefsState.value
  const likes = likesState.value.entries
  const follows = followsState.value.entries

  const likeKeys = useMemo(() => new Set(likes.map((entry) => entry.key)), [likes])
  const followKeys = useMemo(() => new Set(follows.map((entry) => entry.key)), [follows])

  const updatePrefs = useCallback((patch) => {
    return prefsStore.update((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) }))
  }, [prefsStore])

  const isLiked = useCallback((id, storyEdition = edition) => likeKeys.has(entryKey(storyEdition, id)), [edition, likeKeys])
  const isFollowed = useCallback((id, storyEdition = edition) => followKeys.has(entryKey(storyEdition, id)), [edition, followKeys])

  const toggleLike = useCallback((story, category, storyEdition = edition) => {
    const snapshot = storySnapshot(story, category, storyEdition)
    if (!snapshot) return false
    return likesStore.update((current) => {
      const exists = current.entries.some((entry) => entry.key === snapshot.key)
      return {
        entries: exists
          ? current.entries.filter((entry) => entry.key !== snapshot.key)
          : [...current.entries, { ...snapshot, likedAt: Date.now(), note: '' }],
      }
    })
  }, [edition, likesStore])

  const removeLike = useCallback((key) => {
    return likesStore.update((current) => ({ entries: current.entries.filter((entry) => entry.key !== key) }))
  }, [likesStore])

  // Writing a note on a story you have not liked keeps it with a like, so the
  // note always has a home in the leaderboard and is never silently lost.
  const setNote = useCallback((story, category, note, storyEdition = edition) => {
    const snapshot = storySnapshot(story, category, storyEdition)
    if (!snapshot) return false
    return likesStore.update((current) => {
      const exists = current.entries.some((entry) => entry.key === snapshot.key)
      if (exists) {
        return { entries: current.entries.map((entry) => (entry.key === snapshot.key ? { ...entry, note } : entry)) }
      }
      if (!note.trim()) return current
      return { entries: [...current.entries, { ...snapshot, likedAt: Date.now(), note }] }
    })
  }, [edition, likesStore])

  const noteFor = useCallback((id, storyEdition = edition) => {
    const key = entryKey(storyEdition, id)
    return likes.find((entry) => entry.key === key)?.note || ''
  }, [edition, likes])

  const isNotePending = useCallback((id, storyEdition = edition) =>
    likesState.pendingKeys.includes(entryKey(storyEdition, id)), [edition, likesState.pendingKeys])
  const isNotePersisted = useCallback((id, storyEdition = edition) =>
    !likesState.message && !isNotePending(id, storyEdition), [edition, isNotePending, likesState.message])

  const toggleFollow = useCallback((story, category, storyEdition = edition) => {
    const snapshot = storySnapshot(story, category, storyEdition)
    if (!snapshot) return false
    return followsStore.update((current) => {
      const exists = current.entries.some((entry) => entry.key === snapshot.key)
      return {
        entries: exists
          ? current.entries.filter((entry) => entry.key !== snapshot.key)
          : [...current.entries, { ...snapshot, followedAt: Date.now() }],
      }
    })
  }, [edition, followsStore])

  const removeFollow = useCallback((key) => {
    return followsStore.update((current) => ({ entries: current.entries.filter((entry) => entry.key !== key) }))
  }, [followsStore])

  const recordQuiz = useCallback((score, total, attemptEdition = edition) => {
    if (!validQuizResult(score, total) || typeof attemptEdition !== 'string' ||
        !attemptEdition || attemptEdition.length > 40) {
      setQuizError(INVALID_QUIZ_RESULT)
      return false
    }
    setQuizError('')
    return quizStore.update((current) => {
      return {
        editions: {
          ...current.editions,
          [attemptEdition]: recordQuizResult(current.editions[attemptEdition], score, total, Date.now()),
        },
      }
    })
  }, [edition, quizStore])

  const retry = useCallback(() => {
    let attempted = false
    let succeeded = true
    for (const store of [prefsStore, likesStore, followsStore, quizStore]) {
      if (!store.getSnapshot().pending) continue
      attempted = true
      if (!store.retry()) succeeded = false
    }
    return attempted && succeeded
  }, [prefsStore, likesStore, followsStore, quizStore])

  const message = [prefsState.message, likesState.message, followsState.message, quizState.message, quizError]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(' ')

  return {
    prefs,
    updatePrefs,
    likes,
    isLiked,
    toggleLike,
    removeLike,
    setNote,
    noteFor,
    isNotePending,
    isNotePersisted,
    follows,
    isFollowed,
    toggleFollow,
    removeFollow,
    quizScore: quizState.value.editions[edition] || null,
    recordQuiz,
    message,
    retry,
    hasPendingChanges: prefsState.pending || likesState.pending || followsState.pending || quizState.pending,
  }
}

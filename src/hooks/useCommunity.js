import { useCallback, useEffect, useState } from 'react'
import { fetchMe, getStats, toggleLike as postLike } from '../lib/api.js'

const UNKNOWN = { checked: false, available: false, community: false, preview: false, localNews: false, signedIn: false, moderator: false, displayName: '', provider: '' }

/**
 * Who the reader is to the community API, and this edition's shared like and
 * comment counts. When the API is absent everything reports unavailable and
 * nothing is retried in a loop.
 */
export function useCommunity(edition) {
  const [me, setMe] = useState(UNKNOWN)
  const [stats, setStats] = useState({})
  const [mine, setMine] = useState(() => new Set())
  const [message, setMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let live = true
    fetchMe().then((result) => {
      if (live) setMe({ ...result, checked: true })
    })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (!me.community || !/^\d{4}-\d{2}-\d{2}$/.test(edition || '')) return undefined
    let live = true
    getStats(edition)
      .then((result) => {
        if (!live) return
        setStats(result.stats || {})
        setMine(new Set(result.mine || []))
      })
      .catch(() => {
        // Counts are decoration; the story and the reader's own likes still work.
      })
    return () => {
      live = false
    }
  }, [edition, me.community, refreshKey])

  const refreshStats = useCallback(() => setRefreshKey((value) => value + 1), [])

  const likeCount = useCallback((storyId, storyEdition = edition) => (storyEdition === edition ? stats[storyId]?.likes || 0 : null), [edition, stats])
  const commentCount = useCallback((storyId) => stats[storyId]?.comments || 0, [stats])
  const likedShared = useCallback((storyId, storyEdition = edition) => storyEdition === edition && mine.has(storyId), [edition, mine])

  /** Toggles the shared like; the caller keeps the private like in step. */
  const toggleShared = useCallback(async (story, category, storyEdition = edition) => {
    if (!me.community || !me.signedIn || !story?.id || !/^\d{4}-\d{2}-\d{2}$/.test(storyEdition || '')) return null
    setMessage('')
    try {
      const result = await postLike({
        edition: storyEdition,
        storyId: story.id,
        headline: story.headline || '',
        category: category?.label || story.category || '',
      })
      if (storyEdition === edition) {
        setStats((current) => ({ ...current, [story.id]: { ...(current[story.id] || { comments: 0 }), likes: result.likes } }))
        setMine((current) => {
          const next = new Set(current)
          if (result.liked) next.add(story.id)
          else next.delete(story.id)
          return next
        })
      }
      return result
    } catch {
      setMessage('Your like was saved in this browser, but the community count could not be updated.')
      return null
    }
  }, [edition, me.community, me.signedIn])

  const adjustComments = useCallback((storyId, delta) => {
    setStats((current) => ({ ...current, [storyId]: { likes: current[storyId]?.likes || 0, comments: Math.max(0, (current[storyId]?.comments || 0) + delta) } }))
  }, [])

  return { me, likeCount, commentCount, likedShared, toggleShared, refreshStats, adjustComments, message }
}

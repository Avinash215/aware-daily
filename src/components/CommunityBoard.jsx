import { useEffect, useState } from 'react'
import { getLeaderboard } from '../lib/api.js'
import { formatDate } from '../lib/format.js'

/**
 * The shared leaderboard: stories readers liked most over the last week.
 * Stories from the loaded edition open in the reader; older ones are listed
 * with their edition date.
 */
export default function CommunityBoard({ today, isInEdition, onOpenStory, refreshKey = 0 }) {
  const [state, setState] = useState({ status: 'loading', stories: [] })

  useEffect(() => {
    let live = true
    getLeaderboard(7, today)
      .then((result) => live && setState({ status: 'ready', stories: result.stories || [] }))
      .catch(() => live && setState({ status: 'error', stories: [] }))
    return () => {
      live = false
    }
  }, [today, refreshKey])

  if (state.status === 'loading') return <p className="mt-3 mb-0 text-meta text-text-muted">Loading readers’ picks…</p>
  if (state.status === 'error') return <p className="mt-3 mb-0 text-meta text-text-muted">Readers’ picks could not be loaded right now.</p>
  if (!state.stories.length) {
    return <p className="mt-3 mb-0 text-meta text-text-muted">No reader likes yet this week. Sign in and like a story to start the board.</p>
  }

  return (
    <ol className="mt-2 mb-0 list-none p-0">
      {state.stories.map((story, index) => {
        const openable = story.edition === today && isInEdition?.(story.storyId)
        const meta = [
          `${story.likes} ${story.likes === 1 ? 'like' : 'likes'}`,
          story.comments ? `${story.comments} ${story.comments === 1 ? 'comment' : 'comments'}` : '',
          story.edition !== today ? formatDate(story.edition) || story.edition : '',
        ].filter(Boolean).join(' · ')
        return (
          <li key={`${story.edition}|${story.storyId}`} className="flex items-start gap-3 border-b border-border-subtle py-3 last:border-b-0">
            <span className="w-6 shrink-0 pt-0.5 text-right font-display text-[19px] leading-6 font-semibold tabular-nums text-text-muted">
              {index + 1}
            </span>
            <div className="min-w-0">
              {openable ? (
                <button
                  type="button"
                  onClick={(event) => onOpenStory?.(story.storyId, event.currentTarget)}
                  className="block cursor-pointer border-0 bg-transparent p-0 text-left font-display text-[15px] leading-5 font-semibold text-text-primary hover:underline lg:text-row-lg"
                >
                  {story.headline}
                </button>
              ) : (
                <p className="m-0 font-display text-[15px] leading-5 font-semibold text-text-primary lg:text-row-lg">{story.headline}</p>
              )}
              <p className="mt-1 mb-0 text-[11px] leading-4 text-text-muted">{[story.category, meta].filter(Boolean).join(' · ')}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

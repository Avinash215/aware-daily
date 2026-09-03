import { useEffect, useState } from 'react'
import SaveButton from './SaveButton.jsx'
import { readTime } from '../lib/format.js'

/**
 * The Saved tab.
 *
 * Rows use the same visual language as the feed: chip, serif headline,
 * two-line dek, one clamped `so_what`, meta. Everything is defensive — a
 * malformed entry is skipped rather than thrown.
 */

const ACCENT_KEYS = new Set([
  'geopolitics',
  'business',
  'technology',
  'science',
  'climate',
  'health',
  'sports',
  'culture',
])

function chipStyle(categoryKey) {
  if (ACCENT_KEYS.has(categoryKey)) {
    return {
      color: `var(--accent-${categoryKey})`,
      backgroundColor: `var(--accent-${categoryKey}-light)`,
    }
  }
  return { color: 'var(--text-secondary)', backgroundColor: 'var(--surface-muted)' }
}

const clampLines = (lines) => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: lines,
  overflow: 'hidden',
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `'2026-09-03'` to `'3 Sep 2026'`. Anything else comes back untouched. */
function compactDate(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!parts) return text

  const month = MONTHS[Number(parts[2]) - 1]
  const day = Number(parts[3])
  if (!month || !day) return text

  return `${day} ${month} ${parts[1]}`
}

/** The label above a group. A named region, so the heading levels stay intact. */
function GroupLabel({ children }) {
  return (
    <p className="mt-4 mb-0 text-caption font-semibold tracking-wide text-text-muted uppercase">
      {children}
    </p>
  )
}

/**
 * A saved catch-up. Unlike a saved story it is not a pointer into today's
 * edition: the whole recap was stored when it was saved, so this row and the
 * view behind it keep working after the briefing rotates.
 */
function SavedRecapRow({ recap, onOpenRecap, onToggleSaveRecap }) {
  if (!recap || typeof recap !== 'object' || !recap.id) return null

  const title = typeof recap.title === 'string' ? recap.title.trim() : ''
  const orient = typeof recap.orient === 'string' ? recap.orient.trim() : ''
  const days = Number.isFinite(recap.days_covered) ? Math.max(0, Math.floor(recap.days_covered)) : 0
  const asOf = compactDate(recap.as_of)
  const sourceCount = Array.isArray(recap.sources) ? recap.sources.length : 0
  const confidence = typeof recap.confidence === 'string' ? recap.confidence.trim() : ''

  const meta = [
    days ? `${days} ${days === 1 ? 'day' : 'days'} of coverage` : '',
    asOf ? `current to ${asOf}` : '',
    sourceCount ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}` : '',
  ].filter(Boolean)

  return (
    <li className="border-b border-border-subtle last:border-b-0">
      <div className="flex items-start gap-2 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="rounded-full px-2 py-0.5 text-caption font-semibold tracking-wide uppercase"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-muted)' }}
            >
              Catch-up
            </span>
            {confidence && confidence !== 'confirmed' ? (
              <span className="text-caption font-medium text-text-muted">
                Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
              </span>
            ) : null}
          </div>

          <h3 className="mt-1.5 font-display text-row font-semibold lg:text-row-lg">
            <button
              type="button"
              onClick={() => onOpenRecap?.(recap)}
              className="cursor-pointer text-left text-text-primary hover:underline"
            >
              {title || 'Untitled catch-up'}
            </button>
          </h3>

          {orient ? (
            <p className="mt-1 text-dek text-text-secondary lg:text-dek-lg" style={clampLines(2)}>
              {orient}
            </p>
          ) : null}

          {meta.length ? (
            <p className="mt-1.5 text-caption text-text-muted">{meta.join(' · ')}</p>
          ) : null}
        </div>

        <SaveButton saved onToggle={() => onToggleSaveRecap?.(recap.id)} size="md" />
      </div>
    </li>
  )
}

function SavedRow({ story, categoryLabel, onOpenStory, onToggleSave }) {
  if (!story || typeof story !== 'object' || !story.id) return null

  const headline = story.headline || 'Untitled story'
  const label = categoryLabel || story.category || 'Briefing'
  const minutes = readTime(story.read_time_min)
  const sourceCount = Number.isFinite(story.source_count) ? story.source_count : 0
  const meta = [
    minutes,
    sourceCount ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}` : '',
  ].filter(Boolean)

  return (
    <li className="border-b border-border-subtle last:border-b-0">
      <div className="flex items-start gap-2 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="rounded-full px-2 py-0.5 text-caption font-semibold tracking-wide uppercase"
              style={chipStyle(story.category)}
            >
              {label}
            </span>
            {story.region ? (
              <span className="text-caption font-medium text-text-muted">{story.region}</span>
            ) : null}
          </div>

          <h3 className="mt-1.5 font-display text-row font-semibold lg:text-row-lg">
            <button
              type="button"
              onClick={(event) => onOpenStory?.(story.id, event.currentTarget)}
              className="cursor-pointer text-left text-text-primary hover:underline"
            >
              {headline}
            </button>
          </h3>

          {story.dek ? (
            <p className="mt-1 text-dek text-text-secondary lg:text-dek-lg" style={clampLines(2)}>
              {story.dek}
            </p>
          ) : null}

          {story.so_what ? (
            <p
              className="mt-1 text-sowhat font-medium text-text-secondary lg:text-sowhat-lg"
              style={clampLines(1)}
            >
              {story.so_what}
            </p>
          ) : null}

          {meta.length ? (
            <p className="mt-1.5 text-caption text-text-muted">{meta.join(' · ')}</p>
          ) : null}
        </div>

        <SaveButton saved onToggle={() => onToggleSave?.(story.id)} size="md" />
      </div>
    </li>
  )
}

export default function SavedPage({
  stories = [],
  recaps = [],
  categories = [],
  onOpenStory,
  onOpenRecap,
  onToggleSave,
  onToggleSaveRecap,
  onClearAll,
  onBrowse,
}) {
  const [confirmingClear, setConfirmingClear] = useState(false)
  const list = Array.isArray(stories) ? stories.filter((story) => story && story.id) : []
  const recapList = Array.isArray(recaps) ? recaps.filter((recap) => recap && recap.id) : []
  const total = list.length + recapList.length
  const labels = new Map(
    (Array.isArray(categories) ? categories : []).map((category) => [category.key, category.label]),
  )

  useEffect(() => {
    if (!confirmingClear) return undefined
    const timer = setTimeout(() => setConfirmingClear(false), 4000)
    return () => clearTimeout(timer)
  }, [confirmingClear])

  const showConfirm = confirmingClear && total > 0

  const handleClear = () => {
    if (!showConfirm) {
      setConfirmingClear(true)
      return
    }
    setConfirmingClear(false)
    onClearAll?.()
  }

  const counts = [
    list.length ? `${list.length} ${list.length === 1 ? 'story' : 'stories'}` : '',
    recapList.length ? `${recapList.length} ${recapList.length === 1 ? 'catch-up' : 'catch-ups'}` : '',
  ].filter(Boolean)

  const storyRows = (
    <ul className="mt-2 mb-0 list-none p-0">
      {list.map((story) => (
        <SavedRow
          key={story.id}
          story={story}
          categoryLabel={labels.get(story.category)}
          onOpenStory={onOpenStory}
          onToggleSave={onToggleSave}
        />
      ))}
    </ul>
  )

  return (
    <section aria-labelledby="saved-heading" className="pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="saved-heading" className="font-display text-lead font-semibold text-text-primary">
          Saved
        </h2>
        {total ? (
          <div className="flex items-center gap-3">
            <p className="text-meta text-text-muted">{counts.join(' · ')}</p>
            <button
              type="button"
              onClick={handleClear}
              aria-live="polite"
              className="min-h-11 cursor-pointer rounded-full border border-border px-3 py-1.5 text-meta font-semibold text-text-secondary transition-colors duration-150 hover:bg-surface-muted hover:text-text-primary motion-reduce:transition-none"
            >
              {showConfirm ? 'Tap again to clear' : 'Clear all'}
            </button>
          </div>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-card p-6 text-center">
          <p className="font-display text-row font-semibold text-text-primary lg:text-row-lg">
            Nothing saved yet
          </p>
          <p className="mx-auto mt-2 max-w-[46ch] text-dek text-text-secondary lg:text-dek-lg">
            Tap the bookmark on any story in Today to keep it here. Saved stories stay on this
            device — nothing is sent anywhere.
          </p>
          <button
            type="button"
            onClick={() => onBrowse?.('today')}
            className="mt-4 min-h-11 cursor-pointer rounded-full border border-border bg-surface px-5 py-2.5 text-meta font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none"
          >
            Browse today&rsquo;s briefing
          </button>
        </div>
      ) : null}

      {/*
        With no saved catch-ups this is the list exactly as it has always been:
        no group labels, no second section, nothing new on screen.
      */}
      {total > 0 && recapList.length === 0 ? storyRows : null}

      {recapList.length > 0 ? (
        <>
          <section aria-label="Saved catch-ups">
            <GroupLabel>Catch-ups</GroupLabel>
            <p className="mt-1 mb-0 text-caption text-text-muted">
              Each one keeps its own copy, so it stays readable after the briefing rotates.
            </p>
            <ul className="mt-2 mb-0 list-none p-0">
              {recapList.map((recap) => (
                <SavedRecapRow
                  key={recap.id}
                  recap={recap}
                  onOpenRecap={onOpenRecap}
                  onToggleSaveRecap={onToggleSaveRecap}
                />
              ))}
            </ul>
          </section>

          <section aria-label="Saved stories">
            <GroupLabel>Stories</GroupLabel>
            {list.length ? (
              storyRows
            ) : (
              <p className="mt-2 mb-0 max-w-[46ch] text-dek text-text-secondary lg:text-dek-lg">
                No stories saved. Tap the bookmark on any story in Today to keep it here. A saved
                story is a pointer into that day&rsquo;s briefing, so it drops off this list once
                the edition rotates.
              </p>
            )}
          </section>
        </>
      ) : null}
    </section>
  )
}

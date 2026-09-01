import { useMemo } from 'react'

export default function ProgressRail({
  categories = [],
  totalStories = 0,
  readStoryIds = [],
  onMarkAllRead,
  onResetRead,
}) {
  const readCount = readStoryIds.length
  const sectionStats = useMemo(() => {
    const total = categories.length
    const readSet = new Set(readStoryIds)
    const complete = categories.reduce((done, category) => {
      const stories = Array.isArray(category.stories) ? category.stories : []
      if (!stories.length) return done
      return stories.every((story) => readSet.has(story.id)) ? done + 1 : done
    }, 0)
    return { total, complete }
  }, [categories, readStoryIds])

  const progress = totalStories > 0 ? Math.min(100, Math.round((readCount / totalStories) * 100)) : 0

  return (
    <section className="mb-8 rounded-full border border-border bg-surface-raised p-3" aria-label="Reading progress">
      <p aria-live="polite" className="m-0 text-[13px] leading-[18px] font-medium text-text-secondary">
        {readCount} of {totalStories} stories read · {sectionStats.complete} of {sectionStats.total} sections
        complete.
      </p>
      <p className="mt-1 mb-0 text-[13px] leading-[18px] text-text-tertiary">Saved on this device.</p>
      <div
        role="progressbar"
        aria-label="Stories marked read"
        aria-valuemin={0}
        aria-valuemax={Math.max(totalStories, 1)}
        aria-valuenow={Math.min(readCount, totalStories)}
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken"
      >
        <span
          className="block h-full bg-text-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={readCount < totalStories ? onMarkAllRead : onResetRead}
          className="min-h-11 cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-[15px] leading-5 font-semibold text-text-primary transition-colors hover:bg-surface-sunken motion-reduce:transition-none"
        >
          {readCount < totalStories ? 'Mark all read' : 'Reset today'}
        </button>
        {readCount > 0 && readCount < totalStories ? (
          <button
            type="button"
            onClick={onResetRead}
            className="min-h-11 cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-[15px] leading-5 font-semibold text-text-secondary transition-colors hover:bg-surface-sunken motion-reduce:transition-none"
          >
            Reset progress
          </button>
        ) : null}
      </div>
    </section>
  )
}

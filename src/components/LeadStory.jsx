import { useMemo, useState } from 'react'
import { clamp, readTime } from '../lib/format.js'
import SaveButton from './SaveButton.jsx'

function clampLines(lines) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
}

function tintBackground(accent) {
  return `color-mix(in oklab, var(${accent}) 14%, var(--surface-raised))`
}

export default function LeadStory({ story, category, isSaved = false, onToggleSave, onOpenStory }) {
  const [imageHidden, setImageHidden] = useState(false)

  const accent = category?.accent || '--text-primary'
  const hasImage = useMemo(() => Boolean(String(story?.image || '').trim()) && !imageHidden, [imageHidden, story?.image])

  if (!story) return null

  const sourceCount = story.source_count || (Array.isArray(story.sources) ? story.sources.length : 0)
  const readLabel = readTime(story.read_time_min)

  return (
    <article
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface-raised)',
        boxShadow: '0 1px 2px color-mix(in srgb, var(--text-primary) 12%, transparent)',
      }}
      aria-labelledby={`lead-headline-${story.id}`}
    >
      <div className="relative">
        {hasImage ? (
          <img
            src={story.image}
            alt=""
            className="h-40 w-full object-cover md:h-56"
            onError={() => setImageHidden(true)}
          />
        ) : (
          <div className="flex h-40 w-full items-end p-4 md:h-56" style={{ backgroundColor: tintBackground(accent) }} aria-hidden="true">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: `var(${accent})` }}>
              {category?.label || story.category || 'Top story'}
            </span>
          </div>
        )}

        <SaveButton
          saved={isSaved}
          onToggle={() => onToggleSave?.(story.id)}
          size="md"
          className="absolute right-3 top-3 bg-surface-raised/90 backdrop-blur-[1px]"
        />
      </div>

      <div className="p-3.5">
        <h3
          id={`lead-headline-${story.id}`}
          className="m-0 text-[20px] font-semibold leading-[1.15] md:text-[26px]"
          style={{
            color: 'var(--text-primary)',
            fontFamily: "'Newsreader', Georgia, serif",
          }}
        >
          <button
            type="button"
            onClick={(event) => onOpenStory?.(story.id, event.currentTarget)}
            className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left leading-[1.15]"
            style={clampLines(3)}
          >
            {story.headline || 'Untitled story'}
          </button>
        </h3>

        {story.dek ? (
          <p className="mt-1 mb-0 text-[13px] leading-[1.3] md:text-[14px]" style={{ ...clampLines(2), color: 'var(--text-secondary)' }}>
            {clamp(story.dek, 220)}
          </p>
        ) : null}

        {story.so_what ? (
          <p className="mt-1 mb-0 text-[13px] leading-[1.2] md:text-[14px]" style={{ ...clampLines(1), color: 'var(--text-secondary)' }}>
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: `var(${accent})` }}>
              SO WHAT
            </span>
            {story.so_what}
          </p>
        ) : null}

        <div className="mt-1 flex items-center gap-x-3 text-[11px] leading-[1]" style={{ color: 'var(--text-tertiary)' }}>
          {readLabel ? <span>{readLabel}</span> : null}
          <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
        </div>
      </div>
    </article>
  )
}
import { useMemo, useState } from 'react'
import { clamp, readTime } from '../lib/format.js'
import { DEFAULT_DEPTH, fullTextFor } from '../hooks/useReadingDepth.js'
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
  if (typeof accent === 'string' && accent.startsWith('--accent-')) {
    return `var(${accent}-light, var(--surface-raised))`
  }
  return 'var(--surface-raised)'
}

export default function LeadStory({
  story,
  category,
  isSaved = false,
  onToggleSave,
  onOpenStory,
  depth = DEFAULT_DEPTH,
}) {
  const [imageHidden, setImageHidden] = useState(false)

  const accent = category?.accent || '--text-primary'
  const hasImage = useMemo(() => Boolean(String(story?.image || '').trim()) && !imageHidden, [imageHidden, story?.image])
  // Full swaps the dek — a teaser the exporter cuts mid-clause — for the whole
  // paragraph it was cut from, then picks the reporting up at paragraph two.
  const fullText = useMemo(
    () => (depth === 'full' ? fullTextFor(story?.body, story?.dek) : { opening: '', rest: [] }),
    [depth, story?.body, story?.dek],
  )

  if (!story) return null

  const sourceCount = story.source_count || (Array.isArray(story.sources) ? story.sources.length : 0)
  const readLabel = readTime(story.read_time_min)
  const showContext = depth !== 'skim'
  const isFull = depth === 'full'
  const bodyParagraphs = fullText.rest
  const leadText = isFull ? fullText.opening : clamp(story.dek, 220)

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
          className="absolute right-3 top-3 bg-surface-raised/90 backdrop-blur-[1px] [scroll-margin-top:5.5rem]"
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
            className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left leading-[1.15] [scroll-margin-top:5.5rem]"
            style={clampLines(3)}
          >
            {story.headline || 'Untitled story'}
          </button>
        </h3>

        {showContext && leadText ? (
          <p
            className={`mt-1 mb-0 text-[13px] md:text-[14px] ${isFull ? 'leading-[1.5]' : 'leading-[1.3]'}`}
            style={isFull ? { color: 'var(--text-secondary)' } : { ...clampLines(2), color: 'var(--text-secondary)' }}
          >
            {leadText}
          </p>
        ) : null}

        {showContext && story.so_what ? (
          <p
            className={`mt-1 mb-0 text-[13px] md:text-[14px] ${isFull ? 'leading-[1.5]' : 'leading-[1.2]'}`}
            style={isFull ? { color: 'var(--text-secondary)' } : { ...clampLines(1), color: 'var(--text-secondary)' }}
          >
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: `var(${accent})` }}>
              SO WHAT
            </span>
            {story.so_what}
          </p>
        ) : null}

        {bodyParagraphs.length ? (
          <div
            className="mt-2 mb-0 space-y-2 text-[13px] leading-[1.5] md:text-[14px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {bodyParagraphs.map((paragraph, index) => (
              <p key={index} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        <div
          className={`${bodyParagraphs.length ? 'mt-2.5' : 'mt-1'} flex items-center gap-x-3 text-[11px] leading-[1]`}
          style={{ color: 'var(--text-tertiary)' }}
        >
          {readLabel ? <span>{readLabel}</span> : null}
          {sourceCount > 0 ? <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span> : null}
        </div>
      </div>
    </article>
  )
}
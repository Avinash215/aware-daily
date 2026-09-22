import { useId, useMemo, useState } from 'react'
import { clamp, readTime } from '../lib/format.js'
import { DEFAULT_DEPTH, fullTextFor } from '../hooks/useReadingDepth.js'
import SaveButton from './SaveButton.jsx'
import ReadButton from './ReadButton.jsx'

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

// Fixed heights keep the card's geometry stable whether the photo loads,
// fails or is still deferred. The side-by-side section layout fills its grid
// cell instead, so the text column decides the height there.
const IMAGE_SIZE = {
  front: 'h-44 sm:h-60 lg:h-72',
  section: 'h-40 md:h-56 lg:absolute lg:inset-0 lg:h-full',
}

function LeadImage({ imageUrl, accent, label, loading, variant }) {
  const [failed, setFailed] = useState(false)
  const size = IMAGE_SIZE[variant] || IMAGE_SIZE.section

  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt=""
      loading={loading}
      className={`${size} w-full object-cover`}
      style={{ backgroundColor: tintBackground(accent) }}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`${size} flex w-full items-end p-4`} style={{ backgroundColor: tintBackground(accent) }} aria-hidden="true">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: `var(${accent})` }}>
        {label}
      </span>
    </div>
  )
}

/**
 * The lead story of a section.
 *
 * `front` is the edition's opening story: a full-width photograph and the
 * largest headline on the page, so the first screen has one focal point.
 * `section` leads stack on small screens and sit image-left, text-right from
 * `lg`, which keeps each section's opening compact and its line length short.
 */
export default function LeadStory({
  story,
  category,
  isSaved = false,
  onToggleSave,
  isRead = false,
  onToggleRead,
  onOpenStory,
  depth = DEFAULT_DEPTH,
  imageLoading = 'eager',
  variant = 'section',
}) {
  const headlineId = useId()
  const accent = category?.accent || '--text-primary'
  const imageUrl = typeof story?.image === 'string' ? story.image.trim() : ''
  // Full swaps the dek, a teaser the exporter cuts mid-clause, for the whole
  // paragraph it was cut from, then picks the reporting up at paragraph two.
  const fullText = useMemo(
    () => (depth === 'full' ? fullTextFor(story?.body, story?.dek) : { opening: '', rest: [] }),
    [depth, story?.body, story?.dek],
  )

  if (!story) return null

  const isFront = variant === 'front'
  const sourceCount = story.source_count || (Array.isArray(story.sources) ? story.sources.length : 0)
  const readLabel = readTime(story.read_time_min)
  const metaParts = [readLabel, sourceCount > 0 ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}` : '']
    .filter(Boolean)
  const region = typeof story.region === 'string' ? story.region.trim() : ''
  const showContext = depth !== 'skim'
  const isFull = depth === 'full'
  const bodyParagraphs = fullText.rest
  const leadText = isFull ? fullText.opening : clamp(story.dek, 220)
  const bodyTone = isRead ? 'var(--text-muted)' : 'var(--text-secondary)'

  const headlineSize = isFront
    ? 'text-[22px] leading-[1.15] sm:text-[26px] lg:text-[32px] lg:leading-[1.12]'
    : 'text-lead leading-[1.15] lg:text-lead-lg lg:leading-[1.2]'

  return (
    <article
      className={`overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-[var(--shadow-card)] ${
        isFront ? '' : 'lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'
      }`}
      aria-labelledby={headlineId}
    >
      <div className={`relative ${isFront ? '' : isFull ? 'lg:h-72 lg:self-start' : showContext ? 'lg:min-h-[15rem]' : 'lg:min-h-[9rem]'}`}>
        <LeadImage
          key={JSON.stringify([story.id, imageUrl])}
          imageUrl={imageUrl}
          accent={accent}
          label={category?.label || story.category || 'Top story'}
          loading={imageLoading}
          variant={isFront ? 'front' : 'section'}
        />

        <SaveButton
          saved={isSaved}
          onToggle={() => onToggleSave?.(story.id)}
          size="md"
          className="absolute right-3 top-3 bg-surface-raised/90 backdrop-blur-[1px] [scroll-margin-top:5.5rem]"
        />
      </div>

      <div className={`flex min-w-0 flex-col p-4 ${isFront ? 'sm:px-5 sm:pb-4 lg:px-6 lg:pt-5' : 'lg:px-5 lg:py-4'}`}>
        {region ? (
          <p
            className="m-0 mb-1.5 text-[11px] leading-4 font-semibold uppercase tracking-[0.08em]"
            style={{ color: `var(${accent})` }}
          >
            {region}
          </p>
        ) : null}

        <h3
          id={headlineId}
          className={`m-0 font-semibold ${headlineSize} ${isFront ? 'lg:max-w-[46rem]' : ''}`}
          style={{
            color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <button
            type="button"
            onClick={(event) => onOpenStory?.(story.id, event.currentTarget)}
            className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left [line-height:inherit] hover:underline hover:decoration-1 hover:underline-offset-4 [scroll-margin-top:5.5rem]"
            style={clampLines(3)}
          >
            {story.headline?.trim() ? story.headline : 'Untitled story'}
          </button>
        </h3>

        {showContext && leadText ? (
          <p
            className={`mt-1.5 mb-0 text-dek lg:text-dek-lg ${isFull ? 'leading-[1.5]' : 'line-clamp-2 leading-[1.45]'} ${
              isFront ? 'lg:max-w-[42rem] lg:text-[15px]' : ''
            }`}
            style={{ color: bodyTone }}
          >
            {leadText}
          </p>
        ) : null}

        {showContext && story.so_what ? (
          <p
            className={`mt-1.5 mb-0 text-sowhat font-medium lg:text-sowhat-lg ${isFull ? 'leading-[1.5]' : 'line-clamp-2 leading-[1.45]'} ${
              isFront ? 'lg:max-w-[42rem]' : ''
            }`}
            style={{ color: bodyTone }}
          >
            <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: `var(${accent})` }}>
              SO WHAT
            </span>
            {story.so_what}
          </p>
        ) : null}

        {bodyParagraphs.length ? (
          <div
            className={`mt-2 mb-0 flex flex-col gap-2 text-dek leading-[1.5] lg:text-dek-lg ${isFront ? 'lg:max-w-[42rem]' : ''}`}
            style={{ color: bodyTone }}
          >
            {bodyParagraphs.map((paragraph, index) => (
              <p key={index} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex min-h-5 items-center justify-between gap-3 pt-3">
          <span className="text-[11px] leading-4 text-text-muted">{metaParts.join(' · ')}</span>
          {onToggleRead ? (
            <ReadButton
              variant="inline"
              read={isRead}
              headline={story.headline}
              onToggle={() => onToggleRead(story.id)}
              className="shrink-0"
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}

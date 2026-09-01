import { useCallback, useEffect, useRef, useState } from 'react'
import ConsequenceMeter from './ConsequenceMeter.jsx'
import SourceList from './SourceList.jsx'
import StakesCallout from './StakesCallout.jsx'
import { formatDate, readTime } from '../lib/format.js'

/**
 * The focused story reader.
 *
 * Content order follows the research brief §5.2: back control, position,
 * category / region / country geography, headline, source count, the complete
 * reporting, So what, conditional What now, the full provenance block, then
 * topics. Body copy is the one place in the app set as a newspaper column:
 * 17/27px on mobile, 18/29px above 40rem, capped at 66ch (§4.2, evidence 10).
 *
 * Props are fixed by the app shell: { story, category, onClose }.
 */

const ACCENT_KEYS = [
  'geopolitics',
  'business',
  'technology',
  'science',
  'climate',
  'health',
  'sports',
  'culture',
]

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'summary',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function accentVarFor(category, story) {
  const declared = typeof category?.accent === 'string' ? category.accent.trim() : ''
  if (/^--[a-z0-9-]+$/i.test(declared)) return declared

  const key = typeof story?.category === 'string' ? story.category.trim().toLowerCase() : ''
  return ACCENT_KEYS.includes(key) ? `--accent-${key}` : '--text-primary'
}

function paragraphsOf(body) {
  return String(body ?? '')
    .split(/\r?\n+/)
    .map((para) => para.trim())
    .filter(Boolean)
}

function sentenceCase(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** `Published at page_two…` is production metadata; soften the snake_case. */
function readable(value) {
  return String(value ?? '')
    .trim()
    .replace(/([a-z0-9])_([a-z0-9])/gi, '$1 $2')
}

export default function StoryReader({ story, category, onClose }) {
  if (!story || typeof story !== 'object' || Array.isArray(story)) return null
  return <Reader story={story} category={category} onClose={onClose} />
}

function Reader({ story, category, onClose }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const [visible, setVisible] = useState(false)

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') onClose()
  }, [onClose])

  // Focus moves to the close control on open and returns to the opener on close.
  useEffect(() => {
    const previous = document.activeElement
    closeRef.current?.focus()

    return () => {
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus()
    }
  }, [])

  // The briefing behind the overlay must not scroll with it.
  useEffect(() => {
    const { body } = document
    const previous = body.style.overflow
    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previous
    }
  }, [])

  // Escape closes; Tab is trapped inside the dialog.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
        return
      }

      if (event.key !== 'Tab') return

      const node = dialogRef.current
      if (!node) return

      const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0,
      )

      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      const inside = node.contains(active)

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [handleClose])

  // Reader entry is an opacity fade only, and none at all under reduced motion.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const accent = `var(${accentVarFor(category, story)})`

  const categoryLabel = sentenceCase(category?.label || story.category)
  const rank = typeof story.rank === 'number' && Number.isFinite(story.rank) ? story.rank : null
  const total = typeof category?.count === 'number' && category.count > 0 ? category.count : null
  const position = rank && total && rank <= total ? `Story ${rank} of ${total}` : null

  const dateLabel = formatDate(story.date)
  const minutes = readTime(story.read_time_min)

  const sources = Array.isArray(story.sources) ? story.sources : []
  const sourceLabel = sources.length
    ? `Based on ${sources.length} named ${sources.length === 1 ? 'source' : 'sources'}`
    : ''

  const paragraphs = paragraphsOf(story.body)
  const countries = (Array.isArray(story.countries) ? story.countries : []).filter(
    (country) => country && typeof country === 'object' && (country.name || country.flag),
  )
  const topics = (Array.isArray(story.topics) ? story.topics : [])
    .map((topic) => (typeof topic === 'string' ? topic.trim() : ''))
    .filter(Boolean)

  const whyRanked = readable(story.why_ranked)
  const hasConsequence =
    story.consequence && typeof story.consequence === 'object' && !Array.isArray(story.consequence)
  const hasRankingDetail = Boolean(whyRanked) || hasConsequence

  const hasDateline = Boolean(dateLabel || minutes || sourceLabel)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-reader-headline"
      style={{ '--story-accent': accent }}
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-surface transition-opacity duration-150 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <a
        href="#story-reader-body"
        className="absolute top-3 left-3 z-30 inline-flex min-h-[44px] -translate-y-[300%] items-center rounded-lg border border-border bg-surface-raised px-4 py-3 text-[0.9375rem] leading-[1.25rem] font-semibold text-text-primary focus:translate-y-0"
      >
        Skip to the reporting
      </a>

      <header
        className="sticky top-0 z-20 border-b border-border bg-surface"
        style={{ boxShadow: `inset 0 3px 0 0 ${accent}` }}
      >
        <div className="mx-auto flex w-full max-w-[760px] items-center px-4 py-2 sm:px-6 lg:px-8">
          <button
            type="button"
            ref={closeRef}
            onClick={handleClose}
            className="-ml-2 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-[0.9375rem] leading-[1.25rem] font-semibold text-text-primary"
          >
            <span aria-hidden="true">←</span>
            Back to today’s briefing
          </button>
        </div>
      </header>

      <article className="mx-auto w-full max-w-[760px] px-4 pt-6 pb-20 sm:px-6 lg:px-8">
        <p
          className="m-0 text-[0.75rem] leading-[1rem] font-bold tracking-[0.08em] uppercase"
          style={{ color: accent }}
        >
          {category?.emoji ? (
            <span aria-hidden="true" className="mr-1">
              {category.emoji}
            </span>
          ) : null}
          {categoryLabel || 'Today’s briefing'}
          {position ? <span className="text-text-tertiary"> · {position}</span> : null}
        </p>

        {story.region || countries.length > 0 ? (
          <p className="mt-2 mb-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] leading-[1.125rem] font-medium tracking-[0.01em] text-text-secondary">
            {story.region ? (
              <span>
                <span className="text-text-tertiary">Region: </span>
                {story.region}
              </span>
            ) : null}
            {countries.map((country, index) => (
              <span key={`${country.name || 'country'}-${index}`} className="inline-flex gap-1">
                {country.flag ? <span aria-hidden="true">{country.flag}</span> : null}
                <span>{country.name || 'Unnamed country'}</span>
                {country.role ? <span className="text-text-tertiary">({country.role})</span> : null}
              </span>
            ))}
          </p>
        ) : null}

        <h1
          id="story-reader-headline"
          className="mt-3 mb-0 max-w-[24ch] font-display text-[2.375rem] leading-[2.625rem] font-bold tracking-[-0.025em] text-text-primary sm:max-w-[20ch] sm:text-[3rem] sm:leading-[3.125rem]"
        >
          {story.headline || 'Untitled story'}
        </h1>

        {hasDateline ? (
          <p className="mt-4 mb-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] leading-[1.125rem] font-medium tracking-[0.01em] text-text-secondary">
            {dateLabel ? <time dateTime={story.date}>{dateLabel}</time> : null}
            {minutes ? (
              <>
                {dateLabel ? <span aria-hidden="true">·</span> : null}
                <span>{minutes}</span>
              </>
            ) : null}
            {sourceLabel ? (
              <>
                {dateLabel || minutes ? <span aria-hidden="true">·</span> : null}
                <span>{sourceLabel}</span>
              </>
            ) : null}
          </p>
        ) : null}

        <div
          id="story-reader-body"
          tabIndex={-1}
          className="mt-8 max-w-[66ch] text-[1.0625rem] leading-[1.6875rem] text-text-primary sm:text-[1.125rem] sm:leading-[1.8125rem]"
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={index} className={index === 0 ? 'm-0' : 'mt-4 mb-0'}>
                {paragraph}
              </p>
            ))
          ) : (
            <p className="m-0 text-text-secondary">
              The reporting for this story is unavailable in today’s edition.
            </p>
          )}
        </div>

        <div className="mt-5">
          <StakesCallout variant="so-what">{story.so_what}</StakesCallout>
          <StakesCallout variant="what-now">{story.what_now}</StakesCallout>
        </div>

        <div className="mt-8">
          <SourceList sources={story.sources} />
        </div>

        {topics.length > 0 ? (
          <p className="mt-8 mb-0 max-w-[66ch] text-[0.8125rem] leading-[1.5rem] tracking-[0.01em] text-text-secondary">
            <span className="font-semibold text-text-tertiary">Topics: </span>
            {topics.map(sentenceCase).join(' · ')}
          </p>
        ) : null}

        {hasRankingDetail ? (
          <details className="mt-8 rounded-xl border border-border bg-surface-raised">
            <summary className="cursor-pointer px-4 py-3 marker:text-text-tertiary">
              <h2 className="m-0 inline text-[0.9375rem] leading-[1.25rem] font-semibold text-text-primary">
                Why this ranked
              </h2>
            </summary>
            <div className="border-t border-border px-4 py-4">
              {whyRanked ? (
                <p className="m-0 max-w-[66ch] text-[0.9375rem] leading-[1.375rem] text-text-secondary">
                  {whyRanked}
                </p>
              ) : null}
              <div className={whyRanked ? 'mt-4' : ''}>
                <ConsequenceMeter consequence={story.consequence} />
              </div>
            </div>
          </details>
        ) : null}
      </article>
    </div>
  )
}

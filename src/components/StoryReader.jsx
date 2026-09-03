import { useCallback, useEffect, useRef, useState } from 'react'
import ConsequenceMeter from './ConsequenceMeter.jsx'
import SaveButton from './SaveButton'
import SourceList from './SourceList.jsx'
import StakesCallout from './StakesCallout.jsx'
import { formatDate, readTime } from '../lib/format.js'

/**
 * The focused story reader.
 *
 * Content order follows the research brief §5.2: back control and save, the
 * hero, then a masthead carrying category / position / region above the
 * headline and dateline / read time / source count / countries below it,
 * then the complete reporting, So what, conditional What now, the full
 * provenance block, topics and the ranking disclosure.
 *
 * The masthead is the density change the redesign spec asks for: the six
 * facts that used to occupy four stacked blocks separated by 8-32px gaps now
 * ride two 11-12px lines either side of the headline, and the headline drops
 * from 38/48px to the reference reader's 30/36px. Nothing was deleted.
 *
 * Body copy is the one place in the app set as a newspaper column: 17/27px on
 * mobile, 18/29px above 40rem, capped at 66ch (§4.2, evidence 10). Headlines
 * are `Newsreader` per the redesign spec's type scale, with the shell's
 * display token behind it; body and UI stay on `Inter` from the base layer.
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

/** Spec type scale: headlines are Newsreader, with the shell token behind it. */
const SERIF = "'Newsreader', var(--font-display, Georgia, serif)"

function accentNameFor(category, story) {
  const declared = typeof category?.accent === 'string' ? category.accent.trim() : ''
  if (/^--[a-z0-9-]+$/i.test(declared)) return declared

  const key = typeof story?.category === 'string' ? story.category.trim().toLowerCase() : ''
  return ACCENT_KEYS.includes(key) ? `--accent-${key}` : ''
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

function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `'2026-09-03'` to `'3 Sep 2026'`. Anything else comes back untouched. */
function compactDate(value) {
  const text = trimmedString(value)
  const parts = DATE_ONLY.exec(text)
  if (!parts) return text

  const month = MONTHS[Number(parts[2]) - 1]
  const day = Number(parts[3])
  if (!month || !day) return text

  return `${day} ${month} ${parts[1]}`
}

/**
 * One honest line about how much history the catch-up actually holds, so the
 * call to action never over-promises a depth the evidence does not have.
 */
function recapWindowNote(recap) {
  const days = Number.isFinite(recap.days_covered) ? Math.max(0, Math.floor(recap.days_covered)) : 0
  const asOf = compactDate(recap.as_of)

  if (days > 0 && asOf) {
    return `${days} ${days === 1 ? 'day' : 'days'} of Aware coverage, to ${asOf}.`
  }
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} of Aware coverage.`
  }
  if (asOf) return `Aware coverage to ${asOf}.`
  return 'How this story got here, from Aware’s own earlier coverage.'
}

export default function StoryReader({
  story,
  category,
  onClose,
  isSaved,
  onToggleSave,
  recap,
  onOpenRecap,
  suspended = false,
}) {
  if (!story || typeof story !== 'object' || Array.isArray(story)) return null
  return (
    <Reader
      story={story}
      category={category}
      onClose={onClose}
      isSaved={isSaved}
      onToggleSave={onToggleSave}
      recap={recap}
      onOpenRecap={onOpenRecap}
      suspended={suspended}
    />
  )
}

function Reader({ story, category, onClose, isSaved, onToggleSave, recap, onOpenRecap, suspended }) {
  const dialogRef = useRef(null)
  const recapCtaRef = useRef(null)
  const wasSuspended = useRef(false)
  const [visible, setVisible] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') onClose()
  }, [onClose])

  // Focus moves to the close control on open and returns to the opener on close.
  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus()

    return () => {
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus()
    }
  }, [])

  // Escape closes; Tab is trapped inside the dialog. While a catch-up is open
  // on top, this reader owns neither: it is inert and the catch-up handles the
  // keyboard, so the two dialogs can never both act on one Escape.
  useEffect(() => {
    if (suspended) return undefined

    function onKeyDown(event) {
      const node = dialogRef.current
      if (!node) return

      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
        return
      }

      if (event.key === 'PageDown') {
        event.preventDefault()
        node.scrollBy({ top: Math.max(120, Math.floor(node.clientHeight * 0.9)), behavior: 'auto' })
        return
      }

      if (event.key === 'PageUp') {
        event.preventDefault()
        node.scrollBy({ top: -Math.max(120, Math.floor(node.clientHeight * 0.9)), behavior: 'auto' })
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        node.scrollBy({ top: 48, behavior: 'auto' })
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        node.scrollBy({ top: -48, behavior: 'auto' })
        return
      }

      if (event.key === 'Home') {
        event.preventDefault()
        node.scrollTo({ top: 0, behavior: 'auto' })
        return
      }

      if (event.key === 'End') {
        event.preventDefault()
        node.scrollTo({ top: node.scrollHeight, behavior: 'auto' })
        return
      }

      if (event.key !== 'Tab') return

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
  }, [handleClose, suspended])

  // Reader entry is an opacity fade only, and none at all under reduced motion.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Handing control back after a catch-up closes. The catch-up cannot restore
  // focus itself, because this reader is still inert at the moment it unmounts,
  // so the reader takes the caret back to the control the reader left from.
  useEffect(() => {
    if (suspended) {
      wasSuspended.current = true
      return
    }
    if (!wasSuspended.current) return
    wasSuspended.current = false

    const node = recapCtaRef.current
    if (node && document.contains(node)) node.focus()
    else dialogRef.current?.focus()
  }, [suspended])

  const accentName = accentNameFor(category, story)
  const accent = accentName ? `var(${accentName})` : 'var(--text-primary)'
  // `--accent-{key}-light` is the spec's tint token; the sunken surface is the
  // closest published token to sit behind it until the shell defines it.
  const accentLight = accentName
    ? `var(${accentName}-light, var(--surface-sunken))`
    : 'var(--surface-sunken)'

  const storyId = trimmedString(story.id)
  const isStorySaved = Boolean(storyId) && Boolean(isSaved?.(storyId))
  const handleToggleSave = useCallback(() => {
    if (storyId) onToggleSave?.(storyId)
  }, [onToggleSave, storyId])

  const categoryLabel = sentenceCase(category?.label || story.category)
  const rank = typeof story.rank === 'number' && Number.isFinite(story.rank) ? story.rank : null
  const total = typeof category?.count === 'number' && category.count > 0 ? category.count : null
  const position = rank && total && rank <= total ? `${rank} of ${total}` : null

  const dateLabel = formatDate(story.date)
  const minutes = readTime(story.read_time_min)

  const sources = Array.isArray(story.sources) ? story.sources : []
  const sourceLabel = sources.length
    ? `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`
    : ''

  const paragraphs = paragraphsOf(story.body)
  const region = trimmedString(story.region)
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

  // `image` is optional and empty on most stories: never a broken icon.
  const imageUrl = trimmedString(story.image)
  const showImage = Boolean(imageUrl) && !imageFailed

  // Most stories have no catch-up. Absent means nothing renders at all: no
  // disabled button, no empty state, no placeholder.
  const linkedRecap =
    recap && typeof recap === 'object' && !Array.isArray(recap) && trimmedString(recap.id)
      ? recap
      : null

  const handleOpenRecap = useCallback(() => {
    if (linkedRecap) onOpenRecap?.(linkedRecap)
  }, [linkedRecap, onOpenRecap])

  const dateline = [dateLabel, minutes, sourceLabel].filter(Boolean)
  const hasMasthead = dateline.length > 0 || countries.length > 0

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-reader-headline"
      tabIndex={-1}
      inert={Boolean(suspended)}
      style={{ '--story-accent': accent, '--story-accent-light': accentLight }}
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
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-2 px-4 py-1 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleClose}
            className="-ml-2 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-[0.875rem] leading-[1.125rem] font-semibold text-text-primary"
          >
            <span aria-hidden="true">←</span>
            Back to today’s briefing
          </button>

          <SaveButton
            saved={isStorySaved}
            onToggle={handleToggleSave}
            size="md"
            className="-mr-2 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
          />
        </div>
      </header>

      <article className="mx-auto w-full max-w-[760px] pb-20">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            onError={() => setImageFailed(true)}
            className="block h-48 w-full object-cover sm:h-72"
            style={{ backgroundColor: accentLight }}
          />
        ) : null}

        {/*
          With no photograph the masthead itself becomes the tinted
          `--accent-{key}-light` plate, so the fallback is a deliberate block
          rather than a reserved empty rectangle — and it can never collapse,
          because the category line, headline and dateline live inside it.
        */}
        <div
          className="px-4 pt-3 pb-3 sm:px-6 lg:px-8"
          style={{
            background: showImage
              ? undefined
              : `linear-gradient(180deg, ${accentLight} 0%, var(--surface) 100%)`,
            borderBottom: `2px solid ${accent}`,
          }}
        >
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] leading-[1rem] font-semibold tracking-[0.08em] text-text-tertiary uppercase">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ backgroundColor: accentLight, color: accent }}
            >
              {category?.emoji ? <span aria-hidden="true">{category.emoji}</span> : null}
              {categoryLabel || 'Today’s briefing'}
            </span>
            {position ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <span>
                  <span className="sr-only">Story </span>
                  {position}
                </span>
              </span>
            ) : null}
            {region ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <span>
                  <span className="sr-only">Region: </span>
                  {region}
                </span>
              </span>
            ) : null}
          </p>

          <h1
            id="story-reader-headline"
            className="mt-1.5 mb-0 max-w-[24ch] text-[1.875rem] leading-[2.0625rem] font-semibold tracking-[-0.02em] text-text-primary sm:text-[2.25rem] sm:leading-[2.5rem]"
            style={{ fontFamily: SERIF }}
          >
            {story.headline || 'Untitled story'}
          </h1>

          {hasMasthead ? (
            <p className="mt-2 mb-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem] leading-[1.125rem] font-medium text-text-tertiary">
              {dateLabel ? <time dateTime={story.date}>{dateLabel}</time> : null}
              {dateline.slice(dateLabel ? 1 : 0).map((part) => (
                <span key={part} className="inline-flex items-center gap-2">
                  <span aria-hidden="true">·</span>
                  <span>{part}</span>
                </span>
              ))}
              {countries.length > 0 ? (
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {dateline.length > 0 ? <span aria-hidden="true">·</span> : null}
                  <span className="sr-only">Countries: </span>
                  {countries.map((country, index) => (
                    <span
                      key={`${country.name || 'country'}-${index}`}
                      className="inline-flex items-center gap-1"
                    >
                      {country.flag ? <span aria-hidden="true">{country.flag}</span> : null}
                      <span>{country.name || 'Unnamed country'}</span>
                      {country.role ? <span className="sr-only"> ({country.role})</span> : null}
                    </span>
                  ))}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          {linkedRecap ? (
            <button
              type="button"
              ref={recapCtaRef}
              onClick={handleOpenRecap}
              className="mt-5 flex min-h-[44px] w-full max-w-[66ch] cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none"
            >
              <span className="min-w-0">
                <span className="block text-[0.9375rem] leading-[1.25rem] font-semibold text-text-primary">
                  Catch up on this story
                </span>
                <span className="mt-0.5 block text-[0.8125rem] leading-[1.125rem] text-text-secondary">
                  {recapWindowNote(linkedRecap)}
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-text-tertiary">
                →
              </span>
            </button>
          ) : null}

          <div
            id="story-reader-body"
            tabIndex={-1}
            className="mt-5 max-w-[66ch] text-[1.0625rem] leading-[1.6875rem] text-text-primary sm:text-[1.125rem] sm:leading-[1.8125rem]"
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

          {sources.length > 0 ? (
            <div className="mt-8">
              <SourceList sources={sources} />
            </div>
          ) : null}

          {topics.length > 0 ? (
            <p className="mt-6 mb-0 max-w-[66ch] text-[0.75rem] leading-[1.25rem] tracking-[0.01em] text-text-secondary">
              <span className="font-semibold text-text-tertiary">Topics: </span>
              {topics.map(sentenceCase).join(' · ')}
            </p>
          ) : null}

          {hasRankingDetail ? (
            <details className="mt-6 rounded-xl border border-border bg-surface-raised">
              <summary className="cursor-pointer px-4 py-3 marker:text-text-tertiary">
                <h2 className="m-0 inline text-[0.9375rem] leading-[1.25rem] font-semibold text-text-primary">
                  Why this ranked
                </h2>
              </summary>
              <div className="border-t border-border px-4 py-4">
                {whyRanked ? (
                  <p className="m-0 max-w-[66ch] text-[0.875rem] leading-[1.3125rem] text-text-secondary">
                    {whyRanked}
                  </p>
                ) : null}
                <div className={whyRanked ? 'mt-4' : ''}>
                  <ConsequenceMeter consequence={story.consequence} />
                </div>
              </div>
            </details>
          ) : null}
        </div>
      </article>
    </div>
  )
}

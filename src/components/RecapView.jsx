import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SaveButton from './SaveButton.jsx'
import SourceList from './SourceList.jsx'
import StakesCallout from './StakesCallout.jsx'

/**
 * The catch-up reader: one recap, full screen.
 *
 * A recap is a topic cluster across days, not a single story, so this view
 * answers the questions a newcomer actually has, in the order the recap
 * contract fixes and with each answer visibly separate:
 *
 *   orient   What is this          ground  The basics
 *   cast     Who is involved       path    How did we get here
 *   now      What changed now      stakes  So what (via StakesCallout)
 *   next     What to watch
 *
 * Then the provenance block via `SourceList`, then `coverage_note`, which is
 * rendered plainly and unconditionally because it is the only honest statement
 * of how deep the evidence actually goes. `as_of` and `days_covered` ride the
 * masthead for the same reason.
 *
 * Mechanics and register match `StoryReader` exactly: dialog semantics, a Tab
 * trap, Escape to close, focus restored to the opener, a body scroll lock, an
 * opacity-only fade and a `max-w-[66ch]` longform column. It sits above the
 * story reader so a recap can be opened from inside one and hand it back
 * untouched.
 *
 * Props: { recap, category, backLabel, onClose, isSaved, onToggleSave }.
 * Every recap field may be missing: nothing here renders a heading without
 * content beneath it.
 */

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

/** The longform column, identical to the story reader's body measure. */
const PROSE =
  'max-w-[66ch] text-[1.0625rem] leading-[1.6875rem] text-text-primary sm:text-[1.125rem] sm:leading-[1.8125rem]'

const CONFIDENCE_LABEL = {
  confirmed: 'Confirmed',
  reported: 'Reported',
  disputed: 'Disputed',
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

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

function paragraphsOf(body) {
  return String(body ?? '')
    .split(/\r?\n+/)
    .map((para) => para.trim())
    .filter(Boolean)
}

/**
 * The contract already emits beats oldest first. Re-sort only when every beat
 * carries a plain `YYYY-MM-DD`, so a partially dated list is never shuffled
 * into a worse order than the pipeline gave it.
 */
function orderedBeats(path) {
  const list = Array.isArray(path) ? path : []
  if (list.length < 2) return list
  if (!list.every((beat) => DATE_ONLY.test(trimmedString(beat?.date)))) return list

  return list
    .map((beat, index) => ({ beat, index }))
    .sort((a, b) => {
      const left = trimmedString(a.beat.date)
      const right = trimmedString(b.beat.date)
      if (left === right) return a.index - b.index
      return left < right ? -1 : 1
    })
    .map((entry) => entry.beat)
}

/** Never leave the evidence window unstated, even when the field is missing. */
function coverageLine(recap) {
  const stated = trimmedString(recap.coverage_note)
  if (stated) return stated

  const days = Number.isFinite(recap.days_covered) ? Math.max(0, Math.floor(recap.days_covered)) : 0
  const asOf = compactDate(recap.as_of)

  if (days > 0 && asOf) {
    return `Built from ${days} ${days === 1 ? 'day' : 'days'} of Aware coverage, to ${asOf}.`
  }
  if (days > 0) {
    return `Built from ${days} ${days === 1 ? 'day' : 'days'} of Aware coverage.`
  }
  return 'The coverage window for this catch-up was not recorded, so treat its history as partial.'
}

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2
        id={id}
        className="m-0 text-[1.25rem] leading-[1.5rem] font-semibold tracking-[-0.01em] text-text-primary"
        style={{ fontFamily: SERIF }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Prose({ text }) {
  const paragraphs = paragraphsOf(text)
  if (paragraphs.length === 0) return null

  return (
    <div className={`mt-3 ${PROSE}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={index === 0 ? 'm-0' : 'mt-3 mb-0'}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}

export default function RecapView({ recap, category, backLabel, onClose, isSaved, onToggleSave }) {
  if (!recap || typeof recap !== 'object' || Array.isArray(recap)) return null
  return (
    <Catchup
      recap={recap}
      category={category}
      backLabel={backLabel}
      onClose={onClose}
      isSaved={isSaved}
      onToggleSave={onToggleSave}
    />
  )
}

function Catchup({ recap, category, backLabel, onClose, isSaved, onToggleSave }) {
  const dialogRef = useRef(null)
  const [visible, setVisible] = useState(false)

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') onClose()
  }, [onClose])

  // Focus moves to the dialog on open and returns to the opener on close.
  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus()

    return () => {
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus()
    }
  }, [])

  // The page behind must not scroll under the catch-up. The previous value is
  // restored rather than cleared, so a story reader underneath keeps its lock.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Escape closes; Tab is trapped inside the dialog.
  useEffect(() => {
    function onKeyDown(event) {
      const node = dialogRef.current
      if (!node) return

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
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
  }, [handleClose])

  // Entry is an opacity fade only, and none at all under reduced motion.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const accentName = /^--[a-z0-9-]+$/i.test(trimmedString(category?.accent))
    ? trimmedString(category.accent)
    : ''
  const accent = accentName ? `var(${accentName})` : 'var(--text-primary)'
  const accentLight = accentName
    ? `var(${accentName}-light, var(--surface-sunken))`
    : 'var(--surface-sunken)'

  const recapId = trimmedString(recap.id)
  const isRecapSaved = Boolean(recapId) && Boolean(isSaved?.(recapId))
  const handleToggleSave = useCallback(() => {
    if (recapId) onToggleSave?.(recap)
  }, [onToggleSave, recap, recapId])

  const title = trimmedString(recap.title)
  const asOfLabel = compactDate(recap.as_of)
  const days = Number.isFinite(recap.days_covered) ? Math.max(0, Math.floor(recap.days_covered)) : 0
  const confidence = trimmedString(recap.confidence).toLowerCase()
  const confidenceLabel = confidence && confidence !== 'confirmed' ? CONFIDENCE_LABEL[confidence] : ''

  const ground = (Array.isArray(recap.ground) ? recap.ground : [])
    .map(trimmedString)
    .filter(Boolean)
  const cast = (Array.isArray(recap.cast) ? recap.cast : []).filter(
    (actor) => actor && typeof actor === 'object' && (actor.name || actor.role || actor.position),
  )
  const beats = useMemo(() => orderedBeats(recap.path), [recap.path])
  const next = (Array.isArray(recap.next) ? recap.next : []).map(trimmedString).filter(Boolean)
  const sources = (Array.isArray(recap.sources) ? recap.sources : []).filter(
    (source) => source && typeof source === 'object' && (source.url || source.source),
  )

  const orient = trimmedString(recap.orient)
  const now = trimmedString(recap.now)
  const stakes = trimmedString(recap.stakes)

  const hasAnySection =
    Boolean(orient) ||
    ground.length > 0 ||
    cast.length > 0 ||
    beats.length > 0 ||
    Boolean(now) ||
    Boolean(stakes) ||
    next.length > 0

  const meta = [
    days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} of coverage` : '',
    sources.length ? `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}` : '',
  ].filter(Boolean)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recap-view-title"
      tabIndex={-1}
      style={{ '--story-accent': accent, '--story-accent-light': accentLight }}
      className={`fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-surface transition-opacity duration-150 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
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
            {trimmedString(backLabel) || 'Back'}
          </button>

          <SaveButton
            saved={isRecapSaved}
            onToggle={handleToggleSave}
            size="md"
            className="-mr-2 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
          />
        </div>
      </header>

      <article className="mx-auto w-full max-w-[760px] pb-20">
        <div
          className="px-4 pt-3 pb-3 sm:px-6 lg:px-8"
          style={{
            background: `linear-gradient(180deg, ${accentLight} 0%, var(--surface) 100%)`,
            borderBottom: `2px solid ${accent}`,
          }}
        >
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] leading-[1rem] font-semibold tracking-[0.08em] text-text-tertiary uppercase">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ backgroundColor: accentLight, color: accent }}
            >
              Catch-up
            </span>
            {confidenceLabel ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <span>Confidence: {confidenceLabel}</span>
              </span>
            ) : null}
          </p>

          <h1
            id="recap-view-title"
            className="mt-1.5 mb-0 max-w-[24ch] text-[1.875rem] leading-[2.0625rem] font-semibold tracking-[-0.02em] text-text-primary sm:text-[2.25rem] sm:leading-[2.5rem]"
            style={{ fontFamily: SERIF }}
          >
            {title || 'Catch-up'}
          </h1>

          {asOfLabel || meta.length > 0 ? (
            <p className="mt-2 mb-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem] leading-[1.125rem] font-medium text-text-tertiary">
              {asOfLabel ? (
                <span>
                  Current to <time dateTime={trimmedString(recap.as_of)}>{asOfLabel}</time>
                </span>
              ) : null}
              {meta.map((part, index) => (
                <span key={part} className="inline-flex items-center gap-2">
                  {asOfLabel || index > 0 ? <span aria-hidden="true">·</span> : null}
                  <span>{part}</span>
                </span>
              ))}
            </p>
          ) : null}
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          {orient ? (
            <Section id="recap-orient" title="What is this">
              <Prose text={orient} />
            </Section>
          ) : null}

          {ground.length > 0 ? (
            <Section id="recap-ground" title="The basics">
              <ul className="mt-3 mb-0 max-w-[66ch] list-none p-0">
                {ground.map((fact, index) => (
                  <li
                    key={index}
                    className="relative mt-2 pl-5 text-[1rem] leading-[1.5rem] text-text-primary first:mt-0"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-[0.6em] left-0 h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    {fact}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {cast.length > 0 ? (
            <Section id="recap-cast" title="Who is involved">
              <ul className="mt-4 mb-0 list-none rounded-xl border border-border bg-surface-raised p-0">
                {cast.map((actor, index) => {
                  const name = trimmedString(actor.name)
                  const role = trimmedString(actor.role)
                  const position = trimmedString(actor.position)
                  const flag = trimmedString(actor.flag)

                  return (
                    <li key={`${name || role}-${index}`} className="border-t border-border px-4 py-3 first:border-t-0">
                      {role ? (
                        <p
                          className="m-0 text-[0.75rem] leading-[1rem] font-bold tracking-[0.08em] uppercase"
                          style={{ color: accent }}
                        >
                          {role}
                        </p>
                      ) : null}
                      {name ? (
                        <p className="mt-1 mb-0 text-[1rem] leading-[1.4375rem] font-medium text-text-primary">
                          {flag ? <span aria-hidden="true">{flag} </span> : null}
                          {name}
                        </p>
                      ) : null}
                      {position ? (
                        <p className="mt-1 mb-0 text-[0.9375rem] leading-[1.375rem] text-text-secondary">
                          {position}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </Section>
          ) : null}

          {beats.length > 0 ? (
            <Section id="recap-path" title="How did we get here">
              <ol className="mt-4 mb-0 max-w-[66ch] list-none p-0">
                {beats.map((beat, index) => {
                  const stamp = trimmedString(beat.date)
                  const label = compactDate(stamp)
                  const headline = trimmedString(beat.headline)
                  const what = trimmedString(beat.what)
                  const why = trimmedString(beat.why_it_mattered)

                  return (
                    <li
                      key={`${stamp || headline}-${index}`}
                      className="relative border-l border-border pb-6 pl-5 last:border-l-transparent last:pb-0"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute top-[0.35rem] -left-[0.3125rem] h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: accent, boxShadow: '0 0 0 2px var(--surface)' }}
                      />
                      {label ? (
                        <p className="m-0 text-[0.75rem] leading-[1rem] font-bold tracking-[0.08em] uppercase text-text-tertiary">
                          <time dateTime={stamp}>{label}</time>
                        </p>
                      ) : null}
                      {headline ? (
                        <h3 className="mt-1 mb-0 text-[1.0625rem] leading-[1.4375rem] font-semibold text-text-primary">
                          {headline}
                        </h3>
                      ) : null}
                      {what ? (
                        <p className="mt-1 mb-0 text-[1rem] leading-[1.5rem] text-text-primary">
                          {what}
                        </p>
                      ) : null}
                      {why ? (
                        <p className="mt-1 mb-0 text-[0.9375rem] leading-[1.375rem] text-text-secondary">
                          {why}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            </Section>
          ) : null}

          {now ? (
            <Section id="recap-now" title="What changed now">
              <Prose text={now} />
            </Section>
          ) : null}

          {stakes ? (
            <div className="mt-8">
              <StakesCallout variant="so-what">{stakes}</StakesCallout>
            </div>
          ) : null}

          {next.length > 0 ? (
            <Section id="recap-next" title="What to watch">
              <ul className="mt-3 mb-0 max-w-[66ch] list-none p-0">
                {next.map((item, index) => (
                  <li
                    key={index}
                    className="relative mt-2 pl-6 text-[1rem] leading-[1.5rem] text-text-primary first:mt-0"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-0 font-semibold"
                      style={{ color: accent }}
                    >
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {hasAnySection ? null : (
            <p className={`mt-8 ${PROSE} text-text-secondary`}>
              The detail for this catch-up is unavailable. Only the coverage note below could be
              recovered.
            </p>
          )}

          {sources.length > 0 ? (
            <div className="mt-8">
              <SourceList sources={sources} />
            </div>
          ) : null}

          <p className="mt-8 mb-0 max-w-[66ch] border-t border-border-subtle pt-4 text-[0.8125rem] leading-[1.25rem] text-text-secondary">
            {coverageLine(recap)}
          </p>

          <p className="mt-2 mb-0 max-w-[66ch] text-[0.75rem] leading-[1.125rem] text-text-muted">
            Saving a catch-up keeps its own copy on this device, so it stays readable after the
            briefing rotates.
          </p>
        </div>
      </article>
    </div>
  )
}

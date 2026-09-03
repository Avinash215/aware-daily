import { useRef } from 'react'
import { DEPTH_MODES, depthMode } from '../hooks/useReadingDepth.js'

/**
 * The reading-depth control.
 *
 * A segmented radiogroup that sits in the masthead beside the date line and
 * decides how much of every feed card is rendered. It is editorial furniture,
 * not a settings widget: one track, three words, and the minutes the choice
 * actually costs sitting next to it.
 *
 * The visible chips stay small; each button pads out to a 44px touch target
 * and the group pulls that padding back with a negative margin so the control
 * costs the masthead about 32px of height rather than 46px.
 *
 * The selected chip is painted with no transition on purpose. A colour
 * transition renders an interpolated value, so while it runs the painted
 * highlight disagrees with `aria-checked`; switching into Full rebuilds
 * 55 cards and can starve those frames for seconds, leaving the highlight
 * stranded on the previous chip. The indicator must be instant.
 *
 * Props: { depth, onChange, minutes } where `minutes` is
 * `{ skim, brief, full }` measured from the loaded edition.
 */

export default function DepthControl({ depth, onChange, minutes, className = '' }) {
  const buttonRefs = useRef([])

  const active = depthMode(depth)
  const activeKey = active?.key
  const estimates = minutes && typeof minutes === 'object' ? minutes : {}
  const activeMinutes = estimates[activeKey]
  const hasMinutes = typeof activeMinutes === 'number' && Number.isFinite(activeMinutes)

  const select = (index) => {
    const next = DEPTH_MODES[index]
    if (!next) return
    buttonRefs.current[index]?.focus()
    if (next.key !== activeKey) onChange?.(next.key)
  }

  const onKeyDown = (event, index) => {
    const last = DEPTH_MODES.length - 1

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      select((index + 1) % DEPTH_MODES.length)
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      select((index - 1 + DEPTH_MODES.length) % DEPTH_MODES.length)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      select(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      select(last)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <div
        role="radiogroup"
        aria-label="Reading depth"
        className="flex items-center rounded-full border px-0.5"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
      >
        {DEPTH_MODES.map((mode, index) => {
          const isActive = mode.key === activeKey
          const estimate = estimates[mode.key]
          const label =
            typeof estimate === 'number' && Number.isFinite(estimate)
              ? `${mode.label} — ${mode.hint}, about ${estimate} ${estimate === 1 ? 'minute' : 'minutes'} for the whole briefing`
              : `${mode.label} — ${mode.hint}`

          return (
            <button
              key={mode.key}
              ref={(node) => {
                buttonRefs.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              tabIndex={isActive ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-0 bg-transparent px-0.5 py-0"
            >
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold tracking-[0.02em]"
                style={
                  isActive
                    ? {
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--surface-card)',
                        boxShadow: 'var(--shadow-card)',
                      }
                    : { color: 'var(--text-muted)', backgroundColor: 'transparent' }
                }
              >
                {mode.label}
              </span>
            </button>
          )
        })}
      </div>

      {hasMinutes ? (
        <span
          className="shrink-0 text-caption tabular-nums"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        >
          ~{activeMinutes} min
        </span>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {hasMinutes
          ? `${active?.label}. ${activeMinutes} minute read.`
          : `${active?.label}.`}
      </p>
    </div>
  )
}

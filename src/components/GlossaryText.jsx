import { Fragment } from 'react'
import { isExplainable } from '../lib/glossary.js'

/**
 * Deterministic glossary segments stay in the original prose flow: only marked
 * words become native buttons, with inherited typography and no extra spacing.
 * The accent marks the underline, not the reporting, and the shared global
 * focus-visible outline keeps the same affordance as the rest of the app.
 */
export default function GlossaryText({ segments, onSelect }) {
  if (!Array.isArray(segments)) return null

  return segments.map((segment, index) => {
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) return null
    if (typeof segment.text !== 'string') return null
    if (segment.kind === 'text') return <Fragment key={index}>{segment.text}</Fragment>
    if (segment.kind !== 'term') return null
    // Never offer a control the explanation panel would decline to open.
    if (!isExplainable(segment.entry)) return <Fragment key={index}>{segment.text}</Fragment>

    const label = `Explain "${segment.text}"`
    return (
      <button
        key={index}
        type="button"
        aria-label={label}
        title={label}
        onClick={(event) => {
          if (typeof onSelect === 'function') onSelect(segment.entry, event)
        }}
        className="m-0 inline cursor-pointer border-0 bg-transparent p-0 align-baseline text-text-primary underline decoration-dotted underline-offset-[3px]"
        style={{ font: 'inherit', color: 'inherit', textDecorationColor: 'var(--story-accent)' }}
      >
        {segment.text}
      </button>
    )
  })
}

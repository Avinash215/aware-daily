/**
 * The shared presentation for the two editorial judgements Aware Daily adds on
 * top of the reporting: "So what" (why it matters) and "What now" (what happens
 * next). Research brief §5.2 requires these to be structurally distinct from the
 * body without shouting — no tinted box, no icon, no quote marks, no disclosure.
 *
 *   so-what   4px solid category rule, 16px left padding, 12px vertical padding.
 *   what-now  the same column, opened by a 1px dashed rule and 16px top padding.
 *
 * The category colour is inherited as `--story-accent` from an ancestor so the
 * prop contract stays `{ variant, children }`; standalone use falls back to the
 * primary text token, so this never renders an undefined colour.
 */

const ACCENT = 'var(--story-accent, var(--text-primary))'

const VARIANTS = {
  'so-what': { label: 'So what', weight: 'font-semibold', arrow: false },
  'what-now': { label: 'What now', weight: 'font-medium', arrow: true },
}

function isEmpty(children) {
  if (children === null || children === undefined || children === false) return true
  if (typeof children === 'string') return children.trim() === ''
  if (Array.isArray(children)) return children.length === 0 || children.every(isEmpty)
  return false
}

export default function StakesCallout({ variant = 'so-what', children }) {
  // "Never render 'No update', a disabled block, or empty vertical space."
  if (isEmpty(children)) return null

  const config = VARIANTS[variant] ?? VARIANTS['so-what']
  const isWhatNow = config === VARIANTS['what-now']

  return (
    <div
      className={isWhatNow ? 'pt-4 pr-1 pb-3 pl-4' : 'py-3 pr-1 pl-4'}
      style={{
        borderLeft: `4px solid ${ACCENT}`,
        borderTop: isWhatNow ? '1px dashed var(--text-tertiary)' : undefined,
      }}
    >
      <p
        className="m-0 text-[0.75rem] leading-[1rem] font-bold tracking-[0.08em] uppercase"
        style={{ color: ACCENT }}
      >
        {config.label}
        {config.arrow ? <span aria-hidden="true"> →</span> : null}
      </p>
      <p
        className={`mt-2 mb-0 max-w-[66ch] text-[1.0625rem] leading-[1.5625rem] text-text-primary sm:text-[1.125rem] sm:leading-[1.6875rem] ${config.weight}`}
      >
        {children}
      </p>
    </div>
  )
}

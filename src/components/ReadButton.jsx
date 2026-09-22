/**
 * The explicit read toggle for one story.
 *
 * Accessible name and state never depend on the variant: "Mark read: <headline>"
 * or "Mark unread: <headline>" with `aria-pressed`, so feed cards and the
 * reader announce the same thing.
 *
 * `pill` is the bordered button. `inline` sits in a card's meta row: the visible
 * chrome is one line of text and a check, while padding keeps the tap target at
 * 44px and, with `bleed`, a matching negative margin stops that padding from
 * adding row height.
 */
function CheckGlyph({ read }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="10"
        cy="10"
        r="8.25"
        fill={read ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.4 10.3l2.4 2.4 4.8-5.1"
        fill="none"
        stroke={read ? 'var(--surface-card)' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={read ? 1 : 0.55}
      />
    </svg>
  )
}

export default function ReadButton({ read = false, onToggle, headline = '', className = '', variant = 'pill', bleed = true }) {
  const label = read ? 'Mark unread' : 'Mark read'
  const handleClick = (event) => {
    event.stopPropagation()
    onToggle?.()
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        aria-label={headline ? `${label}: ${headline}` : label}
        aria-pressed={read}
        onClick={handleClick}
        className={`${bleed ? '-mx-2 -my-3 px-2' : 'px-3'} inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent text-meta font-semibold text-text-muted transition-colors duration-150 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-text-primary motion-reduce:transition-none [scroll-margin-top:8rem] ${className}`}
      >
        <CheckGlyph read={read} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-label={headline ? `${label}: ${headline}` : label}
      aria-pressed={read}
      onClick={handleClick}
      className={`inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-meta font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary motion-reduce:transition-none [scroll-margin-top:8rem] ${className}`}
    >
      <CheckGlyph read={read} />
      {label}
    </button>
  )
}

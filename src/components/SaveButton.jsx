/**
 * The one save affordance in the app.
 *
 * A real <button> with `aria-pressed` and a label that changes with state, so
 * a screen reader announces "Save story, not pressed" / "Remove from saved,
 * pressed". The glyph can be small; the tap target never drops below 44px.
 *
 * Props: { saved, onToggle, size: 'sm' | 'md' | 'lg', className }
 * Colour comes from tokens only — pass `className` to tint it (for example
 * `text-accent-climate`) without touching this file.
 */

const GLYPH_SIZE = {
  sm: 'h-4 w-4',
  md: 'h-[18px] w-[18px]',
  lg: 'h-5 w-5',
}

export default function SaveButton({ saved = false, onToggle, size = 'md', className = '' }) {
  const glyph = GLYPH_SIZE[size] || GLYPH_SIZE.md
  const label = saved ? 'Remove from saved' : 'Save story'

  const handleClick = (event) => {
    // Rows are clickable; saving must not also open the story.
    event.stopPropagation()
    if (typeof onToggle === 'function') onToggle(event)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none ${
        saved ? 'text-text-primary' : 'text-text-muted'
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={saved ? 1.5 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={glyph}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}

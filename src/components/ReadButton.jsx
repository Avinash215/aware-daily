export default function ReadButton({ read = false, onToggle, headline = '', className = '' }) {
  const label = read ? 'Mark unread' : 'Mark read'
  return (
    <button
      type="button"
      aria-label={headline ? `${label}: ${headline}` : label}
      aria-pressed={read}
      onClick={(event) => {
        event.stopPropagation()
        onToggle?.()
      }}
      className={`inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-meta font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary motion-reduce:transition-none [scroll-margin-top:8rem] ${className}`}
    >
      {label}
    </button>
  )
}

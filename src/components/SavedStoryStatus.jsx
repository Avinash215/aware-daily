export default function SavedStoryStatus({ message }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {message ? (
        <p className="mx-auto my-2 max-w-[66ch] rounded-lg border border-border bg-surface-card px-3 py-2 text-meta text-text-primary [overflow-wrap:anywhere]">
          {message}
        </p>
      ) : null}
    </div>
  )
}

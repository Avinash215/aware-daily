import { useState } from 'react'

export default function SavedStoryStatus({ message, onRetry, canRetry = false, floating = false }) {
  const [retried, setRetried] = useState(false)
  const position = floating === 'top' ? 'top-3'
    : floating === 'page' ? 'bottom-[calc(5rem+env(safe-area-inset-bottom))]' : 'bottom-3'
  return (
    <div className={floating ? `fixed right-3 left-3 z-30 mx-auto max-h-[30dvh] max-w-[66ch] overflow-y-auto overscroll-contain p-1 ${position}` : ''}>
      <div role="status" aria-live="polite" aria-atomic="true">
        {message ? (
          <p className="mx-auto my-2 max-w-[66ch] rounded-lg border border-border bg-surface-card px-3 py-2 text-meta text-text-primary [overflow-wrap:anywhere]">
            {message}
          </p>
        ) : null}
      </div>
      {onRetry && (canRetry || retried) ? (
        <button
          type="button"
          aria-disabled={!canRetry}
          onClick={() => {
            if (!canRetry) return
            setRetried(true)
            onRetry()
          }}
          className="mb-2 inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-border bg-surface-card px-3 py-2 text-meta font-semibold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          {canRetry ? 'Retry saved changes' : 'No pending saved changes'}
        </button>
      ) : null}
    </div>
  )
}

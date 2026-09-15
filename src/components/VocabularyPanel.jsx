import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { isExplainable } from '../lib/glossary.js'
import SavedStoryStatus from './SavedStoryStatus.jsx'

/**
 * A small, local explanation rather than a dictionary or a second report.
 * The sheet owns focus and keyboard navigation while open; its own scrolling
 * and non-scrolling backdrop leave the reporting underneath exactly in place.
 * Invalid entries render nothing, and the footer makes the curated limit clear.
 * A portal keeps the explanation interactive while its reader is inert.
 */
export default function VocabularyPanel({ entry, onClose, storageMessage = '' }) {
  if (!isExplainable(entry)) return null

  return createPortal(<ExplanationDialog entry={entry} onClose={onClose} storageMessage={storageMessage} />, document.body)
}

function ExplanationDialog({ entry, onClose, storageMessage }) {
  const dialogRef = useRef(null)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const headingId = useId()

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (typeof onClose === 'function') onClose()
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        event.stopPropagation()
        // Close is the only interactive control, in either tab direction.
        closeRef.current?.focus({ preventScroll: true })
        return
      }

      const panel = panelRef.current
      if (!panel) return
      const page = Math.max(120, Math.floor(panel.clientHeight * 0.9))
      const distances = {
        ArrowDown: 48,
        ArrowUp: -48,
        PageDown: page,
        PageUp: -page,
        Home: -panel.scrollHeight,
        End: panel.scrollHeight,
      }
      const distance = event.key === ' ' && event.target !== closeRef.current
        ? (event.shiftKey ? -page : page)
        : distances[event.key]

      if (typeof distance === 'number') {
        event.preventDefault()
        event.stopPropagation()
        panel.scrollBy({ top: distance, behavior: 'auto' })
      }
    }

    function preventBackdropScroll(event) {
      if (event.target === dialog) event.preventDefault()
    }

    document.addEventListener('keydown', onKeyDown, true)
    dialog.addEventListener('wheel', preventBackdropScroll, { passive: false })
    dialog.addEventListener('touchmove', preventBackdropScroll, { passive: false })
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      dialog.removeEventListener('wheel', preventBackdropScroll)
      dialog.removeEventListener('touchmove', preventBackdropScroll)
    }
  }, [onClose])

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget && typeof onClose === 'function') onClose()
      }}
      className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto overscroll-none bg-surface/80 sm:items-center sm:p-6"
    >
      <div
        ref={panelRef}
        className="max-h-[85dvh] w-full max-w-[32rem] overflow-y-auto overscroll-contain rounded-t-xl border border-border bg-surface-raised p-6 sm:rounded-xl"
      >
        <SavedStoryStatus message={storageMessage} />
        <p className="m-0 text-[0.75rem] leading-[1rem] font-bold tracking-[0.08em] text-text-tertiary uppercase">
          Word
        </p>
        <h2 id={headingId} className="mt-2 mb-0 text-2xl font-semibold text-text-primary">
          {entry.term}
        </h2>
        <h3 className="mt-5 mb-0 text-[0.875rem] font-semibold text-text-primary">Meaning</h3>
        <p className="mt-2 mb-0 text-base leading-relaxed text-text-secondary">
          {typeof entry.meaning === 'string' ? entry.meaning : ''}
        </p>
        <h3 className="mt-5 mb-0 text-[0.875rem] font-semibold text-text-primary">In a sentence</h3>
        <p className="mt-2 mb-0 text-base leading-relaxed text-text-secondary italic">
          {typeof entry.usage === 'string' ? entry.usage : ''}
        </p>
        <p className="mt-6 mb-0 text-[0.75rem] leading-[1.125rem] text-text-tertiary">
          Aware explains a limited set of news terms.
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={() => {
            if (typeof onClose === 'function') onClose()
          }}
          className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-raised px-4 py-2 text-[0.9375rem] font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none"
        >
          Close
        </button>
      </div>
    </div>
  )
}

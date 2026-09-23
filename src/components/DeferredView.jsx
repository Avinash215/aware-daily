import { useEffect, useRef, useState } from 'react'

export default function DeferredView({ resource, label, onCancel, modal = false, children }) {
  const [View, setView] = useState(() => resource.get())
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [opener] = useState(() => document.activeElement)
  const pendingRef = useRef(null)
  const cancelledRef = useRef(false)
  const cancelRef = useRef(onCancel)
  useEffect(() => { cancelRef.current = onCancel }, [onCancel])

  useEffect(() => {
    let current = true
    resource.load().then(
      (component) => { if (current) setView(() => component) },
      () => { if (current) setError(true) },
    )
    return () => { current = false }
  }, [resource, attempt])

  useEffect(() => {
    if (View || !modal) return undefined
    pendingRef.current?.focus({ preventScroll: true })
    const onKey = (event) => {
      if (event.isComposing || event.keyCode === 229) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        cancelRef.current?.()
      } else if (event.key === 'Tab') {
        const buttons = [...pendingRef.current.querySelectorAll('button')]
        const first = buttons[0], last = buttons.at(-1)
        if (event.shiftKey && (document.activeElement === first || document.activeElement === pendingRef.current)) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === pendingRef.current)) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [View, modal])

  useEffect(() => () => {
    if ((modal || cancelledRef.current) && opener?.isConnected) opener.focus({ preventScroll: true })
  }, [modal, opener])

  if (View) return children(View, opener)
  return (
    <section
      ref={pendingRef}
      role={modal ? 'dialog' : 'region'}
      aria-modal={modal || undefined}
      aria-label={label}
      tabIndex={-1}
      className={modal
        ? 'fixed inset-0 z-[70] overflow-auto bg-surface p-5 text-text-primary'
        : 'my-5 min-h-64 rounded-xl border border-border bg-surface-card p-5'}
    >
      <div className="mx-auto max-w-[66ch]">
        <h2 className="font-display text-lead font-semibold">{label}</h2>
        <p role={error ? 'alert' : 'status'} className="mt-3 text-meta text-text-secondary">
          {error ? `Could not load ${label.toLowerCase()}. ${resource.canRetry() ? 'Check your connection and try again.' : 'The recovery download also failed. Go back; reload the page when your connection is restored.'}` : `Loading ${label.toLowerCase()}…`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => { cancelledRef.current = true; onCancel() }} className="min-h-11 rounded-full border border-border px-5 text-meta font-semibold">Cancel — Back</button>
          {error && resource.canRetry() ? <button type="button" onClick={() => { setError(false); setAttempt((value) => value + 1) }} className="min-h-11 rounded-full border border-border px-5 text-meta font-semibold">Retry loading</button> : null}
        </div>
      </div>
    </section>
  )
}

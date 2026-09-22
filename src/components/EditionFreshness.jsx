import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { freshnessMessage, subscribeToFreshness } from '../lib/freshness.js'

/**
 * The edition-age notice in the masthead.
 *
 * It takes no space on a current edition. When the message appears or changes
 * while the page is open (a tab left open past midnight, a device clock being
 * corrected), the notice may change height. If the reader has already scrolled
 * past it, the window is moved by exactly that difference, so the text they
 * were reading stays where it was. The target is computed from the last
 * recorded scroll position, which makes the correction idempotent whether or
 * not the browser has already applied its own scroll anchoring.
 */
export default function EditionFreshness({ editionDate, className = '' }) {
  const subscribe = useCallback(
    (onChange) => subscribeToFreshness(editionDate, onChange),
    [editionDate],
  )
  const getSnapshot = useCallback(() => freshnessMessage(editionDate), [editionDate])
  const message = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const boxRef = useRef(null)
  const heightRef = useRef(null)
  const scrollRef = useRef(0)

  useEffect(() => {
    const record = () => {
      scrollRef.current = window.scrollY
    }
    record()
    window.addEventListener('scroll', record, { passive: true })
    return () => window.removeEventListener('scroll', record)
  }, [])

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const height = box.offsetHeight
    const previous = heightRef.current
    heightRef.current = height
    if (previous === null || previous === height) return

    const before = scrollRef.current
    const noticeTop = box.getBoundingClientRect().top + window.scrollY
    if (before <= noticeTop) return

    const target = Math.max(0, before + height - previous)
    if (Math.abs(window.scrollY - target) > 1) window.scrollTo(window.scrollX, target)
    scrollRef.current = target
  }, [message])

  return (
    <div ref={boxRef} className={`edition-freshness ${className}`.trim()}>
      <div role="status" aria-live="polite" aria-atomic="true">
        {message ? (
          <p className="m-0 mt-2 inline-flex max-w-full items-start gap-1.5 rounded-md bg-surface-muted px-2.5 py-1.5 text-meta font-semibold text-text-primary">
            <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.5V8.5l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{message}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

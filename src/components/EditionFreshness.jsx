import { useCallback, useSyncExternalStore } from 'react'
import { freshnessMessage, subscribeToFreshness } from '../lib/freshness.js'

// Bound the English weekday/month (nine letters each), day and four-digit year
// independently of the date prop; invalid dates must not shrink the reservation.
const SIZING_LABEL = 'WWWWWWWWW, 88 WWWWWWWWW 8888'

export default function EditionFreshness({ editionDate, className = '' }) {
  const subscribe = useCallback(
    (onChange) => subscribeToFreshness(editionDate, onChange),
    [editionDate],
  )
  const getSnapshot = useCallback(() => freshnessMessage(editionDate), [editionDate])
  const message = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <div className="border-b border-border-subtle bg-surface-card">
      <div className={`${className} edition-freshness py-2 text-meta font-semibold text-text-primary`}>
        {/* Inert sizing copies reserve every state, including when currently fresh. */}
        <div aria-hidden="true" className="edition-freshness-sizing">
          <p>This briefing is 888888888 days old ({SIZING_LABEL}).</p>
          <p>Edition date is in the future ({SIZING_LABEL}). Check your device clock.</p>
          <p>Edition date unavailable</p>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true">{message}</p>
      </div>
    </div>
  )
}

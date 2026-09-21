import { formatDate, parseDateOnly } from './format.js'

const DAY_MS = 86_400_000
export const FRESHNESS_INTERVAL_MS = 60_000

function ordinal(year, month, day) {
  const date = new Date(0)
  // Unlike Date.UTC(year, ...), this does not remap years 0–99 to 1900–1999.
  date.setUTCFullYear(year, month - 1, day)
  return date.getTime() / DAY_MS
}

export function editionAgeDays(editionDate, now = new Date()) {
  const edition = parseDateOnly(editionDate)
  if (!edition || !Number.isFinite(now.getTime())) return null
  return ordinal(now.getFullYear(), now.getMonth() + 1, now.getDate()) -
    ordinal(edition.year, edition.month, edition.day)
}

export function freshnessMessage(editionDate, now = new Date()) {
  const age = editionAgeDays(editionDate, now)
  if (age === null) return 'Edition date unavailable'
  const label = formatDate(editionDate)
  if (age < 0) return `Edition date is in the future (${label}). Check your device clock.`
  if (age === 0) return ''
  return `This briefing is ${age} ${age === 1 ? 'day' : 'days'} old (${label}).`
}

/** One visible-page timer per subscription; dependencies permit fake-clock tests. */
export function subscribeToFreshness(editionDate, onChange, {
  page = document,
  host = window,
  now = () => new Date(),
} = {}) {
  let timer = null
  let stopped = false
  let previous = freshnessMessage(editionDate, now())

  function clearTimer() {
    if (timer !== null) host.clearTimeout(timer)
    timer = null
  }

  function refresh() {
    clearTimer()
    if (stopped || page.visibilityState === 'hidden') return
    const next = freshnessMessage(editionDate, now())
    if (next !== previous) {
      previous = next
      onChange()
    }
    timer = host.setTimeout(refresh, FRESHNESS_INTERVAL_MS)
  }

  page.addEventListener('visibilitychange', refresh)
  host.addEventListener('focus', refresh)
  host.addEventListener('pageshow', refresh)
  refresh()
  return () => {
    stopped = true
    clearTimer()
    page.removeEventListener('visibilitychange', refresh)
    host.removeEventListener('focus', refresh)
    host.removeEventListener('pageshow', refresh)
  }
}

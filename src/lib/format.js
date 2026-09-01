/**
 * Pure formatting helpers for Aware Daily.
 * No React, no side effects, and nothing here may throw on bad input.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parse an ISO string into a Date, or null if it is unusable.
 * A bare `YYYY-MM-DD` is treated as a *local* calendar day rather than UTC
 * midnight, so a briefing dated 2026-08-31 never renders as the 30th.
 */
function toDate(iso) {
  if (iso instanceof Date) return Number.isNaN(iso.getTime()) ? null : iso
  if (typeof iso !== 'string') return null

  const trimmed = iso.trim()
  if (!trimmed) return null

  const dateOnly = DATE_ONLY.exec(trimmed)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    const local = new Date(Number(y), Number(m) - 1, Number(d))
    return Number.isNaN(local.getTime()) ? null : local
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Intl inserts U+202F/U+00A0 around the meridiem in newer ICU builds. */
function normaliseSpaces(value) {
  return String(value).replace(/[\u202f\u00a0]/g, ' ')
}

function partsOf(date, options, locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date)
    const out = {}
    for (const part of parts) out[part.type] = part.value
    return out
  } catch {
    return null
  }
}

/**
 * `formatDate('2026-08-31')` -> `'Monday, 31 August 2026'`
 * Returns '' for anything unparseable.
 */
export function formatDate(iso) {
  const date = toDate(iso)
  if (!date) return ''

  const parts = partsOf(
    date,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    'en-GB',
  )
  if (!parts || !parts.weekday) return ''

  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`
}

/**
 * `formatUpdated('2026-08-31T22:40:14Z')` -> `'Updated 6:40 PM'` in local time.
 * Returns '' for anything unparseable.
 */
export function formatUpdated(iso) {
  const date = toDate(iso)
  if (!date) return ''

  const parts = partsOf(date, { hour: 'numeric', minute: '2-digit', hour12: true }, 'en-US')
  if (!parts || !parts.hour) return ''

  const meridiem = (parts.dayPeriod || '').toUpperCase()
  const time = normaliseSpaces(`${parts.hour}:${parts.minute} ${meridiem}`).trim()
  return `Updated ${time}`
}

/**
 * `readTime(3)` -> `'3 min read'`. Rounds to whole minutes, floors at 1.
 * Returns '' when there is no usable number.
 */
export function readTime(minutes) {
  const value = typeof minutes === 'string' ? Number(minutes) : minutes
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''

  const rounded = Math.max(1, Math.round(value))
  return `${rounded} min read`
}

/**
 * `hostFromUrl('https://www.reuters.com/world/')` -> `'reuters.com'`.
 * Returns '' for anything that is not a parseable http(s) URL.
 */
export function hostFromUrl(url) {
  if (typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  let host
  try {
    host = new URL(trimmed).hostname
  } catch {
    try {
      host = new URL(`https://${trimmed}`).hostname
    } catch {
      return ''
    }
  }

  if (!host) return ''

  const clean = host.replace(/\.$/, '').replace(/^www\./i, '').toLowerCase()

  // Must look registrable: at least one dot and only label-safe characters.
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(clean) ? clean : ''
}

/**
 * Truncate `text` to at most `maxChars`, breaking on a word boundary and
 * appending an ellipsis. Returns '' for falsy input.
 */
export function clamp(text, maxChars) {
  if (!text || typeof text !== 'string') return ''

  const clean = text.trim().replace(/\s+/g, ' ')
  const limit = typeof maxChars === 'number' && Number.isFinite(maxChars) ? Math.floor(maxChars) : 0

  if (limit <= 0) return clean
  if (clean.length <= limit) return clean

  const head = clean.slice(0, limit)
  const lastSpace = head.lastIndexOf(' ')
  const cut = lastSpace > Math.floor(limit * 0.5) ? head.slice(0, lastSpace) : head

  return `${cut.replace(/[\s,;:.!?—–-]+$/, '')}…`
}

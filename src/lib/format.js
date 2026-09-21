/**
 * Pure formatting helpers for Aware Daily.
 * No React, no side effects, and nothing here may throw on bad input.
 */

import { parseSourceUrl } from './sources.js'

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Validate components before Date can normalise an impossible calendar day. */
export function parseDateOnly(value) {
  if (typeof value !== 'string' || value.length !== 10) return null
  const match = DATE_ONLY.exec(value)
  if (!match) return null
  const [, y, m, d] = match
  const year = Number(y)
  const month = Number(m)
  const day = Number(d)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
    ? { year, month, day }
    : null
}

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
  const dateOnly = typeof iso === 'string' && !iso.includes('T')
  let date
  if (dateOnly) {
    const components = parseDateOnly(iso)
    if (!components) return ''
    // UTC is only a calendar-label container, never the reader's current day.
    date = new Date(0)
    date.setUTCFullYear(components.year, components.month - 1, components.day)
  } else {
    date = toDate(iso)
  }
  if (!date) return ''

  const parts = partsOf(
    date,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      ...(dateOnly ? { timeZone: 'UTC' } : {}) },
    'en-GB',
  )
  if (!parts || !parts.weekday) return ''

  const year = dateOnly ? String(Number(iso.slice(0, 4))) : parts.year
  return `${parts.weekday}, ${parts.day} ${parts.month} ${year}`
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
 * Returns '' unless the supplied URL passes the source-link policy.
 */
export function hostFromUrl(url) {
  const parsed = parseSourceUrl(url)
  return parsed ? parsed.hostname.replace(/\.$/, '').replace(/^www\./i, '').toLowerCase() : ''
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

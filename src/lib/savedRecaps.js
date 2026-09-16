import { copyRecap, MAX_STORE_LENGTH } from './savedStories.js'

export const SAVED_RECAPS_KEY = 'aware-daily:saved-recaps'
export const STORE_VERSION = 1
const STORAGE_ERROR = 'Catch-up changes are not persisted. Browser storage is blocked or full. Your changes remain in this tab for this session; previously stored catch-ups were not removed. Retry when storage is available.'
const CORRUPT_ERROR = 'Some saved catch-up data cannot be read. Original browser data is untouched and readable catch-ups remain available. Changes in this tab are not persisted. Retry only after readable storage is available.'
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const clusterOf = (entry) => entry.slug.trim() || entry.id

// Accept only unambiguous ISO dates, including a real calendar day.
function timestamp(value) {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(value.trim())
  if (!match) return null
  const day = Date.parse(`${match[1]}T00:00:00Z`)
  const time = Date.parse(value)
  return Number.isFinite(day) && new Date(day).toISOString().slice(0, 10) === match[1] &&
    Number.isFinite(time) ? time : null
}

function replacementMessage(existing, incoming) {
  const before = timestamp(existing.as_of)
  const after = timestamp(incoming.as_of)
  if (before === null || after === null) {
    return 'Kept the existing saved catch-up because one of the dates is missing or invalid. No replacement was made.'
  }
  return after <= before
    ? 'Kept the existing saved catch-up because it is newer or has the same date. No replacement was made.'
    : ''
}

const newestFirst = (entries) => [...entries].sort((a, b) =>
  (timestamp(b.as_of) ?? -Infinity) - (timestamp(a.as_of) ?? -Infinity))

function malformedFields(raw) {
  const strings = ['id', 'slug', 'title', 'as_of', 'orient', 'now', 'stakes',
    'confidence', 'coverage_note', 'generated_by']
  if (strings.some((key) => raw[key] !== undefined && typeof raw[key] !== 'string')) return true
  if (raw.days_covered !== undefined && raw.days_covered !== null && !Number.isFinite(raw.days_covered)) return true
  for (const key of ['story_ids', 'ground', 'next']) {
    if (raw[key] !== undefined && (!Array.isArray(raw[key]) ||
        raw[key].some((item) => typeof item !== 'string'))) return true
  }
  for (const [key, names] of [
    ['cast', ['name', 'flag', 'role', 'position']],
    ['path', ['date', 'headline', 'what', 'why_it_mattered']],
    ['sources', ['source', 'title', 'url']],
  ]) {
    if (raw[key] === undefined) continue
    if (!Array.isArray(raw[key]) || raw[key].some((item) =>
      !(key === 'sources' && typeof item === 'string') &&
      (!object(item) || names.some((name) => item[name] !== undefined && typeof item[name] !== 'string')))) return true
  }
  return false
}

export function readSavedRecaps(getStorage) {
  let raw
  try {
    raw = getStorage().getItem(SAVED_RECAPS_KEY)
  } catch {
    return { entries: [], raw: null, writable: false, message: STORAGE_ERROR }
  }
  if (raw === null) return { entries: [], raw, writable: true, message: '' }
  let value
  try {
    value = JSON.parse(raw)
  } catch {
    return { entries: [], raw, writable: false, message: CORRUPT_ERROR }
  }
  const list = Array.isArray(value) ? value
    : object(value) && value.version === STORE_VERSION && Array.isArray(value.entries) ? value.entries : null
  if (!list) return { entries: [], raw, writable: false, message: CORRUPT_ERROR }
  let damaged = false
  const entries = []
  for (const item of list) {
    const entry = copyRecap(item)
    if (!entry) {
      damaged = true
      continue
    }
    entry.id = entry.id.trim()
    entry.slug = entry.slug.trim()
    damaged ||= malformedFields(item)
    const index = entries.findIndex((saved) => clusterOf(saved) === clusterOf(entry) || saved.id === entry.id)
    if (index < 0) entries.push(entry)
    else {
      damaged = true
      if (!replacementMessage(entries[index], entry)) entries[index] = entry
    }
  }
  return { entries: newestFirst(entries), raw, writable: !damaged, message: damaged ? CORRUPT_ERROR : '' }
}

export function applySavedRecapOperation(entries, operation) {
  if (operation.type === 'clear') return { entries: [], message: '' }
  if (operation.type === 'remove') return { entries: entries.filter((entry) => entry.id !== operation.id), message: '' }
  const incoming = operation.entry
  const existing = entries.find((entry) => clusterOf(entry) === clusterOf(incoming) || entry.id === incoming.id)
  const message = existing ? replacementMessage(existing, incoming) : ''
  if (message) return { entries, message }
  return { entries: newestFirst([incoming, ...entries.filter((entry) => entry !== existing)]), message: '' }
}

export function createSavedRecapStore(getStorage) {
  let state = { ...readSavedRecaps(getStorage), pending: false }
  let base = state.entries
  let pending = []
  const listeners = new Set()
  const emit = () => listeners.forEach((listener) => listener())
  function readBase(fresh) {
    if (fresh.writable) base = fresh.entries
    else {
      // A failed read cannot erase last-readable content or pending clear/remove intent.
      for (const entry of fresh.entries) {
        base = applySavedRecapOperation(base, { type: 'add', entry }).entries
      }
    }
  }
  function applyPending() {
    return pending.reduce((result, operation) => {
      const next = applySavedRecapOperation(result.entries, operation)
      return { entries: next.entries, message: next.message || result.message }
    }, { entries: base, message: '' })
  }
  function persist(operation) {
    const fresh = readSavedRecaps(getStorage)
    readBase(fresh)
    if (operation?.type === 'add' && !pending.length && fresh.writable) {
      const outcome = applySavedRecapOperation(base, operation)
      if (outcome.message) {
        state = { ...fresh, entries: base, pending: false, message: outcome.message }
        emit()
        return true
      }
    }
    if (operation) pending.push(operation)
    const applied = applyPending()
    let message = fresh.message
    let succeeded = false
    let nextRaw = fresh.raw
    if (fresh.writable) {
      nextRaw = JSON.stringify({ version: STORE_VERSION, entries: applied.entries })
      if (nextRaw.length > MAX_STORE_LENGTH) {
        message = 'Catch-up changes are not persisted: the local archive size limit was reached. No older catch-ups were removed. Changes remain in this tab only. Remove an unwanted catch-up explicitly, then retry.'
      } else {
        try {
          const storage = getStorage()
          // This detects intervening changes, not an atomic cross-tab lock.
          if (storage.getItem(SAVED_RECAPS_KEY) !== fresh.raw) {
            message = 'Catch-up changes are not persisted because another tab changed the archive. Your changes remain in this tab. Retry to use the latest archive.'
          } else {
            if (pending.at(-1)?.type === 'clear') {
              if (fresh.raw !== null) storage.removeItem(SAVED_RECAPS_KEY)
              nextRaw = null
            } else storage.setItem(SAVED_RECAPS_KEY, nextRaw)
            succeeded = true
          }
        } catch {
          message = STORAGE_ERROR
        }
      }
    }
    if (succeeded) {
      pending = []
      base = applied.entries
    }
    state = { ...fresh, entries: applied.entries, raw: succeeded ? nextRaw : fresh.raw,
      pending: pending.length > 0,
      message: [succeeded ? 'Catch-up changes persisted in this browser.' : message, applied.message].filter(Boolean).join(' ') }
    emit()
    return succeeded
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    refresh: () => {
      // Read the actual key, never event.newValue, which may already be obsolete.
      const fresh = readSavedRecaps(getStorage)
      readBase(fresh)
      const applied = applyPending()
      state = { ...fresh, entries: applied.entries, pending: pending.length > 0,
        message: [fresh.message || (pending.length ? STORAGE_ERROR : ''), applied.message].filter(Boolean).join(' ') }
      emit()
    },
    toggle: (value) => {
      const entry = typeof value === 'string' ? null : copyRecap(value)
      const id = typeof value === 'string' ? value.trim() : entry?.id.trim()
      if (!id) return false
      if (typeof value === 'string' || state.entries.some((saved) => saved.id === id)) {
        return persist({ type: 'remove', id })
      }
      entry.id = id
      return persist({ type: 'add', entry })
    },
    remove: (id) => persist({ type: 'remove', id }),
    clear: () => persist({ type: 'clear' }),
    retry: () => pending.length ? persist() : false,
  }
}

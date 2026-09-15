import { normaliseSources } from './sources.js'

export const SAVED_STORIES_KEY = 'aware-daily:saved-stories'
export const LEGACY_SAVED_KEY = 'aware-daily:saved'
export const STORE_VERSION = 1
// UTF-16 code units, at most about 4 MB. Reject writes, never trim older saves.
export const MAX_STORE_LENGTH = 2_000_000

const object = (value) => value && typeof value === 'object' && !Array.isArray(value)
const text = (value) => typeof value === 'string' ? value : ''
const array = (value) => Array.isArray(value) ? value : []
const strings = (value) => array(value).filter((item) => typeof item === 'string')
const fields = (value, names) => Object.fromEntries(names.map((name) => [name, text(value?.[name])]))
const numbers = (value, names) => Object.fromEntries(names.map((name) => [
  name, Number.isFinite(value?.[name]) ? value[name] : null,
]))
const numberMap = (value) => Object.fromEntries(
  Object.entries(object(value) ? value : {}).filter(([, item]) => Number.isFinite(item)),
)

export function storyKey(id, edition) {
  return JSON.stringify([text(edition?.date) || text(edition?.generatedAt) || 'unknown-edition', text(id)])
}

function copyStory(raw) {
  if (!object(raw) || !text(raw.id).trim() ||
      typeof raw.headline !== 'string' || typeof raw.body !== 'string') return null
  return {
    ...fields(raw, ['id', 'category', 'tier', 'headline', 'dek', 'body', 'so_what', 'what_now',
      'region', 'pattern', 'date', 'why_ranked', 'recap_id']),
    ...numbers(raw, ['rank', 'score', 'read_time_min', 'source_count']),
    topics: strings(raw.topics),
    countries: array(raw.countries).filter(object).map((item) => fields(item, ['name', 'flag', 'role'])),
    sources: normaliseSources(raw.sources),
    scores: numberMap(raw.scores),
    consequence: numberMap(raw.consequence),
  }
}

function copyRecap(raw) {
  if (!object(raw) || !text(raw.id).trim()) return null
  return {
    ...fields(raw, ['id', 'slug', 'title', 'as_of', 'orient', 'now', 'stakes', 'confidence',
      'coverage_note', 'generated_by']),
    ...numbers(raw, ['days_covered']),
    story_ids: strings(raw.story_ids),
    ground: strings(raw.ground),
    next: strings(raw.next),
    cast: array(raw.cast).filter(object).map((item) => fields(item, ['name', 'flag', 'role', 'position'])),
    path: array(raw.path).filter(object).map((item) => fields(item, ['date', 'headline', 'what', 'why_it_mattered'])),
    sources: normaliseSources(raw.sources),
  }
}

export function createStorySnapshot(story, edition, category, recap, savedAt = Date.now()) {
  const copy = copyStory(story)
  if (!copy) return null
  const linkedRecap = copyRecap(recap)
  return {
    key: storyKey(copy.id, edition),
    id: copy.id,
    status: 'readable',
    savedAt,
    edition: fields(edition, ['date', 'generatedAt']),
    category: { ...fields(category, ['key', 'label', 'emoji']), ...numbers(category, ['count']) },
    story: copy,
    recap: linkedRecap?.id === copy.recap_id ? linkedRecap : null,
  }
}

function unavailable(id) {
  return { key: JSON.stringify(['legacy', id]), id, status: 'unavailable', savedAt: 0 }
}

export function normaliseSavedEntry(raw) {
  if (!object(raw) || !text(raw.id).trim()) return null
  if (raw.status === 'unavailable') return unavailable(raw.id)
  if (raw.status !== 'readable' || raw.id !== raw.story?.id || !object(raw.edition)) return null
  const copy = createStorySnapshot(raw.story, raw.edition, raw.category, raw.recap,
    Number.isFinite(raw.savedAt) ? raw.savedAt : 0)
  return copy && copy.key === raw.key ? copy : null
}

const STORAGE_ERROR = 'Story changes are not persisted. Browser storage is blocked or full. This tab keeps your changes for this session; previously stored stories were not removed.'
const CORRUPT_ERROR = 'Some saved-story data cannot be read. The original browser data has been left untouched. Usable stories remain available; changes in this tab are not persisted.'

export function readSavedStories(getStorage, snapshotForId) {
  let raw = null
  let legacyRaw = null
  try {
    const storage = getStorage()
    raw = storage.getItem(SAVED_STORIES_KEY)
    if (raw !== null) {
      if (raw.length > MAX_STORE_LENGTH) throw new Error('Store size')
      const value = JSON.parse(raw)
      if (!object(value) || value.version !== STORE_VERSION || !Array.isArray(value.entries)) {
        throw new Error('Store format')
      }
      let damaged = false
      const seen = new Set()
      const entries = []
      for (const item of value.entries) {
        const entry = normaliseSavedEntry(item)
        if (!entry || seen.has(entry.key)) {
          damaged = true
          continue
        }
        seen.add(entry.key)
        entries.push(entry)
      }
      return { entries, raw, legacyRaw, writable: !damaged, migrate: false, message: damaged ? CORRUPT_ERROR : '' }
    }
    legacyRaw = storage.getItem(LEGACY_SAVED_KEY)
    if (legacyRaw === null) return { entries: [], raw, legacyRaw, writable: true, migrate: false, message: '' }
    if (legacyRaw.length > MAX_STORE_LENGTH) throw new Error('Legacy size')
    const ids = JSON.parse(legacyRaw)
    if (!Array.isArray(ids)) throw new Error('Legacy format')
    const valid = [...new Set(ids.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim()))]
    const entries = valid.map((id) => snapshotForId(id) || unavailable(id))
    // The legacy key is never deleted or rewritten, even when individual IDs are malformed.
    return { entries, raw, legacyRaw, writable: true, migrate: true, message: '' }
  } catch {
    return { entries: [], raw, legacyRaw, writable: false, migrate: false, message: raw !== null || legacyRaw !== null ? CORRUPT_ERROR : STORAGE_ERROR }
  }
}

export function applySavedOperation(entries, operation) {
  if (operation.type === 'clear') return []
  if (operation.type === 'remove') return entries.filter((entry) => entry.key !== operation.key)
  if (operation.type === 'add' && !entries.some((entry) => entry.key === operation.entry.key)) {
    return [operation.entry, ...entries]
  }
  return entries
}

// Writes happen only on explicit changes or valid legacy migration, never on a render.
export function createSavedStoryStore(getStorage, snapshotForId) {
  let state = readSavedStories(getStorage, snapshotForId)
  let pending = []
  const listeners = new Set()
  const emit = () => listeners.forEach((listener) => listener())
  const applyPending = (entries) => pending.reduce(applySavedOperation, entries)

  function persist(operation) {
    if (operation) pending.push(operation)
    const fresh = readSavedStories(getStorage, snapshotForId)
    const entries = applyPending(fresh.writable ? fresh.entries : state.entries)
    let message = fresh.message
    let nextRaw = fresh.raw
    let succeeded = false
    if (fresh.writable) {
      try {
        nextRaw = JSON.stringify({ version: STORE_VERSION, entries })
        if (nextRaw.length > MAX_STORE_LENGTH) {
          message = 'Story changes are not persisted: the local archive limit is 2,000,000 text units (about 4 MB). No older saves were removed. Changes remain in this tab only.'
        } else {
          const storage = getStorage()
          // Rebase onto the latest store above, then reject if it changed during preparation.
          if (storage.getItem(SAVED_STORIES_KEY) !== fresh.raw ||
              (fresh.raw === null && storage.getItem(LEGACY_SAVED_KEY) !== fresh.legacyRaw)) {
            message = 'Story changes are not persisted because another tab changed the archive. Your changes remain in this tab. Try the action again.'
          } else {
            storage.setItem(SAVED_STORIES_KEY, nextRaw)
            succeeded = true
          }
        }
      } catch {
        message = STORAGE_ERROR
      }
    }
    if (succeeded) pending = []
    state = { ...fresh, entries, raw: succeeded ? nextRaw : fresh.raw,
      migrate: succeeded ? false : fresh.migrate, message: succeeded ? '' : message }
    emit()
  }

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: () => {
      if (state.migrate && state.writable) persist()
    },
    refresh: () => {
      const fresh = readSavedStories(getStorage, snapshotForId)
      state = { ...fresh,
        // Recovered entries must honor pending intent, including an empty session after remove/clear.
        entries: applyPending(fresh.writable ? fresh.entries : state.entries.length ? state.entries : fresh.entries),
        message: fresh.message || (pending.length ? STORAGE_ERROR : ''),
      }
      emit()
    },
    toggle: (entry) => {
      if (!entry?.key) return
      const exists = state.entries.some((item) => item.key === entry.key)
      persist(exists ? { type: 'remove', key: entry.key } : { type: 'add', entry })
    },
    remove: (key) => persist({ type: 'remove', key }),
    clear: () => persist({ type: 'clear' }),
  }
}

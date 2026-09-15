export const READ_STORAGE_KEY = 'aware-daily:read'

export function sanitizeReadIds(ids, validIds) {
  const allowed = new Set(validIds)
  return [...new Set(Array.isArray(ids) ? ids : [])]
    .filter((id) => typeof id === 'string' && id.length > 0 && allowed.has(id))
}

export function parseReadStore(raw) {
  if (raw === null) return {}
  const store = JSON.parse(raw)
  if (!store || typeof store !== 'object' || Array.isArray(store)) {
    throw new Error('Invalid reading progress')
  }
  return store
}

const NOT_PERSISTED = 'Reading progress is not persisted. Your changes are available only in this session.'
const UNREADABLE = 'Stored reading progress could not be read. Changes are not persisted; existing stored data is left untouched.'

// Only explicit actions write. Refreshing from another tab never writes back.
export function createReadProgressStore(getStorage) {
  const listeners = new Set()
  const pending = new Map()
  let snapshot = { store: {}, message: '' }

  function load() {
    try {
      return { store: parseReadStore(getStorage().getItem(READ_STORAGE_KEY)), readable: true }
    } catch {
      return { store: snapshot.store, readable: false }
    }
  }

  function publish(store, message) {
    snapshot = { store, message }
    listeners.forEach((listener) => listener())
  }

  function withPending(store) {
    const result = { ...store }
    for (const [editionKey, entry] of pending) {
      const ids = new Set(sanitizeReadIds(result[editionKey], entry.validIds))
      for (const [id, read] of entry.changes) {
        if (read) ids.add(id)
        else ids.delete(id)
      }
      result[editionKey] = sanitizeReadIds([...ids], entry.validIds)
    }
    return result
  }

  function refresh() {
    const loaded = load()
    publish(withPending(loaded.store), !loaded.readable
      ? UNREADABLE : pending.size ? NOT_PERSISTED : '')
  }

  function update(editionKey, validIds, updater) {
    const loaded = load()
    const base = withPending(loaded.store)
    const currentIds = sanitizeReadIds(base[editionKey], validIds)
    const ids = sanitizeReadIds(updater(currentIds), validIds)
    const next = { ...base, [editionKey]: ids }
    // Keep failed changes per ID so other tabs' unrelated reads still arrive.
    const changes = new Map(pending.get(editionKey)?.changes)
    const before = new Set(currentIds)
    const after = new Set(ids)
    for (const id of new Set([...currentIds, ...ids])) {
      if (before.has(id) !== after.has(id)) changes.set(id, after.has(id))
    }
    pending.set(editionKey, { validIds: [...validIds], changes })
    let message = loaded.readable ? NOT_PERSISTED : UNREADABLE
    if (loaded.readable) {
      try {
        getStorage().setItem(READ_STORAGE_KEY, JSON.stringify(next))
        pending.clear()
        message = ''
      } catch {
        // Keep the local changes available for this session and the next action.
      }
    }
    publish(next, message)
  }

  refresh()
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    refresh,
    update,
  }
}

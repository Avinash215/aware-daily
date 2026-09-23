/**
 * A small persisted store for one browser-local record.
 *
 * Used by the personal features (interests, likes, follows, quiz scores).
 * Pending absolute values/removals are rebased before writes and refreshes.
 * Local pending intent wins a same-field/key conflict at retry time. This is
 * best-effort cross-tab merging, not an atomic lock.
 */

const SESSION_ONLY = 'Personal changes are not persisted. They remain in this tab for this session only. Browser storage is blocked or full; retry when it is available.'
const UNREADABLE = 'Stored personal data could not be read safely. Changes are not persisted and remain in this tab for this session only. The stored copy is untouched; retry after readable storage is available.'
const CONFLICT = 'Personal changes are not persisted because another tab changed storage. They remain in this tab for this session only; retry to merge with the latest stored copy.'

function equal(a, b) {
  if (a === b) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]))
}

export function createLocalStore({ key, version = 1, empty, sanitize = (value) => value, getStorage, merge = 'fields' }) {
  const storage = () => {
    try {
      return getStorage ? getStorage() : window.localStorage
    } catch {
      return null
    }
  }
  const listeners = new Set()
  let base = sanitize(empty())
  let snapshot = { value: base, message: '', pending: false, pendingKeys: [] }
  const pending = new Map()

  function values(value) {
    if (merge === 'entries') return new Map(value.entries.map((entry) => [entry.key, entry]))
    return new Map(Object.entries(merge === 'editions' ? value.editions : value))
  }

  function applyPending() {
    const merged = values(base)
    for (const [key, operation] of pending) {
      if (operation.remove) merged.delete(key)
      else merged.set(key, operation.value)
    }
    if (merge === 'entries') return sanitize({ ...base, entries: [...merged.values()] })
    if (merge === 'editions') return sanitize({ ...base, editions: Object.fromEntries(merged) })
    return sanitize(Object.fromEntries(merged))
  }

  function read() {
    const store = storage()
    if (!store) return { ok: false, value: null }
    let raw
    try {
      raw = store.getItem(key)
    } catch {
      return { ok: false, value: null }
    }
    if (raw === null) return { ok: true, value: sanitize(empty()), raw, store }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, value: null }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.version !== version) return { ok: false, value: null }
    const value = sanitize(parsed.data)
    // Sanitizing damaged data is not permission to overwrite its original bytes.
    if (!equal(value, parsed.data)) return { ok: false, value: null }
    return { ok: true, value, raw, store }
  }

  function publish(value, message) {
    snapshot = { value, message, pending: pending.size > 0, pendingKeys: [...pending.keys()] }
    listeners.forEach((listener) => listener())
  }

  function refresh() {
    const loaded = read()
    if (loaded.ok) base = loaded.value
    publish(applyPending(), loaded.ok ? pending.size ? SESSION_ONLY : '' : UNREADABLE)
  }

  function persist(updater) {
    const loaded = read()
    if (loaded.ok) base = loaded.value
    const current = applyPending()
    if (updater) {
      const before = values(current)
      const after = values(sanitize(updater(current)))
      // Diff against the rebased view, never against a stale rendered snapshot.
      for (const key of new Set([...before.keys(), ...after.keys()])) {
        if (before.has(key) === after.has(key) && equal(before.get(key), after.get(key))) continue
        pending.set(key, after.has(key) ? { value: after.get(key) } : { remove: true })
      }
    }
    const next = applyPending()
    if (!loaded.ok) {
      publish(next, UNREADABLE)
      return false
    }
    const raw = JSON.stringify({ version, data: next })
    let changed
    try {
      // Detect an intervening change without claiming atomic cross-tab locking.
      changed = loaded.store.getItem(key) !== loaded.raw
      if (!changed) loaded.store.setItem(key, raw)
    } catch {
      publish(next, SESSION_ONLY)
      return false
    }
    if (changed) {
      publish(next, CONFLICT)
      return false
    }
    pending.clear()
    base = next
    publish(next, '')
    return true
  }

  refresh()

  return {
    key,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    refresh,
    update: (updater) => persist(updater),
    retry: () => pending.size ? persist() : false,
  }
}

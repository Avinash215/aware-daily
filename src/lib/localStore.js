/**
 * A small persisted store for one browser-local record.
 *
 * Used by the personal features (interests, likes, follows, quiz scores).
 * Every write rereads the latest stored value first, so another tab's change
 * is never overwritten by a stale copy. Blocked storage, corrupt JSON and an
 * unsupported version never throw: the change stays available for this
 * session, the stored bytes are left untouched, and `message` says so.
 */

const SESSION_ONLY = 'This change is kept for this session only; the browser did not let Aware store it.'
const UNREADABLE = 'Stored settings could not be read. Changes stay in this session and the stored copy is left untouched.'

export function createLocalStore({ key, version = 1, empty, sanitize = (value) => value, getStorage }) {
  const storage = () => {
    try {
      return getStorage ? getStorage() : window.localStorage
    } catch {
      return null
    }
  }
  const listeners = new Set()
  let snapshot = { value: sanitize(empty()), message: '' }
  let dirty = false

  function read() {
    const store = storage()
    if (!store) return { ok: false, value: null }
    let raw
    try {
      raw = store.getItem(key)
    } catch {
      return { ok: false, value: null }
    }
    if (raw === null) return { ok: true, value: sanitize(empty()) }
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || parsed.version !== version) return { ok: false, value: null }
      return { ok: true, value: sanitize(parsed.data) }
    } catch {
      return { ok: false, value: null }
    }
  }

  function publish(value, message) {
    snapshot = { value, message }
    listeners.forEach((listener) => listener())
  }

  function refresh() {
    // A session-only change is not replaced by the stored copy it failed to write.
    if (dirty) return
    const loaded = read()
    publish(loaded.ok ? loaded.value : snapshot.value, loaded.ok ? '' : UNREADABLE)
  }

  function update(updater) {
    const loaded = read()
    const base = loaded.ok && !dirty ? loaded.value : snapshot.value
    const next = sanitize(updater(base))
    if (!loaded.ok) {
      dirty = true
      publish(next, UNREADABLE)
      return false
    }
    try {
      storage().setItem(key, JSON.stringify({ version, data: next }))
      dirty = false
      publish(next, '')
      return true
    } catch {
      dirty = true
      publish(next, SESSION_ONLY)
      return false
    }
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
    update,
  }
}

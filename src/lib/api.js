/**
 * The browser side of the community and local-news API.
 *
 * The API only exists where Aware is deployed with it (Azure Static Web Apps).
 * Everywhere else, including GitHub Pages and the Vite dev server, `/api/me`
 * does not answer with JSON and every community surface stays hidden; the
 * browser-local features keep working unchanged.
 */

const TIMEOUT_MS = 8000

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code || `HTTP ${status}`)
    this.status = status
    this.code = code
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const type = response.headers.get('content-type') || ''
    const data = type.includes('application/json') ? await response.json().catch(() => null) : null
    if (!response.ok || data === null) {
      throw new ApiError(response.status, data?.error || (data === null ? 'not_json' : 'failed'), data?.message)
    }
    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, error?.name === 'AbortError' ? 'timeout' : 'network')
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchMe() {
  try {
    const me = await request('/api/me')
    return {
      available: true,
      community: Boolean(me.community),
      localNews: Boolean(me.localNews),
      signedIn: Boolean(me.signedIn),
      moderator: Boolean(me.moderator),
      displayName: typeof me.displayName === 'string' ? me.displayName : '',
      provider: typeof me.provider === 'string' ? me.provider : '',
    }
  } catch {
    return { available: false, community: false, localNews: false, signedIn: false, moderator: false, displayName: '', provider: '' }
  }
}

const here = () => (typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`)

export const loginUrl = (provider) =>
  `/.auth/login/${provider === 'github' ? 'github' : 'aad'}?post_login_redirect_uri=${encodeURIComponent(here())}`

export const logoutUrl = () => `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(here())}`

const qs = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')).toString()

export const getStats = (edition) => request(`/api/social/stats?${qs({ edition })}`)
export const toggleLike = (payload) => request('/api/social/like', { method: 'POST', body: payload })
export const getComments = (edition, storyId) => request(`/api/social/comments?${qs({ edition, storyId })}`)
export const postComment = (payload) => request('/api/social/comments', { method: 'POST', body: payload })
export const reportComment = (payload) => request('/api/social/report', { method: 'POST', body: payload })
export const getLeaderboard = (days, today) => request(`/api/social/leaderboard?${qs({ days, today })}`)
export const getModeration = () => request('/api/social/moderation')
export const moderateComment = (payload) => request('/api/social/moderation', { method: 'POST', body: payload })
const localCache = new Map()
const LOCAL_TTL_MS = 20 * 60 * 1000

/** Local headlines for the reader's own town; the place goes in the body, never the URL. */
export async function getLocalHeadlines(place, country) {
  const key = `${String(place).trim().toLowerCase()}|${String(country || '').trim().toLowerCase()}`
  const cached = localCache.get(key)
  if (cached && Date.now() - cached.at < LOCAL_TTL_MS) return cached.value
  const value = await request('/api/local', { method: 'POST', body: { place, country } })
  localCache.set(key, { at: Date.now(), value })
  return value
}

/** "3h ago", "2d ago", or a short date, for timestamps in lists. */
export function timeAgo(value, now = Date.now()) {
  const time = typeof value === 'number' ? value : Date.parse(value)
  if (!Number.isFinite(time)) return ''
  const minutes = Math.max(0, Math.round((now - time) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 8) return `${days}d ago`
  return new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

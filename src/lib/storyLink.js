/**
 * Links to one story in today's edition: `#story=<id>`. A fragment never
 * reaches the server, works on every host path (Static Web Apps and the
 * GitHub Pages copy under /aware-daily/) and needs no routing config.
 */

const STORY_ID = /^[a-z0-9][a-z0-9-]{0,199}$/
const PREFIX = '#story='

export function storyIdFromHash(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(PREFIX)) return null
  let id
  try {
    id = decodeURIComponent(hash.slice(PREFIX.length))
  } catch {
    return null
  }
  return STORY_ID.test(id) ? id : null
}

export const isStoryHash = (hash) => typeof hash === 'string' && hash.startsWith(PREFIX)

export function storyHash(id) {
  return STORY_ID.test(String(id || '')) ? `${PREFIX}${id}` : ''
}

/** The shareable address of a story, or '' when there is no valid id or location. */
export function storyUrl(id, location = typeof window === 'undefined' ? null : window.location) {
  const hash = storyHash(id)
  if (!hash || !location?.origin || location.origin === 'null') return ''
  return `${location.origin}${location.pathname || '/'}${location.search || ''}${hash}`
}

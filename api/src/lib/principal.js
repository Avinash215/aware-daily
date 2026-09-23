/**
 * The signed-in reader, as Static Web Apps hands it to managed functions in
 * the base64-encoded `x-ms-client-principal` header. Anything missing or
 * malformed is treated as signed out; nothing here trusts the browser.
 */

export function readPrincipal(headers) {
  const raw = typeof headers?.get === 'function' ? headers.get('x-ms-client-principal') : null
  if (!raw) return null
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    const userId = typeof decoded?.userId === 'string' ? decoded.userId.trim() : ''
    const roles = Array.isArray(decoded?.userRoles) ? decoded.userRoles.filter((role) => typeof role === 'string') : []
    if (!userId || !roles.includes('authenticated')) return null
    return {
      userId: userId.slice(0, 128),
      provider: typeof decoded.identityProvider === 'string' ? decoded.identityProvider.toLowerCase().slice(0, 32) : '',
      userDetails: typeof decoded.userDetails === 'string' ? decoded.userDetails.slice(0, 256) : '',
      roles,
    }
  } catch {
    return null
  }
}

/** `AWARE_MODERATORS` is a comma list of `provider:userDetails`, bare `userDetails`, or user IDs. */
export function moderatorList(value = process.env.AWARE_MODERATORS) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function isModerator(principal, moderators = moderatorList()) {
  if (!principal) return false
  if (principal.roles.includes('moderator')) return true
  const details = principal.userDetails.toLowerCase()
  const candidates = [principal.userId.toLowerCase(), details, `${principal.provider}:${details}`]
  return candidates.some((candidate) => candidate && moderators.includes(candidate))
}

/**
 * The name shown next to a reader's comments. GitHub handles are public
 * already; any other provider sends an email, which is never shown.
 */
export function defaultDisplayName(principal) {
  if (!principal) return 'Reader'
  if (principal.provider === 'github' && principal.userDetails && !principal.userDetails.includes('@')) {
    return principal.userDetails.slice(0, 40)
  }
  return `Reader ${principal.userId.slice(0, 6)}`
}

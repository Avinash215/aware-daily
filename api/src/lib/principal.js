/**
 * The signed-in reader. Two sources, never both:
 *
 * - Managed functions and local runs: Static Web Apps sends the base64
 *   `x-ms-client-principal` header ({ identityProvider, userId, userDetails,
 *   userRoles }).
 * - A linked Function App (App Service auth on, WEBSITE_AUTH_ENABLED=True):
 *   that header never arrives. Static Web Apps sends a signed
 *   `x-ms-auth-token` whose `prn` claim is the same principal, base64 JSON.
 *   App Service validates the token (direct calls without one are refused)
 *   and sets `x-ms-client-principal-id` / `-idp` itself; clients cannot set
 *   those. The token is only read when the provider is Static Web Apps and
 *   its `sub` matches the platform's principal ID, so it is the one App
 *   Service validated.
 *
 * Anything missing, malformed, expired or mismatched is treated as signed out.
 */

function decodeJson(value, encoding = 'base64') {
  if (typeof value !== 'string' || !value) return null
  try {
    return JSON.parse(Buffer.from(value, encoding).toString('utf8'))
  } catch {
    return null
  }
}

function normalize(decoded) {
  const userId = typeof decoded?.userId === 'string' ? decoded.userId.trim() : ''
  const roles = Array.isArray(decoded?.userRoles) ? decoded.userRoles.filter((role) => typeof role === 'string') : []
  if (!userId || !roles.includes('authenticated')) return null
  return {
    userId: userId.slice(0, 128),
    provider: typeof decoded.identityProvider === 'string' ? decoded.identityProvider.toLowerCase().slice(0, 32) : '',
    userDetails: typeof decoded.userDetails === 'string' ? decoded.userDetails.slice(0, 256) : '',
    roles,
  }
}

function linkedPrincipal(headers, now) {
  if (headers.get('x-ms-client-principal-idp') !== 'azureStaticWebApps') return null
  const platformId = headers.get('x-ms-client-principal-id')
  const payload = String(headers.get('x-ms-auth-token') || '').split('.')[1]
  const claims = payload ? decodeJson(payload, 'base64url') : null
  if (!claims || !platformId || claims.sub !== platformId) return null
  if (typeof claims.exp === 'number' && claims.exp * 1000 <= now) return null
  return normalize(decodeJson(claims.prn))
}

export function readPrincipal(headers, { env = process.env, now = Date.now() } = {}) {
  if (typeof headers?.get !== 'function') return null
  if (String(env.WEBSITE_AUTH_ENABLED || '').toLowerCase() === 'true') return linkedPrincipal(headers, now)
  return normalize(decodeJson(headers.get('x-ms-client-principal')))
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

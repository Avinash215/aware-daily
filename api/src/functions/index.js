import { app } from '@azure/functions'
import { createLocalNews } from '../lib/local.js'
import { readPrincipal } from '../lib/principal.js'
import { HttpError, communityMode, communityOpenTo, createSocial } from '../lib/social.js'
import { configuredStore } from '../lib/store.js'

/**
 * HTTP surface for the Static Web Apps managed API (served under /api).
 * Handlers stay thin: parse, call the pure module, map errors to JSON.
 */

const localHeadlines = createLocalNews()

const json = (status, body, headers = {}) => ({
  status,
  jsonBody: body,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
})

function social(principal) {
  const store = configuredStore()
  if (!store) throw new HttpError(503, 'community_unavailable', 'Community storage is not configured.')
  if (!communityOpenTo(principal)) throw new HttpError(503, 'community_unavailable', 'Community features are not open yet.')
  return createSocial({ store })
}

async function body(request) {
  // JSON only: a cross-site form post cannot send this content type without a CORS preflight.
  const type = request.headers.get('content-type') || ''
  if (!type.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'json_required')
  const text = await request.text()
  if (text.length > 8000) throw new HttpError(413, 'too_large')
  try {
    return JSON.parse(text || '{}')
  } catch {
    throw new HttpError(400, 'bad_json')
  }
}

function handle(work) {
  return async (request, context) => {
    try {
      return await work(request, readPrincipal(request.headers))
    } catch (error) {
      if (error instanceof HttpError) return json(error.status, { error: error.code, message: error.message })
      if (error?.code && Number.isInteger(error?.status)) return json(error.status, { error: error.code })
      context.error(`aware api failure: ${error?.name || 'Error'} ${error?.statusCode || ''}`)
      return json(500, { error: 'server_error' })
    }
  }
}

const query = (request, name) => request.query.get(name) || ''

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'me',
  handler: handle(async (request, principal) => {
    const store = configuredStore()
    const mode = communityMode()
    const me = await createSocial({ store: store || {} }).me(principal)
    const community = Boolean(store) && communityOpenTo(principal, mode)
    return json(200, { ...me, community, preview: community && mode === 'preview', localNews: true })
  }),
})

app.http('socialStats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'social/stats',
  handler: handle(async (request, principal) => json(200, await social(principal).stats(principal, { edition: query(request, 'edition') }))),
})

app.http('socialLike', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'social/like',
  handler: handle(async (request, principal) => json(200, await social(principal).toggleLike(principal, await body(request)))),
})

app.http('socialComments', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'social/comments',
  handler: handle(async (request, principal) => {
    if (request.method === 'POST') return json(201, await social(principal).addComment(principal, await body(request)))
    return json(200, await social(principal).listComments(principal, { edition: query(request, 'edition'), storyId: query(request, 'storyId') }))
  }),
})

app.http('socialReport', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'social/report',
  handler: handle(async (request, principal) => json(200, await social(principal).report(principal, await body(request)))),
})

app.http('socialLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'social/leaderboard',
  handler: handle(async (request, principal) => json(200, await social(principal).leaderboard(principal, {
    days: query(request, 'days'),
    today: query(request, 'today'),
  }))),
})

app.http('socialModeration', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'social/moderation',
  handler: handle(async (request, principal) => {
    if (request.method === 'POST') return json(200, await social(principal).moderate(principal, await body(request)))
    return json(200, await social(principal).moderationQueue(principal))
  }),
})

app.http('localNews', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'local',
  handler: handle(async (request) => {
    const input = await body(request)
    return json(200, await localHeadlines({ place: input.place, country: input.country }))
  }),
})

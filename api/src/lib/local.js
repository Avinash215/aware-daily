/**
 * Local headlines for one reader's chosen place.
 *
 * The place arrives in the body of a POST (never the URL, which platforms
 * log), is used for a single Google News RSS search, and is not stored,
 * cached or logged here. Only headline, outlet, time and the link to the
 * original are returned; Aware does not summarise these. The reader's own
 * browser caches its results.
 */

const PLACE = /^[\p{L}\p{N}][\p{L}\p{N} .,'’()-]{1,79}$/u
const MAX_ITEMS = 8

// Search results that are not news: listings, directories, film-location and
// job sites, and bare fixture or box-score pages.
const NOT_NEWS_SOURCE = /\b(realtor\.com|zillow|redfin|trulia|apartments\.com|homes\.com|rent\.com|movoto|loopnet|maxpreps|yelp|tripadvisor|eventbrite|movie locations|indeed|glassdoor|opentable)\b/i
const ADDRESS_TITLE = /^\d+[a-z]?\s+\S.*\b(ave|avenue|st|street|rd|road|blvd|boulevard|dr|drive|ln|lane|way|pl|place|ct|court|ter|terrace|pkwy|parkway|hwy)\b.*(\bunit\b|\bapt\b|#\s*\w+|\b\d{5}(-\d{4})?\b)/i
const FIXTURE_TITLE = /^[^:]{2,60}\s(vs\.?|@)\s[^:]{2,60}$/i
const SCORE_PAGE = /\b(play-by-play|box score|live game updates|head-to-head)\b/i

export function isNews(item) {
  return !NOT_NEWS_SOURCE.test(item.source || '')
    && !ADDRESS_TITLE.test(item.title)
    && !FIXTURE_TITLE.test(item.title)
    && !SCORE_PAGE.test(item.title)
}

// Google News editions that publish in English. Anything else uses the US edition.
const EDITIONS = {
  'united states': 'US', 'united kingdom': 'GB', canada: 'CA', australia: 'AU', india: 'IN',
  'new zealand': 'NZ', ireland: 'IE', singapore: 'SG', 'south africa': 'ZA', philippines: 'PH',
  nigeria: 'NG', kenya: 'KE', pakistan: 'PK', malaysia: 'MY', ghana: 'GH', uganda: 'UG',
  zimbabwe: 'ZW', botswana: 'BW', namibia: 'NA', tanzania: 'TZ', ethiopia: 'ET', israel: 'IL',
  'united arab emirates': 'AE', 'saudi arabia': 'SA', lebanon: 'LB', bangladesh: 'BD',
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decode(text) {
  return String(text || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
      if (code[0] === '#') {
        const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
        return Number.isFinite(value) ? String.fromCodePoint(value) : match
      }
      return ENTITIES[code.toLowerCase()] ?? match
    })
    .trim()
}

function tag(block, name) {
  const match = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block)
  return match ? decode(match[1]) : ''
}

export function parseRss(xml) {
  const items = []
  const pattern = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let match
  while ((match = pattern.exec(xml))) {
    const block = match[1]
    const source = tag(block, 'source')
    let title = tag(block, 'title')
    // Google News appends " - Outlet" to every title; the outlet is shown separately.
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim()
    const link = tag(block, 'link')
    const published = Date.parse(tag(block, 'pubDate'))
    if (!title || !/^https:\/\//.test(link)) continue
    items.push({ title, source, link, published: Number.isFinite(published) ? new Date(published).toISOString() : null })
  }
  return items
}

export function editionFor(country) {
  return EDITIONS[String(country || '').trim().toLowerCase()] || 'US'
}

export function searchQuery(place) {
  const [head, ...rest] = place.split(',').map((part) => part.trim()).filter(Boolean)
  const qualifier = rest.join(' ')
  return `"${head}"${qualifier ? ` ${qualifier}` : ''} when:3d`
}

export function validPlace(value) {
  const place = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  return PLACE.test(place) ? place : ''
}

export function createLocalNews({ fetchImpl = fetch, now = () => Date.now() } = {}) {
  return async function localHeadlines({ place: rawPlace, country }) {
    const place = validPlace(rawPlace)
    if (!place) {
      const error = new Error('bad_place')
      error.status = 400
      error.code = 'bad_place'
      throw error
    }
    const gl = editionFor(country)

    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery(place))}&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    let xml
    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'aware-daily/1.0 (+https://github.com/Avinash215/aware-daily)', Accept: 'application/rss+xml, application/xml' },
      })
      if (!response.ok) {
        const error = new Error('upstream_failed')
        error.status = 502
        error.code = 'upstream_failed'
        throw error
      }
      xml = await response.text()
    } catch (error) {
      if (error.status) throw error
      const wrapped = new Error('upstream_unreachable')
      wrapped.status = 502
      wrapped.code = 'upstream_unreachable'
      throw wrapped
    } finally {
      clearTimeout(timer)
    }

    const seen = new Set()
    const items = parseRss(xml)
      .filter(isNews)
      .filter((item) => {
        const folded = item.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
        if (seen.has(folded)) return false
        seen.add(folded)
        return true
      })
      .sort((a, b) => (b.published || '').localeCompare(a.published || ''))
      .slice(0, MAX_ITEMS)

    return { place, edition: gl, source: 'Google News', fetchedAt: new Date(now()).toISOString(), items }
  }
}

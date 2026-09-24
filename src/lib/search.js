/**
 * Search across today's edition, entirely in the browser. Every word of the
 * query must appear somewhere in the story (headline, dek, body, the "so
 * what" lines, topics, region, countries or section). Accents and case are
 * ignored. Headline hits rank first, then the dek, then everything else;
 * ties keep edition order.
 */

export const MIN_QUERY = 2
const MAX_TERMS = 8

export function fold(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function queryTerms(query) {
  const terms = fold(query).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  return [...new Set(terms)].slice(0, MAX_TERMS)
}

export function searchable(query) {
  return fold(query).replace(/[^\p{L}\p{N}]+/gu, '').length >= MIN_QUERY
}

/** What the results say, for the status region that screen readers hear. */
export function searchAnnouncement(query, count) {
  if (!searchable(query)) return ''
  if (!count) return 'No stories match. Try fewer or different words.'
  return `${count} ${count === 1 ? 'story matches' : 'stories match'}.`
}

function fieldsOf(story, categoryLabel) {
  return {
    headline: fold(story.headline),
    dek: fold(story.dek),
    rest: fold([
      story.body,
      story.so_what,
      story.what_now,
      story.region,
      categoryLabel,
      ...(Array.isArray(story.topics) ? story.topics : []),
      ...(Array.isArray(story.countries) ? story.countries.map((country) => country?.name) : []),
    ].filter(Boolean).join(' \n ')),
  }
}

/**
 * @param stories edition stories in edition order
 * @param query what the reader typed
 * @param labelFor (story) => section label, so "sport" finds the sport section
 * @returns [{ story, headlineHits }] best first
 */
export function searchStories(stories, query, labelFor = () => '') {
  if (!searchable(query)) return []
  const terms = queryTerms(query)
  if (!terms.length) return []
  const results = []
  stories.forEach((story, index) => {
    const fields = fieldsOf(story, labelFor(story))
    const all = `${fields.headline} \n ${fields.dek} \n ${fields.rest}`
    if (!terms.every((term) => all.includes(term))) return
    const headlineHits = terms.filter((term) => fields.headline.includes(term)).length
    const dekHits = terms.filter((term) => fields.dek.includes(term)).length
    results.push({ story, index, score: headlineHits * 100 + dekHits * 10, headlineHits })
  })
  return results
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ story, headlineHits }) => ({ story, headlineHits }))
}

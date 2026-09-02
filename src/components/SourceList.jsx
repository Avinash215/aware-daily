import { hostFromUrl } from '../lib/format.js'

/**
 * The provenance block. Research brief §5.2 "Sources and provenance" and §3
 * (evidence 11–13: distrust is tied to uncertainty about process, and readers
 * want to know who is behind a story) drive every decision here:
 *
 *  - every source is rendered, 2 or 9, never behind a "show more";
 *  - JSON order is preserved and no trust score, ranking or "primary" label is
 *    invented — repeated outlets reporting distinct pieces both stay;
 *  - the outlet name leads, the article title is the underlined link text and
 *    the hostname quietly confirms where the reader is being sent;
 *  - no remote favicons or logos are fetched.
 *
 * Links open in a new tab with `rel="noopener noreferrer"` and an announced
 * "(opens in a new tab)" so the briefing is not lost behind the reader.
 */

/** Matches the reader headline: Newsreader, with the shell token behind it. */
const SERIF = "'Newsreader', var(--font-display, Georgia, serif)"

function normaliseSource(raw) {
  const entry = typeof raw === 'string' ? { url: raw } : raw
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null

  const text = (value) => (typeof value === 'string' ? value.trim() : '')

  const url = text(entry.url)
  const host = hostFromUrl(url)
  const outlet = text(entry.source) || host
  const title = text(entry.title)

  // Never emit an empty link or a stringified object.
  if (!outlet && !title && !url) return null

  return {
    url,
    host,
    outlet: outlet || 'Unnamed outlet',
    title: title || outlet || host || url,
  }
}

function corroborationLine(list) {
  const outlets = new Set(list.map((entry) => entry.outlet.toLowerCase()))

  if (list.length === 1) {
    return 'This summary rests on a single named source. Read it before relying on the account.'
  }

  if (outlets.size === list.length) {
    return `Independently reported by ${list.length} named outlets.`
  }

  return `${list.length} reports from ${outlets.size} named outlets.`
}

export default function SourceList({ sources }) {
  const list = (Array.isArray(sources) ? sources : []).map(normaliseSource).filter(Boolean)

  return (
    <section aria-labelledby="story-sources-heading">
      <h2
        id="story-sources-heading"
        className="m-0 text-[1.25rem] leading-[1.5rem] font-semibold tracking-[-0.01em] text-text-primary"
        style={{ fontFamily: SERIF }}
      >
        Sources ({list.length})
      </h2>

      {list.length === 0 ? (
        <p className="mt-3 mb-0 max-w-[66ch] text-[0.9375rem] leading-[1.25rem] text-text-secondary">
          Source information is incomplete for this story. The reporting above could not be matched
          to its original coverage.
        </p>
      ) : (
        <>
          <p className="mt-3 mb-0 max-w-[66ch] text-[0.9375rem] leading-[1.25rem] text-text-secondary">
            Aware Daily summarizes the reporting listed below. Follow a link to inspect the original
            coverage.
          </p>
          <p className="mt-1 mb-0 max-w-[66ch] text-[0.8125rem] leading-[1.125rem] tracking-[0.01em] font-medium text-text-tertiary">
            {corroborationLine(list)}
          </p>

          <ul className="mt-4 mb-0 list-none rounded-xl border border-border bg-surface-raised p-0">
            {list.map((entry, index) => {
              const key = `${entry.url || entry.outlet}-${index}`
              const inner = (isLink) => (
                <>
                  <span
                    className="block text-[0.75rem] leading-[1rem] font-bold tracking-[0.08em] uppercase"
                    style={{ color: 'var(--story-accent, var(--text-primary))' }}
                  >
                    {entry.outlet}
                  </span>
                  <span
                    className={`mt-1 block text-[1rem] leading-[1.4375rem] font-medium text-text-primary${
                      isLink ? ' underline underline-offset-2' : ''
                    }`}
                  >
                    {entry.title}
                  </span>
                  {entry.host ? (
                    <span className="mt-1 block text-[0.8125rem] leading-[1.125rem] tracking-[0.01em] text-text-tertiary">
                      {entry.host}
                    </span>
                  ) : null}
                </>
              )

              return (
                <li key={key} className="border-t border-border first:border-t-0">
                  {entry.url ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] flex-col justify-center px-4 py-3"
                    >
                      {inner(true)}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <div className="flex min-h-[48px] flex-col justify-center px-4 py-3">
                      {inner(false)}
                      <span className="mt-1 block text-[0.8125rem] leading-[1.125rem] text-text-tertiary">
                        No link was published for this source.
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

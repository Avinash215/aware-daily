import { useId } from 'react'
import { normaliseSources, parseSourceUrl } from '../lib/sources.js'

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

export default function SourceList({ sources }) {
  const headingId = useId()
  const list = normaliseSources(sources)

  return (
    <section aria-labelledby={headingId} className="min-w-0 [overflow-wrap:anywhere]">
      <h2
        id={headingId}
        className="m-0 text-[1.25rem] leading-[1.5rem] font-semibold tracking-[-0.01em] text-text-primary"
        style={{ fontFamily: SERIF }}
      >
        Sources ({list.length})
      </h2>

      <p className="mt-3 mb-0 max-w-[66ch] text-[0.8125rem] leading-[1.125rem] tracking-[0.01em] font-medium text-text-tertiary">
        {list.length === 1
          ? '1 source is listed for this summary.'
          : `${list.length} sources are listed for this summary.`}
      </p>

      {list.length === 0 ? (
        <p className="mt-3 mb-0 max-w-[66ch] text-[0.9375rem] leading-[1.25rem] text-text-secondary">
          Source information is incomplete for this summary. No usable source records were supplied.
        </p>
      ) : (
        <>
          <p className="mt-3 mb-0 max-w-[66ch] text-[0.9375rem] leading-[1.25rem] text-text-secondary">
            Sources supplied with this summary are listed below. Available links open the supplied
            reporting.
          </p>

          <ul className="mt-4 mb-0 list-none rounded-xl border border-border bg-surface-raised p-0">
            {list.map((entry, index) => {
              const key = `${entry.url || entry.source}-${index}`
              const link = parseSourceUrl(entry.url)
              const inner = (isLink) => (
                <>
                  <span
                    className="block text-[0.75rem] leading-[1rem] font-bold tracking-[0.08em] uppercase"
                    style={{ color: 'var(--story-accent, var(--text-primary))' }}
                  >
                    {entry.source.trim() || 'Outlet not supplied'}
                  </span>
                  <span
                    className={`mt-1 block text-[1rem] leading-[1.4375rem] font-medium text-text-primary${
                      isLink ? ' underline underline-offset-2' : ''
                    }`}
                  >
                    {entry.title.trim() || entry.url.trim() || 'Article title not supplied'}
                  </span>
                  {link ? (
                    <span className="mt-1 block text-[0.8125rem] leading-[1.125rem] tracking-[0.01em] text-text-tertiary">
                      Link destination: {link.hostname}
                    </span>
                  ) : null}
                </>
              )

              return (
                <li key={key} className="min-w-0 border-t border-border first:border-t-0">
                  {link ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] min-w-0 flex-col justify-center px-4 py-3"
                    >
                      {inner(true)}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <div className="flex min-h-[48px] min-w-0 flex-col justify-center px-4 py-3">
                      {inner(false)}
                      <span className="mt-1 block text-[0.8125rem] leading-[1.125rem] text-text-tertiary">
                        {entry.url.trim()
                          ? 'Link unavailable: the supplied URL is not a complete, valid HTTP or HTTPS URL.'
                          : 'Link unavailable: no URL was supplied for this source.'}
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

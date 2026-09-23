import { useEffect, useState } from 'react'
import { getLocalHeadlines, timeAgo } from '../lib/api.js'

/**
 * Headlines from local outlets for the reader's own town. The place goes to
 * Aware's API for one lookup and is not stored; results link to the original
 * reporting and are not summarised or checked by Aware.
 */
export default function LocalHeadlines({ place, country }) {
  const [state, setState] = useState({ key: '', status: 'loading', items: [], edition: '' })
  const key = `${place}|${country}`

  useEffect(() => {
    let live = true
    getLocalHeadlines(place, country)
      .then((result) => {
        if (live) setState({ key, status: 'ready', items: result.items || [], edition: result.edition || '' })
      })
      .catch((error) => {
        if (live) setState({ key, status: error?.code === 'bad_place' ? 'bad_place' : 'error', items: [], edition: '' })
      })
    return () => {
      live = false
    }
  }, [country, key, place])

  const current = state.key === key ? state : { status: 'loading', items: [] }

  return (
    <div className="mt-3">
      {current.status === 'loading' ? <p className="m-0 text-meta text-text-muted">Looking for local headlines…</p> : null}
      {current.status === 'bad_place' ? (
        <p className="m-0 text-meta text-text-muted">That place name could not be used. Check the spelling on the You tab.</p>
      ) : null}
      {current.status === 'error' ? (
        <p className="m-0 text-meta text-text-muted">Local headlines could not be loaded right now. Try again later.</p>
      ) : null}
      {current.status === 'ready' && !current.items.length ? (
        <p className="m-0 text-meta text-text-muted">No local headlines from the last three days.</p>
      ) : null}
      {current.items.length ? (
        <>
          <ul className="m-0 list-none p-0">
            {current.items.map((item) => (
              <li key={item.link} className="border-b border-border-subtle last:border-b-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block py-3 no-underline"
                >
                  <span className="block font-display group-hover:underline text-[15px] leading-5 font-semibold text-text-primary lg:text-row-lg">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-text-muted">
                    {[item.source, timeAgo(item.published)].filter(Boolean).join(' · ')}
                    <span className="sr-only"> (opens the original in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 mb-0 text-[11px] leading-4 text-text-muted">
            Headlines from local outlets via Google News. Aware has not summarised or checked these.
          </p>
        </>
      ) : null}
    </div>
  )
}

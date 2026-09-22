import { useId } from 'react'
import { clamp, readTime } from '../lib/format.js'
import { DEFAULT_DEPTH, fullTextFor } from '../hooks/useReadingDepth.js'
import SaveButton from './SaveButton.jsx'
import ReadButton from './ReadButton.jsx'

function clampLines(lines) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
}

function FlagRow({ countries = [] }) {
  const shortList = countries.slice(0, 3)
  if (!shortList.length) return null

  return (
    <ul className="m-0 flex list-none items-center gap-1 p-0" aria-label="Countries covered">
      {shortList.map((country, index) => (
        <li key={`${country.name || 'country'}-${index}`}>
          <span role="img" aria-label={country?.name || 'Country'} title={country?.name || undefined} className="text-[13px] leading-4">
            {country?.flag || '🌐'}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * A standard story row.
 *
 * Every row renders inside its own section, so the category is already named
 * by the section header; the row's kicker carries the region in that
 * section's accent instead of repeating the category on every line.
 *
 * Mobile stacks kicker, reporting and a meta row, with Save pinned top right.
 * From `lg` the row becomes an editorial list entry: kicker, meta and the
 * read toggle in a narrow left rail, the reporting in a readable middle
 * column, and Save on the right.
 */
export default function StoryCard({
  story,
  category,
  isSaved = false,
  onToggleSave,
  isRead = false,
  onToggleRead,
  onOpenStory,
  depth = DEFAULT_DEPTH,
  kicker = '',
  reason = '',
}) {
  const headlineId = useId()
  if (!story) return null

  const accent = category?.accent || '--text-primary'
  const countries = Array.isArray(story.countries) ? story.countries : []
  const sourceCount = story.source_count || (Array.isArray(story.sources) ? story.sources.length : 0)
  const timing = readTime(story.read_time_min)
  const metaParts = [
    timing,
    sourceCount > 0 ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}` : '',
  ].filter(Boolean)
  const region = kicker || (typeof story.region === 'string' ? story.region.trim() : '')

  // Skim strips the card back to a headline and its meta row. Full swaps the
  // dek, a teaser the exporter cuts mid-clause, for the whole paragraph it
  // was cut from, then picks the reporting up at paragraph two.
  const showContext = depth !== 'skim'
  const isFull = depth === 'full'
  const { opening, rest: bodyParagraphs } = isFull
    ? fullTextFor(story.body, story.dek)
    : { opening: '', rest: [] }
  const leadText = isFull ? opening : clamp(story.dek, 180)
  const bodyTone = isRead ? 'var(--text-muted)' : 'var(--text-secondary)'
  // The desktop rail layout only pays off when there is reporting beside it.
  // Skim rows are a headline and a meta line, so they keep the stacked layout.
  const wide = showContext

  return (
    <article
      className={`relative border-b border-border-subtle py-3.5 last:border-b-0 ${
        wide ? 'lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)_2.75rem] lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:py-4' : ''
      }`}
      aria-labelledby={headlineId}
    >
      {region ? (
        <p
          className={`m-0 mb-1 truncate pr-12 text-[11px] leading-4 font-semibold uppercase tracking-[0.08em] ${
            wide ? 'lg:col-start-1 lg:row-start-1 lg:mb-0 lg:whitespace-normal lg:pt-0.5 lg:pr-0' : ''
          }`}
          style={{ color: `var(${accent})` }}
        >
          {region}
        </p>
      ) : null}

      <div className={`min-w-0 pr-12 ${wide ? 'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-[40rem] lg:pr-0' : ''}`}>
        <h3
          id={headlineId}
          className="m-0 text-row font-semibold lg:text-row-lg"
          style={{ color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          <button
            type="button"
            onClick={(event) => onOpenStory?.(story.id, event.currentTarget)}
            className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-row leading-[1.3] hover:underline hover:decoration-1 hover:underline-offset-[3px] lg:text-row-lg [scroll-margin-top:5.5rem]"
            style={clampLines(3)}
          >
            {story.headline?.trim() ? story.headline : 'Untitled story'}
          </button>
        </h3>

        {showContext && leadText ? (
          <p
            className={`mt-1 mb-0 text-dek lg:text-dek-lg ${isFull ? 'leading-[1.5]' : 'line-clamp-2 leading-[1.4]'}`}
            style={{ color: bodyTone }}
          >
            {leadText}
          </p>
        ) : null}

        {showContext && story.so_what ? (
          <p
            className={`mt-1 mb-0 text-sowhat font-medium lg:text-sowhat-lg ${isFull ? 'leading-[1.5]' : 'line-clamp-1 leading-[1.4] lg:line-clamp-2'}`}
            style={{ color: bodyTone }}
          >
            <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: `var(${accent})` }}>
              SO WHAT
            </span>
            {story.so_what}
          </p>
        ) : null}

        {bodyParagraphs.length ? (
          <div className="mt-2 mb-0 flex flex-col gap-2 text-dek leading-[1.5] lg:text-dek-lg" style={{ color: bodyTone }}>
            {bodyParagraphs.map((paragraph, index) => (
              <p key={index} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={`mt-2 flex min-h-5 items-center justify-between gap-3 ${
          wide ? 'lg:col-start-1 lg:row-start-2 lg:mt-2 lg:flex-col lg:items-start lg:justify-start lg:gap-3 lg:self-start' : ''
        }`}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-4 text-text-muted">
          {metaParts.length ? <span>{metaParts.join(' · ')}</span> : null}
          <FlagRow countries={countries} />
          {reason ? <span className="basis-full font-medium text-text-secondary">{reason}</span> : null}
        </div>
        {onToggleRead ? (
          <ReadButton
            variant="inline"
            read={isRead}
            headline={story.headline}
            onToggle={() => onToggleRead(story.id)}
            className="shrink-0"
          />
        ) : null}
      </div>

      <SaveButton
        saved={isSaved}
        onToggle={() => onToggleSave?.(story.id)}
        size="sm"
        className={`absolute top-1.5 -right-2.5 [scroll-margin-top:5.5rem] ${
          wide ? 'lg:static lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:-mt-2.5 lg:self-start lg:justify-self-end' : ''
        }`}
      />
    </article>
  )
}

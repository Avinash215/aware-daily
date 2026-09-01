import { readTime } from '../lib/format.js'

function countryText(countries = []) {
  return countries
    .map((country) => country?.name)
    .filter(Boolean)
    .join(', ')
}

function headlineClass(tier) {
  if (tier === 'front') return 'text-[24px] leading-[29px] sm:text-[26px] sm:leading-[31px]'
  return 'text-[21px] leading-[26px] sm:text-[22px] sm:leading-[27px]'
}

export default function StoryCard({ story, category, isRead, onToggleRead, onOpenStory }) {
  if (!story) return null

  const accent = category?.accent || '--text-primary'
  const countries = Array.isArray(story.countries) ? story.countries : []
  const countryNames = countryText(countries)
  const sourceCount = story.source_count || (Array.isArray(story.sources) ? story.sources.length : 0)
  const timing = readTime(story.read_time_min)
  const hasWhatNow = Boolean(story.what_now?.trim())

  return (
    <article
      className="border-b border-border py-6"
      style={story.tier === 'front' ? { borderTop: `2px solid var(${accent})` } : undefined}
      aria-labelledby={`headline-${story.id}`}
    >
      <p
        className="m-0 text-[12px] leading-4 font-bold tracking-[0.08em] uppercase"
        style={{ color: `var(${accent})` }}
      >
        {category?.label || story.category || 'Story'}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[18px] text-text-tertiary">
        {story.region ? <span>Region: {story.region}</span> : null}
        {timing ? <span>{timing}</span> : null}
        <span>{sourceCount} sources</span>
      </div>
      {countries.length ? (
        <p className="mt-2 mb-0 text-[13px] leading-[18px] text-text-secondary">
          <span className="sr-only">Countries: {countryNames}.</span>
          <span aria-hidden="true">
            {countries.map((country) => `${country.flag || ''} ${country.name || ''}`.trim()).join(' · ')}
          </span>
        </p>
      ) : null}

      <h3 className={`mt-3 font-display font-bold tracking-[-0.015em] ${headlineClass(story.tier)}`}>
        <button
          id={`headline-${story.id}`}
          type="button"
          onClick={(event) => onOpenStory?.(story.id, event.currentTarget)}
          className="cursor-pointer text-left no-underline hover:underline focus-visible:underline decoration-border underline-offset-4"
        >
          {story.headline || 'Untitled story'}
        </button>
      </h3>

      {story.dek ? <p className="mt-3 mb-0 max-w-[66ch] text-[19px] leading-7 text-text-secondary">{story.dek}</p> : null}

      {story.so_what ? (
        <div className="mt-5 border-l-4 pl-4" style={{ borderColor: `var(${accent})` }}>
          <p
            className="m-0 text-[12px] leading-4 font-bold tracking-[0.08em] uppercase"
            style={{ color: `var(${accent})` }}
          >
            So what
          </p>
          <p className="mt-2 mb-0 text-[17px] leading-[25px] font-semibold text-text-primary">
            {story.so_what}
          </p>
        </div>
      ) : null}

      {hasWhatNow ? (
        <div className="mt-4 border-t border-dashed border-border pt-4">
          <p className="m-0 text-[12px] leading-4 font-bold tracking-[0.08em] text-text-tertiary uppercase">
            What now →
          </p>
          <p className="mt-2 mb-0 text-[17px] leading-[25px] font-medium text-text-primary">
            {story.what_now}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onToggleRead?.(story.id)}
        className="mt-5 min-h-11 cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-[15px] leading-5 font-semibold text-text-primary transition-colors hover:bg-surface-sunken motion-reduce:transition-none"
      >
        {isRead ? 'Marked read · Undo' : 'Mark read'}
      </button>
    </article>
  )
}

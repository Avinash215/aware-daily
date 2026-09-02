import { clamp, readTime } from '../lib/format.js'
import SaveButton from './SaveButton.jsx'

function clampLines(lines) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
}

function tintBackground(accent) {
  if (typeof accent === 'string' && accent.startsWith('--accent-')) {
    return `var(${accent}-light, var(--surface-raised))`
  }
  return 'var(--surface-raised)'
}

function FlagRow({ countries = [] }) {
  const shortList = countries.slice(0, 3)
  if (!shortList.length) return null

  return (
    <ul className="m-0 flex list-none items-center gap-1 p-0" aria-label="Countries covered">
      {shortList.map((country, index) => (
        <li key={`${country.name || 'country'}-${index}`}>
          <span role="img" aria-label={country?.name || 'Country'} className="text-[14px] leading-4">
            {country?.flag || '🌐'}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function StoryCard({ story, category, isSaved = false, onToggleSave, onOpenStory }) {
  if (!story) return null

  const accent = category?.accent || '--text-primary'
  const countries = Array.isArray(story.countries) ? story.countries : []
  const sourceCount = story.source_count || (Array.isArray(story.sources) ? story.sources.length : 0)
  const timing = readTime(story.read_time_min)
  const metaParts = [
    timing,
    sourceCount > 0 ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}` : '',
  ].filter(Boolean)

  return (
    <article className="border-b py-3" style={{ borderColor: 'var(--border)' }} aria-labelledby={`headline-${story.id}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: `var(${accent})`, backgroundColor: tintBackground(accent) }}
          >
            {category?.label || story.category || 'Story'}
          </span>
          {story.region ? (
            <span className="truncate text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {story.region}
            </span>
          ) : null}
          </div>

          <h3
          id={`headline-${story.id}`}
          className="m-0 text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)', fontFamily: "'Newsreader', Georgia, serif" }}
          >
            <button
              type="button"
              onClick={(event) => onOpenStory?.(story.id, event.currentTarget)}
              className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-[15px] leading-[1.3] [scroll-margin-top:5.5rem]"
              style={clampLines(3)}
            >
              {story.headline || 'Untitled story'}
            </button>
          </h3>

          {story.dek ? (
          <p className="mt-0.5 mb-0 text-[13px] leading-[1.2]" style={{ ...clampLines(2), color: 'var(--text-secondary)' }}>
            {clamp(story.dek, 180)}
          </p>
          ) : null}

          {story.so_what ? (
          <p className="mt-0.5 mb-0 text-[13px] leading-[1.15]" style={{ ...clampLines(1), color: 'var(--text-secondary)' }}>
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: `var(${accent})` }}>
              SO WHAT
            </span>
            {story.so_what}
          </p>
          ) : null}

          <div className="mt-0.5 flex items-center gap-2 text-[11px] leading-[1]" style={{ color: 'var(--text-tertiary)' }}>
          {metaParts.join(' · ')}
          <FlagRow countries={countries} />
          </div>
        </div>

        <SaveButton
          saved={isSaved}
          onToggle={() => onToggleSave?.(story.id)}
          size="sm"
          className="mt-0.5 [scroll-margin-top:5.5rem]"
        />
      </div>
    </article>
  )
}
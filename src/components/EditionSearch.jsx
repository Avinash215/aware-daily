import { forwardRef, useEffect, useState } from 'react'
import { searchable } from '../lib/search.js'
import StoryCard from './StoryCard.jsx'

/**
 * The edition search field. Escape clears it; the app focuses it on "/".
 * The status region is mounted with the field so it exists before the first
 * query, and speaks only once typing pauses.
 */
export const SearchField = forwardRef(function SearchField({ value, onChange, total, announcement = '' }, ref) {
  const [spoken, setSpoken] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSpoken(announcement), announcement ? 700 : 0)
    return () => clearTimeout(timer)
  }, [announcement])

  return (
    <div role="search" className="relative pt-4">
      <p role="status" className="sr-only">{spoken}</p>
      <label htmlFor="edition-search" className="sr-only">Search today’s stories</label>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-[calc(1rem+0.75rem)] left-3.5 h-4 w-4 text-text-muted"
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <input
        ref={ref}
        id="edition-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            onChange('')
          }
        }}
        placeholder={total ? `Search today’s ${total} stories` : 'Search today’s stories'}
        autoComplete="off"
        spellCheck="false"
        enterKeyHint="search"
        className="block min-h-11 w-full rounded-full border border-border bg-surface-card pr-11 pl-10 text-meta text-text-primary placeholder:text-text-muted focus:border-text-secondary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('')
            if (ref && typeof ref === 'object') ref.current?.focus()
          }}
          className="absolute top-4 right-0.5 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-muted hover:text-text-primary"
          aria-label="Clear search"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-[calc(1rem+0.6875rem)] right-4 hidden rounded border border-border px-1.5 text-[11px] leading-4 font-medium text-text-muted lg:block">/</kbd>
      )}
    </div>
  )
})

const plural = (count) => `${count} ${count === 1 ? 'story matches' : 'stories match'}`

/** Matching stories across every section, best first, as ordinary feed rows. */
export function SearchResults({ query, results, categoryFor, depth, readLookup, isSaved, onToggleRead, onToggleSave, onOpenStory, onClear }) {
  if (!searchable(query)) return null
  const shown = query.trim()
  return (
    <section aria-labelledby="search-results-heading" className="pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t-2 border-text-primary pt-2.5">
        <h2 id="search-results-heading" className="m-0 font-display text-[19px] leading-6 font-semibold tracking-[-0.005em] text-text-primary lg:text-[22px] lg:leading-7">
          {results.length ? `${plural(results.length)} “${shown}”` : `Nothing matches “${shown}”`}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-meta font-semibold text-text-secondary hover:text-text-primary"
        >
          Clear search
        </button>
      </div>
      {results.length ? (
        <div className="mt-2">
          {results.map(({ story }) => {
            const category = categoryFor(story)
            const region = typeof story.region === 'string' ? story.region.trim() : ''
            return (
              <StoryCard
                key={story.id}
                story={story}
                category={category}
                kicker={[category?.label, region].filter(Boolean).join(' · ')}
                depth={depth}
                isSaved={isSaved(story.id)}
                isRead={readLookup.has(story.id)}
                onToggleRead={onToggleRead}
                onToggleSave={onToggleSave}
                onOpenStory={onOpenStory}
              />
            )
          })}
        </div>
      ) : (
        <p className="mt-3 mb-0 text-meta text-text-muted">
          Every word has to appear in a story. Try fewer or different words; search covers today’s edition only.
        </p>
      )}
    </section>
  )
}

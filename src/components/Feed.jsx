import { useMemo } from 'react'
import { categories as dataCategories, stories as dataStories, storiesByCategory } from '../lib/data.js'
import LeadStory from './LeadStory.jsx'
import StoryCard from './StoryCard.jsx'

function byRank(left, right) {
  const leftRank = left?.rank ?? Number.MAX_SAFE_INTEGER
  const rightRank = right?.rank ?? Number.MAX_SAFE_INTEGER
  return leftRank - rightRank
}

function storiesForCategory(category, fallbackStories = []) {
  if (!category) return []
  if (Array.isArray(category.stories) && category.stories.length) return [...category.stories].sort(byRank)
  if (fallbackStories.length) return fallbackStories.filter((story) => story?.category === category.key).sort(byRank)
  return storiesByCategory(category.key)
}

function EmptyState({ label }) {
  return (
    <p
      className="mt-4 rounded-xl border px-4 py-4 text-[14px] leading-6"
      style={{
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--surface-raised)',
      }}
    >
      No {label || 'category'} stories in this edition.
    </p>
  )
}

export default function Feed(props) {
  const {
    categories = dataCategories,
    stories = dataStories,
    allStories = dataStories,
    activeCategory = 'all',
    readStoryIds = [],
    readLookup,
    onOpenStory,
    isSaved,
    onToggleSave,
  } = props
  const fallbackSavedLookup = useMemo(() => readLookup ?? new Set(readStoryIds), [readLookup, readStoryIds])
  const isStorySaved = (id) => isSaved?.(id) ?? fallbackSavedLookup.has(id)
  const toggleStorySaved = (id) => {
    if (onToggleSave) onToggleSave(id)
  }
  const sourceStories = allStories?.length ? allStories : stories

  if (activeCategory !== 'all') {
    const category = categories.find((entry) => entry.key === activeCategory)
    const scopedStories = category
      ? storiesForCategory(category, stories)
      : (stories || []).filter((story) => story?.category === activeCategory).sort(byRank)

    if (!scopedStories.length) {
      return (
        <section id={`section-${activeCategory}`} aria-labelledby={`heading-${activeCategory}`}>
          <h2
            id={`heading-${activeCategory}`}
            className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: `var(${category?.accent || '--text-tertiary'})` }}
          >
            {category?.label || activeCategory}
          </h2>
          <EmptyState label={category?.label || activeCategory} />
        </section>
      )
    }

    const leadStory = scopedStories[0]
    const remaining = scopedStories.slice(1)

    return (
      <section id={`section-${activeCategory}`} aria-labelledby={`heading-${activeCategory}`}>
        <h2
          id={`heading-${activeCategory}`}
          className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: `var(${category?.accent || '--text-tertiary'})` }}
        >
          {category?.label || activeCategory}
        </h2>
        <div className="mt-3">
          <LeadStory
            story={leadStory}
            category={category}
            isSaved={isStorySaved(leadStory.id)}
            onToggleSave={toggleStorySaved}
            onOpenStory={onOpenStory}
          />
        </div>
        <div className="mt-2">
          {remaining.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              category={category}
              isSaved={isStorySaved(story.id)}
              onToggleSave={toggleStorySaved}
              onOpenStory={onOpenStory}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const scopedStories = storiesForCategory(category, sourceStories)
        const leadStory = scopedStories[0]
        const remaining = scopedStories.slice(1)

        return (
          <section
            key={category.key}
            id={`section-${category.key}`}
            aria-labelledby={`heading-${category.key}`}
            className="first:mt-0"
          >
            <h2
              id={`heading-${category.key}`}
              className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: `var(${category.accent || '--text-tertiary'})` }}
            >
              {category.label}
            </h2>
            {!leadStory ? (
              <EmptyState label={category.label} />
            ) : (
              <>
                <div className="mt-3">
                  <LeadStory
                    story={leadStory}
                    category={category}
                    isSaved={isStorySaved(leadStory.id)}
                    onToggleSave={toggleStorySaved}
                    onOpenStory={onOpenStory}
                  />
                </div>
                <div className="mt-2">
                  {remaining.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      category={category}
                      isSaved={isStorySaved(story.id)}
                      onToggleSave={toggleStorySaved}
                      onOpenStory={onOpenStory}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
import { useMemo } from 'react'
import { ALL_CATEGORIES, categoryDomId, categories as dataCategories, stories as dataStories } from '../lib/data.js'
import { DEFAULT_DEPTH } from '../hooks/useReadingDepth.js'
import LeadStory from './LeadStory.jsx'
import StoryCard from './StoryCard.jsx'

const storiesForCategory = (category) => category?.stories ?? []

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
    allStories = dataStories,
    activeCategory = ALL_CATEGORIES,
    depth = DEFAULT_DEPTH,
    readStoryIds = [],
    readLookup,
    onToggleRead,
    onOpenStory,
    savedIds = [],
    isSaved,
    onToggleSave,
    onBrowseSaved,
  } = props
  const fallbackSavedLookup = useMemo(() => new Set(savedIds), [savedIds])
  const storyReadLookup = useMemo(() => readLookup ?? new Set(readStoryIds), [readLookup, readStoryIds])
  const isStorySaved = (id) => isSaved?.(id) ?? fallbackSavedLookup.has(id)
  const toggleStorySaved = (id) => {
    if (onToggleSave) onToggleSave(id)
  }
  const emptyEdition = !allStories.length ? (
      <section aria-labelledby="empty-edition-heading" className="my-4 rounded-xl border border-border-subtle bg-surface-card p-4">
        <h2 id="empty-edition-heading" className="font-display text-lead font-semibold text-text-primary">
          No stories are available in this edition
        </h2>
        <p className="mt-2 text-meta text-text-secondary">Your saved stories and catch-ups are still available.</p>
        <button type="button" onClick={onBrowseSaved} className="mt-3 min-h-11 rounded-full border border-border bg-surface px-4 py-2 text-meta font-semibold text-text-primary">
          Go to Saved
        </button>
      </section>
  ) : null

  if (activeCategory !== ALL_CATEGORIES) {
    const category = categories.find((entry) => entry.key === activeCategory)
    const scopedStories = storiesForCategory(category)
    const sectionId = categoryDomId(activeCategory)

    if (!scopedStories.length) {
      return (
        <>
        {emptyEdition}
        <section id={`section-${sectionId}`} aria-labelledby={`heading-${sectionId}`}>
          <h2
            id={`heading-${sectionId}`}
            className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: `var(${category?.accent || '--text-tertiary'})` }}
          >
            {category?.label || activeCategory}
          </h2>
          <EmptyState label={category?.label || activeCategory} />
        </section>
        </>
      )
    }

    const leadStory = scopedStories[0]
    const remaining = scopedStories.slice(1)

    return (
      <section id={`section-${sectionId}`} aria-labelledby={`heading-${sectionId}`}>
        <h2
          id={`heading-${sectionId}`}
          className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: `var(${category?.accent || '--text-tertiary'})` }}
        >
          {category?.label || activeCategory}
        </h2>
        <div className="mt-3">
          <LeadStory
            story={leadStory}
            category={category}
            imageLoading="eager"
            depth={depth}
            isSaved={isStorySaved(leadStory.id)}
            isRead={storyReadLookup.has(leadStory.id)}
            onToggleRead={onToggleRead}
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
              depth={depth}
              isSaved={isStorySaved(story.id)}
              isRead={storyReadLookup.has(story.id)}
              onToggleRead={onToggleRead}
              onToggleSave={toggleStorySaved}
              onOpenStory={onOpenStory}
            />
          ))}
        </div>
      </section>
    )
  }

  const eagerCategory = categories.find((category) => {
    const lead = storiesForCategory(category)[0]
    return typeof lead?.image === 'string' && Boolean(lead.image.trim())
  })

  return (
    <div className="space-y-4">
      {emptyEdition}
      {categories.map((category) => {
        const scopedStories = storiesForCategory(category)
        const sectionId = categoryDomId(category.key)
        const leadStory = scopedStories[0]
        const remaining = scopedStories.slice(1)

        return (
          <section
            key={category.key}
            id={`section-${sectionId}`}
            aria-labelledby={`heading-${sectionId}`}
            className="first:mt-0"
          >
            <h2
              id={`heading-${sectionId}`}
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
                    imageLoading={category === eagerCategory ? 'eager' : 'lazy'}
                    depth={depth}
                    isSaved={isStorySaved(leadStory.id)}
                    isRead={storyReadLookup.has(leadStory.id)}
                    onToggleRead={onToggleRead}
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
                      depth={depth}
                      isSaved={isStorySaved(story.id)}
                      isRead={storyReadLookup.has(story.id)}
                      onToggleRead={onToggleRead}
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
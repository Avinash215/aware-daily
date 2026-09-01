import LeadStory from './LeadStory.jsx'
import ProgressRail from './ProgressRail.jsx'
import StoryCard from './StoryCard.jsx'

function categoryStories(category, allStories) {
  if (!category) return []
  const ids = new Set((category.stories || []).map((story) => story.id))
  return allStories.filter((story) => ids.has(story.id))
}

export default function Feed({
  categories = [],
  stories = [],
  allStories = [],
  activeCategory = 'all',
  readStoryIds = [],
  readLookup,
  onToggleRead,
  onMarkAllRead,
  onResetRead,
  onOpenStory,
}) {
  const safeReadLookup = readLookup ?? new Set(readStoryIds)

  if (activeCategory !== 'all') {
    const category = categories.find((entry) => entry.key === activeCategory)
    const scoped = [...stories].sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    const lead = scoped[0] ?? null
    const remaining = scoped.slice(1)

    return (
      <>
        <ProgressRail
          categories={categories}
          totalStories={allStories.length}
          readStoryIds={readStoryIds}
          onMarkAllRead={onMarkAllRead}
          onResetRead={onResetRead}
        />
        <section id={`section-${activeCategory}`} aria-labelledby={`heading-${activeCategory}`}>
          <h2 id={`heading-${activeCategory}`} className="m-0 text-[15px] leading-5 font-semibold text-text-secondary">
            {category?.label || 'Category'}
          </h2>
          {!scoped.length ? (
            <p className="mt-3 rounded-lg border border-border bg-surface-raised p-4 text-[17px] leading-[27px] text-text-secondary">
              No {category?.label || 'category'} stories in this edition.
            </p>
          ) : (
            <>
              <div className="mt-4">
                <LeadStory
                  story={lead}
                  category={category}
                  isRead={safeReadLookup.has(lead?.id)}
                  onToggleRead={onToggleRead}
                  onOpenStory={onOpenStory}
                />
              </div>
              <div className="mt-6">
                {remaining.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    category={category}
                    isRead={safeReadLookup.has(story.id)}
                    onToggleRead={onToggleRead}
                    onOpenStory={onOpenStory}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </>
    )
  }

  const sortedAll = [...allStories].sort(
    (a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER),
  )
  const leadStory = sortedAll[0] ?? null

  return (
    <>
      <ProgressRail
        categories={categories}
        totalStories={allStories.length}
        readStoryIds={readStoryIds}
        onMarkAllRead={onMarkAllRead}
        onResetRead={onResetRead}
      />
      {leadStory ? (
        <div className="mb-12">
          <LeadStory
            story={leadStory}
            category={categories.find((category) => category.key === leadStory.category)}
            isRead={safeReadLookup.has(leadStory.id)}
            onToggleRead={onToggleRead}
            onOpenStory={onOpenStory}
          />
        </div>
      ) : null}

      {categories.map((category) => {
        const scoped = categoryStories(category, allStories)
          .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
          .filter((story) => story.id !== leadStory?.id)

        return (
          <section
            key={category.key}
            id={`section-${category.key}`}
            aria-labelledby={`heading-${category.key}`}
            className="mt-12 first:mt-0"
          >
            <h2
              id={`heading-${category.key}`}
              className="m-0 border-b border-border pb-2 text-[15px] leading-5 font-semibold text-text-secondary"
            >
              {category.label}{' '}
              <span className="text-[13px] font-medium text-text-tertiary">({scoped.length + (leadStory?.category === category.key ? 1 : 0)})</span>
            </h2>
            {!scoped.length && leadStory?.category !== category.key ? (
              <p className="mt-3 rounded-lg border border-border bg-surface-raised p-4 text-[17px] leading-[27px] text-text-secondary">
                No {category.label} stories in this edition.
              </p>
            ) : (
              scoped.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  category={category}
                  isRead={safeReadLookup.has(story.id)}
                  onToggleRead={onToggleRead}
                  onOpenStory={onOpenStory}
                />
              ))
            )}
          </section>
        )
      })}

      <section className="mt-16 rounded-lg border border-border bg-surface-raised p-6">
        {readStoryIds.length >= allStories.length && allStories.length > 0 ? (
          <p className="m-0 text-[17px] leading-[27px] text-text-primary">
            You’re caught up. Today’s {allStories.length}-story briefing is complete.
          </p>
        ) : (
          <p className="m-0 text-[17px] leading-[27px] text-text-primary">
            That’s today’s full briefing. {Math.max(allStories.length - readStoryIds.length, 0)} stories remain
            unmarked.
          </p>
        )}
        <button
          type="button"
          onClick={onResetRead}
          className="mt-4 min-h-11 cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-[15px] leading-5 font-semibold text-text-primary transition-colors hover:bg-surface-sunken motion-reduce:transition-none"
        >
          Reset today’s progress
        </button>
      </section>
    </>
  )
}

import { useMemo } from 'react'
import { ALL_CATEGORIES, categoryDomId, categoryTabId, categories as dataCategories, stories as dataStories } from '../lib/data.js'
import { DEFAULT_DEPTH } from '../hooks/useReadingDepth.js'
import { FOR_YOU } from '../lib/personal.js'
import ForYou from './ForYou.jsx'
import LeadStory from './LeadStory.jsx'
import StoryCard from './StoryCard.jsx'

const storiesForCategory = (category) => category?.stories ?? []

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`

function EmptyState({ label }) {
  return (
    <p className="mt-3 mb-0 text-meta text-text-muted">
      No {label || 'category'} stories in this edition.
    </p>
  )
}

/**
 * A section flag: an accent rule across the column, the section name, and
 * how far through it the reader has marked. It is the only place the
 * category is named, so rows underneath do not repeat it.
 */
function SectionHeader({ id, label, accent, total, read }) {
  const progress = total
    ? read
      ? read === total
        ? `All ${total} read`
        : `${read} of ${total} read`
      : plural(total, 'story', 'stories')
    : ''

  return (
    <div
      className="flex items-baseline justify-between gap-4 border-t-2 pt-2.5"
      style={{ borderColor: `var(${accent || '--text-primary'})` }}
    >
      <h2
        id={id}
        className="m-0 font-display text-[19px] leading-6 font-semibold tracking-[-0.005em] text-text-primary lg:text-[22px] lg:leading-7"
      >
        {label}
      </h2>
      {progress ? (
        <p className="m-0 shrink-0 text-[11px] leading-4 font-medium tabular-nums text-text-muted">{progress}</p>
      ) : null}
    </div>
  )
}

function EditionEnd({ total, read, onMarkAllRead, onResetRead, onOpenQuiz }) {
  if (!total) return null
  const allRead = read >= total

  const backToTop = () => {
    const allTab = document.getElementById(categoryTabId(ALL_CATEGORIES))
    allTab?.focus({ preventScroll: true })
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section
      aria-labelledby="edition-end-heading"
      className="mt-12 border-t border-border pt-8 pb-4 text-center"
    >
      <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-text-primary" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      </svg>
      <h2 id="edition-end-heading" className="mt-3 mb-0 font-display text-[22px] leading-7 font-semibold text-text-primary">
        {allRead ? 'You’re caught up.' : 'That’s the whole edition.'}
      </h2>
      <p className="mx-auto mt-1.5 mb-0 max-w-[34rem] text-meta text-text-secondary">
        {allRead
          ? `All ${plural(total, 'story', 'stories')} in this briefing are marked read. There is nothing more to scroll.`
          : `${read} of ${plural(total, 'story', 'stories')} marked read. There is nothing more to scroll.`}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {onOpenQuiz ? (
          <button
            type="button"
            onClick={onOpenQuiz}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-text-primary px-5 text-meta font-semibold text-surface"
          >
            {read >= 3 ? 'Quiz me on what I read' : 'Try the quiz'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={allRead ? onResetRead : onMarkAllRead}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface-card px-4 text-meta font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none"
        >
          {allRead ? 'Reset progress' : 'Mark all read'}
        </button>
        <button
          type="button"
          onClick={backToTop}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-0 bg-transparent px-4 text-meta font-semibold text-text-secondary hover:text-text-primary"
        >
          Back to top
        </button>
      </div>
    </section>
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
    onMarkAllRead,
    onResetRead,
    onOpenStory,
    savedIds = [],
    isSaved,
    onToggleSave,
    onBrowseSaved,
    forYou,
    prefs,
    onOpenRecap,
    onEditInterests,
    onUnfollow,
    onOpenQuiz,
    community,
    editionDate,
  } = props
  const fallbackSavedLookup = useMemo(() => new Set(savedIds), [savedIds])
  const storyReadLookup = useMemo(() => readLookup ?? new Set(readStoryIds), [readLookup, readStoryIds])
  const isStorySaved = (id) => isSaved?.(id) ?? fallbackSavedLookup.has(id)
  const toggleStorySaved = (id) => {
    if (onToggleSave) onToggleSave(id)
  }
  const readCountFor = (list) => list.reduce((sum, story) => sum + (storyReadLookup.has(story.id) ? 1 : 0), 0)
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

  const renderStories = (category, scopedStories, { front = false, eager = false } = {}) => {
    const [leadStory, ...remaining] = scopedStories
    return (
      <>
        <div className="mt-4">
          <LeadStory
            story={leadStory}
            category={category}
            variant={front ? 'front' : 'section'}
            imageLoading={eager ? 'eager' : 'lazy'}
            depth={depth}
            isSaved={isStorySaved(leadStory.id)}
            isRead={storyReadLookup.has(leadStory.id)}
            onToggleRead={onToggleRead}
            onToggleSave={toggleStorySaved}
            onOpenStory={onOpenStory}
          />
        </div>
        {remaining.length ? (
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
        ) : null}
      </>
    )
  }

  if (activeCategory === FOR_YOU && forYou && prefs) {
    return (
      <ForYou
        forYou={forYou}
        prefs={prefs}
        depth={depth}
        readLookup={storyReadLookup}
        onToggleRead={onToggleRead}
        onOpenStory={onOpenStory}
        isSaved={isStorySaved}
        onToggleSave={toggleStorySaved}
        onOpenRecap={onOpenRecap}
        onEditInterests={onEditInterests}
        onUnfollow={onUnfollow}
        onOpenQuiz={onOpenQuiz}
        community={community}
        editionDate={editionDate}
      />
    )
  }

  if (activeCategory !== ALL_CATEGORIES) {
    const category = categories.find((entry) => entry.key === activeCategory)
    const scopedStories = storiesForCategory(category)
    const sectionId = categoryDomId(activeCategory)
    const label = category?.label || activeCategory

    return (
      <>
        {!scopedStories.length ? emptyEdition : null}
        <section id={`section-${sectionId}`} aria-labelledby={`heading-${sectionId}`} className="pt-5">
          <SectionHeader
            id={`heading-${sectionId}`}
            label={label}
            accent={category?.accent}
            total={scopedStories.length}
            read={readCountFor(scopedStories)}
          />
          {scopedStories.length ? renderStories(category, scopedStories, { eager: true }) : <EmptyState label={label} />}
        </section>
      </>
    )
  }

  const eagerCategory = categories.find((category) => {
    const lead = storiesForCategory(category)[0]
    return typeof lead?.image === 'string' && Boolean(lead.image.trim())
  })
  const frontCategory = categories.find((category) => storiesForCategory(category).length > 0)
  const totalStories = categories.reduce((sum, category) => sum + storiesForCategory(category).length, 0)
  const totalRead = categories.reduce((sum, category) => sum + readCountFor(storiesForCategory(category)), 0)

  return (
    <div className="pt-5">
      {emptyEdition}
      <div className="space-y-12 lg:space-y-14">
        {categories.map((category) => {
          const scopedStories = storiesForCategory(category)
          const sectionId = categoryDomId(category.key)

          return (
            <section
              key={category.key}
              id={`section-${sectionId}`}
              aria-labelledby={`heading-${sectionId}`}
              className="[scroll-margin-top:4.5rem]"
            >
              <SectionHeader
                id={`heading-${sectionId}`}
                label={category.label}
                accent={category.accent}
                total={scopedStories.length}
                read={readCountFor(scopedStories)}
              />
              {scopedStories.length
                ? renderStories(category, scopedStories, {
                    front: category === frontCategory,
                    eager: category === eagerCategory,
                  })
                : <EmptyState label={category.label} />}
            </section>
          )
        })}
      </div>
      <EditionEnd total={totalStories} read={totalRead} onMarkAllRead={onMarkAllRead} onResetRead={onResetRead} onOpenQuiz={onOpenQuiz} />
    </div>
  )
}

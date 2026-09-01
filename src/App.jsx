import { useEffect, useMemo, useRef, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import CategoryNav from './components/CategoryNav.jsx'
import Feed from './components/Feed.jsx'
import StoryReader from './components/StoryReader.jsx'
import { categories, getCategory, getStory, meta, stories, storiesByCategory } from './lib/data.js'
import { formatDate, formatUpdated } from './lib/format.js'

const READ_STORAGE_KEY = 'aware-daily:read'

function loadReadStore() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * App shell.
 *
 * This file owns the two pieces of app state and marks out the three regions
 * the feed and reader agents plug into. The placeholder headline list below is
 * intentionally plain — it exists so `npm run dev` shows real data, and it is
 * expected to be replaced by whatever lands in the feed slot.
 */
export default function App() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [openStoryId, setOpenStoryId] = useState(null)
  const [readStore, setReadStore] = useState(loadReadStore)
  const originRef = useRef(null)

  const editionKey = meta.date || 'unknown-edition'

  const visibleStories = useMemo(
    () => (activeCategory === 'all' ? stories : storiesByCategory(activeCategory)),
    [activeCategory],
  )
  const readStoryIds = useMemo(() => {
    const ids = readStore[editionKey]
    return Array.isArray(ids) ? ids : []
  }, [editionKey, readStore])

  const readLookup = useMemo(() => new Set(readStoryIds), [readStoryIds])

  const dateLabel = formatDate(meta.date)
  const updatedLabel = formatUpdated(meta.generatedAt)
  const openStory = openStoryId ? getStory(openStoryId) : null
  const openCategory = openStory ? getCategory(openStory.category) : null

  useEffect(() => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readStore))
    } catch {
      // localStorage may be unavailable in private mode; ignore safely
    }
  }, [readStore])

  useEffect(() => {
    if (!openStoryId) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [openStoryId])

  useEffect(() => {
    if (openStoryId || !originRef.current) return
    originRef.current.focus()
    originRef.current = null
  }, [openStoryId])

  const updateEditionRead = (updater) => {
    setReadStore((current) => {
      const nextIds = updater(Array.isArray(current[editionKey]) ? current[editionKey] : [])
      return { ...current, [editionKey]: nextIds }
    })
  }

  const toggleRead = (storyId) => {
    if (!storyId) return
    updateEditionRead((currentIds) => {
      const set = new Set(currentIds)
      if (set.has(storyId)) set.delete(storyId)
      else set.add(storyId)
      return Array.from(set)
    })
  }

  const markAllRead = () => {
    const allIds = stories.map((story) => story.id).filter(Boolean)
    updateEditionRead(() => allIds)
  }

  const resetRead = () => {
    updateEditionRead(() => [])
  }

  const handleOpenStory = (storyId, originElement) => {
    originRef.current = originElement ?? null
    setOpenStoryId(storyId)
  }

  const handleCloseReader = () => {
    setOpenStoryId(null)
  }

  return (
    <div className="min-h-svh bg-surface text-text-primary">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[66ch]">
          <header className="border-b border-border pb-6">
            <h1 className="m-0 font-display text-masthead font-bold tracking-tight text-text-primary">
              Aware Daily
            </h1>
            {dateLabel ? (
              <p className="mt-2 mb-0 text-meta text-text-secondary">
                <time dateTime={meta.date}>{dateLabel}</time>
                {updatedLabel ? ` · ${updatedLabel}` : ''}
              </p>
            ) : null}
            <p className="mt-2 mb-0 max-w-[66ch] text-[19px] leading-7 text-text-secondary">
              {meta.publishedCount} stories across {meta.categoryCount} sections. One finishable briefing.
            </p>
            <p className="mt-1 mb-0 text-meta text-text-tertiary">
              {meta.publishedCount} {meta.publishedCount === 1 ? 'story' : 'stories'} ·{' '}
              {meta.categoryCount} {meta.categoryCount === 1 ? 'category' : 'categories'}
            </p>
          </header>

          <ErrorBoundary label="The category navigation">
            <nav className="sticky top-0 z-20 mt-6 bg-surface pb-2 pt-2" aria-label="Categories">
              {/* SLOT: category-nav */}
              <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
              />
            </nav>
          </ErrorBoundary>

          <ErrorBoundary label="The feed">
            <main className="mt-6" id="feed-panel">
              {/* SLOT: feed */}
              <Feed
                categories={categories}
                stories={visibleStories}
                allStories={stories}
                activeCategory={activeCategory}
                readStoryIds={readStoryIds}
                onToggleRead={toggleRead}
                onMarkAllRead={markAllRead}
                onResetRead={resetRead}
                onOpenStory={handleOpenStory}
                readLookup={readLookup}
              />
            </main>
          </ErrorBoundary>
        </div>

        <ErrorBoundary label="The story reader">
          {/* SLOT: reader */}
          {openStory ? (
            <StoryReader story={openStory} category={openCategory} onClose={handleCloseReader} />
          ) : null}
        </ErrorBoundary>
      </div>
    </div>
  )
}

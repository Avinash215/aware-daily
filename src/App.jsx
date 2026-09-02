import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BottomNav, { TopNav } from './components/BottomNav.jsx'
import CategoryNav from './components/CategoryNav.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Feed from './components/Feed.jsx'
import SavedPage from './components/SavedPage.jsx'
import StoryReader from './components/StoryReader.jsx'
import YouPage from './components/YouPage.jsx'
import { useSavedStories } from './hooks/useSavedStories.js'
import { categories, getCategory, getStory, meta, stories, storiesByCategory } from './lib/data.js'
import { formatDate, formatUpdated } from './lib/format.js'

const READ_STORAGE_KEY = 'aware-daily:read'
const THEME_STORAGE_KEY = 'aware-daily:theme'
const DAY_MS = 24 * 60 * 60 * 1000
const APP_BOOT_TIME = Date.now()

/** One container width for the masthead, the rail and every page. */
const SHELL = 'mx-auto w-full max-w-[720px] px-4 sm:px-5 lg:max-w-[960px] lg:px-8'

function loadReadStore() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0 text-text-primary"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      </svg>
      <span className="font-display text-masthead font-bold tracking-tight text-text-primary">
        Aware Daily
      </span>
    </span>
  )
}

function parseLocalDate(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    const parsed = new Date(Number(y), Number(m) - 1, Number(d))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * App shell.
 *
 * Owns the tab, category, reader, read-progress and theme state, and hands
 * the feed / saved / you units the data they need. Nothing here renders a
 * story row directly.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [activeCategory, setActiveCategory] = useState('all')
  const [openStoryId, setOpenStoryId] = useState(null)
  const [readStore, setReadStore] = useState(loadReadStore)
  const [theme, setTheme] = useState(loadTheme)
  const originRef = useRef(null)

  const { savedIds, isSaved, toggleSave, clearAll } = useSavedStories()

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

  const savedStories = useMemo(
    () => savedIds.map((id) => getStory(id)).filter(Boolean),
    [savedIds],
  )

  // Count what can actually be shown: an id kept from an older edition is not
  // in today's briefing, so it must not inflate the badge.
  const savedCount = savedStories.length

  const dateLabel = formatDate(meta.date)
  const updatedLabel = formatUpdated(meta.generatedAt)
  const openStory = openStoryId ? getStory(openStoryId) : null
  const openCategory = openStory ? getCategory(openStory.category) : null
  const editionDate = parseLocalDate(meta.date)
  const staleAgeMs = editionDate ? APP_BOOT_TIME - editionDate.getTime() : 0
  const staleInfo =
    editionDate && staleAgeMs > DAY_MS
      ? {
          ageDays: Math.max(1, Math.floor(staleAgeMs / DAY_MS)),
          editionDateLabel: formatDate(meta.date) || meta.date,
        }
      : null

  const freshness = [
    `${meta.publishedCount} ${meta.publishedCount === 1 ? 'story' : 'stories'}`,
    `${meta.categoryCount} ${meta.categoryCount === 1 ? 'section' : 'sections'}`,
    updatedLabel,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readStore))
    } catch {
      // localStorage may be unavailable in private mode; ignore safely
    }
  }, [readStore])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme)
    else root.removeAttribute('data-theme')

    try {
      if (theme === 'light' || theme === 'dark') localStorage.setItem(THEME_STORAGE_KEY, theme)
      else localStorage.removeItem(THEME_STORAGE_KEY)
    } catch {
      // Theme still applies for this session even when storage is blocked.
    }
  }, [theme])

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

  const updateEditionRead = useCallback(
    (updater) => {
      setReadStore((current) => {
        const nextIds = updater(Array.isArray(current[editionKey]) ? current[editionKey] : [])
        return { ...current, [editionKey]: nextIds }
      })
    },
    [editionKey],
  )

  const toggleRead = useCallback(
    (storyId) => {
      if (!storyId) return
      updateEditionRead((currentIds) => {
        const set = new Set(currentIds)
        if (set.has(storyId)) set.delete(storyId)
        else set.add(storyId)
        return Array.from(set)
      })
    },
    [updateEditionRead],
  )

  const markAllRead = useCallback(() => {
    const allIds = stories.map((story) => story.id).filter(Boolean)
    updateEditionRead(() => allIds)
  }, [updateEditionRead])

  const resetRead = useCallback(() => {
    updateEditionRead(() => [])
  }, [updateEditionRead])

  const handleOpenStory = useCallback((storyId, originElement) => {
    originRef.current = originElement ?? null
    setOpenStoryId(storyId)
  }, [])

  const handleCloseReader = useCallback(() => {
    setOpenStoryId(null)
  }, [])

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab(nextTab)
    setOpenStoryId(null)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-svh bg-surface text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:border-border focus:bg-surface-card focus:px-4 focus:py-2 focus:text-meta focus:font-semibold"
      >
        Skip to the briefing
      </a>

      <header className="border-b border-border-subtle bg-surface">
        <div className={`${SHELL} flex items-center justify-between gap-4 pt-3 pb-1 lg:pt-5`}>
          <h1 className="m-0">
            <Wordmark />
          </h1>
          <TopNav activeTab={activeTab} onTabChange={handleTabChange} savedCount={savedCount} />
        </div>
        <div className={`${SHELL} pb-2.5`}>
          {dateLabel ? (
            <p className="m-0 text-meta text-text-secondary">
              <time dateTime={meta.date}>{dateLabel}</time>
            </p>
          ) : null}
          {freshness ? <p className="mt-0.5 mb-0 text-caption text-text-muted">{freshness}</p> : null}
          <p className="mt-1 mb-0 text-caption text-text-muted">
            Automated daily briefing that summarizes reporting from named news organizations
            and links to original coverage; it does no original reporting.
          </p>
        </div>
      </header>

      {staleInfo ? (
        <div role="status" className="border-b border-border-subtle bg-surface-card">
          <p className={`${SHELL} py-2 text-meta font-semibold text-text-primary`}>
            This briefing is {staleInfo.ageDays} {staleInfo.ageDays === 1 ? 'day' : 'days'} old
            ({staleInfo.editionDateLabel}).
          </p>
        </div>
      ) : null}

      {activeTab === 'today' ? (
        <ErrorBoundary label="The category navigation">
          <div className="sticky top-0 z-20 border-b border-border-subtle bg-surface/95 backdrop-blur-md">
            <nav className={`${SHELL} py-2`} aria-label="Categories">
              <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
              />
            </nav>
          </div>
        </ErrorBoundary>
      ) : null}

      <main
        id="main-content"
        className={`${SHELL} pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-16`}
      >
        {activeTab === 'today' ? (
          <ErrorBoundary label="The feed">
            <div
              id="feed-panel"
              role="tabpanel"
              aria-labelledby={`tab-${activeCategory}`}
              tabIndex={0}
            >
              <Feed
                categories={categories}
                stories={visibleStories}
                allStories={stories}
                activeCategory={activeCategory}
                readStoryIds={readStoryIds}
                readLookup={readLookup}
                onToggleRead={toggleRead}
                onMarkAllRead={markAllRead}
                onResetRead={resetRead}
                onOpenStory={handleOpenStory}
                savedIds={savedIds}
                isSaved={isSaved}
                onToggleSave={toggleSave}
              />
            </div>
          </ErrorBoundary>
        ) : null}

        {activeTab === 'saved' ? (
          <ErrorBoundary label="Your saved stories">
            <SavedPage
              stories={savedStories}
              categories={categories}
              onOpenStory={handleOpenStory}
              onToggleSave={toggleSave}
              onClearAll={clearAll}
              onBrowse={handleTabChange}
            />
          </ErrorBoundary>
        ) : null}

        {activeTab === 'you' ? (
          <ErrorBoundary label="Your reading progress">
            <YouPage
              categories={categories}
              totalStories={meta.publishedCount}
              readStoryIds={readStoryIds}
              savedCount={savedCount}
              onMarkAllRead={markAllRead}
              onResetRead={resetRead}
              theme={theme}
              onThemeChange={setTheme}
              dateLabel={dateLabel}
              updatedLabel={updatedLabel}
              categoryCount={meta.categoryCount}
            />
          </ErrorBoundary>
        ) : null}
      </main>

      <footer className="border-t border-border-subtle bg-surface">
        <p className={`${SHELL} py-3 text-caption text-text-muted`}>
          Automated daily briefing that summarizes reporting from named news organizations
          and links to original coverage; it does no original reporting.
        </p>
      </footer>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} savedCount={savedCount} />

      <ErrorBoundary label="The story reader">
        {openStory ? (
          <StoryReader
            story={openStory}
            category={openCategory}
            onClose={handleCloseReader}
            isSaved={isSaved}
            onToggleSave={toggleSave}
          />
        ) : null}
      </ErrorBoundary>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BottomNav, { TopNav } from './components/BottomNav.jsx'
import CategoryNav from './components/CategoryNav.jsx'
import DepthControl from './components/DepthControl.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import EditionFreshness from './components/EditionFreshness.jsx'
import Feed from './components/Feed.jsx'
import RecapView from './components/RecapView.jsx'
import SavedPage from './components/SavedPage.jsx'
import SavedStoryStatus from './components/SavedStoryStatus.jsx'
import StoryReader from './components/StoryReader.jsx'
import YouPage from './components/YouPage.jsx'
import { estimateDepthMinutes, useReadingDepth } from './hooks/useReadingDepth.js'
import { useReadProgress } from './hooks/useReadProgress.js'
import { useSavedRecaps } from './hooks/useSavedRecaps.js'
import { snapshotForCurrentStory, useSavedStories } from './hooks/useSavedStories.js'
import {
  categories,
  ALL_CATEGORIES,
  categoryTabId,
  getStoryCategory,
  getRecap,
  getStory,
  meta,
  partialEdition,
  stories,
} from './lib/data.js'
import { formatDate, formatUpdated, parseDateOnly } from './lib/format.js'

const THEME_STORAGE_KEY = 'aware-daily:theme'

/**
 * What each depth costs to read, measured from the edition on disk rather than
 * hardcoded. The briefing never changes shape at runtime, so this is computed
 * once at module load.
 */
const DEPTH_MINUTES = stories.length ? estimateDepthMinutes(stories) : null

/** One container width for the masthead, the rail and every page. */
const SHELL = 'mx-auto w-full max-w-[720px] px-4 sm:px-5 lg:max-w-[960px] lg:px-8'

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

/**
 * App shell.
 *
 * Owns the tab, category, reader, read-progress and theme state, and hands
 * the feed / saved / you units the data they need. Nothing here renders a
 * story row directly.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const [openSelection, setOpenSelection] = useState(null)
  // The second overlay slot. It holds the whole recap object rather than an id,
  // because a saved catch-up must still open after `daily.json` has rotated and
  // `getRecap` no longer knows about it.
  const [openRecap, setOpenRecap] = useState(null)
  const [theme, setTheme] = useState(loadTheme)
  const [clearMessage, setClearMessage] = useState('')
  const originRef = useRef(null)

  const { savedIds, savedStories, isSaved, isSnapshotSaved, toggleSave, toggleSnapshot,
    removeSnapshot, clearAll, storageMessage,
    retry: retryStories, hasPendingChanges: pendingStories } = useSavedStories()
  const {
    savedRecaps,
    isSaved: isRecapSaved,
    toggleSave: toggleSaveRecap,
    clearAll: clearAllRecaps,
    storageMessage: recapStorageMessage,
    retry: retryRecaps,
    hasPendingChanges: pendingRecaps,
  } = useSavedRecaps()
  const { depth, setDepth } = useReadingDepth()

  const editionKey = meta.date || 'unknown-edition'
  const { readStoryIds, readLookup, toggleRead, markAllRead, resetRead,
    storageMessage: readStorageMessage } = useReadProgress(editionKey, stories)
  const progressAndSavedMessage = [clearMessage, storageMessage, recapStorageMessage, readStorageMessage].filter(Boolean).join(' ')
  const canRetryStorage = pendingStories || pendingRecaps
  const retryStorage = useCallback(() => {
    setClearMessage('')
    if (pendingStories) retryStories()
    if (pendingRecaps) retryRecaps()
  }, [pendingStories, pendingRecaps, retryStories, retryRecaps])

  // Unavailable legacy entries are visible and removable, so they also count.
  const savedCount = savedStories.length + savedRecaps.length

  const dateLabel = parseDateOnly(meta.date) ? formatDate(meta.date) : ''
  const updatedLabel = formatUpdated(meta.generatedAt)
  const openStory = openSelection?.story
  const openCategory = openSelection?.category

  const storyRecap = openSelection?.recap

  // A recap has no category of its own, so it borrows the accent of the first
  // story it serves that is still in this edition. A saved catch-up read after
  // the briefing rotated resolves nothing and stays on the neutral token.
  const openRecapCategory = useMemo(() => {
    if (openSelection?.archived) return openSelection.category
    const ids = Array.isArray(openRecap?.story_ids) ? openRecap.story_ids : []
    for (const id of ids) {
      const story = getStory(id)
      const category = story ? getStoryCategory(story.id) : null
      if (category) return category
    }
    return null
  }, [openRecap, openSelection])

  const recapBackLabel = openSelection ? 'Back to the story' : 'Back to saved'

  const freshness = [
    `${meta.publishedCount} ${meta.publishedCount === 1 ? 'story' : 'stories'}`,
    `${meta.categoryCount} ${meta.categoryCount === 1 ? 'section' : 'sections'}`,
    updatedLabel,
  ]
    .filter(Boolean)
    .join(' · ')

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
    if (!openSelection) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [openSelection])

  useEffect(() => {
    if (openSelection || !originRef.current) return
    originRef.current.focus({ preventScroll: true })
    originRef.current = null
  }, [openSelection])

  const handleOpenStory = useCallback((storyId, originElement) => {
    const story = getStory(storyId)
    if (!story) return
    originRef.current = originElement ?? null
    setOpenSelection({ story, category: getStoryCategory(story.id), recap: getRecap(story.recap_id),
      snapshot: snapshotForCurrentStory(storyId), archived: false })
  }, [])

  const handleOpenSavedStory = useCallback((entry, originElement) => {
    if (entry.status !== 'readable') return
    originRef.current = originElement ?? null
    setOpenSelection({ story: entry.story, category: entry.category, recap: entry.recap,
      snapshot: entry, archived: true })
  }, [])

  const handleToggleReaderSave = useCallback(() => {
    if (openSelection?.snapshot) toggleSnapshot(openSelection.snapshot)
  }, [openSelection, toggleSnapshot])
  const isReaderSaved = useCallback(() => isSnapshotSaved(openSelection?.snapshot),
    [isSnapshotSaved, openSelection])

  const handleCloseReader = useCallback(() => {
    setOpenSelection(null)
    setOpenRecap(null)
  }, [])

  const handleOpenRecap = useCallback((recap) => {
    if (!recap || typeof recap !== 'object' || Array.isArray(recap) || !recap.id) return
    setOpenRecap(recap)
  }, [])

  // Closing the catch-up only drops the catch-up. The story reader underneath
  // was never unmounted, so it comes back exactly as it was left.
  const handleCloseRecap = useCallback(() => {
    setOpenRecap(null)
  }, [])

  const handleClearAllSaved = useCallback(() => {
    const storiesCleared = clearAll()
    const recapsCleared = clearAllRecaps()
    setClearMessage('Last Clear all: ' + [
      storiesCleared ? 'Saved stories cleared in this browser.' : 'Saved-story clear is not persisted.',
      recapsCleared ? 'Saved catch-ups cleared in this browser.' : 'Catch-up clear is not persisted.',
    ].join(' '))
  }, [clearAll, clearAllRecaps])

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab(nextTab)
    setOpenSelection(null)
    setOpenRecap(null)
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
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5">
            <div className="min-w-0">
              {dateLabel ? (
                <p className="m-0 text-meta text-text-secondary">
                  <time dateTime={meta.date}>{dateLabel}</time>
                </p>
              ) : null}
              {freshness ? (
                <p className="mt-0.5 mb-0 text-caption text-text-muted">{freshness}</p>
              ) : null}
            </div>
            {activeTab === 'today' ? (
              <ErrorBoundary label="The reading-depth control" fallback={null}>
                <DepthControl
                  depth={depth}
                  onChange={setDepth}
                  minutes={DEPTH_MINUTES}
                  className="-my-0.5 shrink-0"
                />
              </ErrorBoundary>
            ) : null}
          </div>
          <p className="mt-1 mb-0 text-caption text-text-muted">
            Automated summaries · no original reporting
          </p>
        </div>
      </header>

      <EditionFreshness editionDate={meta.date} className={SHELL} />

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
        {!openSelection && !openRecap ? <SavedStoryStatus message={progressAndSavedMessage} onRetry={retryStorage} canRetry={canRetryStorage} floating="page" /> : null}
        {activeTab === 'today' ? (
          <ErrorBoundary label="The feed">
            <div
              id="feed-panel"
              role="tabpanel"
              aria-labelledby={categoryTabId(activeCategory)}
              tabIndex={0}
            >
              {partialEdition ? (
                <p role="status" className="my-3 rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-meta text-text-secondary">
                  This edition is incomplete. Available stories are shown; some records or section details could not be used.
                </p>
              ) : null}
              <Feed
                categories={categories}
                allStories={stories}
                activeCategory={activeCategory}
                depth={depth}
                readStoryIds={readStoryIds}
                readLookup={readLookup}
                onToggleRead={toggleRead}
                onMarkAllRead={markAllRead}
                onResetRead={resetRead}
                onOpenStory={handleOpenStory}
                savedIds={savedIds}
                isSaved={isSaved}
                onToggleSave={toggleSave}
                onBrowseSaved={() => handleTabChange('saved')}
              />
            </div>
          </ErrorBoundary>
        ) : null}

        {activeTab === 'saved' ? (
          <ErrorBoundary label="Your saved stories">
            <SavedPage
              stories={savedStories}
              recaps={savedRecaps}
              onOpenStory={handleOpenSavedStory}
              onOpenRecap={handleOpenRecap}
              onToggleSave={removeSnapshot}
              onToggleSaveRecap={toggleSaveRecap}
              onClearAll={handleClearAllSaved}
              onBrowse={handleTabChange}
            />
          </ErrorBoundary>
        ) : null}

        {activeTab === 'you' ? (
          <ErrorBoundary label="Your reading progress">
            <YouPage
              categories={categories}
              stories={stories}
              readStoryIds={readStoryIds}
              savedCount={savedCount}
              onMarkAllRead={markAllRead}
              onResetRead={resetRead}
              theme={theme}
              onThemeChange={setTheme}
              dateLabel={dateLabel}
              updatedLabel={updatedLabel}
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

      {/*
        The catch-up is declared before the reader so its own section ids win in
        document order while it is the dialog on top; `z-[60]` keeps it above
        the reader regardless. The reader stays mounted underneath and inert, so
        closing the catch-up hands it back with its scroll position intact.
      */}
      <ErrorBoundary label="The catch-up">
        {openRecap ? (
          <RecapView
            recap={openRecap}
            category={openRecapCategory}
            backLabel={recapBackLabel}
            onClose={handleCloseRecap}
            isSaved={isRecapSaved}
            onToggleSave={toggleSaveRecap}
            storageMessage={progressAndSavedMessage}
            onRetryStorage={retryStorage}
            canRetryStorage={canRetryStorage}
          />
        ) : null}
      </ErrorBoundary>

      <ErrorBoundary label="The story reader">
        {openStory ? (
          <StoryReader
            story={openStory}
            category={openCategory}
            onClose={handleCloseReader}
            isSaved={isReaderSaved}
            onToggleSave={handleToggleReaderSave}
            isRead={readLookup.has(openStory.id)}
            onToggleRead={openSelection.archived ? undefined : toggleRead}
            recap={storyRecap}
            onOpenRecap={handleOpenRecap}
            suspended={Boolean(openRecap)}
            archiveEdition={openSelection.archived ? openSelection.snapshot.edition : null}
            storageMessage={progressAndSavedMessage}
            onRetryStorage={retryStorage}
            canRetryStorage={canRetryStorage}
          />
        ) : null}
      </ErrorBoundary>
    </div>
  )
}

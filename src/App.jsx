import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BottomNav, { TopNav } from './components/BottomNav.jsx'
import CategoryNav from './components/CategoryNav.jsx'
import DeferredView from './components/DeferredView.jsx'
import DepthControl from './components/DepthControl.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import EditionFreshness from './components/EditionFreshness.jsx'
import Feed from './components/Feed.jsx'
import SavedStoryStatus from './components/SavedStoryStatus.jsx'
import { readerView, recapView, quizView, savedView, youView } from './lib/deferredViews.js'
import { estimateDepthMinutes, useReadingDepth } from './hooks/useReadingDepth.js'
import { useCommunity } from './hooks/useCommunity.js'
import { usePersonal } from './hooks/usePersonal.js'
import { useReadProgress } from './hooks/useReadProgress.js'
import { useSavedRecaps } from './hooks/useSavedRecaps.js'
import { snapshotForCurrentStory, useSavedStories } from './hooks/useSavedStories.js'
import {
  categories,
  ALL_CATEGORIES,
  categoryTabId,
  getCategory,
  getStoryCategory,
  getRecap,
  getStory,
  meta,
  partialEdition,
  recaps,
  stories,
} from './lib/data.js'
import { FOR_YOU, followMatches, hasLocation, interestMatches, locationMatches } from './lib/personal.js'
import { formatDate, formatUpdated, parseDateOnly } from './lib/format.js'

const THEME_STORAGE_KEY = 'aware-daily:theme'

function captureReaderOrigin(element) {
  if (!(element instanceof HTMLElement) || !element.isConnected || element.closest('[role="dialog"]')) return null
  const anchor = element.closest('article') ?? element
  return {
    element,
    anchor,
    top: anchor.getBoundingClientRect().top,
    openerTop: element.getBoundingClientRect().top,
  }
}

/**
 * What each depth costs to read, measured from the edition on disk rather than
 * hardcoded. The briefing never changes shape at runtime, so this is computed
 * once at module load.
 */
const DEPTH_MINUTES = stories.length ? estimateDepthMinutes(stories) : null

const EDITION_COUNTRIES = [...new Set(stories.flatMap((story) => story.countries.map((country) => country.name)).filter(Boolean))]

// The quiz's practice pool: each section's lead, which every reader sees first.
const PRACTICE_STORIES = categories.map((category) => category.stories[0]).filter(Boolean)

const labelForCategory = (key) => getCategory(key)?.label || key

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
  const [forYouOrigin, setForYouOrigin] = useState(null)
  // The second overlay slot. It holds the whole recap object rather than an id,
  // because a saved catch-up must still open after `daily.json` has rotated and
  // `getRecap` no longer knows about it.
  const [openRecap, setOpenRecap] = useState(null)
  const [theme, setTheme] = useState(loadTheme)
  const [clearMessage, setClearMessage] = useState('')
  const [editInterests, setEditInterests] = useState(false)
  const originRef = useRef(null)
  const returnSpaceRef = useRef(null)

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
  const personal = usePersonal(editionKey)
  const community = useCommunity(editionKey)
  const [quizOpen, setQuizOpen] = useState(false)
  const modalOpen = Boolean(openSelection || openRecap || quizOpen)
  const { prefs, likes, follows } = personal

  const forYou = useMemo(() => {
    const following = followMatches(stories, recaps, follows, editionKey)
    const near = hasLocation(prefs) ? locationMatches(stories, prefs) : []
    const interests = interestMatches(stories, prefs, likes, { labelFor: labelForCategory })
    const ids = new Set([
      ...following.flatMap((entry) => entry.related.map((match) => match.story.id)),
      ...near.map((match) => match.story.id),
      ...interests.map((match) => match.story.id),
    ])
    // Each followed story is one entry in the tab, whether or not it has news today.
    return { following, near, interests, count: ids.size + following.length }
  }, [editionKey, follows, likes, prefs])

  // Keep the browsed list (and its exact opener) through reader saves and return.
  // Navigation, changed preferences or an explicit feed unfollow refresh it.
  const forYouContext = JSON.stringify([editionKey, prefs])
  if (forYouOrigin && forYouOrigin.context !== forYouContext) setForYouOrigin(null)
  const browsingForYou = forYouOrigin?.context === forYouContext
    ? forYouOrigin.matches : forYou

  const readStories = useMemo(() => stories.filter((story) => readLookup.has(story.id)), [readLookup])

  const { retry: retryPersonal, hasPendingChanges: pendingPersonal } = personal
  const progressAndSavedMessage = [clearMessage, storageMessage, recapStorageMessage, readStorageMessage, personal.message].filter(Boolean).join(' ')
  const canRetryStorage = pendingStories || pendingRecaps || pendingPersonal
  const retryStorage = useCallback(() => {
    setClearMessage('')
    if (pendingStories) retryStories()
    if (pendingRecaps) retryRecaps()
    if (pendingPersonal) retryPersonal()
  }, [pendingStories, pendingRecaps, pendingPersonal, retryStories, retryRecaps, retryPersonal])

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

  const recapBackLabel = openSelection ? 'Back to the story' : activeTab === 'saved' ? 'Back to saved' : 'Back to the briefing'

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
    if (!modalOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [modalOpen])

  useEffect(() => {
    if (returnSpaceRef.current) returnSpaceRef.current.style.height = '0px'
  }, [activeTab, activeCategory, depth])

  useEffect(() => {
    if (openSelection || openRecap || quizOpen || !originRef.current) return
    const { element, anchor, top, openerTop } = originRef.current
    // Wait for dialog cleanups and the unlocked layout before measuring.
    let frame
    const restore = (settled = false) => {
      if (settled) originRef.current = null
      if (element.isConnected) element.focus({ preventScroll: true })
      if (!anchor.isConnected) return
      const cardDisplacement = anchor.getBoundingClientRect().top - top
      // Desktop depth changes also move the headline within its card.
      // Balance both origins to minimize their largest return displacement.
      const openerDisplacement = element.isConnected
        ? element.getBoundingClientRect().top - openerTop
        : cardDisplacement
      const displacement = (cardDisplacement + openerDisplacement) / 2
      // A shorter feed can put the desired origin beyond its new scroll limit.
      // Reserve only the missing space, until the next feed/depth change.
      const space = returnSpaceRef.current
      const shortfall = window.scrollY + displacement + window.innerHeight - document.documentElement.scrollHeight
      if (space && shortfall > 0) {
        space.style.height = `${space.offsetHeight + Math.ceil(shortfall)}px`
      }
      if (displacement) window.scrollBy({ top: displacement, behavior: 'instant' })
      // Scroll anchoring can settle after the first unlocked layout.
      if (!settled) frame = requestAnimationFrame(() => restore(true))
    }
    frame = requestAnimationFrame(() => restore())
    return () => cancelAnimationFrame(frame)
  }, [openSelection, openRecap, quizOpen])

  const handleOpenStory = useCallback((storyId, originElement) => {
    const story = getStory(storyId)
    if (!story) return
    if (activeTab === 'today' && activeCategory === FOR_YOU) {
      setForYouOrigin({ matches: browsingForYou, context: forYouContext })
    }
    originRef.current = captureReaderOrigin(originElement)
    setOpenSelection({ story, category: getStoryCategory(story.id), recap: getRecap(story.recap_id),
      snapshot: snapshotForCurrentStory(storyId), archived: false })
  }, [activeTab, activeCategory, browsingForYou, forYouContext])

  const handleOpenSavedStory = useCallback((entry, originElement) => {
    if (entry.status !== 'readable') return
    originRef.current = captureReaderOrigin(originElement)
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
    setEditInterests(false)
    setForYouOrigin(null)
    setActiveTab(nextTab)
    setOpenSelection(null)
    setOpenRecap(null)
    setQuizOpen(false)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }, [])

  const handleCategoryChange = useCallback((category) => {
    setForYouOrigin(null)
    setActiveCategory(category)
  }, [])

  const handleUnfollow = (key) => {
    setForYouOrigin(null)
    personal.removeFollow(key)
  }

  const handleEditInterests = useCallback(() => {
    handleTabChange('you')
    setEditInterests(true)
  }, [handleTabChange])

  const openQuiz = useCallback(() => setQuizOpen({ readStories, editionKey, best: personal.quizScore }),
    [readStories, editionKey, personal.quizScore])
  const closeQuiz = useCallback(() => setQuizOpen(false), [])

  // Likes, notes and follows on a saved copy belong to the edition it came from.
  const archivedEdition = openSelection?.snapshot?.edition
  const readerEdition = openSelection?.archived
    ? archivedEdition?.date || archivedEdition?.generatedAt || 'unknown-edition'
    : editionKey
  const communityMe = community.me
  const sharedReady = communityMe.community && /^\d{4}-\d{2}-\d{2}$/.test(readerEdition)
  const privateLiked = openStory ? personal.isLiked(openStory.id, readerEdition) : false
  const sharedLiked = openStory && sharedReady ? community.likedShared(openStory.id, readerEdition) : false
  const readerTake = openStory ? {
    edition: readerEdition,
    liked: privateLiked || sharedLiked,
    followed: personal.isFollowed(openStory.id, readerEdition),
    note: personal.noteFor(openStory.id, readerEdition),
    notePending: personal.isNotePending(openStory.id, readerEdition),
    notePersisted: personal.isNotePersisted(openStory.id, readerEdition),
    // One button, two records: the private like always, and the shared count
    // when signed in. Both are moved to the same target state, never toggled apart.
    onToggleLike: () => {
      const target = !(privateLiked || sharedLiked)
      if (privateLiked !== target) personal.toggleLike(openStory, openCategory, readerEdition)
      if (sharedReady && communityMe.signedIn && sharedLiked !== target) community.toggleShared(openStory, openCategory, readerEdition)
    },
    onToggleFollow: () => personal.toggleFollow(openStory, openCategory, readerEdition),
    onSaveNote: (note) => personal.setNote(openStory, openCategory, note, readerEdition),
    sharedLikes: sharedReady ? community.likeCount(openStory.id, readerEdition) : null,
    communityNote: sharedReady
      ? community.message || (communityMe.signedIn ? '' : 'Your like is saved in this browser. Sign in below to add it to the readers’ count.')
      : '',
  } : null
  const readerDiscussion = openStory && sharedReady ? {
    me: communityMe,
    edition: readerEdition,
    onCountChange: (delta) => community.adjustComments(openStory.id, delta),
  } : null

  return (
    <div className="min-h-svh bg-surface text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:border-border focus:bg-surface-card focus:px-4 focus:py-2 focus:text-meta focus:font-semibold"
      >
        Skip to the briefing
      </a>

      <header className="border-b border-border-subtle bg-surface">
        <div className={`${SHELL} flex items-start justify-between gap-4 pt-4 lg:pt-6`}>
          <div className="min-w-0">
            <h1 className="m-0">
              <Wordmark />
            </h1>
            <p className="mt-0.5 mb-0 pl-8 text-caption text-text-muted">
              Automated summaries · no original reporting
            </p>
          </div>
          <TopNav activeTab={activeTab} onTabChange={handleTabChange} savedCount={savedCount} />
        </div>
        <div className={`${SHELL} flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pt-4 pb-3 lg:pt-5 lg:pb-4`}>
          <div className="min-w-0">
            {dateLabel ? (
              <p className="m-0 text-[15px] leading-5 font-semibold tracking-[-0.005em] text-text-primary">
                <time dateTime={meta.date}>{dateLabel}</time>
              </p>
            ) : null}
            {freshness ? (
              <p className="mt-0.5 mb-0 text-meta text-text-muted">{freshness}</p>
            ) : null}
            <EditionFreshness editionDate={meta.date} />
          </div>
          {activeTab === 'today' ? (
            <ErrorBoundary label="The reading-depth control" fallback={null}>
              <DepthControl
                depth={depth}
                onChange={setDepth}
                minutes={DEPTH_MINUTES}
                className="-ml-0.5 shrink-0"
              />
            </ErrorBoundary>
          ) : null}
        </div>
      </header>

      {activeTab === 'today' ? (
        <ErrorBoundary label="The category navigation">
          <div className="sticky top-0 z-20 border-b border-border-subtle bg-surface/95 backdrop-blur-md">
            <nav className={SHELL} aria-label="Categories">
              <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onSelect={handleCategoryChange}
                forYouCount={browsingForYou.count}
              />
            </nav>
          </div>
        </ErrorBoundary>
      ) : null}

      <main
        id="main-content"
        className={`${SHELL} pb-10 lg:pb-16`}
      >
        {!openSelection && !openRecap && !quizOpen ? <SavedStoryStatus message={progressAndSavedMessage} onRetry={retryStorage} canRetry={canRetryStorage} floating="page" /> : null}
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
                forYou={browsingForYou}
                prefs={prefs}
                onOpenRecap={handleOpenRecap}
                onEditInterests={handleEditInterests}
                onUnfollow={handleUnfollow}
                onOpenQuiz={openQuiz}
                community={communityMe}
                editionDate={meta.date}
                onCancelForYou={() => handleCategoryChange(ALL_CATEGORIES)}
              />
            </div>
          </ErrorBoundary>
        ) : null}

        {activeTab === 'saved' ? (
          <ErrorBoundary label="Your saved stories">
            <DeferredView resource={savedView} label="Saved stories" onCancel={() => handleTabChange('today')}>
              {(SavedPage) => <SavedPage
              stories={savedStories}
              recaps={savedRecaps}
              onOpenStory={handleOpenSavedStory}
              onOpenRecap={handleOpenRecap}
              onToggleSave={removeSnapshot}
              onToggleSaveRecap={toggleSaveRecap}
              onClearAll={handleClearAllSaved}
              onBrowse={handleTabChange}
              />}
            </DeferredView>
          </ErrorBoundary>
        ) : null}

        {activeTab === 'you' ? (
          <ErrorBoundary label="Your reading progress">
            <DeferredView resource={youView} label="Your settings" onCancel={() => handleTabChange('today')}>
              {(YouPage) => <YouPage
               focusInterests={editInterests}
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
                personalSettings={{ categories, editionCountries: EDITION_COUNTRIES, personal,
                  onOpenQuiz: openQuiz, readCount: readStories.length, community: communityMe }}
                communitySettings={{ me: communityMe, onChanged: community.refreshStats }}
              />}
            </DeferredView>
          </ErrorBoundary>
        ) : null}
      </main>

      {/* The mobile tab bar is fixed, so the page ends with its height in padding
          and the footer disclaimer is never hidden underneath it. */}
      <footer className="border-t border-border-subtle bg-surface pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <p className={`${SHELL} my-0 py-4 text-caption text-text-muted`}>
          Automated daily briefing that summarizes reporting from named news organizations
          and links to original coverage; it does no original reporting.
        </p>
      </footer>
      <div ref={returnSpaceRef} aria-hidden="true" style={{ overflowAnchor: 'none' }} />

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} savedCount={savedCount} />

      {/*
        The catch-up is declared before the reader so its own section ids win in
        document order while it is the dialog on top; `z-[60]` keeps it above
        the reader regardless. The reader stays mounted underneath and inert, so
        closing the catch-up hands it back with its scroll position intact.
      */}
      <ErrorBoundary label="The catch-up">
        {openRecap ? (
          <DeferredView resource={recapView} label="The catch-up" modal onCancel={handleCloseRecap}>
            {(RecapView, returnFocus) => <RecapView
            returnFocus={returnFocus}
            recap={openRecap}
            category={openRecapCategory}
            backLabel={recapBackLabel}
            onClose={handleCloseRecap}
            isSaved={isRecapSaved}
            onToggleSave={toggleSaveRecap}
            storageMessage={progressAndSavedMessage}
            onRetryStorage={retryStorage}
            canRetryStorage={canRetryStorage}
            />}
          </DeferredView>
        ) : null}
      </ErrorBoundary>

      <ErrorBoundary label="The story reader">
        {openStory ? (
          <DeferredView resource={readerView} label="The story reader" modal onCancel={handleCloseReader}>
            {(StoryReader, returnFocus) => <StoryReader
            returnFocus={returnFocus}
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
            take={readerTake}
            discussion={readerDiscussion}
            />}
          </DeferredView>
        ) : null}
      </ErrorBoundary>

      <ErrorBoundary label="The quiz">
        {quizOpen ? (
          <DeferredView resource={quizView} label="The quiz" modal onCancel={closeQuiz}>
            {(QuizView, returnFocus) => <QuizView
            returnFocus={returnFocus}
            readStories={readStories}
            initialStart={quizOpen}
            practiceStories={PRACTICE_STORIES}
            editionStories={stories}
            editionKey={editionKey}
            best={personal.quizScore}
            onFinish={personal.recordQuiz}
            onClose={closeQuiz}
            onOpenStory={handleOpenStory}
            storageMessage={progressAndSavedMessage}
            onRetryStorage={retryStorage}
            canRetryStorage={canRetryStorage}
            />}
          </DeferredView>
        ) : null}
      </ErrorBoundary>
    </div>
  )
}

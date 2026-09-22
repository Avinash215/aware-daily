import StoryCard from './StoryCard.jsx'
import { DEFAULT_DEPTH } from '../hooks/useReadingDepth.js'
import { getStoryCategory } from '../lib/data.js'
import { formatDate } from '../lib/format.js'

function Block({ id, title, detail, children }) {
  return (
    <section aria-labelledby={id} className="mt-10 first:mt-6">
      <div className="flex items-baseline justify-between gap-4 border-t-2 border-text-primary pt-2.5">
        <h3 id={id} className="m-0 font-display text-[19px] leading-6 font-semibold text-text-primary lg:text-[21px]">
          {title}
        </h3>
        {detail ? <p className="m-0 shrink-0 text-[11px] leading-4 font-medium text-text-muted">{detail}</p> : null}
      </div>
      {children}
    </section>
  )
}

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`

/**
 * The reader's personal view of this edition: what continues from stories
 * they follow, what concerns the place they chose, and what matches their
 * interests and likes. It only selects from the loaded edition.
 */
export default function ForYou({
  forYou,
  prefs,
  depth = DEFAULT_DEPTH,
  readLookup,
  onToggleRead,
  onOpenStory,
  isSaved,
  onToggleSave,
  onOpenRecap,
  onEditInterests,
  onUnfollow,
  onOpenQuiz,
}) {
  const { following, near, interests } = forYou
  const nothingSet = !following.length && !near.length && !interests.length
    && !prefs.keywords.length && !prefs.sections.length && !prefs.country && !prefs.region

  const row = (story, reason) => (
    <StoryCard
      key={story.id}
      story={story}
      category={getStoryCategory(story.id)}
      kicker={getStoryCategory(story.id)?.label || ''}
      reason={reason}
      depth={depth}
      isSaved={isSaved?.(story.id)}
      isRead={readLookup.has(story.id)}
      onToggleRead={onToggleRead}
      onToggleSave={onToggleSave}
      onOpenStory={onOpenStory}
    />
  )

  return (
    <div className="pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 font-display text-[26px] leading-8 font-semibold text-text-primary">For you</h2>
          <p className="mt-1 mb-0 max-w-[40rem] text-meta text-text-secondary">
            Chosen from this edition by what you follow, your location and your interests. Your settings stay in
            this browser; Aware publishes the same edition for everyone.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenQuiz}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface-card px-4 text-meta font-semibold text-text-primary hover:bg-surface-muted"
          >
            Quiz me
          </button>
          <button
            type="button"
            onClick={onEditInterests}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-text-primary px-4 text-meta font-semibold text-surface"
          >
            Edit interests
          </button>
        </div>
      </div>

      {nothingSet ? (
        <div className="mt-6 rounded-xl border border-border-subtle bg-surface-card p-5">
          <p className="m-0 font-display text-[19px] leading-6 font-semibold text-text-primary">Nothing personal yet</p>
          <ul className="mt-2 mb-0 flex list-disc flex-col gap-1 pl-5 text-[14px] leading-[1.5] text-text-secondary">
            <li>Add topics or keywords you care about, such as “AI” or “Venezuela”.</li>
            <li>Pick your country or region to see stories about where you are.</li>
            <li>Open a story and choose Follow to track it into later editions.</li>
          </ul>
        </div>
      ) : null}

      {following.length ? (
        <Block id="for-you-following" title="Following" detail={plural(following.length, 'story', 'stories')}>
          <ul className="m-0 list-none p-0">
            {following.map(({ follow, sameEdition, recap, related }) => (
              <li key={follow.key} className="border-b border-border-subtle py-4 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] leading-4 font-semibold uppercase tracking-[0.08em] text-text-muted">
                      {follow.categoryLabel || 'Story'}{follow.edition ? ` · followed from ${formatDate(follow.edition) || follow.edition}` : ''}
                    </p>
                    <p className="mt-1 mb-0 font-display text-row leading-[1.3] font-semibold text-text-primary lg:text-row-lg">
                      {follow.headline}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnfollow?.(follow.key)}
                    aria-label={`Stop following: ${follow.headline}`}
                    className="-mr-2 inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border-0 bg-transparent px-3 text-meta font-semibold text-text-muted hover:text-text-primary"
                  >
                    Unfollow
                  </button>
                </div>

                {recap ? (
                  <button
                    type="button"
                    onClick={() => onOpenRecap?.(recap)}
                    className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface-card px-4 py-3 text-left hover:bg-surface-muted"
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] leading-5 font-semibold text-text-primary">Catch-up ready</span>
                      <span className="mt-0.5 block text-[13px] leading-[1.35] text-text-secondary">{recap.title || 'How this story got here'}</span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-text-muted">→</span>
                  </button>
                ) : null}

                {related.length ? (
                  <div className="mt-2">
                    {related.map(({ story, shared }) => row(story, `Shares: ${shared.slice(0, 4).join(', ')}`))}
                  </div>
                ) : !recap ? (
                  <p className="mt-2 mb-0 text-meta text-text-muted">
                    {sameEdition
                      ? 'Followed from this edition. Later editions will show related coverage and any catch-up here.'
                      : 'Nothing new on this story in this edition.'}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {prefs.country || prefs.region ? (
        <Block
          id="for-you-near"
          title={`Near you${prefs.country ? ` · ${prefs.country}` : prefs.region ? ` · ${prefs.region}` : ''}`}
          detail={near.length ? plural(near.length, 'story', 'stories') : ''}
        >
          {near.length ? (
            <div className="mt-1">{near.map(({ story, reasons }) => row(story, reasons.join(' · ')))}</div>
          ) : (
            <p className="mt-3 mb-0 text-meta text-text-muted">
              No story in this edition is about {prefs.country || prefs.region}. Aware’s edition covers national and
              world news, not dedicated local reporting.
            </p>
          )}
        </Block>
      ) : null}

      {prefs.keywords.length || prefs.sections.length || interests.length ? (
        <Block id="for-you-interests" title="Your interests" detail={interests.length ? plural(interests.length, 'match', 'matches') : ''}>
          {interests.length ? (
            <div className="mt-1">{interests.map(({ story, reasons }) => row(story, `Matched: ${reasons.join(' · ')}`))}</div>
          ) : (
            <p className="mt-3 mb-0 text-meta text-text-muted">Nothing in this edition matches your interests.</p>
          )}
        </Block>
      ) : null}
    </div>
  )
}

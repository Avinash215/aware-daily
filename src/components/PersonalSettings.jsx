import { useId, useMemo, useState } from 'react'
import { curationExport, likeLeaderboard, parseKeywords } from '../lib/personal.js'
import { formatDate } from '../lib/format.js'
import { quizScoreLabel } from '../lib/quizResults.js'

const REGIONS = ['Africa', 'Americas', 'Asia Pacific', 'Europe', 'Middle East']

const COMMON_COUNTRIES = [
  'Argentina', 'Australia', 'Bangladesh', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia', 'Egypt',
  'Ethiopia', 'France', 'Germany', 'Ghana', 'India', 'Indonesia', 'Iran', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria',
  'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Russia', 'Saudi Arabia', 'Singapore',
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand',
  'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Venezuela', 'Vietnam',
]

const card = 'mt-2 rounded-xl border border-border-subtle bg-surface-card p-4'
const heading = 'text-caption font-semibold tracking-[0.16em] text-text-muted uppercase'
const pill = (on) =>
  `inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-meta font-semibold transition-colors duration-150 motion-reduce:transition-none ${
    on ? 'border-text-primary bg-text-primary text-surface' : 'border-border bg-surface text-text-secondary hover:text-text-primary'
  }`

function Heading({ id, children }) {
  return <h3 id={id} className={heading}>{children}</h3>
}

/**
 * Personal settings on the You tab: interests, location, curation notes,
 * the reader's own leaderboard of likes, followed stories and the quiz.
 */
export default function PersonalSettings({
  categories = [],
  editionCountries = [],
  personal,
  onOpenQuiz,
  readCount = 0,
  community = null,
}) {
  const baseId = useId()
  const { prefs, updatePrefs, likes, removeLike, follows, removeFollow, quizScore } = personal
  const [keywordDraft, setKeywordDraft] = useState('')
  // Local only while the reader is editing, so another tab's saved text is not overwritten.
  const [instructionsDraft, setInstructionsDraft] = useState(null)
  const instructions = instructionsDraft ?? prefs.instructions
  const [copyState, setCopyState] = useState('')
  const [placeDraft, setPlaceDraft] = useState(null)
  const place = placeDraft ?? prefs.place
  const localNews = Boolean(community?.available && community?.localNews)
  const savePlace = (event) => {
    event?.preventDefault?.()
    if (placeDraft !== null && placeDraft.trim() !== prefs.place) updatePrefs({ place: placeDraft.trim() })
    setPlaceDraft(null)
  }

  const board = useMemo(() => likeLeaderboard(likes), [likes])
  const countries = useMemo(
    () => [...new Set([...editionCountries, ...COMMON_COUNTRIES, prefs.country].filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [editionCountries, prefs.country],
  )
  const sections = categories.filter((category) => category.key && !category.key.startsWith('__aware'))
  const likedByRecent = useMemo(() => likes.slice().sort((a, b) => b.likedAt - a.likedAt), [likes])
  const repeatedTopics = board.topics.filter((entry) => entry.count >= 2)

  const toggleSection = (key) => {
    updatePrefs((current) => ({
      sections: current.sections.includes(key)
        ? current.sections.filter((entry) => entry !== key)
        : [...current.sections, key],
    }))
  }

  const addKeywords = (event) => {
    event.preventDefault()
    const added = parseKeywords(keywordDraft)
    if (!added.length) return
    updatePrefs((current) => ({ keywords: [...current.keywords, ...added] }))
    setKeywordDraft('')
  }

  const removeKeyword = (keyword) => {
    updatePrefs((current) => ({ keywords: current.keywords.filter((entry) => entry !== keyword) }))
  }

  const saveInstructions = () => {
    if (instructionsDraft !== null && instructionsDraft !== prefs.instructions) updatePrefs({ instructions: instructionsDraft })
    setInstructionsDraft(null)
  }

  const copySettings = async () => {
    const text = curationExport({ ...prefs, instructions }, likes)
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('Copied. Paste it wherever you hand notes to your curator.')
    } catch {
      setCopyState('Copy was blocked by the browser. Select the text below and copy it yourself.')
    }
  }

  return (
    <>
      {/* Quiz ------------------------------------------------------------ */}
      <section aria-labelledby={`${baseId}-quiz`} className="mt-8">
        <Heading id={`${baseId}-quiz`}>Quiz</Heading>
        <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div className="min-w-0">
            <p className="m-0 text-row font-semibold text-text-primary">
              {quizScoreLabel(quizScore)}
            </p>
            <p className="mt-0.5 mb-0 text-meta text-text-muted">
              {readCount >= 3
                ? `Five questions from the ${readCount} stories you marked read.`
                : 'Mark at least 3 stories read to build a quiz from them, or practice on the lead stories.'}
            </p>
          </div>
          <button type="button" onClick={onOpenQuiz} className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-text-primary px-5 text-meta font-semibold text-surface">
            Start quiz
          </button>
        </div>
      </section>

      {/* Interests ------------------------------------------------------- */}
      <section id="interests" aria-labelledby={`${baseId}-interests`} className="mt-8 [scroll-margin-top:1rem]">
        <Heading id={`${baseId}-interests`}>Your interests</Heading>
        <div className={card}>
          <fieldset className="m-0 border-0 p-0">
            <legend className="m-0 p-0 text-meta font-semibold text-text-primary">Sections you care about most</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {sections.map((category) => {
                const on = prefs.sections.includes(category.key)
                return (
                  <button key={category.key} type="button" aria-pressed={on} onClick={() => toggleSection(category.key)} className={pill(on)}>
                    {category.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <form onSubmit={addKeywords} className="mt-5">
            <label htmlFor={`${baseId}-keywords`} className="block text-meta font-semibold text-text-primary">
              Topics and keywords
            </label>
            <p className="mt-0.5 mb-0 text-meta text-text-muted">Whole words, separated by commas. For example: AI, Azure, India.</p>
            <div className="mt-2 flex gap-2">
              <input
                id={`${baseId}-keywords`}
                type="text"
                value={keywordDraft}
                maxLength={200}
                onChange={(event) => setKeywordDraft(event.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-[15px] text-text-primary placeholder:text-text-muted"
                placeholder="Add a topic"
              />
              <button type="submit" className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary">
                Add
              </button>
            </div>
            {prefs.keywords.length ? (
              <ul className="mt-3 mb-0 flex list-none flex-wrap gap-2 p-0">
                {prefs.keywords.map((keyword) => (
                  <li key={keyword}>
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      aria-label={`Remove ${keyword}`}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-surface-muted px-3.5 text-meta font-semibold text-text-primary"
                    >
                      {keyword}
                      <span aria-hidden="true" className="text-text-muted">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>

          <div className="mt-5">
            <label htmlFor={`${baseId}-instructions`} className="block text-meta font-semibold text-text-primary">
              How you like your news
            </label>
            <textarea
              id={`${baseId}-instructions`}
              value={instructions}
              maxLength={1000}
              rows={3}
              onChange={(event) => setInstructionsDraft(event.target.value)}
              onBlur={saveInstructions}
              placeholder="For example: more on AI regulation and India, fewer celebrity stories, explain market moves plainly."
              className="mt-1.5 block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[15px] leading-[1.45] text-text-primary placeholder:text-text-muted"
            />
          </div>

          <div className="mt-5 rounded-lg bg-surface-muted p-3.5">
            <p className="m-0 text-meta font-semibold text-text-primary">Shaping future editions</p>
            <p className="mt-1 mb-0 text-meta text-text-secondary">
              Interests and location already choose your For you view in this browser. Aware’s curation runs once a
              day in the cloud and never reads this browser, so to have these settings shape the edition itself,
              copy them and give them to whoever runs your curation.
            </p>
            <button type="button" onClick={copySettings} className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface-card px-4 text-meta font-semibold text-text-primary">
              Copy curation settings
            </button>
            <p className="mt-2 mb-0 text-meta text-text-muted" aria-live="polite">{copyState}</p>
            {copyState.startsWith('Copy was blocked') ? (
              <textarea readOnly rows={6} value={curationExport({ ...prefs, instructions }, likes)} className="mt-2 block w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[12px] text-text-primary" />
            ) : null}
          </div>
        </div>
      </section>

      {/* Location -------------------------------------------------------- */}
      <section aria-labelledby={`${baseId}-location`} className="mt-8">
        <Heading id={`${baseId}-location`}>Your location</Heading>
        <div className={card}>
          <form onSubmit={savePlace}>
            <label htmlFor={`${baseId}-place`} className="block text-meta font-semibold text-text-primary">
              Town or city
            </label>
            <p className="mt-0.5 mb-0 text-meta text-text-muted">For example: Jersey City, NJ or Leeds. Add a state or county to tell same-named places apart.</p>
            <div className="mt-2 flex gap-2">
              <input
                id={`${baseId}-place`}
                type="text"
                value={place}
                maxLength={80}
                onChange={(event) => setPlaceDraft(event.target.value)}
                onBlur={savePlace}
                placeholder="Your town or city"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-[15px] text-text-primary placeholder:text-text-muted"
              />
              <button type="submit" className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary">
                Save
              </button>
            </div>
          </form>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-meta font-semibold text-text-primary">Country</span>
              <select
                value={prefs.country}
                onChange={(event) => updatePrefs({ country: event.target.value })}
                className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-[15px] text-text-primary"
              >
                <option value="">Not set</option>
                {countries.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-meta font-semibold text-text-primary">Region</span>
              <select
                value={prefs.region}
                onChange={(event) => updatePrefs({ region: event.target.value })}
                className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-[15px] text-text-primary"
              >
                <option value="">Not set</option>
                {REGIONS.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-3 mb-0 text-meta text-text-muted">
            Chosen by you, never detected, and different for every reader. For you shows stories in each edition about
            your country or region{localNews ? ', plus the latest headlines from outlets in your town' : ''}.
            {localNews
              ? ' To find those headlines, your town is sent to Aware’s server for that one lookup and is not stored.'
              : ' Local headlines for your town appear on the published site.'}
          </p>
        </div>
      </section>

      {/* Leaderboard ----------------------------------------------------- */}
      <section aria-labelledby={`${baseId}-board`} className="mt-8">
        <Heading id={`${baseId}-board`}>Your leaderboard</Heading>
        <div className={card}>
          {likes.length ? (
            <>
              <p className="m-0 text-meta text-text-secondary">
                Ranked from the {likes.length} {likes.length === 1 ? 'story' : 'stories'} you liked in this browser.
                Only your likes count here; nobody else’s are included.
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {[['Sections', board.sections], ['Countries', board.countries]].map(([label, rows]) => (
                  <div key={label}>
                    <p className="m-0 text-meta font-semibold text-text-primary">{label}</p>
                    {rows.length ? (
                      <ol className="mt-1.5 mb-0 list-none p-0">
                        {rows.map((entry, position) => (
                          <li key={entry.label} className="flex items-center gap-2.5 border-b border-border-subtle py-1.5 text-meta last:border-b-0">
                            <span className="w-4 text-right font-semibold tabular-nums text-text-muted">{position + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-text-primary">{entry.label}</span>
                            <span className="tabular-nums text-text-muted">{entry.count}</span>
                          </li>
                        ))}
                      </ol>
                    ) : <p className="mt-1.5 mb-0 text-meta text-text-muted">None yet.</p>}
                  </div>
                ))}
              </div>
              {repeatedTopics.length ? (
                <p className="mt-4 mb-0 text-meta text-text-secondary">
                  <span className="font-semibold text-text-primary">Topics you keep liking: </span>
                  {repeatedTopics.map((entry) => `${entry.label} (${entry.count})`).join(', ')}
                </p>
              ) : null}

              <p className="mt-5 mb-0 text-meta font-semibold text-text-primary">Stories you liked</p>
              <ul className="mt-1.5 mb-0 list-none p-0">
                {likedByRecent.map((entry) => (
                  <li key={entry.key} className="flex items-start justify-between gap-3 border-b border-border-subtle py-2.5 last:border-b-0">
                    <div className="min-w-0">
                      <p className="m-0 text-[11px] leading-4 font-semibold uppercase tracking-[0.08em] text-text-muted">
                        {[entry.categoryLabel, formatDate(entry.edition) || entry.edition].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mt-0.5 mb-0 font-display text-[15px] leading-5 font-semibold text-text-primary">{entry.headline}</p>
                      {entry.note ? <p className="mt-1 mb-0 text-meta text-text-secondary [overflow-wrap:anywhere]">“{entry.note}”</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLike(entry.key)}
                      aria-label={`Remove like and note: ${entry.headline}`}
                      className="-mr-2 inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border-0 bg-transparent px-3 text-meta font-semibold text-text-muted hover:text-text-primary"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="m-0 text-meta text-text-secondary">
              Like stories from the reader to build your own ranking of the sections, countries and topics you
              value most.{community?.community ? ' The readers’ leaderboard, built from signed-in likes, is under For you.' : ''}
            </p>
          )}
        </div>
      </section>

      {/* Following ------------------------------------------------------- */}
      <section aria-labelledby={`${baseId}-following`} className="mt-8">
        <Heading id={`${baseId}-following`}>Following</Heading>
        <div className={card}>
          {follows.length ? (
            <ul className="m-0 list-none p-0">
              {follows.slice().sort((a, b) => b.followedAt - a.followedAt).map((entry) => (
                <li key={entry.key} className="flex items-start justify-between gap-3 border-b border-border-subtle py-2.5 last:border-b-0">
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] leading-4 font-semibold uppercase tracking-[0.08em] text-text-muted">
                      {[entry.categoryLabel, formatDate(entry.edition) || entry.edition].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-0.5 mb-0 font-display text-[15px] leading-5 font-semibold text-text-primary">{entry.headline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFollow(entry.key)}
                    aria-label={`Stop following: ${entry.headline}`}
                    className="-mr-2 inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border-0 bg-transparent px-3 text-meta font-semibold text-text-muted hover:text-text-primary"
                  >
                    Unfollow
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-meta text-text-secondary">
              Follow a story from the reader and later editions will show related coverage and any catch-up on it
              under For you.
            </p>
          )}
        </div>
      </section>
    </>
  )
}

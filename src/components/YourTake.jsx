import { useId, useState } from 'react'

function Heart({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true" focusable="false">
      <path
        d="M12 20.5s-7.5-4.4-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.7-7.5 10.1-7.5 10.1z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Bell({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true" focusable="false">
      <path
        d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

const toggleClass = (on) =>
  `inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-meta font-semibold transition-colors duration-150 motion-reduce:transition-none ${
    on ? 'border-text-primary bg-text-primary text-surface' : 'border-border bg-surface-card text-text-primary hover:bg-surface-muted'
  }`

/**
 * The reader's own response to a story: like it, follow it into later
 * editions, and keep a private note. Nothing here is shared or sent.
 */
export default function YourTake({ liked = false, followed = false, note = '', onToggleLike, onToggleFollow, onSaveNote, canFollow = true }) {
  const noteId = useId()
  // The parent keys this component by story, so the draft starts from that story's note.
  const [draft, setDraft] = useState(note)
  const [savedAt, setSavedAt] = useState(null)

  const dirty = draft !== note
  const save = () => {
    if (!dirty) return
    onSaveNote?.(draft)
    setSavedAt(Date.now())
  }

  return (
    <section aria-labelledby={`${noteId}-heading`} className="mt-8 max-w-[66ch] rounded-xl border border-border-subtle bg-surface-card p-4">
      <h2 id={`${noteId}-heading`} className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        Your take
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={liked} onClick={onToggleLike} className={toggleClass(liked)}>
          <Heart filled={liked} />
          {liked ? 'Liked' : 'Like'}
        </button>
        {canFollow ? (
          <button type="button" aria-pressed={followed} onClick={onToggleFollow} className={toggleClass(followed)}>
            <Bell filled={followed} />
            {followed ? 'Following' : 'Follow this story'}
          </button>
        ) : null}
      </div>
      {canFollow ? (
        <p className="mt-2 mb-0 text-meta text-text-muted">
          {followed
            ? 'Later editions will show related coverage and any catch-up on this story under For you. A catch-up appears only if the story continues.'
            : 'Follow to see related coverage and catch-ups in later editions.'}
        </p>
      ) : null}

      <label htmlFor={noteId} className="mt-4 block text-meta font-semibold text-text-primary">
        Private note
      </label>
      <textarea
        id={noteId}
        value={draft}
        maxLength={1000}
        rows={3}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        placeholder="What stood out, or what you want to remember."
        className="mt-1.5 block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[15px] leading-[1.45] text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-1"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-meta text-text-muted" aria-live="polite">
          {dirty ? 'Unsaved' : savedAt ? 'Saved in this browser' : 'Notes stay in this browser. Writing one also likes the story.'}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary disabled:cursor-default disabled:opacity-50"
        >
          Save note
        </button>
      </div>
    </section>
  )
}

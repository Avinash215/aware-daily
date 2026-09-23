import { useEffect, useId, useState } from 'react'
import { getComments, loginUrl, postComment, reportComment, timeAgo } from '../lib/api.js'

const NAME_KEY = 'aware-daily:display-name'

function storedName() {
  try {
    return window.localStorage.getItem(NAME_KEY) || ''
  } catch {
    return ''
  }
}

function SignIn({ label }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-meta text-text-secondary">{label}</span>
      <a href={loginUrl('github')} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary no-underline hover:bg-surface-muted">
        Sign in with GitHub
      </a>
      <a href={loginUrl('aad')} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary no-underline hover:bg-surface-muted">
        Sign in with Microsoft
      </a>
    </div>
  )
}

/**
 * Reader discussion for one story. Comments from anyone but the moderator
 * wait for review; the author sees their own pending comment marked as such.
 * Everything is rendered as plain text.
 */
export default function Discussion({ me, edition, story, category, onCountChange }) {
  const baseId = useId()
  const [state, setState] = useState({ loading: true, comments: [], error: '' })
  const [text, setText] = useState('')
  const [name, setName] = useState(() => storedName() || me.displayName || '')
  const [posting, setPosting] = useState(false)
  const [notice, setNotice] = useState('')
  const [reported, setReported] = useState(() => new Set())

  useEffect(() => {
    let live = true
    getComments(edition, story.id)
      .then((result) => {
        if (live) setState({ loading: false, comments: result.comments || [], error: '' })
      })
      .catch(() => {
        if (live) setState({ loading: false, comments: [], error: 'Comments could not be loaded right now.' })
      })
    return () => {
      live = false
    }
  }, [edition, story.id])

  const submit = async (event) => {
    event.preventDefault()
    const body = text.trim()
    if (!body || posting) return
    setPosting(true)
    setNotice('')
    try {
      const result = await postComment({
        edition,
        storyId: story.id,
        text: body,
        displayName: name.trim(),
        headline: story.headline || '',
        category: category?.label || story.category || '',
      })
      try {
        if (name.trim()) window.localStorage.setItem(NAME_KEY, name.trim())
      } catch {
        // The name is only a convenience for next time.
      }
      setText('')
      setState((current) => ({ ...current, comments: [...current.comments, result.comment] }))
      if (result.comment.status === 'visible') onCountChange?.(1)
      setNotice(result.comment.status === 'pending'
        ? 'Thanks. Your comment will appear for others once the moderator approves it.'
        : 'Posted.')
    } catch (error) {
      setNotice(error?.message && error.code !== 'network' ? error.message : 'Your comment could not be posted. Try again.')
    } finally {
      setPosting(false)
    }
  }

  const report = async (comment) => {
    try {
      await reportComment({ edition, storyId: story.id, commentId: comment.id })
      setReported((current) => new Set(current).add(comment.id))
    } catch {
      setNotice('The report could not be sent. Try again.')
    }
  }

  const visibleCount = state.comments.filter((comment) => comment.status === 'visible').length

  return (
    <section aria-labelledby={`${baseId}-heading`} className="mt-8 max-w-[66ch]">
      <div className="flex items-baseline justify-between gap-3 border-t-2 border-text-primary pt-2.5">
        <h2 id={`${baseId}-heading`} className="m-0 font-display text-[19px] leading-6 font-semibold text-text-primary">
          Discussion
        </h2>
        <p className="m-0 text-[11px] font-medium text-text-muted">
          {visibleCount ? `${visibleCount} ${visibleCount === 1 ? 'comment' : 'comments'}` : 'Moderated'}
        </p>
      </div>

      {state.loading ? <p className="mt-3 mb-0 text-meta text-text-muted">Loading comments…</p> : null}
      {state.error ? <p className="mt-3 mb-0 text-meta text-text-muted">{state.error}</p> : null}

      {state.comments.length ? (
        <ul className="mt-2 mb-0 list-none p-0">
          {state.comments.map((comment) => (
            <li key={comment.id} className="border-b border-border-subtle py-3 last:border-b-0">
              <p className="m-0 flex flex-wrap items-center gap-x-2 text-meta">
                <span className="font-semibold text-text-primary">{comment.author}</span>
                <span className="text-text-muted">{timeAgo(comment.createdAt)}</span>
                {comment.status === 'pending' ? (
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Awaiting review
                  </span>
                ) : null}
              </p>
              <p className="mt-1 mb-0 whitespace-pre-line text-[15px] leading-[1.5] text-text-primary [overflow-wrap:anywhere]">{comment.text}</p>
              {me.signedIn && !comment.mine && comment.status === 'visible' ? (
                <button
                  type="button"
                  onClick={() => report(comment)}
                  disabled={reported.has(comment.id)}
                  className="-ml-2 mt-1 inline-flex min-h-11 cursor-pointer items-center rounded-full border-0 bg-transparent px-2 text-meta font-semibold text-text-muted hover:text-text-primary disabled:cursor-default"
                >
                  {reported.has(comment.id) ? 'Reported to the moderator' : 'Report'}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !state.loading && !state.error ? (
        <p className="mt-3 mb-0 text-meta text-text-muted">No comments yet.</p>
      ) : null}

      {me.signedIn ? (
        <form onSubmit={submit} className="mt-4 rounded-xl border border-border-subtle bg-surface-card p-4">
          <label htmlFor={`${baseId}-name`} className="block text-meta font-semibold text-text-primary">
            Name shown with your comment
          </label>
          <input
            id={`${baseId}-name`}
            type="text"
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            placeholder={me.displayName}
            className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-[15px] text-text-primary placeholder:text-text-muted"
          />
          <label htmlFor={`${baseId}-text`} className="mt-3 block text-meta font-semibold text-text-primary">
            Your comment
          </label>
          <textarea
            id={`${baseId}-text`}
            value={text}
            maxLength={1000}
            rows={3}
            onChange={(event) => setText(event.target.value)}
            className="mt-1.5 block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[15px] leading-[1.45] text-text-primary"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-meta text-text-muted">
              {me.moderator ? 'You are the moderator; your comments appear straight away.' : 'Reviewed by the moderator before others see it. Be kind and stay on the story.'}
            </p>
            <button
              type="submit"
              disabled={!text.trim() || posting}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-text-primary px-5 text-meta font-semibold text-surface disabled:cursor-default disabled:opacity-40"
            >
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <SignIn label="Sign in to comment, report or add your like to the count." />
      )}
      <p className="mt-2 mb-0 text-meta text-text-secondary" role="status" aria-live="polite">{notice}</p>
    </section>
  )
}

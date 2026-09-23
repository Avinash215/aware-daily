import { useEffect, useId, useState } from 'react'
import { getModeration, loginUrl, logoutUrl, moderateComment, timeAgo } from '../lib/api.js'

const card = 'mt-2 rounded-xl border border-border-subtle bg-surface-card p-4'
const heading = 'text-caption font-semibold tracking-[0.16em] text-text-muted uppercase'
const action = 'inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary hover:bg-surface-muted disabled:cursor-default disabled:opacity-50'

function QueueItem({ comment, actions, busy, onAct }) {
  return (
    <li className="border-b border-border-subtle py-3 last:border-b-0">
      <p className="m-0 text-[11px] leading-4 font-semibold uppercase tracking-[0.08em] text-text-muted">
        {comment.headline || comment.storyKey}
      </p>
      <p className="mt-1 mb-0 flex flex-wrap items-center gap-x-2 text-meta">
        <span className="font-semibold text-text-primary">{comment.author}</span>
        <span className="text-text-muted">{timeAgo(comment.createdAt)}</span>
        {comment.reports ? <span className="text-text-secondary">{comment.reports} {comment.reports === 1 ? 'report' : 'reports'}</span> : null}
      </p>
      <p className="mt-1 mb-0 whitespace-pre-line text-[15px] leading-[1.5] text-text-primary [overflow-wrap:anywhere]">{comment.text}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map(([key, label]) => (
          <button key={key} type="button" disabled={busy} onClick={() => onAct(comment, key)} className={action}>
            {label}
          </button>
        ))}
      </div>
    </li>
  )
}

/**
 * Sign-in state and, for the moderator, the review queue: new comments to
 * approve or reject, and reported comments to hide or keep.
 */
export default function CommunitySettings({ me, onChanged }) {
  const baseId = useId()
  const [queue, setQueue] = useState({ status: 'idle', pending: [], reported: [] })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const load = () => setReloadKey((value) => value + 1)

  useEffect(() => {
    if (!me.moderator) return undefined
    let live = true
    getModeration()
      .then((result) => {
        if (live) setQueue({ status: 'ready', pending: result.pending || [], reported: result.reported || [] })
      })
      .catch(() => {
        if (live) setQueue({ status: 'error', pending: [], reported: [] })
      })
    return () => {
      live = false
    }
  }, [me.moderator, reloadKey])

  const act = async (comment, kind) => {
    setBusy(true)
    setMessage('')
    try {
      await moderateComment({ storyKey: comment.storyKey, commentId: comment.id, action: kind })
      setMessage({ approve: 'Approved and published.', reject: 'Rejected.', hide: 'Hidden from readers.', dismiss: 'Reports dismissed; the comment stays up.' }[kind])
      load()
      onChanged?.()
    } catch (error) {
      setMessage(error?.message || 'That action did not go through. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!me.available || !me.community) return null

  return (
    <>
      <section aria-labelledby={`${baseId}-account`} className="mt-8">
        <h3 id={`${baseId}-account`} className={heading}>Community account</h3>
        <div className={card}>
          {me.signedIn ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-row font-semibold text-text-primary">
                  Signed in{me.provider ? ` with ${me.provider === 'github' ? 'GitHub' : 'Microsoft'}` : ''}
                  {me.moderator ? ' · Moderator' : ''}
                </p>
                <p className="mt-0.5 mb-0 text-meta text-text-muted">
                  Your likes add to the shared count and you can join discussions. Your email address is never shown.
                </p>
              </div>
              <a href={logoutUrl()} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary no-underline hover:bg-surface-muted">
                Sign out
              </a>
            </div>
          ) : (
            <>
              <p className="m-0 text-meta text-text-secondary">
                Sign in to add your likes to the readers’ leaderboard and to comment. Browsing, saving, notes and the
                quiz never need an account.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={loginUrl('github')} className="inline-flex min-h-11 items-center rounded-full bg-text-primary px-4 text-meta font-semibold text-surface no-underline">
                  Sign in with GitHub
                </a>
                <a href={loginUrl('aad')} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary no-underline hover:bg-surface-muted">
                  Sign in with Microsoft
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      {me.moderator ? (
        <section aria-labelledby={`${baseId}-moderation`} className="mt-8">
          <h3 id={`${baseId}-moderation`} className={heading}>Moderation</h3>
          <div className={card}>
            {queue.status === 'error' ? <p className="m-0 text-meta text-text-muted">The queue could not be loaded.</p> : null}
            <p className="m-0 text-meta font-semibold text-text-primary">
              Waiting for review ({queue.pending.length})
            </p>
            {queue.pending.length ? (
              <ul className="mt-1 mb-0 list-none p-0">
                {queue.pending.map((comment) => (
                  <QueueItem key={comment.id} comment={comment} busy={busy} onAct={act} actions={[['approve', 'Approve'], ['reject', 'Reject']]} />
                ))}
              </ul>
            ) : <p className="mt-1 mb-0 text-meta text-text-muted">Nothing to review.</p>}

            <p className="mt-5 mb-0 text-meta font-semibold text-text-primary">Reported ({queue.reported.length})</p>
            {queue.reported.length ? (
              <ul className="mt-1 mb-0 list-none p-0">
                {queue.reported.map((comment) => (
                  <QueueItem key={comment.id} comment={comment} busy={busy} onAct={act} actions={[['hide', 'Hide'], ['dismiss', 'Keep it up']]} />
                ))}
              </ul>
            ) : <p className="mt-1 mb-0 text-meta text-text-muted">No reports.</p>}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={load} disabled={busy} className={action}>Refresh queue</button>
              <p className="m-0 text-meta text-text-secondary" role="status" aria-live="polite">{message}</p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}

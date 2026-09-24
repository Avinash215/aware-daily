import { useMemo, useState } from 'react'
import { speechSupported, useSpeech } from '../hooks/useSpeech.js'
import { storyUrl } from '../lib/storyLink.js'

const PILL = 'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-meta font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none'

function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', className: 'h-4 w-4 shrink-0', 'aria-hidden': true, focusable: 'false' }
  if (name === 'listen') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10v4h3l5 4V6L7 10H4z" />
        <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" />
      </svg>
    )
  }
  if (name === 'pause') {
    return (
      <svg {...common} fill="currentColor">
        <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
        <rect x="14" y="5" width="3.5" height="14" rx="1" />
      </svg>
    )
  }
  if (name === 'stop') {
    return (
      <svg {...common} fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="1.5" />
      </svg>
    )
  }
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    </svg>
  )
}

function paragraphs(body) {
  return String(body ?? '').split(/\r?\n+/).map((part) => part.trim()).filter(Boolean)
}

/** A phone or tablet gets the system share sheet; a desktop copies the link. */
function prefersShareSheet() {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  return Boolean(window.matchMedia?.('(pointer: coarse)').matches)
}

/**
 * Listen and Share for the open story. Mounted per story (and remounted when
 * a catch-up covers the reader), so speech always stops with the story.
 */
export default function ReaderTools({ story, shareable = true }) {
  const speech = useSpeech()
  const [canSpeak] = useState(speechSupported)
  const [shareSheet] = useState(prefersShareSheet)
  const [shareState, setShareState] = useState({ status: '', url: '' })

  const spoken = useMemo(() => [
    story.headline,
    ...paragraphs(story.body),
    story.so_what ? `Why it matters. ${story.so_what}` : '',
    story.what_now ? `What happens next. ${story.what_now}` : '',
  ], [story])

  const url = shareable ? storyUrl(story.id) : ''

  const share = async () => {
    if (!url) return
    if (shareSheet) {
      try {
        await navigator.share({ title: story.headline, url })
        setShareState({ status: '', url: '' })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareState({ status: 'Link copied. It opens this story in today’s edition.', url: '' })
    } catch {
      setShareState({ status: 'Copy this link:', url })
    }
  }

  if (!canSpeak && !url) return null

  return (
    <div className="mt-4 max-w-[66ch]">
      <div className="flex flex-wrap items-center gap-2">
        {canSpeak ? (
          speech.state === 'idle' ? (
            <button type="button" className={PILL} onClick={() => speech.play(spoken)}>
              <Icon name="listen" />
              Listen
            </button>
          ) : (
            <>
              <button
                type="button"
                className={PILL}
                onClick={speech.state === 'playing' ? speech.pause : speech.resume}
              >
                <Icon name={speech.state === 'playing' ? 'pause' : 'listen'} />
                {speech.state === 'playing' ? 'Pause' : 'Resume'}
              </button>
              <button type="button" className={PILL} onClick={speech.stop}>
                <Icon name="stop" />
                Stop
              </button>
            </>
          )
        ) : null}
        {url ? (
          <button type="button" className={PILL} onClick={share}>
            <Icon name="link" />
            {shareSheet ? 'Share' : 'Copy link'}
          </button>
        ) : null}
      </div>
      <p role="status" className="mt-2 mb-0 text-caption text-text-muted empty:mt-0">
        {speech.message || shareState.status}
      </p>
      {shareState.url ? (
        <input
          type="text"
          readOnly
          value={shareState.url}
          aria-label="Link to this story"
          onFocus={(event) => event.currentTarget.select()}
          className="mt-1 w-full rounded-lg border border-border bg-surface-card px-3 py-2 text-meta text-text-primary"
        />
      ) : null}
    </div>
  )
}

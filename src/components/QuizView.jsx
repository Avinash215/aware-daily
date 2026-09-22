import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildQuiz, QUIZ_MIN_READ } from '../lib/quiz.js'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'

const TYPE_LABEL = {
  why: 'Why it matters',
  which: 'Which story',
  number: 'The figure',
  country: 'Where',
}

function Mark({ correct }) {
  return correct ? (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6 10.4l2.6 2.6L14 7.5" fill="none" stroke="var(--surface-card)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

/**
 * The quiz dialog. Questions come only from stories the reader marked read
 * (or, when they explicitly choose practice, from each section's lead), and
 * every answer reveals the published text it is based on.
 */
export default function QuizView({ readStories = [], practiceStories = [], editionStories = [], editionKey = '', best = null, onFinish, onClose, onOpenStory }) {
  const dialogRef = useRef(null)
  const [mode, setMode] = useState(() => (readStories.length >= QUIZ_MIN_READ ? 'read' : 'intro'))
  const [attempt, setAttempt] = useState(0)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)
  const nextRef = useRef(null)
  const headingRef = useRef(null)

  const pool = mode === 'practice' ? practiceStories : readStories
  const questions = useMemo(
    () => (mode === 'intro' ? [] : buildQuiz(pool, editionStories, { seed: `${editionKey}:${mode}:${attempt}`, count: 5 })),
    [attempt, editionKey, editionStories, mode, pool],
  )
  const question = questions[index]
  const chosen = question ? answers[question.id] : undefined
  const score = questions.reduce((sum, entry) => sum + (answers[entry.id] === entry.answerId ? 1 : 0), 0)

  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      const node = dialogRef.current
      if (!node) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
        return
      }
      if (event.key !== 'Tab') return
      const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter((element) => element.getClientRects().length > 0)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  useEffect(() => {
    if (chosen !== undefined) nextRef.current?.focus({ preventScroll: true })
  }, [chosen])

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [index, finished, mode])

  const start = useCallback((nextMode) => {
    setMode(nextMode)
    setAttempt((value) => value + 1)
    setIndex(0)
    setAnswers({})
    setFinished(false)
  }, [])

  const choose = (optionId) => {
    if (!question || chosen !== undefined) return
    setAnswers((current) => ({ ...current, [question.id]: optionId }))
  }

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      return
    }
    setFinished(true)
    if (mode === 'read') onFinish?.(score, questions.length)
  }

  const openStory = (storyId, element) => {
    onClose?.()
    requestAnimationFrame(() => onOpenStory?.(storyId, element))
  }

  const progressLabel = question && !finished ? `Question ${index + 1} of ${questions.length}` : ''

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-heading"
      tabIndex={-1}
      className="fixed inset-0 z-[55] overflow-y-auto overscroll-contain bg-surface"
    >
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[680px] items-center justify-between gap-3 px-4 py-1 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="-ml-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-[0.875rem] font-semibold text-text-primary"
          >
            <span aria-hidden="true">←</span>
            Back to the briefing
          </button>
          {progressLabel ? <p className="m-0 text-meta font-medium tabular-nums text-text-muted">{progressLabel}</p> : null}
        </div>
        {questions.length && !finished ? (
          <div className="mx-auto flex w-full max-w-[680px] gap-1 px-4 pb-2 sm:px-6" aria-hidden="true">
            {questions.map((entry, position) => {
              const answered = answers[entry.id]
              const tone = answered === undefined
                ? position === index ? 'var(--text-primary)' : 'var(--border)'
                : answered === entry.answerId ? 'var(--text-primary)' : 'var(--text-muted)'
              return <span key={entry.id} className="h-1 flex-1 rounded-full" style={{ backgroundColor: tone, opacity: answered === undefined && position !== index ? 0.6 : 1 }} />
            })}
          </div>
        ) : null}
      </header>

      <div className="mx-auto w-full max-w-[680px] px-4 pt-6 pb-16 sm:px-6">
        {mode === 'intro' ? (
          <section aria-labelledby="quiz-heading">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Quiz</p>
            <h2 id="quiz-heading" ref={headingRef} tabIndex={-1} className="mt-1 mb-0 font-display text-[26px] leading-8 font-semibold text-text-primary focus:outline-none">
              Test yourself on what you read
            </h2>
            <p className="mt-3 mb-0 text-[15px] leading-6 text-text-secondary">
              Your quiz is built from stories you mark read. You have marked {readStories.length}{' '}
              {readStories.length === 1 ? 'story' : 'stories'} read in this edition; mark at least {QUIZ_MIN_READ} to
              unlock it.
            </p>
            <p className="mt-2 mb-0 text-meta text-text-muted">
              Every question comes from published story text, and the answer shows where it came from.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={practiceStories.length < 2}
                onClick={() => start('practice')}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-text-primary px-5 text-meta font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                Practice on the lead stories
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface-card px-5 text-meta font-semibold text-text-primary"
              >
                Keep reading
              </button>
            </div>
          </section>
        ) : !questions.length ? (
          <section aria-labelledby="quiz-heading">
            <h2 id="quiz-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-[24px] leading-8 font-semibold text-text-primary focus:outline-none">
              Not enough published detail for a quiz
            </h2>
            <p className="mt-2 mb-0 text-[15px] leading-6 text-text-secondary">
              These stories do not carry enough text to ask fair questions. Read a few more and try again.
            </p>
          </section>
        ) : finished ? (
          <section aria-labelledby="quiz-heading" className="text-center">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {mode === 'practice' ? 'Practice quiz' : 'Your quiz'}
            </p>
            <h2 id="quiz-heading" ref={headingRef} tabIndex={-1} className="mt-2 mb-0 font-display text-[44px] leading-[1.05] font-semibold tabular-nums text-text-primary focus:outline-none">
              {score} of {questions.length}
            </h2>
            <p className="mt-2 mb-0 text-[15px] leading-6 text-text-secondary">
              {score === questions.length ? 'Every one. You read this edition closely.' : score >= questions.length - 1 ? 'Nearly all of it stuck.' : 'Worth another look at the stories you missed.'}
            </p>
            {mode === 'read' && best ? (
              <p className="mt-1 mb-0 text-meta text-text-muted">
                Best this edition: {Math.max(best.best, score)} of {Math.max(best.total, questions.length)}
              </p>
            ) : null}
            <ul className="mx-auto mt-6 mb-0 max-w-[34rem] list-none p-0 text-left">
              {questions.map((entry) => {
                const correct = answers[entry.id] === entry.answerId
                return (
                  <li key={entry.id} className="flex items-start gap-2.5 border-b border-border-subtle py-2.5 last:border-b-0">
                    <span className={correct ? 'text-text-primary' : 'text-text-muted'}>
                      <Mark correct={correct} />
                      <span className="sr-only">{correct ? 'Correct' : 'Missed'}: </span>
                    </span>
                    <button
                      type="button"
                      onClick={(event) => openStory(entry.storyId, event.currentTarget)}
                      className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-left font-display text-[15px] leading-5 font-semibold text-text-primary hover:underline"
                    >
                      {entry.headline}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => start(mode)}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-text-primary px-5 text-meta font-semibold text-surface"
              >
                New questions
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface-card px-5 text-meta font-semibold text-text-primary"
              >
                Done
              </button>
            </div>
          </section>
        ) : (
          <section aria-labelledby="quiz-heading">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {mode === 'practice' ? 'Practice · ' : ''}{TYPE_LABEL[question.type] || 'Question'}
            </p>
            <h2 id="quiz-heading" ref={headingRef} tabIndex={-1} className="mt-1 mb-0 font-display text-[24px] leading-8 font-semibold text-text-primary focus:outline-none">
              {question.prompt}
            </h2>
            <blockquote className="mt-3 mb-0 border-l-2 border-border py-0.5 pl-3.5 font-display text-[17px] leading-6 text-text-primary">
              {question.context}
            </blockquote>

            <fieldset className="mt-5 border-0 p-0">
              <legend className="sr-only">Choose an answer</legend>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {question.options.map((option) => {
                  const picked = chosen === option.id
                  const isAnswer = option.id === question.answerId
                  const revealed = chosen !== undefined
                  const state = !revealed ? 'idle' : isAnswer ? 'answer' : picked ? 'wrong' : 'other'
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => choose(option.id)}
                        aria-disabled={revealed}
                        aria-pressed={picked}
                        className={`flex min-h-12 w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-[1.4] transition-colors duration-150 motion-reduce:transition-none ${
                          state === 'answer'
                            ? 'border-text-primary bg-surface-card font-semibold text-text-primary'
                            : state === 'wrong'
                              ? 'border-border bg-surface-muted text-text-secondary line-through decoration-1'
                              : state === 'other'
                                ? 'border-border-subtle bg-transparent text-text-muted'
                                : 'border-border bg-surface-card text-text-primary hover:border-text-secondary'
                        } ${revealed ? 'cursor-default' : ''}`}
                      >
                        <span className="min-w-0 flex-1">{option.text}</span>
                        {state === 'answer' ? <span className="text-text-primary"><Mark correct /><span className="sr-only"> Correct answer</span></span> : null}
                        {state === 'wrong' ? <span className="text-text-muted"><Mark correct={false} /><span className="sr-only"> Your answer</span></span> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </fieldset>

            <div role="status" aria-live="polite">
              {chosen !== undefined ? (
                <div className="mt-5 rounded-xl border border-border-subtle bg-surface-card p-4">
                  <p className="m-0 text-meta font-semibold text-text-primary">
                    {chosen === question.answerId ? 'Correct.' : 'Not quite.'}
                  </p>
                  {question.evidence?.text ? (
                    <>
                      <p className="mt-2 mb-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                        {question.evidence.label}
                      </p>
                      <p className="mt-1 mb-0 text-[14px] leading-[1.5] text-text-secondary">{question.evidence.text}</p>
                    </>
                  ) : null}
                  <p className="mt-2 mb-0 text-meta text-text-muted">From: {question.headline}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                ref={nextRef}
                type="button"
                disabled={chosen === undefined}
                onClick={next}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-text-primary px-5 text-meta font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                {index + 1 < questions.length ? 'Next question' : 'See my score'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

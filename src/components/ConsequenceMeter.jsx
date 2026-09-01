/**
 * The six 0–10 consequence estimates that sit behind a story's ranking.
 *
 * Presented as a definition list so the numbers are readable text first and a
 * bar second: the bar is decorative (`aria-hidden`) and every value is also
 * announced as "6.4 out of 10". Missing or non-numeric dimensions are dropped
 * rather than drawn as an empty track, so the chart can never imply data that
 * the edition did not publish.
 */

const DIMENSIONS = [
  { key: 'wallet', label: 'Wallet' },
  { key: 'job', label: 'Job' },
  { key: 'safety', label: 'Safety' },
  { key: 'rights', label: 'Rights' },
  { key: 'travel', label: 'Travel' },
  { key: 'civic', label: 'Civic life' },
]

const MAX = 10

function toScore(raw) {
  const value = typeof raw === 'string' ? Number(raw) : raw
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(MAX, Math.max(0, value))
}

export default function ConsequenceMeter({ consequence }) {
  const source = consequence && typeof consequence === 'object' ? consequence : {}

  const rows = DIMENSIONS.map((dimension) => ({
    ...dimension,
    score: toScore(source[dimension.key]),
  })).filter((row) => row.score !== null)

  if (rows.length === 0) {
    return (
      <p className="m-0 text-[0.8125rem] leading-[1.125rem] text-text-tertiary">
        No consequence estimate was published for this story.
      </p>
    )
  }

  return (
    <div>
      <p className="m-0 text-[0.8125rem] leading-[1.125rem] tracking-[0.01em] text-text-tertiary">
        Estimated consequence for a reader, scored 0 to {MAX}.
      </p>

      <dl className="m-0 mt-3">
        {rows.map((row) => {
          const display = row.score.toFixed(1)

          return (
            <div
              key={row.key}
              className="flex items-center gap-3 border-t border-border py-2 first:border-t-0 first:pt-0"
            >
              <dt className="w-[5.5rem] shrink-0 text-[0.8125rem] leading-[1.125rem] font-semibold text-text-secondary">
                {row.label}
              </dt>
              <dd className="m-0 flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-2 min-w-0 flex-1 overflow-hidden rounded-full border border-border bg-surface-sunken"
                >
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Number(((row.score / MAX) * 100).toFixed(2))}%`,
                      backgroundColor: 'var(--story-accent, var(--text-primary))',
                    }}
                  />
                </span>
                <span className="w-[3.25rem] shrink-0 text-right text-[0.8125rem] leading-[1.125rem] tabular-nums text-text-secondary">
                  {display}
                  <span className="sr-only"> out of {MAX}</span>
                  <span aria-hidden="true" className="text-text-tertiary">
                    /{MAX}
                  </span>
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

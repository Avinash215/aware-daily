import { useMemo } from 'react'

/**
 * The You tab: reading progress (moved off the top of the feed), the theme
 * control, and this edition's provenance.
 *
 * Progress reads the existing `aware-daily:read` store through props — this
 * component never touches storage itself.
 */

const ACCENT_KEYS = new Set([
  'geopolitics',
  'business',
  'technology',
  'science',
  'climate',
  'health',
  'sports',
  'culture',
])

const accentVar = (key) => (ACCENT_KEYS.has(key) ? `var(--accent-${key})` : 'var(--text-secondary)')

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function percent(read, total) {
  if (!total) return 0
  return Math.min(100, Math.max(0, Math.round((read / total) * 100)))
}

export default function YouPage({
  categories = [],
  totalStories = 0,
  readStoryIds = [],
  savedCount = 0,
  onMarkAllRead,
  onResetRead,
  theme = 'system',
  onThemeChange,
  dateLabel = '',
  updatedLabel = '',
  categoryCount = 0,
}) {
  const readIds = Array.isArray(readStoryIds) ? readStoryIds : []

  const { readCount, sections, sectionsComplete, storyTotal } = useMemo(() => {
    const ids = Array.isArray(readStoryIds) ? readStoryIds : []
    const safeCategories = Array.isArray(categories) ? categories : []
    const readSet = new Set(ids)
    const rows = safeCategories.map((category) => {
      const list = Array.isArray(category?.stories) ? category.stories : []
      const done = list.reduce((sum, story) => (readSet.has(story?.id) ? sum + 1 : sum), 0)
      return {
        key: category?.key || '',
        label: category?.label || category?.key || 'Section',
        total: list.length,
        read: done,
      }
    })

    return {
      readCount: rows.reduce((sum, row) => sum + row.read, 0),
      sections: rows,
      sectionsComplete: rows.filter((row) => row.total > 0 && row.read === row.total).length,
      storyTotal: rows.reduce((sum, row) => sum + row.total, 0),
    }
  }, [readStoryIds, categories])

  const total =
    Number.isFinite(totalStories) && totalStories > 0 ? totalStories : storyTotal || readIds.length
  const overall = percent(readCount, total)
  const allRead = total > 0 && readCount >= total

  return (
    <div className="pt-4">
      <h2 className="font-display text-lead font-semibold text-text-primary">You</h2>

      {/* Reading progress ------------------------------------------------ */}
      <section aria-labelledby="progress-heading" className="mt-4">
        <h3
          id="progress-heading"
          className="text-caption font-semibold tracking-[0.16em] text-text-muted uppercase"
        >
          Reading progress
        </h3>

        <div className="mt-2 rounded-xl border border-border-subtle bg-surface-card p-4 shadow-[var(--shadow-card)]">
          <p aria-live="polite" className="text-row font-semibold text-text-primary lg:text-row-lg">
            {readCount} of {total} read
          </p>
          <p className="mt-0.5 text-meta text-text-muted">
            {sectionsComplete} of {sections.length} {sections.length === 1 ? 'section' : 'sections'}{' '}
            complete · kept on this device
          </p>

          <div
            role="progressbar"
            aria-label="Stories read in this edition"
            aria-valuemin={0}
            aria-valuemax={Math.max(total, 1)}
            aria-valuenow={Math.min(readCount, total)}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted"
          >
            <span
              className="block h-full rounded-full bg-text-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: `${overall}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={allRead ? onResetRead : onMarkAllRead}
              className="min-h-11 cursor-pointer rounded-full border border-border bg-surface px-4 py-2 text-meta font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none"
            >
              {allRead ? 'Reset today' : 'Mark all read'}
            </button>
            {!allRead && readCount > 0 ? (
              <button
                type="button"
                onClick={onResetRead}
                className="min-h-11 cursor-pointer rounded-full border border-border bg-surface px-4 py-2 text-meta font-semibold text-text-secondary transition-colors duration-150 hover:bg-surface-muted hover:text-text-primary motion-reduce:transition-none"
              >
                Reset progress
              </button>
            ) : null}
          </div>
        </div>

        {sections.length ? (
          <ul className="mt-3 mb-0 list-none p-0">
            {sections.map((section) => {
              const value = percent(section.read, section.total)
              return (
                <li
                  key={section.key || section.label}
                  className="flex items-center gap-3 border-b border-border-subtle py-2.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-meta font-medium text-text-primary">
                    {section.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-muted sm:w-28"
                  >
                    <span
                      className="block h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none"
                      style={{ width: `${value}%`, backgroundColor: accentVar(section.key) }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right text-caption text-text-muted tabular-nums">
                    {section.read}/{section.total}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>

      {/* Appearance ------------------------------------------------------- */}
      <section aria-labelledby="appearance-heading" className="mt-8">
        <h3
          id="appearance-heading"
          className="text-caption font-semibold tracking-[0.16em] text-text-muted uppercase"
        >
          Appearance
        </h3>

        <fieldset className="mt-2 rounded-xl border border-border-subtle bg-surface-card p-4">
          <legend className="sr-only">Theme</legend>
          <div className="flex gap-1 rounded-full bg-surface-muted p-1">
            {THEME_OPTIONS.map((option) => {
              const checked = theme === option.value
              return (
                <label
                  key={option.value}
                  className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full px-3 text-meta font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-text-primary motion-reduce:transition-none ${
                    checked
                      ? 'bg-surface-card text-text-primary shadow-[var(--shadow-card)]'
                      : 'text-text-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={checked}
                    onChange={() => onThemeChange?.(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
          <p className="mt-3 mb-0 text-meta text-text-muted">
            System follows your device setting. Your choice is remembered on this device.
          </p>
        </fieldset>
      </section>

      {/* Edition ---------------------------------------------------------- */}
      <section aria-labelledby="edition-heading" className="mt-8">
        <h3
          id="edition-heading"
          className="text-caption font-semibold tracking-[0.16em] text-text-muted uppercase"
        >
          This edition
        </h3>

        <div className="mt-2 rounded-xl border border-border-subtle bg-surface-card p-4">
          <p className="text-meta text-text-secondary">
            {[dateLabel, `${total} stories`, `${categoryCount} sections`, updatedLabel]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="mt-1 text-meta text-text-muted">
            {savedCount} saved · progress and saved stories never leave this browser.
          </p>
          <p className="mt-1 text-meta text-text-muted">
            Automated daily briefing that summarizes reporting from named news organizations and
            links to original coverage; it does no original reporting.
          </p>
        </div>
      </section>
    </div>
  )
}

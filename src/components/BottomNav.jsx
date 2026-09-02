/**
 * Primary app chrome.
 *
 * `BottomNav` is the fixed mobile tab bar; `TopNav` is the same three
 * destinations rendered inline in the masthead from `lg` up. Both are driven
 * by the single `TABS` table below so the two can never drift.
 *
 * Icons are inline SVG on purpose: no icon dependency, no emoji.
 */

const TABS = [
  {
    id: 'today',
    label: 'Today',
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21v-9h6v9" />
      </svg>
    ),
  },
  {
    id: 'saved',
    label: 'Saved',
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 1.6 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'you',
    label: 'You',
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

function labelFor(tab, savedCount) {
  if (tab.id !== 'saved') return tab.label
  if (!savedCount) return 'Saved, nothing saved yet'
  return `Saved, ${savedCount} ${savedCount === 1 ? 'story' : 'stories'}`
}

export default function BottomNav({ activeTab = 'today', onTabChange, savedCount = 0 }) {
  const count = Number.isFinite(savedCount) ? savedCount : 0

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-card/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="m-0 flex list-none items-stretch justify-around gap-1 px-2 py-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={labelFor(tab, count)}
                className={`flex min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors duration-150 motion-reduce:transition-none ${
                  isActive ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                <span className="relative inline-flex">
                  {tab.icon(isActive)}
                  {tab.id === 'saved' && count > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-1.5 min-w-4 rounded-full bg-text-primary px-1 text-center text-[10px] leading-4 font-semibold text-surface-card"
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : null}
                </span>
                <span className={`text-caption ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function TopNav({ activeTab = 'today', onTabChange, savedCount = 0 }) {
  const count = Number.isFinite(savedCount) ? savedCount : 0

  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="m-0 flex list-none items-center gap-1 p-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={labelFor(tab, count)}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-meta font-semibold transition-colors duration-150 motion-reduce:transition-none ${
                  isActive
                    ? 'bg-surface-muted text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{tab.icon(isActive)}</span>
                {tab.label}
                {tab.id === 'saved' && count > 0 ? (
                  <span aria-hidden="true" className="text-caption font-medium text-text-muted">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

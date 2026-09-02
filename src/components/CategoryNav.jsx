import { useMemo, useRef } from 'react'

function buildItems(categories) {
  const allCount = categories.reduce((sum, category) => sum + (category?.stories?.length ?? category?.count ?? 0), 0)
  return [
    { key: 'all', label: 'All', count: allCount, accent: '--text-primary', disabled: allCount === 0 },
    ...categories.map((category) => {
      const count = category?.stories?.length ?? category?.count ?? 0
      return {
        key: category.key,
        label: category.label,
        count,
        accent: category.accent || '--text-primary',
        disabled: count === 0,
      }
    }),
  ]
}

export default function CategoryNav({ categories = [], activeCategory = 'all', onSelect }) {
  const tabRefs = useRef([])
  const items = useMemo(() => buildItems(categories), [categories])

  const moveFocus = (currentIndex, direction) => {
    if (!items.length) return
    let next = currentIndex
    for (let step = 0; step < items.length; step += 1) {
      next = (next + direction + items.length) % items.length
      if (!items[next].disabled) {
        tabRefs.current[next]?.focus()
        return
      }
    }
  }

  const onKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveFocus(index, 1)
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveFocus(index, -1)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      const firstEnabled = items.findIndex((item) => !item.disabled)
      if (firstEnabled >= 0) tabRefs.current[firstEnabled]?.focus()
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      const lastEnabled = [...items].reverse().findIndex((item) => !item.disabled)
      if (lastEnabled >= 0) tabRefs.current[items.length - 1 - lastEnabled]?.focus()
    }
  }

  return (
    <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
      <div role="tablist" aria-label="Briefing categories" className="flex min-w-max gap-2.5">
        {items.map((item, index) => {
          const isActive = item.key === activeCategory
          const chipStyle = isActive
            ? {
                color: `var(${item.accent})`,
                borderColor: `var(${item.accent})`,
                backgroundColor: `color-mix(in oklab, var(${item.accent}) 14%, var(--surface-raised))`,
              }
            : {
                color: 'var(--text-secondary)',
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-raised)',
              }

          return (
            <button
              key={item.key}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              id={`tab-${item.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="feed-panel"
              disabled={item.disabled}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(event) => onKeyDown(event, index)}
              onClick={() => onSelect?.(item.key)}
              style={chipStyle}
              className={`min-h-11 shrink-0 rounded-full border px-3.5 py-2 text-[13px] leading-4 font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-offset-1 ${
                item.disabled
                  ? 'cursor-not-allowed opacity-55'
                  : 'cursor-pointer hover:text-text-primary hover:[background-color:var(--surface)]'
              }`}
            >
              {item.label} <span style={{ color: 'var(--text-tertiary)' }}>({item.count})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
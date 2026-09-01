import { useMemo, useRef } from 'react'

function buildItems(categories) {
  const allCount = categories.reduce((sum, category) => sum + (category.stories?.length || 0), 0)
  return [
    { key: 'all', label: 'All', count: allCount, accent: '--text-primary', disabled: allCount === 0 },
    ...categories.map((category) => ({
      key: category.key,
      label: category.label,
      count: category.stories?.length ?? category.count ?? 0,
      accent: category.accent || '--text-primary',
      disabled: !((category.stories?.length ?? category.count ?? 0) > 0),
    })),
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
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveFocus(index, -1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      const first = items.findIndex((item) => !item.disabled)
      if (first >= 0) tabRefs.current[first]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      const last = [...items].reverse().findIndex((item) => !item.disabled)
      if (last >= 0) tabRefs.current[items.length - 1 - last]?.focus()
    }
  }

  return (
    <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
      <div role="tablist" aria-label="Briefing categories" className="flex min-w-max gap-2">
        {items.map((item, index) => {
          const isActive = item.key === activeCategory
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
              style={
                isActive
                  ? {
                      color: `var(${item.accent})`,
                      borderColor: `var(${item.accent})`,
                    }
                  : undefined
              }
              className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-[15px] leading-5 font-semibold transition-colors motion-reduce:transition-none ${
                isActive
                  ? 'bg-surface-raised'
                  : 'border-border bg-surface-raised text-text-secondary hover:text-text-primary'
              } ${item.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              {item.label} <span className="text-text-tertiary">({item.count})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

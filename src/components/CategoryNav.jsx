import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_CATEGORIES, categoryTabId } from '../lib/data.js'

const FADE = '2.5rem'

// The rail only fades an edge that actually has more tabs behind it, so a
// fully visible rail is never dimmed and the last tab is never masked.
function edgeMask({ start, end }) {
  if (start && end) return `linear-gradient(to right, transparent, black ${FADE}, black calc(100% - ${FADE}), transparent)`
  if (end) return `linear-gradient(to right, black calc(100% - ${FADE}), transparent)`
  if (start) return `linear-gradient(to right, transparent, black ${FADE})`
  return 'none'
}

function buildItems(categories) {
  const allCount = categories.reduce((sum, category) => sum + (category?.stories?.length ?? 0), 0)
  return [
    { key: ALL_CATEGORIES, label: 'All', count: allCount, accent: '--text-primary', disabled: false },
    ...categories.map((category) => {
      const count = category?.stories?.length ?? 0
      return {
        key: category.key,
        label: category.label,
        count,
        accent: category.accent || '--text-primary',
        disabled: false,
      }
    }),
  ]
}

export default function CategoryNav({ categories = [], activeCategory = ALL_CATEGORIES, onSelect }) {
  const tabRefs = useRef([])
  const scrollerRef = useRef(null)
  const [overflow, setOverflow] = useState({ start: false, end: false })
  const items = useMemo(() => buildItems(categories), [categories])

  const measure = useCallback(() => {
    const node = scrollerRef.current
    if (!node) return
    const start = node.scrollLeft > 1
    const end = node.scrollLeft + node.clientWidth < node.scrollWidth - 1
    setOverflow((previous) => (previous.start === start && previous.end === end ? previous : { start, end }))
  }, [])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return undefined
    measure()
    node.addEventListener('scroll', measure, { passive: true })
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(node)
    if (node.firstElementChild) observer?.observe(node.firstElementChild)
    return () => {
      node.removeEventListener('scroll', measure)
      observer?.disconnect()
    }
  }, [measure, items])

  useEffect(() => {
    const index = items.findIndex((item) => item.key === activeCategory)
    const tab = tabRefs.current[index]
    const node = scrollerRef.current
    if (!tab || !node) return
    const left = tab.offsetLeft
    const right = left + tab.offsetWidth
    if (left < node.scrollLeft) node.scrollLeft = left - 16
    else if (right > node.scrollLeft + node.clientWidth) node.scrollLeft = right - node.clientWidth + 16
  }, [activeCategory, items])

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

  const mask = edgeMask(overflow)

  return (
    <div
      ref={scrollerRef}
      className="scrollbar-none relative -mx-1 overflow-x-auto px-1"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div role="tablist" aria-label="Briefing categories" className="flex min-w-max gap-1 sm:gap-2">
        {items.map((item, index) => {
          const isActive = item.key === activeCategory

          return (
            <button
              key={categoryTabId(item.key)}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              id={categoryTabId(item.key)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="feed-panel"
              aria-label={`${item.label} (${item.count})`}
              disabled={item.disabled}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(event) => onKeyDown(event, index)}
              onClick={() => onSelect?.(item.key)}
              className={`relative inline-flex min-h-12 shrink-0 items-center gap-1.5 border-0 bg-transparent px-2.5 text-[13px] leading-4 transition-colors motion-reduce:transition-none focus-visible:outline-offset-[-3px] ${
                isActive ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
              } ${item.disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer hover:text-text-primary'}`}
            >
              {item.label}
              <span className="text-[11px] font-medium tabular-nums text-text-muted">{item.count}</span>
              <span
                aria-hidden="true"
                className={`absolute inset-x-2.5 bottom-0 h-[3px] rounded-t-sm ${isActive ? '' : 'opacity-0'}`}
                style={{ backgroundColor: `var(${item.accent})` }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
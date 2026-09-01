# Aware Daily

A static, no-backend daily news briefing. One JSON file in, one finite read out.

Deployed to GitHub Pages at **https://avinash215.github.io/aware-daily/**, which is why
`vite.config.js` sets `base: '/aware-daily/'` and `public/.nojekyll` exists.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # emits dist/ with /aware-daily/ asset paths
npm run preview  # serve the built output
npm run lint
```

Node 24 / npm 11. Dependencies are React 19 and React DOM only — no router, no
state library, no UI kit, no date library.

## Layout

```
index.html                    Google Fonts preconnect + Source Serif 4 / Inter
src/main.jsx                  React root
src/index.css                 Design tokens ONLY — the single source of colour + type
src/App.jsx                   App shell: masthead, state, slot markers
src/components/ErrorBoundary.jsx
src/lib/data.js               Data layer — everything reads the briefing through this
src/lib/format.js             Pure formatting helpers
src/data/daily.json           The briefing payload
```

## Data

`src/data/daily.json` is imported statically, so it is bundled at build time —
there is no fetch and no runtime failure mode for missing data. Regenerating the
briefing means replacing that file and rebuilding.

`src/lib/data.js` is the contract every UI file builds against:

| Export | What it is |
| --- | --- |
| `daily` | the raw payload |
| `categories` | category objects + `stories` (rank ascending) + `accent` (CSS custom property *name*) |
| `stories` | flat list, payload order |
| `leadStory` | lowest-ranked `tier: 'lead'`, falling back to `stories[0]`, else `null` |
| `getStory(id)` | story or `null` |
| `getCategory(key)` | category or `null` |
| `storiesByCategory(key)` | array, empty when there are none |
| `meta` | `{ date, generatedAt, persona, publishedCount, categoryCount }` |

Every field is coerced to a safe shape on the way through. A missing, partial or
wrongly-typed payload degrades to empty arrays — it never throws and never
white-screens the app.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. All colour and type live in
`src/index.css` as CSS custom properties and are exposed as Tailwind utilities
through `@theme inline`, so `bg-surface` / `text-text-secondary` /
`text-accent-climate` re-resolve when the theme flips. **Do not hardcode a
colour anywhere else.**

Light is the default; dark comes from `prefers-color-scheme` and can be forced
either way with `data-theme="dark"` / `data-theme="light"` on `<html>`. Every
text-on-surface pair clears WCAG AA (lowest measured ratio: 5.08:1).

Category accents are referenced by custom property *name* — `data.js` gives you
`'--accent-geopolitics'`, and you use it as `var(--accent-geopolitics)`.

## Slots

`src/App.jsx` marks the three regions other work plugs into:

- `{/* SLOT: category-nav */}`
- `{/* SLOT: feed */}`
- `{/* SLOT: reader */}`

The shell owns `activeCategory` (`'all'` by default) and `openStoryId` (`null`).
The plain headline list currently in the feed slot is placeholder scaffolding.

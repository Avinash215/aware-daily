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

## Browser-local personal features

Nothing here is sent anywhere or changes what the pipeline publishes.

| Feature | Where | Storage key |
| --- | --- | --- |
| Quiz on stories marked read (practice on section leads) | `lib/quiz.js`, `QuizView.jsx` | `aware-daily:quiz` (best score per edition) |
| For you tab: follows, Near you, interest matches | `lib/personal.js`, `ForYou.jsx` | reads the keys below |
| Like, Follow, private note in the reader | `YourTake.jsx` | `aware-daily:likes`, `aware-daily:follows` |
| Interests, instructions, location, leaderboard | `PersonalSettings.jsx` on You | `aware-daily:prefs` |

Stores use `lib/localStore.js`: `{ version: 1, data }`, reread before every
write, synced across tabs, and never overwritten when unreadable. The quiz is
deterministic and only uses published fields (`so_what`, `headline`, `dek`,
`body`, `countries`); each answer shows the text it came from. Shared likes and
comments, and reader settings reaching the cloud curation job, need a server
or pipeline change and are not implemented.

## Browser-local saved stories

`src/lib/savedStories.js` owns the version 1 archive at
`aware-daily:saved-stories`: `{ version: 1, entries: [...] }`.
Readable entries contain an allowlisted story, original edition metadata,
original category metadata and the linked published recap, if present.
Images and arbitrary payload extras are not archived. Source URLs remain
ordinary user-initiated links. No archive recovery or content fetch is performed.
Embedded recaps do not increase the independent saved-recap count.

Snapshots require a nonblank string ID and string headline/body fields.
Empty or whitespace-only headline/body strings are preserved, matching the
normalized feed shape; existing reader fallbacks explain missing reporting.
Missing or non-string headline/body fields in raw snapshots are rejected.

Identity is the pair of edition date and story ID, with generation time used
when the edition date is absent. Adding the same identity never replaces its
stored content. Different editions can retain the same published ID separately.
The saved reader holds the selected snapshot even after it is unsaved.

Valid legacy `aware-daily:saved` IDs are migrated once. IDs that cannot resolve
to a valid story snapshot in the loaded edition remain explicitly unavailable, removable
entries. The legacy key is never modified; an existing versioned store takes
precedence, including an intentionally empty archive.

The serialized store is limited to 2,000,000 UTF-16 code units (about 4 MB).
Oversized writes are rejected without trimming records. Blocked storage,
corrupt data, unsupported versions and write failures preserve prior stored
bytes and report that changes are session-only. Corrupt entries are isolated
for display, but a damaged archive is never automatically rewritten.
Only explicit mutations and valid migration write to storage.

Each write rereads the latest archive, reapplies pending local operations, and
checks the original bytes again before writing. Storage events synchronize tabs
without discarding unpersisted local operations. LocalStorage has no atomic
compare-and-swap, so truly simultaneous writes can still race between the final
check and the write. Browser-data deletion removes the archive.

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

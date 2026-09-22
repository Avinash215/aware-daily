# Aware Daily — redesign contract (v2)

Authoritative for the redesign. Where this file conflicts with
`news-ux-research.md`, THIS FILE WINS on density, layout and chrome. The research
brief remains authoritative for accessibility, contrast and motion.

## Why this exists

v1 shipped a design that measured badly against the reference app:

| Metric (390px viewport) | Reference app | v1 | Target |
| --- | --- | --- | --- |
| Feed scroll height | 3,918px (30 stories) | **34,217px (56)** | < 9,000px |
| Height per story | ~130px | **704px** | 110-150px |
| Images | 26 | **0** | 1 hero + section leads |
| Bottom app chrome | yes | **none** | yes |
| Save / bookmark | yes | **none** | yes |

v1 reads as a design-system demo: one story fills an entire phone screen. A news
app must let a reader scan a section in a few thumb-flicks.

The v1 research brief was told "this app has no images" as a hard constraint.
That was wrong — the reference app extracts `og:image` and shows real photos on
20 of 30 stories. The constraint was an assumption, not a fact.

## Reference implementation

`C:\Users\avinashswami\scout\_aware_ref\` holds the reference app's real source,
extracted from its deployed branch. Read these before writing code:

- `src__pages__HomePage.jsx` — LeadStory (line 189), BriefRow (247), StoryRow (272)
- `src__components__BottomNav.jsx`, `src__components__SaveButton.jsx`
- `src__hooks__useSavedStories.js`, `src__index.css`, `src__data__editionConfig.js`

Live reference: https://aware-app-nine.vercel.app

Copy its density and hierarchy. Do NOT copy its data model (living stories with
timelines) — Aware Daily is category-first with `so_what` / `what_now`.

## Design tokens — the shared contract

`app-shell` implements these in `src/index.css`. Every other unit consumes them
BY NAME and must not hardcode a colour or invent a token.

```
--surface            page background
--surface-card       raised card background
--surface-muted      chip / subtle fill
--border             standard divider
--border-subtle      hairline divider between list rows
--text-primary       headlines and body
--text-secondary     deks
--text-muted         meta, timestamps, chips
--accent-geopolitics --accent-business  --accent-technology --accent-science
--accent-climate     --accent-health    --accent-sports     --accent-culture
--accent-{key}-light tinted chip background for the same eight
--shadow-card        the single card elevation
```

Fonts, loaded in `index.html` with preconnect + `display=swap`:
- Headlines: `'Newsreader', Georgia, serif`
- UI and body: `'Inter', system-ui, sans-serif`

Both light and dark, via `prefers-color-scheme` AND an overriding
`[data-theme]` attribute. Body text must hold WCAG AA (4.5:1) on every surface.

## Type scale — measured from the reference, do not inflate

| Role | Mobile | Desktop | Weight | Family |
| --- | --- | --- | --- | --- |
| Lead headline | 20px / 1.15 | 26px | 600 | serif |
| Row headline | 15px / 1.3 | 16px | 600 | serif |
| Dek | 13px / 1.5, clamp 2 | 14px | 400 | sans |
| So what | 13px / 1.45 | 14px | 500 | sans |
| Meta, chip | 10-12px | 11-12px | 500-600 | sans |
| Section header | 11px, uppercase, 0.16em tracking | same | 600 | sans |

## Layout

**Story row:** a list row, NOT a boxed card:
`py-3.5` with a `border-b` hairline. Region kicker in the section accent, serif
headline, 2-line dek, `so_what` clamped to one line on mobile (two from `lg`),
then a meta row with the inline Mark read toggle. Save pinned top right. The
category is named once by the section header, so rows do not repeat it.
Target height 110-180px at 390px. From `lg` the row becomes an editorial list
entry: kicker, meta and Mark read in a 136px left rail, reporting in a
~640px middle column, Save on the right. Skim keeps the stacked row.

**Section header:** a 2px accent rule, the section name in the serif at
19px (22px desktop) and a muted count that turns into read progress
("3 of 13 read").

**Lead story:** one per section: rounded card, hero image `h-40` mobile /
`h-56` tablet, `object-cover`, with a tinted accent block as fallback when no
image exists. Never render a broken image icon. The edition's first lead is
the front story (full-width photo, 22px / 32px desktop headline). Other
section leads sit image-left, text-right from `lg`.

**End of edition:** after the last section in All, a short block that says
the briefing is finished, how many stories are marked read, and offers Mark
all read (or Reset progress) and Back to top.

**Chrome:** a fixed bottom tab bar (Today / Saved / You) on mobile, a top nav
on desktop. The footer carries the tab bar's height as padding so the last
line is never hidden.

## Rules

- Density over decoration. If a change adds height without adding information, cut it.
- No progress rail at the top of the feed. Move completion into the "You" tab.
- No duplicated meta. "56 stories across 8 sections" and "56 stories · 8 categories"
  must not both appear.
- Tap targets >= 44px. Respect `prefers-reduced-motion`.
- No new npm dependencies.

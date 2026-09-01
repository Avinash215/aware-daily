# Aware Daily — News UX Research and Build Brief

**Research checked:** August 31, 2026  
**Platform:** React, Tailwind CSS v4, one static JSON edition  
**Product promise:** About 27 stories, eight categories, once daily, and explicitly finishable.

Use **MUST** as an acceptance criterion and **SHOULD** as a strong default.

## 1. Executive summary

- The briefing MUST end after the final story. Do not load another edition, recommendations, or “related” content beneath it.
- Home MUST expose every story’s complete body, “So what,” and conditional “What now”; never truncate reporting into clickbait teasers.
- Use one linear reading column. Desktop gains a sticky category rail, not a masonry or multi-column news grid.
- Category navigation MUST be in-page anchor navigation showing all eight categories, not tabs or filters that conceal stories.
- The lead story is distinguished through typography, spacing, and a category rule—never an image or empty media rectangle.
- Keep reporting, stakes, and prediction structurally distinct: body → **So what** → optional **What now**.
- Show source count and names on every home story; show all 2–9 direct source links, hostnames, geography, and edition date in the reader.
- Show accurate, optional progress saved only on the device. Never infer “read” from opening a headline or scrolling past it.
- Use Newsreader for headlines and Inter for body/UI; body copy is 17/27px on mobile, 18/29px on larger screens, capped at 66ch.
- Meet WCAG 2.2 AA, use 44×44px controls, support light/dark system preferences, and remove nonessential motion under `prefers-reduced-motion`.

## 2. What the best apps actually do

Product interfaces change; historic examples are identified explicitly.

| App | The move | Why it works | Should Aware Daily copy it? |
|---|---|---|---|
| [New York Times](https://play.google.com/store/apps/details?id=com.nytimes.android&hl=en_US) / [historic briefing study](https://www.niemanlab.org/2015/09/what-you-need-to-know-how-six-publishers-digest-the-news-for-their-readers/) | Editor-curated morning briefings used short mobile paragraphs, mixed hard and lighter news, and did not merely mirror the homepage. | Creates a recognizable daily ritual and confidence that editors made choices. | **Adapt:** keep curation and tonal range; reject the current app’s breadth, live firehose, and personalization. |
| [Axios](https://www.axios.com/newsletters/axios-am) / [Smart Brevity](https://www.axioshq.com/what-is-smart-brevity) | Strong labels such as “Why it matters,” “Catch up quick,” “Between the lines,” and “What’s next,” with front-loaded sentences and bullets. | Readers can identify facts, context, stakes, and next steps while scanning. | **Yes, adapt:** retain “So what” and “What now,” but avoid fragmenting every sentence into a labeled block. |
| [Reuters](https://reutersagency.com/about/standards-values/) | Fact-first reporting, explicit sourcing and verification standards, restrained language, timestamps, and attribution. | Lowers interpretation cost and provides visible evidence of editorial discipline. | **Yes:** use direct prose, geography, dates, named sources, and no sensational treatment. |
| [Apple News](https://www.apple.com/apple-news/) | A polished reading surface keeps publisher identity visible while aggregating many publications and formats. | Readers retain awareness of who produced information instead of encountering anonymous cards. | **Adapt:** copy source prominence and reading polish, not subscriptions, multimedia, or an updating feed. |
| [Bloomberg](https://play.google.com/store/apps/details?id=com.bloomberg.android.plus&hl=en_US) | Strong urgency hierarchy pairs headlines with market context, watchlists, data, and alerts. | Metadata is useful because it answers why a development matters now. | **Adapt:** use compact, meaningful metadata; do not add dashboards, alerts, or market-style density. |
| [Economist Espresso, historic](https://www.niemanlab.org/2015/09/what-you-need-to-know-how-six-publishers-digest-the-news-for-their-readers/) | A tightly curated, short morning bundle was complete without requiring outbound reading; source links did not interrupt the main path. | The product made “finished” a visible and credible state. | **Yes, adapt:** keep external sources at the end of each focused story rather than interrupting every sentence. Current Espresso behavior is **unverified**. |
| [Artifact post-mortem](https://techcrunch.com/2024/01/12/instagram-co-founders-news-aggregation-startup-artifact-to-shut-down/) | Began as personalized news, then added social posting, comments, general link discovery, AI summaries, and headline rewriting. | Personal relevance and anti-clickbait tools were useful, but the product’s job became unclear. | **No:** preserve a rigid daily-briefing scope. Copy only the discipline of rewriting clickbait headlines. |
| [Google News](https://play.google.com/store/apps/details?id=com.google.android.apps.magazines&hl=en_US) | “Full Coverage” groups multiple outlets and perspectives around one event. | Makes provenance and disagreement discoverable without pretending one summary is the only account. | **Adapt:** expose all named sources together; do not create an endless personalized feed. |
| [Flipboard](https://apps.apple.com/us/app/flipboard-the-social-magazine/id358801284) | Organizes heterogeneous sources into magazine-like topics and lets users collect stories. | Strong grouping helps people understand the breadth of a collection. | **Adapt:** use editorial section rhythm; reject flipping gestures, personalization, card mosaics, and endless discovery. |
| [BBC](https://play.google.com/store/apps/details?id=bbc.mobile.news.ww&hl=en_US) | Broad, recognizable categories plus font-size controls, dark mode, saving, and explicit alert preferences. | Familiar taxonomy and reader controls reduce relearning and improve accessibility. | **Adapt:** copy taxonomy and reading preferences; omit live streams, video, and breaking-news alerts. |
| [Tortoise, historic](https://www.niemanlab.org/2019/03/slow-down-read-up-why-slow-journalism-and-finishable-news-is-quickly-growing-a-following/) | Originally capped its slow feed at five pieces daily and explicitly promised something readers could finish. | Aligns the publisher’s incentives with the reader’s time. | **Adapt:** retain the calm ending and finite contract; do not add membership/community features. |
| [The Skimm](https://www.theskimm.com/daily-skimm) | Uses visible labels such as “What’s going on” and “Out of the spotlight,” with links to supporting reporting. | Labels make context scannable and sourcing inspectable. | **Adapt:** copy structure and linking, not a chummy voice that could trivialize serious reporting. |
| [1440](https://join1440.com/about-us) | Emphasizes broad generalist coverage and claims every word is fact-checked. | Breadth across disciplines makes a single daily habit useful. | **Adapt:** copy category breadth and editorial checking; never make an unsupported “unbiased” claim. |
| [Semafor](https://www.niemanlab.org/2022/10/the-media-startup-semafor-launches-with-a-more-honest-article-format-and-lots-of-global-ambition/) | Semaform separates facts, reporter analysis, counter-narratives, and global perspectives. | Readers can see what is reported versus interpreted instead of decoding a blended narrative. | **Yes:** “So what” and “What now” should be visibly separate from factual reporting. |

## 3. Evidence

1. **Direct news engagement is weakening.** Reuters Institute reported that only 22% across surveyed markets identified publisher websites or apps as their main online-news gateway in 2024, down 10 percentage points from 2018. Aware Daily therefore needs a distinct repeatable job, not generic aggregation.  
   Source: [Reuters Institute, Digital News Report 2024 executive summary](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2024/dnr-executive-summary).

2. **Avoidance and overload are material problems.** In 2024, 39% said they sometimes or often avoided news; reported overload had risen 11 percentage points since 2019. A finite edition directly addresses uncertainty about volume, though not necessarily the emotional causes of avoidance.  
   Source: [Reuters Institute, Digital News Report 2024](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2024/dnr-executive-summary).

3. **Finishability has demonstrated product appeal, not causal proof.** Historic Tortoise limited output to five daily articles, while Zetland averaged two; 35% of surveyed Zetland subscribers named its manageable article count as a primary or contributing reason for subscribing.  
   Source: [Nieman Lab, “Slow down, read up”](https://www.niemanlab.org/2019/03/slow-down-read-up-why-slow-journalism-and-finishable-news-is-quickly-growing-a-following/).

4. **Slow or finite news is not proven to cure avoidance.** A longitudinal field experiment involving a Danish slow-news service found that it attracted people already engaged with news and could increase news fatigue when added to an existing news diet.  
   Source: [Nieman Lab summary of Andersen’s field experiment](https://www.niemanlab.org/2020/09/whos-interested-in-slow-journalism-turns-out-mostly-the-same-people-who-are-into-regular-ol-fast-journalism/).  
   **Unverified:** no high-quality public experiment was found showing that a finite news feed itself increases article completion or reduces avoidance.

5. **Infinite scrolling is wrong for this product.** It weakens landmarks, refinding, footer access, accessibility, effort estimation, and the sense of completion. NN/g recommends it primarily for flat, serendipitous, time-killing streams—not goal-oriented tasks.  
   Source: [Nielsen Norman Group, “Infinite Scrolling Is Not for Every Website”](https://www.nngroup.com/articles/infinite-scrolling/) and [implementation limitations](https://www.nngroup.com/articles/infinite-scrolling-tips/).

6. **Readers predominantly scan.** NN/g’s second-edition findings draw on more than 500 participants and 750 hours of eye tracking. Clear headings, front-loaded information, meaningful labels, and selective emphasis support productive scanning.  
   Source: [Nielsen Norman Group, “How People Read Online”](https://www.nngroup.com/articles/how-people-read-online/).

7. **Do not design an F pattern; prevent it.** F-shaped scanning commonly appears when text is poorly formatted and causes readers to miss content. Layer-cake scanning through meaningful headings is more effective.  
   Source: [NN/g, F-shaped pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) and [text-scanning patterns](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/).  
   **Unverified:** no persuasive research was found supporting a universal “Z pattern” for dense mobile news. Treat it as a visual-design heuristic, not evidence.

8. **News-card mosaics weaken ranking and scanning.** NN/g found cards less scannable than predictable vertical lists, more space-consuming, and prone to obscuring hierarchy—especially for homogeneous items such as news stories.  
   Source: [Nielsen Norman Group, “Cards: UI-Component Definition”](https://www.nngroup.com/articles/cards-component/).

9. **Mobile can support comprehension when text is well presented.** An NN/g study covering 276 participants and 1,629 article-reading cases found no practical device difference for comprehension. Difficult passages, however, took about 30ms longer per word on mobile.  
   Source: [Nielsen Norman Group, “Mobile Reading Isn’t as Hard as Previously Thought”](https://www.nngroup.com/articles/mobile-content/).

10. **Keep body lines near 50–75 characters.** Baymard’s testing identifies 50–75 characters as the useful range; WCAG’s AAA visual-presentation guidance uses 80 characters as a maximum available presentation.  
    Sources: [Baymard, line-length readability](https://baymard.com/blog/line-length-readability) and [W3C Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html).

11. **Distrust is tied to uncertainty about truth and process.** In 2025, 58% remained concerned about distinguishing true from false online news, while respondents expected AI to make news less trustworthy by an 18-point net difference. Trusted news brands and official sources remained common verification destinations.  
    Source: [Reuters Institute, Digital News Report 2025](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary).

12. **Explaining journalistic process can raise trust.** Center for Media Engagement experiments found that a process explanation improved perceived reliability; in tests using USA Today and The Tennessean treatments, it improved 11 of 12 measured trust attributes.  
    Source: [Center for Media Engagement, “Building Trust”](https://mediaengagement.org/research/building-trust/).

13. **Readers want to know who and what is behind a story.** The Trust Project’s user-centered indicators cover outlet identity, journalist expertise, labels, methods, sourcing, policies, and corrections.  
    Source: [The Trust Project FAQ](https://thetrustproject.org/faq/).

14. **Structured story forms improve scanability and epistemic clarity.** Semaform explicitly separates straight facts, analysis, and counter-narratives; current Axios output visibly separates stakes and next steps with labels.  
    Sources: [Nieman Lab on Semaform](https://www.niemanlab.org/2022/10/the-media-startup-semafor-launches-with-a-more-honest-article-format-and-lots-of-global-ambition/) and [Axios AM](https://www.axios.com/newsletters/axios-am).

15. **Dark mode should be a preference, not the default assumption.** Research reviewed by NN/g generally finds positive-polarity text performs better for normal vision, while dark mode can help some users with visual impairments. Users expect apps to respect the system setting.  
    Sources: [NN/g dark-mode literature review](https://www.nngroup.com/articles/dark-mode/) and [dark-mode user research](https://www.nngroup.com/articles/dark-mode-users-issues/).

16. **WCAG thresholds are floors.** WCAG 2.2 AA requires 4.5:1 for normal text, 3:1 for large text and necessary non-text UI indicators, reflow at 320 CSS px, and a 24px AA target-size baseline. This brief deliberately adopts the stronger 44×44px enhanced target.  
    Sources: [contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [AA targets](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and [44px enhanced targets](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).

17. **Progress feedback can backfire when it feels slow.** In a 3,179-person online-questionnaire experiment, early discouraging progress produced 21.8% breakoff versus 12.7% without a bar and 11.3% with initially faster feedback. This is not a news-reading study, but it supports accurate expectations and forbids deceptive progress curves.  
    Source: [Conrad et al., “The impact of progress indicators on task completion”](https://pmc.ncbi.nlm.nih.gov/articles/PMC2910434/).

18. **Decorative imagery consumes attention and space without adding information.** Eye-tracking evidence shows users often ignore large generic or feel-good imagery but inspect task-relevant images. Aware Daily has no useful image data, so typography should carry hierarchy.  
    Source: [NN/g, “Photos as Web Content”](https://www.nngroup.com/articles/photos-as-web-content/).

19. **Tabs and horizontal strips conceal content.** Nondefault tabs receive less attention; overflowing tabs become less discoverable, while horizontal scrolling is often missed even with arrows.  
    Sources: [NN/g tabs guidance](https://www.nngroup.com/articles/tabs-used-right/) and [horizontal scrolling](https://www.nngroup.com/articles/horizontal-scrolling/).

20. **Feature sprawl can erase a news product’s job.** Artifact’s official shutdown reason was insufficient market opportunity; its rapid expansion from news into social posting and general link discovery was also identified as diluting its original proposition.  
    Source: [TechCrunch Artifact post-mortem](https://techcrunch.com/2024/01/12/instagram-co-founders-news-aggregation-startup-artifact-to-shut-down/).

## 4. Design system

### 4.1 Typefaces

- **Headlines:** [Newsreader](https://fonts.google.com/specimen/Newsreader), fallback `Georgia, "Times New Roman", serif`.
- **Body and UI:** [Inter](https://fonts.google.com/specimen/Inter), fallback `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Self-host only required WOFF2 subsets and weights where possible. Use font-display swap.
- Never justify paragraphs. Never line-clamp headlines, reporting, “So what,” or “What now.”

### 4.2 Type scale

| Token | Mobile size / line height | Desktop size / line height | Weight | Letter spacing | Typeface |
|---|---:|---:|---:|---:|---|
| Eyebrow | 12px / 16px | 12px / 16px | 700 | `0.08em` | Inter; uppercase |
| Headline—lead/reader | 38px / 42px | 48px / 50px | 700 | `-0.025em` | Newsreader |
| Headline—card/front | 24px / 29px | 26px / 31px | 700 | `-0.015em` | Newsreader |
| Headline—compact | 21px / 26px | 22px / 27px | 700 | `-0.01em` | Newsreader |
| Dek/edition intro | 19px / 28px | 20px / 29px | 400 | `-0.005em` | Inter |
| Body | 17px / 27px | 18px / 29px | 400 | `0` | Inter |
| So what / What now | 17px / 25px | 18px / 27px | 600 / 500 | `0` | Inter |
| UI label | 15px / 20px | 15px / 20px | 600 | `0` | Inter |
| Meta/caption | 13px / 18px | 13px / 18px | 500 | `0.01em` | Inter |

Rules:

- Lead headline: maximum `20ch`; card headline: maximum `30ch`; body: maximum `66ch`.
- Keep body paragraph spacing at 16px.
- Use bold selectively for labels, not whole paragraphs.
- Do not use body text below 17px or metadata below 13px.

### 4.3 Colour palettes

Ratios were measured with the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) against both approved surfaces. All text tokens and category accents pass 4.5:1 at normal-text sizes.

```css
:root,
[data-theme="light"] {
  --surface: #FAF9F6;
  --surface-raised: #FFFFFF;

  --text-primary: #171717;
  --text-secondary: #4B4B48;
  --text-tertiary: #66645F;

  --border: #D7D4CC;
  --border-strong: #74716A;
  --focus: #1E4F9A;

  --accent-geopolitics: #8A1C1C;
  --accent-business: #155E3B;
  --accent-technology: #1E4F9A;
  --accent-science: #5B3FA3;
  --accent-climate: #006C67;
  --accent-health: #A1255A;
  --accent-sports: #8A4B08;
  --accent-culture: #6D3D77;
}

[data-theme="dark"] {
  --surface: #121416;
  --surface-raised: #1C1F22;

  --text-primary: #F5F4F0;
  --text-secondary: #C7C5BE;
  --text-tertiary: #A6A39B;

  --border: #41454A;
  --border-strong: #777B80;
  --focus: #82B1FF;

  --accent-geopolitics: #FF8A80;
  --accent-business: #70D6A0;
  --accent-technology: #82B1FF;
  --accent-science: #C7A7FF;
  --accent-climate: #78D5C8;
  --accent-health: #FF8FB8;
  --accent-sports: #FFBD66;
  --accent-culture: #E0A6E6;
}
```

#### Light-mode measured text contrast

| Foreground | On `#FAF9F6` | On `#FFFFFF` |
|---|---:|---:|
| Primary `#171717` | 17.0:1 | 17.9:1 |
| Secondary `#4B4B48` | 8.31:1 | 8.75:1 |
| Tertiary `#66645F` | 5.61:1 | 5.91:1 |
| Geopolitics `#8A1C1C` | 8.81:1 | 9.27:1 |
| Business `#155E3B` | 7.39:1 | 7.78:1 |
| Technology `#1E4F9A` | 7.55:1 | 7.95:1 |
| Science `#5B3FA3` | 7.42:1 | 7.82:1 |
| Climate `#006C67` | 5.97:1 | 6.28:1 |
| Health `#A1255A` | 6.81:1 | 7.17:1 |
| Sports `#8A4B08` | 6.45:1 | 6.79:1 |
| Culture `#6D3D77` | 7.71:1 | 8.12:1 |

#### Dark-mode measured text contrast

| Foreground | On `#121416` | On `#1C1F22` |
|---|---:|---:|
| Primary `#F5F4F0` | 16.7:1 | 15.0:1 |
| Secondary `#C7C5BE` | 10.6:1 | 9.58:1 |
| Tertiary `#A6A39B` | 7.32:1 | 6.56:1 |
| Geopolitics `#FF8A80` | 8.08:1 | 7.25:1 |
| Business `#70D6A0` | 10.3:1 | 9.31:1 |
| Technology `#82B1FF` | 8.51:1 | 7.63:1 |
| Science `#C7A7FF` | 9.14:1 | 8.19:1 |
| Climate `#78D5C8` | 10.6:1 | 9.57:1 |
| Health `#FF8FB8` | 8.68:1 | 7.78:1 |
| Sports `#FFBD66` | 11.1:1 | 10.0:1 |
| Culture `#E0A6E6` | 9.46:1 | 8.48:1 |

Usage constraints:

- Category accents may be label text, a 3–4px rule, focus indicator, progress fill, or icon.
- Never place text on a category-colour fill. Active navigation uses accent text plus an underline/rule.
- `--border` is a decorative separator only: light contrast is 1.40–1.48:1; dark is 1.71–1.91:1.
- Necessary control boundaries use `--border-strong`: light 4.62–4.86:1; dark 3.88–4.33:1.
- Source links use the technology accent and remain underlined.
- Default to the system colour scheme. Offer **System / Light / Dark** and save the choice locally.

### 4.4 Spacing, width, radii, and elevation

| Token | Value | Primary use |
|---|---:|---|
| `space-1` | 4px | Icon/text optical correction |
| `space-2` | 8px | Closely related metadata |
| `space-3` | 12px | Headline-to-body, label-to-callout |
| `space-4` | 16px | Paragraphs, mobile gutters |
| `space-5` | 20px | Compact story padding |
| `space-6` | 24px | Standard story gap/padding |
| `space-8` | 32px | Masthead and reader block separation |
| `space-12` | 48px | Category separation |
| `space-16` | 64px | Major page regions |
| `space-20` | 80px | Final-edition breathing room |

- Mobile page gutter: 16px; tablet: 24px; desktop: 32px.
- Shell maximum: 1120px.
- Reading column: `66ch`; approximately 680–720px depending on font rendering.
- Desktop category rail: 208px with a 48px gap to the reading column.
- Standard story units: no radius and no shadow; separate with whitespace and a 1px rule.
- Buttons/controls: 8px radius.
- Source/provenance panels: 12px radius.
- Lead story: 16px radius.
- Pills are reserved for a compact progress status only; radius 999px.
- Cards MUST NOT use elevation. A menu/popover may use `0 8px 24px rgba(0,0,0,.12)` in light mode and `.40` in dark mode.

## 5. Screen-by-screen specification

### 5.1 Home / today’s briefing

#### Page order

1. Skip link.
2. Masthead.
3. Full edition date and edition summary.
4. Progress status.
5. Eight-category jump navigation.
6. Category sections and stories.
7. Explicit end-of-edition state.
8. Minimal footer with methodology/source-policy link if available.

#### Ordering algorithm

- Use the actual valid story count from JSON; do not hardcode 27.
- Find the first valid story ranked `lead`.
- Put the lead story’s category first so the lead appears first without duplication.
- Keep remaining categories in this canonical order: Geopolitics, Business & Markets, Technology, Science, Climate, Health, Sports, Culture.
- Within each category sort `lead → front → page_two → brief`; retain JSON order as the tie-breaker.
- If multiple leads exist, give lead treatment only to the first and report a data warning during development.
- Do not expose `lead`, `front`, `page_two`, or `brief` as reader-facing labels.

#### Masthead

- Text wordmark: **Aware Daily**, no logo image.
- Full date: `Monday, August 31, 2026`, using a machine-readable time element.
- Dek: `27 stories across 8 sections. One finishable briefing.`
- Theme control: 44×44px minimum with an accessible name.
- Mobile masthead is not sticky. It must not consume reading space after scrolling.

#### Progress

- Visible copy: **“7 of 27 stories read · 2 of 8 sections complete.”**
- Pair visible text with a semantic progress bar using the real story count as maximum.
- A section completes only when all its valid stories are marked read.
- Progress is saved locally under the edition date and story IDs. Display **“Saved on this device.”**
- A story becomes read only when the reader activates **Mark read**, **Next story and mark read**, or **Mark section read**.
- Opening a story or scrolling past a card MUST NOT mark it read.
- Every read action has an immediate Undo path.
- Progress is optional and never gates content.
- Do not show streaks, deadlines, fake starting progress, rewards, or shame language.

#### Category navigation

- Navigation links jump to sections; they do not filter or replace page content.
- Each link shows category name and count, for example `Technology · 2/4`.
- Under 360px: one column. From 360–767px: two columns. Tablet: four columns.
- At 1024px and above, move navigation into the 208px sticky left rail.
- Current section uses bold text, a 3px rule, and `aria-current="location"`—never colour alone.
- Each target is at least 44px high.
- Do not use horizontal scrolling, a dropdown as the only route, or ARIA tab semantics.

#### Lead story

- `surface-raised`, 1px strong border, 4px category-colour top rule.
- Padding: 24px mobile, 32px desktop.
- Lead headline token; maximum width 20ch.
- Show, in order: category, geography/flags, headline, complete body, So what, optional What now, source summary, topics, read control.
- No hero image, illustration, gradient, placeholder rectangle, or decorative initial.

#### Standard story anatomy

Every story unit contains:

1. **Metadata:** region, accessible country names/flags, and category when context requires it.
2. **Headline:** direct link to the focused reader; never clamped.
3. **Complete body:** all 2–4 sentences, not an excerpt.
4. **So what:** always visible.
5. **What now:** render only when a nonempty value exists; reserve no blank space.
6. **Source summary:** `Sources (4) · Reuters · AP · Financial Times +1`, linking to the reader’s source block.
7. **Topics:** maximum three on home, as plain text unless real filtering is implemented.
8. **Mark read:** visible 44px control with checked and unchecked text states.

Interaction constraints:

- Do not make the entire story unit clickable; it contains secondary links and controls.
- Use headline-card typography for `front`; headline-compact for `page_two` and `brief`.
- Front stories may use a 2px category rule. Other stories use whitespace and the subtle separator.
- Body typography and content completeness do not change by rank.
- Preserve a single DOM and visual order. No desktop masonry or two-column story grid.

#### Desktop behavior

- Keep one reading column.
- Category navigation occupies the left rail.
- Progress may remain in the rail with the category links.
- The rail’s sticky position must leave focused links fully visible.
- Unused horizontal space is intentional; do not fill it with trends, ads, recommendations, or decorative imagery.

#### End of edition

After the final Culture story, show a bordered block with 64px top margin:

- If complete: **“You’re caught up. Today’s 27-story briefing is complete.”**
- If incomplete: **“That’s today’s full briefing. 4 stories remain unmarked.”**
- Offer links to remaining sections and **Reset today’s progress**.
- Do not append yesterday, tomorrow, “more for you,” or another feed.

### 5.2 Story reader

#### Content order

1. Skip link and compact masthead.
2. **Back to today’s briefing**, restoring prior scroll position and focus.
3. `Story 7 of 27`.
4. Category, region, accessible country names/flags, and full edition date.
5. Headline.
6. Source count near the headline: `Based on 4 named sources`.
7. Complete reporting body.
8. So what.
9. Conditional What now.
10. Full source/provenance block.
11. All topics and geography.
12. Mark-read control.
13. Previous/next-story navigation.
14. End-of-edition state after the last story.

Do not invent a byline, reporting location, timestamp, or update label not present in JSON.

#### So what treatment

- Place 20px after the body.
- Same approved surface as surrounding content.
- 4px solid category-colour left rule.
- 16px left padding; 12px vertical padding.
- Eyebrow label **SO WHAT** in the category accent.
- Sentence uses the So-what type token and primary text.
- No quote marks, lightbulb icon, tinted box, or collapsed disclosure.

#### What now treatment

- Place 16px after So what only when data exists.
- 1px dashed strong top border with 16px top padding.
- Eyebrow label **WHAT NOW** plus a decorative arrow.
- Sentence uses the same size as So what at weight 500.
- Do not phrase it as certainty if the supplied content is conditional.
- Never render “No update,” a disabled block, or empty vertical space.

#### Sources and provenance

- Heading: **Sources (4)**.
- Supporting copy: **“Aware Daily summarizes the reporting listed below. Follow a link to inspect the original coverage.”**
- Render all 2–9 sources; never hide them behind “more.”
- Each source occupies a minimum 48px-high row.
- Show exact source name as the underlined link and the hostname beneath it.
- Use direct source URLs, not an Aware redirect.
- Open in the current tab by default so browser conventions remain under user control.
- Preserve source order from JSON. Do not assign trust scores, political labels, or “primary” status not present in data.
- If two links use the same publisher but point to distinct reports, retain both.
- Do not fetch remote favicons or logos.
- Label geography as **Region**, not a journalistic dateline, unless the JSON explicitly supplies a reporting location.

### 5.3 Loading, empty, stale, and error states

| State | Required presentation | Required behavior |
|---|---|---|
| Initial load under 200ms | Show the page surface only. | Avoid a skeleton flash. |
| Initial load over 200ms | Three text-shaped skeleton story units; no image rectangles. Visible status: `Loading today’s briefing…` | Mark main as busy; skeletons are hidden from assistive technology. |
| JSON fetch failure | `Today’s briefing couldn’t be loaded.` Include Retry and connection guidance. | Preserve masthead/date; use an alert role; 44px controls. |
| Malformed top-level JSON | `This edition has a data error and can’t be displayed safely.` | Do not render potentially misleading partial data. |
| One invalid story | Inline `One story is unavailable because of a publishing error.` | Exclude it from progress denominator; disclose the available count. |
| Missing/invalid sources | `Source information is incomplete for this story.` | Keep reporting visible but never silently omit the problem. |
| Empty edition | `No stories were published for August 31, 2026.` | Offer Retry; do not present this as successful completion. |
| Empty category | Keep category heading and `No [category] stories in this edition.` | Keep the category in navigation with count zero. |
| Edition-date mismatch | Banner: `Showing the August 30 edition—not today’s briefing.` | Never label stale content “Today.” Keep progress keys separate by date. |
| Offline after content loaded | Keep all loaded reporting available. | Do not remove content; source links may use normal browser failure handling. |

Skeleton animation is optional and must stop when content arrives. Do not use an indeterminate spinner without explanatory text.

## 6. Interaction and motion

| Interaction | Duration | Motion |
|---|---:|---|
| Button/link hover and press | 120ms | Colour, border, and underline only |
| Focus appearance | 0ms | Immediate 3px outline with 2px offset |
| Progress fill after explicit action | 180ms | Linear or ease-out width change |
| Read checkmark | 160ms | Opacity plus scale from 0.92 to 1 |
| Source disclosure, if used on home | 160ms | Opacity and height; reader source list stays open |
| Reader route entry | 140ms | Simple opacity fade |
| In-page category jump | Approximately 220ms | Native smooth scroll; no scroll-jacking |
| Completion block appearance | 200ms | Opacity only |
| Delayed skeleton pulse | 1200ms loop | Low-amplitude opacity; never a sweeping shimmer |

Do not animate:

- Cards entering on scroll.
- Headline characters or counts.
- Layout reordering.
- Sticky-header shrinking.
- Background gradients.
- Parallax.
- Carousels or automatic pagination.
- Confetti, streaks, or celebratory overlays.
- Continuous reading-position bars that move on every scroll frame.

Under `prefers-reduced-motion: reduce`:

- Make category jumps immediate.
- Disable route fades, check scaling, progress interpolation, and skeleton pulse.
- Preserve immediate state feedback without animation.

## 7. Accessibility checklist

- [ ] WCAG 2.2 AA automated and manual audits pass in both themes.
- [ ] Every page has header, navigation, main, and footer landmarks.
- [ ] Home has one H1; categories are H2; story headlines are H3.
- [ ] Reader has one H1 and sources as an H2.
- [ ] A visible-on-focus skip link reaches the story content.
- [ ] DOM order exactly matches visual and editorial order.
- [ ] No positive `tabindex`; all functions work by keyboard.
- [ ] Reader route changes focus to its H1; Back restores focus to the originating headline.
- [ ] Every custom control is at least 44×44 CSS px with at least 8px separation.
- [ ] Focus uses a 3px `--focus` outline with a 2px offset and is never hidden by sticky content.
- [ ] Text remains complete and usable at 200% text zoom.
- [ ] The layout reflows at 320 CSS px and 400% browser zoom without horizontal page scrolling.
- [ ] Overriding line height to 1.5, paragraph spacing to 2em, letter spacing to 0.12em, and word spacing to 0.16em causes no clipping or overlap.
- [ ] All normal text/surface pairs use the measured palette above and remain at least 4.5:1.
- [ ] Necessary controls and state indicators remain at least 3:1 against adjacent colours.
- [ ] Category, read, error, and active states use text/shape in addition to colour.
- [ ] Source and headline links are underlined; static accent text is not underlined.
- [ ] Raw flag emoji are decorative; every flag has visible or screen-reader country text.
- [ ] Dates use full visible dates and machine-readable values.
- [ ] Progress has a programmatic name, value, and maximum; user-triggered updates use a polite live region.
- [ ] Loading status is announced once; skeleton shapes are hidden from accessibility APIs.
- [ ] Errors use plain language, identify the problem, and provide a next action.
- [ ] No information appears only on hover.
- [ ] No swipe, drag, long-press, or precision gesture is required.
- [ ] Reduced-motion and forced-colours modes remain usable.
- [ ] Test with VoiceOver/Safari, NVDA/Firefox, and TalkBack/Chrome.
- [ ] Test keyboard-only completion, source navigation, theme switching, and browser Back restoration.

## 8. Anti-patterns to avoid

| Anti-pattern | Why it fails |
|---|---|
| Infinite scroll, Load More, or automatic next edition | Breaks the core finite promise, harms orientation, and removes completion. |
| Recommended stories beneath the end state | Turns a completed briefing back into an attention trap. |
| Clickbait teaser cards or body truncation | Forces clicks before delivering value and obscures whether the briefing is substantive. |
| Hero, stock, or decorative images | No image data exists; filler would displace reporting and undermine the intentional text-first design. |
| Empty image placeholders | Makes missing assets look like errors and wastes the most valuable viewport area. |
| Masonry or dense multi-column cards | Weakens rank, scan order, keyboard order, and story-to-story comparison. |
| Making the whole card clickable | Conflicts with source and completion controls and increases accidental navigation. |
| Category tabs or filters | Hide most of the briefing and make the finite total harder to understand. |
| Horizontally scrolling category chips | Conceal categories and perform poorly on desktop and keyboard navigation. |
| Grey-on-grey metadata | Reduces legibility and makes useful trust information look disabled. |
| Targets below 44px | Raises mistap risk for touch and motor-impaired readers. |
| Colour-only category or read state | Fails colour-vision and forced-colour use cases. |
| Filled category badges with unchecked white text | Introduces unapproved contrast combinations. |
| Collapsed “So what” or source sections | Conceals the app’s most differentiating and trust-restoring information. |
| Rendering an empty “What now” block | Creates meaningless hierarchy and implies missing reporting. |
| Showing internal tier names | `page_two` and similar values are production metadata, not reader language. |
| Marking a headline read when opened | Produces dishonest completion data and punishes accidental taps. |
| Streaks, countdowns, badges, or confetti | Reframes informed reading as obligation and conflicts with the calm finite promise. |
| Inaccurate reading-time claims | Progress evidence shows unmet effort expectations can increase abandonment. |
| Breaking-news banners, “Trending,” or push urgency | Conflicts with once-daily cadence and increases anxiety. |
| Forced dark mode | Light mode generally performs better for normal-vision reading; users need control. |
| Pure-black dark surfaces with thin pure-white text | Can create glare/halation and an unnecessarily harsh reading surface. |
| Justified body text or lines over 80 characters | Makes line tracking and word spacing harder. |
| Multiple simultaneous animations or shimmer | Competes directly with text and can trigger vestibular discomfort. |
| Fabricated bylines, timestamps, datelines, or source roles | False precision damages trust more than omitted metadata. |
| Remote source favicons | Add network dependence, visual noise, and possible third-party requests without improving provenance. |
| Presenting a stale edition as today | Violates the app’s central publishing contract. |

---

## 10-line handoff summary

1. Build one finite page containing the complete daily edition and a definitive ending.  
2. Show full reporting on home; use the reader as focused mode, not as a clickbait gate.  
3. Keep a single reading column and use anchor-based category navigation.  
4. Make the lead typographic—never reserve space for imagery.  
5. Separate body, So what, and optional What now in that exact order.  
6. Put named sources and direct URLs visibly into every story experience.  
7. Track only explicit read actions and save progress locally by edition date.  
8. Use Newsreader headlines, Inter UI/body, 17/27px mobile body, and 66ch lines.  
9. Use the measured AA palettes and 44×44px controls in both themes.  
10. End without recommendations, streaks, alerts, confetti, or another feed.

# Stanford-inspired theme — design notes

Reference for the planned UM1 (or similar) theme rebuild. Crawled
from `https://www.stanford.edu` 2026-04-29; treat as guidance, not
literal copy. Stanford's official brand uses cardinal `#8C1C13`
which is industry knowledge — confirm against their brand guidelines
before shipping.

## Header structure (two-row pattern)

Row 1 — **Audience gateway** (small, condensed type):
- Students · Faculty & Staff · Families · Visitors · Alumni
- Sits ABOVE the main brand row; signals "select your audience first"

Row 2 — **Primary navigation** (larger, bolder):
- Logo (text or wordmark) anchored left
- Main nav items horizontally aligned: `Academics · Research · Health Care · Campus Life · Athletics · Admission · About · News · Events`
- Search slot on the right with **dual scope**: `Web` / `People` (toggle), plus a dedicated "People Profiles" link

For UM1 the equivalent audience row could be:
`Students · Faculty · Alumni · Patients · Visitors`

## Hero

- Text-only, NO background photo or video
- Headline: short editorial line ("A Mission Defined by Possibility")
- Body: 1–2 sentences reinforcing the mission
- Single text link as the CTA — no oversized button

Translation for UM1: "Training Myanmar's next generation of physicians" + descriptor + "Read about UM1 →"

## Below-hero blocks (in order observed)

1. **Campus News** — 5 featured story cards (research, law/policy, health, climate, AI, engineering). Each card: title + thumbnail + 1-line teaser.
2. **Academics** — three education tiers (undergrad / graduate / continuing) followed by a list of the 7 schools/colleges.
3. **Faculty profile** — single quote-style block with researcher portrait + pull-quote.
4. **Research** — statistics dashboard ("6,699 inventions · 400+ startups · $11T market value"). Big number + label format.
5. **Student profile** — second human-centred quote block.
6. **Campus Life** — student affairs / dialogue / wellness.
7. **Arts** — museums, performance, scholarship.
8. **Events** — upcoming list.
9. **Health Care** — Stanford Medicine, Healthcare, Children's Health (3 product cards).
10. **Athletics** — championship stats + athlete stories.
11. **Admission** — financial-aid focused messaging at the foot of the page.

## Footer (multi-column, comprehensive)

- **Schools** — 7 institution links
- **Academics** — majors, graduate programs
- **Research** — centres, libraries
- **Health Care** — direct hospital/clinic links
- **Online Learning** — Stanford Online standalone
- **About Stanford** — facts, history, accreditation
- **Admission** — undergrad, graduate, financial aid
- **Resources** — map, directory, profiles, engagement
- **Quick links** — applying, visiting, giving, careers, contact
- **Legal/compliance** — terms, privacy, copyright, accessibility, non-discrimination
- **Social** — Facebook, Twitter, Instagram, LinkedIn, YouTube, iTunes U

## Overall design vibe

- **Minimalist institutional, editorial focus**
- Heavy whitespace between content blocks
- Profile cards + news items create human-centred storytelling
- Layout prioritises accessibility and information scannability over visual drama
- Footer density signals a comprehensive ecosystem map (university with many independent units)

## Typography (inferred — Stanford official: Source Serif Pro + Source Sans Pro)

- Editorial headlines in serif
- Body + UI in humanist sans-serif
- Generous line-height (~1.6 on body)
- Headlines large but not loud; restraint is the theme

## Implementation hints when the UM1 theme rebuild lands

- Two-row header is the most distinctive structural element — worth replicating even if other parts diverge
- `templates/page/HomePage.tsx` should compose 8–10 distinct section types in sequence, not a single hero + grid
- News / Profile / Stats blocks are good candidates for new section types in the admin Section Editor
- Don't reuse the current default theme's gradient + animated-blob background — Stanford uses solid white with whitespace-as-rhythm

## What NOT to copy

- Cardinal red is Stanford-specific; UM1 should pick its own primary (medical teal? medical blue? burgundy?). Do NOT default to red.
- Don't replicate the placeholder GIF style; use real photography.

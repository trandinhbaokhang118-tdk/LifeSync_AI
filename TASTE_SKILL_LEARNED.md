# Taste-Skill — Learned Reference (Anti-Slop Frontend Design)

This is my working memory of the `taste-skill` (v2, `design-taste-frontend`) located at
`taste-skill/skills/taste-skill/SKILL.md`. I apply these rules on every frontend/design task.

> Scope note: taste-skill is built for landing pages, portfolios, redesigns. For dashboards,
> data tables and multi-step product UI (like this admin panel), I apply the universally-relevant
> rules (contrast, theme lock, motion discipline, AI-tell bans) and skip landing-page-only rules.

---

## 0. Read the Room First (Brief Inference)
Before coding, state a one-line **Design Read**:
"Reading this as: <page kind> for <audience>, with a <vibe> language, leaning toward <system/aesthetic>."
Ask at most ONE clarifying question, and only if the read genuinely diverges.

## 1. Three Dials (set per task, don't silently use baseline)
- `DESIGN_VARIANCE` (1 symmetry → 10 chaos), baseline 8
- `MOTION_INTENSITY` (1 static → 10 cinematic), baseline 6
- `VISUAL_DENSITY` (1 airy → 10 cockpit), baseline 4
Dashboards/admin: lower variance (3-5), lower motion (3-4), higher density (5-7).

## 2. Real Design Systems vs Aesthetics
- If brief = Fluent/Material/Carbon/Polaris/Atlaskit/Primer/GOV.UK/USWDS/Radix/shadcn → install the OFFICIAL package, don't hand-roll its CSS.
- One design system per project. Never mix.
- Aesthetics (glassmorphism, bento, brutalism, editorial, dark-tech) have no official package → build honestly with CSS/Tailwind, label approximations.

## 3. Defaults
- React/Next (RSC), Tailwind v4, Motion (`motion/react`), `next/font` or self-hosted fonts.
- Never `useState` for continuous values (scroll/mouse/physics) → use `useMotionValue`/`useTransform`/`useScroll`.
- Icons: Phosphor / HugeIcons / Radix / Tabler. `lucide-react` discouraged (OK if project already uses it — this project DOES use lucide, so keep it).
- One icon family per project. Never hand-roll SVG icons. Standardize strokeWidth.
- Emojis discouraged unless playful/chat brief.
- Verify a package is in package.json before importing.

## 4. Design Engineering (bias correction)
- **Typography:** Inter discouraged as default (OK for neutral/Linear/public-sector). Serif VERY discouraged unless genuinely editorial/luxury + justified. BANNED default serifs: Fraunces, Instrument_Serif. Emphasis = italic/bold of SAME font, never inject a serif word into a sans headline.
- **Italic descenders** (y g j p q): use `leading-[1.1]` min + `pb-1`.
- **Color:** max 1 accent, saturation < 80%. THE LILA RULE: no default AI-purple/blue glow. Neutral base (Zinc/Slate/Stone) + one high-contrast accent. Lock the accent across the WHOLE page.
- **Premium-consumer palette BAN:** no default beige+brass+oxblood+espresso. Rotate alternatives.
- **Layout:** anti-center bias when VARIANCE > 4 (split-screen, asymmetric). Cards only when elevation = real hierarchy; otherwise borders/divide-y/whitespace. Tint shadows to bg hue, no pure-black shadows on light bg.
- **Shape Consistency Lock:** ONE corner-radius scale per page.
- **Interactive states (always build all):** loading (skeletons matching layout, not spinners), empty (composed, shows how to populate), error (inline for forms, toasts for transient), tactile `:active` (`-translate-y-[1px]` or `scale-[0.98]`).
- **Button contrast (a11y, mandatory):** WCAG AA 4.5:1 body / 3:1 large. No white-on-white, no borderless ghost on photo without scrim.
- **CTA:** label fits one line desktop, ≤ 3 words for primary. No duplicate-intent CTAs.
- **Forms:** label ABOVE input, error BELOW, helper present. No placeholder-as-label. All form text passes WCAG AA.

## 4.7 Layout Hard Rules
- Hero fits viewport: headline ≤ 2 lines, subtext ≤ 20 words & ≤ 4 lines, CTA visible no-scroll.
- Hero top padding ≤ `pt-24` desktop. Hero ≤ 4 text elements. Trust/logo wall goes UNDER hero.
- Nav on ONE line desktop, height ≤ 80px (default 64-72).
- Bento: exact cell count (N items → N cells), real visual variety in 2-3 cells, has rhythm.
- Section-Layout-Repetition ban: each layout family once; ≥ 4 families across 8 sections.
- Zigzag alternation cap: max 2 consecutive image+text splits.
- **Eyebrow restraint:** max 1 eyebrow per 3 sections (count `uppercase tracking` labels). Prefer dropping eyebrows.
- Split-header ban (big headline left + small floating paragraph right). Stack vertically instead.
- Page Theme Lock: ONE theme whole page, no mid-page inversion.

## 4.8 Images
- Use image-gen tool if available → else `https://picsum.photos/seed/{desc}/{w}/{h}` → else labeled placeholder slots + tell the user.
- Never div-based fake screenshots, never hand-rolled decorative SVGs.
- Real SVG logos for social proof (Simple Icons / devicon), not text wordmarks.

## 5. Motion
- Motion must be MOTIVATED: hierarchy / storytelling / feedback / state-transition. Never "looked cool".
- Marquee max one per page. "Motion claimed = motion shown" (if dial > 4 it actually animates; else drop to 3 and ship clean static).
- GSAP sticky-stack & horizontal-pan: `start: "top top"`, `pin: true`, correct scrub (canonical skeletons in skill 5.A/5.B). Light reveals: Motion `whileInView` stagger.
- Spring physics, not linear easing.

## 5.D Forbidden Animation
- BANNED: `window.addEventListener("scroll")`, `window.scrollY` in React state, rAF loops touching React state.
- Use `useScroll`, ScrollTrigger, IntersectionObserver, or CSS `animation-timeline: view()`.

## 6. Performance & A11y
- Animate only `transform`/`opacity`. `will-change` sparingly.
- `prefers-reduced-motion` mandatory for any motion > dial 3 (collapse loops/parallax/physics to static).
- Dark mode mandatory for consumer pages, design both modes from start, WCAG AA (AAA body target).
- No pure `#000`/`#fff` — off-black/off-white for depth.
- Viewport: `min-h-[100dvh]`, never `h-screen`.
- LCP < 2.5s, INP < 200ms, CLS < 0.1. Z-index restraint.

## 9. AI Tells (banned unless brief asks)
- No neon/outer glows by default, no pure black, no oversaturated accents, no excessive gradient text, no custom cursors.
- No 3 equal feature cards. No generic names (John Doe), avatars (egg/user icon), fake-perfect numbers (99.99%), startup-slop names (Acme/Nexus), filler verbs (Elevate/Seamless/Unleash).
- No div fake screenshots, no broken Unsplash, no hand-rolled SVG icons.
- No version labels in hero, no section-number eyebrows, rationed middle-dot `·`, no decorative status dots.
- No `<br>`-broken italic headlines, no vertical rotated text, no crosshair/hairline decoration.
- No "Quietly in use at", no "Field notes / On our desks" poetic labels, no weather/locale strips, no micro-meta sentences, no generic step labels (Stage 1/2/3).
- No pills overlaid on images, no fake photo credits, no version footers on marketing pages, no live-stock counters.
- No decoration text strip at hero bottom, no floating top-right sub-text, no filled-track scoring bars.
- No scroll cues.

## 9.G EM-DASH BAN (non-negotiable)
- The em-dash `—` (and en-dash `–` as separator) is COMPLETELY banned everywhere visible: headlines, eyebrows, pills, body, quotes, attribution, captions, buttons, alt text.
- Use a regular hyphen `-`, comma, or period. A single `—` fails pre-flight.

## 14. Pre-Flight Check
Before declaring any UI task done, mentally run the full matrix (theme lock, color/shape lock, button & form contrast, em-dash zero, hero discipline, eyebrow count, layout repetition, motion motivated, reduced-motion, dark mode both tested, mobile collapse, real images, no AI tells, CWV). If any box fails honestly, it is not done.

---

## Sub-skills available (in taste-skill/skills/)
- `taste-skill` (default v2), `taste-skill-v1`, `gpt-tasteskill` (Awwwards/GSAP)
- `redesign-skill` (audit + fix existing — relevant for this project)
- `soft-skill` (expensive soft UI), `minimalist-skill` (Notion/Linear mono), `brutalist-skill`
- `image-to-code-skill`, `imagegen-frontend-web/mobile`, `brandkit`, `stitch-skill`
- `output-skill` (anti-laziness: no placeholder comments, no skipped code blocks)

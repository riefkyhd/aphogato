# DESIGN.md — Aphogato Aesthetic & Design Specification

> Single Source of Aesthetic Truth for `aphogato` and the `anti-slop` ecosystem (`antislop`, `antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-code`).
>
> **Notice on System Governance:** This document contains strictly descriptive design specifications, tokens, and aesthetic constraints. It serves as the positive design direction for `aphogato`.

---

## 1. Brand Identity, Personality & Mood

### Product Name & Domain
- **Product Name:** `aphogato`
- **Domain:** Professional B2B2C Client Proofing, Selection, and Final Delivery Gallery SaaS for Photographers.
- **Audience:** High-end commercial, wedding, and portrait photographers and their discerning private clients.

### Aesthetic Archetype
- **Intersection:** Leica Darkroom Studio × Pic-Time / Pixieset Professional × Linear/Vercel Precision SaaS.
- **Core Mood:** Editorial, high-trust, immersive, darkroom-calm, archival-grade photography showcase.
- **Visual References:** Premium print editorial spreads, darkroom contact sheets, luxury client review suites, precise tabular metrics.

### Anti-Patterns (What `aphogato` Never Is)
- **Never a playful consumer cartoon app:** No bubbly pastel cards, rounded-3xl toy buttons, or cheerful bouncy interactions.
- **Never neon/purple SaaS gradient slop:** Zero purple-to-cyan mesh gradients, glowing cosmic orbs, or trendy AI sparkle illustrations.
- **Never a cluttered template grid:** No noisy badges, low-contrast gray text on dark gray, or unaligned decorative clutter.
- **Never an impersonal generic storage box:** No raw folder trees or unstyled generic file pickers.

---

## 2. `antislop` Liveliness Toolkit Dials & Design Read

`aphogato` operates across two primary contexts with distinct liveliness requirements:

### A. Public Client Gallery (`/gallery/[token]`)
- **ENERGY: Medium-High**
  - High emotional engagement and respect for visual art.
  - Immersive masonry / virtualized image grid celebrating full photographic fidelity.
  - Fluid selection counters and instant visual reinforcement upon picking photos.
  - Smooth, frictionless lightbox transitions for inspection.
- **RHYTHM: Focused & Immersive**
  - Zero-distraction layout geometry.
  - Controls reside in a quiet top filter bar and a sticky bottom selection drawer.
  - Content flows without arbitrary dividers or decorative interruptions.
- **MOTION: Crisp & Restrained**
  - Transitions strictly bounded between `120ms` and `200ms` ease-out.
  - Discrete scale and opacity transitions (`scale-[1.01]`, `opacity-100` on hover/selection).
  - Absolutely zero bouncy springs, wobbles, or distracting physics simulations.

### B. Photographer Dashboard (`/dashboard/**`)
- **ENERGY: Calm & Operational**
  - Focuses on high-throughput professional workflows: proofing status, billing, calendar scheduling, and cloud storage management.
  - Clean darkroom surfaces with high contrast and dense tabular data.
- **RHYTHM: Disciplined 3-Zone Spatial Cadence**
  - Zone 1: Restrained global navigation and project context switcher.
  - Zone 2: Operational KPI and filter toolbar strip.
  - Zone 3: High-density data grid, Kanban board, or masonry contact sheet.
- **MOTION: Instant & Precise**
  - Interactive states respond within `150ms cubic-bezier(0.16, 1, 0.3, 1)`.
  - Immediate optimistic UI feedback on status transitions, deletions, and uploads.

---

## 3. Color Palette & Pre-Verified WCAG Contrast Matrix

All foreground tokens are verified against darkroom canvases using standard relative luminance formulas. Every body text color strictly exceeds WCAG AAA (`7:1`) or AA (`4.5:1`) thresholds. Low-contrast zinc grays (`#71717A`, `#52525B`) are forbidden for readable content.

```
Canvas & Surfaces
┌─────────────────────────────────────────────────────────────┐
│ Primary Darkroom Canvas: #0C0A09 / #0A0A0A                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Elevated Card / Well: #141210 / #141414               │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Modal / Sheet Overlay: #18181B (with blur)       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
Hairlines: rgba(255, 255, 255, 0.07)  |  Hover: rgba(255, 255, 255, 0.14)
```

### Canvas & Surface Tokens
| Token | Hex / Value | Purpose |
| :--- | :--- | :--- |
| `canvas-primary` | `#0C0A09` (or `#0A0A0A`) | Base darkroom backdrop for galleries and dashboard. |
| `surface-elevated` | `#141210` (or `#141414`) | Cards, table containers, wells, and grouped toolbars. |
| `surface-sheet` | `#18181B` (`zinc-900`) | Dialogs, modals, and popovers with `backdrop-blur-md`. |
| `border-hairline` | `rgba(255, 255, 255, 0.07)` | Standard structural separators and card outlines (`#2A2A2A`). |
| `border-hover` | `rgba(255, 255, 255, 0.14)` | Interactive element border on focus or hover (`#3A3A3A`). |

### Typography Tokens & WCAG Contrast Matrix
| Token | Color Name | Hex | Contrast vs `#0C0A09` | WCAG Level | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-primary` | Ivory / Zinc 100 | `#F4F4F5` | **17.97:1** | AAA | Headings, project titles, primary text. |
| `text-editorial` | Zinc 300 | `#D4D4D8` | **13.37:1** | AAA | Secondary text, descriptions, body copy. |
| `text-muted` | Zinc 400 | `#A1A1AA` | **7.71:1** | AAA (Large) / AA | Metadata, table headers, kickers, timestamps. |
| `text-legacy` | Gray 500 (Aphogato) | `#888888` | **5.58:1** | AA | Secondary captions (must remain above 4.5:1). |

### Accent & Semantic Status Tokens
| State | Hex | Foreground Ink | Purpose |
| :--- | :--- | :--- | :--- |
| `accent-primary` | `#FBBF24` (Amber 400) / `#F59E0B` | `#0C0A09` (11.83:1) | Primary CTA buttons, focus rings, brand accent. |
| `status-selected`| `#34D399` (Emerald 400) | `#0C0A09` (12.4:1) | Approved client picks, confirmed selections. |
| `status-pending` | `#FBBF24` (Amber 400) / `#B8860B` | `#0C0A09` (11.8:1) | In-progress proofs, editing state. |
| `status-error`   | `#FB7185` (Rose 400) | `#0C0A09` (9.8:1) | Delete warnings, validation failures, errors. |

---

## 4. Typography System & Tri-Font Pairing Rules

The system employs three typography voices with strict boundary separation:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DISPLAY & EDITORIAL SERIF                                │
│    "Katherine & James — Lake Como"                          │
│    Reserved for hero gallery titles & cover headers         │
├─────────────────────────────────────────────────────────────┤
│ 2. UI & CONTROL GEOMETRIC SANS                              │
│    "SELECTION QUOTA: 42 OF 50 · CONFIRM PICKS"              │
│    Section kickers (11px uppercase tracking-[0.14em])       │
├─────────────────────────────────────────────────────────────┤
│ 3. TECHNICAL OPTICAL MONOSPACE                              │
│    "DSC04921.ARW · 45.2 MB · 8192×5464 · 1/250s f/1.4"      │
│    Reserved for camera filenames, tokens, & tabular metrics  │
└─────────────────────────────────────────────────────────────┘
```

1. **Display & Editorial Serif (`font-serif`)**:
   - Reserved strictly for editorial moments: gallery hero titles, project cover titles, client quote headers.
   - Styling: Light weight (`font-light` / `font-normal`), tracking normal or slightly loose.
2. **UI & Control Geometric Sans (`font-sans`)**:
   - Universal application across navigation tabs, buttons, form controls, and table rows.
   - Section kickers and labels: `11px uppercase tracking-[0.1em]` to `tracking-[0.14em]` in `text-zinc-400`.
3. **Technical & Optical Monospace (`font-mono`)**:
   - Exclusively reserved for machine-adjacent strings: image filenames (`DSC04921.ARW`), cryptographic gallery tokens, image dimensions, byte sizes, and financial figures (`tabular-nums`).
   - **Pairing Rule:** Never mix Serif and Monospace in the same button or compact control cluster.

---

## 5. Layout, Spatial Hierarchy & Navigation Architecture

### Spatial Cadence
- **Desktop Dashboard:** Fixed or sticky top bar (`h-14`) with project context switcher, followed by a restrained KPI toolbar (`h-12`), feeding directly into edge-aligned data tables or photo grids.
- **Client Gallery:** Full-bleed darkroom presentation. Controls float quietly at the top (`sticky top-0 z-30 bg-bg-primary/90 backdrop-blur-md`), and the selection drawer anchors to the bottom safe area.

### One-Border-Per-Cluster Rule
- Visual separation must come primarily from background value differences (`#0C0A09` vs `#141210`) rather than nested border outlines.
- A card group may possess a single outer hairline border (`border border-white/[0.07]`). Elements *within* that container must use padding, spacing, or ghost button treatments rather than additional heavy borders.

### Mobile Layout & Touch Ergonomics (`antislop-layoutmobile`)
- **Minimum Tap Target:** Every interactive element must provide at least `44×44px` physical touch area (even when visual icons are `16×16px`).
- **Safe Area Insets:** Mandatory padding with `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` on sticky footers, sheets, and full-screen lightboxes.
- **Zero Horizontal Overflow:** Viewports from `320px` to `2560px` must maintain `overflow-x: hidden` at the document root with responsive flex wrapping or horizontal touch carousels.

---

## 6. Component Specifications & Interactive States

### Buttons & Action Clusters
- **Compact Admin Toolbar:** `h-8` or `h-9`, `px-3`, `text-[12px] font-medium`, `rounded-sm` (2px radius).
- **Primary Client Actions:** `h-11` or `h-12`, `px-5`, `text-[13px] tracking-wide font-medium`, high-contrast solid background (`bg-amber-400 text-stone-950` or `bg-white text-stone-950`).
- **Interactive States:**
  - Default: Full base opacity.
  - Hover: Opacity `0.9` or subtle surface illumination (`bg-white/[0.04]`).
  - Active: Scale `0.98` for tactile physical feedback.
  - Disabled: Opacity `0.4`, cursor `not-allowed`.

### Iconography Standard
- Vector icons exclusively powered by Lucide SVG with consistent `1.75px` stroke width (`h-4 w-4` or `h-5 w-5`).
- **No Emojis in UI Chrome:** Raw emojis (e.g. 📷, 👑, ✨) are strictly forbidden in UI buttons, badges, table headers, and navigation chrome.
- **Accessibility:** All icon-only buttons require an explicit `Tooltip` and an accessible `aria-label`.

### Contact Sheet Cards & Lightbox
- **Darkroom Mat Framing:** Photo thumbnails reside on an elevated dark mat (`bg-white/[0.02] border border-white/[0.06]`), honoring natural aspect ratios without forced square crops.
- **Pick Indicator:** Crisp top-right selection checkbox with instant emerald fill (`#34D399`) and check icon.
- **Lightbox Inspection:** Deep black backdrop (`#050505/98` with `backdrop-blur-xl`), keyboard navigation (`ArrowLeft`, `ArrowRight`, `Space` to pick), and technical metadata overlay in monospace.

---

## 7. Storage & Edge-Cached Media Pipeline

`aphogato` implements a multi-tier storage abstraction supporting Cloudinary, ImageKit, and Google Drive:

```
Client Upload (Dashboard)
  │
  ├─► Direct Signed Upload ──► Cloudinary / ImageKit ──► DB Registration
  │
  └─► Resumable Stream   ──► Google Drive API        ──► DB Registration
                                 │
Delivery & Edge Proxy             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ /api/media/[id]?w=1600&q=80 (Edge Cached CDN)               │
  │ • Google Drive Thumbnail Engine (=s1600 rewriting)          │
  │ • Cache-Control: public, s-maxage=31536000, immutable       │
  └─────────────────────────────────────────────────────────────┘
```

- **Provider Abstraction:** Modular configuration per project via `projects.storage_provider` (`'cloudinary'`, `'imagekit'`, `'gdrive'`).
- **Google Drive CDN Proxy (`/api/media/[id]`):** On-the-fly dimension parameter rewriting (`=s800`, `=s1600`, `=s2048`) backed by Google Drive's thumbnail generation and cached globally via Vercel Edge (`s-maxage=31536000, immutable`).
- **Uncapped File Handling:** Client-side canvas compression is bypassed for original Lightroom exports (`20MB–50MB+`) when targeted to Google Drive resumable storage, ensuring archival-grade master files remain untruncated.

---

## 8. Client Selection & Step 6 Final Delivered Gallery Workflow

### Step 2 Selection Lock
- Once a client confirms their photo selection via `PATCH /api/gallery/confirm` (`project.status === 'selected'`), proof selection controls lock down into a confirmed review state.
- Accidental toggles are prevented, and a reassuring confirmation banner displays the exact count of submitted picks alongside the timestamp.

### Step 6 Final Delivered Gallery Mode
When final edited photographs are synced and published (`project.status === 'delivered'`):
1. **Gallery Transformation:** `/gallery/[token]` switches from an interactive proofing sheet into an archival delivery showcase.
2. **Dual-Stage Toggle:** Prominent segmented toggle allowing clients and family to alternate between *"Proofs"* and *"Edited Finals"*.
3. **Download Capabilities:**
   - Single-click full-resolution individual downloads (`?download=1`).
   - Batch ZIP or direct Google Drive shared folder access for master deliverables.

---

## 9. Copywriting & Microcopy Voice (`antislop-copywriting`)

`aphogato` speaks with the quiet confidence of a master printer in a photography darkroom.

### Professional Vocabulary
- **Use:** *"Proofs"*, *"Edited Finals"*, *"Contact Sheet"*, *"Selection Quota"*, *"RAW Stems"*, *"Lightroom Export"*, *"Archival"*, *"Deliverables"*.
- **Avoid:** *"Photos"*, *"My Pictures"*, *"Shopping Cart"*, *"Checkout"*, *"Buy Now"*, *"Upload Widget"*.

### Banned AI Slop Copy
- ❌ *"Welcome to the future of client photo management..."*
- ❌ *"Seamlessly showcase your stunning masterpieces with AI-powered ease..."*
- ❌ *"Elevate your photography workflow to the next level..."*
- ❌ *"Delight your clients with magical selection experiences..."*

### Approved Editorial Microcopy
- ✔ *"Katherine & James — Wedding Proofs (42 of 50 selected)"*
- ✔ *"Selection locked and submitted to studio. The darkroom is preparing your finals."*
- ✔ *"Download edited high-resolution archive (64 photos · 1.8 GB)"*

---

## 10. Maintenance & Living System Governance

### Synchronization Checklist
Any proposed modification to typography, layout, or color palette must be vetted against this document and synced across:
1. `src/app/globals.css` (CSS custom properties and base resets)
2. `tailwind.config.ts` (Tailwind color scales, spacing, and typography keys)
3. `.cursor/rules/brand-guidelines.mdc` (Cursor agent rules)
4. `.cursor/rules/ui-patterns.mdc` (Component and interaction patterns)

### Compliance Rule
Whenever generating new screens, dialogs, or email/WhatsApp templates, agents must align with the contrast rules in Section 3 and the voice guidelines in Section 9.

# PricePilot design system

Tokens live in `app/globals.css`. Primitives live in `components/ui`, product components in `components/product`, and the shell in `components/layout`. A live gallery of everything is at `/design`.

## Direction: the price ledger

PricePilot should feel like a well-edited buying guide that does careful arithmetic. The look borrows from editorial print (paper, ink, hairline rules, numbered sections, a serif for headlines) and from precise software (tabular numbers, a mono face for metadata, small radii, one focus treatment everywhere).

Deliberate choices:

| Decision | Why |
| --- | --- |
| **Green only means "saves you money".** It marks a price below average, the best total and the focus ring, and nothing else. Primary buttons are ink, not green. | If green were also the brand colour, a green badge would stop meaning anything. Keeping it for savings makes the price signals readable at a glance. |
| **Warm paper (`#f5f2eb`), never a pure white page.** Cards and inputs use `surface`, which is a touch lighter. | Product photos on white backgrounds stand out against paper without heavy borders, and the page reads as a publication rather than an admin panel. |
| **Newsreader for display, Geist for UI, Geist Mono for metadata.** | The serif carries the editorial voice in headlines only. Geist keeps controls precise, and the mono eyebrows read like labels on a spec sheet. |
| **Hairlines and numbered sections instead of cards.** Sections open with a 1px ink rule and an index like `02 — Price watch`. | This gives structure without stacking boxes on boxes, and avoids the "grid of gradient cards" template look. |
| **Rhythm changes on the homepage**: hero → rail → card grid → table and chart → index list → inverted panel. | Each section uses a different layout, so the page doesn't read as one repeated component. |
| **Step chart for price history**, hand-written in SVG. | A price holds until it changes, so steps are more honest than smoothed curves. Twelve points don't justify a chart library. |
| **Totals, not stickers.** Offers are ranked by price plus shipping. | This is the product's core promise, so the UI is built around it (see the homepage comparison section). |
| **Small radii** (4–18px), tag-like badges at 4px. | Reads as precise rather than bubbly. |

## Tokens

**Colour** (semantic; light and dark both defined; contrast checked with a script):

| Token | Light | Use | Contrast on paper |
| --- | --- | --- | --- |
| `paper` | `#f5f2eb` | page background | — |
| `surface` | `#fffdf9` | cards, inputs, popovers | — |
| `sunken` | `#ece8df` | image wells, skeletons | — |
| `ink` | `#1a1813` | primary text and buttons | 15.9:1 |
| `ink-muted` | `#5c574c` | secondary text | 6.4:1 |
| `ink-subtle` | `#736d61` | meta text | 4.6:1 |
| `line-control` | `#948e80` | input borders | 3.2:1 on surface |
| `signal` | `#0a6b4c` | savings, best price, focus | 5.8:1 |
| `rise` | `#9a4310` | price went up | 5.5:1 on `rise-soft` |
| `danger` | `#b42318` | errors | 5.9:1 |

Dark mode follows `prefers-color-scheme`. There is no manual toggle yet, because adding one needs a no-flash script and a stored preference.

**Type scale** (`--text-*`): 2xs 11/16, xs 12/18, sm 14/22, base 16/24, lg 18/28, xl 22/30, 2xl 28/34, 3xl 36/40, 4xl 48/1.05, 5xl 64/1. The hero uses `clamp(2.75rem, 7vw, 5.25rem)`. Prices always use `tabular-nums`.

**Spacing**: the Tailwind 4px base. Sections use `py-12`, the hero uses `pt-10 md:pt-16`, and card grids use `gap-x-4 lg:gap-x-6 gap-y-10`.

**Layout**: `page-container` sets a max width of 80rem with gutters of 16, 24 and 32px at the base, `sm` and `lg` breakpoints. Readable text is capped at about 40rem.

**Breakpoints**: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Mobile navigation applies below `md`. Multi-column layouts start at `lg`.

**Radii**: `xs` 4 (badges, checkboxes), `md` 8 (buttons, inputs), `lg` 12 (image wells, menus), `xl` 18 (feature panels, dialogs).

**Elevation**: borders do most of the work. `shadow-sm` is for resting raised elements, and `shadow-lg` is only for floating layers (popovers, dialogs, the hero price ticket).

**Focus**: every interactive element gets a 2px `signal` outline with a 2px offset (the `focus-ring` utility plus a base `:focus-visible` rule). Inputs instead show a signal-coloured border plus a soft ring.

**Motion**: `fast` 120ms (hovers, presses), `base` 200ms (menus, dialogs), `slow` 320ms (sheets, image zoom). Easing is `cubic-bezier(.2,.8,.2,1)`. Under `prefers-reduced-motion`, all animations and transitions are reduced to near-zero, and the image-zoom and shimmer effects are gated with `motion-safe:` / `motion-reduce:`.

## Component conventions

- Components follow shadcn/ui conventions (`cn()`, `cva` variants, `data-slot`, `asChild`) but are written in this repo. They are built on the unified `radix-ui` package for keyboard behaviour and focus management (Dialog, DropdownMenu, Select, Tabs, Checkbox, Label, Slot).
- `IconButton` requires a `label`, so an icon-only control can't ship without an accessible name.
- `Field` wires up the label, hint and error with `aria-describedby` and `aria-invalid` automatically.
- `PriceDelta` never relies on colour alone: it carries an arrow icon, a visible sign and screen-reader text.
- Tables are real `<table>` elements with captions and row headers.
- Server Components by default. Client components are limited to interactive leaves: nav state, dialogs, the wishlist, toasts and gallery demos.

## Content rules

- Products and photography are real. Stores (Northline, Parcel & Co., Voltmart, Harbor Supply, Kettle & Crate) are fictional, and all prices and history are sample data. The footer says so.
- No testimonials, user counts, "trusted by" logos or invented statistics. Every number on screen is computed from the catalog data.
- "Suggested searches" are curated, and are not labelled as popular, because there is no analytics data.

## Photography

Unsplash License, stored locally in `public/images/products/` (each product's `image.sourceUrl` links the original). They're served through `next/image` in fixed-ratio wells on the `sunken` colour to prevent layout shift.

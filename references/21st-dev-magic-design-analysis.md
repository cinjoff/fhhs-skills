# 21st.dev Magic MCP — Design Analysis

## Overview

21st.dev Magic is an MCP server ("like v0 but in your IDE") that generates React UI components from natural language. The platform at 21st.dev is also a marketplace/registry for shadcn/ui-based components. This analysis covers both the Magic landing page and the broader 21st.dev platform design.

---

## Color Scheme

### Dark-First Design
- **Background:** Pure black (`bg-black`) for the Magic landing page; dark neutral for the browse experience
- **Text hierarchy:** White for headings, `text-neutral-200` for secondary headings, `text-neutral-300` for descriptions, `text-neutral-400` for body/supporting text
- **Borders:** Semi-transparent white (`border-white/10`) — creates subtle glass-like card boundaries
- **Card surfaces:** `bg-white/5` — extremely low-opacity white fill over black, producing a frosted/smoked glass effect
- **Interactive hover states:** `bg-neutral-800/50`, `bg-neutral-700/50` — subtle warm-up on interaction
- **Accent badges:** `bg-neutral-800/50` with rounded-xl pills

### CSS Variable System (shadcn/ui standard)
All semantic colors use HSL CSS variables: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, plus chart colors (`--chart-1` through `--chart-5`) and sidebar-specific tokens. Dark mode via `class` strategy on `<html>`.

---

## Typography

- **Font stack:** Geist Sans (`var(--font-geist-sans)`) as primary; Geist Mono for code
- **Headings:** Extremely tight tracking (`tracking-tighter`), bold weight, large sizes: `text-5xl` to `text-[3.9rem]/16`
- **Gradient text on headings:** `bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white` — creates a subtle vertical fade from near-white to slightly dimmed, giving depth without a garish gradient
- **Body text:** `text-lg` with `leading-relaxed` for readability
- **Font weights:** Bold for headings (`font-bold`), semibold for card titles (`font-semibold`), medium for nav items (`font-medium`), light for secondary branding (`font-light text-gray-400`)
- **Brand treatment:** "Magic" in medium weight + "by 21st.dev" in light gray — clean hierarchy in a single line

---

## Layout Patterns

### Page Structure
```
Full-screen black container (absolute inset-0, overflow-auto)
  → Floating header (fixed, z-50)
  → Hero section (full-width, with spotlight effects)
  → Content sections (max-w-7xl, centered, px-4/sm:px-6/lg:px-8)
    → SupportedEditors
    → Features (3-column grid)
    → HowItWorks (3-column grid)
    → FAQ
  → Footer
```

### Grid System
- **Feature cards:** `grid gap-8 sm:grid-cols-2 lg:grid-cols-3` — responsive 1→2→3 columns
- **Cards:** `rounded-2xl` (16px radius), `p-8` padding, `border border-white/10`, `shadow-lg`
- **Container:** max-width 1400px at 2xl, centered with 2rem padding
- **Custom breakpoints:** `min-420`, `min-720`, `min-1280`, `min-1536` alongside standard Tailwind

### Card Design
- Glass-morphism style: `bg-white/5` + `backdrop-blur-sm` + `border-white/10`
- Consistent inner spacing: `p-8`
- Image area with fixed aspect ratio: `aspect-[21/5]`
- Content below image: title → description with consistent margins (`mt-5`, `mt-2`)
- Badge pills positioned `absolute top-4 right-4` with small padding, rounded-xl

---

## Animations & Motion

### Spotlight Effect (Hero)
The hero uses a custom `Spotlight` component — the signature visual:
- Three layered radial gradients in blue-ish HSL tones: `hsla(210, 100%, 85%, .08)`, `.06`, `.04`
- Rotated at ±45 degrees, translated upward to create a theatrical stage-lighting effect
- **Animated with Framer Motion:** two spotlight groups oscillate horizontally (`x: [0, ±100, 0]`) on infinite repeat with `easeInOut`, 7-second duration
- Fade-in on mount: `opacity: 0 → 1` over 1.5 seconds
- `pointer-events-none` so they don't interfere with interaction

### Header Transition
- Spring-based animation (`stiffness: 300, damping: 30`) for entry
- Scroll-triggered morph: transparent full-width → floating pill with `rounded-xl`, `border-white/10`, `bg-black/70`, `backdrop-blur-md`, `shadow-lg`
- Smooth CSS transition: `transition-all duration-300 ease-out`

### Component Overlays
- Blur animation on hover: `filter: blur(0px) → blur(5px)` over 0.3s
- `AnimatePresence` for enter/exit transitions

### Number Animations
- Uses `@number-flow/react` for animated number transitions (counter animations)

---

## Visual Effects

### Glass Morphism
Pervasive throughout:
- `backdrop-blur-sm` on cards, `backdrop-blur-md` on floating header
- Semi-transparent backgrounds (`bg-white/5`, `bg-black/70`)
- Thin white borders at 10% opacity
- Layered shadows (`shadow-lg`)

### Gradient Usage
- **Heading text gradients:** vertical fade white→gray for subtle depth
- **Spotlight radial gradients:** ambient lighting atmosphere
- **Not used:** no garish multi-color gradients; the palette is monochromatic (white/gray/blue tints only)

### Grid Background
- `bg-grid-white` class on sections for a subtle dot/grid pattern overlay

---

## Component Library & Design System

### Foundation: shadcn/ui + Radix UI
- All base components from shadcn/ui: Button, Avatar, Tabs, TabsList, TabsTrigger, Dialog, etc.
- Radix primitives underneath for accessibility
- Custom radius system: `--radius` CSS variable with `lg/md/sm` variants

### Custom Components
- `Mockup` / `MockupFrame` — device frame for previews
- `CircleProgress` — circular usage meter
- `GitHubStarsBasic` — live star count display
- `Logo` — brand mark with fill/position props
- `Code` — syntax-highlighted code blocks
- `CheckboxCard` — card-style selectable items with icon, label, description
- `Spinner` — loading indicator

### State Management
- Jotai atoms with localStorage persistence (`atomWithStorage`) for sidebar state
- Clerk for auth (SignedIn/SignedOut conditional rendering)
- Supabase for data

---

## Console/Dashboard Design

The Magic Console (`/magic/console`) follows a more utilitarian but still polished pattern:
- Usage tracking with `CircleProgress` component (circular progress indicator)
- API key display with copy-to-clipboard
- Plan info cards showing usage vs. limits
- Tabbed interface (`Tabs/TabsList/TabsTrigger`) for IDE-specific install instructions
- Inline code blocks with the `Code` component
- Upgrade flows with confirmation dialogs
- Feedback dialog for user input
- Warning indicators using `AlertTriangle` from Lucide
- Loading states with `LoaderCircle` spinner
- Toast notifications via Sonner

---

## Key Design Decisions That Work

1. **Monochromatic restraint:** Black + white + subtle blue spotlight tints. No competing accent colors. The content (component previews) becomes the color.

2. **Theatrical lighting:** The animated spotlight effect gives the page cinematic drama without being distracting — it's ambient, not attention-grabbing.

3. **Glass morphism done sparingly:** Translucent cards with thin borders feel premium. The low opacity values (5%, 10%) keep it elegant rather than gimmicky.

4. **Tight typographic scale:** Large bold headings with gradient text + small relaxed body text creates strong visual hierarchy without needing color differentiation.

5. **Consistent card pattern:** Every content section (features, how-it-works, steps) uses the same glass card with image + title + description, creating visual rhythm.

6. **Progressive header:** Transparent → floating glass pill on scroll is a modern pattern that preserves immersive hero experience while maintaining navigation access.

7. **Motion budget:** Animations are slow and ambient (7s spotlight, 1.5s fade-in, spring-based header) rather than fast and snappy. Creates a premium, unhurried feel.

8. **Geist font:** Vercel's Geist is a clean geometric sans-serif that's slightly narrower than Inter, giving the tight tracking a distinctive editorial quality.

---

## Technical Stack

- **Framework:** Next.js (App Router with server/client component split)
- **Styling:** Tailwind CSS with shadcn/ui CSS variable system
- **Animation:** Framer Motion (`motion/react`)
- **State:** Jotai (client), Supabase (server)
- **Auth:** Clerk
- **Fonts:** Geist Sans + Geist Mono (Vercel)
- **Icons:** Lucide React + custom SVG icons
- **Monorepo:** Turborepo with pnpm workspaces

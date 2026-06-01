---
name: Proforma Enterprise
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006229'
  on-tertiary: '#ffffff'
  tertiary-container: '#007e37'
  on-tertiary-container: '#c1ffc5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  sidebar-width: 260px
  sidebar-collapsed: 72px
  container-max: 1280px
---

## Brand & Style

The design system is engineered for high-velocity financial workflows, prioritizing clarity, speed, and precision. It targets professional service providers and enterprise finance teams who require a tool that feels both authoritative and invisible.

The aesthetic follows a **Modern Corporate Minimalism** approach, drawing inspiration from the "utility-first" movement seen in high-performance developer tools and fintech leaders. It utilizes expansive whitespace to reduce cognitive load during complex invoicing tasks. Visual interest is generated through perfect alignment, refined typography, and purposeful motion rather than decorative elements. The interface should feel like a high-end instrument: calibrated, responsive, and reliable.

## Colors

The color architecture is built on a foundation of "Cool Grays" to maintain a neutral, professional environment. 

- **Primary (Corporate Blue):** Used for primary actions, active states, and brand-critical touchpoints. It represents stability and trust.
- **Secondary (Deep Slate):** Reserved for high-level navigation, such as the sidebar background and primary headings, providing a strong structural anchor.
- **Accent (Success Green):** Specifically designated for financial indicators—paid statuses, positive balances, and successful transaction confirmations.
- **Neutral/Background:** A multi-layered gray scale is used to separate concerns without relying on heavy borders. Surfaces use `#FFFFFF`, while the canvas uses `#F8FAFC`.

The system is architected for **Dark Mode** by mapping these tokens to a mirrored slate-based palette where the background shifts to `#020617` and surface containers to `#1E293B`.

## Typography

This design system utilizes **Inter** across all layers to ensure maximum legibility and a systematic, technical feel. 

- **Hierarchy:** Use bold weights (600-700) sparingly for headings to maintain the minimalist aesthetic.
- **Micro-copy:** Use `label-sm` for table headers and metadata to provide a distinct visual contrast from editable body data.
- **Numbers:** Since this is an invoicing system, ensure `font-feature-settings: 'tnum' on, 'lnum' on` is enabled for all data tables to ensure numerical columns align perfectly for easy scanning.
- **Spacing:** Tighten letter-spacing on larger display type to maintain a "high-end" editorial feel.

## Layout & Spacing

The layout is based on a **12-column fluid grid** with fixed-width sidebars. 

- **Sidebar Model:** A permanent left-hand navigation. On desktop, it defaults to `260px`. On smaller screens or for power users, it collapses to a `72px` icon-only view.
- **Grid:** Use a `24px` (lg) gutter between major dashboard cards and a `16px` (md) gutter for internal component spacing.
- **Safe Areas:** Main content areas should have a minimum horizontal padding of `32px` on desktop and `16px` on mobile.
- **Alignment:** All elements must align to an 8px square grid to ensure visual rhythm and predictable scaling.

## Elevation & Depth

Hierarchy is established through **low-contrast outlines** and **ambient shadows**. This design system avoids heavy shadows to maintain its clean, high-performance feel.

- **Level 0 (Flat):** Used for the main canvas background.
- **Level 1 (Subtle):** Used for cards and sections. Defined by a 1px border (`#E2E8F0`) and no shadow.
- **Level 2 (Interactive):** Used for buttons and hover states. Uses a soft, highly diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Level 3 (Overlay):** Used for modals and dropdowns. Features a prominent backdrop blur (12px) and a more significant elevation shadow to separate the element from the data-heavy background.

Transitions between levels should be snappy (150ms) to emphasize the high-performance nature of the product.

## Shapes

The shape language is consistently **Rounded**, striking a balance between modern friendliness and professional structure.

- **Base Components:** Buttons, input fields, and small cards use a `8px` (0.5rem) radius.
- **Large Containers:** Dashboard widgets and main content areas use a `16px` (1rem) radius.
- **Selection States:** Use a `6px` radius for internal items (like sidebar links) to create a "nested" aesthetic when placed inside `8px` containers.
- **Form Elements:** Checkboxes use a `4px` radius to maintain a crisp, clickable appearance.

## Components

- **Buttons:** Primary buttons use a solid `#2563EB` fill with white text. Secondary buttons use a white background with a 1px border. All buttons have a height of 40px for standard actions and 32px for table-row actions.
- **Data Tables:** The core of the system. Use "Zebra" striping only on hover. Headers are uppercase `label-sm`. The last column (Actions) is always right-aligned.
- **Input Fields:** Use a subtle `#F1F5F9` background when inactive, shifting to white with a 2px Primary Blue border on focus. Labels should always be visible above the field.
- **Dashboard Cards:** Must include a standardized header with a title and an optional "Action" or "Period Selector."
- **Status Chips:** Use a soft background (10% opacity of the status color) with high-contrast text. For example, "Paid" uses `#22C55E` text on a light green tint.
- **Sidebar:** Icons should be 20px, stroke-based (2px weight), with text labels in `body-sm`. Active states are indicated by a subtle background shift and a 3px vertical "pill" on the leading edge.
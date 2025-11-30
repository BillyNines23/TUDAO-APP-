# TUDAO Phase 2 Architect Dashboard - Design Guidelines

## Design Approach

**Selected System**: Carbon Design System (IBM)
**Justification**: Purpose-built for data-intensive enterprise applications with complex hierarchies, real-time monitoring, and administrative workflows. Carbon's robust component library, clear data visualization patterns, and proven scalability align perfectly with TUDAO's multi-layered KPI dashboard, node management, and verification systems.

**Core Design Principles**:
1. Information clarity over decoration
2. Scannable data hierarchies
3. Immediate status comprehension
4. Action-oriented interface design

---

## Typography System

**Font Family**: 
- Primary: IBM Plex Sans (via Google Fonts CDN)
- Monospace: IBM Plex Mono (for wallet addresses, transaction hashes, numeric data)

**Type Scale**:
- Page Headers: text-4xl font-light (36px)
- Section Headers: text-2xl font-normal (24px)
- Card Titles: text-lg font-semibold (18px)
- Body Text: text-base font-normal (16px)
- Metadata/Labels: text-sm font-medium (14px)
- Captions/Timestamps: text-xs font-normal (12px)
- Data Values: text-base font-mono (16px monospace)

**Hierarchy Rules**:
- Use font-weight variations (light/normal/medium/semibold) to establish hierarchy
- Apply letter-spacing for all-caps labels: tracking-wide
- Maintain 1.5 line-height for body text, 1.2 for headers

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 24**
- Micro spacing (within components): p-2, gap-2, space-x-2
- Component padding: p-4, p-6
- Card/section spacing: p-6, p-8
- Page margins: p-8, p-12
- Section breaks: mb-12, mb-16, mb-24

**Grid Structure**:
- Sidebar navigation: Fixed width 256px (w-64)
- Main content area: flex-1 with max-w-[1600px]
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Data tables: w-full with horizontal scroll on mobile
- Form layouts: max-w-2xl for optimal readability

**Container Strategy**:
- Page wrapper: min-h-screen with sidebar flex layout
- Content sections: px-8 py-6
- Cards: rounded-lg with shadow-sm elevation
- Modals/overlays: max-w-3xl centered

---

## Component Library

### Navigation
**Sidebar Navigation** (256px fixed):
- Collapsible on mobile (hamburger trigger)
- Logo/branding at top (h-16 flex items-center px-6)
- Nav groups with category headers (text-xs uppercase tracking-wide mb-2)
- Active state: subtle left border (border-l-4) with slight background shift
- Icon + label pattern (gap-3 alignment)
- Footer area for user profile/settings

**Top Bar**:
- h-16 with border-b
- Breadcrumb navigation (left-aligned)
- Quick actions/search (center)
- Notifications + user menu (right-aligned with gap-4)

### Dashboard Cards
**Metric Cards** (KPI display):
- Compact size: min-h-[120px] p-6
- Label (text-sm font-medium) + Large value (text-3xl font-bold font-mono)
- Trend indicator with icon (↑↓) + percentage change (text-sm)
- Optional sparkline chart (h-12 w-full)

**Status Cards** (Node/SLA monitoring):
- Status badge top-right (rounded-full px-3 py-1 text-xs font-medium)
- Primary metric + supporting metrics grid (grid-cols-2 gap-4)
- Progress bars for uptime percentages (h-2 rounded-full)

**Data Cards** (Verification/Emissions):
- Header with title + action button
- Divider (border-b)
- Content area with structured data
- Footer with metadata/timestamps

### Tables
**Data Table Pattern**:
- Sticky header (sticky top-0 z-10)
- Alternating row treatment for scannability
- Column headers: text-xs font-semibold uppercase tracking-wide
- Cell padding: px-6 py-4
- Action column (right-aligned) with icon buttons (w-8 h-8)
- Row hover state for interactivity feedback
- Pagination controls (bottom, right-aligned)

**Table Features**:
- Sortable columns (with sort indicator icons)
- Filterable headers (dropdown triggers)
- Expandable rows for drill-down details
- Fixed first column option for wide tables

### Forms
**Input Fields**:
- Label above input (text-sm font-medium mb-2)
- Input height: h-10 with px-4 padding
- Border: border rounded-md
- Focus state: ring-2 treatment
- Helper text: text-xs mt-1
- Error state: red border + error message

**Form Layout**:
- Single column for narrow forms (max-w-md)
- Two-column for wide forms (grid-cols-2 gap-6)
- Action buttons right-aligned (justify-end gap-3)

### Buttons
**Button Hierarchy**:
- Primary: h-10 px-6 rounded-md font-medium
- Secondary: h-10 px-6 rounded-md font-medium (border variant)
- Tertiary: h-10 px-4 font-medium (text-only with hover background)
- Icon-only: w-10 h-10 rounded-md flex items-center justify-center

**Button Groups**:
- gap-3 spacing
- Primary action rightmost

### Data Visualization
**Charts** (using Chart.js or Recharts):
- Consistent height: h-64 for standard charts, h-96 for detailed views
- Clean axes with minimal grid lines
- Clear legends (positioned top-right or bottom)
- Tooltip on hover with detailed breakdowns
- Responsive: maintain aspect ratio on resize

**Chart Types**:
- Line charts: emissions over time, uptime trends
- Bar charts: tier comparisons, daily metrics
- Donut/pie charts: distribution (FEU allocation, node tier breakdown)
- Area charts: cumulative metrics (total emissions, claim rates)

### Status Indicators
**Badge System**:
- Pill shape: rounded-full px-3 py-1
- Size: text-xs font-medium
- States: Active, Pending, Failed, Warning
- Icons optional (leading, w-3 h-3)

**Alert Banners**:
- Full-width with border-l-4 accent
- Icon (left) + Message + Dismiss (right)
- Padding: px-6 py-4
- Types: Info, Warning, Error, Success

### Modals & Overlays
**Modal Structure**:
- Backdrop: fixed inset-0 overlay
- Modal container: max-w-3xl centered with shadow-2xl
- Header: px-8 py-6 with border-b (title + close button)
- Body: px-8 py-6 with max-h-[60vh] overflow-y-auto
- Footer: px-8 py-6 border-t (actions right-aligned)

**Dropdown Menus**:
- min-w-[200px] with shadow-lg rounded-md
- Items: px-4 py-2 with hover state
- Dividers: border-t with my-1 spacing
- Icons: w-5 h-5 (leading position)

---

## Dashboard-Specific Patterns

### Overview Page (Command Center)
**Layout**: 4-column grid for metric cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Top row: Critical metrics (Active Nodes, SLA Pass Rate, NRP Utilization, Pending Tasks)
- Second row: Trend charts (2-column span each, grid-cols-1 lg:grid-cols-2)
- Alert section: Full-width banner area (top of page if alerts exist)

### Node Management Views
**List View**: 
- Filter bar (sticky top-16): Tier selector + Status selector + Search input + Date range
- Table with columns: Node ID, Tier, Owner (truncated wallet), Uptime %, Status, Actions
- Pagination: 25/50/100 per page options

**Detail View**:
- Two-column layout (grid-cols-1 lg:grid-cols-3)
- Left (col-span-2): Uptime chart, telemetry log, verification history
- Right (col-span-1): Node metadata card, quick actions panel

### Verification Dashboard
**Task Queue**:
- Kanban-style columns: Assigned, In Progress, Review, Completed
- Card layout per task: Task ID + Weight indicator + Assigned verifier + Time remaining
- Drag-drop reordering (visual feedback with transition-transform)

### Reports & Exports
**Report Builder**:
- Step indicator (top, mb-8)
- Form sections with clear boundaries (space-y-8)
- Preview pane (right column, sticky position)
- Export options: Format selector + Delivery method + Schedule toggle

---

## Animations & Micro-interactions

**Use Sparingly**:
- Data updates: gentle fade-in (opacity transition)
- Loading states: skeleton loaders (pulse animation) over spinners
- Page transitions: slide-fade (duration-200)
- Chart animations: smooth entry on mount (duration-500 ease-out)

**No Animations**:
- Avoid decorative animations
- Skip complex scroll-triggered effects
- Maintain instant response for user actions

---

## Responsive Behavior

**Breakpoints**:
- Mobile: base (< 768px) - Single column, collapsed sidebar
- Tablet: md (768px+) - 2-column grids, expandable sidebar
- Desktop: lg (1024px+) - Full layout with persistent sidebar
- Wide: xl (1280px+) - 4-column grids, expanded data views

**Mobile Adaptations**:
- Sidebar becomes overlay drawer (slide-in from left)
- Tables: horizontal scroll with sticky first column
- Metric cards: stack to single column
- Charts: reduce height to h-48, simplify axes

---

## Accessibility Standards

- Semantic HTML structure (nav, main, section, article)
- ARIA labels for icon-only buttons and status indicators
- Keyboard navigation: focus visible states (ring-2)
- Focus management in modals (trap focus, restore on close)
- Color-independent status indication (icons + text labels)
- Sufficient contrast ratios for all text elements
- Screen reader announcements for dynamic data updates
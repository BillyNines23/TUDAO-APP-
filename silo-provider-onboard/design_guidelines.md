# TUDAO Provider Onboarding Portal - Design Guidelines

## Design Approach: Professional Enterprise System

This is a high-stakes verification and onboarding platform requiring trust, clarity, and efficiency. The design will follow **Material Design 3** principles adapted for a Web3 marketplace context, emphasizing structured information hierarchy, clear progress indicators, and professional document handling.

## Typography System

**Font Families:**
- Primary: Inter (headings, UI elements, buttons)
- Secondary: IBM Plex Sans (body text, form labels)
- Monospace: JetBrains Mono (wallet addresses, document IDs, technical data)

**Hierarchy:**
- Page Titles: 2.5rem (40px), semi-bold, tracking tight
- Section Headings: 1.75rem (28px), medium weight
- Step Titles: 1.5rem (24px), medium weight
- Subsection Headers: 1.125rem (18px), medium weight
- Body Text: 1rem (16px), regular weight, 1.6 line-height
- Helper Text: 0.875rem (14px), regular weight
- Labels: 0.875rem (14px), medium weight, uppercase with 0.05em tracking
- Legal Text: 0.8125rem (13px), regular weight, 1.5 line-height

## Layout & Spacing System

**Spacing Scale:** Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm.

**Container Strategy:**
- Wizard Steps: max-w-4xl (896px) centered
- Admin Dashboard: max-w-7xl (1280px) with sidebar
- Document Preview Panels: max-w-2xl (672px)
- Form Fields: Full width within container with consistent 24 unit vertical spacing

**Grid System:**
- Single column for wizard steps (better focus and completion rates)
- Two-column layout for business profile fields (desktop only, stack on mobile)
- Three-column grid for document upload cards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Admin queue: Sidebar (320px fixed) + flexible content area

## Component Architecture

### 1. Onboarding Wizard Shell

**Persistent Top Bar:**
- Logo (left, 32px height)
- Progress indicator (center): Step numbers with labels, connected line showing completion, current step highlighted
- Constitution link (right): "TUDAO Constitution" with external link icon
- Height: 20 units, border bottom with subtle shadow

**Footer:**
- Links: "TUDAO Constitution" | "Terms" | "Privacy" separated by vertical dividers
- Height: 16 units, light background treatment
- Sticky to bottom on all steps

**Content Area:**
- Padding: 12 units top/bottom, 8 units horizontal on mobile, 16 units on desktop
- Step transition: Slide animation (300ms ease-in-out)

### 2. Form Components

**Input Fields:**
- Height: 12 units for single-line inputs
- Padding: 3 units horizontal, 3 units vertical
- Border: 1px with 2px focus state
- Labels: Above input with 2 unit spacing, medium weight
- Helper text: Below with 1 unit spacing, muted styling
- Error state: Border highlight with error message below
- Character counter for limited fields (top-right of input)

**Multi-Select Trades/Regions:**
- Chip-based selection with remove icons
- Dropdown with search and checkboxes
- Selected items display as pills above the selector
- Maximum height with scroll for long lists

**Document Upload Cards:**
- Height: 56 units per card
- Drag-drop zone with dashed border (2px)
- File name, size, upload progress bar
- Status icons: Pending (clock), Uploading (spinner), Success (checkmark), Failed (X)
- Preview thumbnail for images/PDFs (left side, 16 units square)
- Action buttons: View, Replace, Remove (right side)
- Validation feedback: Checkmark or warning icon with message below

### 3. MPA E-Signature Modal

**Structure:**
- Full viewport overlay with backdrop blur
- Modal: max-w-3xl, 90vh max-height
- Header: Title + close button (sticky)
- Body: Scrollable agreement text (prose formatting, 1.7 line-height)
- Scroll indicator: "Scroll to bottom to enable signature" (sticky at bottom)
- Footer (appears after scroll): Signature fields + checkboxes + action buttons

**Signature Capture:**
- Signer name (pre-filled, read-only)
- Wallet address display (monospace, truncated with tooltip)
- Timestamp (auto-populated, displayed)
- Required checkboxes with full text (not truncated)
- Primary action: "Sign Agreement" button (disabled until all requirements met)

### 4. Admin Review Queue

**Layout:**
- Left Sidebar (320px): Filters with counts, saved filter presets
- Main Area: Application cards in vertical list
- Right Panel (slide-in, 480px): Application detail view

**Application Cards:**
- Height: Auto, padding 6 units
- Header row: Vendor name (bold) + tier badge + timestamp
- Metrics row: Risk score (visual indicator), trade icons, region count
- Flag chips: Expired insurance, name mismatch, etc. with severity coding
- Action buttons: Review (primary), Quick actions dropdown (secondary)

**Detail Panel:**
- Tabs: Overview | Documents | Legal | History
- Document viewer: Embedded PDF/image with zoom controls
- Parsed data overlay on documents (highlighting matched fields)
- Action bar (sticky bottom): Approve (tier selector) | Deny | Request Revision | Suspend

### 5. Vendor Dashboard (Post-Approval)

**Status Card:**
- Full-width hero section (height 40 units)
- Large status badge (Approved/Probationary/Standard/Preferred)
- Tier benefits list
- Quick stats: Jobs completed, rating, earnings (if applicable)

**Constitution Card:**
- Prominent placement in top 3 cards
- Icon (document/governance symbol)
- Title: "TUDAO Constitution"
- Version number and last updated date
- Call-to-action: "View Current Version" button
- Visual treatment: Slightly elevated with border accent

**Document Status Grid:**
- Cards for each document type (2 columns desktop, 1 mobile)
- Status: Current/Expiring/Expired with visual coding
- Expiry countdown for time-sensitive documents
- Upload new version action

## Visual Elements

### Icons
Use **Heroicons** (outline for default, solid for active states):
- Navigation: ChevronLeft, ChevronRight, Home
- Documents: DocumentText, CloudArrowUp, CheckCircle, XCircle, ExclamationTriangle
- Legal: Scale, ShieldCheck, DocumentDuplicate
- Wallet: CurrencyDollar, Wallet, Link
- Admin: Funnel, MagnifyingGlass, UserGroup, ChartBar

### Status Indicators
**Tier Badges:**
- Rounded full pills with icons
- Height: 8 units, padding 3 horizontal
- Preferred: Star icon
- Standard: Shield icon
- Probationary: Clock icon

**Progress States:**
- Loading: Animated spinner (24px)
- Success: Animated checkmark with pulse
- Error: Shake animation on icon
- Warning: Pulse animation on icon

### Buttons & Actions
**Primary Actions:**
- Height: 12 units
- Padding: 6 units horizontal
- Font weight: Medium
- Border radius: 2 units
- Shadow on hover: subtle lift effect

**Secondary Actions:**
- Same height, outlined style
- Ghost variant for tertiary actions

**Button Groups:**
- Spacing: 3 units between buttons
- Align right for form submissions
- Back button (secondary) on left, Next/Submit (primary) on right

## Data Visualization

**Risk Score Meter:**
- Horizontal bar (full width)
- Gradient fill based on score ranges
- Threshold markers at 20 and 60
- Numerical score display at end

**Document Verification Checklist:**
- Vertical list with checkmarks/X marks
- Expandable rows for details
- Success/warning/error color coding

## Responsive Behavior

**Breakpoints:**
- Mobile: < 768px (single column, stacked cards, bottom sheet for modals)
- Tablet: 768px - 1024px (2 column where applicable, slide-in panels)
- Desktop: > 1024px (full multi-column layouts, side panels)

**Mobile Optimizations:**
- Progress indicator: Dots instead of full labels
- Document cards: Full width, vertical orientation
- Admin queue: Bottom sheet instead of side panel
- Form fields: Full width, increased touch targets (12 units minimum)

## Images

**No hero images required** - this is a utility-focused application where clarity and efficiency take precedence over marketing visuals.

**Document Thumbnails:** System-generated previews of uploaded PDFs and images within upload cards and admin review panels.

**Icons Only:** Use icon library consistently throughout for visual markers and status indicators rather than decorative imagery.
# TUDAO Customer Experience - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design influenced
**Justification:** This is a utility-focused, step-by-step service request application where efficiency, clarity, and trust are paramount. The wizard-style flow with multiple form inputs and data displays benefits from a consistent, proven design system approach.

**Key Design Principles:**
1. Progressive Disclosure - Reveal information step-by-step to reduce cognitive load
2. Trust & Transparency - Clear communication of process, costs, and security
3. Conversational Clarity - Guide users with friendly, actionable language
4. Mobile-First Responsiveness - Optimized for on-the-go service requests

---

## Core Design Elements

### A. Typography

**Font Family:** Inter (via Google Fonts CDN)
- Primary: Inter for all UI elements
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale:**
- Hero/Welcome: text-4xl (36px), font-bold, tracking-tight
- Step Headers: text-2xl (24px), font-semibold
- Section Titles: text-xl (20px), font-semibold
- Body Text: text-base (16px), font-normal
- Helper Text: text-sm (14px), font-normal
- Captions/Labels: text-xs (12px), font-medium, uppercase tracking-wide
- Buttons: text-base (16px), font-semibold

**Line Height:**
- Headlines: leading-tight (1.25)
- Body: leading-relaxed (1.625)
- Buttons/UI: leading-none (1)

---

### B. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Micro spacing (within components): p-2, gap-2, space-y-2
- Standard spacing (between elements): p-4, gap-4, space-y-4, m-4
- Section spacing (between major blocks): p-8, py-12, space-y-8
- Large spacing (page sections): py-16, py-20

**Container Strategy:**
- Maximum width: max-w-2xl (672px) for wizard steps - keeps focus narrow
- Maximum width: max-w-4xl (896px) for vendor listing screens
- Consistent horizontal padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)

**Grid System:**
- Single column for wizard steps (focused flow)
- 2-3 column grid for vendor cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Consistent gap: gap-6 between cards

---

### C. Component Library

#### Navigation & Progress
**Progress Stepper**
- Horizontal step indicator at top of wizard
- Display "Step X of 8" with visual progress bar
- Progress bar: h-2, rounded-full, with fill animation
- Step numbers in circles: w-8 h-8, rounded-full, center-aligned text

**Navigation Buttons**
- Primary CTA: Full-width on mobile, inline on desktop, h-12, rounded-lg, font-semibold
- Secondary actions: outlined variant, same dimensions
- Back buttons: text-only with left arrow icon, py-3

#### Forms & Input
**Text Input Fields**
- Height: h-14
- Padding: px-4
- Border radius: rounded-lg
- Border width: border-2
- Label above: text-sm, font-medium, mb-2
- Placeholder text: text-base, font-normal
- Focus state: border emphasis (no shadow)

**Input with Icon**
- Position icon inside input: absolute positioning
- Input padding adjusted: pl-12 or pr-12 for icon space
- Icon size: w-6 h-6

**Multiple Choice Buttons**
- Grid layout for options: grid-cols-2 gap-4 (mobile), grid-cols-3 gap-4 (desktop)
- Each option: p-4, rounded-lg, border-2, text-center, cursor-pointer
- Selected state: border emphasis, font-semibold
- Hover state: subtle border change

**File Upload**
- Drag-and-drop zone: border-2 border-dashed, p-8, rounded-lg, text-center
- Icon: upload icon w-12 h-12
- Text: "Upload Photos" with helper text below

#### Cards & Data Display
**Vendor Cards**
- Card container: rounded-xl, border, p-6, space-y-4
- Header section: flex items-center justify-between
- Provider name: text-lg, font-semibold
- Rating display: flex items-center, gap-1, star icon + number
- Badge: inline-flex, rounded-full, px-3 py-1, text-xs, font-semibold
- Past jobs: text-sm, line-clamp-2
- Price range: text-xl, font-bold
- CTA button: full-width, h-11, rounded-lg

**Scope Preview Card**
- Large card: rounded-xl, border-2, p-8
- Scope text: text-lg, leading-relaxed, space-y-4
- Action buttons row: flex gap-4, mt-6
- Edit/Accept buttons: equal width, h-12

**Proposal Details Card**
- Structured layout: space-y-6
- Section dividers: border-t, pt-6
- Label-value pairs: grid grid-cols-2, text-sm label + text-base value
- Cost highlight: text-3xl, font-bold
- Escrow disclaimer: rounded-lg, p-4, text-sm, flex gap-3 with lock icon

#### Content Sections
**Welcome/Landing Screen**
- Logo placement: mb-8, center-aligned, h-16
- Title: text-4xl, font-bold, mb-4
- Subtitle: text-lg, max-w-md, mb-12
- CTA button: max-w-xs, mx-auto

**Step Screens**
- Step header: mb-8, includes step number label
- Question/prompt: text-2xl, font-semibold, mb-6
- Content area: space-y-6
- Navigation: mt-12, flex gap-4

**Confirmation/Success**
- Icon: checkmark in circle, w-20 h-20, mb-6
- Message: text-2xl, font-semibold, mb-4
- Details: text-base, mb-8
- Action button: max-w-xs

#### Icons & Imagery
**Icon Library:** Heroicons (via CDN)
- Consistent size: w-5 h-5 for inline icons, w-6 h-6 for standalone
- Icons used:
  - ChatBubbleLeftIcon (chat/conversational)
  - CameraIcon (photo upload)
  - CheckCircleIcon (completion/success)
  - StarIcon (ratings)
  - LockClosedIcon (escrow/security)
  - ChevronRightIcon (navigation)
  - ArrowLeftIcon (back navigation)

**TUDAO Badge/Logo**
- Placement: Top-left on all screens OR centered on welcome
- Size: h-8 to h-12 depending on context
- Badge next to vendor names: w-5 h-5, inline

**Images:**
- No large hero images required for this utility flow
- Small decorative icons/illustrations for step headers (optional)
- Vendor profile images: rounded-full, w-16 h-16
- Photo upload previews: rounded-lg, aspect-square, grid display

---

### D. Responsive Behavior

**Breakpoints:**
- Mobile (default): Single column, full-width inputs, stacked buttons
- Tablet (md: 768px): Wider containers, 2-column vendor grid, inline button groups
- Desktop (lg: 1024px): Maximum widths applied, 3-column vendor grid

**Mobile Optimizations:**
- Fixed bottom navigation bar for primary CTA on long forms
- Larger tap targets: minimum h-12 for all interactive elements
- Simplified vendor cards: stacked information, full-width CTA
- Collapsible sections for proposal details

**Progressive Enhancement:**
- Voice input (microphone icon) available on supported devices
- Drag-and-drop photo upload on desktop, tap-to-upload on mobile
- Smooth scroll to next step on progression

---

### E. Accessibility & Usability

**Form Accessibility:**
- Labels always visible, not placeholder-only
- Error states: border emphasis + error text below field (text-sm)
- Required field indicators: asterisk in label
- Focus indicators: visible outline or border emphasis

**Navigation Clarity:**
- Always show current step number
- Disabled state for "Next" until required fields completed
- Confirmation modals for destructive actions ("Start Over")
- Loading states for AI generation: spinner + "Generating scope..." text

**Trust Elements:**
- Escrow explanation always visible near payment info
- Verification badges clearly labeled
- Rating display includes number of reviews: "(127 reviews)"
- Provider credentials/certifications shown in vendor cards

---

## Special Interactions

**AI Scope Generation:**
- Loading state: centered spinner (w-8 h-8) + text
- Transition: fade-in animation for generated content
- Editable scope: inline editing with "Save Changes" button

**Vendor Selection:**
- Radio button selection OR card click to expand details
- Selected card: border emphasis + checkmark icon in corner
- "View Proposal" opens modal OR navigates to new screen

**Smart Scope Wizard:**
- Auto-advance after selection (with 500ms delay for feedback)
- "Skip" option for optional questions (photos, timing flexibility)
- Summary view before final generation: "Review your answers"

This design system creates a professional, trustworthy service request experience optimized for conversion and user confidence.
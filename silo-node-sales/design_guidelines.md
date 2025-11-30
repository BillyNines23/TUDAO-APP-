# TUDAO Node Pass - Design Guidelines

## Design Approach

**Hybrid Approach**: Web3 Transaction Flow + Enterprise Trust

Drawing inspiration from:
- **Stripe Checkout**: Clean, focused payment flows with minimal distraction
- **Coinbase**: Professional crypto interface with clear status indicators
- **Uniswap**: Modern Web3 aesthetics with excellent wallet integration UX
- **Linear**: Sharp typography and precise spacing for data-heavy views

**Core Principle**: Establish trust through clarity, precision, and professional presentation while maintaining modern Web3 visual language.

---

## Typography System

**Font Families** (via Google Fonts CDN):
- **Primary**: Inter (400, 500, 600, 700) - UI elements, body text, data
- **Display**: Space Grotesk (600, 700) - Headers, tier names, prices

**Type Scale**:
- **Hero/Tier Price**: text-6xl (60px), font-bold, tracking-tight
- **Page Headers**: text-4xl (36px), font-semibold
- **Section Headers**: text-2xl (24px), font-semibold
- **Tier Names**: text-xl (20px), font-semibold, uppercase tracking-wide
- **Body/Labels**: text-base (16px), font-medium
- **Small/Meta**: text-sm (14px), font-normal
- **Micro/Compliance**: text-xs (12px), leading-relaxed

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20** for consistent rhythm.

**Container Strategy**:
- **Checkout Flow**: max-w-2xl (672px) - focused, distraction-free
- **Dashboard**: max-w-6xl (1152px) - spacious data display
- **Success Page**: max-w-3xl (768px) - celebration + next steps

**Vertical Rhythm**:
- Section padding: py-12 (mobile), py-20 (desktop)
- Card padding: p-6 (mobile), p-8 (desktop)
- Component spacing: space-y-6 (standard), space-y-8 (sections)

---

## Page-Specific Layouts

### /checkout Page

**Structure** (single column, centered):

1. **Header Bar** (sticky top)
   - TUDAO logo (left)
   - Test mode banner (full-width alert if Sepolia)
   - Wallet connection status (right)

2. **Tier Display Card** (elevated, prominent)
   - Tier badge icon (top)
   - Tier name (Space Grotesk, large)
   - Price display (text-6xl, bold)
   - Tier benefits (bulleted list, text-sm)
   - Founder lock notice (if applicable, warning-style callout with icon)

3. **Payment Modal Section**
   - Section header: "Complete Purchase"
   - Three payment buttons (stacked on mobile, row on tablet+):
     * **Pay with Card** - Primary style, gradient or solid
     * **Pay with Crypto** - Secondary with crypto icon
     * **Bank/Wire** - Outlined with bank icon
   - Each button: h-14, rounded-xl, font-semibold, w-full on mobile
   - Hints below buttons (text-sm, muted, icon prefixed)
     * Founder: "Bank/Wire recommended for $10k amounts"

4. **Compliance Footer**
   - Full-width, bordered container
   - Small text (text-xs), icon prefixed
   - Multi-line compliance copy
   - Link to terms (underlined)

**Mobile Considerations**:
- Fixed header with compact wallet display
- Card stacks to full-width
- Sticky CTA if needed

---

### /success Page

**Structure** (celebration → action):

1. **Success Hero** (py-16)
   - Large success icon (checkmark in circle, 80px)
   - "License Activated!" headline (text-4xl)
   - Subtext: "Your Node Pass is ready"

2. **License Details Card** (elevated, rounded-2xl)
   - Grid layout (2 columns on desktop):
     * License ID (monospace font)
     * Tier Badge (visual component)
     * Wallet Address (truncated, copy button)
     * Purchase Date
   - Download badge button (icon + text)

3. **Next Steps Section** (space-y-4)
   - Primary CTA: "Open Dashboard" (large button)
   - Secondary action: "Download Setup PDF" (outlined)
   - Email receipt note (if disabled)

4. **Compliance Footer** (same as checkout)

---

### /dashboard Page

**Structure** (data-rich, multi-section):

1. **Dashboard Header**
   - "My Node License" headline
   - Wallet connection indicator (pill-style, right aligned)

2. **License Status Card** (hero card, gradient border if active)
   - Large tier badge (visual asset, 120px)
   - Tier name + License ID (prominent)
   - Status pill: "Active" (success) / "Pending Wire" (warning)
   - Purchase metadata (date, wallet, payment method)
   - 2-column grid on desktop, stack on mobile

3. **Quick Actions Section** (grid-cols-1 md:grid-cols-3, gap-4)
   - **Download Badge** card (icon, title, description, button)
   - **Setup PDF** card
   - **Contact Support** card
   - Each card: p-6, rounded-xl, hover elevation

4. **Operator Setup Section** (conditional, bordered container)
   - "Select Your Setup Path" header
   - Three radio card options (grid-cols-1 lg:grid-cols-3):
     * **Self-Operated** (icon, title, description)
     * **Managed Operator** 
     * **Cloud Waitlist**
   - "Save Selection" button below

5. **Pending Wire Instructions** (if applicable)
   - Alert-style card with warning icon
   - Wire transfer details
   - "Your license will activate after payment confirmation"

---

## Component Library

### Buttons

**Primary**: 
- px-6 py-3, rounded-lg, font-semibold, text-base
- Shadow on default, shadow-lg on hover
- Disabled state: reduced opacity, cursor-not-allowed

**Secondary/Outlined**:
- Same size, 2px border, transparent background
- Hover: subtle background fill

**Icon Buttons**:
- Square, p-2, rounded-md
- For copy actions, close modals

### Cards

**Standard Card**:
- p-6 (mobile), p-8 (desktop)
- rounded-xl, border
- Hover: subtle elevation increase (shadow-md → shadow-lg)

**Stat/Info Cards**:
- Compact, p-4, rounded-lg
- Label (text-sm, uppercase, tracking-wide)
- Value (text-2xl, font-bold)

### Badges/Pills

**Status Pills**:
- inline-flex items-center, px-3 py-1, rounded-full
- text-xs font-medium, uppercase tracking-wide
- Active: success styling
- Pending: warning styling
- Test Mode: info styling with pulsing dot

**Tier Badges**:
- Larger pills for tier display
- px-4 py-2, rounded-lg
- Include tier icon if available

### Form Elements

**Input Fields**:
- h-12, px-4, rounded-lg, border-2
- Focus: ring style (ring-2 ring-offset-2)
- Label: text-sm font-medium, mb-2

**Radio Cards** (for operator selection):
- Full card acts as radio
- border-2, p-4, rounded-lg
- Selected: thicker border, subtle background
- Icon at top, title + description below
- Radio indicator in top-right

### Modals/Dialogs

**Payment Modal**:
- Fixed overlay (backdrop blur)
- Center card: max-w-lg, p-8, rounded-2xl
- Header with close button
- Content area with clear sections
- Actions at bottom (full-width buttons)

**Toast Notifications**:
- Fixed bottom-right (bottom-4 right-4)
- min-w-80, max-w-md, p-4, rounded-lg
- Icon left, message center, close right
- Types: success, error, warning, info
- Auto-dismiss after 5s (closeable)

### Wallet Connection

**Connected State**:
- Display: truncated address + ENS if available
- Avatar/Identicon (32px circle)
- Network indicator (Base logo, 16px)
- Dropdown for disconnect/switch

**Connect Button** (not connected):
- "Connect Wallet" with wallet icon
- Opens modal with provider options (MetaMask, WalletConnect, Coinbase Wallet)

---

## Interaction Patterns

### Network Switching
- Detect wrong network on mount
- Prominent banner: "Wrong Network - Please switch to Base"
- Auto-trigger switch request on button click
- Success toast on correct switch

### Payment Flow States

1. **Initial**: All payment options visible
2. **Wallet Connect**: Modal with providers
3. **Crypto Payment**: Network check → Balance check → Approval (if needed) → Mint transaction
4. **Card Payment**: On-ramp widget (iframe or popup)
5. **Wire/Bank**: Form collection → Success with instructions

**Loading States**: Skeleton screens for dashboard data, spinner for transactions

### Test Mode Banner
- Full-width alert at page top
- Distinct styling (dashed border, icon)
- "TEST MODE - Base Sepolia • Card payments disabled • No real funds"
- Sticky on scroll

---

## Responsive Breakpoints

- **Mobile**: < 768px - Single column, stacked buttons, compact cards
- **Tablet**: 768px - 1024px - 2-column grids, horizontal button groups
- **Desktop**: > 1024px - Full layout, max-w containers, multi-column grids

**Mobile-First Specifics**:
- Touch-friendly: min-h-12 for all interactive elements
- Increased spacing between tap targets (min 8px gap)
- Bottom-sheet style modals on mobile
- Fixed CTAs at bottom for checkout flow

---

## Accessibility

- All interactive elements: focus-visible ring styles
- Form labels always visible (no placeholder-only)
- Sufficient contrast ratios (WCAG AA minimum)
- Wallet addresses: copyable with keyboard
- Toast notifications: aria-live announcements
- Icon buttons: aria-labels
- Status indicators: text + visual (not color-alone)

---

## Images

**No hero images required** - this is a utility flow, not marketing.

**Badge Assets** (tier NFT badges):
- Displayed at 120px x 120px in dashboard
- 80px x 80px in checkout tier card
- Downloadable as full resolution PNG
- Positioned: centered in tier display card

**Icons** (via Heroicons CDN):
- Wallet, credit card, bank, check, alert, copy, download, external link
- 20px (text icons), 24px (buttons), 48px+ (feature icons)

---

## Motion & Animation

**Minimal, purposeful only**:
- Page transitions: none (instant navigation)
- Card hovers: shadow transition (200ms ease)
- Button states: scale(0.98) on active
- Toast enter/exit: slide + fade (300ms)
- Success checkmark: scale + opacity animation (500ms, one-time)
- Loading spinners: rotate animation
- **No scroll animations, parallax, or decorative motion**

---

This design creates a professional, trustworthy Web3 checkout experience with clarity and precision at every step, ensuring users confidently complete high-value transactions while maintaining modern visual standards.
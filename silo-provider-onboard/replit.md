# TUDAO Provider Onboarding Portal

## Overview

The TUDAO Provider Onboarding Portal is a comprehensive Web3 marketplace verification and onboarding platform for service providers. The application guides vendors through a multi-step wizard to capture business information, verify credentials, upload required documents, and sign legal agreements. It includes an admin review queue for application processing and a provider dashboard for ongoing management.

**Key Features:**
- Multi-step onboarding wizard (7 steps: Account, Business, Documents, Capabilities, Payout, Legal, Review)
- Automated document verification with AI-assisted checks
- Master Provider Agreement (MPA) e-signature workflow
- Admin review queue with application management
- Risk scoring and tier assignment (Preferred, Standard, Probationary)
- Web3 wallet integration (Base chain) with embedded wallet option
- Provider dashboard with marketplace activity tracking

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Vite as the build tool and dev server

**UI Framework:**
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Material Design 3 principles adapted for Web3 marketplace context
- Typography: Inter (headings/UI), IBM Plex Sans (body), JetBrains Mono (technical data)

**Component Structure:**
- Wizard-based flow with persistent header/footer navigation
- Step components for each onboarding phase
- Reusable UI components (cards, badges, modals, forms)
- Design guidelines emphasize professional enterprise aesthetic with trust and clarity

**State Management:**
- Wizard state managed in parent component (OnboardingWizard)
- Form data accumulated across steps before final submission
- React Query for API data fetching and caching

### Backend Architecture

**Framework:**
- Express.js server with TypeScript
- ESM module system
- Custom middleware for logging and request handling

**Database:**
- PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database operations
- Schema-first approach with migrations

**API Design:**
- RESTful API endpoints under `/api` prefix
- Storage abstraction layer (IStorage interface) for CRUD operations
- Currently implements in-memory storage with planned database persistence

**Data Models:**
- `users`: Authentication and account management
- `vendors`: Business profiles with comprehensive metadata (legal info, trades, regions, capacity)
- `vendorDocuments`: Document uploads with verification status tracking
- `jobs`: Available job opportunities in the marketplace
- `vendorJobs`: Provider-specific job assignments and tracking
- `jobMilestones`: Milestone tracking for active jobs
- `vendorEarnings`: Earnings and payment tracking
- `vendorTrustScore`: Trust scores, ratings, and lifetime token tracking

### Authentication & Authorization

**Dual Authentication:**
- Traditional email/password authentication
- Web3 wallet connection (Base chain)
- Option for embedded wallet creation or external wallet connection

**Session Management:**
- Express session handling (infrastructure in place via connect-pg-simple)
- Role-based access control for admin vs provider views

### Document Management

**Upload & Storage:**
- Drag-and-drop file upload interface
- Support for PDF and image formats
- Document types: EIN/IRS letter, trade licenses, insurance COI, owner ID, I-9 employment verification
- Status tracking: idle, uploading, success, error
- Client-side progress indicators

**Verification:**
- AI-assisted document validation (planned)
- Automated checks for EIN, licenses, insurance coverage minimums
- Manual admin review workflow

### Business Logic

**Risk Scoring:**
- Automated risk assessment (0-100 scale)
- Visual risk meter component with color-coded severity levels
- Low (0-20), Medium (21-60), High (61-100) classifications

**Tier Assignment:**
- Three-tier provider classification:
  - Preferred: Top-tier verified providers
  - Standard: Fully verified providers
  - Probationary: Conditional approval with restrictions
- Tier-based marketplace visibility and benefits

**Legal Compliance:**
- Master Provider Agreement (MPA) modal with scroll-to-end validation
- I-9 Employment Compliance certification with discrete acknowledgment points
- TUDAO Constitution reference (persistent header link)
- Checkbox acknowledgments for terms and policies
- E-signature capture with timestamp and wallet verification

### Admin Features

**Review Queue:**
- Tabbed interface for application status (Submitted, Under Review, Needs Revision, Completed)
- Search and filter capabilities
- Application preview with risk indicators and verification flags
- Bulk actions for efficient processing
- Audit trail for administrative actions

**KPIs & Reporting:**
- Application metrics and completion rates
- Risk score distributions
- Document verification status tracking
- Export capabilities for architect dashboard integration

### Provider Dashboard

**Design Theme:**
- Dark slate/blue color scheme for professional appearance
- Three-column responsive grid layout
- Card-based interface with subtle elevation on hover

**New Opportunities (Left Column):**
- Real-time job listings with time posted indicators
- Budget range display for each opportunity
- "Submit Bid" action buttons
- Categorized by service type

**Active Jobs (Center Column):**
- Current job assignments with client information
- Status badges (Ongoing, Completed, etc.)
- Escrow funding status indicators
- Milestone tracking and completion actions
- "View Scope" links for job details
- "Mark Milestone Complete" buttons for progress updates

**Trust & Earnings (Right Column):**
- Trust score with star rating (0-5 scale)
- DAO rating display
- Escrow earnings total (released funds)
- Pending earnings (awaiting milestone completion)
- Lifetime TUDAO tokens earned
- "Ask the TU Agent" support button

**Header:**
- TUDAO logo and branding
- Connected wallet address display (truncated format)
- User profile access button

## External Dependencies

### Third-Party Services

**Blockchain:**
- Base chain for Web3 wallet integration
- Wallet connection libraries (implementation details TBD)
- Potential for smart contract integration for escrow/payments

**Database:**
- Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- WebSocket support for real-time connections

**UI Libraries:**
- Radix UI primitives for accessible components
- Lucide React for icons
- Embla Carousel for image galleries
- CMDK for command palette functionality
- React Hook Form with Zod resolvers for form validation
- Date-fns for date manipulation

**Development Tools:**
- Drizzle Kit for database migrations
- Replit-specific plugins (dev banner, cartographer, runtime error overlay)
- ESBuild for server bundling
- PostCSS with Tailwind and Autoprefixer

### API Integrations (Planned)

**Verification Services:**
- EIN verification against IRS databases
- License validation with state registries
- Insurance coverage verification
- Background check services (optional)

**Payment Processing:**
- USDC cryptocurrency payments (on-chain)
- ACH bank transfers (traditional)
- Dual payout method support

**Communication:**
- Email notifications for application status updates
- Transactional emails for legal document signatures
- Admin notifications for new submissions

### Design Assets

**Fonts (Google Fonts):**
- Inter (weights: 400, 500, 600, 700)
- IBM Plex Sans (weights: 400, 500, 600)
- JetBrains Mono (weights: 400, 500)

**Service Categories:**
- Comprehensive trades taxonomy (`shared/trades-categories.ts`)
- Hierarchical categorization similar to Thumbtack
- Multi-select with search/filter functionality
- Categories: Home Improvement, Plumbing/HVAC/Electrical, and more

### Configuration

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Development/production mode
- Additional variables for API keys and service credentials (TBD)

**Build Configuration:**
- Vite config with path aliases (@, @shared, @assets)
- TypeScript strict mode enabled
- ESNext module resolution with bundler strategy
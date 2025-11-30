# TUDAO Dashboard

## Overview

TUDAO is a decentralized platform connecting service providers with consumers through a role-based dashboard system. The platform supports four primary user roles: Providers (service workers), Consumers (service requesters), Nodeholders (node operators earning rewards), and Architects (platform administrators). The application uses wallet-based authentication via Privy with embedded Base wallet support, enabling Web3 functionality with a Web2-like user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query for server state management
- Tailwind CSS with shadcn/ui component library (New York variant)
- CSS custom properties for theming with steel/blue color scheme

**Design Decisions:**
- **Component Library Choice**: Uses shadcn/ui components for consistent, accessible UI with Radix UI primitives underneath. This provides flexibility to customize components while maintaining accessibility standards.
- **Routing Strategy**: Client-side routing with Wouter for minimal bundle size. Routes are role-specific (e.g., `/dashboard/provider`, `/dashboard/consumer`).
- **State Management**: React Context for global user/role state (TudaoContext, PrivyContext), TanStack Query for server data caching and synchronization.
- **Styling Approach**: Utility-first CSS with Tailwind, custom CSS variables for theming, responsive design with mobile-first breakpoints.

### Authentication & Authorization

**Privy Integration:**
- Wallet-based authentication with embedded wallet creation
- Supports both traditional login flow and wallet connection
- Mock implementation in development (client/src/lib/auth.tsx)
- Auto-creates embedded Base wallet on first login

**Role-Based Access:**
- Four user roles: `provider`, `consumer`, `nodeholder`, `architect`
- Architect role requires wallet address whitelist (environment variable `ARCHITECT_WHITELIST`)
- Role determines sidebar navigation, available features, and dashboard views
- New users without roles are redirected to `/onboarding/path` for role selection

**Authorization Flow:**
1. User authenticates via Privy (wallet or email)
2. System checks if user exists in database via wallet address
3. If architect wallet address detected (whitelist check), auto-assign architect role
4. If existing user with role, redirect to role-specific dashboard
5. If new user without role, redirect to onboarding for role selection

### Backend Architecture

**Technology Stack:**
- Node.js with Express
- TypeScript with ES Modules
- Drizzle ORM for database operations
- Neon Serverless PostgreSQL with WebSocket support
- tsx for development server with hot reload

**API Design:**
- RESTful endpoints under `/api` namespace
- User management: POST `/api/users`, GET `/api/users/wallet/:address`
- Architect verification: GET `/api/auth/check-architect/:address`
- Project management endpoints (consumer/provider workflows)
- Message/communication endpoints for project collaboration

**Database Layer:**
- Drizzle ORM with Neon Serverless PostgreSQL adapter
- Connection pooling via `@neondatabase/serverless`
- Schema-first approach with Zod validation
- Migration management via `drizzle-kit push`

### Database Schema

**Core Tables:**

1. **users** - User profiles and authentication
   - `id` (UUID primary key)
   - `walletAddress` (unique, not null)
   - `email` (optional)
   - `role` (default: 'consumer')
   - `createdAt` (timestamp)

2. **projects** - Service requests and assignments
   - `id` (UUID primary key)
   - `title`, `description`
   - `consumerId` (foreign key to users)
   - `providerId` (foreign key to users, nullable)
   - `status` (default: 'pending')
   - `escrowStatus` (default: 'unfunded')
   - `amount` (text/string for crypto amounts)
   - `startedAt`, `completedAt`, `createdAt` (timestamps)

3. **messages** - Project communication
   - `id` (UUID primary key)
   - `projectId` (foreign key to projects)
   - `senderId` (foreign key to users)
   - `content` (text)
   - `createdAt` (timestamp)

**Design Rationale:**
- UUIDs for primary keys provide distributed system compatibility
- Wallet address as unique identifier supports Web3 authentication
- Flexible role system allows future role additions
- Escrow status tracked separately from project status for payment workflows
- Amount stored as text to handle large numbers and decimal precision for cryptocurrency

### Application Flow

**Onboarding Flow:**
1. Public homepage with informational cards (hire provider, become provider, buy nodes)
2. Login/signup via Privy authentication
3. New users redirected to `/onboarding/path` for role selection
4. Role selection updates user record and redirects to role-specific dashboard

**Role-Specific Dashboards:**
- **Provider**: Job management, earnings tracking, escrow status, ratings
- **Consumer**: Service requests, project tracking, payments, messaging, history
- **Nodeholder**: Node management, rewards vault, governance participation
- **Architect**: Emissions management, platform analytics, data validation, protocol controls

**Navigation Structure:**
- Collapsible sidebar with role-based menu items
- Common navigation: Home, Wallet, Transactions, Scope Agent, Buy Nodes, Settings
- Role-specific sections dynamically loaded based on user role
- Breadcrumb navigation in header for context awareness

## External Dependencies

### Authentication & Wallet
- **@privy-io/react-auth**: Wallet authentication with embedded wallet creation on Base network

### Database & ORM
- **@neondatabase/serverless**: PostgreSQL database connection with WebSocket support for serverless environments
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **drizzle-zod**: Zod schema generation from Drizzle tables for runtime validation

### UI Components & Styling
- **@radix-ui/react-***: Accessible component primitives (dialogs, dropdowns, menus, etc.)
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library configuration
- **class-variance-authority**: Type-safe variant styling
- **lucide-react**: Icon library

### State Management & Data Fetching
- **@tanstack/react-query**: Server state management, caching, and synchronization
- **wouter**: Lightweight client-side routing

### Form Handling & Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation and schema definition

### Development Tools
- **vite**: Build tool and development server
- **@replit/vite-plugin-***: Replit-specific development enhancements (runtime error overlay, cartographer, dev banner)
- **typescript**: Type safety and developer experience
- **esbuild**: Server bundling for production builds

### Build Configuration
- PostgreSQL database required (Neon Serverless recommended)
- Environment variables: `DATABASE_URL` (required), `ARCHITECT_WHITELIST` (optional, comma-separated wallet addresses)
- Build outputs: `dist/public` (client), `dist/index.js` (server)
- Development runs client (port 5000) and server concurrently
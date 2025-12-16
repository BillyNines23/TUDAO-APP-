# TUDAO Customer Experience

## Overview

TUDAO (TradeUnion DAO) is an AI-powered service marketplace connecting customers with verified skilled workers. It features an **AI Scope Engine** that analyzes images, asks dynamic clarifying questions, and generates detailed work scopes for various services. The application offers a conversational, wizard-style interface for users to describe their needs and receive professional scopes of work. The project aims to build a self-improving AI that learns from completed jobs, continuously enhancing service estimation and delivery accuracy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React, TypeScript, Vite, Wouter for routing, and TanStack Query. Shadcn/ui (Radix UI + Tailwind CSS) provides a Material Design-influenced component library. It prioritizes mobile-first responsiveness, progressive disclosure, and clear process visualization, featuring a multi-step wizard, AI-powered dynamic questioning, scope preview, and vendor matching.

### Backend Architecture

The backend is built with Node.js and Express.js in TypeScript, exposing a RESTful JSON API. It uses session-based authentication with role-based access control. Core endpoints manage scope sessions, photo uploads, dynamic questions, answer submission, scope generation, and administrative training data. Multer handles file uploads, converting images to base64 for AI vision analysis.

### AI Scope Engine (Learning System)

The AI Scope Engine orchestrates backend AI processes using Replit AI Integrations (OpenAI-compatible API), employing GPT-4o Vision for photo analysis and GPT-4o for dynamic question generation and detailed scope synthesis. It features a three-channel learning approach: Automatic Learning from completed jobs, Administrative Training via an `/admin` dashboard, and a Vendor Question Feedback Loop. It utilizes Retrieval-Augmented Generation (RAG) by querying a `completedJobs` database for historical data to improve prompt accuracy. The system is service-agnostic, differentiates between residential and commercial properties, and integrates industry best practices for scope generation.

### Data Storage

PostgreSQL is the primary data store, managed with Drizzle ORM. Key data models include `Users`, `ScopeSessions`, `UploadedAssets`, `DynamicQuestions`, `CompletedJobs`, and `ProductionStandards`. The `completedJobs` table serves as the RAG knowledge base.

### UI/UX Decisions

The UI/UX emphasizes a clear, conversational, wizard-style interface with a progressive disclosure pattern. It is mobile-first, responsive, and designed for trust and transparency, using a maximum container width of 672px for wizard steps.

### Technical Implementations

The system includes a universal material calculation display, providing transparent line-item breakdowns (quantity × unit price = total) for all services with production standards. It supports all-inclusive pricing and flexible vendor recommendations based on job complexity. A comprehensive production ratio-based estimation system, powered by data in the `productionStandards` table, guides AI question generation and labor rate calculations.

A **Deck Calculation Engine** provides deterministic material calculations for deck building projects, supporting various dimension formats and generating line-item cost breakdowns using RAG training data.

**Narrative Scope Generation** uses AI (GPT-4o) to produce detailed, structured scope documents to prevent disputes, including sections for Existing Conditions, Project Description, and Scope of Work. These are stored in the `completedJobs` table.

The system incorporates a **Hybrid AI Assistant** that enriches user answers with contextual advice and structured scope fields in real-time within the existing wizard flow, using GPT-4o. This provides adaptive guidance and continuously enriches the scope behind the scenes without disrupting the user experience. AI advice appears in dedicated blue "AI Insight" cards with Lightbulb icons after each wizard answer.

**TUDAO Proposal Formatter** transforms raw JSON scope data into professional, client-facing proposal documents using GPT-4o with a comprehensive TUDAO template. The formatter produces branded proposals with clear sections (Project Overview, Services, Materials, Timeline, Costs, Notes, Acceptance), bullet points, cost breakdown tables, and professional wording. Formatted proposals are stored in `completedJobs.formattedProposal` and returned to users via dedicated proposal cards. The system includes graceful fallback formatting if AI fails, handles both camelCase and snake_case field naming conventions, and maintains idempotency by retrieving cached proposals from the database on retry/refresh.

Question sequencing and normalization have been refined to prevent duplicate questions and ensure consistent intent classification across the system. The AI integration includes idempotency guards to prevent duplicate AI calls, enhanced JSON parsing, and improved dimension extraction.

**Duplicate Question Prevention** (November 2025): Enhanced AI question generation with explicit semantic duplicate detection instructions. GPT-4o is prompted to check previously asked questions for semantic duplicates before generating new questions, preventing similar questions phrased differently (e.g., "unusual smells/sounds" vs "unusual noises/odors"). Combined with Jaccard similarity-based detection (>50% threshold) as a secondary safeguard, with tracking of fallback questions to prevent repeat usage.

**HVAC Comprehensive Questions** (November 2025): Seeded questions for HVAC subcategories (Heating Repair, Air conditioner repair, HVAC maintenance) include:
- **Operational Status**: "Heating Repair" includes proper status options: "Completely non-operational", "Runs but no heat (blower works, no ignition)", "Producing low heat", "Intermittent operation", and "Other issue".
- **Location Questions**: "Where is your heating system/AC system/HVAC system located?" with options: Basement, Attic, Closet/utility room, Garage, Outside, Multiple locations, Other.
- **Accessibility Questions**: "Is the system easily accessible for a technician/maintenance?" with options: Easy access (clear path, no obstructions), Somewhat difficult (tight space or minor obstacles), Very difficult (cramped, requires moving items), Not sure.

These questions help technicians better prepare for the job and provide more accurate estimates based on accessibility challenges.

**Three-Tier Pricing Model** (November 2025): A comprehensive pricing system differentiates between three distinct work types for accurate, competitive quotes:
1. **One-Time Service Calls (Diagnostic)**: Plumbing repairs (faucet repair, leak detection, drain cleaning, toilet repair), HVAC repairs (AC repair, heating repair), and electrical repairs (outlet repair, switch replacement, light fixture installation) are priced as diagnostic service calls at $150 flat-rate (covers diagnostic and first hour of labor), with parts/materials charged separately if needed. Customer-facing messaging: "Service call: $150.00 (covers diagnostic and first hour of labor, parts additional if needed)" or "Service call: $150.00 (covers diagnostic and first hour of labor) + $35.00 parts = $185.00 total" when materials are known.
2. **Recurring Service Work**: Lawn mowing, cleaning, snow removal - priced per visit with seasonal contracts ($1,500-3,000 total).
3. **Installation Work**: Deck building, renovations, major installations - priced hourly × hours + materials (e.g., $85/hr × 40 hrs + $8,000 materials).

**Diagnostic Service Call Messaging** (November 2025): Updated scope summary generation to clarify that one-time service calls are diagnostic service calls. Instead of showing just "Estimated total: $185.00", the system now displays transparent breakdowns: "$150.00 service call (diagnostic + first hour) + $35.00 parts = $185.00 total". When no materials are needed or known, displays: "$150.00 service call (diagnostic + first hour, parts additional if needed)". This sets proper customer expectations about what's included in the service call fee.

**Pricing Guardrails**: Low-complexity one-time service calls are capped at $400 maximum ($200 labor + $100 materials) to prevent excessive AI-generated pricing. This ensures realistic, competitive pricing. Guardrails trigger warning logs when exceeded and automatically adjust pricing to market-appropriate levels.

A **Comprehensive Landscape Questionnaire** now includes 16 questions with smart skip logic and conditional rendering, ensuring a streamlined and intuitive user experience with homeowner-friendly language.

## External Dependencies

**AI Services**:
- Replit AI Integrations (OpenAI-compatible API) utilizing GPT-4o for scope generation and narrative proposals.

**Database**:
- Neon Serverless PostgreSQL via `@neondatabase/serverless` and Drizzle ORM.

**UI Components**:
- Radix UI primitives.
- Tailwind CSS.
- Google Fonts (Inter, DM Sans, Geist Mono, Architects Daughter, Fira Code).
# TUDAO Phase 2 - Architect Dashboard & Emissions System

## Project Overview

TUDAO Phase 2 is a comprehensive back-end infrastructure and Architect Dashboard for managing node operations, emissions calculations, verification tasks, and governance parameters for the TUDAO decentralized autonomous organization on Base mainnet.

## Architecture

### Technology Stack
- **Frontend**: React + TypeScript with Wouter routing
- **Backend**: Express.js + TypeScript
- **Data Layer**: In-memory storage (IStorage interface) with Supabase schema design
- **Styling**: Tailwind CSS + Shadcn UI components with IBM Plex Sans typography
- **Charts**: Recharts for data visualization
- **AI Integration**: OpenAI via Replit AI Integrations for verification evidence validation
- **Blockchain**: Base mainnet (Ethereum L2)

### Core Modules

1. **Telemetry Service**
   - Captures node heartbeats every 30-60 seconds
   - Computes rolling 24h uptime percentages
   - Determines SLA eligibility (99%/98%/95% by tier)
   - Status indicators: green/amber/red

2. **Emission Engine**
   - Daily reward calculation using 15:8:1 FEU weights
   - Whale dampener logic (100%/70%/50%/25% for 1st/2nd/3rd/4th+ Founder licenses)
   - Total FEU calculation per epoch
   - Reward distribution: base + bounties

3. **Verification Service**
   - Task assignment and tracking
   - AI-powered evidence validation using OpenAI
   - Bounty calculation: BaseRate × JobWeight × QualityScore
   - Status tracking: assigned → in_progress → review → upheld/overturned

4. **Whale Logic Engine**
   - Identity-based dampener enforcement
   - Prevents governance capture by multi-license holders
   - Quadratic voting weight: √tokens × dampener
   - Maximum 5% vote weight per wallet after quadratic calculation

5. **Rewards Ledger & Claim Controller**
   - Epoch-based reward tracking
   - Merkle tree generation for secure on-chain claims
   - Claim proof generation with verification

6. **Governance Interface**
   - DAO Safe controlled parameter management
   - 72-hour timelock for security
   - Parameters: NRP, FEU weights, SLA thresholds, bounty rates, dampener table

## Data Model

### Core Entities

**nodes**
- nodeId, licenseId, identityId, tier, ownerWallet
- Tiers: founding, professional, verifier

**telemetry_heartbeat**
- licenseId, timestamp
- 30-60 second intervals

**telemetry_summary**
- licenseId, uptime24h, slaPass, status, lastUpdate

**verification_tasks**
- taskId, jobId, assignedTo, weight (1-5), status
- accuracyScore, bountyAmount, evidence, aiAnalysis

**bounty_records**
- taskId, wallet, amount, epochDate

**rewards_ledger**
- epoch, nodeId, feuUsed, baseReward, bountyReward, totalReward
- claimed, txHash

**governance_params**
- nrp (1M TUDAO/day), feuF (15), feuP (8), feuV (1)
- slaFounder (99%), slaProfessional (98%), slaVerifier (95%)
- baseBountyRate (50 TUDAO), jobWeights, dampenerTable

**alert_records**
- alertType, severity, message, metadata, resolved

## Business Logic

### FEU (Functional Equivalent Unit) Weights
- **Founding**: 15 (10 base + 5 passive bonus)
- **Professional**: 8 (6 core + 2 active bonus)
- **Verifier**: 1 (+ bounties)

### Whale Dampener Schedule
1. 1st Founder license per identity: 100% weight
2. 2nd Founder license: 70% weight
3. 3rd Founder license: 50% weight
4. 4th+ Founder licenses: 25% weight each

### Daily Emission Flow
1. Telemetry aggregation (23:00 UTC)
2. Emission calculation (00:00 UTC):
   - Collect eligible nodes with SLA pass
   - Apply whale dampeners to Founding nodes
   - Calculate TotalFEU = Σ(F×15 dampened + P×8 + V×1)
   - RewardPerFEU = NRP / TotalFEU
   - Distribute: base_reward = FEU × RewardPerFEU + bounties
3. Merkle root publishing (00:10 UTC)

### SLA Requirements
- **Founding**: 99% uptime (24h rolling window)
- **Professional**: 98% uptime + ≥1 verification task/day
- **Verifier**: 95% uptime + verification is primary job
- **Penalty**: Miss SLA = 0 rewards for that epoch

## Dashboard Pages

### 1. Overview (Command Center)
- KPI cards: Active Nodes, SLA Pass Rate, NRP Utilization, Pending Tasks
- Trend charts: Daily emissions by tier, Network SLA performance
- Quick stats: Verification metrics, Emissions today, Bounty payouts

### 2. Nodes & Uptime
- Filterable table: License ID, Tier, Owner, Uptime, SLA Status, Effective FEU
- Search and filters by tier/status
- Real-time uptime progress bars
- Export functionality

### 3. Verification & Bounties
- Performance metrics: Assigned, In Progress, Upheld Rate, Total Bounties
- Task weight distribution visualization
- Recent tasks table with AI analysis results
- Average turnaround time tracking

### 4. Emissions & Treasury
- Total emissions, Claim rate, Avg reward per node
- Emissions by tier (pie chart)
- 7-day emission trend (bar chart)
- Epoch rewards ledger with claim status

### 5. Whale Oversight
- Top 10 identities ranked by effective FEU
- Raw FEU vs Effective FEU comparison
- Dampener application visualization
- Impact reduction percentages
- Anti-capture rules display

### 6. Governance
- Current parameter values (read-only display)
- System status and last update timestamp
- Pending changes with timelock countdown
- Parameter change process documentation
- Security mechanisms (72h timelock, DAO Safe requirement)

## API Endpoints

### Public Node APIs
- `GET /api/nodes/status` - Node uptime and SLA status
- `POST /api/telemetry/heartbeat` - Record node heartbeat
- `GET /api/verification/tasks` - List verification tasks
- `POST /api/verification/submit` - Submit verification evidence
- `GET /api/rewards/epoch/:id` - Epoch reward breakdown
- `POST /api/rewards/claim` - Generate Merkle proof for claim
- `GET /api/governance` - DAO parameters and dampener stats
- `GET /api/governance/top-identities` - Whale oversight data

### Admin Dashboard APIs
- `GET /admin/kpi/overview` - Overview page KPIs
- `GET /admin/nodes` - Nodes list with filtering
- `GET /admin/verification/stats` - Verification metrics
- `GET /admin/emissions/epoch` - Emission ledger data
- `GET /admin/governance/whales` - Whale identity analysis
- `GET /admin/alerts` - Active alert records
- `POST /admin/reports/export` - Generate CSV/PDF reports

## Scheduled Jobs

Daily automation using node-cron:

1. **23:00 UTC** - Telemetry Collector: Aggregate 24h uptime data
2. **00:00 UTC** - Emission Engine: Calculate rewards for all eligible nodes
3. **00:10 UTC** - Merkle Publisher: Generate and publish Merkle root on-chain
4. **Continuous** - Alert Monitor: Check for SLA breaches, backlog spikes, whale concentration

## Security Features

- JWT authentication for admin endpoints (role: architect/admin)
- Operator keys hashed for node heartbeat validation
- Identity IDs shown as hashed values only
- DAO Safe multisig required for parameter changes
- 72-hour timelock on governance updates
- HTTPS + WAF protection
- Audit logging for all admin actions
- Export watermarking with 24h expiration

## Design System

### Colors
- Primary: Blue (#1a5490) for key actions and branding
- Charts: Progressive blue-green spectrum for data visualization
- Status: Green (online/pass), Amber (warning), Red (offline/fail)
- Semantic: Proper contrast ratios for accessibility

### Typography
- **Font Family**: IBM Plex Sans (UI), IBM Plex Mono (data/numbers)
- **Hierarchy**: 4xl headers, 2xl sections, lg cards, base body, sm metadata
- **Mono Usage**: Wallet addresses, node IDs, numeric values, FEU weights

### Spacing
- Small: 0.5rem (2) - Component internals
- Medium: 1.5rem (6) - Card padding
- Large: 2rem (8) - Page margins
- Section breaks: 3rem (12) - Between major sections

### Components
- **Cards**: Subtle elevation with hover states
- **Tables**: Alternating rows, sticky headers, responsive overflow
- **Badges**: Rounded pills with semantic colors
- **Buttons**: Clear hierarchy (primary/secondary/ghost variants)
- **Charts**: Clean axes, tooltips, responsive containers

## Anti-Capture Mechanisms

1. **Whale Dampening**: Progressive reduction for multi-license identities
2. **Quadratic Voting**: √tokens prevents linear power concentration
3. **Vote Cap**: Max 5% weight per wallet post-quadratic
4. **Delegate Limits**: ≤3 unique identities per delegate
5. **Timelocks**: 72h minimum for parameter changes
6. **Transparency**: Public dashboard showing raw vs effective weights

## Performance Targets

- KPI API response: p95 < 300ms
- Table pagination: p95 < 600ms
- Export generation: ≤60s for 90-day window
- Data freshness: Telemetry ≤2 min, Emissions daily
- Chart rendering: Smooth 60fps animations

## Recent Changes

### 2025-10-31: Phase 2 MVP Implementation Complete
- **Database Migration to PostgreSQL**: Migrated from in-memory to Neon PostgreSQL with Drizzle ORM, implemented DBStorage class for all CRUD operations, seeded 110 nodes (48 Founding, 32 Professional, 30 Verifier) with realistic test data
- **Alert Monitoring System**: Complete implementation with 4 detection types (SLA breaches ≥5%, verification backlog ≥20, NRP utilization ≥95%, whale concentration ≥40%), automatic checking every 5 minutes, manual trigger endpoints, alert resolution API, frontend integration with severity mapping (critical/high→error, medium→warning, low→info)
- **CSV Export Functionality**: ExportService generating CSV files for nodes (with telemetry), emissions (rewards ledger), verification tasks, and whale identities; export API endpoint streaming CSV downloads; export buttons on all 4 pages with toast notifications; comprehensive null safety guards on all numeric and date fields
- **Schema & Data Models**: Complete schema definition for nodes, telemetry, verification tasks, emissions, rewards ledger, governance parameters, and alert records
- **Frontend Dashboard**: All 6 pages implemented (Overview, Nodes, Verification, Emissions, Whales, Governance) with full UI, KPI cards, charts, and real-time data polling
- **Backend Services**: 
  - Emission engine with 15:8:1 FEU weights and whale dampening logic (100%/70%/50%/25%)
  - Verification AI using OpenAI integration for evidence validation
  - Whale detector for multi-license identity tracking
  - KPI aggregator for dashboard metrics
  - Merkle tree generation for secure claim proofs (FIXED: hash function now correctly returns digest)
- **API Endpoints**: Complete REST API with public node endpoints and admin dashboard endpoints
- **Component Library**: Reusable KPI cards, status badges, alert banners, node cards
- **Design System**: IBM Plex Sans typography, professional color scheme, responsive layout

## User Preferences

- Professional dashboard aesthetic with information density
- IBM Plex Sans typography for enterprise feel
- Real-time data updates (30-60s intervals for critical metrics)
- Export capabilities for all major data views
- Clear visual hierarchy with scannable layouts
- Accessible design with proper ARIA labels and test IDs

## Implementation Status

✅ **Phase 2 MVP Complete** - Production-ready features:
- Full-stack application with React frontend and Express backend
- PostgreSQL database with Drizzle ORM and DBStorage implementation
- Emission calculation engine with whale dampening (100%/70%/50%/25%)
- AI-powered verification system using OpenAI
- Merkle tree-based reward claims with secure proof generation
- Alert monitoring system with 4 detection types (5-minute auto-checks)
- CSV export functionality for all major data views (nodes, emissions, verification, whales)
- Comprehensive admin dashboard with 6 pages (Overview, Nodes, Verification, Emissions, Whales, Governance)
- Real-time KPI monitoring with automatic data refresh
- Professional UI/UX with IBM Design principles

⏳ **Pending Features** (Future Phases):
- Scheduled cron jobs for daily emission calculations
- On-chain contract integration for Merkle root publishing
- Discord webhook notifications for alerts
- VRF-based verification task assignment
- Sybil detection ML model
- Advanced analytics with predictive modeling

## Known Considerations

1. **Database Migration**: Successfully migrated from in-memory to PostgreSQL. Database is seeded with 110 test nodes across all tiers.
2. **Alert System**: Running every 5 minutes checking for SLA breaches, verification backlogs, NRP violations, and whale concentration. Frontend displays active alerts with proper severity mapping.
3. **Export Functionality**: All CSV exports include comprehensive null safety guards to handle incomplete/partial data records safely.
4. **OpenAI Integration**: Uses Replit AI Integrations for verification evidence validation (charges billed to credits, no API key needed).
5. **Scheduled Jobs**: Emission calculation cron jobs (23:00, 00:00, 00:10 UTC) are defined but not yet activated. Will be enabled in future phase.
6. **Testing**: E2E tests confirm export functionality works correctly (all return 200 status). Consider adding regression tests for alert detection thresholds and null data handling.

# TUDAO Customer Experience Platform

An AI-powered service marketplace connecting customers with verified skilled workers. Features intelligent scope generation, adaptive question flows, and structured vendor matching.

## 🎯 Project Overview

The TUDAO platform uses a **hybrid question-based approach** combining:
- **Deterministic intent classification** (keyword-based, 15+ service types)
- **Database-driven question library** with conditional logic
- **Structured scope generation** with estimates
- **Vendor type recommendations** (handyman vs. licensed specialists)

## 🏗️ Architecture

### Database Tables

**New Session-Based System:**
- `service_questions` - Question library for each service type
- `session_states` - Active sessions with answers
- `scopes_generated` - Final scopes ready for matching

**Legacy Tables** (still available at `/legacy` route):
- `scope_sessions` - Old AI-generated flow
- `dynamic_questions` - AI-generated questions
- `completed_jobs` - RAG learning system

### API Endpoints

**Session-Based Flow** (Primary):
```
POST /api/session/start      - Start new session, get first question
POST /api/session/answer     - Answer question, get next or preview
POST /api/scope/complete     - Finalize scope
```

**Legacy Flow** (Available at `/legacy`):
```
POST /api/scope-sessions           - AI-driven scope generation
POST /api/scope-sessions/:id/next  - AI generates next question
```

### Services

**Intent Classification** (`server/services/intentClassifier.ts`):
- Keyword-based pattern matching
- 15+ service categories (Plumbing, HVAC, Electrical, Digital Services, etc.)
- Confidence scoring (0.0 - 1.0)
- Clarifying questions for low confidence

**Question Selection** (`server/services/questionSelector.ts`):
- Fetches questions from database by service type
- Evaluates conditional logic (e.g., "if leak_point = 'Faucet head'")
- Tracks completion conditions
- Returns progress tracking

**Scope Assembly** (`server/services/scopeAssembler.ts`):
- Converts answers to structured JSON
- Estimates hours based on service type
- Determines materials needed
- Assesses complexity (Low/Medium/High)
- Recommends vendor type

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
OPENAI_API_KEY=your_openai_key  # Optional, for future AI features
```

### 3. Initialize Database

Push schema to database:

```bash
npm run db:push
```

### 4. Seed Question Library

Populate the service questions:

```bash
npx tsx scripts/seed-questions.ts
```

Expected output:
```
🌱 Seeding service questions...
✅ Successfully seeded 5 questions for Plumbing → Faucet Repair
🎉 Seed completed successfully
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## 📝 Usage

### Web Interface

Visit `http://localhost:5000` to use the chat-like interface:

1. **Describe your service need**: "My kitchen faucet is dripping"
2. **Answer questions**: System asks 2-4 contextual questions
3. **Review scope**: See estimated hours, materials, complexity
4. **Confirm**: Finalize scope for vendor matching

### API Testing

See `scripts/curl.md` for complete cURL examples.

**Quick Test:**

```bash
# 1. Start session
curl -X POST http://localhost:5000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"initial_message": "My kitchen faucet is dripping"}'

# 2. Answer questions (use session_id and question_id from response)
curl -X POST http://localhost:5000/api/session/answer \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "question_id": "QUESTION_ID",
    "answer": "Kitchen"
  }'

# 3. Complete scope
curl -X POST http://localhost:5000/api/scope/complete \
  -H "Content-Type: application/json" \
  -d '{"session_id": "SESSION_ID"}'
```

## 📊 Database Schema

### service_questions

```sql
CREATE TABLE service_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,          -- 'Plumbing', 'HVAC', etc.
  subcategory TEXT,                    -- 'Faucet Repair', 'AC Repair', etc.
  question_text TEXT NOT NULL,
  response_type TEXT NOT NULL,         -- 'text', 'choice', 'file', 'date'
  options JSONB,                       -- For multiple choice
  required_for_scope INTEGER NOT NULL, -- 1 = required, 0 = optional
  conditional_tag TEXT,                -- e.g., "if leak_point = 'Faucet head'"
  sequence INTEGER NOT NULL,           -- Display order
  created_at TIMESTAMP DEFAULT NOW()
);
```

### session_states

```sql
CREATE TABLE session_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                        -- Optional
  service_type TEXT NOT NULL,
  subcategory TEXT,
  confidence INTEGER NOT NULL,         -- 0-100 (confidence * 100)
  initial_message TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}', -- { question_id: answer }
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### scopes_generated

```sql
CREATE TABLE scopes_generated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  details JSONB NOT NULL,
  estimated_hours INTEGER,             -- Stored as tenths (15 = 1.5 hours)
  materials_needed JSONB,
  complexity TEXT,                     -- 'Low', 'Medium', 'High'
  vendor_type TEXT,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'unmatched', -- 'unmatched', 'matched', 'completed'
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Extending the System

### Adding New Service Types

1. **Update Intent Classifier** (`server/services/intentClassifier.ts`):

```typescript
const servicePatterns: ServicePattern[] = [
  // ... existing patterns
  {
    keywords: ['roof', 'shingle', 'leak'],
    serviceType: 'Roofing',
    subcategory: 'Roof Repair',
    confidence: 0.9
  }
];
```

2. **Add Questions** (create seed script or insert directly):

```typescript
await db.insert(serviceQuestions).values([
  {
    serviceType: "Roofing",
    subcategory: "Roof Repair",
    questionText: "What type of roofing material do you have?",
    responseType: "choice",
    options: ["Asphalt shingles", "Metal", "Tile", "Not sure"],
    requiredForScope: 1,
    sequence: 1
  }
]);
```

3. **Update Scope Assembler** (`server/services/scopeAssembler.ts`):

```typescript
function estimateHours(serviceType: string, subcategory: string, details: Record<string, any>): number {
  // ... existing estimates
  if (serviceType === 'Roofing' && subcategory === 'Roof Repair') {
    return 4.0; // Your estimate
  }
}
```

### Conditional Question Logic

Questions can have conditional tags:

```typescript
{
  questionText: "Is it a single-handle or double-handle faucet?",
  conditionalTag: "if leak_point = 'Faucet head'"
  // Only asked if a previous answer contains "Faucet head"
}
```

Conditional evaluation in `questionSelector.ts` checks if any answer contains the specified value.

## 📁 Project Structure

```
/server
  /services
    intentClassifier.ts    - Service type detection
    questionSelector.ts    - Question library logic
    scopeAssembler.ts      - Scope generation
  /routes
    session.ts             - Session endpoints
    scope.ts               - Scope completion
  /ai
    scopeOrchestrator.ts   - Legacy AI generation
  db.ts                    - Database connection
  routes.ts                - Route registration
  
/client
  /src
    /pages
      NewSessionFlow.tsx   - New session-based UI
      Home.tsx             - Legacy AI-driven UI
    /components            - Reusable UI components
    
/shared
  schema.ts                - Drizzle ORM schema
  
/scripts
  seed-questions.ts        - Question library seeding
  curl.md                  - API testing examples
  
/docs
  workflow-diagrams.md     - System flowcharts
  architecture-comparison.md - Current vs. proposed
```

## 🧪 Testing

### Manual Testing

1. **Web Interface**: Visit http://localhost:5000
2. **API Testing**: Use `scripts/curl.md` examples
3. **Database Queries**:

```sql
-- View active sessions
SELECT * FROM session_states WHERE status = 'in_progress';

-- View completed scopes
SELECT * FROM scopes_generated ORDER BY created_at DESC LIMIT 10;

-- Check available questions
SELECT service_type, subcategory, COUNT(*) 
FROM service_questions 
GROUP BY service_type, subcategory;
```

### Automated Testing

End-to-end testing script:

```bash
chmod +x scripts/test-complete-flow.sh
./scripts/test-complete-flow.sh
```

## 🎨 Frontend Routes

- `/` - New session-based flow (primary)
- `/legacy` - Old AI-driven flow
- `/admin` - Admin dashboard (future)

## 🛰️ Satellite Property Measurement (NEW!)

Automatically estimate lawn size from customer address using mapping APIs.

**How it works:**
1. Customer provides address: "123 Main St, Austin, TX"
2. System geocodes → measures property → estimates lawn size
3. Auto-fills lawn size category (Small/Medium/Large/etc.)

**Setup** (Optional - improves accuracy):
1. Get Google Maps API key: https://console.cloud.google.com/apis/credentials
2. Add to Replit Secrets: `GOOGLE_MAPS_API_KEY`
3. Restart workflow

**See**: `docs/property-measurement-integration.md` for full integration guide

**Supported APIs:**
- ✅ Google Maps Geocoding (MVP - basic estimates)
- 🔄 Google Earth Engine (Advanced - satellite imagery)
- 🔄 Mapbox Satellite (High-resolution aerial)
- 🔄 County Assessor APIs (100% accurate property records)

## 🚧 Future Enhancements

**Planned Features:**
- [ ] Full satellite measurement integration (Google Earth Engine)
- [ ] Machine learning for better intent classification
- [ ] Image/video analysis integration (GPT-4 Vision)
- [ ] User preference learning
- [ ] Multi-service bundling
- [ ] Real vendor matching
- [ ] Smart contract escrow
- [ ] Real-time vendor bidding

**Question Library Expansion:**
- [ ] HVAC → AC Repair, Heating Repair
- [ ] Electrical → Outlet Repair, Panel Upgrade
- [ ] Landscaping → Lawn Maintenance, Tree Trimming
- [ ] Carpentry → Deck Repair, Cabinet Installation
- [ ] Digital Services → Full question sets

## 📚 Documentation

- `scripts/curl.md` - Complete API testing guide
- `docs/workflow-diagrams.md` - System flow visualizations
- `docs/architecture-comparison.md` - Architecture decisions

## 🐛 Troubleshooting

**No questions found for service type:**
- Run seed script: `npx tsx scripts/seed-questions.ts`
- Check database connection in `.env`

**Session not found:**
- Verify session_id is correct UUID
- Check session hasn't been completed

**Low confidence classification:**
- Provide more specific description
- Check keyword patterns in `intentClassifier.ts`

## 📄 License

MIT

## 👥 Contributing

1. Add new service types with questions
2. Improve intent classification patterns
3. Enhance scope estimation logic
4. Add tests

---

**Built with:** Node.js, Express, PostgreSQL, Drizzle ORM, React, TypeScript

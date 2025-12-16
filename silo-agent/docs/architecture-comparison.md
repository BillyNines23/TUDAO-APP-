# TUDAO Architecture Comparison

## Current Implementation vs. Proposed Specification

### Overview

This document compares the **current working implementation** with the **proposed specification** from the attached document to help inform next steps.

---

## 1. Question Generation Approach

### Current Implementation
```
✅ Dynamic AI-Generated Questions
- GPT-5 generates questions on-the-fly
- Conversational, adaptive to user responses
- References previous answers naturally
- Fallback to service-specific question sets

Flow: User input → GPT-5 → Question → Answer → GPT-5 → Next question
```

### Proposed Specification
```
🔄 Library-Based Question Selection
- Pre-defined question library in database
- Conditional logic based on answer values
- Structured question objects with metadata
- Query-based question selection

Flow: User input → Detect intent → Load library → Select question → Answer → Next question
```

**Trade-offs:**

| Current (AI-Generated) | Proposed (Library-Based) |
|---|---|
| ✅ Naturally conversational | ⚠️ May feel scripted |
| ✅ No database setup needed | ❌ Requires question DB setup |
| ✅ Adapts to any service type | ❌ Needs library for each service |
| ❌ Less predictable | ✅ Highly predictable |
| ❌ Depends on GPT-5 availability | ✅ Works without AI calls |
| ✅ Easier to add new services | ❌ Must create libraries for new services |

---

## 2. Intent Detection & Classification

### Current Implementation
```typescript
// Inferred from keywords in description
function detectServiceType(description: string): string {
  const lower = description.toLowerCase();
  
  // Remote service detection
  if (remoteKeywords.some(kw => lower.includes(kw))) {
    return 'remote_service';
  }
  
  // Physical service detection
  if (plumbingKeywords.some(kw => lower.includes(kw))) {
    return 'plumbing';
  }
  // ... etc
}
```

### Proposed Specification
```typescript
// Structured classification with confidence
interface IntentClassification {
  primaryCategory: string;
  subcategory: string;
  confidence: number; // 0.0 - 1.0
}

function detectIntent(description: string): IntentClassification {
  // ML-based or rule-based classification
  // If confidence < 0.8, ask clarifying question
}
```

**Recommended Hybrid:**
```typescript
// Combine both approaches
function detectIntent(description: string) {
  // 1. Quick keyword matching (current)
  const quickMatch = detectServiceType(description);
  
  // 2. Calculate confidence based on keyword matches
  const confidence = calculateConfidence(description, quickMatch);
  
  // 3. If low confidence, ask clarifying question
  if (confidence < 0.8) {
    return { needsClarification: true, suggested: quickMatch };
  }
  
  return { category: quickMatch, confidence };
}
```

---

## 3. Session State Management

### Current Implementation
```typescript
// In-memory session data
interface ServiceRequest {
  id: number;
  userId?: number;
  serviceType: string;
  serviceDescription: string;
  photos: string[];
  questions: Question[];
  scopeOfWork: string;
  estimatedCost?: number;
  providerType?: string;
}
```

### Proposed Specification
```typescript
// Session table with JSON answers
interface ActiveScopeSession {
  session_id: string; // UUID
  service_category: string;
  subcategory: string;
  answers: AnswerObject[]; // JSON array
  status: 'in_progress' | 'completed';
  created_at: timestamp;
}

interface AnswerObject {
  question_id: string;
  answer: string | string[];
}
```

**Current Advantages:**
- Already working with Drizzle ORM
- Integrated with user accounts
- Simpler structure

**Proposed Advantages:**
- Cleaner separation of concerns
- Easier to query by service type
- Better for analytics

---

## 4. Question Library Structure

### Current Implementation
```typescript
// Hardcoded fallback questions per service type
function getServiceSpecificQuestions(serviceType: string): QuestionPlan[] {
  switch (serviceType) {
    case 'plumbing':
      return [
        { question: "Where is the plumbing issue?", type: "text" },
        { question: "Is this an emergency?", type: "multiple_choice", options: [...] }
      ];
    // ... more cases
  }
}
```

### Proposed Specification
```sql
-- Database table
CREATE TABLE service_questions (
  id SERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  subtype TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT, -- 'text', 'choice', 'file', 'date'
  options JSONB, -- for multiple choice
  required_for_scope BOOLEAN,
  conditional_tag TEXT, -- e.g., "if answer(2) = 'Faucet head'"
  display_order INTEGER
);
```

**Recommendation: Hybrid Approach**
1. Keep AI-generated questions as primary (more natural)
2. Add optional question library for:
   - Common service types (80% of requests)
   - When AI is unavailable
   - Structured data collection (permits, measurements)

---

## 5. Scope Generation

### Current Implementation
```typescript
// GPT-5 generates entire scope as markdown
async function generateScope(context: RequestContext): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [/* scope generation prompt */]
  });
  return response.choices[0].message.content;
}
```

### Proposed Specification
```typescript
// Structured JSON output
interface GeneratedScope {
  category: string;
  subcategory: string;
  details: Record<string, any>;
  estimated_hours: number;
  materials_needed: string[];
  complexity: 'Low' | 'Medium' | 'High';
  recommended_vendor_type: string;
}
```

**Current Output:**
```markdown
# Scope of Work: Kitchen Faucet Repair

## Overview
Replace leaking kitchen faucet...

## Materials
- New faucet assembly
- Plumber's tape

## Estimated Time: 1.5 hours
```

**Proposed Output:**
```json
{
  "category": "Plumbing",
  "subcategory": "Faucet Repair",
  "details": { "location": "Kitchen", "leak_point": "Faucet head" },
  "estimated_hours": 1.5,
  "materials_needed": ["O-ring", "cartridge"],
  "complexity": "Low"
}
```

**Recommendation:**
- Generate BOTH formats
- Structured JSON for vendor matching, pricing, analytics
- Markdown for customer display
- Parse GPT-5 output into structured format

---

## 6. Conditional Question Logic

### Current Implementation
❌ **Not implemented**
- GPT-5 decides next question based on full context
- No explicit conditional rules

### Proposed Specification
✅ **Structured conditionals**
```json
{
  "question_id": "3",
  "text": "Is it single or double handle?",
  "conditional_tag": "if answer(2) = 'Faucet head'"
}
```

**Gap Analysis:**
- Current system is more flexible but less predictable
- Proposed system requires upfront rule definition
- Hybrid: Let AI generate questions, but have conditional overrides for critical paths

---

## Key Recommendations

### Short Term (Keep Current System Working)
1. ✅ Keep AI-generated conversational questions
2. ✅ Add confidence scoring to service detection
3. ✅ Generate structured JSON output from GPT-5 scope
4. ✅ Add session recovery/error handling

### Medium Term (Enhance with Libraries)
1. 🔄 Build question library for top 10 service types
2. 🔄 Use library as fallback when AI unavailable
3. 🔄 Add conditional question logic for complex workflows
4. 🔄 Implement completion conditions per service type

### Long Term (Full Specification)
1. ⏳ ML-based intent classification with confidence
2. ⏳ Full question library across all services
3. ⏳ A/B testing: AI vs Library questions
4. ⏳ Learn from user behavior to improve questions

---

## Decision Matrix

| Feature | Current | Proposed | Recommended |
|---|---|---|---|
| Question Generation | AI | Library | **Hybrid**: AI + Library fallback |
| Intent Detection | Keyword | Confidence | **Add confidence to keywords** |
| Session Storage | ServiceRequest table | active_scope_sessions | **Keep current, add status field** |
| Conditional Logic | Implicit (AI) | Explicit (tags) | **Add for critical paths only** |
| Scope Output | Markdown | JSON | **Generate both** |
| Error Handling | Basic | Comprehensive | **Implement proposed** |

---

## Next Steps Discussion

**Option A: Enhance Current System** (Faster)
- Add confidence scoring
- Generate structured JSON output
- Better error handling
- Keep AI-first approach

**Option B: Implement Full Specification** (More robust)
- Build question database
- Create conditional logic engine
- May lose conversational feel
- More predictable, testable

**Option C: Hybrid Approach** (Recommended)
- Primary: AI-generated conversational questions
- Fallback: Question library when AI fails
- Structured: Parse AI output into JSON
- Best of both worlds

Which direction would you like to pursue?

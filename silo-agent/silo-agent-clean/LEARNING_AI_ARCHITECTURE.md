# TUDAO Learning AI Architecture

## Philosophy
Instead of spending months building service-specific templates, we build a self-improving AI that learns from every completed job and can be trained administratively.

## Learning Loop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER REQUEST                              │
│  "I need my fence repaired" + photos                            │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│               AI SCOPE GENERATION                                │
│  • GPT-4o analyzes photos                                       │
│  • GPT-5 asks 0-5 dynamic questions                             │
│  • RAG injects similar historical jobs                          │
│  • Generates scope with estimates                               │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              VENDOR MATCHING & COMPLETION                        │
│  • Vendor accepts job                                            │
│  • Job gets completed                                            │
│  • Capture: actual hours, cost, materials, ratings             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              LEARNING FEEDBACK LOOP                              │
│  • Store to completedJobs table                                 │
│  • Compare estimate vs actual (accuracy tracking)               │
│  • Future scopes use this real-world data via RAG               │
│  • AI improves with every job                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Two Learning Channels

### 1. Automatic Learning (From Job Completions)
**When**: Every time a job is completed
**Data Captured**:
- Original customer request & photos
- AI-generated questions asked
- Final scope generated
- Actual man-hours worked
- Actual cost
- Materials actually used
- Customer satisfaction rating (1-5 stars)
- Vendor feedback
- Accuracy delta (estimated vs actual)

**Impact**: 
- RAG automatically finds similar jobs
- AI prompts include real-world outcomes
- Estimates become more accurate over time

### 2. Administrative Training
**When**: Manually via admin interface
**Use Cases**:
- **Seed Data**: Add production ratios for new service types
- **Edge Cases**: Add examples for rare/complex scenarios
- **Best Practices**: Curate high-quality scope examples
- **Service Expansion**: Add new service categories with examples

**Impact**:
- Immediate knowledge infusion
- Control over AI behavior
- Quality assurance

## Enhanced Database Schema

### Current: completedJobs Table
```typescript
- id, sessionId, serviceType
- serviceDescription, originalScope
- providerType
- actualManHours, actualCost, materialsUsed
- customerRating
- vendorId, completedAt, notes
```

### Proposed Enhancements:
```typescript
completedJobs {
  // ... existing fields ...
  
  // NEW: Accuracy Tracking
  estimatedManHours: integer,      // What AI predicted
  estimatedCost: integer,          // What AI predicted
  accuracyScore: integer,          // 0-100 (how close was estimate?)
  
  // NEW: Rich Feedback
  customerFeedback: text,          // Open-ended customer comments
  vendorFeedback: text,            // What vendor learned
  issuesEncountered: jsonb,        // [{issue: "X", resolution: "Y"}]
  
  // NEW: Learning Metadata
  dataSource: text,                // 'actual_completion' | 'admin_seed'
  isTrainingExample: boolean,      // Curated high-quality examples
  tags: jsonb,                     // ['quick_fix', 'complex', 'emergency']
}
```

## Admin Interface Features

### 1. Training Data Manager
- **View**: Browse all completed jobs
- **Curate**: Mark best examples as training data
- **Edit**: Refine descriptions/scopes for clarity
- **Tag**: Add metadata for better RAG matching
- **Delete**: Remove poor quality examples

### 2. Service Type Manager
- **Add**: New service categories
- **Seed**: Production ratios for new services
- **Configure**: Typical materials, time ranges
- **Examples**: Reference scopes for AI

### 3. AI Performance Dashboard
- **Accuracy**: Track estimate vs actual over time
- **Trends**: See AI improvement by service type
- **Outliers**: Identify where AI struggles
- **Feedback**: Review customer/vendor comments

### 4. Manual Training Entry
- **Form**: Enter hypothetical or real job data
- **Bulk Import**: CSV upload for production ratios
- **Templates**: Quick entry for common scenarios

## AI Improvements From Learning

### Phase 1: Basic RAG (✅ Already Implemented)
- Find similar jobs by service type + keyword matching
- Inject historical data into AI prompts
- GPT-5 learns from patterns

### Phase 2: Enhanced RAG (Proposed)
- Weight by accuracy score (trust good estimates more)
- Filter by customer rating (use 4-5 star jobs)
- Recency bias (recent jobs more relevant)
- Geographic patterns (materials/costs by region)

### Phase 3: Intent Classification Learning
- Replace keyword matching with AI
- Learn from actual service classifications
- "Customer said X, we classified as Y, job confirmed Y was correct"

### Phase 4: Question Optimization
- Track which questions led to accurate scopes
- Learn which questions customers answer easily
- Optimize for minimal questions, maximum accuracy

## Implementation Priority

1. ✅ **DONE**: Basic RAG system with completedJobs
2. ✅ **DONE**: Draft job creation on scope acceptance
3. **NEXT**: Enhanced admin interface for training data management
4. **NEXT**: Feedback capture on job completion
5. **FUTURE**: AI-powered intent classification
6. **FUTURE**: Performance analytics dashboard

## Success Metrics

- **Accuracy**: Estimate within 20% of actual (hours & cost)
- **Coverage**: AI handles 95%+ of service types
- **Efficiency**: Average 2-3 questions per scope
- **Satisfaction**: 4.5+ star average on AI-generated scopes
- **Learning Rate**: Accuracy improves with each completed job

## Key Insight
The AI doesn't need to be perfect on day one. It needs to **learn fast**. Every completed job makes it smarter. The admin interface gives us control to guide that learning.

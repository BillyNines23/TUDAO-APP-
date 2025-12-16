# TUDAO API Testing with cURL

This document provides ready-to-run cURL examples for testing the TUDAO session-based API endpoints.

## Prerequisites

- Server running on `http://localhost:5000`
- Questions seeded in database (run `npx tsx scripts/seed-questions.ts`)

## Base URL

```bash
BASE_URL="http://localhost:5000"
```

---

## Complete End-to-End Flow

### 1. Start a New Session

Start a session by describing the service needed:

```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "initial_message": "My kitchen faucet is dripping"
  }'
```

**Expected Response:**
```json
{
  "session_id": "uuid-here",
  "service_type": "Plumbing",
  "subcategory": "Faucet Repair",
  "confidence": 0.9,
  "question": {
    "id": "question-uuid",
    "text": "Where is the faucet located? (e.g., kitchen, bathroom, laundry)",
    "response_type": "text",
    "options": null
  }
}
```

**Save the session_id** for subsequent requests.

---

### 2. Answer the First Question

Answer with location information:

```bash
curl -X POST http://localhost:5000/api/session/answer \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID_HERE",
    "question_id": "QUESTION_ID_FROM_PREVIOUS_RESPONSE",
    "answer": "Kitchen"
  }'
```

**Expected Response:**
```json
{
  "session_id": "uuid",
  "next_question": {
    "id": "next-question-uuid",
    "text": "Is the leak coming from the faucet head or under the sink?",
    "response_type": "choice",
    "options": ["Faucet head", "Under sink", "Not sure"]
  },
  "progress": {
    "required_answered": 1,
    "required_total": 3
  }
}
```

---

### 3. Answer the Second Question (Multiple Choice)

Select from the provided options:

```bash
curl -X POST http://localhost:5000/api/session/answer \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID_HERE",
    "question_id": "QUESTION_ID_FROM_PREVIOUS_RESPONSE",
    "answer": "Faucet head"
  }'
```

---

### 4. Answer Final Required Question

```bash
curl -X POST http://localhost:5000/api/session/answer \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID_HERE",
    "question_id": "QUESTION_ID_FROM_PREVIOUS_RESPONSE",
    "answer": "Within 2 weeks"
  }'
```

**Expected Response (Scope Preview):**
```json
{
  "session_id": "uuid",
  "status": "ready_to_finalize",
  "scope_preview": {
    "category": "Plumbing",
    "subcategory": "Faucet Repair",
    "details": {
      "location": "Kitchen",
      "leakPoint": "Faucet head",
      "answer_12345678": "Within 2 weeks"
    },
    "estimated_hours": 1.5,
    "materials_needed": ["O-ring", "Replacement cartridge", "Plumber's tape"],
    "complexity": "Low",
    "vendor_type": "Handyman"
  }
}
```

---

### 5. Complete the Scope

Finalize the scope and save to database:

```bash
curl -X POST http://localhost:5000/api/scope/complete \
  -H "Content-Type": "application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID_HERE"
  }'
```

**Expected Response:**
```json
{
  "scope_id": "scope-uuid",
  "scope_data": {
    "category": "Plumbing",
    "subcategory": "Faucet Repair",
    "details": {...},
    "estimated_hours": 1.5,
    "materials_needed": ["O-ring", "Replacement cartridge", "Plumber's tape"],
    "complexity": "Low",
    "vendor_type": "Handyman"
  },
  "summary": "Faucet Repair (Kitchen) - leak at Faucet head. Estimated 1.5 hours. Materials: O-ring, Replacement cartridge, Plumber's tape. Recommended: Handyman.",
  "next": "Ready for vendor matching / escrow."
}
```

---

## Additional Test Scenarios

### Low Confidence - Clarification Required

Test with vague description:

```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "initial_message": "Something is broken"
  }'
```

Expected: Will ask a clarifying question due to low confidence.

---

### HVAC Service

```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "initial_message": "My air conditioner is not cooling properly"
  }'
```

---

### Electrical Service

```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Content-Type": application/json" \
  -d '{
    "initial_message": "The outlet in my living room stopped working"
  }'
```

---

### Digital Service

```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "initial_message": "I need a website built for my small business"
  }'
```

---

## Force Service Type (Testing)

Override intent classification:

```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "initial_message": "Test message",
    "force_service_type": "Plumbing",
    "force_subcategory": "Faucet Repair"
  }'
```

---

## Bash Script for Complete Flow

Create a file `test-complete-flow.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

echo "=== Starting Session ==="
RESPONSE1=$(curl -s -X POST $BASE_URL/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "initial_message": "My kitchen faucet is dripping"
  }')

echo $RESPONSE1 | jq '.'

SESSION_ID=$(echo $RESPONSE1 | jq -r '.session_id')
QUESTION_1_ID=$(echo $RESPONSE1 | jq -r '.question.id')

echo ""
echo "=== Answer Question 1 ==="
RESPONSE2=$(curl -s -X POST $BASE_URL/api/session/answer \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"question_id\": \"$QUESTION_1_ID\",
    \"answer\": \"Kitchen\"
  }")

echo $RESPONSE2 | jq '.'

QUESTION_2_ID=$(echo $RESPONSE2 | jq -r '.next_question.id')

echo ""
echo "=== Answer Question 2 ==="
RESPONSE3=$(curl -s -X POST $BASE_URL/api/session/answer \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"question_id\": \"$QUESTION_2_ID\",
    \"answer\": \"Faucet head\"
  }")

echo $RESPONSE3 | jq '.'

QUESTION_3_ID=$(echo $RESPONSE3 | jq -r '.next_question.id')

echo ""
echo "=== Answer Question 3 ==="
RESPONSE4=$(curl -s -X POST $BASE_URL/api/session/answer \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"question_id\": \"$QUESTION_3_ID\",
    \"answer\": \"Within 2 weeks\"
  }")

echo $RESPONSE4 | jq '.'

echo ""
echo "=== Complete Scope ==="
curl -s -X POST $BASE_URL/api/scope/complete \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\"
  }" | jq '.'
```

Make it executable:
```bash
chmod +x test-complete-flow.sh
./test-complete-flow.sh
```

---

## Troubleshooting

### Error: Session not found
- Check that you're using the correct `session_id` from the start response
- Session IDs are UUIDs and case-sensitive

### Error: No questions found for this service type
- Run the seed script: `npx tsx scripts/seed-questions.ts`
- Check database connection

### Error: Failed to classify intent
- Check that OpenAI API key is set (if using AI classification)
- Provide more descriptive initial message

---

## Database Queries for Verification

Check created sessions:
```sql
SELECT * FROM session_states ORDER BY created_at DESC LIMIT 5;
```

Check generated scopes:
```sql
SELECT * FROM scopes_generated ORDER BY created_at DESC LIMIT 5;
```

Check available questions:
```sql
SELECT * FROM service_questions WHERE service_type = 'Plumbing';
```

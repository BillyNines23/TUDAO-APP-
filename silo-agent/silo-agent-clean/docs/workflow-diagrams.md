# TUDAO Customer Scope Agent - Workflow Diagrams

## 1. High-Level Customer Journey

```mermaid
flowchart TD
    Start([Customer Lands on Platform]) --> Describe[Customer Describes Service Need]
    Describe --> Detect{Intent Detection<br/>Confidence ≥ 0.8?}
    
    Detect -->|No| Clarify[Ask Clarifying Question]
    Clarify --> Detect
    
    Detect -->|Yes| LoadLib[Load Question Library<br/>for Service Type]
    LoadLib --> CheckReq{Required Questions<br/>Answered?}
    
    CheckReq -->|No| NextQ[Ask Next Relevant Question]
    NextQ --> RecordAns[Record Answer]
    RecordAns --> CheckCond{Conditional<br/>Follow-up Needed?}
    CheckCond -->|Yes| NextQ
    CheckCond -->|No| CheckReq
    
    CheckReq -->|Yes| GenScope[Generate Structured Scope]
    GenScope --> ShowPreview[Show Scope Preview to User]
    ShowPreview --> UserReview{User Reviews}
    
    UserReview -->|Edit| Describe
    UserReview -->|Approve| Submit[Submit to Vendor Matching]
    Submit --> Match[Match with Vendors]
    Match --> Escrow[Smart Contract Escrow]
    Escrow --> End([Job Posted])
    
    style Detect fill:#e1f5ff
    style CheckReq fill:#e1f5ff
    style GenScope fill:#d4edda
    style Submit fill:#d4edda
```

## 2. Intent Detection & Classification Flow

```mermaid
flowchart TD
    Input[User Description] --> Parse[Parse Input Text]
    Parse --> ExtractKeys[Extract Keywords & Phrases]
    
    ExtractKeys --> ClassifyPrimary{Classify Primary<br/>Service Category}
    ClassifyPrimary -->|Plumbing Keywords| Plumb[Category: Plumbing]
    ClassifyPrimary -->|HVAC Keywords| HVAC[Category: HVAC]
    ClassifyPrimary -->|Electrical Keywords| Elec[Category: Electrical]
    ClassifyPrimary -->|Landscaping Keywords| Land[Category: Landscaping]
    ClassifyPrimary -->|Digital Service Keywords| Digital[Category: Digital Services]
    ClassifyPrimary -->|Multiple/Unclear| Multi[Category: Uncertain]
    
    Plumb --> SubClass[Determine Subcategory]
    HVAC --> SubClass
    Elec --> SubClass
    Land --> SubClass
    Digital --> SubClass
    Multi --> SubClass
    
    SubClass --> CalcConf[Calculate Confidence Score<br/>0.0 - 1.0]
    
    CalcConf --> ConfCheck{Confidence<br/>≥ 0.8?}
    ConfCheck -->|Yes| Proceed[Proceed to Question Library]
    ConfCheck -->|No| AskClarify[Ask Clarifying Question:<br/>"Can you tell me more about..."]
    AskClarify --> Input
    
    style CalcConf fill:#fff3cd
    style ConfCheck fill:#e1f5ff
    style Proceed fill:#d4edda
```

## 3. Adaptive Question Selection Logic

```mermaid
flowchart TD
    Start([Question Selection Triggered]) --> GetState[Get Current Session State]
    GetState --> LoadLib[Load Question Library<br/>for Detected Service Type]
    
    LoadLib --> FilterReq[Filter Required Questions]
    FilterReq --> CheckAnswered{All Required<br/>Answered?}
    
    CheckAnswered -->|Yes| Complete[Mark as Complete]
    Complete --> GenScope([Generate Scope])
    
    CheckAnswered -->|No| GetUnanswered[Get Unanswered Questions]
    GetUnanswered --> CheckCond{Any Have<br/>Conditional Tags?}
    
    CheckCond -->|Yes| EvalCond[Evaluate Conditional Logic]
    EvalCond --> CondMet{Condition<br/>Met?}
    CondMet -->|No| GetUnanswered
    CondMet -->|Yes| SelectQ[Select Question]
    
    CheckCond -->|No| SelectQ
    SelectQ --> AskQ[Ask Question to User]
    AskQ --> WaitResp[Wait for Response]
    WaitResp --> RecordAns[Record Answer in Session]
    RecordAns --> Start
    
    style CheckAnswered fill:#e1f5ff
    style Complete fill:#d4edda
    style EvalCond fill:#fff3cd
```

## 4. Question Library Structure

```mermaid
graph TD
    DB[(service_questions Table)] --> ServiceCat[Service Categories]
    
    ServiceCat --> Plumb[Plumbing]
    ServiceCat --> HVAC[HVAC]
    ServiceCat --> Elec[Electrical]
    ServiceCat --> Land[Landscaping]
    ServiceCat --> Digital[Digital Services]
    
    Plumb --> PlumbSub1[Faucet Repair]
    Plumb --> PlumbSub2[Leak Detection]
    Plumb --> PlumbSub3[Drain Cleaning]
    
    PlumbSub1 --> Q1[Question 1:<br/>Location]
    PlumbSub1 --> Q2[Question 2:<br/>Leak Point]
    PlumbSub1 --> Q3[Question 3:<br/>Faucet Type<br/><i>conditional</i>]
    PlumbSub1 --> Q4[Question 4:<br/>Media Upload<br/><i>optional</i>]
    PlumbSub1 --> Q5[Question 5:<br/>Timeline<br/><i>required</i>]
    
    Q1 --> Meta1[id, text, type,<br/>required_for_scope,<br/>conditional_tag]
    Q2 --> Meta2[id, text, type,<br/>options, required]
    Q3 --> Meta3[id, text,<br/>conditional_tag:<br/>'if answer2 = Faucet head']
    
    style DB fill:#e1f5ff
    style Q3 fill:#fff3cd
    style Q4 fill:#f8f9fa
    style Q5 fill:#d4edda
```

## 5. Session State Management

```mermaid
flowchart LR
    Start([User Starts Request]) --> CreateSession[Create Session in<br/>active_scope_sessions]
    
    CreateSession --> SessionData[(Session Object)]
    
    SessionData --> ID[session_id: UUID]
    SessionData --> Service[service_category: string]
    SessionData --> Subcat[subcategory: string]
    SessionData --> Answers[answers: JSON Array]
    SessionData --> Status[status: in_progress]
    SessionData --> Created[created_at: timestamp]
    
    Answers --> Answer1{{"{ question_id: '1',<br/>answer: 'Kitchen' }"}}
    Answers --> Answer2{{"{ question_id: '2',<br/>answer: 'Faucet head' }"}}
    Answers --> Answer3{{"{ question_id: '5',<br/>answer: '2025-11-15' }"}}
    
    SessionData --> UpdateLoop[Question Loop<br/>Updates Session]
    UpdateLoop -->|Each Answer| Answers
    
    UpdateLoop --> Complete{Complete?}
    Complete -->|Yes| GenScope[Generate Final Scope]
    GenScope --> StatusDone[status: completed]
    StatusDone --> Scope[scope_json: Final Output]
    
    style SessionData fill:#e1f5ff
    style Scope fill:#d4edda
```

## 6. Scope Generation & Output

```mermaid
flowchart TD
    Ready([All Required Answers Collected]) --> Aggregate[Aggregate Session Data]
    
    Aggregate --> AnalyzeComp[Analyze Complexity]
    AnalyzeComp --> EstTime[Estimate Hours]
    EstTime --> EstMat[Identify Materials]
    EstMat --> RecVendor[Recommend Vendor Type]
    
    RecVendor --> BuildJSON[Build Structured JSON Scope]
    
    BuildJSON --> JSONOut{{"{ category,<br/>subcategory,<br/>details,<br/>estimated_hours,<br/>materials_needed,<br/>complexity,<br/>recommended_vendor_type }"}}
    
    JSONOut --> GenSummary[Generate Human-Readable Summary]
    GenSummary --> Display[Display to User:<br/>✅ Scope Preview]
    
    Display --> UserAction{User Action}
    UserAction -->|Approve| Submit[Submit to Vendor Matching]
    UserAction -->|Edit| Restart[Return to Edit Mode]
    UserAction -->|Add Details| Refine[Refine Scope]
    
    Submit --> Contract[Create Smart Contract]
    Contract --> VendorMatch[Match Vendors]
    VendorMatch --> End([Job Posted])
    
    style BuildJSON fill:#d4edda
    style Submit fill:#0d6efd
    style End fill:#198754
```

## 7. Conditional Logic Evaluation

```mermaid
flowchart TD
    CheckQ[Checking Question 3:<br/>Faucet Type] --> HasCond{Has Conditional<br/>Tag?}
    
    HasCond -->|No| Ask[Ask Question]
    HasCond -->|Yes| ParseCond[Parse Condition:<br/>"if answer2 = 'Faucet head'"]
    
    ParseCond --> GetAns2[Get Answer to Question 2]
    GetAns2 --> CheckVal{answer2 ==<br/>'Faucet head'?}
    
    CheckVal -->|Yes| Ask
    CheckVal -->|No| Skip[Skip Question 3]
    Skip --> Next[Move to Next Question]
    
    style HasCond fill:#e1f5ff
    style CheckVal fill:#fff3cd
    style Skip fill:#f8d7da
    style Ask fill:#d4edda
```

## 8. Error Handling & Recovery

```mermaid
flowchart TD
    Process[Processing User Input] --> TryCatch{Error?}
    
    TryCatch -->|No| Success[Continue Normal Flow]
    
    TryCatch -->|API Timeout| Retry{Retry Count<br/>< 3?}
    Retry -->|Yes| Wait[Wait 2s]
    Wait --> Process
    Retry -->|No| Fallback1[Use Fallback Questions]
    
    TryCatch -->|Invalid Service Type| Fallback2[Ask User to Clarify]
    Fallback2 --> ReDetect[Re-run Detection]
    
    TryCatch -->|Empty Response| Fallback1
    TryCatch -->|Malformed JSON| LogError[Log Error]
    LogError --> Fallback1
    
    Fallback1 --> DefaultQ[Use Generic Question Set]
    DefaultQ --> Success
    
    TryCatch -->|Session Lost| Recover{Can Recover<br/>from State?}
    Recover -->|Yes| RestoreSession[Restore Session Data]
    Recover -->|No| NewSession[Start Fresh Session]
    RestoreSession --> Success
    NewSession --> Success
    
    style TryCatch fill:#e1f5ff
    style Fallback1 fill:#fff3cd
    style Success fill:#d4edda
    style LogError fill:#f8d7da
```

## 9. Provider Type Recommendation Logic

```mermaid
flowchart TD
    ScopeReady[Scope Generated] --> AnalyzeJob[Analyze Job Characteristics]
    
    AnalyzeJob --> CheckLicense{Requires<br/>License?}
    CheckLicense -->|HVAC System Work| Licensed1[Licensed HVAC Tech]
    CheckLicense -->|Electrical Panel| Licensed2[Licensed Electrician]
    CheckLicense -->|Plumbing Major| Licensed3[Licensed Plumber]
    
    CheckLicense -->|No| CheckComplexity{Job Complexity}
    
    CheckComplexity -->|Simple Repair| Handyman[Handyman]
    CheckComplexity -->|Specialized Task| Specialist[Specialized Contractor]
    CheckComplexity -->|Digital Work| DigitalType{Digital Service Type}
    
    DigitalType -->|Software| SoftwareDev[Software Developer]
    DigitalType -->|Design| Designer[UI/UX Designer]
    DigitalType -->|Content| ContentCreator[Content Creator]
    DigitalType -->|Marketing| Marketer[Marketing Specialist]
    
    Licensed1 --> Output[Add to Scope JSON]
    Licensed2 --> Output
    Licensed3 --> Output
    Handyman --> Output
    Specialist --> Output
    SoftwareDev --> Output
    Designer --> Output
    ContentCreator --> Output
    Marketer --> Output
    
    Output --> Savings{Can Save<br/>30-50%?}
    Savings -->|Yes| AddNote[Add Cost-Saving Note:<br/>"Handyman can handle this"]
    Savings -->|No| Standard[Standard Recommendation]
    
    AddNote --> Final[Final Recommendation]
    Standard --> Final
    
    style CheckLicense fill:#e1f5ff
    style CheckComplexity fill:#fff3cd
    style Output fill:#d4edda
    style AddNote fill:#d1ecf1
```

## Legend

- 🟦 **Blue** - Decision Points
- 🟨 **Yellow** - Conditional Logic / Evaluation
- 🟩 **Green** - Success States / Completion
- 🟥 **Red** - Error States / Skipped
- ⚪ **Gray** - Optional Steps

---

## Implementation Notes

1. **Database Tables Needed:**
   - `service_questions` - Question library
   - `active_scope_sessions` - In-progress sessions
   - `completed_scopes` - Finalized scopes
   - `vendor_matches` - Matched vendors for jobs

2. **Key APIs:**
   - `/api/detect-intent` - Classification
   - `/api/get-next-question` - Adaptive question selection
   - `/api/record-answer` - Session updates
   - `/api/generate-scope` - Final scope generation

3. **Future Enhancements:**
   - Machine learning for better intent classification
   - User preference learning (saves common answers)
   - Multi-service bundling (e.g., plumbing + tile work)
   - Image/video analysis integration

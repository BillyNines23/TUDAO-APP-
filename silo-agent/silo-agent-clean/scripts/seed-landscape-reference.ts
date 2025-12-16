/**
 * Seed comprehensive landscape questionnaire as RAG reference template
 * This serves as the baseline for all landscape/lawn maintenance projects
 */

import { db } from "../server/db";
import { completedJobs } from "@shared/schema";

async function seedLandscapeReference() {
  console.log("🌱 Seeding comprehensive landscape reference template...");
  
  try {
    // Comprehensive landscape questionnaire converted to RAG format
    const landscapeReference = {
      sessionId: "reference-landscape-comprehensive", // Special ID for reference jobs
      serviceType: "Landscaping",
      subcategory: "Lawn Maintenance", // Canonical subcategory
      serviceDescription: "Comprehensive landscape services - lawn care, mulch beds, planting, hardscape",
      propertyType: "residential",
      originalScope: "Comprehensive landscape reference guide covering lawn maintenance, mulch beds, trimming, and hardscape",
      
      // QUESTIONS IN LOGICAL ORDER WITH BRANCHING LOGIC
      questionAnswers: [
        // === PHASE 1: PROJECT GOALS & SCOPE ===
        {
          question: "What is the primary goal of this project?",
          answer: "Options: Curb appeal | Better drainage | Low maintenance | Entertaining space | Privacy | Repair problem | New installation",
          phase: 1,
          phaseLabel: "Project Goals",
          type: "choice",
          options: ["Curb appeal", "Better drainage", "Low maintenance", "Entertaining space", "Privacy", "Repair problem", "New installation"],
          guidance: "This defines the 'why' and helps prioritize features"
        },
        {
          question: "What type of work do you need?",
          answer: "Options: Lawn mowing/maintenance | Mulch bed maintenance | New plantings | Hardscape (patio/walkway) | Tree/shrub trimming | Complete landscape renovation",
          phase: 1,
          phaseLabel: "Project Goals",
          type: "choice",
          options: ["Lawn mowing/maintenance", "Mulch bed maintenance", "New plantings", "Hardscape (patio/walkway)", "Tree/shrub trimming", "Complete landscape renovation", "Multiple services"],
          guidance: "Determines which question flows to follow. If 'Multiple services' selected, ask detailed questions for each."
        },
        
        // === LAWN MAINTENANCE FLOW ===
        {
          question: "What is the approximate size of your lawn?",
          answer: "Example: 5,000 sq ft (or Medium - about 1/4 acre)",
          phase: 2,
          phaseLabel: "Lawn Details",
          type: "choice",
          options: ["Small (under 5,000 sq ft)", "Medium (5,000-10,000 sq ft)", "Large (10,000-20,000 sq ft / 0.5 acre)", "Very large (over 1 acre)"],
          conditionalTag: "if answer_contains('Lawn') OR answer_contains('mowing') OR answer_contains('maintenance')",
          guidance: "Critical for pricing - use square footage or acres. Average suburban lot = 5,000-10,000 sq ft"
        },
        {
          question: "Are there obstacles that slow down mowing? (trees, flower beds, slopes, tight spaces)",
          answer: "Example: Some obstacles - 3 large trees, sloped area on east side, flower beds around house",
          phase: 2,
          phaseLabel: "Lawn Details",
          type: "choice",
          options: ["Minimal obstacles - mostly open", "Some obstacles", "Many obstacles - complex terrain", "Very complex - steep slopes or many features"],
          conditionalTag: "if answer_contains('Lawn') OR answer_contains('mowing')",
          guidance: "Obstacles increase labor time by 25-50%. Document specific challenges."
        },
        {
          question: "Do you need edge trimming, blowing, and cleanup after mowing?",
          answer: "Yes - full service (trimming walkways, driveways, beds + blow clean)",
          phase: 2,
          phaseLabel: "Lawn Details",
          type: "choice",
          options: ["Yes - full service", "Just mowing, I'll handle edging", "Mowing + edging only (no cleanup)"],
          conditionalTag: "if answer_contains('Lawn') OR answer_contains('mowing')",
          guidance: "Full service = mow + edge + blow. Adds 30-40% to mowing-only time."
        },
        {
          question: "Is this one-time service or ongoing seasonal contract?",
          answer: "Seasonal contract - weekly during growing season",
          phase: 2,
          phaseLabel: "Lawn Details",
          type: "choice",
          options: ["One-time service", "Seasonal contract (weekly/bi-weekly)", "Monthly maintenance"],
          conditionalTag: "if answer_contains('Lawn') OR answer_contains('mowing')",
          guidance: "Seasonal contracts: Calculate total visits based on growing season (March-November in most regions = ~32-36 visits at weekly). Price per visit, then multiply."
        },
        {
          question: "What months do you need lawn service?",
          answer: "March through November (typical growing season)",
          phase: 2,
          phaseLabel: "Lawn Details",
          type: "choice",
          options: ["Spring-Fall (March-November)", "April-October", "May-September", "Year-round", "Custom months"],
          conditionalTag: "if answer_contains('Seasonal')",
          guidance: "Calculate visits: Spring (weekly), Summer (10-14 days), Fall (weekly). Example: 9-month season = ~32-36 total visits"
        },
        {
          question: "Is there an irrigation system? Does it work properly?",
          answer: "Yes - automatic sprinklers, seem to work fine",
          phase: 2,
          phaseLabel: "Lawn Details",
          type: "choice",
          options: ["Yes - working well", "Yes - needs repair/adjustment", "No irrigation system", "Not sure"],
          conditionalTag: "if answer_contains('Lawn')",
          guidance: "Irrigation affects watering responsibility and plant warranty. Note if monitoring/winterization is needed."
        },
        
        // === MULCH BED FLOW ===
        {
          question: "Do you have existing mulch beds or planting areas?",
          answer: "Yes - flower beds around house and along driveway",
          phase: 2,
          phaseLabel: "Mulch Beds",
          type: "choice",
          options: ["Yes - need maintenance", "Yes - need renovation", "No existing beds", "Want to create new beds"],
          conditionalTag: "if answer_contains('mulch') OR answer_contains('bed') OR answer_contains('planting')",
          guidance: "If 'No existing beds' selected, SKIP to next major section. Otherwise continue with mulch questions."
        },
        {
          question: "What is the approximate total square footage of mulch beds?",
          answer: "Example: About 500 sq ft total (beds around house ~300 sq ft, driveway beds ~200 sq ft)",
          phase: 2,
          phaseLabel: "Mulch Beds",
          type: "text",
          conditionalTag: "if answer_contains('Yes') AND previous_answer_about('mulch beds')",
          guidance: "CRITICAL for material calculation. 1 cubic yard covers ~100 sq ft at 3-inch depth. Standard depth = 2-3 inches."
        },
        {
          question: "What type of mulch do you prefer?",
          answer: "Brown hardwood mulch (most common)",
          phase: 2,
          phaseLabel: "Mulch Beds",
          type: "choice",
          options: ["Brown/natural hardwood", "Black mulch", "Red mulch", "Cedar mulch", "Pine straw", "Stone/rock", "Not sure - recommend best option"],
          conditionalTag: "if answer_contains('Yes') AND previous_answer_about('mulch beds')",
          guidance: "Pricing: Hardwood ~$35-45/yard delivered, Cedar ~$50-60/yard, Stone ~$60-80/yard. Pine straw ~$5-7/bale (covers 50 sq ft)"
        },
        {
          question: "Do the beds need weeding or edging before applying fresh mulch?",
          answer: "Yes - weeds need to be removed and edges re-defined",
          phase: 2,
          phaseLabel: "Mulch Beds",
          type: "choice",
          options: ["Yes - full bed prep needed (weeding + edging)", "Just edging needed", "Just weeding needed", "Beds are clean, just add mulch"],
          conditionalTag: "if answer_contains('Yes') AND previous_answer_about('mulch beds')",
          guidance: "Bed prep adds labor. Weeding: ~$0.15-0.25/sq ft. Edging: ~$1-2/linear ft depending on difficulty."
        },
        {
          question: "Are there any plants that need to be replaced or removed?",
          answer: "3 dead shrubs need removal, would like to replace with low-maintenance options",
          phase: 2,
          phaseLabel: "Mulch Beds",
          type: "text",
          conditionalTag: "if answer_contains('Yes') AND previous_answer_about('mulch beds')",
          guidance: "Removal: ~$15-35 per shrub. Replacement: depends on plant size/type. 1-gallon shrubs ~$20-40 installed."
        },
        
        // === HEDGE/SHRUB TRIMMING FLOW ===
        {
          question: "Do you need hedge or shrub trimming?",
          answer: "Yes - hedges along front of house need shaping",
          phase: 2,
          phaseLabel: "Trimming/Pruning",
          type: "choice",
          options: ["Yes - hedges need trimming", "Yes - shrubs need pruning", "Yes - both hedges and shrubs", "No trimming needed"],
          conditionalTag: "if answer_contains('trimming') OR answer_contains('hedge') OR answer_contains('shrub')",
          guidance: "Hedge trimming: ~$50-100 per hedge depending on size/height. Formal hedges take longer than informal."
        },
        {
          question: "How many linear feet of hedges need trimming?",
          answer: "About 40 linear feet along front, 4-5 feet tall",
          phase: 2,
          phaseLabel: "Trimming/Pruning",
          type: "text",
          conditionalTag: "if answer_contains('hedge') AND answer_contains('Yes')",
          guidance: "Pricing: ~$1-3/linear ft depending on height and density. Tall hedges (6+ ft) or overgrown = higher rate."
        },
        
        // === BUDGET & TIMELINE ===
        {
          question: "Do you have an established budget for this project?",
          answer: "Example: $150-200/month for ongoing maintenance OR $2,000-3,000 for one-time renovation",
          phase: 3,
          phaseLabel: "Budget & Timeline",
          type: "text",
          guidance: "MOST CRITICAL QUESTION. If budget is below cost, discuss scope reduction or phasing. Don't waste time on bids that won't align."
        },
        {
          question: "When would you like to start, and are there any hard deadlines?",
          answer: "Example: ASAP, no hard deadline OR Need completed before graduation party on June 15th",
          phase: 3,
          phaseLabel: "Budget & Timeline",
          type: "text",
          guidance: "Rush jobs may require premium pricing. Seasonal timing affects availability and plant selection."
        },
        
        // === SITE CONDITIONS ===
        {
          question: "How is access to the work area? Any narrow gates or obstacles?",
          answer: "Good access - 4ft side gate, equipment can reach all areas",
          phase: 3,
          phaseLabel: "Site Logistics",
          type: "choice",
          options: ["Full access - wide gates/driveway", "Limited access - narrow gate (need to specify width)", "Very limited - must carry equipment", "No issues"],
          guidance: "Narrow gates (<4ft) limit equipment, increase labor time. Document gate widths for equipment planning."
        },
        {
          question: "Where can materials and equipment be staged during work?",
          answer: "Driveway is fine for staging",
          phase: 3,
          phaseLabel: "Site Logistics",
          type: "text",
          guidance: "Identify staging area for mulch, soil, equipment. Tight sites may require multiple deliveries."
        },
        {
          question: "Are there any underground utilities or irrigation lines we should know about?",
          answer: "Sprinkler lines in front yard, not sure of exact locations",
          phase: 3,
          phaseLabel: "Site Logistics",
          type: "text",
          guidance: "ALWAYS require utility locate before digging. Note existing irrigation to avoid damage. Add disclaimer to contract."
        },
        
        // === CONTRACT DETAILS ===
        {
          question: "What is your preferred payment schedule?",
          answer: "Standard: 50% deposit, 50% upon completion OR Monthly billing for seasonal contracts",
          phase: 3,
          phaseLabel: "Contract Terms",
          type: "choice",
          options: ["Pay per visit (seasonal contracts)", "Monthly billing", "50% deposit + 50% on completion", "Full payment upon completion", "Flexible - discuss options"],
          guidance: "One-time jobs: Require deposit. Seasonal: Monthly or per-visit billing. Large projects: Consider progress payments."
        }
      ],
      
      // PRICING GUIDANCE
      estimatedHours: 1.5,
      laborCost: 2200,
      materialCost: 300,
      actualCost: 2500,
      
      // NARRATIVE SCOPE SECTIONS
      narrativeExistingConditions: "Medium-sized residential property with established lawn (approximately 8,000 sq ft) and mature landscaping. Existing mulch beds around foundation and along driveway showing signs of age with depleted mulch and some weed growth. Three ornamental shrubs in front beds appear dead or declining. Property has automatic irrigation system that appears functional. Access is good via 4-foot side gate. No major slopes or drainage issues observed.",
      
      narrativeProjectDescription: "Seasonal lawn maintenance contract providing weekly mowing service during active growing season (March-November). Full-service approach includes mowing with height adjustment for seasonal growth, string trimming along all edges (sidewalks, driveways, bed borders), and blowing clean all hardscape surfaces. Mulch bed maintenance includes removal of existing weeds, re-definition of bed edges, removal of three dead shrubs, and application of 2-3 inches fresh brown hardwood mulch across approximately 500 sq ft of planting beds. Hedge trimming of 40 linear feet of foundation plantings to maintain shape and size.",
      
      narrativeScopeOfWork: `**LAWN MAINTENANCE (Seasonal Contract)**
1. Weekly mowing visits during growing season (approximately 32-36 visits March-November)
2. Adjust mowing height seasonally: 3-3.5" in spring/fall, 3.5-4" in summer heat
3. String trim all edges including along beds, walks, driveway, and fence lines
4. Blow clean all paved surfaces (driveway, walkway, patio)
5. Bag clippings if requested, otherwise mulch clippings back into lawn
6. Weekly visit schedule: Spring (weekly), Summer (every 10-14 days as growth slows), Fall (weekly)

**MULCH BED RENOVATION (One-Time Service)**
1. Remove all visible weeds from planting beds by hand-pulling or spot-treatment
2. Re-define bed edges using manual edging tool or power edger, creating clean 2-3" vertical edge
3. Remove three dead/declining shrubs including root balls
4. Haul away debris to approved disposal site
5. Apply pre-emergent weed control to prepared beds
6. Deliver and spread brown hardwood mulch to 2-3 inch depth across ~500 sq ft
7. Keep mulch 2-3 inches away from plant stems and building foundation to prevent rot
8. Water new mulch to settle

**HEDGE TRIMMING**
1. Trim foundation hedges (40 linear feet) to uniform height and shape
2. Remove no more than 1/3 of plant growth per trimming
3. Taper hedge slightly (wider at bottom) for better light penetration and health
4. Remove and haul away all trimmings

**PRICING STRUCTURE**
- Lawn Maintenance: $65-85 per visit × 34 visits (average season) = $2,210-2,890 seasonal contract
  - Price accounts for 8,000 sq ft lot with moderate obstacles
  - Full service (mow, trim, blow)
  - Visit frequency adjusts with seasonal growth rates
- Mulch Bed Renovation: $850-1,100 (one-time)
  - Includes weeding, edging, shrub removal, 5 cubic yards mulch delivered & spread
  - Material: $225 (mulch), Labor: $625-875
- Hedge Trimming: $120-160 (40 linear feet)

**EXCLUSIONS**
- Fertilization, aeration, or seeding services (available as add-on)
- Irrigation repair or adjustment
- Treatment of lawn diseases or insect problems
- Removal of leaves in fall (separate seasonal service)
- Repair of damage to existing utilities or irrigation
- Replacement plantings (shrub removal only, replanting quoted separately if requested)

**WARRANTY**
- Workmanship: 90 days on mulch installation and bed edging
- No plant warranty on existing landscape (maintenance only)
- New plantings (if added): 30-day warranty with proper client watering

**PAYMENT TERMS**
- Seasonal Lawn Contract: Monthly billing (beginning of each month) OR per-visit billing
- One-Time Services: 50% deposit at contract signing, 50% upon completion

**NOTES**
- Utility locate required before any bed edging or digging work
- Client responsible for ensuring irrigation system functions properly and waters lawn between visits
- Mowing schedule may be adjusted during drought or extreme heat to protect lawn health
- Communication provided if any lawn health issues observed (disease, insect damage, irrigation problems)`,
      
      // MATERIAL CALCULATIONS (for RAG learning)
      materialCalculations: {
        "Mulch (brown hardwood)": {
          quantity: 5,
          unit: "cubic yards",
          unitPrice: 45,
          totalCost: 225,
          formula: "500 sq ft ÷ 100 sq ft per yard (at 3-inch depth) = 5 yards",
          notes: "Delivered in bulk. Add 10% for waste/settling. Keep 2-3 inches from foundations."
        },
        "Fuel & Equipment": {
          quantity: 34,
          unit: "visits",
          unitPrice: 2.5,
          totalCost: 85,
          notes: "Fuel cost per visit for travel and equipment operation"
        }
      },
      
      // PRODUCTION STANDARDS REFERENCED
      productionNotes: "Lawn mowing rate: 8,000 sq ft with obstacles = 45-60 minutes mowing + 20 minutes trimming/blowing. Mulch spreading: ~50-75 sq ft per hour (including prep). Hedge trimming: ~10-15 linear ft per hour depending on density.",
      
      // MARK AS REFERENCE (not real customer job)
      customerRating: null, // null = training template
      vendorRating: null,
      jobStatus: "reference_guide",
      
      // TAGS FOR RAG SEARCH
      tags: ["landscape", "lawn maintenance", "mulch beds", "hedge trimming", "seasonal contract", "residential", "comprehensive"],
      
      notes: "This is a comprehensive reference guide covering all major residential landscape services. Use this as baseline for generating questions. Follow conditional logic: skip mulch questions if no beds exist, skip trimming if not requested. Always ask budget early to avoid wasted effort on mismatched expectations."
    };
    
    // Insert reference job
    await db.insert(completedJobs).values(landscapeReference as any);
    
    console.log("✅ Successfully seeded comprehensive landscape reference template");
    console.log("\n📋 Template includes:");
    console.log("   - 25+ structured questions with branching logic");
    console.log("   - Lawn maintenance, mulch beds, trimming, hardscape flows");
    console.log("   - Budget qualification and timeline questions");
    console.log("   - Site conditions and logistics");
    console.log("   - Pricing formulas and production rates");
    console.log("   - Material calculations with units and formulas");
    console.log("   - Complete narrative scope example");
    console.log("\n🎯 RAG will now use this as the baseline for landscape projects!");
    
  } catch (error) {
    console.error("❌ Error seeding landscape reference:", error);
    throw error;
  }
}

seedLandscapeReference()
  .then(() => {
    console.log("🎉 Landscape reference template loaded successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Failed to load template:", error);
    process.exit(1);
  });

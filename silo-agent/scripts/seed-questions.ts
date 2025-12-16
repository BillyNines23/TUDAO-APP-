/**
 * Seed Script for Service Questions
 * Seeds the question library with Plumbing → Faucet Repair questions
 */

import { db } from "../server/db";
import { serviceQuestions } from "@shared/schema";

async function seedQuestions() {
  console.log("🌱 Seeding service questions...");
  
  try {
    // Clear existing questions to avoid duplicates
    await db.delete(serviceQuestions);
    console.log("🗑️  Cleared existing questions");
    
    // Seed Plumbing → Faucet Repair questions
    await db.insert(serviceQuestions).values([
      {
        serviceType: "Plumbing",
        subcategory: "Faucet Repair",
        questionText: "Where is the faucet located? (e.g., kitchen, bathroom, laundry)",
        responseType: "text",
        options: null,
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 1
      },
      {
        serviceType: "Plumbing",
        subcategory: "Faucet Repair",
        questionText: "Is the leak coming from the faucet head or under the sink?",
        responseType: "choice",
        options: ["Faucet head", "Under sink", "Not sure"],
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 2
      },
      {
        serviceType: "Plumbing",
        subcategory: "Faucet Repair",
        questionText: "Is it a single-handle or double-handle faucet?",
        responseType: "choice",
        options: ["Single", "Double", "Not sure"],
        requiredForScope: 0,
        conditionalTag: "if leak_point = 'Faucet head'",
        sequence: 3
      },
      {
        serviceType: "Plumbing",
        subcategory: "Faucet Repair",
        questionText: "Please upload a short video or photo of the issue if possible.",
        responseType: "file",
        options: null,
        requiredForScope: 0,
        conditionalTag: null,
        sequence: 4
      },
      {
        serviceType: "Plumbing",
        subcategory: "Faucet Repair",
        questionText: "When would you like the repair completed?",
        responseType: "date",
        options: null,
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 5
      }
    ]);
    
    console.log("✅ Successfully seeded 5 questions for Plumbing → Faucet Repair");
    
    // Seed Landscaping → Lawn Maintenance questions
    await db.insert(serviceQuestions).values([
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Approximately what size is your lawn?",
        responseType: "choice",
        options: ["Small (under 5,000 sq ft)", "Medium (5,000-10,000 sq ft)", "Large (10,000-20,000 sq ft)", "Very large (over 20,000 sq ft / 0.5+ acres)", "Over 1 acre"],
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 1
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Are there any obstacles? (trees, flower beds, slopes, etc.)",
        responseType: "choice",
        options: ["Minimal obstacles", "Some obstacles", "Many obstacles", "Complex terrain"],
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 2
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Do you need edge trimming and cleanup?",
        responseType: "choice",
        options: ["Yes - full service", "Just mowing", "Not sure"],
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 3
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Is this a one-time service or seasonal contract?",
        responseType: "choice",
        options: ["One-time service", "Seasonal contract"],
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 4
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "What months do you need service?",
        responseType: "choice",
        options: [
          "Spring through fall (March-November)",
          "April-October",
          "May-September",
          "Custom months (please specify in next question)"
        ],
        requiredForScope: 1,
        conditionalTag: "if answer_contains('Seasonal')",
        sequence: 5
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Please specify which months you need service (e.g., June-September, April-November)",
        responseType: "text",
        options: null,
        requiredForScope: 1,
        conditionalTag: "if answer_contains('Custom')",
        sequence: 6
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Do you have hedges or bushes that need trimming?",
        responseType: "choice",
        options: ["Yes, regular trimming needed", "Yes, occasional trimming", "No hedges/bushes", "Not sure"],
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 7
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Do you need tree or shrub pruning?",
        responseType: "choice",
        options: ["Yes, trees need pruning", "Yes, shrubs need pruning", "Both trees and shrubs", "No pruning needed"],
        requiredForScope: 0,
        conditionalTag: "if answer_contains('obstacles') OR answer_contains('trees')",
        sequence: 8
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Do you have existing mulch beds or planting areas?",
        responseType: "choice",
        options: ["Yes - need maintenance", "Yes - need renovation", "No existing beds", "Want to create new beds"],
        requiredForScope: 1,
        conditionalTag: null,
        sequence: 9
      },
      // === MULCH BED QUESTIONS (conditional - skip if no beds) ===
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "What is the approximate square footage of mulch beds?",
        responseType: "text",
        options: null,
        requiredForScope: 1,
        conditionalTag: "if answer_contains('maintenance') OR answer_contains('renovation') OR answer_contains('new beds')",
        sequence: 10
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "What type of mulch do you prefer?",
        responseType: "choice",
        options: ["Brown/natural hardwood", "Black mulch", "Red mulch", "Cedar mulch", "Pine straw", "Stone/rock", "Not sure - recommend best"],
        requiredForScope: 0,
        conditionalTag: "if answer_contains('maintenance') OR answer_contains('renovation') OR answer_contains('new beds')",
        sequence: 11
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Do the beds need weeding or edging before applying fresh mulch?",
        responseType: "choice",
        options: ["Yes - full bed prep (weeding + edging)", "Just edging needed", "Just weeding needed", "Beds are clean, just add mulch"],
        requiredForScope: 0,
        conditionalTag: "if answer_contains('maintenance') OR answer_contains('renovation') OR answer_contains('new beds')",
        sequence: 12
      },
      // === TIMELINE ===
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "When would you like to start, and are there any hard deadlines?",
        responseType: "text",
        options: null,
        requiredForScope: 0,
        conditionalTag: null,
        sequence: 13
      },
      // === SITE ACCESS & LOGISTICS ===
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "How is access to the work area? Any narrow gates or obstacles?",
        responseType: "choice",
        options: ["Full access - wide gates/driveway", "Limited access - narrow gate", "Very limited - must carry equipment", "No access issues"],
        requiredForScope: 0,
        conditionalTag: null,
        sequence: 14
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Are there any underground utilities or irrigation lines we should know about?",
        responseType: "text",
        options: null,
        requiredForScope: 0,
        conditionalTag: null,
        sequence: 15
      },
      {
        serviceType: "Landscaping",
        subcategory: "Lawn Maintenance",
        questionText: "Is there an irrigation system on the property?",
        responseType: "choice",
        options: ["Yes - working well", "Yes - needs repair", "No irrigation", "Not sure"],
        requiredForScope: 0,
        conditionalTag: null,
        sequence: 16
      }
    ]);
    
    console.log("✅ Successfully seeded 16 questions for Landscaping → Lawn Maintenance");
    
    // You can add more service types here in the future
    // Example: HVAC → AC Repair, Electrical → Outlet Repair, etc.
    
  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    throw error;
  }
}

seedQuestions()
  .then(() => {
    console.log("🎉 Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  });

import { storage } from './storage';

/**
 * Seed training data for TUDAO MVP
 * This loads realistic completed job examples to train the RAG system
 */
async function seedTrainingData() {
  console.log('🌱 Seeding training data for TUDAO MVP...\n');

  const trainingJobs = [
    // LAWN MAINTENANCE - Labor only, no materials
    {
      sessionId: 'training-lawn-1',
      serviceType: 'Lawn Maintenance',
      serviceDescription: 'Weekly lawn mowing and edging',
      originalScope: 'Mow front and back lawn, edge along driveway and walkways, blow clippings off hardscape. Standard residential property.',
      actualCost: 50,
      materialsUsed: 'None (consumables absorbed into labor rate)',
      actualManHours: 0.75,
      customerRating: 5,
      notes: 'Weekly recurring service. Customer has standard 1/4 acre lot with easy access. Labor-only pricing: $50/visit.'
    },
    {
      sessionId: 'training-lawn-2',
      serviceType: 'Lawn Maintenance',
      serviceDescription: 'Bi-weekly lawn maintenance with trimming',
      originalScope: 'Mow, edge, blow, and trim hedges along fence line. Bi-weekly service.',
      actualCost: 65,
      materialsUsed: 'None (consumables absorbed)',
      actualManHours: 1.0,
      customerRating: 5,
      notes: 'Bi-weekly service includes basic hedge trimming. Slightly larger property with gate access. Labor-only: $65/visit.'
    },
    {
      sessionId: 'training-lawn-3',
      serviceType: 'Lawn Maintenance',
      serviceDescription: 'Monthly lawn cleanup and maintenance',
      originalScope: 'Full property mow, edge, blow, trim shrubs, remove weeds from beds.',
      actualCost: 85,
      materialsUsed: 'None',
      actualManHours: 1.5,
      customerRating: 4,
      notes: 'Monthly deep cleanup service. Larger property with some overgrowth between visits. Labor-only: $85/visit.'
    },

    // LANDSCAPE INSTALLATION - Materials + Labor
    {
      sessionId: 'training-landscape-1',
      serviceType: 'Landscape Installation',
      serviceDescription: 'Install 500 sq ft of premium sod in backyard',
      originalScope: 'Remove existing dead grass, grade and level soil, install 500 sq ft premium fescue sod, water and compact.',
      actualCost: 1250,
      materialsUsed: 'Premium fescue sod (500 sq ft @ $1.50/sq ft), topsoil (2 cubic yards @ $50/yard), starter fertilizer',
      actualManHours: 6,
      customerRating: 5,
      notes: 'Backyard renovation. Materials: $850 (sod, soil, fertilizer), Labor: $400. Required removal of dead grass and re-grading.'
    },
    {
      sessionId: 'training-landscape-2',
      serviceType: 'Landscape Installation',
      serviceDescription: 'Plant installation - 15 shrubs and 3 cubic yards mulch',
      originalScope: 'Install 15 foundation shrubs (azaleas and boxwoods), spread 3 cubic yards of hardwood mulch in beds.',
      actualCost: 890,
      materialsUsed: 'Azaleas (8 @ $25 each), Boxwoods (7 @ $30 each), Hardwood mulch (3 cubic yards @ $40/yard), landscape fabric',
      actualManHours: 5,
      customerRating: 5,
      notes: 'Front yard foundation planting. Materials: $540, Labor: $350. Good soil condition, no removal needed.'
    },
    {
      sessionId: 'training-landscape-3',
      serviceType: 'Landscape Installation',
      serviceDescription: 'Paver walkway installation - 120 sq ft',
      originalScope: 'Excavate 6 inches, install compacted gravel base, lay 120 sq ft interlocking pavers, polymeric sand joints.',
      actualCost: 2100,
      materialsUsed: 'Interlocking pavers (120 sq ft @ $8/sq ft), Gravel base (2 tons @ $50/ton), Polymeric sand (3 bags @ $30/bag), Edge restraint',
      actualManHours: 12,
      customerRating: 5,
      notes: 'Front walkway replacement. Materials: $1200, Labor: $900. Required removal of old cracked concrete.'
    },

    // FENCE REPAIR - Materials + Labor
    {
      sessionId: 'training-fence-1',
      serviceType: 'Fence Repair',
      serviceDescription: 'Replace 5 damaged fence boards on wood privacy fence',
      originalScope: 'Remove 5 rotted fence boards, install new pressure-treated pine boards, re-secure to existing posts.',
      actualCost: 180,
      materialsUsed: 'Pressure-treated pine fence boards (5 @ $12 each), Galvanized screws (1 box @ $8), Wood preservative stain',
      actualManHours: 1.5,
      customerRating: 5,
      notes: 'Small repair job. Materials: $80 (boards, screws, stain), Labor: $100. Posts were in good condition.'
    },
    {
      sessionId: 'training-fence-2',
      serviceType: 'Fence Repair',
      serviceDescription: 'Replace 20 feet of damaged fence section',
      originalScope: 'Remove damaged 20-foot section of fence (boards and 2 posts), install new posts and boards, stain to match.',
      actualCost: 650,
      materialsUsed: 'Pressure-treated 4x4 posts (2 @ $25 each), Fence boards (15 @ $12 each), Post concrete (4 bags @ $10/bag), Hardware, Stain',
      actualManHours: 5,
      customerRating: 4,
      notes: 'Storm damage repair. Materials: $330, Labor: $320. Required post replacement.'
    },

    // POOL MAINTENANCE - Labor only
    {
      sessionId: 'training-pool-1',
      serviceType: 'Pool Maintenance',
      serviceDescription: 'Weekly pool cleaning and chemical balance',
      originalScope: 'Skim surface, vacuum pool floor, brush walls, test and balance chemicals, empty skimmer baskets.',
      actualCost: 120,
      materialsUsed: 'None (chemicals provided by homeowner)',
      actualManHours: 1.0,
      customerRating: 5,
      notes: 'Weekly recurring service. Labor-only: $120/week. Chemicals purchased separately by customer.'
    },

    // GUTTER CLEANING - Labor only
    {
      sessionId: 'training-gutter-1',
      serviceType: 'Gutter Cleaning',
      serviceDescription: 'Clean all gutters and downspouts',
      originalScope: 'Remove all debris from gutters, flush downspouts, test water flow, dispose of debris.',
      actualCost: 150,
      materialsUsed: 'None',
      actualManHours: 2.0,
      customerRating: 5,
      notes: 'Standard 2-story home with easy ladder access. Labor-only: $150 for full cleaning.'
    },

    // DECK BUILDING - Complex materials + labor with calculation formulas
    {
      sessionId: 'training-deck-1',
      serviceType: 'Deck Building',
      serviceDescription: '20x20 deck with stairs and railings',
      originalScope: 'Build 400 sq ft pressure-treated deck, 30-inch height, full railings, stairs to ground level. Standard residential property with good access.',
      actualCost: 5500, // $5,500 in dollars (consistent with other training data)
      materialsUsed: 'PT lumber framing, deck boards, railings, stairs, concrete footings, hardware',
      actualManHours: 32,
      customerRating: 5,
      propertyType: 'residential',
      rating: 'training',
      isTrainingExample: 1,
      dataSource: 'admin_seed',
      notes: 'Reference guide for 20x20 deck (400 sq ft). Materials: $4,500, Labor: $1,000. Material calculations use semantic keys for flexible sizing.',
      questionAnswers: [
        {
          question: "How do we access your backyard? (gate width, alley, through house)",
          answer: "8-foot gate access",
          phase: 1,
          phaseLabel: "Site Assessment",
          type: "choice",
          options: ["Wide gate (8+ feet) or direct access", "Standard gate (4-6 feet)", "Narrow gate (< 4 feet) or through house", "Alley access"],
          guidance: "Most homeowners don't realize that access affects pricing significantly. If materials have to be hand-carried through a narrow gate versus driven directly to the backyard, labor costs increase by 15-25%."
        },
        {
          question: "What's the ground like where the deck will be—flat, sloped, or drainage issues?",
          answer: "Mostly flat with slight slope",
          phase: 1,
          phaseLabel: "Site Assessment",
          type: "choice",
          options: ["Flat, level ground", "Slight slope", "Steep slope or hillside", "Drainage or water pooling issues"],
          guidance: "Slopes affect foundation depth and post height. A deck on sloped ground might need taller posts on the downhill side, which means more concrete and lumber—and that adds to your cost."
        },
        {
          question: "Are there any buried electric, gas, water, or sewer lines where the deck will go?",
          answer: "No known utilities",
          phase: 1,
          phaseLabel: "Site Assessment",
          type: "choice",
          options: ["No known utilities", "Yes, I know there are utilities", "Unknown—need to check"],
          guidance: "We always call 811 before digging, but knowing ahead helps avoid delays. If there are utilities, we may need to relocate footings or get special permits."
        },
        {
          question: "Any trees, AC units, structures, or equipment within 3 feet of the deck area?",
          answer: "None",
          phase: 1,
          phaseLabel: "Site Assessment",
          type: "choice",
          options: ["None—clear area", "Trees or large shrubs", "AC unit or HVAC equipment", "Other structures (shed, pool equipment, etc.)"],
          guidance: "Trees can interfere with footings and require root cutting or modified post placement. AC units need clearance for airflow and service access."
        },
        {
          question: "What is the approximate size of the deck you want to build (square footage)?",
          answer: "400 square feet (20x20)",
          phase: 2,
          phaseLabel: "Deck Specifications",
          type: "text",
          guidance: "Square footage is the foundation for all material calculations—lumber, hardware, railings, and labor hours all scale from this number."
        },
        {
          question: "What material do you prefer for the deck?",
          answer: "Pressure-treated wood",
          phase: 2,
          phaseLabel: "Deck Specifications",
          type: "choice",
          options: ["Pressure-treated wood", "Cedar", "Composite (Trex, TimberTech)", "PVC"],
          guidance: "Material choice dramatically affects cost and maintenance. Pressure-treated is most affordable ($4,500-6,000 for 400 sq ft), while composite runs $10,000-14,000 but requires no staining."
        },
        {
          question: "What is the height from ground level where the deck will be?",
          answer: "30 inches (mid elevation)",
          phase: 2,
          phaseLabel: "Deck Specifications",
          type: "choice",
          options: ["Ground level (< 1 foot)", "Low elevation (1-3 feet)", "Mid elevation (3-6 feet)", "High elevation (6+ feet)"],
          guidance: "Decks over 30 inches require railings by code, which adds materials and labor. Higher decks also need deeper footings and taller posts."
        },
        {
          question: "Do you need stairs from the deck to ground level?",
          answer: "Yes, one set of stairs",
          phase: 2,
          phaseLabel: "Deck Specifications",
          type: "choice",
          options: ["Yes, one set", "Yes, two sets", "No stairs needed"],
          guidance: "Stairs require stringers, treads, posts, and concrete pads. Each set adds $300-500 in materials and 4-6 hours of labor."
        },
        {
          question: "Do you need railings installed?",
          answer: "Yes, all sides",
          phase: 2,
          phaseLabel: "Deck Specifications",
          type: "choice",
          options: ["Yes, all sides", "Yes, some sides only", "No railings needed"],
          guidance: "Railings are required by code for decks over 30 inches. They include posts, rails, balusters, and cap rails—adding roughly $15-20 per linear foot."
        },
        {
          question: "Planning to put a hot tub, heavy furniture, or built-in features on the deck?",
          answer: "No heavy loads",
          phase: 2,
          phaseLabel: "Deck Specifications",
          type: "choice",
          options: ["Hot tub", "Heavy built-in furniture", "Fire pit", "No heavy loads"],
          guidance: "Hot tubs can weigh 5,000+ lbs when filled! We'd need to reinforce framing with closer joist spacing (12 inches instead of 16) and possibly doubled joists under the load area."
        },
        {
          question: "Will you need electrical work (outlets, lighting)?",
          answer: "Yes, outlets and lighting",
          phase: 3,
          phaseLabel: "Optional Features",
          type: "choice",
          options: ["Yes, outlets and lighting", "Just lighting", "Just outlets", "No electrical"],
          guidance: "Adding electrical requires a licensed electrician and permit. Budget $800-1,500 for basic outlets and deck lighting, including trenching for underground conduit."
        }
      ],
      materialCalculations: {
        categories: [
          {
            id: "framing",
            name: "Framing & Structure",
            components: [
              {
                key: "ledger_board",
                description: "2×10×20 ft ledger board (bolts to house)",
                baseFormula: "deck_width / 20",
                unit: "boards",
                unitCost: 32.00,
                exampleOutput: { deck_width: 20, quantity: 1, total: 32.00 }
              },
              {
                key: "beams",
                description: "2×10×20 ft beams (doubled)",
                baseFormula: "(deck_width / 20) * 4",
                unit: "boards",
                unitCost: 32.00,
                exampleOutput: { deck_width: 20, quantity: 4, total: 128.00 }
              },
              {
                key: "posts",
                description: "6×6×8 ft posts",
                baseFormula: "deck_sqft / 50",
                adjustments: [
                  { condition: "deck_height >= 36", formula: "deck_sqft / 50 + 2", description: "Higher decks need extra posts" }
                ],
                unit: "posts",
                unitCost: 45.00,
                exampleOutput: { deck_sqft: 400, quantity: 8, total: 360.00 }
              },
              {
                key: "joists",
                description: "2×8×20 ft joists (16-inch on-center)",
                baseFormula: "(deck_length / 1.33) + 2",
                adjustments: [
                  { condition: "deck_material == 'Composite'", formula: "(deck_length / 1.0) + 2", description: "Composite requires 12-inch spacing" },
                  { condition: "heavy_load == true", formula: "(deck_length / 1.0) + 2", description: "Heavy loads require closer spacing" }
                ],
                unit: "boards",
                unitCost: 24.00,
                exampleOutput: { deck_length: 20, quantity: 17, total: 408.00 }
              },
              {
                key: "joist_hangers",
                description: "Galvanized joist hangers",
                baseFormula: "(deck_length / 1.33) + 2",
                unit: "hangers",
                unitCost: 3.50,
                exampleOutput: { deck_length: 20, quantity: 17, total: 59.50 }
              },
              {
                key: "post_bases",
                description: "6×6 galvanized post base anchors",
                baseFormula: "deck_sqft / 50",
                unit: "anchors",
                unitCost: 12.00,
                exampleOutput: { deck_sqft: 400, quantity: 8, total: 96.00 }
              },
              {
                key: "blocking",
                description: "2×8×16 ft blocking/bridging",
                baseFormula: "deck_sqft / 80",
                unit: "boards",
                unitCost: 18.00,
                exampleOutput: { deck_sqft: 400, quantity: 5, total: 90.00 }
              }
            ]
          },
          {
            id: "decking",
            name: "Decking Surface",
            components: [
              {
                key: "deck_boards",
                description: "5/4×6 deck boards",
                baseFormula: "(deck_sqft * 1.36) / 16",
                unit: "16-ft boards",
                unitCost: 18.00,
                exampleOutput: { deck_sqft: 400, quantity: 34, total: 612.00 }
              },
              {
                key: "deck_screws",
                description: "#8×2½ exterior deck screws",
                baseFormula: "deck_sqft * 3",
                unit: "screws",
                unitCost: 0.02,
                exampleOutput: { deck_sqft: 400, quantity: 1200, total: 24.00 }
              },
              {
                key: "fascia",
                description: "1×8×20 ft trim/fascia boards",
                baseFormula: "(deck_perimeter / 20) * 1.1",
                unit: "boards",
                unitCost: 22.00,
                exampleOutput: { deck_perimeter: 80, quantity: 4, total: 88.00 }
              }
            ]
          },
          {
            id: "stairs",
            name: "Stairs",
            condition: "stairs == true",
            components: [
              {
                key: "stringers",
                description: "2×12×10 ft stair stringers",
                baseFormula: "stair_count * 3",
                unit: "boards",
                unitCost: 28.00,
                exampleOutput: { stair_count: 1, quantity: 3, total: 84.00 }
              },
              {
                key: "stair_treads",
                description: "5/4×6×48 stair treads",
                baseFormula: "stair_count * 10",
                unit: "boards",
                unitCost: 9.00,
                exampleOutput: { stair_count: 1, quantity: 10, total: 90.00 }
              },
              {
                key: "stair_posts",
                description: "6×6×4 ft stair posts",
                baseFormula: "stair_count * 2",
                unit: "posts",
                unitCost: 24.00,
                exampleOutput: { stair_count: 1, quantity: 2, total: 48.00 }
              }
            ]
          },
          {
            id: "railings",
            name: "Railings & Safety",
            condition: "railings == true",
            components: [
              {
                key: "railing_posts",
                description: "4×4×42 railing posts",
                baseFormula: "(deck_perimeter / 6) + 4",
                unit: "posts",
                unitCost: 18.00,
                exampleOutput: { deck_perimeter: 80, quantity: 17, total: 306.00 }
              },
              {
                key: "top_bottom_rails",
                description: "2×4×10 ft top/bottom rails",
                baseFormula: "(deck_perimeter / 10) * 2",
                unit: "boards",
                unitCost: 8.50,
                exampleOutput: { deck_perimeter: 80, quantity: 16, total: 136.00 }
              },
              {
                key: "balusters",
                description: "36-inch balusters (4-inch spacing)",
                baseFormula: "deck_perimeter * 2.5",
                unit: "balusters",
                unitCost: 2.50,
                exampleOutput: { deck_perimeter: 80, quantity: 200, total: 500.00 }
              },
              {
                key: "cap_rail",
                description: "2×6×10 ft cap rail (optional)",
                baseFormula: "(deck_perimeter / 10) * 1.1",
                unit: "boards",
                unitCost: 14.00,
                exampleOutput: { deck_perimeter: 80, quantity: 9, total: 126.00 }
              }
            ]
          },
          {
            id: "foundation",
            name: "Foundation",
            components: [
              {
                key: "concrete_footings",
                description: "12-inch diameter × 36-inch deep footings",
                baseFormula: "deck_sqft / 50",
                unit: "footings",
                unitCost: 0,
                exampleOutput: { deck_sqft: 400, quantity: 8, total: 0 }
              },
              {
                key: "concrete_mix",
                description: "80-lb bags ready-mix concrete",
                baseFormula: "(deck_sqft / 50) * 2.5",
                unit: "bags",
                unitCost: 5.50,
                exampleOutput: { deck_sqft: 400, quantity: 20, total: 110.00 }
              },
              {
                key: "gravel_base",
                description: "½ cu ft gravel bags for drainage",
                baseFormula: "deck_sqft / 50",
                unit: "bags",
                unitCost: 6.00,
                exampleOutput: { deck_sqft: 400, quantity: 8, total: 48.00 }
              }
            ]
          },
          {
            id: "hardware",
            name: "Hardware & Connectors",
            components: [
              {
                key: "lag_screws",
                description: "½×6-inch galvanized lag screws/bolts",
                baseFormula: "(deck_width / 20) * 24",
                unit: "screws",
                unitCost: 0.75,
                exampleOutput: { deck_width: 20, quantity: 24, total: 18.00 }
              },
              {
                key: "joist_ties",
                description: "Joist-to-beam hurricane ties",
                baseFormula: "(deck_length / 1.33) + 2",
                unit: "ties",
                unitCost: 1.50,
                exampleOutput: { deck_length: 20, quantity: 17, total: 25.50 }
              },
              {
                key: "flashing_tape",
                description: "Flashing tape for ledger & joists",
                baseFormula: "deck_width * 2",
                unit: "linear feet",
                unitCost: 0.50,
                exampleOutput: { deck_width: 20, quantity: 40, total: 20.00 }
              },
              {
                key: "metal_flashing",
                description: "Metal flashing for ledger protection",
                baseFormula: "deck_width",
                unit: "linear feet",
                unitCost: 2.50,
                exampleOutput: { deck_width: 20, quantity: 20, total: 50.00 }
              }
            ]
          },
          {
            id: "optional",
            name: "Optional Upgrades",
            components: [
              {
                key: "lighting",
                description: "Post or step LED lights",
                baseFormula: "lighting_count",
                unit: "fixtures",
                unitCost: 35.00,
                condition: "lighting == true",
                exampleOutput: { lighting_count: 8, quantity: 8, total: 280.00 }
              },
              {
                key: "skirting",
                description: "Lattice/composite skirting panels",
                baseFormula: "deck_perimeter * 2.5",
                unit: "sq ft",
                unitCost: 3.50,
                condition: "skirting == true",
                exampleOutput: { deck_perimeter: 80, quantity: 200, total: 700.00 }
              },
              {
                key: "stain_sealant",
                description: "Deck stain/sealant (2 gal covers ~400 sq ft)",
                baseFormula: "deck_sqft / 200",
                unit: "gallons",
                unitCost: 45.00,
                condition: "deck_material == 'Pressure-treated wood' || deck_material == 'Cedar'",
                exampleOutput: { deck_sqft: 400, quantity: 2, total: 90.00 }
              }
            ]
          }
        ],
        laborRates: {
          baseRate: 50,
          baseSqFt: 400,
          baseHours: 32,
          adjustments: [
            { condition: "access == 'difficult'", multiplier: 1.20, description: "Narrow gate or limited access" },
            { condition: "deck_height >= 72", multiplier: 1.15, description: "High elevation requires scaffolding" },
            { condition: "slope == 'steep'", multiplier: 1.25, description: "Steep slopes need extra foundation work" }
          ]
        },
        semanticKeyMap: {
          deck_sqft: "Calculated from dimensions (length × width)",
          deck_width: "Extracted from 'deck dimensions' answer",
          deck_length: "Extracted from 'deck dimensions' answer",
          deck_perimeter: "Calculated as 2 × (length + width)",
          deck_material: "From 'material preference' question",
          deck_height: "Extracted from 'height from ground' answer in inches",
          stairs: "From 'need stairs' question (yes/no)",
          stair_count: "Number of stair sets needed",
          railings: "From 'need railings' question (yes/no)",
          heavy_load: "From 'heavy loads' question (hot tub, etc.)",
          lighting: "From 'electrical work' question",
          lighting_count: "Estimated from deck size",
          skirting: "From optional features",
          access: "From 'backyard access' question"
        }
      }
    },

    // LANDSCAPING MAINTENANCE - Residential (extracted from admin proposal)
    {
      sessionId: 'training-landscape-residential-1',
      serviceType: 'Landscaping',
      serviceDescription: 'Weekly lawn maintenance and landscaping for residential property',
      originalScope: 'TUDAO RESIDENTIAL LANDSCAPING MAINTENANCE SCOPE\n\n**LAWN CARE & MAINTENANCE:**\n- Professional mowing, edging, and trimming to maintain neat, well-groomed appearance\n- Edge walkways, driveways, and bed lines for clean, professional look\n- Remove grass clippings and debris from hard surfaces\n- Haul away all clippings and yard waste\n\n**SERVICE FREQUENCY & SCHEDULE:**\n- Weekly service during peak growing season (May-September)\n- Services include: mowing, edging, trimming, debris cleanup\n\n**QUALITY STANDARDS:**\n- Professional appearance maintained\n- Timely, reliable service\n- Customer satisfaction guaranteed',
      actualCost: 22000, // $220 monthly (4 weekly visits @ $55 each)
      materialsUsed: 'None (labor-only service)',
      actualManHours: 3.0, // 0.75 hrs × 4 visits
      customerRating: 5,
      propertyType: 'residential',
      rating: 'training',
      isTrainingExample: 1,
      dataSource: 'admin_seed',
      notes: 'Residential weekly lawn maintenance - monthly contract pricing ($55/visit × 4 visits)',
      questionAnswers: [
        {
          question: "What type of property is this for?",
          answer: "Residential home",
          phase: 1,
          phaseLabel: "Property Assessment",
          type: "choice",
          options: ["Residential home", "Commercial property", "Multi-family property", "HOA community"],
          guidance: "Property type affects quality standards and pricing. Residential properties typically have simpler requirements than commercial."
        },
        {
          question: "How often would you like landscaping maintenance?",
          answer: "Weekly (seasonal)",
          phase: 1,
          phaseLabel: "Service Planning",
          type: "choice",
          options: ["Weekly (year-round)", "Weekly (seasonal)", "Bi-weekly", "3 times per month", "Monthly", "Quarterly"],
          guidance: "Service frequency affects pricing and lawn health. Weekly service during growing season keeps lawns looking their best."
        },
        {
          question: "What services do you need?",
          answer: "Full service (mow, edge, trim, cleanup)",
          phase: 2,
          phaseLabel: "Service Details",
          type: "choice",
          options: ["Mowing only", "Mowing + edging", "Mowing + edging + trimming", "Full service (mow, edge, trim, cleanup)", "Custom combination"],
          guidance: "More services mean better curb appeal. Full service includes everything for a professional look."
        },
        {
          question: "Do you want fertilization included?",
          answer: "No, not at this time",
          phase: 2,
          phaseLabel: "Service Details",
          type: "choice",
          options: ["Yes, 3-4 times per year", "Yes, 2 times per year", "No, not at this time", "I already have a fertilization plan"],
          guidance: "Professional fertilization 3-4 times per year recommended for healthy, green lawns. Applications timed for grass type and season."
        },
        {
          question: "Do you need mulch bed maintenance?",
          answer: "No, lawn service only",
          phase: 2,
          phaseLabel: "Service Details",
          type: "choice",
          options: ["Yes, include mulch refresh", "Yes, include mulch + weeding", "No, lawn service only"],
          guidance: "Professional 2-3 inch mulch depth keeps beds looking neat. Helps retain moisture and prevent weeds."
        }
      ]
    },

    // LANDSCAPING MAINTENANCE - Commercial (extracted from admin proposal)
    {
      sessionId: 'training-landscape-commercial-1',
      serviceType: 'Landscaping',
      serviceDescription: 'Commercial property full-service landscaping maintenance (Walmart standards)',
      originalScope: 'COMPREHENSIVE LANDSCAPING MAINTENANCE SCOPE (Based on Walmart Best Practices)\n\n**SERVICE OVERVIEW:**\nFull-service commercial landscaping maintenance including lawn care, tree/shrub maintenance, mulch beds, irrigation monitoring, and trash removal.\n\n**LAWN CARE & GROUNDS MAINTENANCE:**\n- Mow, edge, and trim lawns to maintain even, well-groomed appearance during growing season\n- Edge sidewalks, curb runs, and planting areas weekly\n- Maintain trees, shrubs, groundcover, flower beds in healthy, vigorous condition\n- Remove all trash and debris from sidewalks, gutters, and planted areas\n- Weeds removed or killed weekly as they emerge\n\n**MULCH BED MAINTENANCE:**\n- Maintain mulch beds to 4-inch minimum depth (commercial standard)\n- Top-dress with matching color and material as needed\n- Mulch kept neat, groomed, and free of weeds\n\n**QUALITY STANDARDS:**\n- First-class condition maintained at all times\n- Professional commercial appearance',
      actualCost: 120000, // $1,200/month commercial contract (weekly comprehensive service)
      materialsUsed: 'Mulch, fertilizer, basic chemicals',
      actualManHours: 32, // 8 hrs × 4 weekly visits
      customerRating: 5,
      propertyType: 'commercial',
      rating: 'training',
      isTrainingExample: 1,
      dataSource: 'admin_seed',
      notes: 'Commercial property maintenance - Walmart quality standards - monthly contract pricing ($300/visit × 4 visits)',
      questionAnswers: [
        {
          question: "What type of property is this for?",
          answer: "Commercial property",
          phase: 1,
          phaseLabel: "Property Assessment",
          type: "choice",
          options: ["Residential home", "Commercial property", "Multi-family property", "HOA community"],
          guidance: "Commercial properties require higher standards and more comprehensive service than residential."
        },
        {
          question: "What quality standard should we maintain?",
          answer: "First-class commercial (Walmart/national retail standards)",
          phase: 1,
          phaseLabel: "Quality Standards",
          type: "choice",
          options: ["Basic maintenance (functional)", "Standard commercial (clean, professional)", "First-class commercial (Walmart/national retail standards)", "Premium commercial (high-end retail/office parks)"],
          guidance: "Quality level determines pricing. First-class means impeccable appearance at all times with zero tolerance for weeds or debris."
        },
        {
          question: "How often would you like landscaping maintenance?",
          answer: "Weekly (year-round)",
          phase: 2,
          phaseLabel: "Service Planning",
          type: "choice",
          options: ["Weekly (year-round)", "Weekly (seasonal)", "Bi-weekly", "3 times per month", "Monthly", "Quarterly"],
          guidance: "Commercial properties typically need weekly service to maintain professional appearance for customers."
        },
        {
          question: "What services do you need?",
          answer: "Full comprehensive (lawn, mulch, trees, irrigation, trash removal)",
          phase: 2,
          phaseLabel: "Service Details",
          type: "choice",
          options: ["Lawn care only", "Lawn + mulch beds", "Lawn + mulch + tree/shrub", "Full comprehensive (lawn, mulch, trees, irrigation, trash removal)"],
          guidance: "Comprehensive service ensures all aspects of your landscape look professional and inviting to customers."
        },
        {
          question: "Mulch bed maintenance requirements?",
          answer: "4 inch depth (commercial standard)",
          phase: 2,
          phaseLabel: "Service Details",
          type: "choice",
          options: ["2-3 inch depth (residential standard)", "4 inch depth (commercial standard)", "Premium mulch with landscape fabric", "No mulch beds"],
          guidance: "4-inch commercial depth provides superior weed control and professional appearance year-round."
        },
        {
          question: "Do you need irrigation system monitoring and maintenance?",
          answer: "Yes, monitoring + minor repairs",
          phase: 3,
          phaseLabel: "Optional Services",
          type: "choice",
          options: ["Yes, monitoring + minor repairs", "Yes, monitoring only", "No, we handle irrigation separately"],
          guidance: "Irrigation monitoring ensures proper watering times, conserves water, and catches issues early before costly damage."
        },
        {
          question: "Should we include trash and debris removal?",
          answer: "Yes, weekly from all areas",
          phase: 3,
          phaseLabel: "Optional Services",
          type: "choice",
          options: ["Yes, weekly from all areas", "Yes, parking lots and entry only", "No, custodial handles trash"],
          guidance: "Trash removal keeps your property looking clean and professional for customers at all times."
        }
      ]
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const job of trainingJobs) {
    try {
      const result = await storage.createCompletedJob(job);
      console.log(`✅ Added: ${job.serviceType} - $${job.actualCost} (${job.actualManHours}hrs)`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to add ${job.serviceType}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully added: ${successCount} jobs`);
  console.log(`   ❌ Failed: ${errorCount} jobs`);
  console.log(`\n🎯 Training data loaded! The RAG system now has real-world examples for:`);
  console.log(`   - Lawn Maintenance (labor-only, $50-85)`);
  console.log(`   - Landscape Installation (materials + labor, $890-2100)`);
  console.log(`   - Fence Repair (materials + labor, $180-650)`);
  console.log(`   - Pool Maintenance (labor-only, $120)`);
  console.log(`   - Gutter Cleaning (labor-only, $150)`);
  console.log(`\n✨ Ready to generate accurate scopes!\n`);
}

// Run the seed script
seedTrainingData()
  .then(() => {
    console.log('✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

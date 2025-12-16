import { db } from './db';
import { completedJobs } from '@shared/schema';

/**
 * Universal Training Data Seed
 * 
 * This bootstraps the RAG learning system with diverse service examples.
 * Each example includes:
 * - Customer questions & answers (what AI asked)
 * - Vendor clarifying questions (what SHOULD have been asked)
 * - Actual outcomes (man-hours, costs, materials)
 * 
 * The AI learns:
 * 1. Which questions to ask upfront
 * 2. What vendors typically need to clarify
 * 3. Cost patterns for different service types
 */

const trainingData = [
  // ========== DOOR INSTALLATION ==========
  {
    sessionId: 'train-door-1',
    serviceType: 'Door Installation',
    serviceDescription: 'Replace front door with new exterior door',
    originalScope: JSON.stringify({
      detailedDescription: 'Replace existing front door with solid wood exterior door, including new frame, weatherstripping, and hardware (handle and deadbolt). Door will be pre-hung 36" solid oak with decorative glass insert.',
      estimatedMaterialCost: 85000, // $850
      materialsNeeded: ['36" solid oak door', 'door frame kit', 'weatherstripping', 'door handle set', 'deadbolt', 'hinges', 'exterior paint/stain']
    }),
    providerType: 'Carpenter',
    actualManHours: 6,
    actualCost: 125000, // $1,250
    materialsUsed: 'Pre-hung oak door with glass insert, frame, Schlage handleset, deadbolt, weatherstripping',
    customerRating: 5,
    vendorId: null,
    completedAt: new Date('2024-11-01'),
    notes: 'Customer very happy. Door fits perfectly.',
    questionAnswers: [
      { question: 'Is this for an interior or exterior door?', answer: 'Exterior' },
      { question: 'What style are you looking for?', answer: 'Solid wood with some decorative glass' },
      { question: 'What material - wood, fiberglass, or steel?', answer: 'Wood' },
      { question: 'Does the frame need replacement too?', answer: 'Yes, the frame is rotted' }
    ],
    vendorQuestions: [
      { question: 'What color stain or paint do you want?', answer: 'Dark walnut stain', askedAt: '2024-10-28' },
      { question: 'Do you have a preference for hardware finish - brass, nickel, or bronze?', answer: 'Oil-rubbed bronze', askedAt: '2024-10-28' }
    ]
  },
  
  {
    sessionId: 'train-door-2',
    serviceType: 'Door Installation',
    serviceDescription: 'Need 3 interior bedroom doors replaced',
    originalScope: JSON.stringify({
      detailedDescription: 'Replace 3 interior bedroom doors with modern flat-panel hollow core doors. Includes painting to match existing trim.',
      estimatedMaterialCost: 42000, // $420
      materialsNeeded: ['3x hollow core doors', 'door handles', 'hinges', 'primer', 'paint']
    }),
    providerType: 'Carpenter',
    actualManHours: 8,
    actualCost: 65000, // $650
    materialsUsed: '3 hollow core slab doors, handles, paint',
    customerRating: 4,
    vendorId: null,
    completedAt: new Date('2024-10-15'),
    notes: 'Doors fit well. Paint took extra time to dry.',
    questionAnswers: [
      { question: 'Interior or exterior?', answer: 'Interior' },
      { question: 'What style - panel, flat slab, or French doors?', answer: 'Modern flat slab' },
      { question: 'How many doors?', answer: '3 bedroom doors' },
      { question: 'Do the frames need replacement?', answer: 'No, frames are fine' }
    ],
    vendorQuestions: [
      { question: 'What color paint?', answer: 'White to match trim', askedAt: '2024-10-12' },
      { question: 'Are current door handles staying or new ones?', answer: 'New handles, brushed nickel', askedAt: '2024-10-12' }
    ]
  },

  // ========== WINDOW INSTALLATION ==========
  {
    sessionId: 'train-window-1',
    serviceType: 'Window Installation',
    serviceDescription: 'Replace 5 old single-pane windows with energy efficient ones',
    originalScope: JSON.stringify({
      detailedDescription: 'Replace 5 single-pane windows with double-pane vinyl windows. Low-E coating for energy efficiency. Includes removal of old windows and installation of new frames.',
      estimatedMaterialCost: 275000, // $2,750
      materialsNeeded: ['5x double-pane vinyl windows', 'insulation foam', 'trim', 'caulk', 'paint']
    }),
    providerType: 'Window Installer',
    actualManHours: 16,
    actualCost: 420000, // $4,200
    materialsUsed: 'Andersen 400 series double-hung windows, spray foam insulation, vinyl trim',
    customerRating: 5,
    vendorId: null,
    completedAt: new Date('2024-10-20'),
    notes: 'Customer noticed immediate improvement in insulation',
    questionAnswers: [
      { question: 'What type of windows - double-hung, casement, or sliding?', answer: 'Double-hung' },
      { question: 'How many windows?', answer: '5 windows' },
      { question: 'Do you want energy efficient double or triple pane?', answer: 'Double pane with Low-E' },
      { question: 'What material - vinyl, wood, or aluminum?', answer: 'Vinyl for low maintenance' }
    ],
    vendorQuestions: [
      { question: 'What are the exact dimensions of each window opening?', answer: 'Will measure and provide', askedAt: '2024-10-17' },
      { question: 'Do you want grids/muntins on the windows?', answer: 'No grids, clean look', askedAt: '2024-10-17' }
    ]
  },

  // ========== ROOFING ==========
  {
    sessionId: 'train-roof-1',
    serviceType: 'Roofing',
    serviceDescription: 'Roof has storm damage, several shingles missing',
    originalScope: JSON.stringify({
      detailedDescription: 'Repair storm-damaged roof. Replace missing and damaged shingles on south and west sections (approx 300 sq ft). Inspect and repair flashing around chimney.',
      estimatedMaterialCost: 45000, // $450
      materialsNeeded: ['Asphalt shingles (3 bundles)', 'roofing nails', 'roof cement', 'flashing']
    }),
    providerType: 'Roofer',
    actualManHours: 8,
    actualCost: 95000, // $950
    materialsUsed: 'Architectural shingles (matching existing), aluminum flashing, roofing cement',
    customerRating: 5,
    vendorId: null,
    completedAt: new Date('2024-09-25'),
    notes: 'Also found and repaired some soffit damage from storm',
    questionAnswers: [
      { question: 'Is this a full roof replacement or repair?', answer: 'Just repair the damaged sections' },
      { question: 'What type of roofing material - asphalt shingle, tile, or metal?', answer: 'Asphalt shingles to match existing' },
      { question: 'How much area is damaged?', answer: 'Maybe 10-15 feet on two sides of the house' }
    ],
    vendorQuestions: [
      { question: 'What color are your existing shingles?', answer: 'Charcoal gray', askedAt: '2024-09-22' },
      { question: 'Do you know the brand/style to match them exactly?', answer: 'Not sure, previous owner installed', askedAt: '2024-09-22' },
      { question: 'Has there been any water damage inside from the missing shingles?', answer: 'No leaks noticed yet', askedAt: '2024-09-22' }
    ]
  },

  // ========== PLUMBING ==========
  {
    sessionId: 'train-plumb-1',
    serviceType: 'Plumbing',
    serviceDescription: 'Kitchen sink is leaking underneath',
    originalScope: JSON.stringify({
      detailedDescription: 'Replace leaking P-trap and supply lines under kitchen sink. Includes testing all connections and cleaning cabinet area.',
      estimatedMaterialCost: 8500, // $85
      materialsNeeded: ['P-trap assembly', 'braided supply lines', 'plumbers putty', 'teflon tape']
    }),
    providerType: 'Plumber',
    actualManHours: 2,
    actualCost: 28000, // $280
    materialsUsed: 'Chrome P-trap, braided steel supply lines',
    customerRating: 5,
    vendorId: null,
    completedAt: new Date('2024-11-02'),
    notes: 'Quick repair. No issues.',
    questionAnswers: [
      { question: 'Where exactly is the leak - faucet, drain, or supply lines?', answer: 'Under the sink where the drain connects' },
      { question: 'Is the sink a single or double basin?', answer: 'Double basin' },
      { question: 'How long has it been leaking?', answer: 'Just noticed it yesterday' }
    ],
    vendorQuestions: [
      { question: 'Do you have a garbage disposal connected?', answer: 'Yes', askedAt: '2024-10-30' }
    ]
  },

  // ========== PAINTING ==========
  {
    sessionId: 'train-paint-1',
    serviceType: 'Painting',
    serviceDescription: 'Need living room and dining room painted',
    originalScope: JSON.stringify({
      detailedDescription: 'Paint living room and dining room walls and ceiling. Includes wall prep, two coats premium paint. Total area approx 600 sq ft.',
      estimatedMaterialCost: 25000, // $250
      materialsNeeded: ['Premium interior paint (3 gallons)', 'primer', 'painters tape', 'drop cloths']
    }),
    providerType: 'Painter',
    actualManHours: 12,
    actualCost: 85000, // $850
    materialsUsed: 'Sherwin Williams Duration paint, primer, tape',
    customerRating: 5,
    vendorId: null,
    completedAt: new Date('2024-10-10'),
    notes: 'Customer loved the color choice. Clean job.',
    questionAnswers: [
      { question: 'Interior or exterior painting?', answer: 'Interior' },
      { question: 'How many rooms?', answer: 'Living room and dining room' },
      { question: 'Do ceilings need painting too?', answer: 'Yes please' },
      { question: 'Do you have a color in mind?', answer: 'Warm gray for walls, white for ceiling' }
    ],
    vendorQuestions: [
      { question: 'What finish - flat, eggshell, or satin?', answer: 'Eggshell for walls, flat for ceiling', askedAt: '2024-10-07' },
      { question: 'Do walls need any repairs or patching first?', answer: 'A few nail holes', askedAt: '2024-10-07' }
    ]
  },

  // ========== FLOORING ==========
  {
    sessionId: 'train-floor-1',
    serviceType: 'Flooring',
    serviceDescription: 'Replace carpet in 3 bedrooms with hardwood',
    originalScope: JSON.stringify({
      detailedDescription: 'Remove existing carpet and install oak hardwood flooring in 3 bedrooms (approx 450 sq ft total). Includes subfloor inspection and repair if needed.',
      estimatedMaterialCost: 320000, // $3,200
      materialsNeeded: ['Oak hardwood (500 sq ft)', 'underlayment', 'wood stain', 'polyurethane finish', 'baseboards']
    }),
    providerType: 'Flooring Contractor',
    actualManHours: 24,
    actualCost: 580000, // $5,800
    materialsUsed: '3/4" solid oak flooring, moisture barrier, Minwax stain, polyurethane',
    customerRating: 4,
    vendorId: null,
    completedAt: new Date('2024-09-15'),
    notes: 'Had to repair some subfloor joists. Took extra day.',
    questionAnswers: [
      { question: 'What type of flooring - hardwood, laminate, vinyl, or tile?', answer: 'Real hardwood' },
      { question: 'How many square feet approximately?', answer: 'Three bedrooms, maybe 400-500 sq ft total' },
      { question: 'Do you need the existing flooring removed?', answer: 'Yes, old carpet needs to go' }
    ],
    vendorQuestions: [
      { question: 'What wood species - oak, maple, cherry?', answer: 'Oak', askedAt: '2024-09-10' },
      { question: 'What stain color?', answer: 'Medium brown', askedAt: '2024-09-10' },
      { question: 'Do you want the baseboards replaced too?', answer: 'Yes if needed', askedAt: '2024-09-10' }
    ]
  },

  // ========== ELECTRICAL ==========
  {
    sessionId: 'train-elec-1',
    serviceType: 'Electrical',
    serviceDescription: 'Need ceiling fan installed in master bedroom',
    originalScope: JSON.stringify({
      detailedDescription: 'Install new ceiling fan with light in master bedroom. Includes mounting bracket, wiring to existing ceiling box, and installation of wall switch.',
      estimatedMaterialCost: 22000, // $220
      materialsNeeded: ['Ceiling fan with light', 'mounting bracket', 'wire nuts', 'wall switch']
    }),
    providerType: 'Electrician',
    actualManHours: 3,
    actualCost: 48000, // $480
    materialsUsed: 'Hunter ceiling fan, reinforced mounting bracket, dimmer switch',
    customerRating: 5,
    vendorId: null,
    completedAt: new Date('2024-10-25'),
    notes: 'Clean installation. Customer purchased their own fan.',
    questionAnswers: [
      { question: 'Is there already an existing light fixture or ceiling box?', answer: 'Yes, there is a light fixture now' },
      { question: 'Do you have the fan already or need us to provide one?', answer: 'I already bought a fan' },
      { question: 'Do you need a new wall switch installed?', answer: 'Yes, want separate controls for light and fan' }
    ],
    vendorQuestions: [
      { question: 'What is the ceiling height?', answer: '9 feet', askedAt: '2024-10-22' },
      { question: 'Is the existing ceiling box rated for fan weight?', answer: 'Not sure', askedAt: '2024-10-22' }
    ]
  },

  // ========== FENCE ==========
  {
    sessionId: 'train-fence-1',
    serviceType: 'Fence Installation',
    serviceDescription: 'Build 6-foot privacy fence along back property line',
    originalScope: JSON.stringify({
      detailedDescription: 'Install 6-foot cedar privacy fence along back property line (approx 120 linear feet). Includes posts set in concrete, fence panels, and gate.',
      estimatedMaterialCost: 280000, // $2,800
      materialsNeeded: ['Cedar fence panels', '4x4 posts', 'concrete mix', 'gate hardware', 'post caps']
    }),
    providerType: 'Fence Contractor',
    actualManHours: 32,
    actualCost: 520000, // $5,200
    materialsUsed: 'Western red cedar panels, pressure-treated posts, concrete, galvanized hardware',
    customerRating: 5,
    vendorId: null,
    completedAt: new Date('2024-08-30'),
    notes: 'Beautiful fence. Customer very pleased.',
    questionAnswers: [
      { question: 'What height fence - 4, 6, or 8 feet?', answer: '6 feet' },
      { question: 'What material - wood, vinyl, or chain link?', answer: 'Wood, preferably cedar' },
      { question: 'How many linear feet approximately?', answer: 'Back of property, maybe 100-120 feet' },
      { question: 'Do you need a gate?', answer: 'Yes, one gate' }
    ],
    vendorQuestions: [
      { question: 'Do we need to remove any existing fence?', answer: 'Yes, old chain link', askedAt: '2024-08-25' },
      { question: 'Should the fence be on your property line or setback a few inches?', answer: '3 inches inside property line', askedAt: '2024-08-25' }
    ]
  }
];

async function seedUniversalTraining() {
  console.log('🎯 Seeding Universal Training Data...\n');
  console.log('This bootstraps the RAG learning system with diverse examples across major service types.\n');
  
  try {
    let count = 0;
    for (const job of trainingData) {
      await db.insert(completedJobs).values(job);
      count++;
      const qCount = job.questionAnswers?.length || 0;
      const vCount = job.vendorQuestions?.length || 0;
      console.log(`✓ ${job.serviceType.padEnd(20)} | ${qCount} customer Q&A | ${vCount} vendor questions | $${(job.actualCost! / 100).toFixed(0)}`);
    }
    
    console.log(`\n✅ Successfully added ${count} training examples!`);
    console.log('\n📊 Coverage:');
    console.log('   • Door Installation (2 examples)');
    console.log('   • Window Installation (1 example)');
    console.log('   • Roofing (1 example)');
    console.log('   • Plumbing (1 example)');
    console.log('   • Painting (1 example)');
    console.log('   • Flooring (1 example)');
    console.log('   • Electrical (1 example)');
    console.log('   • Fence Installation (1 example)');
    
    console.log('\n💡 The RAG system will now:');
    console.log('   1. Learn which questions to ask upfront from customer Q&A');
    console.log('   2. Learn from vendor questions what details are often missed');
    console.log('   3. Find similarities between related services');
    console.log('   4. Improve questioning automatically as more jobs complete');
    
    console.log('\n🔄 Vendor Question Feedback Loop Active:');
    console.log('   When vendors ask clarifying questions → System learns → Future scopes ask better upfront questions\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedUniversalTraining();

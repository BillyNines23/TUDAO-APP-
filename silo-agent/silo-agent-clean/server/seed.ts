import { storage } from './storage';

const sampleJobs = [
  {
    sessionId: 'seed-1',
    serviceType: 'Fence Repair',
    serviceDescription: 'Replace broken fence boards and reinforce leaning posts',
    originalScope: 'Replace 8 damaged fence boards (6ft cedar), reinforce 3 leaning posts with concrete footings, repaint entire 50ft section with weatherproof stain. Includes removal of old materials and site cleanup.',
    actualManHours: 12,
    actualCost: 950,
    materialsUsed: 'Cedar boards, concrete mix, fence posts, exterior stain',
    customerRating: 5,
    vendorId: null,
    notes: 'Job completed ahead of schedule. Customer very satisfied.'
  },
  {
    sessionId: 'seed-2',
    serviceType: 'Fence Repair',
    serviceDescription: 'Fix wooden fence damaged by storm',
    originalScope: 'Replace entire 20ft section of privacy fence damaged by fallen tree. Install new posts and panels, paint to match existing fence.',
    actualManHours: 16,
    actualCost: 1400,
    materialsUsed: '4x4 posts, fence panels, concrete, paint',
    customerRating: 4,
    vendorId: null,
    notes: 'Required additional reinforcement due to soil conditions'
  },
  {
    sessionId: 'seed-3',
    serviceType: 'Landscaping',
    serviceDescription: 'Front yard landscaping with new plants and mulch',
    originalScope: 'Remove old landscaping, install 15 shrubs and 3 small trees, add decorative rock border, spread premium mulch across 300 sq ft beds. Includes soil preparation and 30-day plant guarantee.',
    actualManHours: 20,
    actualCost: 2200,
    materialsUsed: 'Assorted shrubs, trees, mulch, decorative rock, topsoil',
    customerRating: 5,
    vendorId: null,
    notes: 'Customer upgraded to premium plants during project'
  },
  {
    sessionId: 'seed-4',
    serviceType: 'Bathroom Renovation',
    serviceDescription: 'Update master bathroom with new tiles and fixtures',
    originalScope: 'Replace shower tiles (60 sq ft), install new vanity, toilet, and fixtures. Update lighting and ventilation. Includes waterproofing, tile work, plumbing connections, and final cleanup.',
    actualManHours: 48,
    actualCost: 6500,
    materialsUsed: 'Porcelain tiles, vanity unit, toilet, faucets, LED lighting',
    customerRating: 5,
    vendorId: null,
    notes: 'Complex tile pattern required extra time but turned out beautifully'
  },
  {
    sessionId: 'seed-5',
    serviceType: 'Plumbing Repair',
    serviceDescription: 'Fix leaking pipes under kitchen sink',
    originalScope: 'Replace corroded P-trap and supply lines under kitchen sink. Check for additional leaks, test all connections, clean cabinet area.',
    actualManHours: 3,
    actualCost: 320,
    materialsUsed: 'P-trap assembly, braided supply lines, plumber\'s putty',
    customerRating: 5,
    vendorId: null,
    notes: 'Quick turnaround, no issues'
  }
];

async function seedDatabase() {
  console.log('Seeding database with sample completed jobs...');
  
  try {
    for (const job of sampleJobs) {
      const created = await storage.createCompletedJob(job);
      console.log(`✓ Created job: ${created.serviceType} (${created.actualManHours} man-hours, $${created.actualCost})`);
    }
    
    console.log('\nSeeding complete! Added', sampleJobs.length, 'completed jobs');
    console.log('\nRAG is now ready to use historical data for scope generation.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();

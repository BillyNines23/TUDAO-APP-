import { storage } from './storage';

/**
 * Seed production standards based on real-world industry benchmarks
 * Run with: npx tsx server/seedProductionStandards.ts
 */
async function seedProductionStandards() {
  try {
    console.log('Seeding production standards with industry benchmarks...\n');
    
    const standards = [];
    
    // ===== FENCING SERVICES =====
    
    // Vinyl Fence Installation (2-person crew)
    // Industry: 12-33 linear feet per hour (avg ~20 ft/hr)
    // Labor: 0.05 hrs/ft (20 ft/hr) for 2-person crew
    // Materials: $15-25/ft for 6ft vinyl privacy fence
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Fence Installation',
      itemDescription: 'Vinyl fence 6ft privacy',
      unitOfMeasure: 'linear_feet',
      laborHoursPerUnit: 0.05, // 20 linear feet per hour (2-person crew)
      materialCostPerUnit: 2000, // $20.00 per linear foot (in cents)
      notes: '2-person crew productivity. Includes post installation, concrete setting, panel attachment. Average conditions.',
      source: 'manual',
    }));
    
    // Also add for Carpentry category (AI may classify either way)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Carpentry',
      subcategory: 'Fence installation',
      itemDescription: 'Vinyl fence 6ft privacy',
      unitOfMeasure: 'linear_feet',
      laborHoursPerUnit: 0.05,
      materialCostPerUnit: 2000,
      notes: '2-person crew productivity. Includes post installation, concrete setting, panel attachment.',
      source: 'manual',
    }));
    
    // Chain Link Fence Installation
    // Industry: 150+ linear feet per day = ~19 ft/hr
    // Labor: 0.053 hrs/ft (19 ft/hr) for 2-person crew
    // Materials: $8-15/ft for residential chain link
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Fence Installation',
      itemDescription: 'Chain link fence residential',
      unitOfMeasure: 'linear_feet',
      laborHoursPerUnit: 0.053, // ~19 linear feet per hour
      materialCostPerUnit: 1200, // $12.00 per linear foot
      notes: '2-person crew productivity. Faster than vinyl due to simpler installation.',
      source: 'manual',
    }));
    
    standards.push(await storage.createProductionStandard({
      serviceType: 'Carpentry',
      subcategory: 'Fence installation',
      itemDescription: 'Chain link fence residential',
      unitOfMeasure: 'linear_feet',
      laborHoursPerUnit: 0.053,
      materialCostPerUnit: 1200,
      notes: '2-person crew productivity. Faster than vinyl due to simpler installation.',
      source: 'manual',
    }));
    
    // ===== PAINTING SERVICES =====
    
    // Interior Painting
    // Industry: 80-100 sq meters per day = 860-1076 sq ft per day = ~107 sq ft/hr
    // Labor: 0.0093 hrs/sq ft (107 sq ft/hr) per painter
    // Materials: $0.50-1.00/sq ft for paint and supplies
    standards.push(await storage.createProductionStandard({
      serviceType: 'Painting',
      subcategory: 'Interior Painting',
      itemDescription: 'Interior wall painting standard',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.0093, // ~107 sq ft per hour per painter
      materialCostPerUnit: 75, // $0.75 per square foot (paint + supplies)
      notes: 'Single painter productivity. Includes prep, painting, and cleanup time.',
      source: 'manual',
    }));
    
    // ===== MASONRY SERVICES =====
    
    // Bricklaying
    // Industry: 1.0-1.2 cubic meters per day (mason + helper)
    // 1 cubic meter = 35.3 cubic feet
    // Labor: 0.073 hrs/cubic ft (11 cubic ft/hr for 2-person crew)
    // Materials: Varies greatly by brick type
    standards.push(await storage.createProductionStandard({
      serviceType: 'Masonry',
      subcategory: 'Brickwork',
      itemDescription: 'Standard brick laying',
      unitOfMeasure: 'cubic_feet',
      laborHoursPerUnit: 0.073, // ~11 cubic feet per hour (mason + helper)
      materialCostPerUnit: 2500, // $25.00 per cubic foot (bricks + mortar)
      notes: 'Mason + helper crew productivity. Includes mortar mixing, laying, and cleanup.',
      source: 'manual',
    }));
    
    console.log(`✓ Created ${standards.length} production standards\n`);
    
    // Display examples
    console.log('=== EXAMPLE CALCULATIONS ===\n');
    
    console.log('200 ft Vinyl Privacy Fence:');
    console.log('  Labor: 200 ft × 0.05 hrs/ft = 10 hours (2-person crew)');
    console.log('  Materials: 200 ft × $20/ft = $4,000');
    console.log('  At $65/hr labor rate = $650 labor + $4,000 materials = $4,650 total\n');
    
    console.log('100 ft Chain Link Fence:');
    console.log('  Labor: 100 ft × 0.053 hrs/ft = 5.3 hours (2-person crew)');
    console.log('  Materials: 100 ft × $12/ft = $1,200');
    console.log('  At $65/hr = $345 labor + $1,200 materials = $1,545 total\n');
    
    console.log('500 sq ft Interior Painting:');
    console.log('  Labor: 500 sq ft × 0.0093 hrs/sq ft = 4.65 hours (1 painter)');
    console.log('  Materials: 500 sq ft × $0.75/sq ft = $375');
    console.log('  At $55/hr = $256 labor + $375 materials = $631 total\n');
    
    console.log('50 cubic ft Brickwork:');
    console.log('  Labor: 50 cu ft × 0.073 hrs/cu ft = 3.65 hours (mason + helper)');
    console.log('  Materials: 50 cu ft × $25/cu ft = $1,250');
    console.log('  At $75/hr = $274 labor + $1,250 materials = $1,524 total\n');
    
    console.log('Note: General rule of thumb - Labor ≈ 2× Materials');
    console.log('(These examples show material-heavy scenarios; adjust as needed)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding production standards:', error);
    process.exit(1);
  }
}

seedProductionStandards();

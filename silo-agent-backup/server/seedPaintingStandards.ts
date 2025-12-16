import { storage } from './storage';

/**
 * Seed painting services production standards based on industry benchmarks
 * Run with: npx tsx server/seedPaintingStandards.ts
 */
async function seedPaintingStandards() {
  try {
    console.log('Seeding painting services production standards...\n');
    
    const standards = [];
    
    // ===== INTERIOR PAINTING =====
    
    // Interior Painting - Standard (average job, 2 coats)
    // Industry: 150-200 sq ft per hour per painter (avg 175 sq ft/hr)
    // Labor: 0.0057 hrs/sq ft (175 sq ft/hr)
    // Materials: $0.50-1.00/sq ft for paint and supplies (avg $0.75)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Painting',
      subcategory: 'Interior Painting',
      itemDescription: 'Interior wall painting standard 2 coats',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.0057, // 175 sq ft per hour per painter
      materialCostPerUnit: 75, // $0.75 per sq ft (paint + supplies)
      notes: 'Standard walls, brush and roller, 2 coats. Professional painter productivity: 150-200 sq ft/hr.',
      source: 'manual',
    }));
    
    // Interior Painting - High Ceilings (vaulted/10ft+)
    // Slower due to ladders/lifts required
    // Labor: 0.008 hrs/sq ft (~125 sq ft/hr - 30% slower)
    // Materials: Same as standard
    standards.push(await storage.createProductionStandard({
      serviceType: 'Painting',
      subcategory: 'Interior Painting',
      itemDescription: 'Interior painting high ceilings 10ft+',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.008, // 125 sq ft per hour (slower with ladders/lifts)
      materialCostPerUnit: 75, // $0.75 per sq ft
      notes: 'High or vaulted ceilings requiring specialized equipment. ~30% slower than standard height.',
      source: 'manual',
    }));
    
    // Interior Painting - Complex (intricate trim, multiple colors)
    // Slower due to detail work
    // Labor: 0.01 hrs/sq ft (~100 sq ft/hr - 45% slower)
    // Materials: Higher due to multiple colors
    standards.push(await storage.createProductionStandard({
      serviceType: 'Painting',
      subcategory: 'Interior Painting',
      itemDescription: 'Interior painting complex with trim',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.01, // 100 sq ft per hour (intricate work)
      materialCostPerUnit: 100, // $1.00 per sq ft (multiple colors, extra prep)
      notes: 'Intricate trim, multiple colors per room, specialty finishes. Significantly slower than simple walls.',
      source: 'manual',
    }));
    
    // ===== EXTERIOR PAINTING =====
    
    // Exterior House Painting
    // Industry: 1,500-2,000 sq ft house takes 3-person crew 3-5 days (avg 4 days)
    // Total hours: 3 people × 8 hrs/day × 4 days = 96 hours for 1,750 sq ft
    // Labor: 0.055 hrs/sq ft (~18 sq ft/hr) - includes extensive prep work
    // Materials: $1.00-2.00/sq ft for exterior paint
    standards.push(await storage.createProductionStandard({
      serviceType: 'Painting',
      subcategory: 'Exterior Painting',
      itemDescription: 'Exterior house painting standard',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.055, // ~18 sq ft per hour (includes extensive prep)
      materialCostPerUnit: 150, // $1.50 per sq ft (exterior paint)
      notes: 'Includes power washing, scraping, repairs, priming. 1,500-2,000 sq ft house = 3-person crew, 3-5 days.',
      source: 'manual',
    }));
    
    // Exterior Painting - Sprayer (large clear areas)
    // Faster application but still requires prep work
    // Labor: 0.04 hrs/sq ft (~25 sq ft/hr)
    // Materials: Same as standard but more paint due to overspray
    standards.push(await storage.createProductionStandard({
      serviceType: 'Painting',
      subcategory: 'Exterior Painting',
      itemDescription: 'Exterior painting with sprayer',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.04, // ~25 sq ft per hour (faster application)
      materialCostPerUnit: 175, // $1.75 per sq ft (more paint due to overspray)
      notes: 'Large clear areas with paint sprayer. Faster application but still requires extensive prep work.',
      source: 'manual',
    }));
    
    // ===== TRIM WORK =====
    
    // Trim and Baseboards (by linear foot)
    // More detailed work, estimated per linear foot
    // Labor: 0.1 hrs per linear foot (~10 linear ft/hr)
    // Materials: $0.50/ft for trim paint
    standards.push(await storage.createProductionStandard({
      serviceType: 'Painting',
      subcategory: 'Trim Painting',
      itemDescription: 'Trim and baseboard painting',
      unitOfMeasure: 'linear_feet',
      laborHoursPerUnit: 0.1, // 10 linear feet per hour (detailed work)
      materialCostPerUnit: 50, // $0.50 per linear foot
      notes: 'Detailed trim work estimated by linear foot. Includes baseboards, crown molding, door/window trim.',
      source: 'manual',
    }));
    
    console.log(`✓ Created ${standards.length} painting service production standards\n`);
    
    // Display examples
    console.log('=== EXAMPLE CALCULATIONS ===\n');
    
    console.log('500 sq ft Interior Room (Standard):');
    console.log('  Labor: 500 sq ft × 0.0057 hrs/sq ft = 2.85 hours (~3 hours)');
    console.log('  Materials: 500 sq ft × $0.75/sq ft = $375');
    console.log('  At $55/hr = $157 labor + $375 materials = $532 total');
    console.log('  Productivity: ~175 sq ft per painter per hour\n');
    
    console.log('500 sq ft Room with High Ceilings:');
    console.log('  Labor: 500 sq ft × 0.008 hrs/sq ft = 4 hours');
    console.log('  Materials: 500 sq ft × $0.75/sq ft = $375');
    console.log('  At $55/hr = $220 labor + $375 materials = $595 total');
    console.log('  Note: 30% more time due to ladders/lifts required\n');
    
    console.log('300 sq ft Complex Room (intricate trim, multiple colors):');
    console.log('  Labor: 300 sq ft × 0.01 hrs/sq ft = 3 hours');
    console.log('  Materials: 300 sq ft × $1.00/sq ft = $300');
    console.log('  At $55/hr = $165 labor + $300 materials = $465 total\n');
    
    console.log('1,750 sq ft Exterior House:');
    console.log('  Labor: 1,750 sq ft × 0.055 hrs/sq ft = 96 hours');
    console.log('  Materials: 1,750 sq ft × $1.50/sq ft = $2,625');
    console.log('  At $55/hr = $5,280 labor + $2,625 materials = $7,905 total');
    console.log('  Crew: 3 people × 8 hrs/day × 4 days = 96 hours');
    console.log('  Includes: Power washing, scraping, repairs, priming, 2 coats\n');
    
    console.log('100 linear ft Trim Work:');
    console.log('  Labor: 100 ft × 0.1 hrs/ft = 10 hours');
    console.log('  Materials: 100 ft × $0.50/ft = $50');
    console.log('  At $55/hr = $550 labor + $50 materials = $600 total');
    console.log('  Productivity: ~10 linear feet per hour (detailed work)\n');
    
    console.log('📌 KEY FACTORS AFFECTING PRODUCTION:');
    console.log('   • Surface condition (patching, sanding, scraping)');
    console.log('   • Ceiling height (ladders/lifts slow work by ~30%)');
    console.log('   • Number of coats (most quotes assume 2 coats)');
    console.log('   • Complexity (trim, colors, specialty finishes)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding painting standards:', error);
    process.exit(1);
  }
}

seedPaintingStandards();

import { storage } from './storage';

/**
 * Seed roofing services production standards based on industry benchmarks
 * Run with: npx tsx server/seedRoofingStandards.ts
 * 
 * Note: Roofing measured in "squares" (1 square = 100 sq ft of roof surface)
 */
async function seedRoofingStandards() {
  try {
    console.log('Seeding roofing services production standards...\n');
    
    const standards = [];
    
    // ===== ASPHALT SHINGLE ROOFING =====
    
    // Asphalt Shingle Installation - Simple Roof (install only)
    // Industry: 1.5-2.5 squares per hour (avg 2 squares/hr)
    // Labor: 0.5 hrs per square
    // Labor Cost: $200-350 per square (avg $275)
    // Materials: $100-150 per square for shingles, underlayment, nails
    standards.push(await storage.createProductionStandard({
      serviceType: 'Roofing',
      subcategory: 'Asphalt Shingle Installation',
      itemDescription: 'Asphalt shingle install simple roof',
      unitOfMeasure: 'squares',
      laborHoursPerUnit: 0.5, // 2 squares per hour
      materialCostPerUnit: 12500, // $125 per square (shingles + underlayment)
      notes: 'Simple gable roof, 4/12-6/12 pitch. Installation only (no tear-off). 1 square = 100 sq ft.',
      source: 'manual',
    }));
    
    // Asphalt Shingle Installation - Complex Roof
    // Slower due to hips, valleys, chimneys, skylights
    // Labor: 0.75 hrs per square (50% slower)
    // Materials: Same base cost + extra for waste
    standards.push(await storage.createProductionStandard({
      serviceType: 'Roofing',
      subcategory: 'Asphalt Shingle Installation',
      itemDescription: 'Asphalt shingle install complex roof',
      unitOfMeasure: 'squares',
      laborHoursPerUnit: 0.75, // ~1.3 squares per hour
      materialCostPerUnit: 14000, // $140 per square (more waste from cutting)
      notes: 'Complex roof: many hips, valleys, chimneys, skylights. Requires more cutting and fitting.',
      source: 'manual',
    }));
    
    // Asphalt Shingle - Full Roof Replacement (tear-off + install)
    // Industry: 4-6 person crew, 15-25 squares in 8 hours
    // Example: 5-person crew, 20 squares, 8 hours = 40 man-hours ÷ 20 squares = 2 hrs/square
    // Labor: 2 hrs per square (includes tear-off, disposal, install)
    // Materials: Same as install + disposal fees
    standards.push(await storage.createProductionStandard({
      serviceType: 'Roofing',
      subcategory: 'Roof Replacement',
      itemDescription: 'Full roof replacement tear-off and install',
      unitOfMeasure: 'squares',
      laborHoursPerUnit: 2.0, // Includes tear-off and install
      materialCostPerUnit: 15000, // $150 per square (includes disposal fees)
      notes: 'Complete replacement: tear-off old shingles, install new. Typical crew-based job.',
      source: 'manual',
    }));
    
    // Steep Pitch Roofing (7/12 and above)
    // Requires safety equipment, slower work
    // Labor: 1.0 hrs per square (2x slower than simple)
    // Materials: Same + safety equipment cost
    standards.push(await storage.createProductionStandard({
      serviceType: 'Roofing',
      subcategory: 'Asphalt Shingle Installation',
      itemDescription: 'Steep pitch roof 7/12 and above',
      unitOfMeasure: 'squares',
      laborHoursPerUnit: 1.0, // 1 square per hour (much slower)
      materialCostPerUnit: 13000, // $130 per square
      notes: 'Steep pitch (7/12+) requires harnesses, scaffolding. Significantly slower and more dangerous.',
      source: 'manual',
    }));
    
    // Multiple Layer Tear-off
    // Extra labor for removing 2+ layers of old shingles
    // Labor: Additional 1 hr per square for each layer beyond first
    // Materials: Higher disposal costs
    standards.push(await storage.createProductionStandard({
      serviceType: 'Roofing',
      subcategory: 'Roof Tear-off',
      itemDescription: 'Multiple layer tear-off 2+ layers',
      unitOfMeasure: 'squares',
      laborHoursPerUnit: 1.0, // Additional 1 hr per square per extra layer
      materialCostPerUnit: 5000, // $50 per square (disposal costs)
      notes: 'Additional time/cost for removing multiple layers of old shingles. Add to base replacement cost.',
      source: 'manual',
    }));
    
    console.log(`✓ Created ${standards.length} roofing service production standards\n`);
    
    // Display examples
    console.log('=== EXAMPLE CALCULATIONS ===\n');
    
    console.log('20 Squares Simple Roof (install only):');
    console.log('  Labor: 20 squares × 0.5 hrs/square = 10 hours');
    console.log('  Materials: 20 squares × $125/square = $2,500');
    console.log('  At $75/hr = $750 labor + $2,500 materials = $3,250 total');
    console.log('  Per square cost: $162.50/square (2,000 sq ft roof)\n');
    
    console.log('20 Squares Complex Roof (hips, valleys, skylights):');
    console.log('  Labor: 20 squares × 0.75 hrs/square = 15 hours');
    console.log('  Materials: 20 squares × $140/square = $2,800');
    console.log('  At $75/hr = $1,125 labor + $2,800 materials = $3,925 total');
    console.log('  Per square cost: $196.25/square (50% more time)\n');
    
    console.log('20 Squares Full Replacement (tear-off + install):');
    console.log('  Labor: 20 squares × 2.0 hrs/square = 40 hours');
    console.log('  Materials: 20 squares × $150/square = $3,000');
    console.log('  At $75/hr = $3,000 labor + $3,000 materials = $6,000 total');
    console.log('  Per square cost: $300/square');
    console.log('  Crew efficiency: 5-person crew × 8 hrs = 40 man-hours\n');
    
    console.log('15 Squares Steep Pitch Roof (7/12+):');
    console.log('  Labor: 15 squares × 1.0 hrs/square = 15 hours');
    console.log('  Materials: 15 squares × $130/square = $1,950');
    console.log('  At $75/hr = $1,125 labor + $1,950 materials = $3,075 total');
    console.log('  Per square cost: $205/square (safety equipment required)\n');
    
    console.log('20 Squares with 2 Layers Tear-off:');
    console.log('  Base replacement: 20 × 2.0 hrs = 40 hours');
    console.log('  Extra layer removal: 20 × 1.0 hrs = 20 hours');
    console.log('  Total labor: 60 hours × $75/hr = $4,500');
    console.log('  Materials: (20 × $150) + (20 × $50 disposal) = $4,000');
    console.log('  Total: $4,500 labor + $4,000 materials = $8,500');
    console.log('  Per square cost: $425/square (2 layers)\n');
    
    console.log('📌 KEY FACTORS AFFECTING ROOFING PRODUCTION:');
    console.log('   • Pitch (steepness): 7/12+ requires safety equipment (2x slower)');
    console.log('   • Complexity: hips, valleys, chimneys, skylights add 50% time');
    console.log('   • Layers: multiple old layers add 1 hr/square per layer');
    console.log('   • Material type: asphalt fastest, tile/slate much slower');
    console.log('   • Accessibility: delivery method affects efficiency');
    console.log('   • Weather: extreme heat or rain halts work\n');
    
    console.log('📏 MEASUREMENT NOTE:');
    console.log('   • 1 square = 100 square feet of roof surface');
    console.log('   • Average house roof: 15-25 squares (1,500-2,500 sq ft)');
    console.log('   • Labor typically: $200-350/square (industry standard)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roofing standards:', error);
    process.exit(1);
  }
}

seedRoofingStandards();

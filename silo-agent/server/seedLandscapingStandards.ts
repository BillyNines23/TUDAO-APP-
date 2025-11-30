import { storage } from './storage';

/**
 * Seed landscaping production standards based on industry benchmarks
 * Run with: npx tsx server/seedLandscapingStandards.ts
 */
async function seedLandscapingStandards() {
  try {
    console.log('Seeding landscaping production standards...\n');
    
    const standards = [];
    
    // ===== LAWN MOWING =====
    
    // Commercial Lawn Mowing
    // Industry: 1.5-3 acres per hour (avg ~2 acres/hr)
    // 1 acre = 43,560 sq ft, so 2 acres = 87,120 sq ft/hr
    // Labor: 0.0000115 hrs/sq ft (87,120 sq ft/hr)
    // Materials: Minimal (fuel, blade wear) ~$0.02/sq ft
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Lawn Mowing',
      itemDescription: 'Commercial lawn mowing',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.0000115, // ~87,120 sq ft per hour
      materialCostPerUnit: 2, // $0.02 per sq ft (fuel, equipment wear)
      notes: 'Commercial-grade equipment. Rate varies with terrain complexity and mower deck size.',
      source: 'manual',
    }));
    
    // Residential Lawn Mowing
    // Industry: 5,000-10,000 sq ft in 45-75 min (avg 7,500 sq ft in 60 min)
    // Labor: 0.000133 hrs/sq ft (7,500 sq ft/hr)
    // Materials: ~$0.03/sq ft for residential
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Lawn Mowing',
      itemDescription: 'Residential lawn mowing',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.000133, // ~7,500 sq ft per hour
      materialCostPerUnit: 3, // $0.03 per sq ft
      notes: 'Residential service. Often priced per visit rather than strictly hourly. Includes trimming and edging.',
      source: 'manual',
    }));
    
    // ===== SOD INSTALLATION =====
    
    // Sod Installation
    // Industry: 400-1,000 sq ft per person in 4-8 hours (avg ~700 sq ft in 6 hrs)
    // Labor: 0.0086 hrs/sq ft (116 sq ft/hr per person)
    // Materials: $0.30-0.80/sq ft for sod + prep materials
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Sod Installation',
      itemDescription: 'Sod installation with ground prep',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.0086, // ~116 sq ft per hour per person
      materialCostPerUnit: 55, // $0.55 per sq ft (sod + soil prep)
      notes: 'Includes ground preparation, sod laying, and rolling. Rate varies with soil condition.',
      source: 'manual',
    }));
    
    // ===== TREE PLANTING =====
    
    // Tree Planting (3-ft caliper)
    // Industry: 3-4 labor hours per tree
    // Labor: 3.5 hrs/tree
    // Materials: Tree cost varies widely ($100-500+ per tree)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Tree Planting',
      itemDescription: 'Tree planting 3ft caliper',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 3.5, // 3.5 hours per tree
      materialCostPerUnit: 25000, // $250 per tree (average)
      notes: 'Includes digging, moving, planting, and initial watering. Tree cost varies by species and size.',
      source: 'manual',
    }));
    
    // Smaller trees (1-2 ft caliper) - faster to plant
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Tree Planting',
      itemDescription: 'Tree planting small 1-2ft caliper',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 1.5, // 1.5 hours per small tree
      materialCostPerUnit: 10000, // $100 per small tree
      notes: 'Small ornamental or shade trees. Faster installation than large caliper trees.',
      source: 'manual',
    }));
    
    // ===== MULCH SPREADING =====
    
    // Manual Mulch Spreading (baseline)
    // Industry: ~1 cubic yard per man-hour (average conditions)
    // Industry Pricing: $65-75 per yard installed (labor + materials)
    // Labor: 1 hr per cubic yard
    // Materials: $15-20 per cubic yard (to hit $70 installed with $55/hr labor)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Mulch Installation',
      itemDescription: 'Manual mulch spreading standard',
      unitOfMeasure: 'cubic_yards',
      laborHoursPerUnit: 1.0, // 1 cubic yard per hour
      materialCostPerUnit: 1500, // $15 per cubic yard (bulk mulch cost)
      notes: 'Baseline: 1 yard/hr. Industry charges $65-75/yard installed. Reasonable distance, level ground, wheelbarrow.',
      source: 'manual',
    }));
    
    // Mulch Spreading - Difficult Conditions
    // Factors: Long distance, slopes, dense plantings, wet mulch
    // Labor: 1.5 hrs per cubic yard (50% slower)
    // Materials: Same as standard
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Mulch Installation',
      itemDescription: 'Manual mulch spreading difficult conditions',
      unitOfMeasure: 'cubic_yards',
      laborHoursPerUnit: 1.5, // 1.5 hours per cubic yard
      materialCostPerUnit: 1500, // $15 per cubic yard
      notes: 'Difficult conditions: long distance, slopes/stairs, dense plantings, wet mulch. 50% slower than baseline.',
      source: 'manual',
    }));
    
    // Mulch Spreading - Efficient Crew (commercial sites)
    // Experienced crews on large, easy-access sites
    // Labor: 0.4 hrs per cubic yard (2.5 yards/hr)
    // Materials: Bulk pricing (lower cost at volume)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Mulch Installation',
      itemDescription: 'Mulch spreading efficient crew commercial',
      unitOfMeasure: 'cubic_yards',
      laborHoursPerUnit: 0.4, // 2.5 cubic yards per hour
      materialCostPerUnit: 1200, // $12 per cubic yard (bulk pricing)
      notes: 'Experienced crews on large, easy-access commercial sites. Coordinated crew reaches 2-3 yards/hr.',
      source: 'manual',
    }));
    
    // Mulch Blower Truck (commercial)
    // Industry: ~15 cubic yards per hour (2-man crew)
    // Labor: 0.267 hrs per cubic yard (2-man crew)
    // Materials: Includes truck rental/depreciation
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Mulch Installation',
      itemDescription: 'Mulch installation with blower truck',
      unitOfMeasure: 'cubic_yards',
      laborHoursPerUnit: 0.267, // 15 yards/hr with 2-person crew
      materialCostPerUnit: 2000, // $20 per cubic yard (includes truck rental cost)
      notes: 'Blower truck: 2-man crew ~15 yards/hr. Best for large commercial jobs with truck access.',
      source: 'manual',
    }));
    
    // ===== YARD CLEANUP =====
    
    // Weeding and Mulching
    // Industry: 2-4 hours for average yard
    // This is job-based rather than per-unit, but we can estimate per sq ft
    // Assume "average yard" = 2,000 sq ft of beds
    // Labor: 3 hrs / 2,000 sq ft = 0.0015 hrs/sq ft
    // Materials: $0.05-0.10/sq ft for mulch
    standards.push(await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Yard Cleanup',
      itemDescription: 'Weeding and mulching garden beds',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.0015, // ~667 sq ft per hour
      materialCostPerUnit: 8, // $0.08 per sq ft (mulch)
      notes: 'Highly variable based on current yard condition. Includes weeding, edging, and mulch application.',
      source: 'manual',
    }));
    
    console.log(`✓ Created ${standards.length} landscaping production standards\n`);
    
    // Display examples
    console.log('=== EXAMPLE CALCULATIONS ===\n');
    
    console.log('10,000 sq ft Commercial Lawn Mowing:');
    console.log('  Labor: 10,000 sq ft × 0.0000115 hrs/sq ft = 0.115 hours (~7 min)');
    console.log('  Materials: 10,000 sq ft × $0.02/sq ft = $200');
    console.log('  At $65/hr = $7.50 labor + $200 fuel/wear = $207.50 per service\n');
    
    console.log('5,000 sq ft Residential Lawn Mowing:');
    console.log('  Labor: 5,000 sq ft × 0.000133 hrs/sq ft = 0.67 hours (~40 min)');
    console.log('  Materials: 5,000 sq ft × $0.03/sq ft = $150');
    console.log('  At $55/hr = $37 labor + $150 = $187 per visit\n');
    
    console.log('1,000 sq ft Sod Installation:');
    console.log('  Labor: 1,000 sq ft × 0.0086 hrs/sq ft = 8.6 hours');
    console.log('  Materials: 1,000 sq ft × $0.55/sq ft = $550 (sod + prep)');
    console.log('  At $65/hr = $559 labor + $550 materials = $1,109 total\n');
    
    console.log('Planting 5 Trees (3ft caliper):');
    console.log('  Labor: 5 trees × 3.5 hrs/tree = 17.5 hours');
    console.log('  Materials: 5 trees × $250/tree = $1,250');
    console.log('  At $65/hr = $1,138 labor + $1,250 trees = $2,388 total\n');
    
    console.log('500 sq ft Garden Bed Cleanup (weeding + mulch):');
    console.log('  Labor: 500 sq ft × 0.0015 hrs/sq ft = 0.75 hours (~45 min)');
    console.log('  Materials: 500 sq ft × $0.08/sq ft = $40 (mulch)');
    console.log('  At $55/hr = $41 labor + $40 mulch = $81 total\n');
    
    console.log('10 Cubic Yards Manual Mulch Spreading (standard):');
    console.log('  Labor: 10 yards × 1.0 hrs/yard = 10 hours');
    console.log('  Materials: 10 yards × $15/yard = $150');
    console.log('  At $55/hr = $550 labor + $150 mulch = $700 total');
    console.log('  Installed price: $70/yard (industry standard $65-75/yard)\n');
    
    console.log('10 Cubic Yards Mulch Spreading (difficult conditions):');
    console.log('  Labor: 10 yards × 1.5 hrs/yard = 15 hours');
    console.log('  Materials: 10 yards × $15/yard = $150');
    console.log('  At $55/hr = $825 labor + $150 mulch = $975 total');
    console.log('  Installed price: $97.50/yard (50% more time due to difficulty)\n');
    
    console.log('50 Cubic Yards Mulch with Blower Truck:');
    console.log('  Labor: 50 yards × 0.267 hrs/yard = 13.35 hours (2-person crew)');
    console.log('  Materials: 50 yards × $20/yard = $1,000 (includes truck cost)');
    console.log('  At $65/hr = $868 labor + $1,000 = $1,868 total');
    console.log('  Installed price: $37.36/yard (much more efficient!)\n');
    
    console.log('📌 MULCH FACTORS AFFECTING PRODUCTION:');
    console.log('   • Distance from pile to beds (major impact)');
    console.log('   • Terrain: slopes, stairs, soft ground');
    console.log('   • Plant density: intricate beds vs. open areas');
    console.log('   • Mulch condition: wet mulch is much heavier');
    console.log('   • Preparation: weeding/edging adds time\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding landscaping standards:', error);
    process.exit(1);
  }
}

seedLandscapingStandards();

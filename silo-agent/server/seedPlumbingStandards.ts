import { storage } from './storage';

/**
 * Seed plumbing services production standards based on industry benchmarks
 * Run with: npx tsx server/seedPlumbingStandards.ts
 */
async function seedPlumbingStandards() {
  try {
    console.log('Seeding plumbing services production standards...\n');
    
    const standards = [];
    
    // ===== FAUCET REPAIRS =====
    
    // Simple Faucet Repair (compression valve, washer replacement)
    // Industry: 30 min - 1 hour (avg 0.75 hrs)
    // Labor: 0.75 hrs per faucet
    // Materials: $10-20 for washers and basic parts
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Faucet Repair',
      itemDescription: 'Simple faucet repair compression valve',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 0.75, // 45 minutes average
      materialCostPerUnit: 1500, // $15 for washers and parts
      notes: 'Compression valve faucets (two handles). Quick washer replacement, typically under 1 hour.',
      source: 'manual',
    }));
    
    // Standard Faucet Repair (cartridge or ball-valve)
    // Industry: 1-1.5 hours (avg 1.25 hrs)
    // Labor: 1.25 hrs per faucet
    // Materials: $40-80 for cartridge/repair kit
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Faucet Repair',
      itemDescription: 'Standard faucet repair cartridge replacement',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 1.25, // 1 hour 15 minutes
      materialCostPerUnit: 6000, // $60 for cartridge/repair kit
      notes: 'Single-handle cartridge or ball-valve faucets. Requires internal cartridge or repair kit replacement.',
      source: 'manual',
    }));
    
    // Complex Faucet Repair (touchless/electronic)
    // Industry: 1.5+ hours (avg 2 hrs for diagnosis and repair)
    // Labor: 2 hrs per faucet
    // Materials: $80-150 for sensors and electronic parts
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Faucet Repair',
      itemDescription: 'Touchless faucet repair with sensors',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 2.0, // 2 hours for diagnosis and repair
      materialCostPerUnit: 12000, // $120 for sensors and electronics
      notes: 'Touchless faucets with sensors and electronics. More complex diagnosis and repair work.',
      source: 'manual',
    }));
    
    // Bathtub/Shower Faucet Repair
    // Industry: 2-4 hours (avg 3 hrs) - wall access required
    // Labor: 3 hrs per faucet
    // Materials: $50-100 for valve parts, plus potential wall repair
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Faucet Repair',
      itemDescription: 'Bathtub or shower faucet repair',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 3.0, // 3 hours average
      materialCostPerUnit: 10000, // $100 for valve parts and wall access materials
      notes: 'Valves behind wall require more labor for access. May need wall opening and repair. 2-4 hours typical.',
      source: 'manual',
    }));
    
    // ===== FAUCET REPLACEMENT =====
    
    // Sink Faucet Replacement (standard)
    // Industry: 45 min - 2 hours (avg 1.25 hrs)
    // Labor: 1.25 hrs per faucet
    // Materials: Customer provides faucet, plumber charges for supplies
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Faucet Installation',
      itemDescription: 'Sink faucet replacement standard',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 1.25, // 1 hour 15 minutes
      materialCostPerUnit: 3000, // $30 for supply lines, putty, etc (customer provides faucet)
      notes: 'Removing old faucet and installing new. Standard sink installation. Faucet cost not included.',
      source: 'manual',
    }));
    
    // Kitchen Faucet Replacement (with sprayer/complex)
    // Industry: 1.5-2.5 hours (avg 2 hrs)
    // Labor: 2 hrs per faucet
    // Materials: $40 for supplies (customer provides faucet)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Faucet Installation',
      itemDescription: 'Kitchen faucet replacement with sprayer',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 2.0, // 2 hours
      materialCostPerUnit: 4000, // $40 for supplies
      notes: 'Complex kitchen faucet with pull-down sprayer or multiple components. Faucet cost not included.',
      source: 'manual',
    }));
    
    // ===== OTHER COMMON PLUMBING REPAIRS =====
    
    // Toilet Repair (flapper, fill valve, etc)
    // Industry: 30 min - 1.5 hours (avg 1 hr)
    // Labor: 1 hr per toilet
    // Materials: $20-40 for parts
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Toilet Repair',
      itemDescription: 'Toilet repair flapper or fill valve',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 1.0, // 1 hour
      materialCostPerUnit: 3000, // $30 for repair kit parts
      notes: 'Common toilet repairs: flapper, fill valve, flush valve. Running or leaking toilets.',
      source: 'manual',
    }));
    
    // Drain Clearing (basic sink/tub)
    // Industry: 1-2 hours (avg 1.5 hrs)
    // Labor: 1.5 hrs per drain
    // Materials: Minimal (snake/auger wear)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Plumbing',
      subcategory: 'Drain Cleaning',
      itemDescription: 'Basic drain clearing sink or tub',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 1.5, // 1.5 hours
      materialCostPerUnit: 2000, // $20 for supplies/equipment wear
      notes: 'Basic drain clearing with snake/auger. Typical clogged sink or bathtub drain.',
      source: 'manual',
    }));
    
    console.log(`✓ Created ${standards.length} plumbing service production standards\n`);
    
    // Display examples
    console.log('=== EXAMPLE CALCULATIONS ===\n');
    
    console.log('Simple Faucet Repair (washer replacement):');
    console.log('  Labor: 0.75 hours × $85/hr = $64');
    console.log('  Materials: $15 (washer and basic parts)');
    console.log('  Total: $64 + $15 = $79');
    console.log('  Note: Minimum charge typically 1 hour ($85) due to travel/setup\n');
    
    console.log('Standard Faucet Repair (cartridge replacement):');
    console.log('  Labor: 1.25 hours × $85/hr = $106');
    console.log('  Materials: $60 (cartridge/repair kit)');
    console.log('  Total: $106 + $60 = $166\n');
    
    console.log('Bathtub Faucet Repair (behind wall):');
    console.log('  Labor: 3 hours × $85/hr = $255');
    console.log('  Materials: $100 (valve parts + wall access)');
    console.log('  Total: $255 + $100 = $355');
    console.log('  Note: More labor due to wall access required\n');
    
    console.log('Kitchen Faucet Replacement:');
    console.log('  Labor: 2 hours × $85/hr = $170');
    console.log('  Materials: $40 (supply lines, putty)');
    console.log('  Total: $170 + $40 = $210');
    console.log('  Note: Customer typically provides faucet ($100-400+)\n');
    
    console.log('Toilet Repair (running toilet):');
    console.log('  Labor: 1 hour × $85/hr = $85');
    console.log('  Materials: $30 (flapper/fill valve kit)');
    console.log('  Total: $85 + $30 = $115\n');
    
    console.log('📌 INDUSTRY INSIGHT: Plumbers charge minimum labor fee (typically 1 hour)');
    console.log('   regardless of actual time due to travel and setup costs.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding plumbing standards:', error);
    process.exit(1);
  }
}

seedPlumbingStandards();

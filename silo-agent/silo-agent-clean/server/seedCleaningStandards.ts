import { storage } from './storage';

/**
 * Seed cleaning services production standards based on industry benchmarks
 * Run with: npx tsx server/seedCleaningStandards.ts
 */
async function seedCleaningStandards() {
  try {
    console.log('Seeding cleaning services production standards...\n');
    
    const standards = [];
    
    // ===== RESIDENTIAL CLEANING =====
    
    // Standard Residential Cleaning (weekly/bi-weekly)
    // Industry: $0.05-0.15 per sq ft (avg $0.10/sq ft)
    // Productivity: 1,500-2,500 sq ft per hour (avg ~2,000 sq ft/hr)
    // Labor: 0.0005 hrs/sq ft (2,000 sq ft/hr)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Cleaning',
      subcategory: 'Residential Cleaning',
      itemDescription: 'Standard residential cleaning',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.0005, // 2,000 sq ft per hour
      materialCostPerUnit: 10, // $0.10 per sq ft (includes supplies)
      notes: 'Weekly or bi-weekly cleaning service. Productivity: ~2,000 sq ft/hr. Labor is primary cost driver.',
      source: 'manual',
    }));
    
    // Deep Cleaning (more thorough work)
    // Industry: $0.13-0.17 per sq ft (avg $0.15/sq ft)
    // Productivity: Slower due to detail work, ~750-1,000 sq ft per hour
    // Labor: 0.00125 hrs/sq ft (800 sq ft/hr)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Cleaning',
      subcategory: 'Deep Cleaning',
      itemDescription: 'Deep residential cleaning',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.00125, // 800 sq ft per hour
      materialCostPerUnit: 15, // $0.15 per sq ft (supplies + extra products)
      notes: 'Thorough cleaning with extra labor. Slower productivity (~800 sq ft/hr) due to detail work.',
      source: 'manual',
    }));
    
    // ===== COMMERCIAL CLEANING =====
    
    // Commercial Office Cleaning
    // Commercial spaces often clean faster due to less clutter
    // Productivity: 2,500-4,000 sq ft per hour (avg ~3,000 sq ft/hr)
    // Labor: 0.000333 hrs/sq ft (3,000 sq ft/hr)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Cleaning',
      subcategory: 'Commercial Cleaning',
      itemDescription: 'Commercial office cleaning',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.000333, // 3,000 sq ft per hour
      materialCostPerUnit: 8, // $0.08 per sq ft (bulk supplies, faster work)
      notes: 'Commercial office spaces. Higher productivity (~3,000 sq ft/hr) than residential. Nightly or weekly service.',
      source: 'manual',
    }));
    
    // Post-Construction Cleaning
    // Very labor-intensive due to debris, dust, and detail work
    // Productivity: 300-500 sq ft per hour (avg ~400 sq ft/hr)
    // Labor: 0.0025 hrs/sq ft (400 sq ft/hr)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Cleaning',
      subcategory: 'Post-Construction Cleaning',
      itemDescription: 'Post-construction cleanup',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.0025, // 400 sq ft per hour (very labor-intensive)
      materialCostPerUnit: 20, // $0.20 per sq ft (extra supplies, disposal)
      notes: 'Heavy-duty cleaning after construction. Very labor-intensive (~400 sq ft/hr). Requires specialized supplies.',
      source: 'manual',
    }));
    
    // Move-In/Move-Out Cleaning
    // Similar to deep cleaning but empty spaces
    // Productivity: 1,000-1,500 sq ft per hour (avg ~1,200 sq ft/hr)
    // Labor: 0.000833 hrs/sq ft (1,200 sq ft/hr)
    standards.push(await storage.createProductionStandard({
      serviceType: 'Cleaning',
      subcategory: 'Move-In/Move-Out Cleaning',
      itemDescription: 'Move-in or move-out cleaning',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.000833, // 1,200 sq ft per hour
      materialCostPerUnit: 12, // $0.12 per sq ft
      notes: 'Thorough cleaning for vacant properties. Moderate productivity (~1,200 sq ft/hr).',
      source: 'manual',
    }));
    
    console.log(`✓ Created ${standards.length} cleaning service production standards\n`);
    
    // Display examples
    console.log('=== EXAMPLE CALCULATIONS ===\n');
    
    console.log('2,000 sq ft Standard Residential Cleaning:');
    console.log('  Labor: 2,000 sq ft × 0.0005 hrs/sq ft = 1 hour');
    console.log('  Materials: 2,000 sq ft × $0.10/sq ft = $200 (supplies included in rate)');
    console.log('  At $55/hr = $55 labor + $200 = $255 per visit');
    console.log('  Note: Often priced as flat rate per visit ($150-250)\n');
    
    console.log('1,500 sq ft Deep Cleaning:');
    console.log('  Labor: 1,500 sq ft × 0.00125 hrs/sq ft = 1.875 hours (~2 hours)');
    console.log('  Materials: 1,500 sq ft × $0.15/sq ft = $225');
    console.log('  At $55/hr = $103 labor + $225 = $328 total\n');
    
    console.log('5,000 sq ft Commercial Office Cleaning:');
    console.log('  Labor: 5,000 sq ft × 0.000333 hrs/sq ft = 1.67 hours');
    console.log('  Materials: 5,000 sq ft × $0.08/sq ft = $400');
    console.log('  At $50/hr = $84 labor + $400 = $484 per service');
    console.log('  Note: Commercial often billed monthly with contracts\n');
    
    console.log('1,200 sq ft Post-Construction Cleaning:');
    console.log('  Labor: 1,200 sq ft × 0.0025 hrs/sq ft = 3 hours');
    console.log('  Materials: 1,200 sq ft × $0.20/sq ft = $240');
    console.log('  At $60/hr = $180 labor + $240 = $420 total');
    console.log('  Note: Very labor-intensive, requires debris removal\n');
    
    console.log('1,800 sq ft Move-Out Cleaning:');
    console.log('  Labor: 1,800 sq ft × 0.000833 hrs/sq ft = 1.5 hours');
    console.log('  Materials: 1,800 sq ft × $0.12/sq ft = $216');
    console.log('  At $55/hr = $83 labor + $216 = $299 total\n');
    
    console.log('📊 KEY INSIGHT: Labor is the primary cost driver in cleaning services.');
    console.log('Employee productivity (sq ft/hr) is crucial for profitability.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding cleaning standards:', error);
    process.exit(1);
  }
}

seedCleaningStandards();

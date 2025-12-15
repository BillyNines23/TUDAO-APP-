import { storage } from './storage';

/**
 * Seed production standards for vinyl fence installation
 * Run with: npx tsx server/seedFenceStandard.ts
 * 
 * Seeds TWO standards because AI Master Router may classify fence
 * installation as either "Landscaping" or "Carpentry"
 */
async function seedFenceProductionStandards() {
  try {
    console.log('Seeding fence production standards...');
    
    // Realistic vinyl fence installation standard:
    // - Production rate: 8 linear feet per hour (0.125 hours per linear foot)
    // - Material cost: $15 per linear foot for 6ft vinyl privacy fence
    const standardData = {
      itemDescription: 'Vinyl fence 6ft privacy',
      unitOfMeasure: 'linear_feet',
      laborHoursPerUnit: 0.125, // 8 feet per hour
      materialCostPerUnit: 1500, // $15.00 per linear foot (in cents)
      notes: 'Includes post installation, concrete setting, panel attachment. Average crew of 2.',
      source: 'manual',
    };
    
    // Create for Landscaping category
    const landscapingStandard = await storage.createProductionStandard({
      serviceType: 'Landscaping',
      subcategory: 'Fence Installation',
      ...standardData
    });
    console.log('✓ Created Landscaping/Fence Installation standard:', landscapingStandard.id);
    
    // Create for Carpentry category (AI may classify fence work as carpentry)
    const carpentryStandard = await storage.createProductionStandard({
      serviceType: 'Carpentry',
      subcategory: 'Fence installation',
      ...standardData
    });
    console.log('✓ Created Carpentry/Fence installation standard:', carpentryStandard.id);
    
    console.log('');
    console.log('Example calculation for 200 linear feet:');
    console.log('- Labor: 200 ft × 0.125 hrs/ft = 25 hours');
    console.log('- Materials: 200 ft × $15/ft = $3,000');
    console.log('- At $65/hr labor rate = $1,625 labor + $3,000 materials = $4,625 total');
    console.log('');
    console.log('This is a realistic estimate vs. the old 2-hour/$280 estimate!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding production standards:', error);
    process.exit(1);
  }
}

seedFenceProductionStandards();

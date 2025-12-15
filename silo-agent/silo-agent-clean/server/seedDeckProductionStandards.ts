import { db } from './db';
import { productionStandards } from '../shared/schema';

/**
 * Seed production standards for Deck Building
 * These provide realistic labor rates and material multipliers
 */
export async function seedDeckProductionStandards() {
  console.log('🌱 Seeding Deck Production Standards...\n');

  const standards = [
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Deck framing labor (joists, beams, ledger)',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.08, // 12.5 sq ft/hr = 0.08 hrs/sq ft
      materialCostPerUnit: null, // Material cost handled separately
      notes: 'Includes joist installation, beam placement, ledger board attachment. Assumes standard 16" joist spacing.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Deck board installation labor',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.05, // 20 sq ft/hr = 0.05 hrs/sq ft
      materialCostPerUnit: null,
      notes: 'Deck board layout, cutting, and fastening. Includes hidden fastener systems or face screwing.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Railing installation',
      unitOfMeasure: 'linear_feet',
      laborHoursPerUnit: 0.33, // 3 linear ft/hr = 0.33 hrs/ft
      materialCostPerUnit: 4500, // $45/ft for materials (posts, balusters, rails)
      notes: 'Includes posts, balusters, top/bottom rails. Code-compliant 36" height minimum.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Stair construction',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 1.33, // 0.75 steps/hr = 1.33 hrs/step
      materialCostPerUnit: 12000, // $120/step for materials (stringers, treads, risers)
      notes: 'Includes stringers, treads, risers. Code-compliant 7" max rise, 10" min run.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Concrete footing installation',
      unitOfMeasure: 'each',
      laborHoursPerUnit: 0.67, // 1.5 footings/hr = 0.67 hrs/footing
      materialCostPerUnit: 8500, // $85/footing (concrete, rebar, post bracket)
      notes: 'Includes excavation, concrete pour, post bracket. Minimum 12" diameter, below frost line.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Existing deck demolition',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: 0.025, // 40 sq ft/hr = 0.025 hrs/sq ft
      materialCostPerUnit: 50, // $0.50/sq ft disposal fee
      notes: 'Includes removal, disposal, site cleanup. Price assumes standard construction waste disposal.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Pressure-treated lumber (framing)',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: null,
      materialCostPerUnit: 850, // $8.50/sq ft for PT framing materials
      notes: 'Includes all framing lumber (joists, beams, posts). Assumes 2x8 or 2x10 joists.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Pressure-treated deck boards',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: null,
      materialCostPerUnit: 650, // $6.50/sq ft for PT deck boards
      notes: 'Standard 5/4x6 PT deck boards. Includes 10% waste factor.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Cedar deck boards',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: null,
      materialCostPerUnit: 1250, // $12.50/sq ft for cedar boards
      notes: 'Premium cedar 5/4x6 deck boards. Includes 10% waste factor.',
      source: 'manual',
      isActive: 1
    },
    {
      serviceType: 'Carpentry',
      propertyType: 'residential',
      qualityTier: 'tudao_standard',
      subcategory: 'Build deck',
      itemDescription: 'Composite deck boards (Trex/TimberTech)',
      unitOfMeasure: 'square_feet',
      laborHoursPerUnit: null,
      materialCostPerUnit: 2200, // $22/sq ft for composite boards
      notes: 'Mid-range composite decking. Includes 8% waste factor (less waste than wood).',
      source: 'manual',
      isActive: 1
    }
  ];

  for (const std of standards) {
    try {
      await db.insert(productionStandards).values(std);
      const costDisplay = std.materialCostPerUnit ? `$${(std.materialCostPerUnit / 100).toFixed(2)}/${std.unitOfMeasure}` : 'Labor only';
      const laborDisplay = std.laborHoursPerUnit ? `${std.laborHoursPerUnit} hrs/${std.unitOfMeasure}` : 'Materials only';
      console.log(`✓ Added: ${std.itemDescription} (${laborDisplay}, ${costDisplay})`);
    } catch (error: any) {
      console.log(`⚠ Skipped (already exists): ${std.itemDescription}`);
    }
  }

  console.log('\n✅ Deck Production Standards seeded!\n');
}

seedDeckProductionStandards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

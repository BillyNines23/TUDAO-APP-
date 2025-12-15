import { db } from './db';
import { completedJobs } from '../shared/schema';

/**
 * Seed high-quality completed deck jobs for RAG-based pricing
 */
export async function seedDeckTrainingData() {
  console.log('🌱 Seeding Deck Training Data...\n');

  const trainingJobs = [
    // Example 1: Standard 320 sq ft PT deck with railings and stairs
    {
      sessionId: 'training-deck-001',
      serviceType: 'Carpentry',
      subcategory: 'Build deck',
      propertyType: 'residential' as const,
      serviceDescription: 'Build new 320 sq ft pressure-treated wood deck (20x16) with full railings and stairs at mid-elevation',
      originalScope: 'Construct a 20-foot by 16-foot (320 sq ft) pressure-treated deck at mid-elevation (3-6 feet). Install 8 concrete footings below frost line. Attach to house via ledger board. Include PT framing with 2x8 joists @ 16" OC, 2x10 beams. Install PT 5/4x6 deck boards. Add 36" railings on all sides (72 LF total). Build 4-step stairs. All work to code.',
      rating: 'training',
      dataSource: 'admin_seed',
      isTrainingExample: 1,
      actualManHours: 52,
      actualCost: 1352500, // $13,525 in cents
      estimatedManHours: 50,
      estimatedCost: 1300000,
      customerRating: 5,
      accuracyScore: 0.96,
      questionAnswers: [
        { question: 'What are the exact dimensions of the deck?', answer: '20 x 16' },
        { question: 'What material do you prefer for the deck?', answer: 'Pressure-treated wood' },
        { question: 'What is the height from ground level where the deck will be?', answer: 'Mid elevation (3-6 feet)' },
        { question: 'What type of foundation will the deck require?', answer: 'Concrete footings (below frost line)' },
        { question: 'Do you need railings installed?', answer: 'Yes, all sides' },
        { question: 'Do you need stairs from the deck to ground level?', answer: 'Yes' },
      ],
      materialCalculations: {
        'Deck framing (joists, beams, ledger)': {
          quantity: 320,
          unit: 'square_feet',
          unitPrice: 8.50,
          total: 2720.00,
          notes: '2x8 joists @ 16" OC, 2x10 beams, ledger'
        },
        'PT deck boards (5/4x6)': {
          quantity: 320,
          unit: 'square_feet',
          unitPrice: 6.50,
          total: 2080.00,
          notes: '10% waste factor'
        },
        'Concrete footings (12" dia, 48" deep)': {
          quantity: 8,
          unit: 'each',
          unitPrice: 85.00,
          total: 680.00,
          notes: 'Below frost line, post brackets'
        },
        'Railing (36" height, PT)': {
          quantity: 72,
          unit: 'linear_feet',
          unitPrice: 45.00,
          total: 3240.00,
          notes: 'All four sides'
        },
        'Stairs (4 steps)': {
          quantity: 1,
          unit: 'set',
          unitPrice: 480.00,
          total: 480.00,
          notes: 'Stringers, treads, risers'
        },
        'Hardware': {
          quantity: 1,
          unit: 'project',
          unitPrice: 425.00,
          total: 425.00,
          notes: 'Fasteners, hangers, caps'
        }
      },
      materialsUsed: 'PT framing lumber, PT 5/4x6 decking, concrete, PT railing materials, galvanized hardware',
      completedAt: new Date('2024-10-15'),
      notes: 'Standard build. Customer very satisfied. Mid-height required 8 footings.',
      tags: ['standard_build', 'full_railings', 'mid_elevation'],
      vendorId: null
    },
    // Example 2: Premium 336 sq ft composite deck with removal
    {
      sessionId: 'training-deck-002',
      serviceType: 'Carpentry',
      subcategory: 'Build deck',
      propertyType: 'residential' as const,
      serviceDescription: 'Build new 336 sq ft composite deck (24x14) with old deck removal, high elevation, L-shaped design',
      originalScope: 'Remove existing 200 sq ft PT deck. Construct 24x14 (336 sq ft) L-shaped composite deck at high elevation (6+ feet). Install 12 deep concrete footings (60" below frost). Heavy-duty PT framing for composite. Install Trex Select composite boards with hidden fasteners. Add matching composite railing system (84 LF). Build 6-step stairs with composite treads. Premium low-maintenance materials throughout.',
      rating: 'training',
      dataSource: 'admin_seed',
      isTrainingExample: 1,
      actualManHours: 72,
      actualCost: 2514200, // $25,142 in cents
      estimatedManHours: 68,
      estimatedCost: 2400000,
      customerRating: 5,
      accuracyScore: 0.90,
      questionAnswers: [
        { question: 'What are the exact dimensions of the deck?', answer: '24 x 14' },
        { question: 'What material do you prefer for the deck?', answer: 'Composite (Trex, TimberTech)' },
        { question: 'What is the height from ground level where the deck will be?', answer: 'High elevation (6+ feet)' },
        { question: 'What type of foundation will the deck require?', answer: 'Concrete footings (below frost line)' },
        { question: 'What is the deck shape/complexity?', answer: 'L-shaped or angled' },
        { question: 'Do you need railings installed?', answer: 'Yes, all sides' },
        { question: 'Do you need stairs from the deck to ground level?', answer: 'Yes' },
        { question: 'Is there an existing deck that needs to be removed first?', answer: 'Yes, remove old deck' }
      ],
      materialCalculations: {
        'Old deck removal': {
          quantity: 200,
          unit: 'square_feet',
          unitPrice: 2.50,
          total: 500.00,
          notes: 'Demo and disposal'
        },
        'Heavy-duty PT framing': {
          quantity: 336,
          unit: 'square_feet',
          unitPrice: 10.00,
          total: 3360.00,
          notes: 'Engineered beams for composite'
        },
        'Trex Select composite boards': {
          quantity: 336,
          unit: 'square_feet',
          unitPrice: 22.00,
          total: 7392.00,
          notes: 'Hidden fasteners, 8% waste'
        },
        'Concrete footings (12" dia, 60" deep)': {
          quantity: 12,
          unit: 'each',
          unitPrice: 95.00,
          total: 1140.00,
          notes: 'Extra-deep for high elevation'
        },
        'Composite railing system': {
          quantity: 84,
          unit: 'linear_feet',
          unitPrice: 65.00,
          total: 5460.00,
          notes: 'Matching Trex, aluminum balusters'
        },
        'Stairs (6 steps, composite treads)': {
          quantity: 1,
          unit: 'set',
          unitPrice: 850.00,
          total: 850.00,
          notes: 'Composite treads, matching railing'
        },
        'Hardware (hidden fasteners, ledger)': {
          quantity: 1,
          unit: 'project',
          unitPrice: 680.00,
          total: 680.00,
          notes: 'Hidden clips, flashing, structural'
        }
      },
      materialsUsed: 'PT engineered framing, Trex Select composite decking, concrete, Trex composite railing, hidden fasteners',
      completedAt: new Date('2024-11-05'),
      notes: 'Premium build replacing old deck. High elevation, L-shape added complexity. Customer loves low maintenance.',
      tags: ['premium', 'composite', 'high_elevation', 'complex_shape', 'removal'],
      vendorId: null
    }
  ];

  for (const job of trainingJobs) {
    try {
      await db.insert(completedJobs).values(job);
      const sqft = (job.questionAnswers as any[]).find(q => q.question.includes('dimensions'))?.answer || 'unknown';
      const material = (job.questionAnswers as any[]).find(q => q.question.includes('material'))?.answer || 'unknown';
      console.log(`✓ Added: ${sqft} ${material} deck - $${(job.actualCost! / 100).toLocaleString()}`);
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        console.log(`⚠ Skipped (duplicate): training example`);
      } else {
        console.error(`❌ Error:`, error.message);
      }
    }
  }

  console.log('\n✅ Deck Training Data seeded!\n');
}

seedDeckTrainingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

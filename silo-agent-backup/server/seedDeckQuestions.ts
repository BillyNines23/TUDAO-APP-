import { db } from './db';
import { serviceQuestions } from '../shared/schema';

/**
 * Seed specific questions for Deck Construction
 * These override generic "installation" questions for deck building projects
 */
export async function seedDeckQuestions() {
  console.log('🌱 Seeding Deck Construction questions...\n');

  const deckQuestions = [
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What are the exact dimensions of the deck? (e.g., 12x12, 20x16)',
      responseType: 'text' as const,
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null,
      options: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What material do you prefer for the deck?',
      responseType: 'choice' as const,
      options: ['Pressure-treated wood', 'Cedar', 'Composite (Trex, TimberTech)', 'PVC', 'Redwood', 'Other/Not sure'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What is the height from ground level where the deck will be?',
      responseType: 'choice' as const,
      options: ['Ground level (< 1 foot)', 'Low elevation (1-3 feet)', 'Mid elevation (3-6 feet)', 'High elevation (6+ feet)', 'Second story'],
      sequence: 3,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Do you need railings installed?',
      responseType: 'choice' as const,
      options: ['Yes, all sides', 'Yes, some sides only', 'No railings needed', 'Not sure'],
      sequence: 4,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Do you need stairs from the deck to ground level?',
      responseType: 'choice' as const,
      options: ['Yes', 'No', 'Not sure'],
      sequence: 5,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Is there an existing deck that needs to be removed first?',
      responseType: 'choice' as const,
      options: ['Yes, remove old deck', 'No, new construction', 'Partial removal needed'],
      sequence: 6,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What type of foundation will the deck require?',
      responseType: 'choice' as const,
      options: ['Concrete footings (below frost line)', 'Concrete piers/blocks', 'Helical piles', 'Existing foundation', 'Not sure'],
      sequence: 7,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What is the deck shape/complexity?',
      responseType: 'choice' as const,
      options: ['Simple rectangle', 'L-shaped or angled', 'Multi-level', 'Wraparound/complex', 'Not sure'],
      sequence: 8,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Will the deck attach to your house via a ledger board?',
      responseType: 'choice' as const,
      options: ['Yes, attached to house', 'No, freestanding deck', 'Not sure'],
      sequence: 9,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Do you need a building permit for this deck?',
      responseType: 'choice' as const,
      options: ['Yes, permit required', 'No permit needed', 'Not sure - need guidance', 'I will obtain myself'],
      sequence: 10,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What are the soil/ground conditions where the deck will be built?',
      responseType: 'choice' as const,
      options: ['Flat, stable ground', 'Sloped terrain', 'Rocky/hard soil', 'Soft/sandy soil', 'Not sure'],
      sequence: 11,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Do you need electrical work (outlets, lighting)?',
      responseType: 'choice' as const,
      options: ['Yes, need electrical outlets', 'Yes, need lighting only', 'Both outlets and lighting', 'No electrical needed', 'Not sure'],
      sequence: 12,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Do you want built-in features?',
      responseType: 'choice' as const,
      options: ['Built-in benches', 'Planters', 'Privacy screens', 'Multiple features', 'None', 'Not sure'],
      sequence: 13,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What type of deck finish/protection do you want?',
      responseType: 'choice' as const,
      options: ['Stain and seal', 'Paint', 'Natural weathering (no finish)', 'Not applicable (composite material)', 'Not sure'],
      sequence: 14,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Is there good access for materials and equipment?',
      responseType: 'choice' as const,
      options: ['Easy access (driveway/yard)', 'Limited access (narrow path)', 'Difficult access (gate/stairs required)', 'Not sure'],
      sequence: 15,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Do you need a gate for railing access?',
      responseType: 'choice' as const,
      options: ['Yes, need gate', 'No gate needed', 'Multiple gates', 'Not sure'],
      sequence: 16,
      requiredForScope: 0,
      conditionalTag: "if answer_contains('railing')" // Only ask if they mentioned railings
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'What is your target timeframe for completion?',
      responseType: 'choice' as const,
      options: ['ASAP (1-2 weeks)', 'Flexible (1-2 months)', 'Planning ahead (2+ months)', 'No rush'],
      sequence: 17,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'Carpentry',
      subcategory: 'Build deck', // Match AI Master Router output
      questionText: 'Any special features or notes?',
      responseType: 'text' as const,
      sequence: 18,
      requiredForScope: 0,
      conditionalTag: null,
      options: null
    }
  ];

  for (const q of deckQuestions) {
    try {
      await db.insert(serviceQuestions).values(q);
      console.log(`✓ Added: ${q.questionText}`);
    } catch (error: any) {
      console.log(`⚠ Skipped (already exists): ${q.questionText}`);
    }
  }

  console.log('\n✅ Deck Construction questions seeded!\n');
}

seedDeckQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

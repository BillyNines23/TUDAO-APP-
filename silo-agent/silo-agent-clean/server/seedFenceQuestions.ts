import { db } from './db';
import { serviceQuestions } from '../shared/schema';

/**
 * Seed specific questions for Fence Repair and Installation
 * Handles both service (repair) and installation (new fence) scenarios
 */
export async function seedFenceQuestions() {
  console.log('🌱 Seeding Fence questions...\n');

  const fenceQuestions = [
    // FENCE REPAIR (service intent)
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence repair',
      questionText: 'What part of the fence needs repair?',
      responseType: 'choice' as const,
      options: ['Broken/damaged boards', 'Leaning posts', 'Gate issues', 'Multiple sections', 'Other'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence repair',
      questionText: 'Approximately how many linear feet need repair?',
      responseType: 'text' as const,
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null,
      options: null
    },
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence repair',
      questionText: 'What type of fence is it?',
      responseType: 'choice' as const,
      options: ['Wood privacy', 'Wood picket', 'Chain link', 'Vinyl', 'Metal/Aluminum', 'Other'],
      sequence: 3,
      requiredForScope: 1,
      conditionalTag: null
    },

    // FENCE INSTALLATION (installation intent)
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence installation',
      questionText: 'How many linear feet of fence do you need installed?',
      responseType: 'text' as const,
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null,
      options: null
    },
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence installation',
      questionText: 'What type of fence are you looking for?',
      responseType: 'choice' as const,
      options: ['Wood privacy (6ft)', 'Wood picket (4ft)', 'Chain link', 'Vinyl privacy', 'Metal/Aluminum', 'Composite', 'Other'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence installation',
      questionText: 'Do you need any gates installed?',
      responseType: 'choice' as const,
      options: ['Yes, single gate', 'Yes, double gate', 'Yes, multiple gates', 'No gates needed'],
      sequence: 3,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence installation',
      questionText: 'Is there an existing fence that needs removal?',
      responseType: 'choice' as const,
      options: ['Yes, remove old fence', 'No, new installation', 'Partial removal'],
      sequence: 4,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Landscaping',
      subcategory: 'Fence installation',
      questionText: 'What is the terrain like?',
      responseType: 'choice' as const,
      options: ['Flat/level ground', 'Slight slope', 'Steep slope', 'Rocky/difficult terrain'],
      sequence: 5,
      requiredForScope: 0,
      conditionalTag: null
    }
  ];

  for (const q of fenceQuestions) {
    try {
      await db.insert(serviceQuestions).values(q);
      console.log(`✓ Added: ${q.subcategory} - ${q.questionText}`);
    } catch (error: any) {
      console.log(`⚠ Skipped (already exists): ${q.questionText}`);
    }
  }

  console.log('\n✅ Fence questions seeded!\n');
}

seedFenceQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

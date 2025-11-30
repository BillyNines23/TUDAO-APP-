import { db } from './db';
import { serviceQuestions } from '../shared/schema';

/**
 * Seed generic baseline questions that work for ANY service type
 * These are fallback questions when service-specific questions don't exist
 */
export async function seedGenericQuestions() {
  console.log('🌱 Seeding generic baseline questions...\n');

  const genericQuestions = [
    // GENERIC SERVICE QUESTIONS (labor-only: repair, maintenance, routine services)
    {
      serviceType: 'Generic',
      subcategory: 'service',
      questionText: 'Can you describe the work you need done?',
      responseType: 'text',
      sequence: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'service',
      questionText: 'Approximately how large is the area or scope of work?',
      responseType: 'text',
      sequence: 2,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'service',
      questionText: 'How often do you need this service?',
      responseType: 'choice',
      options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed'],
      sequence: 3,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'service',
      questionText: 'Are there any specific requirements or challenges?',
      responseType: 'text',
      sequence: 4,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'service',
      questionText: 'When would you like this work completed?',
      responseType: 'text',
      sequence: 5,
      conditionalTag: null
    },

    // GENERIC INSTALLATION QUESTIONS (materials + labor, build/install)
    {
      serviceType: 'Generic',
      subcategory: 'installation',
      questionText: 'What exactly would you like to have built or installed?',
      responseType: 'text',
      sequence: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'installation',
      questionText: 'What are the dimensions or size requirements?',
      responseType: 'text',
      sequence: 2,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'installation',
      questionText: 'Do you have any material preferences? (wood, composite, metal, etc.)',
      responseType: 'text',
      sequence: 3,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'installation',
      questionText: 'Do you already have the materials, or should the vendor provide them?',
      responseType: 'choice',
      options: ['Vendor provides all materials', 'I have some materials', 'I have all materials'],
      sequence: 4,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'installation',
      questionText: 'Are there any site preparation needs? (removal, leveling, electrical, etc.)',
      responseType: 'text',
      sequence: 5,
      conditionalTag: null
    },
    {
      serviceType: 'Generic',
      subcategory: 'installation',
      questionText: 'When would you like this project completed?',
      responseType: 'text',
      sequence: 6,
      conditionalTag: null
    },
  ];

  for (const q of genericQuestions) {
    try {
      await db.insert(serviceQuestions).values(q);
      console.log(`✓ Added: ${q.subcategory} - ${q.questionText}`);
    } catch (error: any) {
      console.log(`⚠ Skipped (already exists): ${q.questionText}`);
    }
  }

  console.log('\n✅ Generic baseline questions seeded successfully!\n');
}

// Run immediately when imported
seedGenericQuestions()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding generic questions:', error);
    process.exit(1);
  });

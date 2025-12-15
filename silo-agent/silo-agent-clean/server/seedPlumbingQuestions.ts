import { db } from './db';
import { serviceQuestions } from '../shared/schema';

/**
 * Seed specific questions for Plumbing Repair and Installation
 * Covers common repair scenarios and new fixture installations
 */
export async function seedPlumbingQuestions() {
  console.log('🌱 Seeding Plumbing questions...\n');

  const plumbingQuestions = [
    // PLUMBING REPAIR (service intent)
    {
      serviceType: 'Plumbing',
      subcategory: 'Plumbing repair',
      questionText: 'What needs to be repaired?',
      responseType: 'choice' as const,
      options: ['Leaking faucet', 'Leaking pipe', 'Clogged drain', 'Toilet issue', 'Water heater problem', 'Garbage disposal', 'Other'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Plumbing',
      subcategory: 'Plumbing repair',
      questionText: 'Where is the problem located?',
      responseType: 'choice' as const,
      options: ['Kitchen', 'Bathroom', 'Basement', 'Laundry room', 'Outside/Yard', 'Multiple locations'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Plumbing',
      subcategory: 'Plumbing repair',
      questionText: 'How urgent is the repair?',
      responseType: 'choice' as const,
      options: ['Emergency (major leak/no water)', 'Urgent (within 24 hours)', 'Soon (within a week)', 'Flexible timing'],
      sequence: 3,
      requiredForScope: 0,
      conditionalTag: null
    },

    // FAUCET REPAIR (specific repair type)
    {
      serviceType: 'Plumbing',
      subcategory: 'Repair faucet', // Match AI Master Router output
      questionText: 'Where is the faucet located?',
      responseType: 'choice' as const,
      options: ['Kitchen sink', 'Bathroom sink', 'Bathtub', 'Shower', 'Outdoor/Hose bib'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Plumbing',
      subcategory: 'Repair faucet', // Match AI Master Router output
      questionText: 'What is the problem with the faucet?',
      responseType: 'choice' as const,
      options: ['Dripping/leaking', 'Low water pressure', 'Won\'t turn off', 'Handle broken', 'Sprayer issue'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },

    // FIXTURE INSTALLATION (installation intent)
    {
      serviceType: 'Plumbing',
      subcategory: 'Fixture installation',
      questionText: 'What fixture do you want to install?',
      responseType: 'choice' as const,
      options: ['New faucet', 'New toilet', 'New sink', 'New bathtub/shower', 'Garbage disposal', 'Dishwasher', 'Water heater', 'Other'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Plumbing',
      subcategory: 'Fixture installation',
      questionText: 'Do you already have the fixture/materials?',
      responseType: 'choice' as const,
      options: ['Yes, I have the fixture', 'No, vendor should provide', 'Need help selecting'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Plumbing',
      subcategory: 'Fixture installation',
      questionText: 'Is this replacing an existing fixture or new installation?',
      responseType: 'choice' as const,
      options: ['Replacing existing (same location)', 'New location (may need new plumbing)', 'Not sure'],
      sequence: 3,
      requiredForScope: 1,
      conditionalTag: null
    },

    // DRAIN CLEANING (service intent)
    {
      serviceType: 'Plumbing',
      subcategory: 'Drain cleaning',
      questionText: 'Which drain is clogged?',
      responseType: 'choice' as const,
      options: ['Kitchen sink', 'Bathroom sink', 'Shower/tub', 'Toilet', 'Main sewer line', 'Multiple drains'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'Plumbing',
      subcategory: 'Drain cleaning',
      questionText: 'How severe is the clog?',
      responseType: 'choice' as const,
      options: ['Completely blocked (no drainage)', 'Very slow drainage', 'Occasional backup', 'Gurgling sounds'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    }
  ];

  for (const q of plumbingQuestions) {
    try {
      await db.insert(serviceQuestions).values(q);
      console.log(`✓ Added: ${q.subcategory} - ${q.questionText}`);
    } catch (error: any) {
      console.log(`⚠ Skipped (already exists): ${q.questionText}`);
    }
  }

  console.log('\n✅ Plumbing questions seeded!\n');
}

seedPlumbingQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

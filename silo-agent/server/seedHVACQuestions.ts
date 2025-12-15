import { db } from './db';
import { serviceQuestions } from '../shared/schema';

/**
 * Seed specific questions for HVAC Service and Installation
 * Perfect example of service (tune-up, repair) vs installation (new system)
 */
export async function seedHVACQuestions() {
  console.log('🌱 Seeding HVAC questions...\n');

  const hvacQuestions = [
    // HEATING REPAIR (furnace/heating specific)
    {
      serviceType: 'HVAC',
      subcategory: 'Heating Repair',
      questionText: 'What type of heating system do you have?',
      responseType: 'choice' as const,
      options: ['Gas furnace', 'Electric furnace', 'Heat pump', 'Boiler', 'Not sure'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Heating Repair',
      questionText: 'What is the current status of your heating system?',
      responseType: 'choice' as const,
      options: [
        'Completely non-operational (no power/no response)',
        'Runs but no heat (blower works, no ignition)',
        'Producing low heat (some heat but not enough)',
        'Intermittent operation (cycles on and off)',
        'Other issue'
      ],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Heating Repair',
      questionText: 'Approximately how old is the heating system?',
      responseType: 'choice' as const,
      options: ['Less than 5 years', '5-10 years', '10-15 years', 'More than 15 years', 'Not sure'],
      sequence: 3,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Heating Repair',
      questionText: 'Have you noticed any unusual noises, smells, or visible issues?',
      responseType: 'multiple_choice' as const,
      options: ['Strange noises (banging, rattling)', 'Burning or gas smell', 'Visible damage or corrosion', 'No unusual signs'],
      sequence: 4,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Heating Repair',
      questionText: 'Where is your heating system located?',
      responseType: 'choice' as const,
      options: ['Basement', 'Attic', 'Closet/utility room', 'Garage', 'Outside', 'Other'],
      sequence: 5,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Heating Repair',
      questionText: 'Is the heating system easily accessible for a technician?',
      responseType: 'choice' as const,
      options: ['Easy access (clear path, no obstructions)', 'Somewhat difficult (tight space or minor obstacles)', 'Very difficult (cramped, requires moving items)', 'Not sure'],
      sequence: 6,
      requiredForScope: 0,
      conditionalTag: null
    },

    // HVAC SERVICE/REPAIR (service intent)
    {
      serviceType: 'HVAC',
      subcategory: 'Air conditioner repair', // Match AI Master Router output
      questionText: 'What issue are you experiencing?',
      responseType: 'choice' as const,
      options: ['Not cooling/heating', 'Poor airflow', 'Strange noises', 'Water leaking', 'High energy bills', 'Other'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Air conditioner repair', // Match AI Master Router output
      questionText: 'What type of system do you have?',
      responseType: 'choice' as const,
      options: ['Central AC/Furnace', 'Heat pump', 'Mini-split', 'Window unit', 'Not sure'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Air conditioner repair', // Match AI Master Router output
      questionText: 'Approximately how old is the system?',
      responseType: 'choice' as const,
      options: ['Less than 5 years', '5-10 years', '10-15 years', '15+ years', 'Not sure'],
      sequence: 3,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Air conditioner repair',
      questionText: 'Where is your AC system located?',
      responseType: 'choice' as const,
      options: ['Basement', 'Attic', 'Closet/utility room', 'Garage', 'Outside (condenser unit)', 'Multiple locations (inside and outside)', 'Other'],
      sequence: 4,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'Air conditioner repair',
      questionText: 'Is the AC system easily accessible for a technician?',
      responseType: 'choice' as const,
      options: ['Easy access (clear path, no obstructions)', 'Somewhat difficult (tight space or minor obstacles)', 'Very difficult (cramped, requires moving items)', 'Not sure'],
      sequence: 5,
      requiredForScope: 0,
      conditionalTag: null
    },

    // HVAC MAINTENANCE (service intent)
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC maintenance',
      questionText: 'What type of maintenance do you need?',
      responseType: 'choice' as const,
      options: ['Annual tune-up', 'Pre-season check', 'Filter replacement', 'Duct cleaning', 'Full inspection'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC maintenance',
      questionText: 'What type of system?',
      responseType: 'choice' as const,
      options: ['Central AC/Furnace', 'Heat pump', 'Mini-split', 'Multiple systems'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC maintenance',
      questionText: 'Where is your HVAC system located?',
      responseType: 'choice' as const,
      options: ['Basement', 'Attic', 'Closet/utility room', 'Garage', 'Outside', 'Multiple locations', 'Other'],
      sequence: 3,
      requiredForScope: 0,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC maintenance',
      questionText: 'Is the HVAC system easily accessible for maintenance?',
      responseType: 'choice' as const,
      options: ['Easy access (clear path, no obstructions)', 'Somewhat difficult (tight space or minor obstacles)', 'Very difficult (cramped, requires moving items)', 'Not sure'],
      sequence: 4,
      requiredForScope: 0,
      conditionalTag: null
    },

    // HVAC INSTALLATION (installation intent)
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC installation',
      questionText: 'What are you looking to install?',
      responseType: 'choice' as const,
      options: ['Central AC and furnace', 'Heat pump system', 'Mini-split system', 'Ductwork', 'Thermostat only', 'Other'],
      sequence: 1,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC installation',
      questionText: 'What is the approximate square footage of your home?',
      responseType: 'choice' as const,
      options: ['Under 1,000 sq ft', '1,000-1,500 sq ft', '1,500-2,000 sq ft', '2,000-2,500 sq ft', '2,500-3,000 sq ft', 'Over 3,000 sq ft'],
      sequence: 2,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC installation',
      questionText: 'Is this a replacement or new installation?',
      responseType: 'choice' as const,
      options: ['Replacing existing system', 'New installation (no existing system)', 'Adding to existing'],
      sequence: 3,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC installation',
      questionText: 'Does your home have existing ductwork?',
      responseType: 'choice' as const,
      options: ['Yes, existing ductwork', 'No ductwork', 'Partial ductwork', 'Not sure'],
      sequence: 4,
      requiredForScope: 1,
      conditionalTag: null
    },
    {
      serviceType: 'HVAC',
      subcategory: 'HVAC installation',
      questionText: 'Do you have a brand preference?',
      responseType: 'text' as const,
      sequence: 5,
      requiredForScope: 0,
      conditionalTag: null,
      options: null
    }
  ];

  for (const q of hvacQuestions) {
    try {
      await db.insert(serviceQuestions).values(q);
      console.log(`✓ Added: ${q.subcategory} - ${q.questionText}`);
    } catch (error: any) {
      console.log(`⚠ Skipped (already exists): ${q.questionText}`);
    }
  }

  console.log('\n✅ HVAC questions seeded!\n');
}

seedHVACQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

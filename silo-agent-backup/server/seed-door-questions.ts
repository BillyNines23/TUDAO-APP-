import { db } from './db';
import { serviceQuestions } from '@shared/schema';

/**
 * Seed Door-Specific Question Flows
 * 
 * This trains the system to ask detailed questions about door replacements.
 * The RAG system will learn from these patterns and apply them to future jobs.
 */

const doorQuestions = [
  // ========== REQUIRED QUESTIONS (Always Ask) ==========
  
  {
    serviceType: 'Door Installation',
    subcategory: null, // Applies to all door installation jobs
    questionText: 'Is this for an interior door or an exterior door?',
    responseType: 'choice',
    options: ['Exterior', 'Interior'],
    requiredForScope: 1,
    conditionalTag: null,
    sequence: 1
  },
  
  // ========== EXTERIOR DOOR QUESTIONS ==========
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Exterior',
    questionText: 'What style of exterior door are you looking for?',
    responseType: 'choice',
    options: [
      'Solid wood (no glass)',
      'Panel door with decorative glass',
      'Full glass door with blinds inside',
      'Door with side panels (sidelights)',
      'Double doors (French style)',
      'Dutch door (split top/bottom)',
      'Not sure - need recommendations'
    ],
    requiredForScope: 1,
    conditionalTag: "if answer_contains('Exterior')",
    sequence: 2
  },
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Exterior',
    questionText: 'What material do you prefer for your exterior door?',
    responseType: 'choice',
    options: [
      'Solid wood (classic, requires maintenance)',
      'Fiberglass (low maintenance, durable)',
      'Steel (secure, energy efficient)',
      'Wood composite',
      'Not sure - recommend best option'
    ],
    requiredForScope: 1,
    conditionalTag: "if answer_contains('Exterior')",
    sequence: 3
  },
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Exterior',
    questionText: 'Does the door frame also need to be replaced, or just the door?',
    responseType: 'choice',
    options: [
      'Just the door - frame is in good condition',
      'Both door and frame need replacement',
      'Not sure - frame might be damaged'
    ],
    requiredForScope: 1,
    conditionalTag: "if answer_contains('Exterior')",
    sequence: 4
  },
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Exterior',
    questionText: 'Do you need new hardware? (Handle, lock set, deadbolt, hinges)',
    responseType: 'choice',
    options: [
      'Yes - new entry handle and deadbolt',
      'Yes - decorative hardware set (handle, deadbolt, hinges)',
      'No - keeping existing hardware',
      'Not sure - recommend based on security'
    ],
    requiredForScope: 0,
    conditionalTag: "if answer_contains('Exterior')",
    sequence: 5
  },
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Exterior',
    questionText: 'Is there a storm door or screen door that needs consideration?',
    responseType: 'choice',
    options: [
      'Yes - install new storm door',
      'Yes - I have one that needs to be reinstalled',
      'No storm door needed',
    ],
    requiredForScope: 0,
    conditionalTag: "if answer_contains('Exterior')",
    sequence: 6
  },
  
  // ========== INTERIOR DOOR QUESTIONS ==========
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Interior',
    questionText: 'What style of interior door do you need?',
    responseType: 'choice',
    options: [
      'Standard panel door (traditional)',
      'Flat slab door (modern, minimalist)',
      'French door (glass panels)',
      'Barn door (sliding)',
      'Pocket door (slides into wall)',
      'Bi-fold door (closet)',
      'Not sure - need recommendations'
    ],
    requiredForScope: 1,
    conditionalTag: "if answer_contains('Interior')",
    sequence: 2
  },
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Interior',
    questionText: 'How many doors need to be replaced?',
    responseType: 'text',
    options: null,
    requiredForScope: 1,
    conditionalTag: "if answer_contains('Interior')",
    sequence: 3
  },
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Interior',
    questionText: 'Do the door frames need to be replaced or are you keeping existing frames?',
    responseType: 'choice',
    options: [
      'Keep existing frames (just replace doors)',
      'Replace frames too (damaged or wrong size)',
      'Not sure - depends on condition'
    ],
    requiredForScope: 1,
    conditionalTag: "if answer_contains('Interior')",
    sequence: 4
  },
  
  {
    serviceType: 'Door Installation',
    subcategory: 'Interior',
    questionText: 'Do you need new door handles and hardware?',
    responseType: 'choice',
    options: [
      'Yes - new handles for all doors',
      'Yes - matching decorative set',
      'No - reusing existing hardware',
      'Mix - some doors need new hardware'
    ],
    requiredForScope: 0,
    conditionalTag: "if answer_contains('Interior')",
    sequence: 5
  },
  
  // ========== DOOR REPAIR QUESTIONS ==========
  
  {
    serviceType: 'Door Repair',
    subcategory: null,
    questionText: 'What issue are you experiencing with your door?',
    responseType: 'choice',
    options: [
      'Door won\'t close properly (warped/misaligned)',
      'Damaged door (crack, hole, rot)',
      'Hardware broken (handle, lock, hinges)',
      'Door sticks or drags on floor',
      'Weather stripping needs replacement',
      'Multiple issues'
    ],
    requiredForScope: 1,
    conditionalTag: null,
    sequence: 1
  },
  
  {
    serviceType: 'Door Repair',
    subcategory: null,
    questionText: 'Is this an interior or exterior door?',
    responseType: 'choice',
    options: ['Exterior', 'Interior'],
    requiredForScope: 1,
    conditionalTag: null,
    sequence: 2
  },
  
  {
    serviceType: 'Door Repair',
    subcategory: null,
    questionText: 'How long have you had this problem?',
    responseType: 'choice',
    options: [
      'Just started recently',
      'A few months',
      'Over a year',
      'It\'s been getting progressively worse'
    ],
    requiredForScope: 0,
    conditionalTag: null,
    sequence: 3
  }
];

async function seedDoorQuestions() {
  console.log('🚪 Seeding Door-Specific Question Flows...\n');
  
  try {
    let count = 0;
    for (const question of doorQuestions) {
      await db.insert(serviceQuestions).values(question);
      count++;
      const required = question.requiredForScope === 1 ? '✓ REQUIRED' : '  optional';
      const conditional = question.conditionalTag ? ` [IF: ${question.conditionalTag}]` : '';
      console.log(`${required} | Seq ${question.sequence}: ${question.questionText}${conditional}`);
    }
    
    console.log(`\n✅ Successfully added ${count} door-specific questions!`);
    console.log('\n📚 The system will now ask detailed questions about:');
    console.log('   • Interior vs Exterior');
    console.log('   • Door styles (solid, glass, panel, French, barn, etc.)');
    console.log('   • Materials (wood, fiberglass, steel)');
    console.log('   • Frame condition and replacement needs');
    console.log('   • Hardware requirements (locks, handles, hinges)');
    console.log('   • Storm doors and additional features');
    console.log('\n💡 These questions will help gather cost-relevant details!');
    console.log('   The RAG system learns from completed jobs to refine future questions.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDoorQuestions();

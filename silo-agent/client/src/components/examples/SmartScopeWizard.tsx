import SmartScopeWizard from '../SmartScopeWizard';

const sampleQuestions = [
  {
    id: "fence-type",
    question: "What type of fence?",
    options: ["Wood", "Vinyl", "Chain Link"]
  },
  {
    id: "length",
    question: "Approximate length?",
    options: ["10-25ft", "25-50ft", "50+"]
  },
  {
    id: "issue",
    question: "What's wrong with it?",
    options: ["Leaning", "Broken boards", "Rotting posts"]
  },
  {
    id: "photos",
    question: "Would you like to upload photos?",
    options: [],
    optional: true
  },
  {
    id: "timing",
    question: "When would you like the work done?",
    options: ["ASAP", "This week", "Flexible"]
  }
];

export default function SmartScopeWizardExample() {
  return (
    <SmartScopeWizard
      questions={sampleQuestions}
      onComplete={(answers) => console.log('Completed:', answers)}
      isGenerating={false}
    />
  );
}

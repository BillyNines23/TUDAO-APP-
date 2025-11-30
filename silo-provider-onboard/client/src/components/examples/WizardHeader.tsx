import WizardHeader from '../WizardHeader';

export default function WizardHeaderExample() {
  const steps = [
    { number: 1, label: "Account" },
    { number: 2, label: "Business" },
    { number: 3, label: "Documents" },
    { number: 4, label: "Legal" },
    { number: 5, label: "Review" },
  ];

  return <WizardHeader currentStep={2} steps={steps} />;
}

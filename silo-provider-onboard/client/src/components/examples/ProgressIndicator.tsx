import ProgressIndicator from '../ProgressIndicator';

export default function ProgressIndicatorExample() {
  const steps = [
    { number: 1, label: "Account" },
    { number: 2, label: "Business" },
    { number: 3, label: "Documents" },
    { number: 4, label: "Legal" },
    { number: 5, label: "Review" },
  ];

  return (
    <div className="p-6 bg-background">
      <ProgressIndicator steps={steps} currentStep={3} />
    </div>
  );
}

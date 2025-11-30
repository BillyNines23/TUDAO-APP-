import LegalStep from '../steps/LegalStep';

export default function LegalStepExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <LegalStep
        onNext={() => console.log("Next")}
        onBack={() => console.log("Back")}
      />
    </div>
  );
}

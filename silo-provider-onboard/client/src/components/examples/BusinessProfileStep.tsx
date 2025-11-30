import BusinessProfileStep from '../steps/BusinessProfileStep';

export default function BusinessProfileStepExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <BusinessProfileStep
        onNext={(data) => console.log("Next:", data)}
        onBack={() => console.log("Back")}
      />
    </div>
  );
}

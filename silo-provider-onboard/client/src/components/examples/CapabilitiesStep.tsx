import CapabilitiesStep from '../steps/CapabilitiesStep';

export default function CapabilitiesStepExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <CapabilitiesStep
        onNext={(data) => console.log("Next:", data)}
        onBack={() => console.log("Back")}
      />
    </div>
  );
}

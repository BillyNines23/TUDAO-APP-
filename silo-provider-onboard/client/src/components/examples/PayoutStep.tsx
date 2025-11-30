import PayoutStep from '../steps/PayoutStep';

export default function PayoutStepExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <PayoutStep
        onNext={(data) => console.log("Next:", data)}
        onBack={() => console.log("Back")}
      />
    </div>
  );
}

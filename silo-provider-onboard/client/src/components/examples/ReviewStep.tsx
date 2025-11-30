import ReviewStep from '../steps/ReviewStep';

export default function ReviewStepExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <ReviewStep
        onSubmit={() => console.log("Submitted")}
        onBack={() => console.log("Back")}
      />
    </div>
  );
}

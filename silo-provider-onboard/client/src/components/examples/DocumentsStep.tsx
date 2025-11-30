import DocumentsStep from '../steps/DocumentsStep';

export default function DocumentsStepExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <DocumentsStep
        onNext={() => console.log("Next")}
        onBack={() => console.log("Back")}
      />
    </div>
  );
}

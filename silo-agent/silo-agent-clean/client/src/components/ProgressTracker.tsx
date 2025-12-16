import { Check } from "lucide-react";

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressTracker({ currentStep, totalSteps }: ProgressTrackerProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all ${
              step < currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : step === currentStep
                ? "border-primary bg-background text-primary"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {step < currentStep ? <Check className="h-4 w-4" /> : step}
          </div>
        ))}
      </div>
    </div>
  );
}

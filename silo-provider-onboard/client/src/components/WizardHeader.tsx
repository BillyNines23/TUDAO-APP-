import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressIndicator from "./ProgressIndicator";

interface WizardHeaderProps {
  currentStep: number;
  steps: Array<{ number: number; label: string }>;
}

export default function WizardHeader({ currentStep, steps }: WizardHeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <span className="text-lg font-semibold">TUDAO</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open("https://tudao.org/constitution", "_blank")}
            data-testid="link-constitution-header"
          >
            TUDAO Constitution
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <ProgressIndicator steps={steps} currentStep={currentStep} />
      </div>
    </header>
  );
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wrench, HardHat } from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";

interface ChooseActionScreenProps {
  onRequestService: () => void;
  onBecomeProvider: () => void;
}

export default function ChooseActionScreen({ 
  onRequestService, 
  onBecomeProvider 
}: ChooseActionScreenProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="TUDAO"
            className="h-12 w-12"
            data-testid="img-logo-small"
          />
        </div>

        <ProgressTracker currentStep={1} totalSteps={8} />

        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            What would you like to do today?
          </h2>

          <div className="grid gap-4 pt-4 md:grid-cols-2">
            <Card
              className="cursor-pointer p-6 space-y-4 hover-elevate active-elevate-2 transition-all"
              onClick={onRequestService}
              data-testid="card-request-service"
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Request a Service
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get help from verified skilled workers in your area
                </p>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-6 space-y-4 hover-elevate active-elevate-2 transition-all"
              onClick={onBecomeProvider}
              data-testid="card-become-provider"
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <HardHat className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Become a Provider
                </h3>
                <p className="text-sm text-muted-foreground">
                  Join our network of verified service providers
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

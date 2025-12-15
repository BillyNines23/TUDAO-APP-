import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";

interface ConfirmationScreenProps {
  onNewRequest?: () => void;
}

export default function ConfirmationScreen({ onNewRequest }: ConfirmationScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="TUDAO"
            className="h-16 w-16"
            data-testid="img-logo-small"
          />
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" data-testid="icon-success" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Your request has been submitted!
            </h2>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              You'll receive updates as vendors confirm scheduling. We'll notify you when your provider is ready to start.
            </p>
          </div>

          {onNewRequest && (
            <div className="pt-4">
              <Button
                variant="outline"
                size="lg"
                className="max-w-xs"
                onClick={onNewRequest}
                data-testid="button-new-request"
              >
                Submit Another Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

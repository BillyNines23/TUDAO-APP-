import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Calendar, CreditCard, Bitcoin, ArrowLeft } from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";

interface ProposalDetailsProps {
  vendorName: string;
  scope: string;
  cost: number;
  timeWindow: string;
  onSubmit: () => void;
  onBack: () => void;
}

export default function ProposalDetails({
  vendorName,
  scope,
  cost,
  timeWindow,
  onSubmit,
  onBack
}: ProposalDetailsProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
          <img
            src={logoUrl}
            alt="TUDAO"
            className="h-10 w-10"
            data-testid="img-logo-small"
          />
        </div>

        <ProgressTracker currentStep={7} totalSteps={8} />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Proposal from {vendorName}
            </h2>
          </div>

          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Job Scope
                </h3>
                <p className="text-base text-foreground" data-testid="text-scope">
                  {scope}
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cost Estimate</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-cost">
                      ${cost}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time Window</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <p className="text-base font-medium text-foreground" data-testid="text-time">
                        {timeWindow}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Payment Options
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-sm">
                    <Bitcoin className="mr-1 h-3 w-3" />
                    Crypto
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <CreditCard className="mr-1 h-3 w-3" />
                    Card
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-3 rounded-lg bg-primary/5 p-4">
                  <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Secure Escrow Protection
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Funds are securely held in smart contract and released upon completion
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold"
            onClick={onSubmit}
            data-testid="button-submit-request"
          >
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReviewStepProps {
  onSubmit?: () => void;
  onBack?: () => void;
  applicationData?: any;
}

type CheckStatus = "pending" | "checking" | "pass" | "fail";

interface VerificationCheck {
  id: string;
  label: string;
  status: CheckStatus;
  message?: string;
}

export default function ReviewStep({ onSubmit, onBack, applicationData }: ReviewStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [checks, setChecks] = useState<VerificationCheck[]>([
    { id: "ein", label: "EIN Document Verification", status: "pending" },
    { id: "license", label: "Trade License Validation", status: "pending" },
    { id: "insurance", label: "Insurance Coverage Check (≥$1M)", status: "pending" },
    { id: "wallet", label: "Wallet Address Validation", status: "pending" },
    { id: "mpa", label: "MPA Signature Verification", status: "pending" },
  ]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate auto-checks running
    for (let i = 0; i < checks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setChecks((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: "checking" };
        return updated;
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));
      setChecks((prev) => {
        const updated = [...prev];
        const passed = Math.random() > 0.2; // 80% pass rate for demo
        updated[i] = {
          ...updated[i],
          status: passed ? "pass" : "fail",
          message: passed ? undefined : "Requires manual review",
        };
        return updated;
      });
    }

    setIsSubmitting(false);
    setHasSubmitted(true);
    onSubmit?.();
    console.log("Application submitted with auto-check results");
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "checking":
        return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "fail":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground">
          Review your application and run automated verification checks before submitting
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Summary</CardTitle>
          <CardDescription>Please review all information before submitting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">Business Name</span>
              <span className="font-medium">ABC Services LLC</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">EIN</span>
              <span className="font-medium">**-***6789</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Trades</span>
              <span className="font-medium">Plumbing, Electrical, HVAC</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Service Regions</span>
              <span className="font-medium">CA, NY, TX</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Payout Method</span>
              <span className="font-medium">USDC on Base</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">MPA Status</span>
              <span className="font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Signed v2.1
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {(isSubmitting || hasSubmitted) && (
        <Card>
          <CardHeader>
            <CardTitle>Automated Verification Checks</CardTitle>
            <CardDescription>Running real-time verification on your submitted documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  data-testid={`check-${check.id}`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="text-sm font-medium">{check.label}</p>
                      {check.message && <p className="text-xs text-muted-foreground">{check.message}</p>}
                    </div>
                  </div>
                  {check.status === "pass" && <span className="text-xs text-green-600 font-medium">Verified</span>}
                  {check.status === "fail" && <span className="text-xs text-red-600 font-medium">Review Required</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasSubmitted && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="font-medium mb-1">Application Submitted Successfully!</p>
            <p className="text-sm text-muted-foreground">
              Your application is now in the review queue. Our team will review your documents and verification
              results. You can expect a decision within 1-3 business days. You'll receive an email notification once
              the review is complete.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} data-testid="button-back-review">
          Back
        </Button>
        {!hasSubmitted ? (
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" data-testid="button-submit-application">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Checks...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"} data-testid="button-go-dashboard">
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}

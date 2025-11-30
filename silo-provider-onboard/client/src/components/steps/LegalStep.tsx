import { useState } from "react";
import { FileText, Shield, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import MPAModal from "../MPAModal";

interface LegalStepProps {
  onNext?: () => void;
  onBack?: () => void;
  signerName?: string;
  walletAddress?: string;
}

export default function LegalStep({
  onNext,
  onBack,
  signerName = "John Smith",
  walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
}: LegalStepProps) {
  const [mpaModalOpen, setMpaModalOpen] = useState(false);
  const [mpaSigned, setMpaSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string>("");
  const [i9Certified, setI9Certified] = useState(false);

  const handleSign = (data: { signerName: string; walletAddress: string }) => {
    setMpaSigned(true);
    setSignedAt(new Date().toLocaleString());
    console.log("MPA signed:", data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Legal & Compliance</h2>
        <p className="text-muted-foreground">
          Review and sign the Master Provider Agreement to complete your application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Master Provider Agreement
          </CardTitle>
          <CardDescription>Required to participate in the TUDAO marketplace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-md border space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Version 2.1</p>
                <p className="text-sm text-muted-foreground">Effective March 1, 2025</p>
              </div>
              {mpaSigned && (
                <div className="flex items-center gap-2 text-green-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Signed</span>
                </div>
              )}
            </div>

            {mpaSigned && (
              <div className="pt-3 border-t text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signed by:</span>
                  <span className="font-medium">{signerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="font-medium">{signedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wallet:</span>
                  <span className="font-mono text-xs">{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</span>
                </div>
              </div>
            )}
          </div>

          <Button
            variant={mpaSigned ? "outline" : "default"}
            className="w-full"
            onClick={() => setMpaModalOpen(true)}
            data-testid="button-review-mpa"
          >
            <FileText className="w-4 h-4 mr-2" />
            {mpaSigned ? "Review Agreement" : "Review & Sign Agreement"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            I-9 Employment Compliance
          </CardTitle>
          <CardDescription>Federal employment eligibility verification certification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All service providers must comply with federal I-9 requirements. By checking the box below, you certify
            that your business maintains proper I-9 documentation for all employees and contractors.
          </p>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  E-Verify: Best Practice for Employment Verification
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  E-Verify is a free, government-provided online system that electronically verifies employee work 
                  authorization. While not required for all businesses, E-Verify enrollment is considered a best 
                  practice for maintaining compliance with federal employment verification requirements.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://www.e-verify.gov/", "_blank")}
                  data-testid="button-everify-link"
                >
                  Learn About E-Verify
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-md border space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="i9-certification"
                checked={i9Certified}
                onCheckedChange={(checked) => setI9Certified(checked as boolean)}
                data-testid="checkbox-i9-certification"
              />
              <Label htmlFor="i9-certification" className="text-sm leading-relaxed cursor-pointer">
                <div className="space-y-2">
                  <p className="font-medium">I-9 Compliance Certification:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>I maintain valid I-9 Employment Eligibility Verification forms for all employees</li>
                    <li>All forms are properly completed and stored as required by federal law</li>
                    <li>I understand TUDAO may request verification of compliance at any time</li>
                    <li>I acknowledge that non-compliance may result in marketplace suspension or termination</li>
                  </ul>
                </div>
              </Label>
            </div>
            
            {i9Certified && (
              <div className="flex items-center gap-2 text-green-600 pt-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Compliance Certified</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            TUDAO Constitution
          </CardTitle>
          <CardDescription>Governance framework and policy guidelines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Master Provider Agreement operates within the policy framework of the TUDAO Constitution. The
            Constitution defines governance processes, dispute resolution, and community standards.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open("https://tudao.org/constitution", "_blank")}
            data-testid="button-view-constitution-legal"
          >
            View TUDAO Constitution
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back-legal">
          Back
        </Button>
        <Button onClick={onNext} disabled={!mpaSigned || !i9Certified} size="lg" data-testid="button-next-legal">
          Continue to Review
        </Button>
      </div>

      <MPAModal
        open={mpaModalOpen}
        onOpenChange={setMpaModalOpen}
        signerName={signerName}
        walletAddress={walletAddress}
        onSign={handleSign}
      />
    </div>
  );
}

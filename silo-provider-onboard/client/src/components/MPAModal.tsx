import { useState, useRef } from "react";
import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface MPAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign?: (data: { signerName: string; walletAddress: string }) => void;
  signerName?: string;
  walletAddress?: string;
}

export default function MPAModal({ open, onOpenChange, onSign, signerName = "", walletAddress = "" }: MPAModalProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreedToMPA, setAgreedToMPA] = useState(false);
  const [acknowledgedConstitution, setAcknowledgedConstitution] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (element) {
      const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
      if (isAtBottom && !scrolledToEnd) {
        setScrolledToEnd(true);
      }
    }
  };

  const handleSign = () => {
    if (agreedToMPA && acknowledgedConstitution) {
      onSign?.({ signerName, walletAddress });
      console.log("MPA signed:", { signerName, walletAddress, timestamp: new Date().toISOString() });
      onOpenChange(false);
    }
  };

  const canSign = scrolledToEnd && agreedToMPA && acknowledgedConstitution;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col" data-testid="modal-mpa">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <DialogTitle>Master Provider Agreement</DialogTitle>
          </div>
          <DialogDescription>Version 2.1 - Effective March 1, 2025</DialogDescription>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto pr-4" 
          onScroll={handleScroll}
          ref={scrollRef}
        >
          <div className="space-y-4 text-sm pb-4">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Scope of Agreement</h3>
              <p className="text-muted-foreground leading-relaxed">
                This Master Provider Agreement ("Agreement") establishes the terms under which the Provider may
                participate in the TUDAO marketplace platform. By signing this Agreement, Provider acknowledges
                understanding of all terms and conditions outlined herein.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Provider Obligations</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Provider agrees to maintain all required licenses, insurance, and certifications in good standing
                throughout the term of this Agreement. Provider shall:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Maintain general liability insurance of at least $1,000,000 per occurrence</li>
                <li>Keep all trade licenses current and valid in jurisdictions of operation</li>
                <li>Provide timely notification of any changes to business structure or ownership</li>
                <li>Comply with all applicable federal, state, and local regulations</li>
                <li>Maintain professional standards in all customer interactions</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Compensation Structure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Provider compensation is policy-based and variable, subject to DAO governance vote. Payment terms,
                rates, and reward structures may be adjusted through the constitutional governance process. All
                payments will be processed according to the payout method selected during onboarding.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Platform Usage Rights</h3>
              <p className="text-muted-foreground leading-relaxed">
                TUDAO grants Provider a limited, non-exclusive license to access and use the marketplace platform
                for business purposes. This license may be revoked if Provider violates terms of service or fails
                to maintain required standards.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Quality Standards</h3>
              <p className="text-muted-foreground leading-relaxed">
                Provider agrees to maintain quality standards as defined by the platform, including response times,
                completion rates, and customer satisfaction metrics. Failure to meet standards may result in tier
                adjustment or account suspension.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Dispute Resolution</h3>
              <p className="text-muted-foreground leading-relaxed">
                Any disputes arising from this Agreement shall be resolved through the TUDAO dispute resolution
                process as outlined in the governance documentation. Both parties agree to participate in good
                faith in mediation before pursuing other remedies.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Termination</h3>
              <p className="text-muted-foreground leading-relaxed">
                Either party may terminate this Agreement with 30 days written notice. TUDAO reserves the right
                to immediate termination in cases of fraud, safety violations, or material breach of terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Constitutional Framework</h3>
              <p className="text-muted-foreground leading-relaxed">
                This Agreement operates within the policy framework of the TUDAO Constitution. Changes to the
                Constitution may affect the terms and conditions of this Agreement. Provider acknowledges that
                DAO governance decisions are binding.
              </p>
            </section>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground italic">
                For the complete TUDAO Constitution and governance documentation, visit{" "}
                <a href="https://tudao.org/constitution" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  tudao.org/constitution
                </a>
              </p>
            </div>
          </div>
        </div>

        {!scrolledToEnd && (
          <div className="py-2 text-center text-sm text-muted-foreground bg-muted/50 rounded-md">
            Scroll to bottom to enable signature
          </div>
        )}

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-mpa"
                checked={agreedToMPA}
                onCheckedChange={(checked) => setAgreedToMPA(checked as boolean)}
                disabled={!scrolledToEnd}
                data-testid="checkbox-agree-mpa"
              />
              <label htmlFor="agree-mpa" className="text-sm leading-tight cursor-pointer">
                I agree to the Master Provider Agreement (v2.1)
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="acknowledge-constitution"
                checked={acknowledgedConstitution}
                onCheckedChange={(checked) => setAcknowledgedConstitution(checked as boolean)}
                disabled={!scrolledToEnd}
                data-testid="checkbox-acknowledge-constitution"
              />
              <label htmlFor="acknowledge-constitution" className="text-sm leading-tight cursor-pointer">
                I acknowledge the TUDAO Constitution may update DAO policy
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md text-sm">
            <div>
              <span className="text-muted-foreground">Signer Name:</span>
              <p className="font-medium font-mono">{signerName || "Not provided"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Wallet Address:</span>
              <p className="font-medium font-mono text-xs truncate">{walletAddress || "Not connected"}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" data-testid="button-cancel-mpa">
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={!canSign} className="flex-1" data-testid="button-sign-mpa">
              Sign Agreement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

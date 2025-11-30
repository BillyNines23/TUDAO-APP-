import { useState } from "react";
import { FileText, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DocumentUploadCard from "../DocumentUploadCard";

interface DocumentsStepProps {
  onNext?: () => void;
  onBack?: () => void;
}

export default function DocumentsStep({ onNext, onBack }: DocumentsStepProps) {
  const [uploads, setUploads] = useState({
    ein: false,
    license: false,
    insurance: false,
    ownerId: false,
    i9: false,
  });

  const handleFileUpload = (type: keyof typeof uploads) => {
    setUploads((prev) => ({ ...prev, [type]: true }));
  };

  const canProceed = uploads.ein && uploads.license && uploads.insurance && uploads.ownerId && uploads.i9;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Document Upload</h2>
        <p className="text-muted-foreground">
          Upload required documents for verification. All files are encrypted and securely stored.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <DocumentUploadCard
          type="EIN"
          label="EIN/IRS Letter"
          description="Official IRS letter confirming your EIN"
          required
          onFileSelect={() => handleFileUpload("ein")}
        />

        <DocumentUploadCard
          type="LICENSE"
          label="Trade License"
          description="State-issued trade license with number and expiry"
          required
          onFileSelect={() => handleFileUpload("license")}
        />

        <DocumentUploadCard
          type="INSURANCE"
          label="Insurance COI"
          description="Certificate of Insurance (GL ≥ $1M per occurrence)"
          required
          onFileSelect={() => handleFileUpload("insurance")}
        />

        <DocumentUploadCard
          type="OWNER_ID"
          label="Owner Identification"
          description="Driver's license or passport"
          required
          onFileSelect={() => handleFileUpload("ownerId")}
        />

        <DocumentUploadCard
          type="I9"
          label="I-9 Documentation"
          description="Employment eligibility verification forms for employees"
          required
          onFileSelect={() => handleFileUpload("i9")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Additional Credentials (Optional)
          </CardTitle>
          <CardDescription className="text-sm">
            Upload any additional certifications like OSHA, EPA, or specialized trade credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadCard
            type="OTHER"
            label="Additional Certifications"
            description="OSHA, EPA, or other specialized credentials"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back-documents">
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg" data-testid="button-next-documents">
          Continue to Capabilities
        </Button>
      </div>
    </div>
  );
}

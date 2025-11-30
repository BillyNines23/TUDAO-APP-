import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WireInstructionsProps {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountName: string;
  bankAddress: string;
  amount: number;
  referenceNumber: string;
  onClose?: () => void;
}

export function WireInstructions({
  bankName,
  routingNumber,
  accountNumber,
  accountName,
  bankAddress,
  amount,
  referenceNumber,
  onClose
}: WireInstructionsProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => copyToClipboard(text, field)}
      data-testid={`button-copy-${field.toLowerCase().replace(/\s/g, '-')}`}
    >
      {copiedField === field ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Card className="border-primary/20" data-testid="card-wire-instructions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Wire Transfer Instructions
        </CardTitle>
        <CardDescription>
          Send exactly ${amount.toLocaleString()} USD to the following account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <div className="text-xs text-muted-foreground">Bank Name</div>
              <div className="font-medium" data-testid="text-bank-name">{bankName}</div>
            </div>
            <CopyButton text={bankName} field="Bank Name" />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <div className="text-xs text-muted-foreground">Routing Number</div>
              <div className="font-medium font-mono" data-testid="text-routing-number">{routingNumber}</div>
            </div>
            <CopyButton text={routingNumber} field="Routing Number" />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <div className="text-xs text-muted-foreground">Account Number</div>
              <div className="font-medium font-mono" data-testid="text-account-number">{accountNumber}</div>
            </div>
            <CopyButton text={accountNumber} field="Account Number" />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <div className="text-xs text-muted-foreground">Account Name</div>
              <div className="font-medium" data-testid="text-account-name">{accountName}</div>
            </div>
            <CopyButton text={accountName} field="Account Name" />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <div className="text-xs text-muted-foreground">Bank Address</div>
              <div className="font-medium text-sm" data-testid="text-bank-address">{bankAddress}</div>
            </div>
            <CopyButton text={bankAddress} field="Bank Address" />
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md">
            <div>
              <div className="text-xs text-primary font-semibold">Reference Number (IMPORTANT)</div>
              <div className="font-bold font-mono text-primary" data-testid="text-reference-number">{referenceNumber}</div>
            </div>
            <CopyButton text={referenceNumber} field="Reference Number" />
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-2">
          <div className="font-semibold text-sm">Important Instructions:</div>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Include the reference number <strong className="text-foreground">{referenceNumber}</strong> in your wire transfer</li>
            <li>• Transfer amount must be exactly <strong className="text-foreground">${amount.toLocaleString()} USD</strong></li>
            <li>• Processing typically takes 1-3 business days</li>
            <li>• Your NFT will be minted automatically once payment is confirmed</li>
          </ul>
        </div>

        {onClose && (
          <Button 
            onClick={onClose} 
            className="w-full" 
            size="lg"
            data-testid="button-close-instructions"
          >
            I've Sent the Wire Transfer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

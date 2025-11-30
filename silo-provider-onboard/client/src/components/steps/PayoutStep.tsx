import { useState } from "react";
import { Wallet, DollarSign, AlertCircle, Zap, Clock, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PayoutStepProps {
  onNext?: (data: any) => void;
  onBack?: () => void;
  walletAddress?: string;
}

export default function PayoutStep({ onNext, onBack, walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" }: PayoutStepProps) {
  const [payoutMethod, setPayoutMethod] = useState<"USDC" | "ACH">("USDC");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");

  const handleSubmit = () => {
    const data = {
      method: payoutMethod,
      details:
        payoutMethod === "USDC"
          ? { walletAddress }
          : {
              routing: routingNumber,
              account: accountNumber.slice(-4).padStart(accountNumber.length, "*"),
            },
    };
    onNext?.(data);
    console.log("Payout setup completed:", data);
  };

  const canProceed =
    payoutMethod === "USDC" ||
    (payoutMethod === "ACH" && routingNumber && accountNumber && accountNumber === confirmAccountNumber);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Payout Preference</h2>
        <p className="text-muted-foreground">Choose how you'd like to receive payments for completed work</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Payout Method</CardTitle>
          <CardDescription>Rewards are policy-based and variable, subject to DAO vote</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={payoutMethod} onValueChange={(value) => setPayoutMethod(value as "USDC" | "ACH")}>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border-2 border-primary/50 bg-primary/5 rounded-md hover-elevate cursor-pointer">
                <RadioGroupItem value="USDC" id="usdc" data-testid="radio-usdc" />
                <label htmlFor="usdc" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="font-medium">USDC on Base</span>
                    <Badge variant="default" className="ml-1">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Receive payments in USDC stablecoin (pegged 1:1 to USD) on the Base network
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-3 h-3 text-green-600" />
                      <span>Instant settlement (seconds)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingDown className="w-3 h-3 text-green-600" />
                      <span>Minimal fees (~$0.01 per transaction)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>No bank intermediaries</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-md hover-elevate cursor-pointer">
                <RadioGroupItem value="ACH" id="ach" data-testid="radio-ach" />
                <label htmlFor="ach" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-medium">ACH Bank Transfer (Fiat)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Traditional USD bank transfer to your business checking account
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>3-5 business day settlement</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-3 h-3" />
                      <span>Higher processing fees ($1-5 per transfer)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-3 h-3" />
                      <span>Subject to banking hours/holidays</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </RadioGroup>

          {payoutMethod === "USDC" && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900 dark:text-green-100">
                <span className="font-medium">Great choice!</span> USDC provides the fastest, most cost-effective
                payouts. You can easily convert USDC to fiat currency through exchanges if needed.
              </AlertDescription>
            </Alert>
          )}

          {payoutMethod === "ACH" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                While we support traditional bank transfers, we encourage trying USDC for faster payments with
                lower fees. You can always change your payout method later in your dashboard settings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {payoutMethod === "USDC" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connected Wallet
            </CardTitle>
            <CardDescription>Your Base network wallet for USDC payouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-md border">
              <Label className="text-xs text-muted-foreground mb-1 block">Wallet Address</Label>
              <p className="font-mono text-sm break-all" data-testid="text-payout-wallet">
                {walletAddress}
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                All payments will be sent to this wallet address on the Base network as USDC. Make sure you have
                access to this wallet and can receive Base network transactions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {payoutMethod === "ACH" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>Enter your business bank account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routing">Routing Number</Label>
              <Input
                id="routing"
                placeholder="123456789"
                maxLength={9}
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ""))}
                data-testid="input-routing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account Number</Label>
              <Input
                id="account"
                type="password"
                placeholder="Account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                data-testid="input-account"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-account">Confirm Account Number</Label>
              <Input
                id="confirm-account"
                type="password"
                placeholder="Re-enter account number"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ""))}
                data-testid="input-confirm-account"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your account information is encrypted and securely stored. Only the last 4 digits will be visible
                in your profile.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back-payout">
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!canProceed} size="lg" data-testid="button-next-payout">
          Continue to Legal
        </Button>
      </div>
    </div>
  );
}

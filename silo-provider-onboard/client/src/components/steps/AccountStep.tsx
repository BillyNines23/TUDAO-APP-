import { useState } from "react";
import { Wallet, Mail, Lock, CheckCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AccountStepProps {
  onNext?: (data: any) => void;
}

export default function AccountStep({ onNext }: AccountStepProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletOption, setWalletOption] = useState<"existing" | "embedded">("embedded");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleConnectWallet = () => {
    // Simulate wallet connection
    const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    setWalletAddress(mockAddress);
    setWalletConnected(true);
    console.log("External wallet connected:", mockAddress);
  };

  const handleCreateEmbeddedWallet = () => {
    // Simulate embedded wallet creation
    const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setWalletAddress(mockAddress);
    setWalletConnected(true);
    console.log("Embedded wallet created:", mockAddress);
  };

  const handleSubmit = () => {
    if (email && password && password === confirmPassword && walletConnected && agreedToTerms) {
      onNext?.({ email, walletAddress, walletType: walletOption });
      console.log("Account step completed:", { email, walletAddress, walletType: walletOption });
    }
  };

  const canProceed = email && password && password === confirmPassword && walletConnected && agreedToTerms;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Create Your Account</h2>
        <p className="text-muted-foreground">
          Set up your provider account and connect your Web3 wallet on Base network
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Account Credentials
          </CardTitle>
          <CardDescription>Your email and password for platform access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="input-confirm-password"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Setup
          </CardTitle>
          <CardDescription>Choose how you'd like to set up your wallet for Web3 payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!walletConnected ? (
            <>
              <RadioGroup value={walletOption} onValueChange={(value) => setWalletOption(value as "existing" | "embedded")}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 border rounded-md hover-elevate cursor-pointer">
                    <RadioGroupItem value="embedded" id="embedded" data-testid="radio-embedded-wallet" />
                    <label htmlFor="embedded" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-medium">Create Embedded Wallet (Recommended)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We'll create a secure wallet for you automatically. Great for users new to crypto - no wallet app needed.
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-4 border rounded-md hover-elevate cursor-pointer">
                    <RadioGroupItem value="existing" id="existing" data-testid="radio-existing-wallet" />
                    <label htmlFor="existing" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span className="font-medium">Connect Existing Wallet</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Connect your MetaMask, Coinbase Wallet, or other Web3 wallet on Base network.
                      </p>
                    </label>
                  </div>
                </div>
              </RadioGroup>

              {walletOption === "embedded" && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your embedded wallet will be secured by your account password. You can export or connect it to a wallet app later.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={walletOption === "embedded" ? handleCreateEmbeddedWallet : handleConnectWallet}
                className="w-full"
                data-testid={walletOption === "embedded" ? "button-create-embedded" : "button-connect-wallet"}
              >
                {walletOption === "embedded" ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Embedded Wallet
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet on Base
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {walletOption === "embedded" ? "Embedded Wallet Created" : "Wallet Connected"}
                </p>
                <p className="text-xs font-mono text-green-700 dark:text-green-300 truncate" data-testid="text-wallet-address">
                  {walletAddress}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              data-testid="checkbox-terms"
            />
            <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
              I consent to the privacy policy and data use for identity verification purposes. I understand that my
              information will be securely stored and used only for onboarding verification.
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!canProceed} size="lg" data-testid="button-next-account">
          Continue to Business Profile
        </Button>
      </div>
    </div>
  );
}

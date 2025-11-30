import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { Wallet, KeyRound, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { thirdwebClient } from "@/lib/thirdweb";
import { config } from "@/lib/config";
import { base, baseSepolia } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

interface WalletOptionsProps {
  value: string;
  onChange: (address: string) => void;
}

export function WalletOptions({ value, onChange }: WalletOptionsProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [mode, setMode] = useState<"connected" | "manual" | "embedded" | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const chain = config.chainId === 84532 ? baseSepolia : base;

  // Initialize and sync mode based on value prop
  useEffect(() => {
    if (!value) {
      // No value - check if wallet connected
      if (account?.address) {
        setMode("connected");
        onChange(account.address);
      } else {
        setMode(null);
        setManualAddress("");
      }
    } else if (value === account?.address) {
      // Value matches connected wallet
      setMode("connected");
      setManualAddress("");
    } else {
      // Value is a manual address
      setMode("manual");
      setManualAddress(value);
    }
  }, [value, account?.address, onChange]);

  const handleConnectedWallet = () => {
    if (account?.address) {
      setMode("connected");
      onChange(account.address);
    }
  };

  const handleManualAddressChange = (address: string) => {
    setManualAddress(address);
    
    // Auto-validate and sync on every keystroke if valid
    const trimmed = address.trim();
    if (trimmed.match(/^0x[a-fA-F0-9]{40}$/)) {
      setMode("manual");
      onChange(trimmed);
    } else if (trimmed.length === 0) {
      // Clear if empty
      if (mode === "manual") {
        setMode(null);
        onChange("");
      }
    }
  };

  const confirmManualAddress = () => {
    const address = manualAddress.trim();
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address (0x...)",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Address confirmed",
      description: `NFT will be sent to ${address.slice(0, 6)}...${address.slice(-4)}`,
    });
  };


  return (
    <div className="space-y-4" data-testid="wallet-options-container">
      <div className="space-y-2">
        <Label className="text-base font-semibold">
          Where should we send your NFT?
        </Label>
        <p className="text-sm text-muted-foreground">
          {account?.address 
            ? "Use your connected wallet or enter a different address" 
            : "Create a Coinbase Smart Wallet with passkeys, or enter an existing address"}
        </p>
      </div>

      <div className="grid gap-3">
        {/* Option 1: Connected Wallet */}
        {account?.address && (
          <Card
            className={`p-4 cursor-pointer transition hover-elevate ${
              mode === "connected" ? "border-primary border-2" : ""
            }`}
            onClick={handleConnectedWallet}
            data-testid="wallet-option-connected"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {mode === "connected" ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">Connected Wallet</span>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Use your connected wallet address
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </code>
              </div>
            </div>
          </Card>
        )}

        {/* Option 2: Coinbase Smart Wallet */}
        {!account?.address && (
          <Card className="p-4" data-testid="wallet-option-coinbase">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="h-5 w-5" viewBox="0 0 48 48" fill="none">
                  <path d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z" fill="#0052FF"/>
                  <path d="M23.9999 35.8571C30.5462 35.8571 35.8571 30.5462 35.8571 23.9999C35.8571 17.4537 30.5462 12.1428 23.9999 12.1428C17.4537 12.1428 12.1428 17.4537 12.1428 23.9999C12.1428 30.5462 17.4537 35.8571 23.9999 35.8571Z" fill="white"/>
                </svg>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Coinbase Smart Wallet</span>
                    <Badge variant="secondary" className="text-xs">Easiest</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a wallet with Face ID or email - optimized for Base
                  </p>
                </div>
                <div data-testid="button-create-coinbase-wallet">
                  <ConnectButton
                    client={thirdwebClient}
                    chain={chain}
                    wallets={[
                      createWallet("com.coinbase.wallet", {
                        walletConfig: {
                          options: "smartWalletOnly", // Force Smart Wallet only (no EOA fallback)
                        },
                        chains: [chain], // Base or Base Sepolia
                      })
                    ]}
                    connectButton={{
                      label: "Create Smart Wallet",
                      className: "min-h-9 w-full",
                    }}
                    connectModal={{
                      size: "compact",
                      title: "Create Coinbase Smart Wallet",
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Option 3: Manual Address */}
        <Card className="p-4" data-testid="wallet-option-manual">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {mode === "manual" ? (
                <Check className="h-5 w-5 text-primary" />
              ) : (
                <KeyRound className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="font-semibold mb-1">Enter wallet address</div>
                <p className="text-sm text-muted-foreground">
                  Provide your Ethereum wallet address (MetaMask, Coinbase, etc.)
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="0x..."
                  value={manualAddress}
                  onChange={(e) => handleManualAddressChange(e.target.value)}
                  className="font-mono text-sm"
                  data-testid="input-manual-wallet-address"
                />
                {manualAddress && manualAddress.match(/^0x[a-fA-F0-9]{40}$/) && (
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Valid address - ready to use
                  </p>
                )}
                {manualAddress && !manualAddress.match(/^0x[a-fA-F0-9]{40}$/) && manualAddress.length > 10 && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Address must be 42 characters starting with 0x
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {mode && value && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
            <span className="font-medium text-green-900 dark:text-green-100">
              NFT will be sent to: 
            </span>
            <code className="text-xs bg-background/50 px-2 py-1 rounded">
              {value.slice(0, 6)}...{value.slice(-4)}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

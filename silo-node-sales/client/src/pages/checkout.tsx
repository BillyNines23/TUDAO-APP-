import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useActiveAccount, useSwitchActiveWalletChain, useActiveWalletChain } from "thirdweb/react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { TestModeBanner } from "@/components/TestModeBanner";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { WalletButton } from "@/components/WalletButton";
import { TierBadge } from "@/components/TierBadge";
import { StripeCheckoutForm } from "@/components/StripeCheckoutForm";
import { SquareCheckoutForm } from "@/components/SquareCheckoutForm";
import { WalletOptions } from "@/components/WalletOptions";
import { WireInstructions } from "@/components/WireInstructions";
import { config, formatPrice, isTestMode } from "@/lib/config";
import { apiRequest } from "@/lib/queryClient";
import { thirdwebClient } from "@/lib/thirdweb";
import { CreditCard, Wallet, Building2, Shield, Star, Crown, AlertTriangle, Loader2 } from "lucide-react";
import type { TierName } from "@shared/schema";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { base, baseSepolia } from "thirdweb/chains";
import { getContract, prepareContractCall, sendTransaction, waitForReceipt } from "thirdweb";
import { readContract } from "thirdweb";

// Stripe initialization from blueprint:javascript_stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  
  const params = new URLSearchParams(window.location.search);
  const tierParam = params.get("tier") as TierName | null;
  const tier: TierName = tierParam && ["Verifier", "Professional", "Founder"].includes(tierParam) 
    ? tierParam 
    : "Verifier";

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWireForm, setShowWireForm] = useState(false);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [showSquarePayment, setShowSquarePayment] = useState(false);
  const [cardFormData, setCardFormData] = useState({ 
    name: "", 
    email: "", 
    wallet: account?.address || "",  // CRITICAL: Require wallet address for NFT minting
    paymentMethod: "card" as "card" | "ach" 
  });
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeLoadingState, setStripeLoadingState] = useState(false);
  const [wireFormData, setWireFormData] = useState({ 
    name: "", 
    email: "", 
    wallet: account?.address || "" 
  });
  const [squareFormData, setSquareFormData] = useState({
    name: "",
    email: "",
    wallet: account?.address || ""
  });
  const [wireInstructions, setWireInstructions] = useState<any>(null);
  const [showWireInstructions, setShowWireInstructions] = useState(false);

  const tierConfig = config.tiers[tier];
  const price = formatPrice(tierConfig.price);

  // Auto-populate wallet address when user connects wallet
  useEffect(() => {
    if (account?.address) {
      setCardFormData(prev => ({ ...prev, wallet: account.address }));
      setWireFormData(prev => ({ ...prev, wallet: account.address }));
      setSquareFormData(prev => ({ ...prev, wallet: account.address }));
    }
  }, [account?.address]);

  const tierFeatures = {
    Verifier: [
      "Verify trade union compliance data",
      "Earn verification rewards",
      "Access to node dashboard",
      "Community voting rights"
    ],
    Professional: [
      "All Verifier benefits",
      "Enhanced verification capacity",
      "Priority support",
      "Advanced analytics dashboard",
      "Professional-tier rewards"
    ],
    Founder: [
      "All Professional benefits",
      "Founding member status",
      "Maximum reward potential",
      "Exclusive governance rights",
      "Direct advisory channel",
      "Limited to 300 nodes"
    ]
  };

  const tierIcons = {
    Verifier: Shield,
    Professional: Star,
    Founder: Crown,
  };

  const TierIcon = tierIcons[tier];

  // Wire transfer mutation
  const wireTransferMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; wallet: string }) => {
      const response = await apiRequest("POST", "/api/wire-transfer", {
        ...data,
        tier,
        priceUsd: tierConfig.price,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Store wire instructions and show them
      setWireInstructions(data.wireInstructions);
      setShowWireForm(false);
      setShowWireInstructions(true);
      toast({
        title: "Wire transfer request submitted",
        description: `License ID: ${data.licenseId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Crypto payment states
  const [cryptoPaymentLoading, setCryptoPaymentLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Crypto payment mutation
  const cryptoPaymentMutation = useMutation({
    mutationFn: async (data: { wallet: string; tier: TierName; priceUsd: number; txHash: string }) => {
      const response = await apiRequest("POST", "/api/buyers", {
        ...data,
        paymentMethod: "crypto",
        status: "active",
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Payment successful!",
        description: "Your Node Pass license has been created",
      });
      setShowPaymentModal(false);
      navigate(`/success?licenseId=${data.licenseId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create license",
        description: error.message || "Please contact support with your transaction hash",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setCryptoPaymentLoading(false);
    },
  });

  const handleCryptoPayment = () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }
    
    setShowPaymentModal(true);
  };

  const executeCryptoPayment = async () => {
    if (!account) {
      toast({
        title: "No wallet connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setCryptoPaymentLoading(true);
    
    try {
      // Get the correct chain based on config
      const targetChain = config.chainId === 8453 ? base : baseSepolia;
      
      // Validate network
      if (!activeChain || activeChain.id !== targetChain.id) {
        toast({
          title: "Wrong network",
          description: `Please switch to ${targetChain.name}`,
        });
        
        try {
          // Switch to the target chain
          await switchChain(targetChain);
          
          // Wait a moment for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          console.error("Network switch error:", switchError);
          toast({
            title: "Network switch failed",
            description: "Please manually switch your wallet to the correct network",
            variant: "destructive",
          });
          setCryptoPaymentLoading(false);
          return;
        }
      }

      // Validate USDC contract address
      if (!config.usdc.address) {
        toast({
          title: "USDC contract not configured",
          description: isTestMode 
            ? "Set VITE_USDC_CONTRACT environment variable to a test ERC20 token address on Base Sepolia"
            : "USDC contract address is missing. Please contact support.",
          variant: "destructive",
        });
        setCryptoPaymentLoading(false);
        return;
      }

      // Get USDC contract
      const usdcContract = getContract({
        client: thirdwebClient,
        chain: targetChain,
        address: config.usdc.address,
      });

      // Read decimals from contract (most USDC uses 6 decimals, but verify)
      let decimals = 6;
      try {
        const decimalsResult = await readContract({
          contract: usdcContract,
          method: "function decimals() view returns (uint8)",
          params: [],
        });
        decimals = Number(decimalsResult);
      } catch (error) {
        console.error("Could not read decimals from contract:", error);
        toast({
          title: "Invalid USDC contract",
          description: isTestMode
            ? "The configured VITE_USDC_CONTRACT address doesn't appear to be a valid ERC20 token"
            : "Unable to read USDC contract. Please try again or contact support.",
          variant: "destructive",
        });
        setCryptoPaymentLoading(false);
        return;
      }

      // Check USDC balance
      let balanceResult;
      try {
        balanceResult = await readContract({
          contract: usdcContract,
          method: "function balanceOf(address) view returns (uint256)",
          params: [account.address],
        });
      } catch (error) {
        console.error("Could not read balance from contract:", error);
        toast({
          title: "Unable to check USDC balance",
          description: isTestMode
            ? "Make sure VITE_USDC_CONTRACT points to a valid ERC20 token on Base Sepolia"
            : "Unable to read your USDC balance. Please try again.",
          variant: "destructive",
        });
        setCryptoPaymentLoading(false);
        return;
      }
      
      const divisor = Math.pow(10, decimals);
      const balance = Number(balanceResult) / divisor;
      const requiredAmount = tierConfig.price;
      
      if (balance < requiredAmount) {
        toast({
          title: "Insufficient USDC balance",
          description: `You need ${requiredAmount} USDC but only have ${balance.toFixed(2)} USDC`,
          variant: "destructive",
        });
        setCryptoPaymentLoading(false);
        return;
      }

      toast({
        title: "Transaction initiated",
        description: "Please confirm in your wallet...",
      });

      // Prepare transfer transaction (amount in smallest unit based on decimals)
      const amountInSmallestUnit = BigInt(Math.round(requiredAmount * Math.pow(10, decimals)));
      
      const transaction = prepareContractCall({
        contract: usdcContract,
        method: "function transfer(address to, uint256 amount) returns (bool)",
        params: [config.treasuryWallet, amountInSmallestUnit],
      });

      // Send transaction
      const { transactionHash } = await sendTransaction({
        account,
        transaction,
      });
      
      setTxHash(transactionHash);

      toast({
        title: "Transaction submitted",
        description: "Waiting for blockchain confirmation...",
      });

      // Wait for confirmation
      await waitForReceipt({
        client: thirdwebClient,
        chain: targetChain,
        transactionHash,
      });

      toast({
        title: "Transaction confirmed",
        description: "Creating your license...",
      });
      
      // Create buyer record
      cryptoPaymentMutation.mutate({
        wallet: account.address,
        tier,
        priceUsd: tierConfig.price,
        txHash: transactionHash,
      });
    } catch (error: any) {
      console.error("Crypto payment error:", error);
      toast({
        title: "Transaction failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setCryptoPaymentLoading(false);
    }
  };

  // Start card payment flow - create payment intent
  const handleCardPayment = async () => {
    if (!cardFormData.name || !cardFormData.email) {
      toast({
        title: "Missing information",
        description: "Please enter your name and email",
        variant: "destructive",
      });
      return;
    }

    // Validate wallet address format and reject known-bad addresses
    const walletLower = cardFormData.wallet?.toLowerCase();
    if (!cardFormData.wallet || !cardFormData.wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Wallet address required",
        description: "Please enter a valid Ethereum wallet address to receive your NFT",
        variant: "destructive",
      });
      return;
    }
    
    // Block zero address (0x0000...0000) - NFTs sent here are permanently lost
    if (walletLower === "0x0000000000000000000000000000000000000000") {
      toast({
        title: "Invalid wallet address",
        description: "The zero address (0x000...000) cannot receive NFTs. Please use a real wallet address.",
        variant: "destructive",
      });
      return;
    }
    
    // Block burn address
    if (walletLower === "0x000000000000000000000000000000000000dead") {
      toast({
        title: "Invalid wallet address",
        description: "This is a burn address. Please use a wallet you control.",
        variant: "destructive",
      });
      return;
    }

    setStripeLoadingState(true);

    try {
      // Create Stripe payment intent with wallet address in metadata
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        tier,
        email: cardFormData.email,
        name: cardFormData.name,
        wallet: cardFormData.wallet,  // CRITICAL: Include wallet address
        paymentMethod: cardFormData.paymentMethod,
      });
      const data = await response.json();

      setStripeClientSecret(data.clientSecret);
      setStripeLoadingState(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
      setStripeLoadingState(false);
      setShowCardPayment(false);
    }
  };

  // Handle successful Stripe payment
  const handleStripeSuccess = async (paymentIntentId: string) => {
    try {
      // CRITICAL: Call confirm-card-payment to ensure buyer record exists
      // This handles the case where webhook hasn't fired yet (common in test mode)
      const response = await apiRequest("POST", "/api/confirm-card-payment", {
        paymentIntentId,
        wallet: cardFormData.wallet, // Pass wallet in case webhook needs it
      });
      const data = await response.json();

      toast({
        title: "Payment successful!",
        description: "Your Node Pass license has been activated",
      });

      // Navigate to success page - licenseId is in data.buyer.licenseId
      navigate(`/success?licenseId=${data.buyer.licenseId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    }
  };

  const handleWireSubmit = async () => {
    if (!wireFormData.name || !wireFormData.email) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and email",
        variant: "destructive",
      });
      return;
    }

    // Validate wallet address if provided
    if (wireFormData.wallet && !wireFormData.wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid Ethereum address or leave it blank",
        variant: "destructive",
      });
      return;
    }

    wireTransferMutation.mutate(wireFormData);
  };

  const paymentHints = {
    Verifier: "Instant activation with USDC payment",
    Professional: "Pay with USDC or wire transfer",
    Founder: "Wire transfer recommended for large amounts",
  };

  return (
    <div className="min-h-screen bg-background">
      <TestModeBanner />
      
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <a href="https://tradeuniondao.com" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              TUDAO
            </div>
          </a>
          <WalletButton />
        </div>
      </header>

      {/* Hero Section with Slogan */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            For Those Who<br />Do the Work
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Own a TUDAO node to validate service transactions, participate in governance, and earn rewards from real-world labor platform activity.
          </p>
        </div>
      </section>

      <main className="container max-w-2xl mx-auto px-4 py-12 md:py-16">
        <Card className="border-2">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <TierIcon className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <TierBadge tier={tier} size="lg" />
              </div>
              <CardTitle className="text-4xl md:text-5xl font-display font-bold tracking-tight">
                {price}
              </CardTitle>
              <CardDescription className="text-base">
                One-time payment for lifetime node license
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {tier === "Founder" && (
              <div className="flex gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Non-transferable until MVP unlock vote
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    {config.founderNote}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What's Included</h3>
              <ul className="space-y-2">
                {tierFeatures[tier].map((feature, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Complete Purchase</h3>
              
              <div className="grid gap-3">
                <Button
                  size="lg"
                  className="h-14 text-base font-semibold"
                  onClick={handleCryptoPayment}
                  data-testid="button-pay-crypto"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Pay with Crypto (USDC • Base)
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 text-base font-semibold"
                  onClick={() => setShowSquarePayment(true)}
                  data-testid="button-pay-card"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay with Card
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 text-base font-semibold"
                  onClick={() => setShowWireForm(true)}
                  data-testid="button-pay-wire"
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Bank / Wire Transfer
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {paymentHints[tier]}
              </p>
            </div>

            <ComplianceFooter />
          </CardContent>
        </Card>
      </main>

      {/* FAQ Section */}
      <section className="border-t bg-muted/30">
        <div className="container max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="faq-1" className="border rounded-lg px-6 bg-background" data-testid="faq-item-dao">
              <AccordionTrigger className="text-left font-semibold hover:no-underline" data-testid="faq-trigger-dao">
                What is a DAO?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-dao">
                A DAO (Decentralized Autonomous Organization) is a community-governed entity operating on blockchain technology. TUDAO uses smart contracts and node validation to ensure transparency, fairness, and democratic decision-making for the labor platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border rounded-lg px-6 bg-background" data-testid="faq-item-node">
              <AccordionTrigger className="text-left font-semibold hover:no-underline" data-testid="faq-trigger-node">
                What does owning a node mean?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-node">
                Node owners help validate transactions and maintain the integrity of the TUDAO network. Depending on your tier, you gain access to governance rights, verification rewards, and priority participation in platform features and expansion opportunities.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border rounded-lg px-6 bg-background" data-testid="faq-item-crypto">
              <AccordionTrigger className="text-left font-semibold hover:no-underline" data-testid="faq-trigger-crypto">
                Do I need to know crypto to participate?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-crypto">
                No! While you can pay with cryptocurrency (USDC on Base), we also accept wire transfers. If you don't have a crypto wallet, we'll create one for you automatically when you purchase your node.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border rounded-lg px-6 bg-background" data-testid="faq-item-transfer">
              <AccordionTrigger className="text-left font-semibold hover:no-underline" data-testid="faq-trigger-transfer">
                Can I sell or transfer my node later?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-transfer">
                Verifier and Professional nodes are transferable at any time. Founder nodes are non-transferable until an MVP unlock vote is passed by the DAO. This ensures founding members maintain their commitment during the critical early development phase.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5" className="border rounded-lg px-6 bg-background" data-testid="faq-item-rewards">
              <AccordionTrigger className="text-left font-semibold hover:no-underline" data-testid="faq-trigger-rewards">
                What do I earn from my node?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-rewards">
                Node rewards are policy-based and variable, determined by DAO governance and platform activity. Rewards may include validation fees from service transactions, governance participation incentives, and priority access to new features. Important: Nodes do not guarantee any income or financial returns.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
            *Nodes do not guarantee any income, financial returns, or rewards. Participation rights and access are subject to DAO governance and future protocol terms.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-display text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              TUDAO
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="https://tradeuniondao.com" className="hover:text-foreground transition-colors">
                Main Site
              </a>
              <a href="https://tradeuniondao.com/#faq" className="hover:text-foreground transition-colors">
                FAQ
              </a>
              <a href="mailto:support@tradeuniondao.com" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-6">
            © 2024 TUDAO. For Those Who Do the Work.
          </div>
        </div>
      </footer>

      {/* Crypto Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md" data-testid="dialog-crypto-payment">
          <DialogHeader>
            <DialogTitle>Pay with USDC</DialogTitle>
            <DialogDescription>
              Complete your purchase using USDC on {isTestMode ? "Base Sepolia testnet" : "Base mainnet"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{price} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="font-semibold">Base {isTestMode ? "Sepolia" : ""}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tier</span>
                <span className="font-semibold">{tier}</span>
              </div>
              {account && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Wallet</span>
                  <span className="font-mono text-xs">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
                </div>
              )}
            </div>

            {txHash && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-green-900 dark:text-green-100">Transaction confirmed</p>
                    <p className="text-xs font-mono text-green-800 dark:text-green-200 break-all">{txHash}</p>
                  </div>
                </div>
              </div>
            )}

            {isTestMode && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm space-y-2">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Test Mode Limitation</p>
                <p className="text-amber-800 dark:text-amber-200">
                  Base Sepolia does not have official USDC. To test crypto payments:
                </p>
                <ul className="text-amber-800 dark:text-amber-200 list-disc list-inside space-y-1 text-xs">
                  <li>Deploy your own test ERC20 token on Base Sepolia</li>
                  <li>Set VITE_USDC_CONTRACT environment variable to your token address</li>
                  <li>Or switch to Base mainnet (chainId 8453) for real USDC</li>
                </ul>
                <p className="text-amber-800 dark:text-amber-200 text-xs font-semibold mt-2">
                  Recommended: Use Card, ACH, or Wire payment methods to test checkout flows in test mode.
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              size="lg"
              onClick={executeCryptoPayment}
              disabled={cryptoPaymentLoading || cryptoPaymentMutation.isPending}
              data-testid="button-execute-crypto-payment"
            >
              {cryptoPaymentLoading || cryptoPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {txHash ? "Creating license..." : "Processing transaction..."}
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Pay {price} USDC
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your wallet will prompt you to sign the transaction
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Payment Modal */}
      <Dialog open={showCardPayment} onOpenChange={setShowCardPayment}>
        <DialogContent className="max-w-md" data-testid="dialog-card-payment">
          <DialogHeader>
            <DialogTitle>Pay with Card</DialogTitle>
            <DialogDescription>
              Complete your purchase with credit or debit card
            </DialogDescription>
          </DialogHeader>
          
          {!stripeClientSecret ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      cardFormData.paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
                    }`}
                    onClick={() => setCardFormData({ ...cardFormData, paymentMethod: "card" })}
                    data-testid="button-select-card"
                  >
                    <CreditCard className="h-5 w-5 mb-2" />
                    <div className="font-semibold">Card</div>
                    <div className="text-xs text-muted-foreground">Instant</div>
                  </button>
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      cardFormData.paymentMethod === "ach"
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
                    }`}
                    onClick={() => setCardFormData({ ...cardFormData, paymentMethod: "ach" })}
                    data-testid="button-select-ach"
                  >
                    <Building2 className="h-5 w-5 mb-2" />
                    <div className="font-semibold">ACH</div>
                    <div className="text-xs text-muted-foreground">4-5 days</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-name">Full Name</Label>
                <Input
                  id="card-name"
                  placeholder="John Doe"
                  value={cardFormData.name}
                  onChange={(e) => setCardFormData({ ...cardFormData, name: e.target.value })}
                  data-testid="input-card-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-email">Email Address</Label>
                <Input
                  id="card-email"
                  type="email"
                  placeholder="john@example.com"
                  value={cardFormData.email}
                  onChange={(e) => setCardFormData({ ...cardFormData, email: e.target.value })}
                  data-testid="input-card-email"
                />
              </div>

              <WalletOptions
                value={cardFormData.wallet}
                onChange={(address) => setCardFormData({ ...cardFormData, wallet: address })}
              />

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCardPayment}
                disabled={stripeLoadingState}
                data-testid="button-proceed-payment"
              >
                {stripeLoadingState ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up payment...
                  </>
                ) : (
                  `Continue with ${cardFormData.paymentMethod === "ach" ? "Bank Account" : "Card"}`
                )}
              </Button>
            </div>
          ) : (
            <div className="pt-4">
              <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                <StripeCheckoutForm
                  onSuccess={handleStripeSuccess}
                  amount={tierConfig.price}
                  tier={tier}
                />
              </Elements>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Square Card Payment Modal */}
      <Dialog open={showSquarePayment} onOpenChange={setShowSquarePayment}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="dialog-square-payment">
          <DialogHeader>
            <DialogTitle>Pay with Card</DialogTitle>
            <DialogDescription>
              Complete your purchase with credit or debit card
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 pb-2">
            <div className="space-y-2">
              <Label htmlFor="square-name">Full Name</Label>
              <Input
                id="square-name"
                placeholder="John Doe"
                value={squareFormData.name}
                onChange={(e) => setSquareFormData({ ...squareFormData, name: e.target.value })}
                data-testid="input-square-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="square-email">Email Address</Label>
              <Input
                id="square-email"
                type="email"
                placeholder="john@example.com"
                value={squareFormData.email}
                onChange={(e) => setSquareFormData({ ...squareFormData, email: e.target.value })}
                data-testid="input-square-email"
              />
            </div>
            <WalletOptions
              value={squareFormData.wallet}
              onChange={(address) => setSquareFormData({ ...squareFormData, wallet: address })}
            />

            <SquareCheckoutForm
              onSuccess={(licenseId) => {
                setShowSquarePayment(false);
                navigate("/success?licenseId=" + licenseId);
              }}
              amount={tierConfig.price}
              tier={tier}
              wallet={squareFormData.wallet}
              email={squareFormData.email}
              name={squareFormData.name}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Wire Form Modal */}
      <Dialog open={showWireForm} onOpenChange={setShowWireForm}>
        <DialogContent className="max-w-md" data-testid="dialog-wire-form">
          <DialogHeader>
            <DialogTitle>Bank / Wire Transfer</DialogTitle>
            <DialogDescription>
              Submit your details to receive wire transfer instructions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={wireFormData.name}
                onChange={(e) => setWireFormData({ ...wireFormData, name: e.target.value })}
                data-testid="input-wire-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={wireFormData.email}
                onChange={(e) => setWireFormData({ ...wireFormData, email: e.target.value })}
                data-testid="input-wire-email"
              />
            </div>
            <WalletOptions
              value={wireFormData.wallet}
              onChange={(address) => setWireFormData({ ...wireFormData, wallet: address })}
            />

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleWireSubmit}
              disabled={wireTransferMutation.isPending}
              data-testid="button-submit-wire"
            >
              {wireTransferMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wire Instructions Modal */}
      <Dialog open={showWireInstructions} onOpenChange={setShowWireInstructions}>
        <DialogContent className="max-w-2xl" data-testid="dialog-wire-instructions">
          <DialogHeader>
            <DialogTitle>Complete Your Wire Transfer</DialogTitle>
            <DialogDescription>
              Send the wire transfer using these details. Your NFT will be minted once payment is received.
            </DialogDescription>
          </DialogHeader>
          {wireInstructions && (
            <WireInstructions
              bankName={wireInstructions.bankName}
              routingNumber={wireInstructions.routingNumber}
              accountNumber={wireInstructions.accountNumber}
              accountName={wireInstructions.accountName}
              bankAddress={wireInstructions.bankAddress}
              amount={wireInstructions.amount}
              referenceNumber={wireInstructions.referenceNumber}
              onClose={() => {
                setShowWireInstructions(false);
                navigate(`/success?licenseId=${wireInstructions.referenceNumber}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

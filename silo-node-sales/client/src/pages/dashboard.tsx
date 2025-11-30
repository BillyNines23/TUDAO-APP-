import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useActiveAccount } from "thirdweb/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WalletButton } from "@/components/WalletButton";
import { StatusPill } from "@/components/StatusPill";
import { TierBadge } from "@/components/TierBadge";
import { useToast } from "@/hooks/use-toast";
import { config, truncateAddress } from "@/lib/config";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Download, FileText, Mail, Server, Cloud, User, AlertCircle, Crown, Shield, Star } from "lucide-react";
import type { Buyer } from "@shared/schema";

export default function DashboardPage() {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [selectedNextStep, setSelectedNextStep] = useState<string>("");

  const { data: buyer, isLoading, error } = useQuery<Buyer>({
    queryKey: ["/api/buyers/wallet", account?.address],
    enabled: !!account?.address,
  });

  useEffect(() => {
    if (buyer?.nextStep) {
      setSelectedNextStep(buyer.nextStep);
    }
  }, [buyer]);

  const saveNextStepMutation = useMutation({
    mutationFn: async (nextStep: string) => {
      if (!buyer) throw new Error("No buyer data");
      return await apiRequest("PATCH", `/api/buyers/${buyer.id}`, { nextStep });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buyers/wallet", account?.address] });
      toast({
        title: "Preference saved",
        description: "Your operator setup preference has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSaveNextStep = () => {
    if (selectedNextStep) {
      saveNextStepMutation.mutate(selectedNextStep);
    }
  };

  const downloadBadge = () => {
    if (!buyer) return;
    const badgeUrl = config.assets.badges[buyer.tier];
    if (badgeUrl) {
      window.open(badgeUrl, "_blank");
    } else {
      toast({
        title: "Badge not available",
        description: "Badge URL not configured. Set VITE_ASSETS_BADGE_" + buyer.tier.toUpperCase() + "_URL",
        variant: "destructive",
      });
    }
  };

  const openSetupPdf = () => {
    if (config.assets.setupPdf) {
      window.open(config.assets.setupPdf, "_blank");
    } else {
      toast({
        title: "Setup PDF not available",
        description: "Setup PDF URL not configured. Set VITE_ASSETS_SETUP_PDF_URL",
        variant: "destructive",
      });
    }
  };

  const contactSupport = () => {
    if (buyer) {
      window.location.href = `mailto:${config.email.supportEmail}?subject=Node License ${buyer.licenseId} Support`;
    }
  };

  const tierIcons = {
    Verifier: Shield,
    Professional: Star,
    Founder: Crown,
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between px-4">
            <a href="https://tradeuniondao.com" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                TUDAO
              </div>
            </a>
            <WalletButton />
          </div>
        </header>
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8">
            Please connect your wallet to view your node license dashboard
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !buyer) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between px-4">
            <a href="https://tradeuniondao.com" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                TUDAO
              </div>
            </a>
            <WalletButton />
          </div>
        </header>
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">No License Found</h2>
          <p className="text-muted-foreground mb-8">
            No node license was found for wallet {truncateAddress(account.address)}
          </p>
          <Button asChild>
            <a href="/checkout">Purchase a Node License</a>
          </Button>
        </div>
      </div>
    );
  }

  const TierIcon = tierIcons[buyer.tier];

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
              My Node License
            </h1>
            <p className="text-muted-foreground">
              Manage your TUDAO node and setup preferences
            </p>
          </div>

          {/* License Status Card */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <TierIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TierBadge tier={buyer.tier} size="md" foundingTeamRole={buyer.foundingTeamRole} />
                      <StatusPill status={buyer.status} />
                    </div>
                    <p className="font-mono text-sm text-muted-foreground" data-testid="text-license-id-dashboard">
                      {buyer.licenseId}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Wallet</p>
                  <p className="font-mono text-sm font-medium" data-testid="text-wallet-dashboard">
                    {truncateAddress(buyer.wallet)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Purchase Date</p>
                  <p className="text-sm font-medium" data-testid="text-purchase-date">
                    {format(buyer.createdAt, "MMM d, yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Method</p>
                  <p className="text-sm font-medium capitalize">{buyer.paymentMethod}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
                  <p className="text-sm font-medium">${buyer.priceUsd.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Wire Alert */}
          {buyer.status === "pending_wire" && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertDescription className="text-sm">
                <p className="font-semibold mb-2">Pending Wire Transfer</p>
                <p className="text-muted-foreground">
                  Your license will activate after we confirm receipt of your wire transfer. 
                  You'll receive an email confirmation once the payment is processed.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover-elevate cursor-pointer" onClick={downloadBadge}>
                <CardHeader className="space-y-2">
                  <Download className="h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">Download Badge</CardTitle>
                  <CardDescription className="text-sm">
                    Get your tier badge image
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-testid="button-download-badge-dashboard">
                    Download
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer" onClick={openSetupPdf}>
                <CardHeader className="space-y-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">Setup Guide</CardTitle>
                  <CardDescription className="text-sm">
                    Node setup instructions PDF
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-testid="button-setup-pdf-dashboard">
                    Open PDF
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer" onClick={contactSupport}>
                <CardHeader className="space-y-2">
                  <Mail className="h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">Contact Support</CardTitle>
                  <CardDescription className="text-sm">
                    Get help with your node
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-testid="button-contact-support">
                    Email Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Operator Setup */}
          {buyer.status === "active" && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Select Your Setup Path</CardTitle>
                <CardDescription>
                  Choose how you'd like to operate your TUDAO node
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup 
                  value={selectedNextStep || buyer.nextStep || ""} 
                  onValueChange={setSelectedNextStep}
                >
                  <div className="grid lg:grid-cols-3 gap-4">
                    <label
                      htmlFor="self"
                      className={`flex cursor-pointer rounded-lg border-2 p-4 hover-elevate ${
                        (selectedNextStep || buyer.nextStep) === "self" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <User className="h-8 w-8 text-primary" />
                          <RadioGroupItem value="self" id="self" data-testid="radio-setup-self" />
                        </div>
                        <h3 className="font-semibold mb-1">Self-Operated</h3>
                        <p className="text-sm text-muted-foreground">
                          Run and maintain your own node infrastructure
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="managed"
                      className={`flex cursor-pointer rounded-lg border-2 p-4 hover-elevate ${
                        (selectedNextStep || buyer.nextStep) === "managed" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <Server className="h-8 w-8 text-primary" />
                          <RadioGroupItem value="managed" id="managed" data-testid="radio-setup-managed" />
                        </div>
                        <h3 className="font-semibold mb-1">Managed Operator</h3>
                        <p className="text-sm text-muted-foreground">
                          Have a trusted operator manage your node
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="cloud"
                      className={`flex cursor-pointer rounded-lg border-2 p-4 hover-elevate ${
                        (selectedNextStep || buyer.nextStep) === "cloud" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <Cloud className="h-8 w-8 text-primary" />
                          <RadioGroupItem value="cloud" id="cloud" data-testid="radio-setup-cloud" />
                        </div>
                        <h3 className="font-semibold mb-1">Cloud Waitlist</h3>
                        <p className="text-sm text-muted-foreground">
                          Join waitlist for hosted cloud solution
                        </p>
                      </div>
                    </label>
                  </div>
                </RadioGroup>

                {selectedNextStep && selectedNextStep !== buyer.nextStep && (
                  <Button
                    onClick={handleSaveNextStep}
                    disabled={saveNextStepMutation.isPending}
                    data-testid="button-save-setup"
                  >
                    {saveNextStepMutation.isPending ? "Saving..." : "Save Selection"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

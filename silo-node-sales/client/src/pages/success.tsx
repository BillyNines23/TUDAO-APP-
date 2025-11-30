import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, FileText, LayoutDashboard, Copy, Check } from "lucide-react";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { TierBadge } from "@/components/TierBadge";
import { config, truncateAddress } from "@/lib/config";
import { format } from "date-fns";
import type { Buyer } from "@shared/schema";

export default function SuccessPage() {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  
  // Get license ID from URL params
  const params = new URLSearchParams(window.location.search);
  const licenseId = params.get("licenseId");

  // Fetch buyer data if we have a license ID
  const { data: buyer, isLoading, isError } = useQuery<Buyer>({
    queryKey: ["/api/buyers/license", licenseId],
    queryFn: async () => {
      const response = await fetch(`/api/buyers/license/${licenseId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch license: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!licenseId,
    retry: false,
  });

  // Scroll to top on mount - MUST be before any conditional returns
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your license details...</p>
        </div>
      </div>
    );
  }

  // Show error state if license not found or query failed
  if (isError || (!isLoading && !buyer)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="rounded-full bg-red-500/10 p-6 inline-flex">
            <CheckCircle2 className="h-20 w-20 text-red-600 dark:text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold tracking-tight">
              License Not Found
            </h1>
            <p className="text-lg text-muted-foreground">
              We couldn't find a license with ID: {licenseId || "(missing)"}
            </p>
          </div>
          <Button onClick={() => navigate("/checkout")} data-testid="button-back-checkout">
            Return to Checkout
          </Button>
        </div>
      </div>
    );
  }

  // Use real data from API (buyer is guaranteed to exist here)
  const purchaseData = {
    licenseId: buyer!.licenseId,
    tier: buyer!.tier,
    wallet: buyer!.wallet,
    date: new Date(buyer!.createdAt),
    status: buyer!.status,
    paymentMethod: buyer!.paymentMethod,
    foundingTeamRole: buyer!.foundingTeamRole,
  };

  const isPending = buyer!.status === "pending_wire";
  const statusConfig = isPending
    ? {
        icon: { bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-500" },
        title: "Wire Transfer Pending",
        subtitle: "Waiting for payment confirmation",
      }
    : {
        icon: { bg: "bg-green-500/10", color: "text-green-600 dark:text-green-500" },
        title: "License Activated!",
        subtitle: "Your Node Pass is ready",
      };

  const copyLicenseId = () => {
    navigator.clipboard.writeText(purchaseData.licenseId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBadge = () => {
    const badgeUrl = config.assets.badges[purchaseData.tier];
    if (badgeUrl) {
      window.open(badgeUrl, "_blank");
    }
  };

  const openSetupPdf = () => {
    if (config.assets.setupPdf) {
      window.open(config.assets.setupPdf, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/checkout" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              TUDAO
            </div>
          </Link>
          <a href="https://tradeuniondao.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Main Site
          </a>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-6 mb-12">
          <div className="flex justify-center">
            <div className={`rounded-full ${statusConfig.icon.bg} p-6`}>
              <CheckCircle2 className={`h-20 w-20 ${statusConfig.icon.color}`} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              {statusConfig.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {statusConfig.subtitle}
            </p>
          </div>
        </div>
        
        {isPending && (
          <Card className="border-amber-500/20 bg-amber-500/5 mb-8">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Next Steps for Wire Transfer:
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                  <li>• Complete the wire transfer using the bank details provided</li>
                  <li>• Include reference number <strong>{purchaseData.licenseId}</strong> with your transfer</li>
                  <li>• Processing typically takes 1-3 business days</li>
                  <li>• Your NFT will be minted automatically once payment is confirmed</li>
                  <li>• You'll receive email confirmation when your license is activated</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle className="text-xl">License Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">License ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold" data-testid="text-license-id">
                    {purchaseData.licenseId}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={copyLicenseId}
                    data-testid="button-copy-license"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tier</p>
                <div>
                  <TierBadge tier={purchaseData.tier} foundingTeamRole={purchaseData.foundingTeamRole} />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm" data-testid="text-wallet">
                  {truncateAddress(purchaseData.wallet)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="text-sm" data-testid="text-date">
                  {format(purchaseData.date, "MMMM d, yyyy")}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div>
                  {isPending ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      Pending Payment
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {config.assets.badges[purchaseData.tier] && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={downloadBadge}
                  className="w-full sm:w-auto"
                  data-testid="button-download-badge-success"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Badge
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          
          <div className="grid gap-4">
            <Button size="lg" asChild className="h-14 text-base font-semibold" data-testid="button-open-dashboard">
              <Link href="/dashboard">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Open Dashboard
              </Link>
            </Button>

            {config.assets.setupPdf && (
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base font-semibold"
                onClick={openSetupPdf}
                data-testid="button-setup-pdf-success"
              >
                <FileText className="h-5 w-5 mr-2" />
                Download Setup PDF
              </Button>
            )}
          </div>

          {config.emailDisabled && (
            <div className="text-sm text-muted-foreground text-center pt-4">
              Receipt saved to dashboard. Email receipts will be enabled at launch.
            </div>
          )}
        </div>

        <div className="mt-12">
          <ComplianceFooter />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
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
    </div>
  );
}

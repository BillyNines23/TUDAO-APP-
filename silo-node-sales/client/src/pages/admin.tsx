import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  AlertCircle, 
  Check, 
  Clock, 
  CreditCard, 
  Wallet, 
  Landmark,
  ExternalLink,
  Copy
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { truncateAddress } from "@/lib/config";
import { TierBadge } from "@/components/TierBadge";
import { FoundingTeamMinting } from "@/components/founding-team-minting";
import type { Buyer } from "@shared/schema";

interface AdminStats {
  totalRevenue: number;
  activeLicenses: number;
  pendingWires: number;
  revenueByTier: {
    Verifier: number;
    Professional: number;
    Founder: number;
  };
  licensesByTier: {
    Verifier: number;
    Professional: number;
    Founder: number;
  };
  revenueByPaymentMethod: {
    card: number;
    crypto: number;
    wire: number;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [activatingLicense, setActivatingLicense] = useState<string | null>(null);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch buyers with filters
  const queryParams = new URLSearchParams();
  if (filterStatus !== "all") queryParams.append("status", filterStatus);
  if (filterTier !== "all") queryParams.append("tier", filterTier);
  const queryString = queryParams.toString();

  const { data: buyers, isLoading: buyersLoading } = useQuery<Buyer[]>({
    queryKey: ["/api/admin/buyers", queryString],
    queryFn: async () => {
      const url = queryString ? `/api/admin/buyers?${queryString}` : "/api/admin/buyers";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch buyers");
      return response.json();
    },
  });

  // Mutation for activating wire transfers
  const activateWireMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      const response = await fetch(`/api/admin/activate-wire/${licenseId}`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to activate wire transfer");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Wire Transfer Activated!",
        description: `NFT minted successfully. Transaction: ${data.transactionHash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/buyers"] });
      setActivatingLicense(null);
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate wire transfer",
        variant: "destructive",
      });
      setActivatingLicense(null);
    },
  });

  const handleActivateWire = async (licenseId: string) => {
    setActivatingLicense(licenseId);
    activateWireMutation.mutate(licenseId);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "crypto":
        return <Wallet className="h-4 w-4" />;
      case "wire":
        return <Landmark className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (statsLoading || buyersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingWires = buyers?.filter(b => b.status === "pending_wire") || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                TUDAO Node Pass Management & Reporting
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Live Data
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {stats?.activeLicenses || 0} active licenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeLicenses || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                NFTs minted and delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Wire Transfers</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats?.pendingWires || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting manual activation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TierBadge tier="Verifier" />
                  <span className="text-sm text-muted-foreground">
                    {stats?.licensesByTier.Verifier || 0} licenses
                  </span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueByTier.Verifier || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TierBadge tier="Professional" />
                  <span className="text-sm text-muted-foreground">
                    {stats?.licensesByTier.Professional || 0} licenses
                  </span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueByTier.Professional || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TierBadge tier="Founder" />
                  <span className="text-sm text-muted-foreground">
                    {stats?.licensesByTier.Founder || 0} licenses
                  </span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueByTier.Founder || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Square Card</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueByPaymentMethod.card || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">USDC Crypto</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueByPaymentMethod.crypto || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Wire Transfer</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueByPaymentMethod.wire || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Founding Team Minting */}
        <FoundingTeamMinting />

        {/* Pending Wire Transfers */}
        {pendingWires.length > 0 && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Wire Transfers ({pendingWires.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingWires.map((buyer) => (
                  <div
                    key={buyer.id}
                    className="flex flex-col gap-3 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold">{buyer.licenseId}</span>
                          <TierBadge tier={buyer.tier} foundingTeamRole={buyer.foundingTeamRole} />
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(buyer.priceUsd)}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Customer:</span>
                            <span>{buyer.name || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{buyer.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Wallet:</span>
                            <span className="font-mono text-xs">{truncateAddress(buyer.wallet)}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => copyToClipboard(buyer.wallet, "Wallet address")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Submitted:</span>
                            <span>{format(new Date(buyer.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleActivateWire(buyer.licenseId)}
                        disabled={activatingLicense === buyer.licenseId}
                        className="shrink-0"
                        data-testid={`button-activate-${buyer.licenseId}`}
                      >
                        {activatingLicense === buyer.licenseId ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Minting...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Activate & Mint NFT
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Licenses Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Licenses</CardTitle>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-md border bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending_wire">Pending Wire</option>
                </select>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-md border bg-background"
                >
                  <option value="all">All Tiers</option>
                  <option value="Verifier">Verifier</option>
                  <option value="Professional">Professional</option>
                  <option value="Founder">Founder</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {buyers && buyers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No licenses found matching filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {buyers?.map((buyer) => (
                  <div
                    key={buyer.id}
                    className="flex flex-col gap-3 p-4 rounded-lg border bg-card/50 hover-elevate"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-sm">{buyer.licenseId}</span>
                          <TierBadge tier={buyer.tier} foundingTeamRole={buyer.foundingTeamRole} />
                          {buyer.status === "active" ? (
                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/20">
                              Pending
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getPaymentMethodIcon(buyer.paymentMethod)}
                            <span className="capitalize">{buyer.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name: </span>
                            <span>{buyer.name || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email: </span>
                            <span className="text-xs">{buyer.email || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price: </span>
                            <span>{formatCurrency(buyer.priceUsd)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date: </span>
                            <span>{format(new Date(buyer.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        {(buyer as any).transactionHash && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">TX:</span>
                            <a
                              href={`https://basescan.org/tx/${(buyer as any).transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-primary hover:underline flex items-center gap-1"
                            >
                              {(buyer as any).transactionHash.slice(0, 10)}...{(buyer as any).transactionHash.slice(-8)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

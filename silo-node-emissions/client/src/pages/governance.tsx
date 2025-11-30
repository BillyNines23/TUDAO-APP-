import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Lock, Clock, AlertCircle } from "lucide-react";
import type { GovernanceParams } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/alert-banner";

export default function Governance() {
  const { data: params, isLoading } = useQuery<GovernanceParams>({
    queryKey: ["/api/governance"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-card rounded-lg" />
          <div className="h-64 bg-card rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-foreground mb-2">Governance Parameters</h1>
        <p className="text-base text-muted-foreground">DAO-controlled system configuration and economic parameters</p>
      </div>

      <AlertBanner
        type="info"
        message="All parameter changes require DAO Safe approval and are subject to a 72-hour timelock for security."
        testId="alert-governance-info"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">System Status</h3>
              <p className="text-sm text-muted-foreground">Current operational state</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <Badge variant="outline" className="font-mono">
                {params?.updatedAt ? new Date(params.updatedAt).toLocaleDateString() : "N/A"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Epoch Length</span>
              <Badge variant="outline" className="font-mono">
                {params?.epochLength || 24}h
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                Active
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Pending Changes</h3>
              <p className="text-sm text-muted-foreground">Awaiting timelock execution</p>
            </div>
          </div>
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No pending parameter changes</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Security</h3>
              <p className="text-sm text-muted-foreground">Protection mechanisms</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Timelock</span>
              <Badge variant="outline" className="font-mono">72h</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">DAO Safe</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                Required
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Emission Parameters</h2>
            <p className="text-sm text-muted-foreground">FEU weights and daily reward pool configuration</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nrp" className="text-sm font-medium mb-2 block">
                Network Reward Pool (NRP)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="nrp"
                  type="text"
                  value={(params?.nrp || 1000000).toLocaleString()}
                  readOnly
                  className="font-mono"
                  data-testid="input-nrp"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">TUDAO/day</span>
              </div>
            </div>

            <div>
              <Label htmlFor="feu-f" className="text-sm font-medium mb-2 block">
                Founding FEU Weight
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="feu-f"
                  type="text"
                  value={params?.feuF || 15}
                  readOnly
                  className="font-mono"
                  data-testid="input-feu-f"
                />
                <span className="text-sm text-muted-foreground">(10 base + 5 passive)</span>
              </div>
            </div>

            <div>
              <Label htmlFor="feu-p" className="text-sm font-medium mb-2 block">
                Professional FEU Weight
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="feu-p"
                  type="text"
                  value={params?.feuP || 8}
                  readOnly
                  className="font-mono"
                  data-testid="input-feu-p"
                />
                <span className="text-sm text-muted-foreground">(6 core + 2 bonus)</span>
              </div>
            </div>

            <div>
              <Label htmlFor="feu-v" className="text-sm font-medium mb-2 block">
                Verifier FEU Weight
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="feu-v"
                  type="text"
                  value={params?.feuV || 1}
                  readOnly
                  className="font-mono"
                  data-testid="input-feu-v"
                />
                <span className="text-sm text-muted-foreground">(+ bounties)</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">SLA Thresholds</h2>
            <p className="text-sm text-muted-foreground">Minimum uptime requirements per tier</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sla-founder" className="text-sm font-medium mb-2 block">
                Founding Nodes
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sla-founder"
                  type="text"
                  value={`${params?.slaFounder || 99}%`}
                  readOnly
                  className="font-mono"
                  data-testid="input-sla-founder"
                />
                <span className="text-sm text-muted-foreground">24h rolling</span>
              </div>
            </div>

            <div>
              <Label htmlFor="sla-professional" className="text-sm font-medium mb-2 block">
                Professional Nodes
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sla-professional"
                  type="text"
                  value={`${params?.slaProfessional || 98}%`}
                  readOnly
                  className="font-mono"
                  data-testid="input-sla-professional"
                />
                <span className="text-sm text-muted-foreground">24h rolling</span>
              </div>
            </div>

            <div>
              <Label htmlFor="sla-verifier" className="text-sm font-medium mb-2 block">
                Verifier Nodes
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sla-verifier"
                  type="text"
                  value={`${params?.slaVerifier || 95}%`}
                  readOnly
                  className="font-mono"
                  data-testid="input-sla-verifier"
                />
                <span className="text-sm text-muted-foreground">24h rolling</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    Missing SLA = 0 rewards for that epoch
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Bounty Configuration</h2>
            <p className="text-sm text-muted-foreground">Verification task reward parameters</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="base-bounty" className="text-sm font-medium mb-2 block">
                Base Bounty Rate
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="base-bounty"
                  type="text"
                  value={params?.baseBountyRate || 50}
                  readOnly
                  className="font-mono"
                  data-testid="input-base-bounty"
                />
                <span className="text-sm text-muted-foreground">TUDAO per task</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Job Weight Multipliers
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(weight => (
                  <div key={weight} className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {weight}x
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Final bounty = BaseRate × Weight × QualityScore
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Whale Dampener Table</h2>
            <p className="text-sm text-muted-foreground">Per-identity Founder license weighting</p>
          </div>

          <div className="space-y-3">
            {[
              { licenses: "1st License", dampener: 100, color: "bg-green-600" },
              { licenses: "2nd License", dampener: 70, color: "bg-amber-600" },
              { licenses: "3rd License", dampener: 50, color: "bg-orange-600" },
              { licenses: "4th+ License", dampener: 25, color: "bg-red-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                <span className="text-sm flex-1">{item.licenses}</span>
                <Badge variant="outline" className="font-mono">{item.dampener}%</Badge>
              </div>
            ))}

            <div className="pt-3 mt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Effective FEU = 15 × dampener percentage per license
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-l-4 border-l-amber-500">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">Parameter Change Process</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>DAO Safe multisig proposes parameter update</li>
              <li>72-hour timelock period begins</li>
              <li>Community can review and raise concerns</li>
              <li>After timelock expires, change is executed</li>
            </ol>
            <p className="text-sm text-muted-foreground pt-2">
              Only authorized DAO Safe signers can propose changes. Contact the governance team to initiate a proposal.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, Shield, Users, Download } from "lucide-react";
import type { WhaleIdentity } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Whales() {
  const { toast } = useToast();
  
  const { data: whales, isLoading } = useQuery<WhaleIdentity[]>({
    queryKey: ["/api/governance/top-identities"],
    refetchInterval: 60000,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: "whales" })
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whale_identities_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Whale identities have been exported to CSV"
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export whale identities",
        variant: "destructive"
      });
    }
  });

  const topWhales = whales?.slice(0, 10) || [];
  const totalRawFeu = topWhales.reduce((sum, w) => sum + w.rawFeu, 0);
  const totalEffectiveFeu = topWhales.reduce((sum, w) => sum + w.effectiveFeu, 0);
  const avgDampener = topWhales.length ? topWhales.reduce((sum, w) => sum + w.dampenerApplied, 0) / topWhales.length : 0;
  const maxConcentration = topWhales.length > 0 ? (topWhales[0].effectiveFeu / totalEffectiveFeu) * 100 : 0;

  const truncateIdentity = (id: string) => {
    return `${id.slice(0, 12)}...${id.slice(-4)}`;
  };

  const getDampenerColor = (dampener: number) => {
    if (dampener >= 0.9) return "text-green-600 dark:text-green-500";
    if (dampener >= 0.7) return "text-amber-600 dark:text-amber-500";
    return "text-red-600 dark:text-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-foreground mb-2">Whale Oversight</h1>
        <p className="text-base text-muted-foreground">Monitor identity concentration and dampener effectiveness</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Top 10 Raw FEU"
          value={totalRawFeu.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          subtitle="before dampening"
          icon={<Users className="w-5 h-5" />}
          testId="kpi-raw-feu"
        />

        <KPICard
          title="Top 10 Effective FEU"
          value={totalEffectiveFeu.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          subtitle="after dampening"
          icon={<Shield className="w-5 h-5" />}
          testId="kpi-effective-feu"
        />

        <KPICard
          title="Avg Dampener"
          value={`${(avgDampener * 100).toFixed(1)}%`}
          subtitle="applied reduction"
          icon={<TrendingDown className="w-5 h-5" />}
          testId="kpi-avg-dampener"
        />

        <KPICard
          title="Max Concentration"
          value={`${maxConcentration.toFixed(2)}%`}
          subtitle="largest identity share"
          icon={<AlertTriangle className="w-5 h-5" />}
          testId="kpi-max-concentration"
        />
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Whale Logic Overview</h2>
          <p className="text-sm text-muted-foreground">
            The whale dampener system prevents governance capture by reducing the effective FEU weight 
            for identities holding multiple Founding licenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Dampener Schedule</h3>
            <div className="space-y-2">
              {[
                { licenses: "1st Founder", dampener: "100%", color: "bg-green-600" },
                { licenses: "2nd Founder", dampener: "70%", color: "bg-amber-600" },
                { licenses: "3rd Founder", dampener: "50%", color: "bg-orange-600" },
                { licenses: "4th+ Founder", dampener: "25%", color: "bg-red-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm flex-1">{item.licenses}</span>
                  <Badge variant="outline" className="font-mono">{item.dampener}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Anti-Capture Rules</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>No wallet exceeds 5% vote weight (post-quadratic)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Delegates limited to 3 unique identities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Parameter changes timelocked ≥ 72 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Governance weight uses √tokens × dampener</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Top 10 Identities</h2>
            <p className="text-sm text-muted-foreground">Ranked by effective FEU (post-dampening)</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            data-testid="button-export-whales"
          >
            <Download className="w-4 h-4" />
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 bg-muted/30 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Rank</TableHead>
                  <TableHead className="font-semibold">Identity ID</TableHead>
                  <TableHead className="font-semibold">Node Count</TableHead>
                  <TableHead className="font-semibold">Raw FEU</TableHead>
                  <TableHead className="font-semibold">Dampener</TableHead>
                  <TableHead className="font-semibold">Effective FEU</TableHead>
                  <TableHead className="font-semibold">Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topWhales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No whale data available
                    </TableCell>
                  </TableRow>
                ) : (
                  topWhales.map((whale, index) => {
                    const reduction = ((whale.rawFeu - whale.effectiveFeu) / whale.rawFeu) * 100;
                    
                    return (
                      <TableRow key={whale.identityId} className="hover-elevate" data-testid={`row-whale-${index + 1}`}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{truncateIdentity(whale.identityId)}</TableCell>
                        <TableCell className="font-mono font-semibold">{whale.nodeCount}</TableCell>
                        <TableCell className="font-mono font-semibold">
                          {whale.rawFeu.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-mono font-semibold ${getDampenerColor(whale.dampenerApplied)}`}>
                            {(whale.dampenerApplied * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-primary">
                          {whale.effectiveFeu.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-32">
                            <Progress value={reduction} className="flex-1 h-2" />
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                              -{reduction.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && topWhales.length > 0 && (
          <div className="mt-6 p-4 bg-muted/30 rounded-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Total Reduction:</span> The dampener system 
              has reduced the top 10 identities' influence by {((1 - (totalEffectiveFeu / totalRawFeu)) * 100).toFixed(1)}%, 
              preventing {(totalRawFeu - totalEffectiveFeu).toFixed(2)} FEU from concentrating governance power.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

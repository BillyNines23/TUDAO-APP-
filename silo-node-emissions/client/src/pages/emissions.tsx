import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Users, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import type { RewardsLedger } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Emissions() {
  const [selectedEpoch, setSelectedEpoch] = useState<string>("latest");
  const { toast } = useToast();

  const { data: ledger, isLoading } = useQuery<RewardsLedger[]>({
    queryKey: ["/api/admin/emissions/epoch", { epoch: selectedEpoch }],
    refetchInterval: 60000,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reportType: "emissions",
          epochDate: selectedEpoch !== "latest" ? selectedEpoch : undefined
        })
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emissions_export_${selectedEpoch}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Emissions data has been exported to CSV"
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export emissions data",
        variant: "destructive"
      });
    }
  });

  const totalEmissions = ledger?.reduce((sum, r) => sum + r.totalReward, 0) || 0;
  const totalClaimed = ledger?.filter(r => r.claimed).reduce((sum, r) => sum + r.totalReward, 0) || 0;
  const avgReward = ledger?.length ? totalEmissions / ledger.length : 0;
  const claimRate = totalEmissions > 0 ? (totalClaimed / totalEmissions) * 100 : 0;

  const tierDistribution = [
    { name: "Founding", value: 720000, color: "hsl(var(--chart-1))" },
    { name: "Professional", value: 256000, color: "hsl(var(--chart-2))" },
    { name: "Verifier", value: 24000, color: "hsl(var(--chart-3))" },
  ];

  const weeklyTrend = [
    { epoch: "E-6", emissions: 950000, claimed: 900000 },
    { epoch: "E-5", emissions: 960000, claimed: 920000 },
    { epoch: "E-4", emissions: 955000, claimed: 910000 },
    { epoch: "E-3", emissions: 970000, claimed: 950000 },
    { epoch: "E-2", emissions: 965000, claimed: 940000 },
    { epoch: "E-1", emissions: 975000, claimed: 960000 },
    { epoch: "Latest", emissions: totalEmissions, claimed: totalClaimed },
  ];

  const truncateNodeId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-foreground mb-2">Emissions & Treasury</h1>
        <p className="text-base text-muted-foreground">Monitor daily reward distribution and claim activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Emissions"
          value={totalEmissions.toLocaleString()}
          subtitle="TUDAO this epoch"
          icon={<Coins className="w-5 h-5" />}
          testId="kpi-total-emissions"
        />

        <KPICard
          title="Claim Rate"
          value={`${claimRate.toFixed(1)}%`}
          subtitle="rewards claimed"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 1.2, label: "vs last epoch" }}
          testId="kpi-claim-rate"
        />

        <KPICard
          title="Avg Reward"
          value={avgReward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          subtitle="TUDAO per node"
          icon={<Users className="w-5 h-5" />}
          testId="kpi-avg-reward"
        />

        <KPICard
          title="NRP Utilization"
          value={`${((totalEmissions / 1000000) * 100).toFixed(1)}%`}
          subtitle="of 1M daily cap"
          icon={<Coins className="w-5 h-5" />}
          testId="kpi-nrp-util"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Emissions by Tier</h2>
            <p className="text-sm text-muted-foreground">Current epoch distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tierDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {tierDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.375rem"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">7-Day Emission Trend</h2>
            <p className="text-sm text-muted-foreground">Emissions vs claims over time</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="epoch" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.375rem"
                }}
              />
              <Legend />
              <Bar dataKey="emissions" fill="hsl(var(--chart-1))" name="Emitted" />
              <Bar dataKey="claimed" fill="hsl(var(--chart-2))" name="Claimed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Epoch Rewards Ledger</h2>
            <p className="text-sm text-muted-foreground">Detailed breakdown of node rewards</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            data-testid="button-export-emissions"
          >
            <Download className="w-4 h-4" />
            {exportMutation.isPending ? "Exporting..." : "Export CSV"}
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
                  <TableHead className="font-semibold">Node ID</TableHead>
                  <TableHead className="font-semibold">Epoch</TableHead>
                  <TableHead className="font-semibold">FEU Used</TableHead>
                  <TableHead className="font-semibold">Base Reward</TableHead>
                  <TableHead className="font-semibold">Bounty</TableHead>
                  <TableHead className="font-semibold">Total Reward</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!ledger || ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No rewards data for this epoch
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.slice(0, 20).map((record) => (
                    <TableRow key={record.id} className="hover-elevate" data-testid={`row-reward-${record.id}`}>
                      <TableCell className="font-mono text-sm">{truncateNodeId(record.nodeId)}</TableCell>
                      <TableCell className="font-mono text-sm">{record.epoch}</TableCell>
                      <TableCell className="font-mono font-semibold">{record.feuUsed.toFixed(2)}</TableCell>
                      <TableCell className="font-mono font-semibold">
                        {record.baseReward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {record.bountyReward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-primary">
                        {record.totalReward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell>
                        {record.claimed ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

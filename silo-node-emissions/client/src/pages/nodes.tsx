import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Search, Filter, Download } from "lucide-react";
import type { NodeWithSummary } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Nodes() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: nodes, isLoading } = useQuery<NodeWithSummary[]>({
    queryKey: ["/api/admin/nodes", { tier: tierFilter, status: statusFilter, search }],
    refetchInterval: 60000,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: "nodes" })
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nodes_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Nodes data has been exported to CSV"
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export nodes data",
        variant: "destructive"
      });
    }
  });

  const filteredNodes = nodes?.filter(node => {
    if (search && !node.licenseId.toLowerCase().includes(search.toLowerCase()) && 
        !node.ownerWallet.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-foreground mb-2">Nodes & Uptime</h1>
        <p className="text-base text-muted-foreground">Monitor node performance and SLA compliance</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by license ID or wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-nodes"
            />
          </div>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-tier-filter">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="founding">Founding</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="verifier">Verifier</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="green">Green (99%+)</SelectItem>
              <SelectItem value="amber">Amber (95-99%)</SelectItem>
              <SelectItem value="red">Red (&lt;95%)</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            data-testid="button-export-nodes"
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
                  <TableHead className="font-semibold">License ID</TableHead>
                  <TableHead className="font-semibold">Tier</TableHead>
                  <TableHead className="font-semibold">Owner</TableHead>
                  <TableHead className="font-semibold">Uptime (24h)</TableHead>
                  <TableHead className="font-semibold">SLA Status</TableHead>
                  <TableHead className="font-semibold">Effective FEU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No nodes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNodes.map((node) => (
                    <TableRow key={node.nodeId} className="hover-elevate" data-testid={`row-node-${node.nodeId}`}>
                      <TableCell className="font-mono text-sm">{node.licenseId}</TableCell>
                      <TableCell>
                        <span className="capitalize text-sm font-medium">
                          {node.tier}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{truncateWallet(node.ownerWallet)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">
                            {node.summary?.uptime24h.toFixed(1) || "0.0"}%
                          </span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-24">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${node.summary?.uptime24h || 0}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={node.summary?.status as any || "red"}
                          testId={`status-${node.nodeId}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {node.effectiveFeu?.toFixed(2) || "0.00"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && filteredNodes.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {filteredNodes.length} of {nodes?.length || 0} nodes</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled data-testid="button-prev-page">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled data-testid="button-next-page">
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

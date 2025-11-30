import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { KPICard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Award, TrendingUp, Download } from "lucide-react";
import type { VerificationTask } from "@shared/schema";
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

export default function Verification() {
  const { toast } = useToast();
  
  const { data: tasks, isLoading } = useQuery<VerificationTask[]>({
    queryKey: ["/api/verification/tasks"],
    refetchInterval: 30000,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: "verification" })
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verification_tasks_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Verification tasks have been exported to CSV"
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export verification tasks",
        variant: "destructive"
      });
    }
  });

  const stats = {
    assigned: tasks?.filter(t => t.status === "assigned").length || 0,
    inProgress: tasks?.filter(t => t.status === "in_progress").length || 0,
    completed: tasks?.filter(t => t.status === "completed" || t.status === "upheld").length || 0,
    upheldRate: tasks?.length ? 
      ((tasks.filter(t => t.status === "upheld").length / tasks.filter(t => t.status === "completed" || t.status === "upheld" || t.status === "overturned").length) * 100) || 0 
      : 0,
  };

  const avgTurnaround = 4.2;
  const totalBounties = tasks?.reduce((sum, t) => sum + (t.bountyAmount || 0), 0) || 0;

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const getStatusVariant = (status: string) => {
    if (status === "upheld" || status === "completed") return "completed";
    if (status === "overturned") return "failed";
    if (status === "in_progress" || status === "review") return "active";
    return "pending";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-foreground mb-2">Verification & Bounties</h1>
        <p className="text-base text-muted-foreground">Track verification task performance and quality metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Assigned Tasks"
          value={stats.assigned}
          subtitle="awaiting completion"
          icon={<Clock className="w-5 h-5" />}
          testId="kpi-assigned-tasks"
        />

        <KPICard
          title="In Progress"
          value={stats.inProgress}
          subtitle="active verifications"
          icon={<TrendingUp className="w-5 h-5" />}
          testId="kpi-in-progress-tasks"
        />

        <KPICard
          title="Upheld Rate"
          value={`${stats.upheldRate.toFixed(1)}%`}
          subtitle="quality score"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: 2.3, label: "vs last week" }}
          testId="kpi-upheld-rate"
        />

        <KPICard
          title="Total Bounties"
          value={totalBounties.toLocaleString()}
          subtitle="TUDAO paid today"
          icon={<Award className="w-5 h-5" />}
          testId="kpi-total-bounties"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Avg Turnaround</span>
                <span className="text-base font-mono font-semibold">{avgTurnaround}h</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Completed Today</span>
                <span className="text-base font-mono font-semibold">{stats.completed}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Active Verifiers</span>
                <span className="text-base font-mono font-semibold">
                  {new Set(tasks?.map(t => t.assignedTo)).size || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-4">Task Weight Distribution</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(weight => {
              const count = tasks?.filter(t => t.weight === weight).length || 0;
              const percentage = tasks?.length ? (count / tasks.length) * 100 : 0;
              
              return (
                <div key={weight}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Weight {weight}</span>
                    <span className="text-sm font-mono font-medium">{count} tasks</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Recent Verification Tasks</h2>
            <p className="text-sm text-muted-foreground">Latest verification activity and outcomes</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            data-testid="button-export-verification"
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
                  <TableHead className="font-semibold">Task ID</TableHead>
                  <TableHead className="font-semibold">Job ID</TableHead>
                  <TableHead className="font-semibold">Assigned To</TableHead>
                  <TableHead className="font-semibold">Weight</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Accuracy</TableHead>
                  <TableHead className="font-semibold">Bounty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!tasks || tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No verification tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.slice(0, 20).map((task) => (
                    <TableRow key={task.taskId} className="hover-elevate" data-testid={`row-task-${task.taskId}`}>
                      <TableCell className="font-mono text-sm">{task.taskId.slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono text-sm">{task.jobId.slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono text-sm">{truncateWallet(task.assignedTo)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {task.weight}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={getStatusVariant(task.status)}
                          label={task.status.replace(/_/g, ' ')}
                          testId={`status-${task.taskId}`}
                        />
                      </TableCell>
                      <TableCell>
                        {task.accuracyScore !== null && task.accuracyScore !== undefined ? (
                          <span className="font-mono font-semibold">
                            {(task.accuracyScore * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.bountyAmount !== null && task.bountyAmount !== undefined ? (
                          <span className="font-mono font-semibold">
                            {task.bountyAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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

import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/kpi-card";
import { AlertBanner } from "@/components/alert-banner";
import { Card } from "@/components/ui/card";
import { Server, CheckSquare, Coins, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { KPIOverview, AlertRecord } from "@shared/schema";

export default function Overview() {
  const { data: kpi, isLoading: kpiLoading } = useQuery<KPIOverview>({
    queryKey: ["/api/admin/kpi/overview"],
    refetchInterval: 30000,
  });

  const { data: alerts } = useQuery<AlertRecord[]>({
    queryKey: ["/api/admin/alerts"],
    refetchInterval: 10000,
  });

  const activeAlerts = alerts?.filter(a => !a.resolved) || [];
  
  // Map alert severity to AlertBanner type
  const getSeverityType = (severity: string): "info" | "warning" | "error" | "success" => {
    switch (severity) {
      case "critical": return "error";
      case "high": return "error";
      case "medium": return "warning";
      case "low": return "info";
      default: return "info";
    }
  };

  const emissionsTrendData = [
    { date: "Mon", founding: 450000, professional: 240000, verifier: 30000 },
    { date: "Tue", founding: 460000, professional: 250000, verifier: 32000 },
    { date: "Wed", founding: 455000, professional: 245000, verifier: 31000 },
    { date: "Thu", founding: 470000, professional: 255000, verifier: 33000 },
    { date: "Fri", founding: 465000, professional: 252000, verifier: 32500 },
    { date: "Sat", founding: 475000, professional: 258000, verifier: 34000 },
    { date: "Today", founding: kpi?.emissionsToday.byTier.founding || 480000, professional: kpi?.emissionsToday.byTier.professional || 260000, verifier: kpi?.emissionsToday.byTier.verifier || 35000 },
  ];

  const uptimeTrendData = [
    { time: "00:00", sla: 98.5 },
    { time: "04:00", sla: 98.8 },
    { time: "08:00", sla: 99.1 },
    { time: "12:00", sla: 98.9 },
    { time: "16:00", sla: 99.2 },
    { time: "20:00", sla: kpi?.slaPassRate || 99.0 },
  ];

  if (kpiLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-card rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          {activeAlerts.map(alert => (
            <AlertBanner
              key={alert.id}
              type={getSeverityType(alert.severity)}
              message={alert.message}
              testId={`alert-${alert.id}`}
            />
          ))}
        </div>
      )}

      <div>
        <h1 className="text-4xl font-light text-foreground mb-2">Command Center</h1>
        <p className="text-base text-muted-foreground">Real-time overview of TUDAO node network operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Nodes"
          value={kpi?.activeNodes.total || 0}
          subtitle={`F: ${kpi?.activeNodes.byTier.founding || 0} | P: ${kpi?.activeNodes.byTier.professional || 0} | V: ${kpi?.activeNodes.byTier.verifier || 0}`}
          icon={<Server className="w-5 h-5" />}
          testId="kpi-active-nodes"
        />

        <KPICard
          title="SLA Pass Rate"
          value={`${kpi?.slaPassRate.toFixed(1) || "0.0"}%`}
          trend={{ value: 0.5, label: "vs yesterday" }}
          icon={<CheckSquare className="w-5 h-5" />}
          testId="kpi-sla-rate"
        />

        <KPICard
          title="NRP Utilization"
          value={`${kpi?.nrpUtilization.toFixed(1) || "0.0"}%`}
          subtitle="of 1M TUDAO/day"
          icon={<Coins className="w-5 h-5" />}
          testId="kpi-nrp-util"
        />

        <KPICard
          title="Pending Tasks"
          value={kpi?.pendingTasks || 0}
          subtitle="awaiting verification"
          icon={<AlertTriangle className="w-5 h-5" />}
          testId="kpi-pending-tasks"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Daily Emissions by Tier</h2>
            <p className="text-sm text-muted-foreground">7-day trend in TUDAO tokens</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={emissionsTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.375rem"
                }}
              />
              <Legend />
              <Bar dataKey="founding" fill="hsl(var(--chart-1))" name="Founding" />
              <Bar dataKey="professional" fill="hsl(var(--chart-2))" name="Professional" />
              <Bar dataKey="verifier" fill="hsl(var(--chart-3))" name="Verifier" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Network SLA Performance</h2>
            <p className="text-sm text-muted-foreground">24-hour uptime percentage</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={uptimeTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis domain={[95, 100]} className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.375rem"
                }}
              />
              <Line type="monotone" dataKey="sla" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Verification Stats</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Assigned</span>
                <span className="text-base font-mono font-semibold">{kpi?.verificationsToday.assigned || 0}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-base font-mono font-semibold">{kpi?.verificationsToday.completed || 0}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Upheld Rate</span>
                <span className="text-base font-mono font-semibold text-green-600 dark:text-green-500">
                  {kpi?.verificationsToday.upheldPercent.toFixed(1) || "0.0"}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Emissions Today</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-base font-mono font-semibold">
                  {(kpi?.emissionsToday.total || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Founding</span>
                <span className="text-base font-mono font-semibold">
                  {(kpi?.emissionsToday.byTier.founding || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Pro + Verifier</span>
                <span className="text-base font-mono font-semibold">
                  {((kpi?.emissionsToday.byTier.professional || 0) + (kpi?.emissionsToday.byTier.verifier || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Bounty Payouts</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-base font-mono font-semibold">
                  {(kpi?.bountyPayouts.today || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">7 Days</span>
                <span className="text-base font-mono font-semibold">
                  {(kpi?.bountyPayouts.week || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">30 Days</span>
                <span className="text-base font-mono font-semibold">
                  {(kpi?.bountyPayouts.month || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

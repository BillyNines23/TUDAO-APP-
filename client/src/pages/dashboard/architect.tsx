import { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Server, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Zap,
  Settings,
  FileText,
  BarChart3
} from "lucide-react";

export default function ArchitectDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Status Ribbon */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-slate-300 font-medium">System Operational</span>
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              Architect Mode
            </Badge>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Last sync: 2m ago</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Authenticated</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Platform Command Center
              </h1>
              <p className="text-slate-400">
                Full network observability and governance controls
              </p>
            </div>
            <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Button>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white" data-testid="tab-overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white" data-testid="tab-marketplace">
                <Activity className="w-4 h-4 mr-2" />
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="nodes" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white" data-testid="tab-nodes">
                <Server className="w-4 h-4 mr-2" />
                Nodes
              </TabsTrigger>
              <TabsTrigger value="governance" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white" data-testid="tab-governance">
                <Shield className="w-4 h-4 mr-2" />
                Governance
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white" data-testid="tab-compliance">
                <FileText className="w-4 h-4 mr-2" />
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={Users}
                  title="Total Users"
                  value="2,847"
                  change="+12%"
                  trend="up"
                  iconColor="text-blue-400"
                />
                <MetricCard
                  icon={Activity}
                  title="Active Projects"
                  value="143"
                  change="+8%"
                  trend="up"
                  iconColor="text-emerald-400"
                />
                <MetricCard
                  icon={DollarSign}
                  title="Total Value Locked"
                  value="$847K"
                  change="+23%"
                  trend="up"
                  iconColor="text-purple-400"
                />
                <MetricCard
                  icon={Server}
                  title="Active Nodes"
                  value="89"
                  change="-2%"
                  trend="down"
                  iconColor="text-orange-400"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Network Activity</CardTitle>
                    <CardDescription className="text-slate-400">
                      Projects and transactions over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-slate-500">
                      <BarChart3 className="w-12 h-12 mb-2" />
                    </div>
                    <p className="text-center text-sm text-slate-500">Chart visualization</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Role Distribution</CardTitle>
                    <CardDescription className="text-slate-400">
                      User breakdown by role type
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <RoleDistributionBar role="Providers" count={1247} total={2847} color="bg-blue-500" />
                    <RoleDistributionBar role="Consumers" count={986} total={2847} color="bg-emerald-500" />
                    <RoleDistributionBar role="Nodeholders" count={614} total={2847} color="bg-purple-500" />
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                  <CardDescription className="text-slate-400">
                    Real-time platform status monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <HealthIndicator
                      label="API Response Time"
                      value="42ms"
                      status="healthy"
                    />
                    <HealthIndicator
                      label="Database Connections"
                      value="234/500"
                      status="healthy"
                    />
                    <HealthIndicator
                      label="Node Uptime"
                      value="99.8%"
                      status="healthy"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={Activity}
                  title="Pending Projects"
                  value="23"
                  change="Live"
                  iconColor="text-yellow-400"
                />
                <MetricCard
                  icon={CheckCircle2}
                  title="Completed (30d)"
                  value="412"
                  change="+18%"
                  trend="up"
                  iconColor="text-emerald-400"
                />
                <MetricCard
                  icon={AlertTriangle}
                  title="Disputed"
                  value="3"
                  change="-2"
                  trend="down"
                  iconColor="text-red-400"
                />
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Projects</CardTitle>
                  <CardDescription className="text-slate-400">
                    Latest marketplace activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <ProjectRow
                      id="PRJ-8432"
                      title="Mobile App Development"
                      consumer="0x742d...4a3c"
                      provider="0x8f3a...2b1d"
                      amount="$2,400"
                      status="in_progress"
                    />
                    <ProjectRow
                      id="PRJ-8431"
                      title="Smart Contract Audit"
                      consumer="0x9a2b...7e4f"
                      provider="0x3c1d...5a9b"
                      amount="$5,000"
                      status="escrow_funded"
                    />
                    <ProjectRow
                      id="PRJ-8430"
                      title="UI/UX Design"
                      consumer="0x5e3f...8c2a"
                      provider="Unassigned"
                      amount="$1,800"
                      status="pending"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nodes Tab */}
            <TabsContent value="nodes" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={Server}
                  title="Total Nodes"
                  value="89"
                  change="Active"
                  iconColor="text-blue-400"
                />
                <MetricCard
                  icon={Zap}
                  title="Avg Uptime"
                  value="99.8%"
                  change="+0.2%"
                  trend="up"
                  iconColor="text-emerald-400"
                />
                <MetricCard
                  icon={Database}
                  title="Storage Used"
                  value="4.2TB"
                  change="68%"
                  iconColor="text-purple-400"
                />
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Node Status</CardTitle>
                  <CardDescription className="text-slate-400">
                    Active node operators and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <NodeRow
                      nodeId="NODE-001"
                      operator="0x742d...4a3c"
                      uptime="99.9%"
                      status="online"
                      lastSeen="2m ago"
                    />
                    <NodeRow
                      nodeId="NODE-002"
                      operator="0x8f3a...2b1d"
                      uptime="99.7%"
                      status="online"
                      lastSeen="5m ago"
                    />
                    <NodeRow
                      nodeId="NODE-003"
                      operator="0x9a2b...7e4f"
                      uptime="98.2%"
                      status="warning"
                      lastSeen="15m ago"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Governance Tab */}
            <TabsContent value="governance" className="space-y-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Whitelist Management</CardTitle>
                  <CardDescription className="text-slate-400">
                    Control platform access and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="button-add-whitelist">
                    Add Wallet to Whitelist
                  </Button>
                  <div className="space-y-2">
                    <WhitelistEntry
                      address="0x91ab951ab5c31a0d475d3539099c09d7fc307a75"
                      role="Architect"
                      addedDate="2024-01-15"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Platform Parameters</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure protocol settings and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ParameterRow
                    name="Platform Fee"
                    value="2.5%"
                    description="Fee charged on completed projects"
                  />
                  <ParameterRow
                    name="Min Escrow Amount"
                    value="$100"
                    description="Minimum project escrow requirement"
                  />
                  <ParameterRow
                    name="Dispute Resolution Period"
                    value="7 days"
                    description="Time window for dispute filing"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Activity Audit Log</CardTitle>
                  <CardDescription className="text-slate-400">
                    Recent platform events and actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <AuditLogEntry
                      action="User registered"
                      user="0x742d...4a3c"
                      timestamp="2m ago"
                      status="success"
                    />
                    <AuditLogEntry
                      action="Project created"
                      user="0x9a2b...7e4f"
                      timestamp="5m ago"
                      status="success"
                    />
                    <AuditLogEntry
                      action="Escrow funded"
                      user="0x8f3a...2b1d"
                      timestamp="12m ago"
                      status="success"
                    />
                    <AuditLogEntry
                      action="Failed login attempt"
                      user="0x3c1d...5a9b"
                      timestamp="18m ago"
                      status="warning"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Incident Reports</CardTitle>
                  <CardDescription className="text-slate-400">
                    Open incidents requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                    <p className="font-medium">No open incidents</p>
                    <p className="text-sm">All systems operating normally</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}

// Helper Components
function MetricCard({ icon: Icon, title, value, change, trend, iconColor }: any) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-slate-800 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <Badge variant="outline" className={trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}>
              {change}
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-slate-400">{title}</p>
      </CardContent>
    </Card>
  );
}

function RoleDistributionBar({ role, count, total, color }: any) {
  const percentage = Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-300">{role}</span>
        <span className="text-sm text-slate-400">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function HealthIndicator({ label, value, status }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800">
      <div className={`h-3 w-3 rounded-full ${status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
      <div className="flex-1">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

function ProjectRow({ id, title, consumer, provider, amount, status }: any) {
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    escrow_funded: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors">
      <div className="flex-1">
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-slate-400">
          {id} • Consumer: {consumer} • Provider: {provider}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium text-white">{amount}</span>
        <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
          {status.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
}

function NodeRow({ nodeId, operator, uptime, status, lastSeen }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800">
      <div className="flex-1">
        <p className="font-medium text-white">{nodeId}</p>
        <p className="text-sm text-slate-400">Operator: {operator}</p>
      </div>
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm text-slate-400">Uptime</p>
          <p className="font-medium text-white">{uptime}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Last Seen</p>
          <p className="font-medium text-white">{lastSeen}</p>
        </div>
        <Badge variant="outline" className={status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}>
          {status}
        </Badge>
      </div>
    </div>
  );
}

function WhitelistEntry({ address, role, addedDate }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
      <div>
        <p className="font-mono text-sm text-white">{address}</p>
        <p className="text-xs text-slate-400">Added: {addedDate}</p>
      </div>
      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
        {role}
      </Badge>
    </div>
  );
}

function ParameterRow({ name, value, description }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800">
      <div className="flex-1">
        <p className="font-medium text-white">{name}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium text-white">{value}</span>
        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600">
          Edit
        </Button>
      </div>
    </div>
  );
}

function AuditLogEntry({ action, user, timestamp, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
      <div className="flex items-center gap-3 flex-1">
        <div className={`h-2 w-2 rounded-full ${status === 'success' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
        <div>
          <p className="text-sm text-white">{action}</p>
          <p className="text-xs text-slate-400">User: {user}</p>
        </div>
      </div>
      <span className="text-xs text-slate-400">{timestamp}</span>
    </div>
  );
}

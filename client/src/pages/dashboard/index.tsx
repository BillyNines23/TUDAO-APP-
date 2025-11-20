import { useEffect } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTudao } from "@/lib/tudao-context";
import { ArrowRight, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { role } = useTudao();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (role === 'consumer') {
        setLocation('/dashboard/consumer');
    }
  }, [role, setLocation]);

  return (
    <AppShell>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3 mt-4">
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Role</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold capitalize">{role}</div>
                <p className="text-xs text-muted-foreground">
                    Active workspace environment
                </p>
            </CardContent>
        </Card>
        <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Status</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">
                    Base Mainnet • Connected
                </p>
            </CardContent>
        </Card>
        <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
            </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                    Requires your attention
                </p>
            </CardContent>
        </Card>
      </div>

      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-md space-y-4">
            <div className="h-12 w-12 bg-sidebar-primary/10 text-sidebar-primary rounded-lg flex items-center justify-center mx-auto">
                <Layers className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold font-display">Welcome to the {role} Dashboard</h2>
            <p className="text-muted-foreground">
                This module serves as the central command center for your {role} activities. 
                Integrate existing silos here.
            </p>
            <Button>
                Explore Modules <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </div>
    </AppShell>
  );
}

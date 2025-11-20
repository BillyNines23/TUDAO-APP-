import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowRight, Shield, Users, Zap, Database } from "lucide-react";
import generatedLogo from "@assets/generated_images/metallic_tudao_logo.png";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative selection:bg-primary/20">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-white/10 rounded p-1 backdrop-blur-sm border border-white/20">
             <img src={generatedLogo} alt="TUDAO" className="w-full h-full object-contain" />
           </div>
           <span className="font-display font-bold text-2xl tracking-tighter">TUDAO</span>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/dashboard')}>Dashboard</Button>
            <Button onClick={() => setLocation('/dashboard')}>Launch App</Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md">
                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                    The Future of Work is Here
                </div>
                <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight leading-[1.1]">
                    For Those Who <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Do The Work.</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                    Decentralized task orchestration, node governance, and autonomous scope agents. The master dashboard for the TUDAO ecosystem.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                    <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20" onClick={() => setLocation('/dashboard')}>
                        Enter Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5">
                        Read Documentation
                    </Button>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-2xl -z-10 transform rotate-3"></div>
                <Card className="border-primary/10 bg-background/40 backdrop-blur-md shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ActivityIndicator />
                            System Status
                        </CardTitle>
                        <CardDescription>Real-time ecosystem metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Active Nodes</span>
                                <span className="font-mono font-bold">1,248</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[75%] rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Treasury Volume</span>
                                <span className="font-mono font-bold">$4.2M</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[45%] rounded-full" />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tasks</div>
                                <div className="text-2xl font-mono font-bold">842</div>
                            </div>
                            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Agents</div>
                                <div className="text-2xl font-mono font-bold">12</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32">
            <FeatureCard 
                icon={Users} 
                title="Roles" 
                description="Provider, Consumer, Nodeholder, Architect. Define your contribution." 
            />
            <FeatureCard 
                icon={Zap} 
                title="Speed" 
                description="Optimized workflows powered by Base L2 for instant settlement." 
            />
             <FeatureCard 
                icon={Database} 
                title="Data" 
                description="Verifiable on-chain credentials and reputation tracking." 
            />
             <FeatureCard 
                icon={Shield} 
                title="Security" 
                description="Embedded Privy wallets and decentralized identity management." 
            />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all hover:-translate-y-1 duration-300 group">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}

function ActivityIndicator() {
    return (
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </div>
    )
}

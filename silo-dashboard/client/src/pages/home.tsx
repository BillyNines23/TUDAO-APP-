import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Users, Zap, Database, Briefcase, ShieldCheck, Shield, Settings } from "lucide-react";
import { motion } from "framer-motion";
import generatedLogo from "@assets/generated_images/metallic_tudao_logo.png";
import { useTudao } from "@/lib/tudao-context";
import { usePrivy } from "@/lib/auth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { setRole } = useTudao();
  const { user, authenticated, login, logout } = usePrivy();
  const [showDevTools, setShowDevTools] = useState(false);
  
  const testWallets = {
    'New User': '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0'),
    'Provider': '0x1234567890abcdef1234567890abcdef12345678',
    'Consumer': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    'Architect': '0x91ab951ab5c31a0d475d3539099c09d7fc307a75',
  };
  
  const switchWallet = (walletAddress: string) => {
    localStorage.setItem('mockWallet', walletAddress);
    logout();
    window.location.reload();
  };

  // Auto-routing after login
  useEffect(() => {
    if (authenticated && user) {
      if (user.role) {
        // Existing user with role - redirect to dashboard
        setRole(user.role as any);
        switch (user.role) {
          case "consumer":
            setLocation("/dashboard/consumer");
            break;
          case "provider":
            setLocation("/dashboard/provider");
            break;
          case "nodeholder":
            setLocation("/dashboard/nodeholder");
            break;
          case "architect":
            setLocation("/dashboard/architect");
            break;
        }
      } else {
        // New user without role - redirect to onboarding
        setLocation("/onboarding/path");
      }
    }
  }, [authenticated, user, setRole, setLocation]);

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
          {!authenticated && (
            <Button 
              onClick={login}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-login"
            >
              Log In
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md mb-6">
                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                    The Future of Work is Here
                </div>
                <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-8">
                    For Those Who <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Do The Work.</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
                    Decentralized task orchestration, node governance, and autonomous scope agents. Join the future of work.
                </p>
                
                {/* Login Buttons */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-16 flex gap-4 justify-center"
                >
                  <Button 
                    onClick={login}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
                    data-testid="button-login"
                  >
                    Log In
                  </Button>
                  <Button 
                    onClick={login}
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 h-auto"
                    data-testid="button-create-account"
                  >
                    Create Account
                  </Button>
                </motion.div>
            </motion.div>

            {/* Informational Cards - Not role assignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-4 text-center pt-8 pb-8">
                    <div className="mx-auto h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                       <Users className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                        <CardTitle className="text-xl mb-2">Hire a Provider</CardTitle>
                        <CardDescription className="text-base">
                          Find skilled professionals for your projects. Browse verified providers and get quotes.
                        </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-4 text-center pt-8 pb-8">
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                       <Briefcase className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                        <CardTitle className="text-xl mb-2">Become a Provider</CardTitle>
                        <CardDescription className="text-base">
                          Offer your skills and earn. Build reputation, connect with clients, and grow your business.
                        </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-4 text-center pt-8 pb-8">
                    <div className="mx-auto h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                       <ShieldCheck className="h-8 w-8 text-purple-500" />
                    </div>
                    <div>
                        <CardTitle className="text-xl mb-2">Buy a Node</CardTitle>
                        <CardDescription className="text-base">
                          Own infrastructure, earn rewards, and participate in governance of the network.
                        </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
                icon={Users} 
                title="Roles" 
                description="Provider, Consumer, Nodeholder. Define your contribution to the network." 
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
                description="Embedded wallets and decentralized identity management." 
            />
        </div>
        
        {/* Developer Tools - For testing different user types */}
        <div className="mt-16 pt-8 border-t border-border/30">
          <button 
            onClick={() => setShowDevTools(!showDevTools)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
            data-testid="button-toggle-devtools"
          >
            <Settings className="w-4 h-4" />
            {showDevTools ? 'Hide' : 'Show'} Test Wallets
          </button>
          
          {showDevTools && (
            <div className="mt-6 p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm max-w-2xl mx-auto">
              <h3 className="font-display font-bold text-lg mb-4">Test Different User Types</h3>
              <div className="space-y-3">
                {Object.entries(testWallets).map(([name, address]) => (
                  <div key={name} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{address}</p>
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => switchWallet(address)}
                      data-testid={`button-switch-${name.toLowerCase().replace(' ', '-')}`}
                    >
                      Use This Wallet
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Current wallet: <span className="font-mono">{localStorage.getItem('mockWallet')?.substring(0, 10)}...</span>
              </p>
            </div>
          )}
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

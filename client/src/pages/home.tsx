import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Users, Zap, Database, Briefcase, ShieldCheck, Shield, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import generatedLogo from "@assets/generated_images/metallic_tudao_logo.png";
import { useTudao } from "@/lib/tudao-context";
import { usePrivy } from "@/lib/auth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { setRole } = useTudao();
  const { user, authenticated, login, logout } = usePrivy();

  // Auto-redirect existing users to their dashboard
  useEffect(() => {
    if (authenticated && user?.role && user.isExistingUser) {
      // Existing user with a role - auto-redirect
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
    }
  }, [authenticated, user, setRole, setLocation]);

  const handleRoleSelect = async (role: 'consumer' | 'provider' | 'nodeholder' | 'architect') => {
    if (!user) return;
    
    try {
      // Update role in database
      await fetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      setRole(role);
      
      // Redirect to appropriate dashboard
      switch (role) {
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
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

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
          {authenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-mono">{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                data-testid="button-logout"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={login}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-connect-wallet"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
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
                    Decentralized task orchestration, node governance, and autonomous scope agents. Choose your path to get started.
                </p>
                
                {/* Connect Wallet CTA - Show if not authenticated */}
                {!authenticated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12"
                  >
                    <Button 
                      onClick={login}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
                      data-testid="button-connect-wallet-hero"
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      Connect Wallet to Get Started
                    </Button>
                  </motion.div>
                )}
            </motion.div>

            {/* Role Selection Cards - Only show for new users without a role */}
            {authenticated && user && !user.role && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
                <motion.div 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10 group bg-card/50 backdrop-blur-sm"
                    onClick={() => handleRoleSelect("consumer")}
                  >
                    <CardHeader className="space-y-4 text-center pt-8 pb-8">
                      <div className="mx-auto h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                         <Users className="h-8 w-8 text-blue-500 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                          <CardTitle className="text-xl mb-2">Hire a Provider</CardTitle>
                          <CardDescription className="text-base">
                            I need help with a service
                          </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/10 group bg-card/50 backdrop-blur-sm"
                    onClick={() => handleRoleSelect("provider")}
                  >
                    <CardHeader className="space-y-4 text-center pt-8 pb-8">
                      <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                         <Briefcase className="h-8 w-8 text-green-500 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                          <CardTitle className="text-xl mb-2">Become a Provider</CardTitle>
                          <CardDescription className="text-base">
                            I offer professional services
                          </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-500/10 group bg-card/50 backdrop-blur-sm"
                    onClick={() => handleRoleSelect("nodeholder")}
                  >
                    <CardHeader className="space-y-4 text-center pt-8 pb-8">
                      <div className="mx-auto h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                         <ShieldCheck className="h-8 w-8 text-purple-500 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                          <CardTitle className="text-xl mb-2">Own a TUDAO Node</CardTitle>
                          <CardDescription className="text-base">
                            Access rewards and governance
                          </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Loading message for existing users being redirected */}
            {authenticated && user && user.role && user.isExistingUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg text-muted-foreground">
                  Redirecting to your dashboard...
                </p>
              </motion.div>
            )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                description="Embedded wallets and decentralized identity management." 
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

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@/lib/auth";
import { useTudao } from "@/lib/tudao-context";
import generatedLogo from "@assets/generated_images/metallic_tudao_logo.png";

export default function ArchitectLogin() {
  const [, setLocation] = useLocation();
  const { user, authenticated, login } = usePrivy();
  const { setRole } = useTudao();
  const [isChecking, setIsChecking] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (authenticated && user?.walletAddress) {
        setIsChecking(true);
        try {
          const response = await fetch(`/api/auth/check-architect/${user.walletAddress}`);
          const data = await response.json();
          
          if (data.isAuthorized) {
            setIsAuthorized(true);
            // Set role and redirect to architect dashboard
            setRole("architect");
            setTimeout(() => {
              setLocation("/dashboard/architect");
            }, 1000);
          } else {
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error("Failed to check authorization:", error);
          setIsAuthorized(false);
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkAuthorization();
  }, [authenticated, user, setRole, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={generatedLogo} 
              alt="TUDAO Logo" 
              className="w-24 h-24 mx-auto mb-4 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              System Architect
            </h1>
            <p className="text-muted-foreground">
              Admin Dashboard Access
            </p>
          </div>

          <Card className="border-orange-500/20">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <CardTitle>Authorized Access Only</CardTitle>
                <CardDescription>
                  Connect your whitelisted wallet to continue
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {!authenticated && (
                <Button 
                  onClick={login}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                  data-testid="button-connect-wallet"
                >
                  Connect Wallet
                </Button>
              )}

              {isChecking && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Verifying authorization...</p>
                </div>
              )}

              {isAuthorized === true && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center"
                >
                  <p className="text-green-600 font-medium">✓ Access Granted</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirecting to dashboard...</p>
                </motion.div>
              )}

              {isAuthorized === false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-destructive">Unauthorized Wallet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This wallet address is not authorized for architect access.
                      </p>
                      {user?.walletAddress && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          {user.walletAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLocation("/")}
                  data-testid="button-back-home"
                >
                  ← Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

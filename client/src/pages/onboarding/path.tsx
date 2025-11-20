import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTudao } from "@/lib/tudao-context";
import { motion } from "framer-motion";
import { Briefcase, Users, ShieldCheck } from "lucide-react";
import generatedLogo from "@assets/generated_images/metallic_tudao_logo.png";

export default function OnboardingPath() {
  const [, setLocation] = useLocation();
  const { setRole } = useTudao();

  const handleSelect = (role: 'consumer' | 'provider' | 'nodeholder' | 'architect') => {
    setRole(role);
    
    // Simulate API call
    console.log(`Role set to: ${role}`);

    switch (role) {
      case "consumer":
        setLocation("/dashboard/consumer");
        break;
      case "provider":
        // In a real app, this would go to an onboarding form first
        setLocation("/dashboard/provider"); 
        break;
      case "nodeholder":
        setLocation("/dashboard/nodeholder");
        break;
      case "architect":
        setLocation("/dashboard/architect");
        break;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-20 bg-background text-foreground relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="h-16 w-16 bg-sidebar-primary/10 text-sidebar-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-6">
             <img src={generatedLogo} alt="TUDAO" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4 tracking-tight">Welcome to TUDAO</h1>
        <p className="text-xl text-muted-foreground">Choose how you want to use the platform.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">

        {/* Consumer */}
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card 
            className="h-full cursor-pointer hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10 group"
            onClick={() => handleSelect("consumer")}
          >
            <CardHeader className="space-y-4 text-center pt-8 pb-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                 <Users className="h-8 w-8 text-blue-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                  <CardTitle className="text-xl mb-2">Hire a Provider</CardTitle>
                  <CardDescription className="text-base">
                    I need help with a home or business service.
                  </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Provider */}
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            className="h-full cursor-pointer hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/10 group"
            onClick={() => handleSelect("provider")}
          >
            <CardHeader className="space-y-4 text-center pt-8 pb-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                 <Briefcase className="h-8 w-8 text-green-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                  <CardTitle className="text-xl mb-2">Become a Provider</CardTitle>
                  <CardDescription className="text-base">
                    I offer professional service work.
                  </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Nodeholder */}
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card 
            className="h-full cursor-pointer hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-500/10 group"
            onClick={() => handleSelect("nodeholder")}
          >
            <CardHeader className="space-y-4 text-center pt-8 pb-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                 <ShieldCheck className="h-8 w-8 text-purple-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                  <CardTitle className="text-xl mb-2">I Own a TUDAO Node</CardTitle>
                  <CardDescription className="text-base">
                    Access node statistics, rewards, and governance.
                  </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}

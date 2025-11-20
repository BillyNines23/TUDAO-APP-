import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PrivyProvider } from "@/lib/auth";
import { TudaoProvider } from "@/lib/tudao-context";

// Pages
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard/index";
import ProviderDashboard from "@/pages/dashboard/provider";
import ConsumerDashboard from "@/pages/dashboard/consumer";
import ConsumerRequest from "@/pages/dashboard/consumer/request";
import ConsumerProjects from "@/pages/dashboard/consumer/projects";
import ConsumerPayments from "@/pages/dashboard/consumer/payments";
import ConsumerMessages from "@/pages/dashboard/consumer/messages";
import ConsumerHistory from "@/pages/dashboard/consumer/history";
import NodeholderDashboard from "@/pages/dashboard/nodeholder";
import ArchitectDashboard from "@/pages/dashboard/architect";
import WalletPage from "@/pages/wallet";
import TransactionVerification from "@/pages/wallet/transactions";
import ScopePage from "@/pages/scope";
import BuyNodesPage from "@/pages/nodes/buy";
import OnboardingPath from "@/pages/onboarding/path";

function Router() {
  const [location] = useLocation();
  
  // Simple redirect check - in a real app this would be a ProtectedRoute component
  // But for mockup, we just let everything be accessible
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/onboarding/path" component={OnboardingPath} />
      
      {/* Role Routes */}
      <Route path="/dashboard/provider" component={ProviderDashboard} />
      <Route path="/dashboard/provider/*" component={ProviderDashboard} />
      
      <Route path="/dashboard/consumer" component={ConsumerDashboard} />
      <Route path="/dashboard/consumer/request" component={ConsumerRequest} />
      <Route path="/dashboard/consumer/projects" component={ConsumerProjects} />
      <Route path="/dashboard/consumer/payments" component={ConsumerPayments} />
      <Route path="/dashboard/consumer/messages" component={ConsumerMessages} />
      <Route path="/dashboard/consumer/history" component={ConsumerHistory} />
      
      <Route path="/dashboard/nodeholder" component={NodeholderDashboard} />
      <Route path="/dashboard/nodeholder/*" component={NodeholderDashboard} />
      
      <Route path="/dashboard/architect" component={ArchitectDashboard} />
      <Route path="/dashboard/architect/*" component={ArchitectDashboard} />
      
      {/* Feature Routes */}
      <Route path="/wallet" component={WalletPage} />
      <Route path="/wallet/transactions" component={TransactionVerification} />
      <Route path="/scope" component={ScopePage} />
      <Route path="/nodes/buy" component={BuyNodesPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <PrivyProvider
      appId="clp_test_123456789" // Placeholder App ID
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#0F172A',
          logo: 'https://pub-3a63e5a5356a47679940556fc2121b50.r2.dev/tudao-logo-placeholder.png', // Just a placeholder URL
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TudaoProvider>
            <TooltipProvider>
            <Toaster />
            <Router />
            </TooltipProvider>
        </TudaoProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default App;

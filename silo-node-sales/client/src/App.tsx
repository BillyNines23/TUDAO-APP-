import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TestModeBanner } from "@/components/test-mode-banner";
import LandingPage from "@/pages/landing";
import CheckoutPage from "@/pages/checkout";
import SuccessPage from "@/pages/success";
import DashboardPage from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/success" component={SuccessPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider>
        <TooltipProvider>
          <TestModeBanner />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}

export default App;

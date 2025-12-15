import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import NewSessionFlow from "@/pages/NewSessionFlow";
import TrainingDataManager from "@/pages/admin/TrainingDataManager";
import ProductionStandardsManager from "@/pages/admin/ProductionStandardsManager";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={NewSessionFlow} />
      <Route path="/legacy" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <TrainingDataManager />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/production-standards">
        <ProtectedRoute requireAdmin>
          <ProductionStandardsManager />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

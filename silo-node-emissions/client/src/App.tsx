import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Overview from "@/pages/overview";
import Nodes from "@/pages/nodes";
import Verification from "@/pages/verification";
import Emissions from "@/pages/emissions";
import Whales from "@/pages/whales";
import Governance from "@/pages/governance";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/nodes" component={Nodes} />
      <Route path="/verification" component={Verification} />
      <Route path="/emissions" component={Emissions} />
      <Route path="/whales" component={Whales} />
      <Route path="/governance" component={Governance} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background sticky top-0 z-10">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <div className="px-8 py-6 max-w-[1600px] mx-auto w-full">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

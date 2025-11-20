import { Home, Wallet, Monitor, ShoppingCart, Settings, Briefcase, DollarSign, Shield, Star, Search, FolderOpen, CreditCard, Server, Vault, Vote, Activity, BarChart, FileCheck, Eye, Cpu, ScrollText, MessageSquare, Clock, History } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useTudao } from "@/lib/tudao-context";
import { useLocation } from "wouter";
import generatedLogo from "@assets/generated_images/metallic_tudao_logo.png";

// Navigation items based on requirements
const commonNav = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Transactions", url: "/wallet/transactions", icon: ScrollText },
  { title: "Scope Agent", url: "/scope", icon: Monitor },
  { title: "Buy Nodes", url: "/nodes/buy", icon: ShoppingCart },
  { title: "Settings", url: "/settings", icon: Settings },
];

const roleNav = {
  provider: [
    { title: "My Jobs", url: "/dashboard/provider/jobs", icon: Briefcase },
    { title: "Earnings", url: "/dashboard/provider/earnings", icon: DollarSign },
    { title: "Escrow", url: "/dashboard/provider/escrow", icon: Shield },
    { title: "Ratings", url: "/dashboard/provider/ratings", icon: Star },
  ],
  consumer: [
    { title: "Request Service", url: "/dashboard/consumer/request", icon: Search },
    { title: "My Projects", url: "/dashboard/consumer/projects", icon: FolderOpen },
    { title: "Payments", url: "/dashboard/consumer/payments", icon: CreditCard },
    { title: "Messages", url: "/dashboard/consumer/messages", icon: MessageSquare },
    { title: "History", url: "/dashboard/consumer/history", icon: History },
  ],
  nodeholder: [
    { title: "My Nodes", url: "/dashboard/nodeholder/nodes", icon: Server },
    { title: "Rewards Vault", url: "/dashboard/nodeholder/rewards", icon: Vault },
    { title: "Governance", url: "/dashboard/nodeholder/governance", icon: Vote },
  ],
  architect: [
    { title: "Emissions", url: "/dashboard/architect/emissions", icon: Activity },
    { title: "Analytics", url: "/dashboard/architect/analytics", icon: BarChart },
    { title: "Verification", url: "/dashboard/architect/verification", icon: FileCheck },
    { title: "Whale Oversight", url: "/dashboard/architect/oversight", icon: Eye },
    { title: "System", url: "/dashboard/architect/system", icon: Cpu },
  ],
};

export function AppSidebar() {
  const { role, setRole } = useTudao();
  const [location, setLocation] = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-2 w-full">
            <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 bg-white/10 p-1">
             <img src={generatedLogo} alt="TUDAO" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:hidden">
                <span className="font-display font-bold tracking-wider text-lg leading-none">TUDAO</span>
                <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest truncate">Master Dashboard</span>
            </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    onClick={() => setLocation(item.url)}
                    tooltip={item.title}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-primary/20 transition-colors"
                  >
                    <a className="cursor-pointer">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-xs font-bold text-sidebar-foreground/40 mt-4">
            {role} Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {roleNav[role].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    onClick={() => setLocation(item.url)}
                    tooltip={item.title}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <a className="cursor-pointer">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        {/* Role Switcher for Demo */}
        <div className="group-data-[collapsible=icon]:hidden">
            <label className="text-xs text-sidebar-foreground/50 uppercase font-bold mb-2 block">Switch Role (Demo)</label>
            <select 
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded p-2 text-xs text-sidebar-foreground outline-none focus:border-sidebar-primary"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
            >
                <option value="provider">Provider</option>
                <option value="consumer">Consumer</option>
                <option value="nodeholder">Nodeholder</option>
                <option value="architect">Architect</option>
            </select>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

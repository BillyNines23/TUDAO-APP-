import { usePrivy } from "@privy-io/react-auth";
import { Bell, Menu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "wouter";

export function SiteHeader() {
  const { login, authenticated, user } = usePrivy();
  const [location] = useLocation();
  
  // Simple breadcrumb logic
  const pathSegments = location.split('/').filter(Boolean);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 sticky top-0 z-10 transition-all duration-200 ease-in-out">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/home">TUDAO</BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.map((segment, index) => (
            <div key={segment} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    {index === pathSegments.length - 1 ? (
                        <BreadcrumbPage className="capitalize font-medium text-foreground">{segment}</BreadcrumbPage>
                    ) : (
                        <BreadcrumbLink href={`/${segment}`} className="capitalize">{segment}</BreadcrumbLink>
                    )}
                </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={login}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wide shadow-lg shadow-primary/20"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {authenticated ? (
              <span className="max-w-[100px] truncate">{user?.wallet?.address || user?.email?.address || 'Connected'}</span>
          ) : (
              "Connect Wallet"
          )}
        </Button>
      </div>
    </header>
  );
}

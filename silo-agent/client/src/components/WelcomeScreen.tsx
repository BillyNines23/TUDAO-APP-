import { Button } from "@/components/ui/button";
import { ArrowRight, Settings } from "lucide-react";
import { Link } from "wouter";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="TUDAO Logo"
            className="h-20 w-20"
            data-testid="img-logo"
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            TradeUnion DAO
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Connecting with Verified, Skilled Workers — Powered by Smart Contracts
          </p>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            className="w-full max-w-xs h-12 text-base font-semibold"
            onClick={onGetStarted}
            data-testid="button-get-started"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      <Link href="/admin">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4"
          data-testid="button-admin"
        >
          <Settings className="h-4 w-4 mr-2" />
          Admin
        </Button>
      </Link>
    </div>
  );
}

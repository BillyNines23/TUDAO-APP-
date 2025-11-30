import { Badge } from "@/components/ui/badge";
import { Shield, Star, Crown } from "lucide-react";
import { FoundingTeamBadge } from "@/components/FoundingTeamBadge";
import type { TierName } from "@shared/schema";

interface TierBadgeProps {
  tier: TierName;
  size?: "sm" | "md" | "lg";
  foundingTeamRole?: "Architect" | "Regent" | "Councilor" | "Guardian" | "Oracle" | null;
}

export function TierBadge({ tier, size = "md", foundingTeamRole }: TierBadgeProps) {
  // If it's a founding team member, show their custom badge
  if (foundingTeamRole) {
    return <FoundingTeamBadge role={foundingTeamRole} size={size} />;
  }
  const configs = {
    Verifier: {
      icon: Shield,
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
    Professional: {
      icon: Star,
      className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    },
    Founder: {
      icon: Crown,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
  };

  const config = configs[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <Badge variant="outline" className={`${config.className} ${sizeClasses[size]} font-semibold uppercase tracking-wide`}>
      <Icon className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-1.5`} />
      {tier}
    </Badge>
  );
}

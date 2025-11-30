import { Star, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TierBadgeProps {
  tier: "Preferred" | "Standard" | "Probationary";
  className?: string;
}

export default function TierBadge({ tier, className }: TierBadgeProps) {
  const config = {
    Preferred: {
      icon: Star,
      variant: "default" as const,
      label: "Preferred Provider",
    },
    Standard: {
      icon: Shield,
      variant: "secondary" as const,
      label: "Standard Provider",
    },
    Probationary: {
      icon: Clock,
      variant: "outline" as const,
      label: "Probationary",
    },
  };

  const { icon: Icon, variant, label } = config[tier];

  return (
    <Badge variant={variant} className={className} data-testid={`badge-tier-${tier.toLowerCase()}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

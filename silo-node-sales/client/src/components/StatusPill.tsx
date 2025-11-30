import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface StatusPillProps {
  status: "active" | "pending_wire" | "refunded";
}

export function StatusPill({ status }: StatusPillProps) {
  const variants = {
    active: {
      icon: CheckCircle2,
      label: "Active",
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    },
    pending_wire: {
      icon: Clock,
      label: "Pending Wire",
      className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    },
    refunded: {
      icon: XCircle,
      label: "Refunded",
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={`${variant.className} font-medium uppercase tracking-wide text-xs`}>
      <Icon className="h-3 w-3 mr-1.5" />
      {variant.label}
    </Badge>
  );
}

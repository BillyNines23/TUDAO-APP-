import { Info } from "lucide-react";
import { config } from "@/lib/config";

export function ComplianceFooter() {
  return (
    <div className="border-t pt-6 mt-8">
      <div className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>{config.complianceText}</p>
      </div>
    </div>
  );
}

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isTestMode, getNetworkDisplayName } from "@/lib/config";

export function TestModeBanner() {
  if (!isTestMode) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-b-2 border-dashed border-yellow-500/50 bg-yellow-500/10">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
        <span className="font-semibold">TEST MODE</span> — Contracts on {getNetworkDisplayName()} • Card on-ramp disabled • No real funds accepted
      </AlertDescription>
    </Alert>
  );
}

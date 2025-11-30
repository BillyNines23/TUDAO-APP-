import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

interface Config {
  testMode: boolean;
  chainId: number;
  network: string;
}

export function TestModeBanner() {
  const { data: config } = useQuery<Config>({
    queryKey: ["/api/config"],
  });

  if (!config?.testMode) {
    return null;
  }

  return (
    <div 
      className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center font-medium text-sm border-b border-yellow-600 flex items-center justify-center gap-2"
      data-testid="banner-test-mode"
    >
      <AlertTriangle className="w-4 h-4" />
      <span>
        🧪 TEST MODE ACTIVE - Using {config.network} (No real money will be charged)
      </span>
      <AlertTriangle className="w-4 h-4" />
    </div>
  );
}

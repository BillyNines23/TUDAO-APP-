import { AlertTriangle, Info, XCircle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  type: "info" | "warning" | "error" | "success";
  message: string;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
}

const alertConfig = {
  info: {
    icon: Info,
    className: "bg-blue-50 border-l-blue-500 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100",
    iconClassName: "text-blue-500"
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-50 border-l-amber-500 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
    iconClassName: "text-amber-500"
  },
  error: {
    icon: XCircle,
    className: "bg-red-50 border-l-red-500 text-red-900 dark:bg-red-950/30 dark:text-red-100",
    iconClassName: "text-red-500"
  },
  success: {
    icon: CheckCircle,
    className: "bg-green-50 border-l-green-500 text-green-900 dark:bg-green-950/30 dark:text-green-100",
    iconClassName: "text-green-500"
  }
};

export function AlertBanner({ type, message, onDismiss, className, testId }: AlertBannerProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "flex items-center gap-4 px-6 py-4 border-l-4 rounded-md",
        config.className,
        className
      )}
      role="alert"
      data-testid={testId}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", config.iconClassName)} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 flex-shrink-0"
          onClick={onDismiss}
          data-testid={`${testId}-dismiss`}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

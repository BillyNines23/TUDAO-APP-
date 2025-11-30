import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  className?: string;
  testId?: string;
}

export function KPICard({ title, value, subtitle, trend, icon, className, testId }: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-600 dark:text-green-500";
    if (trend.value < 0) return "text-red-600 dark:text-red-500";
    return "text-muted-foreground";
  };

  return (
    <Card className={cn("p-6 hover-elevate", className)} data-testid={testId}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      
      <div className="space-y-2">
        <p className="text-3xl font-bold font-mono" data-testid={`${testId}-value`}>
          {value}
        </p>
        
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        
        {trend && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-xs text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface StatusBadgeProps {
  status: "green" | "amber" | "red" | "active" | "pending" | "completed" | "failed";
  label?: string;
  className?: string;
  testId?: string;
}

const statusConfig = {
  green: {
    label: "Online",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    dotClassName: "fill-green-600 dark:fill-green-400"
  },
  amber: {
    label: "Warning",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    dotClassName: "fill-amber-600 dark:fill-amber-400"
  },
  red: {
    label: "Offline",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    dotClassName: "fill-red-600 dark:fill-red-400"
  },
  active: {
    label: "Active",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    dotClassName: "fill-blue-600 dark:fill-blue-400"
  },
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
    dotClassName: "fill-gray-600 dark:fill-gray-400"
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    dotClassName: "fill-green-600 dark:fill-green-400"
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    dotClassName: "fill-red-600 dark:fill-red-400"
  }
};

export function StatusBadge({ status, label, className, testId }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn("gap-1.5 font-medium border", config.className, className)}
      data-testid={testId}
    >
      <Circle className={cn("w-2 h-2", config.dotClassName)} />
      {label || config.label}
    </Badge>
  );
}

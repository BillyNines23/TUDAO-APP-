import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatusCardProps {
  status: "draft" | "submitted" | "needs_revision" | "approved" | "denied" | "suspended";
  tier?: "Preferred" | "Standard" | "Probationary";
  submittedDate?: string;
  reviewedDate?: string;
}

export default function StatusCard({ status, tier, submittedDate, reviewedDate }: StatusCardProps) {
  const statusConfig = {
    draft: {
      icon: Clock,
      label: "Draft",
      description: "Complete all steps to submit your application",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    submitted: {
      icon: Clock,
      label: "Under Review",
      description: "Your application is being reviewed by our team",
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    needs_revision: {
      icon: AlertCircle,
      label: "Needs Revision",
      description: "Please review and update the requested information",
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    approved: {
      icon: CheckCircle,
      label: "Approved",
      description: "Welcome to the TUDAO marketplace!",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    denied: {
      icon: XCircle,
      label: "Denied",
      description: "Your application was not approved at this time",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    suspended: {
      icon: AlertCircle,
      label: "Suspended",
      description: "Your account has been temporarily suspended",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card data-testid="card-application-status">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">Application Status</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <div className={`p-3 rounded-md ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-3 py-1" data-testid="badge-status">
            {config.label}
          </Badge>
          {tier && (
            <Badge variant="secondary" className="text-base px-3 py-1">
              {tier}
            </Badge>
          )}
        </div>
        {submittedDate && (
          <div className="text-sm">
            <span className="text-muted-foreground">Submitted: </span>
            <span className="font-medium">{submittedDate}</span>
          </div>
        )}
        {reviewedDate && (
          <div className="text-sm">
            <span className="text-muted-foreground">Reviewed: </span>
            <span className="font-medium">{reviewedDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

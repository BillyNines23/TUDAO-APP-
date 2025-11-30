import { ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConstitutionCardProps {
  version?: string;
  lastUpdated?: string;
}

export default function ConstitutionCard({ version = "v2.1", lastUpdated = "March 15, 2025" }: ConstitutionCardProps) {
  return (
    <Card data-testid="card-constitution">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">TUDAO Constitution</CardTitle>
              <CardDescription>Governance framework and policy guidelines</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Version</span>
          <span className="font-mono font-medium">{version}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last Updated</span>
          <span className="font-medium">{lastUpdated}</span>
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => window.open("https://tudao.org/constitution", "_blank")}
          data-testid="button-view-constitution"
        >
          View Current Version
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

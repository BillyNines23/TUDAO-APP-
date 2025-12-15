import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Hammer, HelpCircle } from "lucide-react";

interface IntentClassificationScreenProps {
  onSelectIntent: (intent: "service" | "installation") => void;
  suggestedIntent?: "service" | "installation" | "unclear";
  confidence?: number;
  reasoning?: string;
}

export default function IntentClassificationScreen({
  onSelectIntent,
  suggestedIntent,
  confidence,
  reasoning,
}: IntentClassificationScreenProps) {
  const showSuggestion = suggestedIntent && suggestedIntent !== "unclear" && (confidence || 0) > 0.6;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold" data-testid="text-intent-heading">
            What type of work do you need?
          </h1>
          <p className="text-muted-foreground" data-testid="text-intent-subtitle">
            This helps us ask the right questions and match you with the perfect professional
          </p>
        </div>

        {showSuggestion && (
          <Card className="p-4 border-primary/50">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium" data-testid="text-ai-suggestion">
                  AI Suggestion: This looks like {suggestedIntent === "service" ? "maintenance or repair" : "a new installation"}
                </p>
                {reasoning && (
                  <p className="text-sm text-muted-foreground" data-testid="text-ai-reasoning">
                    {reasoning}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={`p-6 hover-elevate active-elevate-2 cursor-pointer transition-all ${
              showSuggestion && suggestedIntent === "service" ? "border-primary" : ""
            }`}
            onClick={() => onSelectIntent("service")}
            data-testid="card-intent-service"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold" data-testid="text-service-title">
                  Fix / Maintain
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-service-description">
                  Repair, service, or maintain what you already have
                </p>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p data-testid="text-service-examples">Examples:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Mow lawn weekly</li>
                  <li>Fix leaky faucet</li>
                  <li>Clean gutters</li>
                  <li>Repair fence boards</li>
                  <li>HVAC maintenance</li>
                </ul>
              </div>
              <Button
                className="w-full"
                variant={showSuggestion && suggestedIntent === "service" ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIntent("service");
                }}
                data-testid="button-select-service"
              >
                Select Service/Repair
              </Button>
            </div>
          </Card>

          <Card
            className={`p-6 hover-elevate active-elevate-2 cursor-pointer transition-all ${
              showSuggestion && suggestedIntent === "installation" ? "border-primary" : ""
            }`}
            onClick={() => onSelectIntent("installation")}
            data-testid="card-intent-installation"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10">
                <Hammer className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold" data-testid="text-installation-title">
                  Add / Install
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-installation-description">
                  Install, replace, or build something new
                </p>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p data-testid="text-installation-examples">Examples:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Install new sod</li>
                  <li>Replace front door</li>
                  <li>Build new deck</li>
                  <li>Landscape backyard</li>
                  <li>Add irrigation system</li>
                </ul>
              </div>
              <Button
                className="w-full"
                variant={showSuggestion && suggestedIntent === "installation" ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIntent("installation");
                }}
                data-testid="button-select-installation"
              >
                Select Installation/New
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

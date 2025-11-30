import AppShell from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Monitor, Sparkles } from "lucide-react";

export default function RequestService() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold">Request Service</h1>
            <p className="text-muted-foreground">Describe your needs and let our AI Scope Agent build your project plan.</p>
        </div>

        <Card className="border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    Scope Agent Wizard
                </CardTitle>
                <CardDescription>
                    Provide details about the work you need done.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="description">Project Description</Label>
                    <Textarea 
                        id="description" 
                        placeholder="I need a plumber to fix a leaking pipe under my kitchen sink..." 
                        className="min-h-[120px] resize-y"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Photos / Attachments</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:bg-muted/50 transition-colors cursor-pointer text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="font-medium">Click to upload or drag and drop</span>
                            <span className="text-xs">JPG, PNG up to 10MB</span>
                        </div>
                    </div>
                </div>

                <Button size="lg" className="w-full font-display text-base h-12 gap-2 shadow-primary/25 shadow-lg hover:shadow-primary/40 transition-all">
                    <Sparkles className="h-4 w-4" />
                    Launch Scope Agent
                </Button>
            </CardContent>
        </Card>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
            <p>Not sure where to start? <a href="#" className="text-primary underline underline-offset-4">Browse Service Catalog</a></p>
        </div>
      </div>
    </AppShell>
  );
}

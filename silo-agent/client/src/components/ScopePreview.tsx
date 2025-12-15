import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit3, RotateCcw, Clock, UserCheck, Package, Wrench, AlertTriangle, CheckCircle2, Camera } from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";

interface LineItem {
  item: string;
  qty: number;
  unit: string;
  notes?: string;
  vendor_verify?: boolean;
}

interface Material {
  name: string;
  qty: number;
  unit: string;
  notes?: string;
}

interface Labor {
  role: string;
  hours: number;
}

interface Permit {
  required: boolean;
  note: string;
}

interface Disposal {
  required: boolean;
  notes: string;
}

interface NarrativeScope {
  existingConditions: string;
  projectDescription: string;
  scopeOfWork: string[];
}

interface StructuredScope {
  summary: string;
  narrative?: NarrativeScope;
  line_items?: LineItem[];
  materials?: Material[];
  labor?: Labor[];
  permits?: Permit[];
  disposal?: Disposal;
  acceptance_criteria?: string[];
  photos_required_after?: string[];
  clarifications?: string[];
  diagnostics?: {
    detected_service?: string;
    detected_issues?: string[];
    confidence_overall?: number;
    data_sources_used?: string[];
  };
}

interface ScopePreviewProps {
  scope: string;
  structuredScope?: StructuredScope | null;
  isUrgent?: boolean;
  urgentFeePercent?: number;
  recommendedProviderType?: string | null;
  onAccept: () => void;
  onEdit: () => void;
  onStartOver: () => void;
}

export default function ScopePreview({ 
  scope, 
  structuredScope,
  isUrgent = false,
  urgentFeePercent = 25,
  recommendedProviderType,
  onAccept, 
  onEdit, 
  onStartOver 
}: ScopePreviewProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="TUDAO"
            className="h-12 w-12"
            data-testid="img-logo-small"
          />
        </div>

        <ProgressTracker currentStep={5} totalSteps={8} />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Here's your AI-generated job scope
            </h2>
            <p className="text-sm text-muted-foreground">
              Based on your details
            </p>
          </div>

          <Card className="border-2 p-6 space-y-4">
            {isUrgent && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-orange-500/10 border border-orange-500/20">
                <Clock className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Urgent Request</p>
                  <p className="text-xs text-muted-foreground">
                    +{urgentFeePercent}% fee will be added to final cost
                  </p>
                </div>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 dark:text-orange-300">
                  +{urgentFeePercent}%
                </Badge>
              </div>
            )}
            {recommendedProviderType && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20">
                <UserCheck className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Recommended Provider</p>
                  <p className="text-xs text-muted-foreground">
                    {recommendedProviderType}
                  </p>
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Summary</h3>
              <p className="text-base leading-relaxed text-foreground" data-testid="text-scope">
                {structuredScope?.summary || scope}
              </p>
            </div>

            {/* Narrative Scope Sections - Dispute Prevention */}
            {structuredScope?.narrative && structuredScope.narrative.existingConditions && structuredScope.narrative.projectDescription && Array.isArray(structuredScope.narrative.scopeOfWork) && structuredScope.narrative.scopeOfWork.length > 0 && (
              <>
                {/* Existing Conditions */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-foreground">Existing Conditions</h3>
                  <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap" data-testid="text-existing-conditions">
                    {structuredScope.narrative.existingConditions}
                  </p>
                </div>

                {/* Project Description */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-foreground">Description of Project</h3>
                  <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap" data-testid="text-project-description">
                    {structuredScope.narrative.projectDescription}
                  </p>
                </div>

                {/* Scope of Work */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Scope of Work</h3>
                  </div>
                  <ul className="space-y-2">
                    {structuredScope.narrative.scopeOfWork.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-base text-foreground" data-testid={`sow-step-${i}`}>
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold mt-0.5">
                          {i + 1}
                        </span>
                        <span className="flex-1 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Line Items */}
            {structuredScope?.line_items && structuredScope.line_items.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Line Items</h3>
                </div>
                <div className="space-y-2">
                  {structuredScope.line_items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/50" data-testid={`line-item-${i}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.item}</span>
                          {item.vendor_verify && (
                            <Badge variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Verify
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.qty} {item.unit}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {structuredScope?.materials && structuredScope.materials.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Materials</h3>
                </div>
                <div className="space-y-2">
                  {structuredScope.materials.map((material, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/50" data-testid={`material-${i}`}>
                      <div className="flex-1">
                        <span className="font-medium">{material.name}</span>
                        {material.notes && (
                          <p className="text-sm text-muted-foreground">{material.notes}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {material.qty} {material.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labor */}
            {structuredScope?.labor && structuredScope.labor.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Labor</h3>
                </div>
                <div className="space-y-2">
                  {structuredScope.labor.map((labor, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/50" data-testid={`labor-${i}`}>
                      <span className="font-medium">{labor.role}</span>
                      <span className="text-sm text-muted-foreground">{labor.hours} hours</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permits */}
            {structuredScope?.permits && structuredScope.permits.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Permits & Regulations</h3>
                </div>
                <div className="space-y-2">
                  {structuredScope.permits.map((permit, i) => (
                    <div key={i} className="p-3 rounded-md bg-muted/50" data-testid={`permit-${i}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={permit.required ? "default" : "outline"}>
                          {permit.required ? "Required" : "Not Required"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{permit.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acceptance Criteria */}
            {structuredScope?.acceptance_criteria && structuredScope.acceptance_criteria.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Acceptance Criteria</h3>
                </div>
                <ul className="space-y-2">
                  {structuredScope.acceptance_criteria.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground" data-testid={`criterion-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Photos Required After */}
            {structuredScope?.photos_required_after && structuredScope.photos_required_after.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Photos Required After Completion</h3>
                </div>
                <ul className="space-y-1">
                  {structuredScope.photos_required_after.map((photo, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground" data-testid={`photo-required-${i}`}>
                      <Camera className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{photo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clarifications */}
            {structuredScope?.clarifications && structuredScope.clarifications.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Clarification Needed</p>
                    {structuredScope.clarifications.map((clarification, i) => (
                      <p key={i} className="text-xs text-muted-foreground mt-1">{clarification}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold"
              onClick={onAccept}
              data-testid="button-accept-scope"
            >
              Accept Scope
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onEdit}
                data-testid="button-edit-scope"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Scope
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onStartOver}
                data-testid="button-start-over"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

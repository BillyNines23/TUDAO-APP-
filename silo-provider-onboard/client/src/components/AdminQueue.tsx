import { useState } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import TierBadge from "./TierBadge";
import RiskScoreMeter from "./RiskScoreMeter";

interface Application {
  id: string;
  legalName: string;
  submittedDate: string;
  status: string;
  tier?: "Preferred" | "Standard" | "Probationary";
  riskScore: number;
  trades: string[];
  regions: string[];
  flags: Array<{ type: string; severity: string }>;
}

//todo: remove mock functionality
const MOCK_APPLICATIONS: Application[] = [
  {
    id: "APP-001",
    legalName: "ABC Plumbing Services LLC",
    submittedDate: "2025-10-28",
    status: "submitted",
    riskScore: 15,
    trades: ["Plumbing", "HVAC"],
    regions: ["CA", "NV"],
    flags: [],
  },
  {
    id: "APP-002",
    legalName: "Premier Electrical Co",
    submittedDate: "2025-10-29",
    status: "submitted",
    riskScore: 45,
    trades: ["Electrical"],
    regions: ["NY", "NJ", "CT"],
    flags: [{ type: "expiring_insurance", severity: "warning" }],
  },
  {
    id: "APP-003",
    legalName: "Best Roofing Inc",
    submittedDate: "2025-10-30",
    status: "submitted",
    riskScore: 72,
    trades: ["Roofing"],
    regions: ["TX", "OK"],
    flags: [{ type: "mismatch_name", severity: "error" }, { type: "duplicate_ein", severity: "warning" }],
  },
];

export default function AdminQueue() {
  const [applications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [decision, setDecision] = useState("");
  const [comments, setComments] = useState("");

  const handleApprove = (tier: "Preferred" | "Standard" | "Probationary") => {
    console.log(`Approved ${selectedApp?.id} as ${tier}:`, comments);
    setDecision("");
    setComments("");
  };

  const handleDeny = () => {
    console.log(`Denied ${selectedApp?.id}:`, comments);
    setDecision("");
    setComments("");
  };

  const handleRequestRevision = () => {
    console.log(`Requested revision for ${selectedApp?.id}:`, comments);
    setDecision("");
    setComments("");
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = app.legalName.toLowerCase().includes(searchTerm.toLowerCase()) || app.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Provider Review Queue</h1>
              <p className="text-muted-foreground mt-1">Review and process provider applications</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredApplications.length} Applications</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Name or ID..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-applications"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="needs_revision">Needs Revision</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {filteredApplications.map((app) => (
                <Card
                  key={app.id}
                  className={`cursor-pointer hover-elevate ${selectedApp?.id === app.id ? "border-primary" : ""}`}
                  onClick={() => setSelectedApp(app)}
                  data-testid={`card-application-${app.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium truncate">{app.legalName}</p>
                        <p className="text-xs text-muted-foreground">{app.id}</p>
                      </div>
                      {app.riskScore <= 20 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Low Risk
                        </Badge>
                      )}
                      {app.riskScore > 20 && app.riskScore <= 60 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          Med Risk
                        </Badge>
                      )}
                      {app.riskScore > 60 && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          High Risk
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{app.trades.join(", ")}</span>
                      <span>•</span>
                      <span>{app.regions.join(", ")}</span>
                    </div>
                    {app.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.flags.map((flag, idx) => (
                          <Badge key={idx} variant={flag.severity === "error" ? "destructive" : "secondary"} className="text-xs">
                            {flag.type.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedApp ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedApp.legalName}</CardTitle>
                      <CardDescription>{selectedApp.id} • Submitted {selectedApp.submittedDate}</CardDescription>
                    </div>
                    <Badge variant="secondary">Submitted</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                      <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                      <TabsTrigger value="legal" data-testid="tab-legal">Legal</TabsTrigger>
                      <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium mb-3">Business Information</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Legal Name:</span>
                              <span className="font-medium">{selectedApp.legalName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">EIN:</span>
                              <span className="font-medium font-mono">**-***6789</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Entity Type:</span>
                              <span className="font-medium">LLC</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Founded:</span>
                              <span className="font-medium">2018</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-3">Risk Assessment</h3>
                          <RiskScoreMeter score={selectedApp.riskScore} />
                          {selectedApp.flags.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">Flags</p>
                              {selectedApp.flags.map((flag, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <AlertCircle className={`w-4 h-4 ${flag.severity === "error" ? "text-red-500" : "text-amber-500"}`} />
                                  <span>{flag.type.replace(/_/g, " ")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-3">Service Details</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground block mb-1">Trades</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedApp.trades.map((trade) => (
                                <Badge key={trade} variant="secondary">
                                  {trade}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Service Regions</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedApp.regions.map((region) => (
                                <Badge key={region} variant="secondary">
                                  {region}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="font-medium mb-3">Review Decision</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="comments">Comments / Reasons</Label>
                            <Textarea
                              id="comments"
                              placeholder="Add notes about your decision..."
                              rows={4}
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              data-testid="textarea-review-comments"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => handleApprove("Standard")} data-testid="button-approve-standard">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve as Standard
                            </Button>
                            <Button variant="outline" onClick={() => handleApprove("Probationary")} data-testid="button-approve-probationary">
                              Approve as Probationary
                            </Button>
                            <Button variant="outline" onClick={handleRequestRevision} data-testid="button-request-revision">
                              Request Revision
                            </Button>
                            <Button variant="destructive" onClick={handleDeny} data-testid="button-deny">
                              <XCircle className="w-4 h-4 mr-2" />
                              Deny
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4">
                      <div className="grid gap-3">
                        {["EIN Letter", "Trade License", "Insurance COI", "Owner ID"].map((doc) => (
                          <div key={doc} className="flex items-center justify-between p-4 border rounded-md">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{doc}</p>
                                <p className="text-xs text-muted-foreground">Uploaded Oct 28, 2025</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" data-testid={`button-view-${doc.toLowerCase().replace(/\s+/g, '-')}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="legal">
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-green-900 dark:text-green-100">MPA Signed (v2.1)</p>
                              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Signed on October 28, 2025 at 2:34 PM EST
                              </p>
                              <p className="text-xs font-mono text-green-600 dark:text-green-400 mt-2">
                                IP: 192.168.1.1 • Wallet: 0x742d35Cc...f0bEb
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="history">
                      <div className="space-y-3">
                        <div className="flex gap-3 p-3 border-l-2 border-primary">
                          <div className="text-xs text-muted-foreground whitespace-nowrap">Oct 28, 2:34 PM</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Application Submitted</p>
                            <p className="text-xs text-muted-foreground">Automatic verification checks initiated</p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-3 border-l-2 border-border">
                          <div className="text-xs text-muted-foreground whitespace-nowrap">Oct 28, 2:35 PM</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Auto-Checks Completed</p>
                            <p className="text-xs text-muted-foreground">Risk score: {selectedApp.riskScore}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center">
                  <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No Application Selected</p>
                  <p className="text-muted-foreground">Select an application from the list to review</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Database, TrendingUp, Award, Plus, Trash2, Edit, Upload, FileImage, Link as LinkIcon, RefreshCw, X, CheckCircle2, FileText, Wand2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface CompletedJob {
  id: string;
  serviceType: string;
  serviceDescription: string;
  originalScope: string;
  providerType?: string;
  actualManHours?: number;
  actualCost?: number;
  materialsUsed?: string;
  customerRating?: number;
  notes?: string;
  completedAt?: string;
}

export default function TrainingDataManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("browse");
  
  // Fetch completed jobs (training data)
  const { data, isLoading } = useQuery<CompletedJob[]>({
    queryKey: ["/api/completed-jobs"],
  });

  // Ensure jobs is always an array
  const jobs = Array.isArray(data) ? data : [];

  // Stats
  const stats = {
    total: jobs.length,
    withRatings: jobs.filter(j => j.customerRating && j.customerRating >= 4).length,
    serviceTypes: new Set(jobs.map(j => j.serviceType)).size,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-training-manager">Training Data Manager</h1>
          <p className="text-muted-foreground">
            Manage the AI's knowledge base. Every completed job teaches the AI to make better estimates.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" data-testid="button-back-to-scope">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scope Agent
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Training Examples</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-jobs">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Completed jobs in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Quality</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-high-quality">{stats.withRatings}</div>
            <p className="text-xs text-muted-foreground">Jobs rated 4+ stars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Types Covered</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-service-types">{stats.serviceTypes}</div>
            <p className="text-xs text-muted-foreground">Unique categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse" data-testid="tab-browse">Browse Data</TabsTrigger>
          <TabsTrigger value="paste" data-testid="tab-paste">Paste Proposal</TabsTrigger>
          <TabsTrigger value="add" data-testid="tab-add">Add Training Example</TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">Generate Questions</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Browse Training Data */}
        <TabsContent value="browse" className="space-y-4">
          <BrowseJobs jobs={jobs} isLoading={isLoading} />
        </TabsContent>

        {/* Paste Proposal */}
        <TabsContent value="paste">
          <PasteProposal />
        </TabsContent>

        {/* Add Manual Training Example */}
        <TabsContent value="add">
          <AddTrainingExample />
        </TabsContent>

        {/* Generate Questions from Guide */}
        <TabsContent value="questions">
          <GenerateQuestionsFromGuide />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <AnalyticsView jobs={jobs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Browse completed jobs component
function BrowseJobs({ jobs, isLoading }: { jobs: CompletedJob[]; isLoading: boolean }) {
  const [filterService, setFilterService] = useState<string>("all");
  
  const serviceTypes = ["all", ...Array.from(new Set(jobs.map(j => j.serviceType)))];
  
  const filteredJobs = filterService === "all" 
    ? jobs 
    : jobs.filter(j => j.serviceType === filterService);

  if (isLoading) {
    return <div className="text-center py-8">Loading training data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label>Filter by Service Type:</Label>
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-service">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {serviceTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === "all" ? "All Services" : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredJobs.length} results</Badge>
      </div>

      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        
        {filteredJobs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No training data found. Complete jobs or add manual examples to train the AI.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Individual job card
function JobCard({ job }: { job: CompletedJob }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover-elevate" data-testid={`job-card-${job.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{job.serviceType}</CardTitle>
            <CardDescription className="mt-1">{job.serviceDescription}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {job.customerRating && (
              <Badge variant="secondary">
                ⭐ {job.customerRating}/5
              </Badge>
            )}
            {job.providerType && (
              <Badge variant="outline">{job.providerType}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-3 border-t pt-4">
          <div>
            <Label className="text-sm font-semibold">Scope Generated:</Label>
            <p className="text-sm text-muted-foreground mt-1">{job.originalScope}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {job.actualManHours && (
              <div>
                <Label>Hours:</Label>
                <p className="font-medium">{job.actualManHours} hrs</p>
              </div>
            )}
            {job.actualCost && (
              <div>
                <Label>Cost:</Label>
                <p className="font-medium">${(job.actualCost / 100).toFixed(2)}</p>
              </div>
            )}
            {job.materialsUsed && (
              <div className="col-span-2">
                <Label>Materials Used:</Label>
                <p className="font-medium">{job.materialsUsed}</p>
              </div>
            )}
          </div>

          {job.notes && (
            <div>
              <Label>Notes:</Label>
              <p className="text-sm text-muted-foreground mt-1">{job.notes}</p>
            </div>
          )}
        </CardContent>
      )}
      
      <div className="px-6 pb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`button-toggle-${job.id}`}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      </div>
    </Card>
  );
}

// Paste Proposal Component
function PasteProposal() {
  const { toast } = useToast();
  const [proposalText, setProposalText] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);

  const parseMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/parse-proposal-text", { proposalText: text });
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setParsedData(data);
      toast({
        title: "Proposal parsed successfully!",
        description: "Review the extracted data below, then save it as training data.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to parse proposal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert actualCost from dollars to cents
      const actualCostCents = data.actualCost !== null && data.actualCost !== undefined
        ? Math.round(Number(data.actualCost) * 100)
        : null;
      
      const payload = {
        sessionId: `admin-${Date.now()}`,
        serviceType: data.serviceType || null,
        serviceDescription: data.serviceDescription || null,
        originalScope: data.originalScope || null,
        providerType: data.providerType || null,
        actualManHours: data.actualManHours !== null && data.actualManHours !== undefined ? Number(data.actualManHours) : null,
        actualCost: actualCostCents,
        materialsUsed: data.materialsUsed || null,
        customerRating: data.customerRating !== null && data.customerRating !== undefined ? Number(data.customerRating) : null,
        notes: data.notes || null,
        dataSource: 'admin_seed',
        isTrainingExample: 1,
      };
      
      return apiRequest("POST", "/api/completed-jobs", payload);
    },
    onSuccess: () => {
      toast({
        title: "Training data saved!",
        description: "The AI will now use this data to improve future estimates.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/completed-jobs"] });
      setProposalText("");
      setParsedData(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save training data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleParse = () => {
    if (!proposalText.trim()) {
      toast({
        title: "No proposal text",
        description: "Please paste a proposal before parsing.",
        variant: "destructive",
      });
      return;
    }
    parseMutation.mutate(proposalText);
  };

  const handleSave = () => {
    if (!parsedData) return;
    saveMutation.mutate(parsedData);
  };

  const handleClear = () => {
    setProposalText("");
    setParsedData(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paste Historical Proposal</CardTitle>
        <CardDescription>
          Paste any proposal or invoice text (from emails, documents, etc.) and AI will extract the training data automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="proposal-text">Proposal Text</Label>
          <Textarea
            id="proposal-text"
            data-testid="textarea-proposal"
            placeholder="Paste your proposal here. Example:

Regency Centers: Gayton Crossing 90079
Property
Address: 9782 Gayton Road
Scope: Clean up vacancy entrance area. Scrape stickers off wall remove birds nest. Prep and paint / seal peeling areas
Service Type: Handyman
Materials: cleaning supplies and paint - $70.00
Labor: 1 tech @ 4 hours @ $55.00/hr = $220.00
Total: $290.00"
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            disabled={parseMutation.isPending}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleParse}
            disabled={parseMutation.isPending || !proposalText.trim()}
            data-testid="button-parse-proposal"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {parseMutation.isPending ? "Parsing..." : "Parse with AI"}
          </Button>
          {(parsedData || proposalText) && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={parseMutation.isPending}
              data-testid="button-clear"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {parsedData && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Extracted Data
              </h3>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-training-data"
              >
                {saveMutation.isPending ? "Saving..." : "Save as Training Data"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Service Type</Label>
                <p className="font-medium mt-1" data-testid="text-extracted-service-type">{parsedData.serviceType || "—"}</p>
              </div>
              <div>
                <Label>Provider Type</Label>
                <p className="font-medium mt-1" data-testid="text-extracted-provider-type">{parsedData.providerType || "—"}</p>
              </div>
              <div>
                <Label>Labor Hours</Label>
                <p className="font-medium mt-1" data-testid="text-extracted-hours">{parsedData.actualManHours || "—"}</p>
              </div>
              <div>
                <Label>Total Cost</Label>
                <p className="font-medium mt-1" data-testid="text-extracted-cost">${parsedData.actualCost || "—"}</p>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <p className="font-medium mt-1 text-muted-foreground" data-testid="text-extracted-description">{parsedData.serviceDescription || "—"}</p>
              </div>
              <div className="col-span-2">
                <Label>Scope</Label>
                <p className="font-medium mt-1 text-muted-foreground" data-testid="text-extracted-scope">{parsedData.originalScope || "—"}</p>
              </div>
              {parsedData.materialsUsed && (
                <div className="col-span-2">
                  <Label>Materials Used</Label>
                  <p className="font-medium mt-1 text-muted-foreground" data-testid="text-extracted-materials">{parsedData.materialsUsed}</p>
                </div>
              )}
              {parsedData.notes && (
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <p className="font-medium mt-1 text-muted-foreground" data-testid="text-extracted-notes">{parsedData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// QuickBooks Connection Component
function QuickBooksConnection() {
  const { toast } = useToast();

  // Fetch QuickBooks connection status
  const { data: qbStatus, isLoading: qbLoading } = useQuery<{
    configured: boolean;
    connected: boolean;
    companyName?: string;
    lastSyncAt?: string;
  }>({
    queryKey: ["/api/quickbooks/status"],
  });

  // Initiate OAuth
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/quickbooks/auth");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      // Open QuickBooks OAuth in popup
      window.open(data.authUrl, 'QuickBooks OAuth', 'width=800,height=600');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to connect",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync invoices
  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/quickbooks/sync"),
    onSuccess: (data: any) => {
      toast({
        title: "Sync completed!",
        description: `Imported ${data.imported} invoices as training data.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/completed-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect QuickBooks
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/quickbooks/disconnect"),
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "QuickBooks has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disconnect",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (qbLoading) {
    return <div className="mb-6 p-4 border rounded-lg">Loading QuickBooks status...</div>;
  }

  if (!qbStatus?.configured) {
    return (
      <div className="mb-6 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">QuickBooks Integration</h3>
          <Badge variant="outline">Not Configured</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          QuickBooks API credentials not configured. Please add QB_CLIENT_ID, QB_CLIENT_SECRET, and QB_REDIRECT_URI to environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          <h3 className="font-semibold">QuickBooks Integration</h3>
          {qbStatus?.connected && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
        {qbStatus?.connected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            data-testid="button-qb-disconnect"
          >
            <X className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        )}
      </div>

      {!qbStatus?.connected ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your QuickBooks account to automatically import paid invoices as training data for the AI.
          </p>
          <Button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            data-testid="button-qb-connect"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            {connectMutation.isPending ? "Connecting..." : "Connect QuickBooks"}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {qbStatus.companyName && (
              <p className="text-sm">
                <span className="font-medium">Company:</span> {qbStatus.companyName}
              </p>
            )}
            {qbStatus.lastSyncAt && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Last Sync:</span>{" "}
                {new Date(qbStatus.lastSyncAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-qb-sync"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync Invoices"}
          </Button>
        </>
      )}
    </div>
  );
}

// Add manual training example form
function AddTrainingExample() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    serviceType: "",
    serviceDescription: "",
    originalScope: "",
    providerType: "",
    actualManHours: "",
    actualCost: "",
    materialsUsed: "",
    customerRating: "5",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceParsed, setInvoiceParsed] = useState(false);

  const parseInvoiceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("invoice", file);
      
      const response = await fetch("/api/parse-invoice", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse invoice");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Validate and normalize extracted data with locale-agnostic parsing
      const normalizeNumber = (val: any): string => {
        if (val === null || val === undefined || val === "") return "";
        
        // Remove currency symbols and trim
        let str = String(val)
          .replace(/[$€£¥₹]/g, '')
          .trim();
        
        // Count separators
        const periodCount = (str.match(/\./g) || []).length;
        const commaCount = (str.match(/,/g) || []).length;
        const lastComma = str.lastIndexOf(',');
        const lastPeriod = str.lastIndexOf('.');
        
        // Special case: Single separator followed by exactly 3 digits = thousands separator
        // Examples: "1.234" (EU), "2,500" (US/EU), "12.345" (EU)
        if (periodCount === 1 && commaCount === 0 && /\.\d{3}$/.test(str)) {
          // Single period with exactly 3 trailing digits = EU thousands
          str = str.replace('.', '');
        } else if (commaCount === 1 && periodCount === 0 && /,\d{3}$/.test(str)) {
          // Single comma with exactly 3 trailing digits = thousands
          str = str.replace(',', '');
        } else if (lastComma > lastPeriod) {
          // European format: 1.250,50 or 1 250,50
          // Period and space are thousands separators, comma is decimal
          str = str.replace(/[\s.]/g, '').replace(',', '.');
        } else if (lastPeriod > lastComma) {
          // US format: 1,250.50 or 1 250.50
          // Comma and space are thousands separators, period is decimal
          str = str.replace(/[\s,]/g, '');
        } else {
          // No separator or only spaces: 1250 or 1 250
          str = str.replace(/\s/g, '');
        }
        
        const num = parseFloat(str);
        return isNaN(num) || num < 0 ? "" : String(num);
      };

      const normalizeRating = (val: any): string => {
        if (val === null || val === undefined) return "5";
        let cleaned = String(val).replace(/[^\d]/g, ''); // Keep only digits
        const num = parseInt(cleaned);
        if (isNaN(num) || num < 1 || num > 5) return "5";
        return String(num);
      };

      // Auto-populate form with validated and normalized data
      setFormData({
        serviceType: data.serviceType?.trim() || "",
        serviceDescription: data.serviceDescription?.trim() || "",
        originalScope: data.originalScope?.trim() || "",
        providerType: data.providerType?.trim() || "",
        actualManHours: normalizeNumber(data.actualManHours),
        actualCost: normalizeNumber(data.actualCost),
        materialsUsed: data.materialsUsed?.trim() || "",
        customerRating: normalizeRating(data.customerRating),
        notes: data.notes?.trim() || "",
      });
      setInvoiceParsed(true);
      toast({
        title: "Invoice parsed successfully!",
        description: "Review the extracted data below, then click 'Add Extracted Data' to save.",
      });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to parse invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadInvoice = () => {
    if (selectedFile) {
      parseInvoiceMutation.mutate(selectedFile);
    }
  };

  const addJobMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/completed-jobs", {
        ...data,
        sessionId: `admin-${Date.now()}`,
        actualManHours: data.actualManHours ? parseInt(data.actualManHours) : null,
        actualCost: data.actualCost ? parseInt(data.actualCost) * 100 : null,
        customerRating: parseInt(data.customerRating),
      });
    },
    onSuccess: () => {
      toast({
        title: "Training example added",
        description: "The AI will now use this data to improve future estimates.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/completed-jobs"] });
      // Reset form
      setFormData({
        serviceType: "",
        serviceDescription: "",
        originalScope: "",
        providerType: "",
        actualManHours: "",
        actualCost: "",
        materialsUsed: "",
        customerRating: "5",
        notes: "",
      });
      setInvoiceParsed(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJobMutation.mutate(formData);
  };

  const handleSubmitExtractedData = () => {
    // Submit whatever data was extracted without form validation
    addJobMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Training Example</CardTitle>
        <CardDescription>
          Upload an invoice to auto-extract data, or manually add production ratios and example jobs to train the AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* QuickBooks Integration */}
        <QuickBooksConnection />

        {/* Invoice Upload Section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-3">
            <FileImage className="h-5 w-5" />
            <h3 className="font-semibold">Upload Invoice or Proposal</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload any document type: images, PDFs, Excel spreadsheets, Word docs, or text files. AI will extract whatever details are available.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*,.pdf,.xlsx,.xls,.docx,.doc,.txt,.csv,.ods,.odt"
                onChange={handleFileSelect}
                data-testid="input-invoice-upload"
                disabled={parseInvoiceMutation.isPending}
              />
            </div>
            <Button
              type="button"
              onClick={handleUploadInvoice}
              disabled={!selectedFile || parseInvoiceMutation.isPending}
              data-testid="button-parse-invoice"
            >
              <Upload className="mr-2 h-4 w-4" />
              {parseInvoiceMutation.isPending ? "Parsing..." : "Parse Document"}
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedFile.name}
            </p>
          )}
          
          {invoiceParsed && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium mb-3">
                Data extracted! Review the details below, or add directly:
              </p>
              <Button
                type="button"
                onClick={handleSubmitExtractedData}
                disabled={addJobMutation.isPending}
                data-testid="button-add-extracted"
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addJobMutation.isPending ? "Adding..." : "Add Extracted Data"}
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {invoiceParsed ? "Review and adjust extracted data" : "Or enter manually"}
            </span>
          </div>
        </div>

        {/* Manual Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Type *</Label>
              <Input
                required
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g., Plumbing, Landscaping, HVAC"
                data-testid="input-service-type"
              />
            </div>
            <div>
              <Label>Provider Type *</Label>
              <Input
                required
                value={formData.providerType}
                onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
                placeholder="e.g., Licensed Plumber"
                data-testid="input-provider-type"
              />
            </div>
          </div>

          <div>
            <Label>Service Description *</Label>
            <Textarea
              required
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              placeholder="Describe the customer's request..."
              data-testid="textarea-description"
            />
          </div>

          <div>
            <Label>Scope of Work *</Label>
            <Textarea
              required
              value={formData.originalScope}
              onChange={(e) => setFormData({ ...formData, originalScope: e.target.value })}
              placeholder="Professional scope that would be generated..."
              data-testid="textarea-scope"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Hours (Est. or Actual)</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.actualManHours}
                onChange={(e) => setFormData({ ...formData, actualManHours: e.target.value })}
                placeholder="2.5"
                data-testid="input-hours"
              />
            </div>
            <div>
              <Label>Cost ($) (Est. or Actual)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                placeholder="175.00"
                data-testid="input-cost"
              />
            </div>
            <div>
              <Label>Rating (1-5)</Label>
              <Select 
                value={formData.customerRating} 
                onValueChange={(val) => setFormData({ ...formData, customerRating: val })}
              >
                <SelectTrigger data-testid="select-rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                  <SelectItem value="2">⭐⭐ (2)</SelectItem>
                  <SelectItem value="1">⭐ (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Materials Used</Label>
            <Input
              value={formData.materialsUsed}
              onChange={(e) => setFormData({ ...formData, materialsUsed: e.target.value })}
              placeholder="e.g., Faucet cartridge, plumber's tape, O-rings"
              data-testid="input-materials"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional context or lessons learned..."
              data-testid="textarea-notes"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={addJobMutation.isPending}
            data-testid="button-submit-training"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addJobMutation.isPending ? "Adding..." : "Add Training Example"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Analytics view
function AnalyticsView({ jobs }: { jobs: CompletedJob[] }) {
  // Group by service type
  const byServiceType = jobs.reduce((acc, job) => {
    const type = job.serviceType || "Unknown";
    if (!acc[type]) acc[type] = [];
    acc[type].push(job);
    return acc;
  }, {} as Record<string, CompletedJob[]>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress by Service Type</CardTitle>
          <CardDescription>
            The more completed jobs per service type, the better the AI's estimates become.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(byServiceType)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([type, typeJobs]) => {
                const avgRating = typeJobs
                  .filter(j => j.customerRating)
                  .reduce((sum, j) => sum + (j.customerRating || 0), 0) / 
                  (typeJobs.filter(j => j.customerRating).length || 1);

                return (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">{type}</p>
                      <p className="text-sm text-muted-foreground">
                        {typeJobs.length} completed {typeJobs.length === 1 ? "job" : "jobs"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {avgRating > 0 && (
                        <Badge variant="secondary">
                          Avg: ⭐ {avgRating.toFixed(1)}
                        </Badge>
                      )}
                      <div className="text-2xl font-bold text-primary">
                        {typeJobs.length}
                      </div>
                    </div>
                  </div>
                );
              })}

            {Object.keys(byServiceType).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No data yet. Add training examples to start tracking analytics.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-md">
              <p className="text-3xl font-bold">{jobs.filter(j => j.actualManHours).length}</p>
              <p className="text-sm text-muted-foreground">Jobs with time data</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <p className="text-3xl font-bold">{jobs.filter(j => j.actualCost).length}</p>
              <p className="text-sm text-muted-foreground">Jobs with cost data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate Questions from Guide component
function GenerateQuestionsFromGuide() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const parseGuideMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("guide", file);
      
      const response = await fetch("/api/parse-guide", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse guide");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setParsedQuestions(data);
      toast({
        title: "Guide Parsed Successfully!",
        description: `Extracted ${data.questions?.length || 0} questions from the guide.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Parsing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParsedQuestions(null);
    }
  };

  const handleParseGuide = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a troubleshooting guide to parse.",
        variant: "destructive",
      });
      return;
    }
    parseGuideMutation.mutate(selectedFile);
  };

  const handleSaveQuestions = async () => {
    if (!parsedQuestions?.questions) return;

    setIsSaving(true);
    try {
      const questionsToSave = parsedQuestions.questions.map((q: any, index: number) => ({
        serviceType: parsedQuestions.serviceType,
        subcategory: parsedQuestions.subcategory || null,
        questionText: q.questionText,
        responseType: q.responseType,
        options: q.options || null,
        requiredForScope: q.requiredForScope ?? 1,
        conditionalTag: q.conditionalTag || null,
        sequence: q.sequence || index + 1,
      }));

      const response: any = await apiRequest("POST", "/api/service-questions/bulk", { questions: questionsToSave });

      toast({
        title: "Questions Saved!",
        description: `Successfully added ${response.count} questions to the database.`,
      });

      setParsedQuestions(null);
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save questions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setParsedQuestions(null);
    setSelectedFile(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Wand2 className="h-6 w-6 text-primary mt-1" />
          <div className="flex-1">
            <CardTitle>Generate Questions from Troubleshooting Guide</CardTitle>
            <CardDescription className="mt-2">
              Upload a troubleshooting guide, service manual, or diagnostic flowchart. The AI will extract the diagnostic decision tree and convert it into service-specific questions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!parsedQuestions ? (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="guide-upload">Upload Troubleshooting Guide</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Supports: Images (PNG, JPG), Word docs, Excel files, text files
                </p>
                <div className="flex gap-2">
                  <Input
                    id="guide-upload"
                    type="file"
                    accept="image/*,.docx,.doc,.xlsx,.xls,.txt,.csv"
                    onChange={handleFileChange}
                    data-testid="input-guide-upload"
                  />
                  <Button
                    onClick={handleParseGuide}
                    disabled={!selectedFile || parseGuideMutation.isPending}
                    data-testid="button-parse-guide"
                  >
                    {parseGuideMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Parse Guide
                      </>
                    )}
                  </Button>
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="bg-muted p-4 rounded-md space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  How It Works
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>AI analyzes the guide using GPT-4o Vision (images) or GPT-4o (text/docs)</li>
                  <li>Extracts diagnostic decision trees and troubleshooting flows</li>
                  <li>Converts technical jargon into customer-friendly questions</li>
                  <li>Preserves conditional logic ("If answer contains X, then ask Y")</li>
                  <li>Preview and edit before saving to database</li>
                  <li><strong>Tip:</strong> For best results with PDFs, convert to PNG/JPG first</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Extracted Questions</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>Service Type:</span>
                    <Badge variant="secondary">{parsedQuestions.serviceType}</Badge>
                    {parsedQuestions.subcategory && (
                      <>
                        <span>|</span>
                        <span>Subcategory:</span>
                        <Badge variant="outline">{parsedQuestions.subcategory}</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset} data-testid="button-reset">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveQuestions} 
                    disabled={isSaving}
                    data-testid="button-save-questions"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save {parsedQuestions.questions.length} Questions
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto border rounded-md p-4">
                {parsedQuestions.questions.map((q: any, index: number) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          Q{q.sequence || index + 1}
                        </Badge>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">{q.questionText}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {q.responseType === "choice" ? "Multiple Choice" : "Text Input"}
                            </Badge>
                            {q.requiredForScope === 1 && (
                              <Badge variant="default">Required</Badge>
                            )}
                            {q.conditionalTag && (
                              <Badge variant="outline">
                                Conditional: {q.conditionalTag}
                              </Badge>
                            )}
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Options: {q.options.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

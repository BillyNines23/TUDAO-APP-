import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Database, Upload, TrendingUp } from "lucide-react";

const productionDataSchema = z.object({
  serviceType: z.string().min(1, "Service type is required"),
  providerType: z.string().optional(),
  serviceDescription: z.string().min(10, "Description must be at least 10 characters"),
  actualManHours: z.coerce.number().min(0.1, "Man hours must be positive"),
  actualCost: z.coerce.number().min(1, "Cost must be positive"),
  materialsUsed: z.string().optional(),
  notes: z.string().optional(),
});

type ProductionDataForm = z.infer<typeof productionDataSchema>;

const commonServiceTypes = [
  "Fence Repair",
  "Fence Installation",
  "Landscaping",
  "Plumbing",
  "Electrical",
  "Painting",
  "Roofing",
  "HVAC",
  "Tile Work",
  "Carpentry",
  "Concrete",
  "Drywall",
  "Other",
];

const providerTypes = [
  "Handyman",
  "Licensed Plumber",
  "Licensed Electrician",
  "Licensed HVAC Technician",
  "General Contractor",
  "Roofer",
  "Landscaper",
  "Painter",
  "Carpenter",
  "Tile Specialist",
  "Concrete Specialist",
  "Other Specialist",
];

export default function Admin() {
  const { toast } = useToast();
  const [customServiceType, setCustomServiceType] = useState(false);

  const form = useForm<ProductionDataForm>({
    resolver: zodResolver(productionDataSchema),
    defaultValues: {
      serviceType: "",
      providerType: "",
      serviceDescription: "",
      actualManHours: 0,
      actualCost: 0,
      materialsUsed: "",
      notes: "",
    },
  });

  // Fetch completed jobs count
  const { data: jobsData } = useQuery<{ count: number }>({
    queryKey: ["/api/completed-jobs/count"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: ProductionDataForm) => {
      return await apiRequest("POST", "/api/completed-jobs", {
        sessionId: "manual-entry",
        serviceType: data.serviceType,
        serviceDescription: data.serviceDescription,
        originalScope: `Manual production data entry: ${data.serviceDescription}`,
        providerType: data.providerType || null,
        actualManHours: data.actualManHours,
        actualCost: data.actualCost,
        materialsUsed: data.materialsUsed || null,
        notes: data.notes || null,
        customerRating: null,
        vendorId: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/completed-jobs/count"] });
      toast({
        title: "Production data uploaded",
        description: "The AI will now use this data when generating scopes.",
      });
      form.reset();
      setCustomServiceType(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductionDataForm) => {
    uploadMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin - RAG Training</h1>
            <p className="text-muted-foreground">
              Upload production ratios to train the AI
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Training Data
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobsData?.count ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                jobs in the knowledge base
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Learning Status
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">
                AI is learning from completed jobs
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Production Data
            </CardTitle>
            <CardDescription>
              Enter actual job data to improve AI scope accuracy. The more data you add,
              the smarter the AI becomes at estimating similar jobs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <FormControl>
                        {!customServiceType ? (
                          <div className="space-y-2">
                            <Select
                              onValueChange={(value) => {
                                if (value === "custom") {
                                  setCustomServiceType(true);
                                  field.onChange("");
                                } else {
                                  field.onChange(value);
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger data-testid="select-service-type">
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                              <SelectContent>
                                {commonServiceTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">
                                  + Custom Service Type
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter custom service type"
                              {...field}
                              data-testid="input-custom-service-type"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setCustomServiceType(false);
                                field.onChange("");
                              }}
                              data-testid="button-cancel-custom"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </FormControl>
                      <FormDescription>
                        The category of work performed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="providerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Type (Optional)</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger data-testid="select-provider-type">
                            <SelectValue placeholder="Select provider type" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Type of provider who completed this work
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., Replace 50 linear feet of cedar fence boards with two 4x4 posts"
                          rows={3}
                          {...field}
                          data-testid="textarea-job-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed description of the work performed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="actualManHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Man Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="12"
                            {...field}
                            data-testid="input-man-hours"
                          />
                        </FormControl>
                        <FormDescription>
                          Total labor hours spent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actualCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cost ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="950"
                            {...field}
                            data-testid="input-cost"
                          />
                        </FormControl>
                        <FormDescription>
                          Total project cost
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="materialsUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materials Used (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cedar boards, concrete, hardware"
                          {...field}
                          data-testid="input-materials"
                        />
                      </FormControl>
                      <FormDescription>
                        List of materials and quantities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., 5-man crew completed in 2.5 days, difficult terrain added 20% time"
                          rows={2}
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormDescription>
                        Additional context about crew size, productivity, challenges
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadMutation.isPending}
                  data-testid="button-submit-production-data"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Production Data"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How RAG Training Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Manual Upload:</strong> Enter production
              ratios here to seed the AI with industry knowledge.
            </p>
            <p>
              <strong className="text-foreground">Automatic Learning:</strong> When customers
              accept scopes and jobs are completed, the system automatically saves actual outcomes
              to train the AI.
            </p>
            <p>
              <strong className="text-foreground">Smart Matching:</strong> When generating new
              scopes, the AI searches for similar past jobs and uses their actual costs/time to
              make better estimates.
            </p>
            <p>
              <strong className="text-foreground">Continuous Improvement:</strong> The more jobs
              you complete, the more accurate the AI becomes for your specific market and crews.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

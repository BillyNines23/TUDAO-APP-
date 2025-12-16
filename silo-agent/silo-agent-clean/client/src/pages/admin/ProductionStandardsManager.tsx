import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Plus, Pencil, Trash2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { ProductionStandard } from "@shared/schema";

export default function ProductionStandardsManager() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<ProductionStandard | null>(null);
  const [formData, setFormData] = useState({
    serviceType: "",
    subcategory: "",
    itemDescription: "",
    unitOfMeasure: "linear_feet",
    laborHoursPerUnit: "",
    materialCostPerUnit: "",
    notes: "",
  });

  // Fetch all production standards
  const { data: standards = [], isLoading } = useQuery<ProductionStandard[]>({
    queryKey: ["/api/production-standards"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/production-standards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-standards"] });
      toast({ title: "Production standard created successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/production-standards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-standards"] });
      toast({ title: "Production standard updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/production-standards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-standards"] });
      toast({ title: "Production standard deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      serviceType: "",
      subcategory: "",
      itemDescription: "",
      unitOfMeasure: "linear_feet",
      laborHoursPerUnit: "",
      materialCostPerUnit: "",
      notes: "",
    });
    setEditingStandard(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      serviceType: formData.serviceType,
      subcategory: formData.subcategory || null,
      itemDescription: formData.itemDescription,
      unitOfMeasure: formData.unitOfMeasure,
      laborHoursPerUnit: formData.laborHoursPerUnit ? parseFloat(formData.laborHoursPerUnit) : null,
      materialCostPerUnit: formData.materialCostPerUnit ? parseInt(formData.materialCostPerUnit) : null,
      notes: formData.notes || null,
    };

    if (editingStandard) {
      updateMutation.mutate({ id: editingStandard.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (standard: ProductionStandard) => {
    setEditingStandard(standard);
    setFormData({
      serviceType: standard.serviceType,
      subcategory: standard.subcategory || "",
      itemDescription: standard.itemDescription,
      unitOfMeasure: standard.unitOfMeasure,
      laborHoursPerUnit: standard.laborHoursPerUnit?.toString() || "",
      materialCostPerUnit: standard.materialCostPerUnit?.toString() || "",
      notes: standard.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this production standard?")) {
      deleteMutation.mutate(id);
    }
  };

  // Excel/CSV Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Process each row
        let imported = 0;
        jsonData.forEach((row) => {
          if (row.serviceType && row.itemDescription && row.unitOfMeasure) {
            createMutation.mutate({
              serviceType: row.serviceType,
              subcategory: row.subcategory || null,
              itemDescription: row.itemDescription,
              unitOfMeasure: row.unitOfMeasure,
              laborHoursPerUnit: row.laborHoursPerUnit ? parseFloat(row.laborHoursPerUnit) : null,
              materialCostPerUnit: row.materialCostPerUnit ? parseInt(row.materialCostPerUnit) : null,
              notes: row.notes || null,
              source: "uploaded",
            });
            imported++;
          }
        });

        toast({ title: `Imported ${imported} production standards` });
      } catch (error) {
        toast({
          title: "Error importing file",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = standards.map((std) => ({
      serviceType: std.serviceType,
      subcategory: std.subcategory || "",
      itemDescription: std.itemDescription,
      unitOfMeasure: std.unitOfMeasure,
      laborHoursPerUnit: std.laborHoursPerUnit || "",
      materialCostPerUnit: std.materialCostPerUnit ? std.materialCostPerUnit / 100 : "",
      notes: std.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production Standards");
    XLSX.writeFile(wb, "production_standards.xlsx");
    
    toast({ title: "Exported production standards" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card data-testid="card-production-standards">
        <CardHeader>
          <CardTitle>Production Standards Manager</CardTitle>
          <CardDescription>
            Upload and manage production ratios for accurate time and cost estimation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setIsFormOpen(!isFormOpen)}
              data-testid="button-new-standard"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Standard
            </Button>
            
            <div className="relative">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="input-file-import"
              />
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Excel/CSV
              </Button>
            </div>

            <Button onClick={handleExport} variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>

          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle>{editingStandard ? "Edit" : "New"} Production Standard</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceType">Service Type *</Label>
                      <Input
                        id="serviceType"
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        placeholder="e.g., Landscaping, HVAC"
                        required
                        data-testid="input-service-type"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Input
                        id="subcategory"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        placeholder="e.g., Fence Installation"
                        data-testid="input-subcategory"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="itemDescription">Item Description *</Label>
                    <Input
                      id="itemDescription"
                      value={formData.itemDescription}
                      onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                      placeholder="e.g., Vinyl fence 6ft privacy"
                      required
                      data-testid="input-item-description"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                      <Select
                        value={formData.unitOfMeasure}
                        onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}
                      >
                        <SelectTrigger data-testid="select-unit-of-measure">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear_feet">Linear Feet</SelectItem>
                          <SelectItem value="square_feet">Square Feet</SelectItem>
                          <SelectItem value="each">Each</SelectItem>
                          <SelectItem value="hour">Hour</SelectItem>
                          <SelectItem value="square_yard">Square Yard</SelectItem>
                          <SelectItem value="cubic_yard">Cubic Yard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="laborHoursPerUnit">Labor Hours/Unit</Label>
                      <Input
                        id="laborHoursPerUnit"
                        type="number"
                        step="0.01"
                        value={formData.laborHoursPerUnit}
                        onChange={(e) => setFormData({ ...formData, laborHoursPerUnit: e.target.value })}
                        placeholder="e.g., 0.125 (8 ft/hr)"
                        data-testid="input-labor-hours"
                      />
                    </div>
                    <div>
                      <Label htmlFor="materialCostPerUnit">Material Cost/Unit (cents)</Label>
                      <Input
                        id="materialCostPerUnit"
                        type="number"
                        value={formData.materialCostPerUnit}
                        onChange={(e) => setFormData({ ...formData, materialCostPerUnit: e.target.value })}
                        placeholder="e.g., 1500 ($15.00)"
                        data-testid="input-material-cost"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional context"
                      data-testid="input-notes"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingStandard ? "Update" : "Create"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Labor Hrs/Unit</TableHead>
                  <TableHead>Material $/Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No production standards found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  standards.map((standard) => (
                    <TableRow key={standard.id} data-testid={`row-standard-${standard.id}`}>
                      <TableCell>{standard.serviceType}</TableCell>
                      <TableCell>{standard.subcategory || "-"}</TableCell>
                      <TableCell>{standard.itemDescription}</TableCell>
                      <TableCell>{standard.unitOfMeasure.replace("_", " ")}</TableCell>
                      <TableCell>{standard.laborHoursPerUnit || "-"}</TableCell>
                      <TableCell>
                        {standard.materialCostPerUnit ? `$${(standard.materialCostPerUnit / 100).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(standard)}
                            data-testid={`button-edit-${standard.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(standard.id)}
                            data-testid={`button-delete-${standard.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Manual Entry:</strong> Click "New Standard" to add production ratios one at a time.</p>
          <p><strong>Excel Import:</strong> Upload an Excel/CSV file with columns: serviceType, subcategory, itemDescription, unitOfMeasure, laborHoursPerUnit, materialCostPerUnit, notes.</p>
          <p><strong>Example:</strong> For vinyl fence installation at 8 linear feet per hour with $15/ft material cost, enter laborHoursPerUnit = 0.125 (1/8) and materialCostPerUnit = 1500 (cents).</p>
        </CardContent>
      </Card>
    </div>
  );
}

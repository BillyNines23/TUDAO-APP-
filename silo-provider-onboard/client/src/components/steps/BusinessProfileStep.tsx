import { useState } from "react";
import { Building2, MapPin, Wrench, X, Search, ChevronDown, ChevronRight, Home, Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SERVICE_CATEGORIES } from "@shared/trades-categories";

interface BusinessProfileStepProps {
  onNext?: (data: any) => void;
  onBack?: () => void;
}

const ENTITY_TYPES = ["LLC", "Corporation", "Sole Proprietorship", "Partnership"];

export default function BusinessProfileStep({ onNext, onBack }: BusinessProfileStepProps) {
  const [legalName, setLegalName] = useState("");
  const [dba, setDba] = useState("");
  const [ein, setEin] = useState("");
  const [entityType, setEntityType] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [zipCodeInput, setZipCodeInput] = useState("");
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [tradeSearch, setTradeSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string>("");

  const toggleTrade = (trade: string) => {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const filteredCategories = SERVICE_CATEGORIES.map((category) => ({
    ...category,
    subcategories: category.subcategories.filter((sub) =>
      sub.toLowerCase().includes(tradeSearch.toLowerCase())
    ),
  })).filter((category) => category.subcategories.length > 0);

  const handleZipCodeInput = (value: string) => {
    setZipCodeInput(value);
    // Parse zip codes from input (comma or newline separated)
    const parsed = value
      .split(/[,\n]+/)
      .map((zip) => zip.trim())
      .filter((zip) => /^\d{5}$/.test(zip)); // Only valid 5-digit zips
    setZipCodes(Array.from(new Set(parsed))); // Remove duplicates
  };

  const removeZipCode = (zipToRemove: string) => {
    const updated = zipCodes.filter((z) => z !== zipToRemove);
    setZipCodes(updated);
    setZipCodeInput(updated.join(", "));
  };

  const handleSubmit = () => {
    if (legalName && ein && entityType && phone && email && selectedTrades.length && zipCodes.length && propertyTypes) {
      const data = {
        legalName,
        dba,
        ein,
        entityType,
        foundedYear,
        phone,
        email,
        website,
        trades: selectedTrades,
        serviceZipCodes: zipCodes,
        propertyTypes,
      };
      onNext?.(data);
      console.log("Business profile completed:", data);
    }
  };

  const canProceed = legalName && ein && entityType && phone && email && selectedTrades.length > 0 && zipCodes.length > 0 && propertyTypes;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Business Profile</h2>
        <p className="text-muted-foreground">Tell us about your business and service areas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Information
          </CardTitle>
          <CardDescription>Official business details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legal-name">Legal Business Name *</Label>
              <Input
                id="legal-name"
                placeholder="ABC Services LLC"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                data-testid="input-legal-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dba">DBA (Doing Business As)</Label>
              <Input
                id="dba"
                placeholder="Optional"
                value={dba}
                onChange={(e) => setDba(e.target.value)}
                data-testid="input-dba"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ein">EIN (Employer ID Number) *</Label>
              <Input
                id="ein"
                placeholder="12-3456789"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                data-testid="input-ein"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-type">Entity Type *</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger id="entity-type" data-testid="select-entity-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="founded-year">Founded Year</Label>
              <Input
                id="founded-year"
                type="number"
                placeholder="2020"
                value={foundedYear}
                onChange={(e) => setFoundedYear(e.target.value)}
                data-testid="input-founded-year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Support Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="support@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-business-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourcompany.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                data-testid="input-website"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Property Types Serviced
          </CardTitle>
          <CardDescription>What types of properties do you service?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={propertyTypes} onValueChange={setPropertyTypes} data-testid="radiogroup-property-types">
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 border rounded-md p-4 hover-elevate cursor-pointer">
                <RadioGroupItem value="residential" id="property-residential" data-testid="radio-residential" />
                <Label htmlFor="property-residential" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Residential Only</div>
                      <div className="text-sm text-muted-foreground">Single-family homes, apartments, condos</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-md p-4 hover-elevate cursor-pointer">
                <RadioGroupItem value="commercial" id="property-commercial" data-testid="radio-commercial" />
                <Label htmlFor="property-commercial" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Commercial Only</div>
                      <div className="text-sm text-muted-foreground">Office buildings, retail spaces, industrial facilities</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-md p-4 hover-elevate cursor-pointer">
                <RadioGroupItem value="both" id="property-both" data-testid="radio-both" />
                <Label htmlFor="property-both" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Home className="w-4 h-4 text-muted-foreground" />
                      <Building className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">Both Residential & Commercial</div>
                      <div className="text-sm text-muted-foreground">Service all property types</div>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Trades & Specialties
          </CardTitle>
          <CardDescription>Select all services your business provides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trade-search">Search Services</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="trade-search"
                placeholder="Search for a service..."
                className="pl-9"
                value={tradeSearch}
                onChange={(e) => setTradeSearch(e.target.value)}
                data-testid="input-trade-search"
              />
            </div>
          </div>

          <div className="border rounded-md max-h-96 overflow-y-auto">
            {filteredCategories.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategories.includes(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 border-b">
                  <span className="font-medium text-sm">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {category.subcategories.filter((sub) => selectedTrades.includes(sub)).length}/
                      {category.subcategories.length}
                    </Badge>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.subcategories.map((trade) => (
                      <div key={trade} className="flex items-center gap-2">
                        <Checkbox
                          id={`trade-${trade}`}
                          checked={selectedTrades.includes(trade)}
                          onCheckedChange={() => toggleTrade(trade)}
                          data-testid={`checkbox-trade-${trade.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <label htmlFor={`trade-${trade}`} className="text-sm cursor-pointer">
                          {trade}
                        </label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {selectedTrades.length > 0 && (
            <div>
              <Label className="text-sm mb-2 block">Selected Services ({selectedTrades.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTrades.map((trade) => (
                  <Badge key={trade} variant="secondary" className="pl-3 pr-1" data-testid={`badge-trade-${trade.toLowerCase().replace(/\s+/g, '-')}`}>
                    {trade}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1 hover:bg-transparent"
                      onClick={() => toggleTrade(trade)}
                      data-testid={`button-remove-trade-${trade.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Service Regions
          </CardTitle>
          <CardDescription>Enter the zip codes where you provide services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zip-codes">Service Zip Codes *</Label>
            <Textarea
              id="zip-codes"
              placeholder="Enter zip codes separated by commas or new lines&#10;Example: 90210, 90211, 90212"
              rows={4}
              value={zipCodeInput}
              onChange={(e) => handleZipCodeInput(e.target.value)}
              data-testid="textarea-zip-codes"
            />
            <p className="text-xs text-muted-foreground">
              Enter 5-digit zip codes where you offer services. Separate multiple codes with commas or new lines.
            </p>
          </div>

          {zipCodes.length > 0 && (
            <div>
              <Label className="text-sm mb-2 block">Valid Zip Codes ({zipCodes.length})</Label>
              <div className="flex flex-wrap gap-2">
                {zipCodes.map((zip) => (
                  <Badge key={zip} variant="secondary" className="pl-3 pr-1" data-testid={`badge-zip-${zip}`}>
                    {zip}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1 hover:bg-transparent"
                      onClick={() => removeZipCode(zip)}
                      data-testid={`button-remove-zip-${zip}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back-business">
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!canProceed} size="lg" data-testid="button-next-business">
          Continue to Documents
        </Button>
      </div>
    </div>
  );
}

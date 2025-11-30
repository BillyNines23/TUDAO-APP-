import { useState } from "react";
import { Users, Wrench, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CapabilitiesStepProps {
  onNext?: (data: any) => void;
  onBack?: () => void;
}

export default function CapabilitiesStep({ onNext, onBack }: CapabilitiesStepProps) {
  const [crewSize, setCrewSize] = useState("");
  const [equipment, setEquipment] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [hourlyRateMin, setHourlyRateMin] = useState("");
  const [hourlyRateMax, setHourlyRateMax] = useState("");

  const handleSubmit = () => {
    const data = {
      crewSize: parseInt(crewSize) || 0,
      equipment: equipment.split("\n").filter((e) => e.trim()),
      responseTime,
      emergencyAvailable,
      hourlyRate: { min: parseInt(hourlyRateMin) || 0, max: parseInt(hourlyRateMax) || 0 },
    };
    onNext?.(data);
    console.log("Capabilities completed:", data);
  };

  const canProceed = crewSize && equipment && responseTime;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Capabilities & Capacity</h2>
        <p className="text-muted-foreground">
          Help us understand your operational capacity and service capabilities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team & Resources
          </CardTitle>
          <CardDescription>Information about your team size and equipment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crew-size">Typical Crew Size *</Label>
            <Input
              id="crew-size"
              type="number"
              placeholder="5"
              value={crewSize}
              onChange={(e) => setCrewSize(e.target.value)}
              data-testid="input-crew-size"
            />
            <p className="text-xs text-muted-foreground">Average number of team members per job</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment & Tools *</Label>
            <Textarea
              id="equipment"
              placeholder="List your key equipment (one per line)&#10;Example:&#10;- Excavator&#10;- Dump truck&#10;- Power tools"
              rows={6}
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              data-testid="textarea-equipment"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Response & Availability
          </CardTitle>
          <CardDescription>Your typical response times and emergency availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="response-time">Typical Response Time *</Label>
            <Select value={responseTime} onValueChange={setResponseTime}>
              <SelectTrigger id="response-time" data-testid="select-response-time">
                <SelectValue placeholder="Select response time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="same-day">Same Day</SelectItem>
                <SelectItem value="24-hours">Within 24 Hours</SelectItem>
                <SelectItem value="48-hours">Within 48 Hours</SelectItem>
                <SelectItem value="3-5-days">3-5 Business Days</SelectItem>
                <SelectItem value="1-week">Within 1 Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-md">
            <Checkbox
              id="emergency"
              checked={emergencyAvailable}
              onCheckedChange={(checked) => setEmergencyAvailable(checked as boolean)}
              data-testid="checkbox-emergency"
            />
            <label htmlFor="emergency" className="text-sm cursor-pointer flex-1">
              Available for emergency/after-hours service
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Pricing Information
          </CardTitle>
          <CardDescription>Internal use only - not shown to customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate-min">Minimum Hourly Rate ($)</Label>
              <Input
                id="rate-min"
                type="number"
                placeholder="75"
                value={hourlyRateMin}
                onChange={(e) => setHourlyRateMin(e.target.value)}
                data-testid="input-rate-min"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-max">Maximum Hourly Rate ($)</Label>
              <Input
                id="rate-max"
                type="number"
                placeholder="150"
                value={hourlyRateMax}
                onChange={(e) => setHourlyRateMax(e.target.value)}
                data-testid="input-rate-max"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This information is for internal matching and not visible to customers
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back-capabilities">
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!canProceed} size="lg" data-testid="button-next-capabilities">
          Continue to Payout Setup
        </Button>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic, Loader2, Camera, X, Clock } from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";

interface ServiceInputScreenProps {
  onSubmit: (description: string, photos: File[], isUrgent: boolean) => void;
  isProcessing?: boolean;
}

export default function ServiceInputScreen({ onSubmit, isProcessing = false }: ServiceInputScreenProps) {
  const [description, setDescription] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (description.trim()) {
      onSubmit(description, selectedPhotos, isUrgent);
    }
  };

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

        <ProgressTracker currentStep={2} totalSteps={8} />

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground text-center">
            What do you need help with today?
          </h2>

          <div className="relative">
            <Textarea
              placeholder="I need fence repairs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32 resize-none text-base pr-12"
              disabled={isProcessing}
              data-testid="input-service-description"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute bottom-3 right-3"
              data-testid="button-voice-input"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground text-center">
              Add Photos (Optional)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file-photos"
            />

            {selectedPhotos.length === 0 ? (
              <Card 
                className="border-2 border-dashed p-6 text-center space-y-3 cursor-pointer hover-elevate active-elevate-2"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-photos"
              >
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground text-sm">Upload Photos</p>
                  <p className="text-xs text-muted-foreground">
                    Photos help AI generate better scopes
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative group" data-testid={`photo-preview-${index}`}>
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(index)}
                        data-testid={`button-remove-photo-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Card 
                    className="border-2 border-dashed h-24 flex items-center justify-center cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-add-more-photos"
                  >
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </Card>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="urgent-toggle" className="text-sm font-semibold cursor-pointer">
                    Urgent Request
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    +25% fee for priority service
                  </p>
                </div>
              </div>
              <Switch
                id="urgent-toggle"
                checked={isUrgent}
                onCheckedChange={setIsUrgent}
                disabled={isProcessing}
                data-testid="switch-urgent-request"
              />
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold"
            onClick={handleSubmit}
            disabled={!description.trim() || isProcessing}
            data-testid="button-continue"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

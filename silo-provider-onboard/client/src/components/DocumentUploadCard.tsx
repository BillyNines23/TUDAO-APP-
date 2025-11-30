import { useState } from "react";
import { Upload, FileText, CheckCircle, XCircle, Clock, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DocumentUploadCardProps {
  type: string;
  label: string;
  description?: string;
  required?: boolean;
  onFileSelect?: (file: File) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function DocumentUploadCard({
  type,
  label,
  description,
  required = false,
  onFileSelect,
}: DocumentUploadCardProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setStatus("uploading");
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus("success");
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      onFileSelect?.(file);
      console.log(`File selected for ${type}:`, file.name);
    }
  };

  const handleRemove = () => {
    setStatus("idle");
    setFileName("");
    setProgress(0);
    console.log(`Removed file for ${type}`);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
        return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`card-upload-${type.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{label}</h3>
              {required && <span className="text-destructive text-xs">*Required</span>}
            </div>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {getStatusIcon()}
        </div>

        {status === "idle" ? (
          <label className="block">
            <div className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover-elevate transition-colors">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              data-testid={`input-file-${type.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1 truncate" data-testid={`text-filename-${type.toLowerCase().replace(/\s+/g, '-')}`}>{fileName}</span>
              {status === "success" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => console.log("View file")}
                    data-testid={`button-view-${type.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemove}
                    data-testid={`button-remove-${type.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            {status === "uploading" && <Progress value={progress} className="h-1" />}
            {status === "success" && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Upload complete
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

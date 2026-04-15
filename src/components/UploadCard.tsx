import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UploadCardProps {
  title: string;
  endpoint: string;
  savedAs: string;
  onStatusChange: (success: boolean) => void;
  baseUrl: string;
}

type UploadState = "idle" | "uploading" | "success" | "error";

const UploadCard = ({ title, endpoint, savedAs, onStatusChange, baseUrl }: UploadCardProps) => {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx")) {
      setState("error");
      setMessage("Only .xlsx files are accepted");
      onStatusChange(false);
      return;
    }

    setFileName(file.name);
    setState("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setState("success");
      setMessage(data.message || "Uploaded successfully");
      onStatusChange(true);
    } catch (err: any) {
      setState("error");
      setMessage(err.message || "Upload failed");
      onStatusChange(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setState("idle");
    setFileName("");
    setMessage("");
    onStatusChange(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const borderColor =
    state === "success" ? "border-success" :
    state === "error" ? "border-destructive" :
    "border-border";

  return (
    <Card className={`transition-all duration-200 ${borderColor} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground truncate">{savedAs}</p>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {state === "idle" && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drop .xlsx or click to browse</p>
          </div>
        )}

        {state === "uploading" && (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground truncate">Uploading {fileName}…</span>
          </div>
        )}

        {state === "success" && (
          <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{message}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="p-4 bg-destructive/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{message}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadCard;

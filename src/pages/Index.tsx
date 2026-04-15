import { useState } from "react";
import { Play, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UploadCard from "@/components/UploadCard";
import ResultsDisplay from "@/components/ResultsDisplay";
import StatusBanner from "@/components/StatusBanner";

const API_BASE = "http://localhost:8000";

const UPLOAD_CONFIGS = [
  {
    title: "Group Client Mapping",
    endpoint: "/upload/group-client-mapping/",
    savedAs: "reference_excel/GroupClient  Mapping_April26.xlsx",
  },
  {
    title: "Nexpose Raw Data",
    endpoint: "/upload/nexpose-raw-data/",
    savedAs: "reference_excel/Nexpose- raw data.xlsx",
  },
  {
    title: "Internet Facing & Criticality",
    endpoint: "/upload/internet-facing-criticality/",
    savedAs: "Internet facing Criticality VMware APR'26 (1) (1).xlsx",
  },
  {
    title: "VA Grouping Title",
    endpoint: "/upload/va-grouping-title/",
    savedAs: "VA Grouping Title - April'26.xlsx",
  },
];

interface PopulateResponse {
  message: string;
  files_updated: string[];
  data: Record<string, Record<string, any>[]>;
}

const Index = () => {
  const [uploadStatuses, setUploadStatuses] = useState<boolean[]>([false, false, false, false]);
  const [processing, setProcessing] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [templateResult, setTemplateResult] = useState<any>(null);
  const [populateResult, setPopulateResult] = useState<PopulateResponse | null>(null);

  const allUploaded = uploadStatuses.every(Boolean);

  const handleUploadStatus = (index: number, success: boolean) => {
    setUploadStatuses((prev) => {
      const next = [...prev];
      next[index] = success;
      return next;
    });
  };

  const handleProcess = async () => {
    setProcessing(true);
    setBanner(null);
    setTemplateResult(null);
    setPopulateResult(null);

    try {
      // Step 1: Create templates
      const templateRes = await fetch(`${API_BASE}/create-column-templates/`, { method: "POST" });
      const templateData = await templateRes.json();

      if (!templateRes.ok) {
        throw new Error(templateData.detail || "Template creation failed");
      }

      setTemplateResult(templateData);

      // Step 2: Populate data
      const populateRes = await fetch(`${API_BASE}/populate-existing-excel/`, { method: "POST" });
      const populateData = await populateRes.json();

      if (!populateRes.ok) {
        throw new Error(populateData.detail || "Data population failed");
      }

      setPopulateResult(populateData);
      setBanner({ type: "success", message: populateData.message || "Processing completed successfully" });
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred during processing" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-6xl mx-auto py-5 px-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-card-foreground">Excel Processing System</h1>
            <p className="text-xs text-muted-foreground">SecOps Vulnerability Management</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Section 1: Upload */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">1</span>
            <h2 className="text-base font-semibold">Upload Required Excel Files</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UPLOAD_CONFIGS.map((config, i) => (
              <UploadCard
                key={config.endpoint}
                title={config.title}
                endpoint={config.endpoint}
                savedAs={config.savedAs}
                baseUrl={API_BASE}
                onStatusChange={(success) => handleUploadStatus(i, success)}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {uploadStatuses.filter(Boolean).length}/4 files uploaded
          </p>
        </section>

        {/* Section 2: Process */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">2</span>
            <h2 className="text-base font-semibold">Process & Populate Data</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Automated Processing</CardTitle>
              <CardDescription className="text-xs">
                Creates column templates then populates data automatically in sequence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleProcess}
                disabled={!allUploaded || processing}
                className="w-full sm:w-auto"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Process & Populate Data
                  </>
                )}
              </Button>

              {!allUploaded && !processing && (
                <p className="text-xs text-muted-foreground">Upload all 4 files to enable processing.</p>
              )}

              {banner && (
                <StatusBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
              )}

              {templateResult && (
                <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-lg">
                  <p className="font-medium">Template step completed:</p>
                  {templateResult.created_new_files?.length > 0 && (
                    <p>Created: {templateResult.created_new_files.join(", ")}</p>
                  )}
                  {templateResult.cleared_existing_files?.length > 0 && (
                    <p>Cleared: {templateResult.cleared_existing_files.join(", ")}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Results */}
        {populateResult?.data && Object.keys(populateResult.data).length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">3</span>
              <h2 className="text-base font-semibold">Processed Results</h2>
            </div>
            <ResultsDisplay data={populateResult.data} filesUpdated={populateResult.files_updated} />
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;

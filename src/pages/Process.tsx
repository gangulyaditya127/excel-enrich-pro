import { useState } from "react";
import { Play, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UploadCard from "@/components/UploadCard";
import ResultsDisplay from "@/components/ResultsDisplay";
import StatusBanner from "@/components/StatusBanner";
import { API_BASE, NEXPOSE_UPLOAD_CONFIG } from "@/lib/api";

interface PopulateResponse {
  message: string;
  files_updated: string[];
  data: Record<string, Record<string, any>[]>;
}

const Process = () => {
  const [processing, setProcessing] = useState(false);
  const [runningNexpose, setRunningNexpose] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [templateResult, setTemplateResult] = useState<any>(null);
  const [populateResult, setPopulateResult] = useState<PopulateResponse | null>(null);
  const [nexposeResult, setNexposeResult] = useState<any>(null);

  const handleProcess = async () => {
    setProcessing(true);
    setBanner(null);
    setTemplateResult(null);
    setPopulateResult(null);

    try {
      const templateRes = await fetch(`${API_BASE}/create-column-templates/`, { method: "POST" });
      const templateData = await templateRes.json();
      if (!templateRes.ok) throw new Error(templateData.detail || "Template creation failed");
      setTemplateResult(templateData);

      const populateRes = await fetch(`${API_BASE}/populate-existing-excel/`, { method: "POST" });
      const populateData = await populateRes.json();
      if (!populateRes.ok) throw new Error(populateData.detail || "Data population failed");

      setPopulateResult(populateData);
      setBanner({ type: "success", message: populateData.message || "Processing completed successfully" });
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred during processing" });
    } finally {
      setProcessing(false);
    }
  };

  const handleNexposeRun = async () => {
    setRunningNexpose(true);
    setBanner(null);
    setNexposeResult(null);
    try {
      const ipRes = await fetch(`${API_BASE}/generate-nexpose-ip-excel`, { method: "POST" });
      const ipData = await ipRes.json();
      if (!ipRes.ok) throw new Error(ipData.detail || "Failed to generate Nexpose IP Excel");

      const reportRes = await fetch(`${API_BASE}/nexpose/run-full-report/`, { method: "POST" });
      const reportData = await reportRes.json();
      if (!reportRes.ok) throw new Error(reportData.detail || "Failed to run full Nexpose report");

      setNexposeResult({ ip: ipData, report: reportData });
      setBanner({ type: "success", message: "Nexpose IP Excel generated and full report executed." });
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Nexpose run failed" });
    } finally {
      setRunningNexpose(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Process Excel Files</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload the latest Nexpose raw data, then generate templates and populate enriched data.
        </p>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">1</span>
          <h2 className="text-base font-semibold">Upload Nexpose Raw Data</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UploadCard
            title={NEXPOSE_UPLOAD_CONFIG.title}
            endpoint={NEXPOSE_UPLOAD_CONFIG.endpoint}
            savedAs={NEXPOSE_UPLOAD_CONFIG.savedAs}
            baseUrl={API_BASE}
            onStatusChange={() => {}}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Other reference files are managed in <span className="font-medium">Admin</span> and don't need re-uploading each run.
        </p>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">2</span>
          <h2 className="text-base font-semibold">Run Pipelines</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Process & Populate Data</CardTitle>
            <CardDescription className="text-xs">
              Creates column templates then populates enriched data in sequence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleProcess} disabled={processing || runningNexpose} className="w-full" size="lg">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generate Nexpose Reports</CardTitle>
            <CardDescription className="text-xs">
              Generates the Nexpose IP Excel and triggers the full Nexpose report run.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleNexposeRun}
              disabled={runningNexpose || processing}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {runningNexpose ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate IP Excel & Run Full Report
                </>
              )}
            </Button>

            {nexposeResult && (
              <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-lg">
                <p className="font-medium">Nexpose run completed.</p>
                <pre className="text-[10px] overflow-auto max-h-40">{JSON.stringify(nexposeResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {banner && (
          <div className="mt-4">
            <StatusBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
          </div>
        )}
      </section>

      {populateResult?.data && Object.keys(populateResult.data).length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">3</span>
            <h2 className="text-base font-semibold">Processed Results</h2>
          </div>
          <ResultsDisplay data={populateResult.data} filesUpdated={populateResult.files_updated} />
        </section>
      )}
    </div>
  );
};

export default Process;
import { useState } from "react";
import { ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ResultsDisplayProps {
  data: Record<string, Record<string, any>[]>;
  filesUpdated: string[];
}

const PAGE_SIZE = 20;

const CriticalityBadge = ({ value }: { value: string }) => {
  const v = value?.toLowerCase() || "";
  const color =
    v === "high" || v === "critical" ? "bg-criticality-high text-white" :
    v === "medium" ? "bg-criticality-medium text-white" :
    v === "low" ? "bg-criticality-low text-white" :
    "bg-muted text-muted-foreground";
  return <Badge className={`${color} text-xs font-medium`}>{value}</Badge>;
};

const InternetFacingBadge = ({ value }: { value: string }) => {
  const isYes = value?.toLowerCase() === "yes";
  return (
    <Badge className={`text-xs font-medium ${isYes ? "bg-internet-facing text-white" : "bg-muted text-muted-foreground"}`}>
      {value}
    </Badge>
  );
};

const FileAccordion = ({ fileName, rows }: { fileName: string; rows: Record<string, any>[] }) => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  if (!rows || rows.length === 0) return null;

  const columns = Object.keys(rows[0]);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const isCriticalityCol = (col: string) => col.toLowerCase().includes("criticality");
  const isInternetFacingCol = (col: string) =>
    col.toLowerCase().includes("internet") || col.toLowerCase().includes("perimeter");

  return (
    <Card className="border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{fileName}</span>
        </div>
        <Badge variant="secondary" className="text-xs">{rows.length} rows</Badge>
      </button>

      {open && (
        <CardContent className="pt-0 pb-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap text-xs">
                        {isCriticalityCol(col) && row[col] ? (
                          <CriticalityBadge value={String(row[col])} />
                        ) : isInternetFacingCol(col) && row[col] ? (
                          <InternetFacingBadge value={String(row[col])} />
                        ) : (
                          <span className={row[col] == null || row[col] === "" ? "text-muted-foreground italic" : ""}>
                            {row[col] == null || row[col] === "" ? "—" : String(row[col])}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const ResultsDisplay = ({ data, filesUpdated }: ResultsDisplayProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-xs">{filesUpdated.length} files updated</Badge>
      </div>
      {Object.entries(data).map(([fileName, rows]) => (
        <FileAccordion key={fileName} fileName={fileName} rows={rows} />
      ))}
    </div>
  );
};

export default ResultsDisplay;

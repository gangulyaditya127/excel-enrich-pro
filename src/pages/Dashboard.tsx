import { useEffect, useState } from "react";
import { RefreshCw, Loader2, Server, ShieldAlert, Globe, Activity, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBanner from "@/components/StatusBanner";
import { API_BASE } from "@/lib/api";

interface SiteSummary {
  site_name: string;
  defined_asset_count: number;
  scan_completed: number;
  scan_failed: number;
  scan_unscanned: number;
  perimeter_devices: number;
}

interface TopIp { ip: string; count: number }

interface TopGroupClient { group_client: string; count: number }
interface VaTitleGrouping { va_title_grouping: string; count: number }

interface AgeingBucket { os: number; application: number }

interface VaSiteSummary {
  site_name: string;
  total_vulnerabilities: number;
  new_vulnerability_count: number;
  exploit_va_count: number;
  va_eosl_count: number;
  perimeter_va_count: number;
  critical: Record<string, AgeingBucket>;
  high: Record<string, AgeingBucket>;
  medium_low: Record<string, AgeingBucket>;
}

interface DashboardResponse {
  status: string;
  total_sites: number;
  site_summary: SiteSummary[];
  top_ips: TopIp[];
  top_group_clients?: TopGroupClient[];
  va_title_grouping_summary?: VaTitleGrouping[];
  va_site_summary: VaSiteSummary[];
}

const StatCard = ({ icon: Icon, label, value, tone = "default" }: any) => {
  const toneClass =
    tone === "success" ? "text-success" :
    tone === "danger" ? "text-destructive" :
    tone === "warning" ? "text-warning" :
    "text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const labelFor = (key: string) => {
  if (key.startsWith("lt_")) return `< ${key.slice(3)} days`;
  if (key.startsWith("gt_")) return `> ${key.slice(3)} days`;
  return key;
};

const SeverityTable = ({ title, data, color }: { title: string; data: Record<string, AgeingBucket>; color: string }) => {
  const keys = Object.keys(data || {});
  if (keys.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Ageing</TableHead>
              <TableHead className="text-xs text-right">OS</TableHead>
              <TableHead className="text-xs text-right">Application</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k}>
                <TableCell className="text-xs">{labelFor(k)}</TableCell>
                <TableCell className="text-xs text-right">{data[k].os}</TableCell>
                <TableCell className="text-xs text-right">{data[k].application}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/site-summary/`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to load dashboard");
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = data?.site_summary.reduce(
    (acc, s) => ({
      assets: acc.assets + s.defined_asset_count,
      completed: acc.completed + s.scan_completed,
      failed: acc.failed + s.scan_failed,
      unscanned: acc.unscanned + s.scan_unscanned,
      perimeter: acc.perimeter + s.perimeter_devices,
    }),
    { assets: 0, completed: 0, failed: 0, unscanned: 0, perimeter: 0 }
  );

  const vaTotals = data?.va_site_summary.reduce(
    (acc, s) => ({
      total: acc.total + s.total_vulnerabilities,
      newV: acc.newV + s.new_vulnerability_count,
      exploit: acc.exploit + s.exploit_va_count,
      eosl: acc.eosl + s.va_eosl_count,
      perimeter: acc.perimeter + s.perimeter_va_count,
    }),
    { total: 0, newV: 0, exploit: 0, eosl: 0, perimeter: 0 }
  );

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Site summary, scan status, and vulnerability overview.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {error && <StatusBanner type="error" message={error} onDismiss={() => setError(null)} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading dashboard…
        </div>
      )}

      {data && (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon={Server} label="Total Sites" value={data.total_sites} />
            <StatCard icon={Activity} label="Defined Assets" value={totals?.assets ?? 0} />
            <StatCard icon={CheckCircle2} label="Scan Completed" value={totals?.completed ?? 0} tone="success" />
            <StatCard icon={XCircle} label="Scan Failed" value={totals?.failed ?? 0} tone="danger" />
            <StatCard icon={Clock} label="Unscanned" value={totals?.unscanned ?? 0} tone="warning" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={ShieldAlert} label="Total Vulnerabilities" value={vaTotals?.total ?? 0} tone="danger" />
            <StatCard icon={AlertTriangle} label="New Vulnerabilities" value={vaTotals?.newV ?? 0} tone="warning" />
            <StatCard icon={ShieldAlert} label="Exploitable VA" value={vaTotals?.exploit ?? 0} tone="danger" />
            <StatCard icon={AlertTriangle} label="EOSL Count" value={vaTotals?.eosl ?? 0} tone="warning" />
            <StatCard icon={Globe} label="Perimeter VA" value={vaTotals?.perimeter ?? 0} />
          </div>

          {/* Site summary table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site Summary</CardTitle>
              <CardDescription className="text-xs">Per-site scan status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Assets</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">Unscanned</TableHead>
                      <TableHead className="text-right">Perimeter</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.site_summary.map((s) => (
                      <TableRow key={s.site_name}>
                        <TableCell className="font-medium text-sm">{s.site_name}</TableCell>
                        <TableCell className="text-right text-sm">{s.defined_asset_count}</TableCell>
                        <TableCell className="text-right text-sm text-success">{s.scan_completed}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{s.scan_failed}</TableCell>
                        <TableCell className="text-right text-sm text-warning">{s.scan_unscanned}</TableCell>
                        <TableCell className="text-right text-sm">{s.perimeter_devices}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top IPs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top IPs by Vulnerabilities</CardTitle>
                <CardDescription className="text-xs">Most affected hosts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.top_ips.map((ip, i) => {
                    const max = Math.max(...data.top_ips.map((x) => x.count));
                    const pct = (ip.count / max) * 100;
                    return (
                      <div key={ip.ip} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono">{i + 1}. {ip.ip}</span>
                          <Badge variant="secondary" className="text-xs">{ip.count}</Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* VA Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">VA Ageing & Severity</CardTitle>
                <CardDescription className="text-xs">Per site • OS vs Application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.va_site_summary.map((va) => (
                  <div key={va.site_name} className="space-y-4">
                    <p className="text-sm font-semibold">{va.site_name}</p>
                    <SeverityTable title="Critical" data={va.critical} color="bg-criticality-high" />
                    <SeverityTable title="High" data={va.high} color="bg-criticality-medium" />
                    <SeverityTable title="Medium / Low" data={va.medium_low} color="bg-criticality-low" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
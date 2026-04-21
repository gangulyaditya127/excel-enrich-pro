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

const StatCard = ({ icon: Icon, label, value, tone = "default", delay = 0 }: any) => {
  const toneMap: Record<string, { bg: string; ring: string; text: string }> = {
    success: { bg: "bg-gradient-success", ring: "ring-success/20", text: "text-success" },
    danger: { bg: "bg-gradient-danger", ring: "ring-destructive/20", text: "text-destructive" },
    warning: { bg: "bg-gradient-warning", ring: "ring-warning/20", text: "text-warning" },
    default: { bg: "bg-gradient-primary", ring: "ring-primary/20", text: "text-primary" },
  };
  const t = toneMap[tone] || toneMap.default;
  return (
    <Card
      className="card-hover relative overflow-hidden border-border/60 bg-gradient-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${t.bg}`} />
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${t.bg} opacity-10 blur-2xl`} />
      <CardContent className="p-4 relative">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${t.bg} flex items-center justify-center shrink-0 shadow-md ring-4 ${t.ring}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground truncate uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
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
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color} shadow-md`} style={{ boxShadow: `0 0 12px hsl(var(--criticality-high) / 0.6)` }} />
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-gradient-card shadow-card-soft">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs">Ageing</TableHead>
              <TableHead className="text-xs text-right">OS</TableHead>
              <TableHead className="text-xs text-right">Application</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-xs">{labelFor(k)}</TableCell>
                <TableCell className="text-xs text-right font-mono font-medium">{data[k].os}</TableCell>
                <TableCell className="text-xs text-right font-mono font-medium">{data[k].application}</TableCell>
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
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-primary shadow-elegant animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(0_0%_100%/0.15),transparent_50%)]" />
        <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-3 p-6">
          <div className="text-primary-foreground">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <p className="text-[11px] uppercase tracking-widest opacity-80">Live overview</p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
            <p className="text-sm opacity-90 mt-1">
              Site summary, scan status, and vulnerability intelligence.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={load}
            disabled={loading}
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/20 backdrop-blur"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
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
            <StatCard icon={Server} label="Total Sites" value={data.total_sites} delay={0} />
            <StatCard icon={Activity} label="Defined Assets" value={totals?.assets ?? 0} delay={50} />
            <StatCard icon={CheckCircle2} label="Scan Completed" value={totals?.completed ?? 0} tone="success" delay={100} />
            <StatCard icon={XCircle} label="Scan Failed" value={totals?.failed ?? 0} tone="danger" delay={150} />
            <StatCard icon={Clock} label="Unscanned" value={totals?.unscanned ?? 0} tone="warning" delay={200} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={ShieldAlert} label="Total Vulnerabilities" value={vaTotals?.total ?? 0} tone="danger" delay={250} />
            <StatCard icon={AlertTriangle} label="New Vulnerabilities" value={vaTotals?.newV ?? 0} tone="warning" delay={300} />
            <StatCard icon={ShieldAlert} label="Exploitable VA" value={vaTotals?.exploit ?? 0} tone="danger" delay={350} />
            <StatCard icon={AlertTriangle} label="EOSL Count" value={vaTotals?.eosl ?? 0} tone="warning" delay={400} />
            <StatCard icon={Globe} label="Perimeter VA" value={vaTotals?.perimeter ?? 0} delay={450} />
          </div>

          {/* Site summary table */}
          <Card className="border-border/60 bg-gradient-card shadow-card-soft animate-slide-up overflow-hidden">
            <CardHeader className="border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md">
                  <Server className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base tracking-tight">Site Summary</CardTitle>
                  <CardDescription className="text-xs">Per-site scan status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
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
                      <TableRow key={s.site_name} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-sm">{s.site_name}</TableCell>
                        <TableCell className="text-right text-sm font-mono">{s.defined_asset_count}</TableCell>
                        <TableCell className="text-right text-sm font-mono"><Badge variant="outline" className="bg-success/10 text-success border-success/30">{s.scan_completed}</Badge></TableCell>
                        <TableCell className="text-right text-sm font-mono"><Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">{s.scan_failed}</Badge></TableCell>
                        <TableCell className="text-right text-sm font-mono"><Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">{s.scan_unscanned}</Badge></TableCell>
                        <TableCell className="text-right text-sm font-mono">{s.perimeter_devices}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* VA Severity Breakdown - full width, rows */}
          <Card className="border-border/60 bg-gradient-card shadow-card-soft animate-slide-up overflow-hidden">
            <CardHeader className="border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-danger flex items-center justify-center shadow-md">
                  <ShieldAlert className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base tracking-tight">VA Ageing & Severity</CardTitle>
                  <CardDescription className="text-xs">Per site • OS vs Application</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {data.va_site_summary.map((va) => (
                <div key={va.site_name} className="space-y-4 pt-4">
                  <p className="text-sm font-semibold tracking-tight flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {va.site_name}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SeverityTable title="Critical" data={va.critical} color="bg-criticality-high" />
                    <SeverityTable title="High" data={va.high} color="bg-criticality-medium" />
                    <SeverityTable title="Medium / Low" data={va.medium_low} color="bg-criticality-low" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top IPs */}
            <Card className="border-border/60 bg-gradient-card shadow-card-soft card-hover animate-slide-up">
              <CardHeader className="border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base tracking-tight">Top IPs</CardTitle>
                    <CardDescription className="text-xs">Most affected hosts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {data.top_ips.map((ip, i) => {
                    const max = Math.max(...data.top_ips.map((x) => x.count));
                    const pct = (ip.count / max) * 100;
                    return (
                      <div key={ip.ip} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono"><span className="text-muted-foreground">{i + 1}.</span> {ip.ip}</span>
                          <Badge variant="secondary" className="text-xs font-mono">{ip.count}</Badge>
                        </div>
                        <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Group Clients */}
            <Card className="border-border/60 bg-gradient-card shadow-card-soft card-hover animate-slide-up">
              <CardHeader className="border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-warning flex items-center justify-center shadow-md">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base tracking-tight">Top Group Clients</CardTitle>
                    <CardDescription className="text-xs">By vulnerability count</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.top_group_clients && data.top_group_clients.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {data.top_group_clients.map((gc, i) => {
                      const max = Math.max(...data.top_group_clients!.map((x) => x.count));
                      const pct = (gc.count / max) * 100;
                      return (
                        <div key={gc.group_client} className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="truncate"><span className="text-muted-foreground">{i + 1}.</span> {gc.group_client}</span>
                            <Badge variant="secondary" className="text-xs font-mono">{gc.count}</Badge>
                          </div>
                          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-warning rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* VA Title Grouping */}
            <Card className="border-border/60 bg-gradient-card shadow-card-soft card-hover animate-slide-up">
              <CardHeader className="border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-danger flex items-center justify-center shadow-md">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base tracking-tight">VA Title Grouping</CardTitle>
                    <CardDescription className="text-xs">Vulnerability categories</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.va_title_grouping_summary && data.va_title_grouping_summary.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {data.va_title_grouping_summary.map((vt, i) => {
                      const max = Math.max(...data.va_title_grouping_summary!.map((x) => x.count));
                      const pct = (vt.count / max) * 100;
                      return (
                        <div key={vt.va_title_grouping} className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="truncate"><span className="text-muted-foreground">{i + 1}.</span> {vt.va_title_grouping}</span>
                            <Badge variant="secondary" className="text-xs font-mono">{vt.count}</Badge>
                          </div>
                          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-danger rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
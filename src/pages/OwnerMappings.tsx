import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Mail, Users, Send } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBanner from "@/components/StatusBanner";
import { API_BASE } from "@/lib/api";

interface OwnerMapping {
  owner_key: string;
  to_emails: string[];
  cc_emails: string[];
}

const emailListSchema = z
  .string()
  .trim()
  .transform((s) => s.split(",").map((e) => e.trim()).filter(Boolean))
  .pipe(z.array(z.string().email("Invalid email")).min(0));

const formSchema = z.object({
  owner_key: z.string().trim().min(1, "Owner key required").max(100),
  to_emails: emailListSchema.refine((arr) => arr.length > 0, "At least one TO email required"),
  cc_emails: emailListSchema,
});

const OwnerMappings = () => {
  const [mappings, setMappings] = useState<OwnerMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerKey, setOwnerKey] = useState("");
  const [toEmails, setToEmails] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState<any>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner-mapping`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load");
      setMappings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Failed to load mappings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    const parsed = formSchema.safeParse({ owner_key: ownerKey, to_emails: toEmails, cc_emails: ccEmails });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fe[i.path[0] as string] = i.message;
      });
      setErrors(fe);
      return;
    }
    setErrors({});
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/owner-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add");
      setBanner({ type: "success", message: data.message || "Owner mapping added" });
      setOwnerKey("");
      setToEmails("");
      setCcEmails("");
      load();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Failed to add owner mapping" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    setBanner(null);
    try {
      const res = await fetch(`${API_BASE}/owner-mapping/${encodeURIComponent(key)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to delete");
      setBanner({ type: "success", message: data.message || "Deleted" });
      load();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Failed to delete" });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleNotify = async () => {
    setNotifying(true);
    setNotifyResult(null);
    setBanner(null);
    try {
      const res = await fetch(`${API_BASE}/send-vulnerability-sla-mails`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send mails");
      setNotifyResult(data);
      setBanner({ type: "success", message: data.message || "SLA mails processed" });
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Failed to send mails" });
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Owner Mappings & Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure email recipients per owner and trigger SLA breach notifications.
        </p>
      </div>

      {banner && <StatusBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Notify Owners
          </CardTitle>
          <CardDescription className="text-xs">
            Sends vulnerability SLA breach emails to all configured owners.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleNotify} disabled={notifying} size="lg">
            {notifying ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <><Mail className="h-4 w-4 mr-2" /> Send SLA Alert Emails</>
            )}
          </Button>

          {notifyResult && (
            <div className="text-xs bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Run ID</Badge>
                <span className="font-mono">{notifyResult.run_id}</span>
              </div>
              <div>Owners notified: <span className="font-medium">{notifyResult.owners_notified}</span></div>
              {Array.isArray(notifyResult.results) && notifyResult.results.length > 0 && (
                <div className="space-y-1">
                  {notifyResult.results.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline">{r.owner}</Badge>
                      <span className="text-muted-foreground">{r.mail_status}</span>
                      <span className="text-muted-foreground">· {r.count} items</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Add Owner Mapping
          </CardTitle>
          <CardDescription className="text-xs">Use comma-separated emails for multiple recipients.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner_key">Owner Key</Label>
              <Input
                id="owner_key"
                placeholder="e.g. secops"
                value={ownerKey}
                onChange={(e) => setOwnerKey(e.target.value)}
                maxLength={100}
              />
              {errors.owner_key && <p className="text-xs text-destructive">{errors.owner_key}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_emails">To Emails</Label>
              <Input
                id="to_emails"
                placeholder="alice@co.com, bob@co.com"
                value={toEmails}
                onChange={(e) => setToEmails(e.target.value)}
              />
              {errors.to_emails && <p className="text-xs text-destructive">{errors.to_emails}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc_emails">CC Emails (optional)</Label>
              <Input
                id="cc_emails"
                placeholder="manager@co.com"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
              />
              {errors.cc_emails && <p className="text-xs text-destructive">{errors.cc_emails}</p>}
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding…</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Add Mapping</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Configured Mappings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : mappings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No owner mappings configured yet.</p>
          ) : (
            <div className="space-y-3">
              {mappings.map((m) => (
                <div
                  key={m.owner_key}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge>{m.owner_key}</Badge>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">To:</span>{" "}
                      <span className="font-mono">{m.to_emails.join(", ") || "—"}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">CC:</span>{" "}
                      <span className="font-mono">{m.cc_emails.join(", ") || "—"}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(m.owner_key)}
                    disabled={deletingKey === m.owner_key}
                  >
                    {deletingKey === m.owner_key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerMappings;
import { useEffect, useState } from "react";
import { Loader2, KeyRound, Save, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBanner from "@/components/StatusBanner";
import { API_BASE } from "@/lib/api";

const credSchema = z.object({
  base_url: z.string().trim().url({ message: "Must be a valid URL" }).max(500),
  username: z.string().trim().min(1, "Username required").max(200),
  password: z.string().min(1, "Password required").max(500),
});

interface ActiveCred {
  base_url: string;
  username: string;
  is_active: boolean;
  updated_at: string;
}

const Settings = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveCred | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadActive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/nexpose/credentials`);
      if (res.ok) {
        const data = await res.json();
        setActive(data);
        setBaseUrl(data.base_url || "");
        setUsername(data.username || "");
      } else {
        setActive(null);
      }
    } catch {
      setActive(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActive();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    const parsed = credSchema.safeParse({ base_url: baseUrl, username, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as string;
        fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/nexpose/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail?.[0]?.msg || data.detail || "Failed to save");
      setBanner({ type: "success", message: data.message || "Credentials saved successfully" });
      setPassword("");
      loadActive();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Failed to save credentials" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nexpose Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the Nexpose scanner connection. Password is encrypted on the server.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Active Credentials
          </CardTitle>
          <CardDescription className="text-xs">Currently configured connection</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : active ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Active</Badge>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(active.updated_at).toLocaleString()}
                </span>
              </div>
              <div><span className="text-muted-foreground">Base URL:</span> {active.base_url}</div>
              <div><span className="text-muted-foreground">Username:</span> {active.username}</div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No credentials configured yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            {active ? "Update Credentials" : "Add Credentials"}
          </CardTitle>
          <CardDescription className="text-xs">
            Saving new credentials will mark all previous ones inactive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                placeholder="https://nexpose.company.com:3780"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                maxLength={500}
              />
              {errors.base_url && <p className="text-xs text-destructive">{errors.base_url}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="nexpose_admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={200}
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={500}
                autoComplete="new-password"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {banner && (
              <StatusBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
            )}

            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Credentials</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
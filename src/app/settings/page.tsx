"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ProviderConn {
  id: string; providerId: string; displayName: string;
  status: string; lastVerifiedAt: string | null;
}

interface ProviderConfig {
  id: "gemini" | "openai" | "kling" | "fal" | "hedra";
  label: string;
  badge?: string;
  placeholder: string;
  hint: React.ReactNode;
  docsUrl: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "fal",
    label: "fal.ai (LivePortrait Lip-Sync)",
    badge: "⭐ Best & Ultra-Cheap (~$0.01 / clip)",
    placeholder: "falkey_...",
    hint: (
      <>
        Get a key at{" "}
        <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noreferrer" className="text-amber-400 underline font-medium">
          fal.ai/dashboard/keys
        </a>{" "}
        (includes free trial credits). Powers photorealistic neural <strong>LivePortrait lip-sync</strong> with mouth phonemes, blinking, and head motion for only ~1¢ per shot.
      </>
    ),
    docsUrl: "https://fal.ai",
  },
  {
    id: "hedra",
    label: "Hedra (Character Studio)",
    badge: "Cinematic Character API",
    placeholder: "hedra_...",
    hint: (
      <>
        Get an API key at{" "}
        <a href="https://hedra.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">
          hedra.com
        </a>
        . Dedicated expressive character video dialogue generation.
      </>
    ),
    docsUrl: "https://hedra.com",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    badge: "Free tier",
    placeholder: "AIza...",
    hint: (
      <>
        Get a free key at{" "}
        <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">
          aistudio.google.com
        </a>{" "}
        → Get API key. Generates story, bible & shot plan.
      </>
    ),
    docsUrl: "https://aistudio.google.com",
  },
  {
    id: "openai",
    label: "OpenAI",
    badge: "DALL·E 3 & GPT-4o",
    placeholder: "sk-...",
    hint: (
      <>
        Needs an <strong>OpenAI API key</strong> with billing enabled at{" "}
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-amber-400 underline">
          platform.openai.com
        </a>
        . Generates story and <strong>DALL·E 3 storyboard images</strong>.
      </>
    ),
    docsUrl: "https://platform.openai.com",
  },
  {
    id: "kling",
    label: "Kling AI",
    badge: "Video generation",
    placeholder: "api-key-kling-... or accessKey:secretKey",
    hint: (
      <>
        Get your API key from{" "}
        <a href="https://klingai.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">
          klingai.com
        </a>
        . Generates AI video clips (requires funded Kling API balance).
      </>
    ),
    docsUrl: "https://klingai.com",
  },
];

export default function SettingsPage() {
  const [connections, setConnections] = useState<ProviderConn[]>([]);
  const [keys, setKeys]       = useState<Record<string, string>>({ gemini: "", openai: "", kling: "", fal: "", hedra: "" });
  const [saving, setSaving]   = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [msg, setMsg]         = useState<{ providerId: string; ok: boolean; text: string } | null>(null);

  async function load() {
    const r = await fetch("/api/settings/providers");
    const d = await r.json();
    setConnections(d.data?.providers ?? []);
  }
  useEffect(() => { load(); }, []);

  function conn(id: string) { return connections.find(c => c.providerId === id); }

  async function saveKey(providerId: string) {
    const apiKey = keys[providerId];
    if (!apiKey) return;
    setSaving(providerId); setMsg(null);
    const r = await fetch("/api/settings/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, apiKey }),
    });
    const d = await r.json();
    setSaving(null);
    if (r.ok) {
      setMsg({ providerId, ok: true, text: "Key saved. Click Test to verify." });
      setKeys(k => ({ ...k, [providerId]: "" }));
      load();
    } else {
      setMsg({ providerId, ok: false, text: d.error?.message ?? "Save failed" });
    }
  }

  async function testConn(id: string) {
    const connection = connections.find(c => c.id === id);
    const pId = connection?.providerId ?? "";
    setTesting(id); setMsg(null);
    const r = await fetch("/api/settings/providers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId: id }),
    });
    const d = await r.json();
    setTesting(null);
    if (d.data?.ok) setMsg({ providerId: pId, ok: true, text: `Connected! Model: ${d.data.model}` });
    else setMsg({ providerId: pId, ok: false, text: d.data?.error ?? "Connection failed" });
    load();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-8 py-10">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Configure your AI provider API keys. The app uses{" "}
          <span className="text-zinc-300 font-medium">Gemini first</span>, then OpenAI as fallback.
        </p>

        <div className="space-y-5">
          {PROVIDERS.map((p) => {
            const existing = conn(p.id);
            const isConnected = existing?.status === "CONNECTED";
            const isError     = existing?.status === "ERROR";
            const statusBadge = isConnected ? "approved" : isError ? "failed" : "draft";

            return (
              <section key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-semibold">{p.label}</span>
                  {p.badge && (
                    <span className="rounded bg-emerald-900/60 border border-emerald-700 px-2 py-0.5 text-xs text-emerald-300">
                      {p.badge}
                    </span>
                  )}
                  {existing && (
                    <Badge
                      status={statusBadge}
                      label={existing.status}
                    />
                  )}
                </div>

                {existing && (
                  <div className="mb-4 text-sm text-zinc-400 space-y-2">
                    <p>Key saved and encrypted. Enter a new key below to replace it.</p>
                    {existing.lastVerifiedAt && (
                      <p className="text-xs">Last verified: {new Date(existing.lastVerifiedAt).toLocaleString()}</p>
                    )}
                    <Button
                      variant="secondary" size="sm"
                      loading={testing === existing.id}
                      onClick={() => testConn(existing.id)}
                    >
                      Test connection
                    </Button>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); saveKey(p.id); }} className="space-y-3">
                  <div>
                    <label className="block text-sm text-zinc-300 mb-1">
                      {existing ? "Replace API key" : "API key"}
                    </label>
                    <input
                      type="password"
                      value={keys[p.id]}
                      onChange={(e) => setKeys(k => ({ ...k, [p.id]: e.target.value }))}
                      placeholder={p.placeholder}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-zinc-500">{p.hint}</p>
                  </div>
                  <Button type="submit" loading={saving === p.id} disabled={!keys[p.id]}>
                    Save key
                  </Button>
                </form>

                {msg && msg.providerId === p.id && (
                  <div className={`mt-3 flex items-start gap-2 text-sm ${msg.ok ? "text-emerald-400" : "text-rose-400"}`}>
                    {msg.ok
                      ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                    {msg.text}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500">
          <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
          API keys are encrypted at rest and never sent to the browser.
          Generation costs (if any) are charged directly to your provider account.
        </div>
      </div>
    </AppShell>
  );
}

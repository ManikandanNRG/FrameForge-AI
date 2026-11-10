"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Sparkles, Film, Zap, ShieldCheck } from "lucide-react";

interface ProviderConn {
  id: string; providerId: string; displayName: string;
  status: string; lastVerifiedAt: string | null;
}

interface ProviderConfig {
  id: "openrouter" | "gemini" | "openai" | "kling" | "fal" | "hedra";
  label: string;
  badge?: string;
  placeholder: string;
  hint: React.ReactNode;
  docsUrl: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    label: "Google Gemini (Primary Engine)",
    badge: "100% Free · 1,500 Requests/Day",
    placeholder: "AIza...",
    hint: (
      <>
        Get a free API key at{" "}
        <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-medium">
          aistudio.google.com
        </a>{" "}
        → Get API key. Official free tier includes <strong>1,500 requests/day &amp; 15 RPM</strong> at $0.00 cost. Generates full stories, characters, and scene prompts.
      </>
    ),
    docsUrl: "https://aistudio.google.com",
  },
  {
    id: "openrouter",
    label: "OpenRouter (Free Models Mode)",
    badge: "100% Free · Llama 3.3 70B & Gemini Free",
    placeholder: "sk-or-v1-...",
    hint: (
      <>
        Get a key at{" "}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-amber-400 underline font-medium">
          openrouter.ai/keys
        </a>
        . Configured strictly to <strong>100% Free Models</strong> (<code>meta-llama/llama-3.3-70b-instruct:free</code>, <code>google/gemini-2.0-flash-lite:free</code>, <code>deepseek/deepseek-r1:free</code>). Never consumes paid credits.
      </>
    ),
    docsUrl: "https://openrouter.ai",
  },
  {
    id: "openai",
    label: "OpenAI (Optional / Paid)",
    badge: "Requires Paid Credits",
    placeholder: "sk-...",
    hint: (
      <>
        Requires a funded key with billing enabled at{" "}
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-amber-400 underline">
          platform.openai.com
        </a>
        . If quota runs out (429), the studio automatically ignores this key and runs on Gemini / OpenRouter Free.
      </>
    ),
    docsUrl: "https://platform.openai.com",
  },
  {
    id: "kling",
    label: "Kling AI",
    badge: "66 Free Credits / Day on Web",
    placeholder: "api-key-kling-... or accessKey:secretKey",
    hint: (
      <>
        Get your API key from{" "}
        <a href="https://klingai.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">
          klingai.com
        </a>
        . Or use Kling Web directly (which grants <strong>66 free video credits daily</strong>).
      </>
    ),
    docsUrl: "https://klingai.com",
  },
  {
    id: "fal",
    label: "fal.ai (LivePortrait Lip-Sync)",
    badge: "Optional (~$0.01 / clip)",
    placeholder: "falkey_...",
    hint: (
      <>
        Get a key at{" "}
        <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noreferrer" className="text-amber-400 underline font-medium">
          fal.ai/dashboard/keys
        </a>{" "}
        (includes free trial credits). Powers photorealistic neural LivePortrait lip-sync.
      </>
    ),
    docsUrl: "https://fal.ai",
  },
  {
    id: "hedra",
    label: "Hedra (Character Studio)",
    badge: "Optional Character API",
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
      <div className="mx-auto max-w-4xl px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-slate-900">Settings &amp; AI Provider Keys</h1>
          <p className="text-slate-500 text-sm">
            Optimized for <strong className="text-emerald-700 font-semibold">100% Zero-Cost Filmmaking</strong> (1 video per day, 2–3 minutes each).
          </p>
        </div>

        {/* Free AI Quota & Daily Filmmaking Dashboard */}
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                <Film className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Daily Free Filmmaking Capacity</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-semibold">
                    100% Zero-Cost Active
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Plan: 1 Video Per Day (2–3 minutes / ~15–20 shots). Entire script &amp; prompts generated for $0.00.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-lg border border-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Free Quota: &gt;99% Headroom</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* 1. Gemini Free Monitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Google Gemini Free</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                  Primary ($0.00)
                </span>
              </div>
              <p className="text-lg font-mono font-bold text-emerald-700">1,500 <span className="text-xs text-slate-500 font-normal">calls / day</span></p>
              <p className="text-[11px] text-slate-500 leading-tight">
                15 RPM rate limit. 1 full 3-min film uses ~6 calls (&lt;0.5% daily quota).
              </p>
            </div>

            {/* 2. OpenRouter Free Monitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">OpenRouter Free</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-semibold">
                  Backup ($0.00)
                </span>
              </div>
              <p className="text-lg font-mono font-bold text-blue-700">200 <span className="text-xs text-slate-500 font-normal">calls / day</span></p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Llama 3.3 70B &amp; Gemini Free. Automatic failover if Gemini is ever busy.
              </p>
            </div>

            {/* 3. Visuals & Video Studio Monitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Visuals &amp; Motion</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono font-semibold">
                  Local / Free
                </span>
              </div>
              <p className="text-lg font-mono font-bold text-purple-700">Unlimited <span className="text-xs text-slate-500 font-normal">stills &amp; video</span></p>
              <p className="text-[11px] text-slate-500 leading-tight">
                FLUX.1 free image generator + In-app FFmpeg 24fps motion + TTS audio multiplexing.
              </p>
            </div>
          </div>

          {/* Rate-Limit / Quota Notification Banner */}
          {connections.some(c => c.providerId === "openai" && c.status === "ERROR") && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <strong>Notice:</strong> OpenAI key currently has 0 credits (429). The studio has safely deactivated it and is running <strong>100% on your Free Google Gemini &amp; OpenRouter Free tiers</strong> with zero downtime.
              </div>
            </div>
          )}
        </section>

        <div className="space-y-4">
          {PROVIDERS.map((p) => {
            const existing = conn(p.id);
            const isConnected = existing?.status === "CONNECTED";
            const isError     = existing?.status === "ERROR";
            const statusBadge = isConnected ? "approved" : isError ? "failed" : "draft";

            return (
              <section key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-semibold text-slate-900">{p.label}</span>
                  {p.badge && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
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
                  <div className="mb-4 text-sm text-slate-600 space-y-2">
                    <p>Key saved and encrypted. Enter a new key below to replace it.</p>
                    {existing.lastVerifiedAt && (
                      <p className="text-xs text-slate-400">Last verified: {new Date(existing.lastVerifiedAt).toLocaleString()}</p>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {existing ? "Replace API key" : "API key"}
                    </label>
                    <input
                      type="password"
                      value={keys[p.id] ?? ""}
                      onChange={(e) => setKeys(k => ({ ...k, [p.id]: e.target.value }))}
                      placeholder={p.placeholder}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                    />
                    <p className="mt-1 text-xs text-slate-500">{p.hint}</p>
                  </div>
                  <Button type="submit" loading={saving === p.id} disabled={!keys[p.id]?.trim()}>
                    Save key
                  </Button>
                </form>

                {msg && msg.providerId === p.id && (
                  <div className={`mt-3 flex items-start gap-2 text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>
                    {msg.ok
                      ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                      : <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />}
                    {msg.text}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-600">
          <AlertCircle className="h-3.5 w-3.5 inline mr-1 text-slate-500" />
          API keys are encrypted at rest and never sent to the browser.
          Generation costs (if any) are charged directly to your provider account.
        </div>
      </div>
    </AppShell>
  );
}

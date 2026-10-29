"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge, artifactStatusBadge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, User, MapPin, Package } from "lucide-react";

interface Asset { id: string; assetType: string; name: string; description: string; approvalStatus: string; attributes: string; }

const TYPE_ICON: Record<string, React.ReactNode> = {
  CHARACTER: <User className="h-3.5 w-3.5" />,
  LOCATION:  <MapPin className="h-3.5 w-3.5" />,
  PROP:      <Package className="h-3.5 w-3.5" />,
};

export default function BiblePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [generating, setGenerating]   = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [selected, setSelected]       = useState<Asset | null>(null);

  async function load() {
    const r = await fetch(`/api/projects/${projectId}/bible`);
    const d = await r.json();
    setAssets(d.data?.assets ?? []);
  }

  useEffect(() => { load(); }, [projectId]);

  useEffect(() => {
    if (!activeJobId) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/jobs/${activeJobId}`);
      const d = await r.json();
      const s = d.data?.job?.status;
      if (s === "SUCCEEDED") { clearInterval(t); setActiveJobId(null); load(); }
      if (s === "FAILED")    { clearInterval(t); setActiveJobId(null); setError(d.data?.job?.errorMessage ?? "Failed"); }
    }, 2000);
    return () => clearInterval(t);
  }, [activeJobId]);

  async function generate(useMock = false) {
    setGenerating(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/bible`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useMock }),
    });
    const d = await r.json();
    setGenerating(false);
    if (r.ok) setActiveJobId(d.data.jobId);
    else setError(d.error?.message ?? "Failed");
  }

  async function approve(assetId: string) {
    await fetch(`/api/projects/${projectId}/assets/${assetId}/approve`, { method: "POST" });
    load();
  }

  const grouped = ["CHARACTER", "LOCATION", "PROP", "COSTUME", "VEHICLE"].reduce((acc, t) => {
    acc[t] = assets.filter(a => a.assetType === t);
    return acc;
  }, {} as Record<string, Asset[]>);

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden">
        {/* Left panel */}
        <div className="w-64 shrink-0 border-r border-zinc-800 overflow-y-auto py-6 px-3">
          <div className="px-3 mb-4 text-xs text-zinc-500 flex gap-1 items-center">
            <Link href={`/projects/${projectId}`} className="hover:text-zinc-300">Project</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span>Production Bible</span>
          </div>

          {assets.length === 0 && !activeJobId && (
            <div className="px-3 space-y-3">
              <p className="text-sm text-zinc-400">Extract characters, locations, and props from your approved screenplay.</p>
              {error && <p className="text-rose-400 text-xs">{error}</p>}
              <Button size="sm" loading={generating} onClick={() => generate(false)} className="w-full"><Sparkles className="h-3.5 w-3.5" /> Extract Bible</Button>
              <Button size="sm" variant="ghost" onClick={() => generate(true)} className="w-full">Test mock</Button>
            </div>
          )}

          {activeJobId && (
            <div className="px-3 flex items-center gap-2 text-sm text-blue-300">
              <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              Extracting…
            </div>
          )}

          {assets.length > 0 && (
            <>
              {Object.entries(grouped).map(([type, list]) => list.length > 0 && (
                <div key={type} className="mb-4">
                  <p className="px-3 text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">{type}S</p>
                  {list.map(a => (
                    <button key={a.id} onClick={() => setSelected(a)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${selected?.id === a.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}>
                      {TYPE_ICON[type]}
                      <span className="flex-1 truncate">{a.name}</span>
                      <Badge status={artifactStatusBadge(a.approvalStatus)} label="" />
                    </button>
                  ))}
                </div>
              ))}
              <div className="px-3 mt-4">
                <Button size="sm" variant="ghost" loading={generating} onClick={() => generate(false)} className="w-full">Re-extract</Button>
              </div>
            </>
          )}
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!selected ? (
            <div className="text-zinc-500 text-sm mt-10">Select an asset from the list to view details.</div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold">{selected.name}</h2>
                <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{selected.assetType}</span>
                <Badge status={artifactStatusBadge(selected.approvalStatus)} label={selected.approvalStatus} />
                {selected.approvalStatus !== "APPROVED" && (
                  <Button size="sm" onClick={() => { approve(selected.id); setSelected({ ...selected, approvalStatus: "APPROVED" }); }}>
                    Approve
                  </Button>
                )}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-4">{selected.description}</p>
              <pre className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 text-xs text-zinc-400 overflow-auto">
                {JSON.stringify(JSON.parse(selected.attributes || "{}"), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

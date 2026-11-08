"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge, artifactStatusBadge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, User, MapPin, Package, Copy, CheckCheck, ExternalLink, Mic, Volume2, Edit2, Save, X, ArrowRight } from "lucide-react";

interface Asset { id: string; assetType: string; name: string; description: string; approvalStatus: string; attributes: string; }

const TYPE_ICON: Record<string, React.ReactNode> = {
  CHARACTER: <User className="h-3.5 w-3.5" />,
  LOCATION:  <MapPin className="h-3.5 w-3.5" />,
  PROP:      <Package className="h-3.5 w-3.5" />,
};

export default function BiblePage() {
  const routeParams = useParams();
  const projectId = (routeParams?.projectId as string) || "";
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [generating, setGenerating]   = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [selected, setSelected]       = useState<Asset | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing]           = useState(false);
  const [editName, setEditName]             = useState("");
  const [editDesc, setEditDesc]             = useState("");
  const [editFlowPrompt, setEditFlowPrompt] = useState("");
  const [editVoice, setEditVoice]           = useState("");
  const [editWardrobe, setEditWardrobe]     = useState("");
  const [editPersonality, setEditPersonality] = useState("");
  const [editAnchor, setEditAnchor]         = useState("");
  const [savingAsset, setSavingAsset]       = useState(false);

  function startEditing(a: Asset) {
    setIsEditing(true);
    setEditName(a.name);
    setEditDesc(a.description);
    let attr: any = {};
    try { attr = JSON.parse(a.attributes || "{}"); } catch {}
    setEditFlowPrompt(attr.googleFlowCharacterPrompt || a.description || "");
    setEditVoice(attr.voiceProfile || "");
    setEditWardrobe(attr.wardrobe || "");
    setEditPersonality(attr.personality || "");
    setEditAnchor(attr.consistencyAnchor || "");
  }

  async function saveAsset() {
    if (!selected) return;
    setSavingAsset(true);
    let attr: any = {};
    try { attr = JSON.parse(selected.attributes || "{}"); } catch {}
    
    attr.googleFlowCharacterPrompt = editFlowPrompt;
    attr.voiceProfile = editVoice;
    attr.wardrobe = editWardrobe;
    attr.personality = editPersonality;
    attr.consistencyAnchor = editAnchor;

    const res = await fetch(`/api/projects/${projectId}/assets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDesc,
        attributes: JSON.stringify(attr),
      }),
    });
    const d = await res.json();
    setSavingAsset(false);
    setIsEditing(false);
    if (d.data?.asset) {
      setSelected(d.data.asset);
    }
    load();
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{isEditing ? "Edit Asset" : selected.name}</h2>
                  <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{selected.assetType}</span>
                  {!isEditing && <Badge status={artifactStatusBadge(selected.approvalStatus)} label={selected.approvalStatus} />}
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEditing(selected)}
                        className="gap-1.5 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit Asset</span>
                      </Button>

                      {selected.approvalStatus !== "APPROVED" && (
                        <Button size="sm" onClick={() => { approve(selected.id); setSelected({ ...selected, approvalStatus: "APPROVED" }); }}>
                          Approve
                        </Button>
                      )}

                      <Link href={`/projects/${projectId}/storyboard`}>
                        <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                          <span>View in Storyboard</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        disabled={savingAsset}
                        onClick={saveAsset}
                        className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{savingAsset ? "Saving…" : "Save Changes"}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="text-xs text-zinc-400"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 max-w-2xl bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Asset Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full text-sm bg-black/80 text-zinc-100 border border-zinc-700 rounded-lg px-3 py-2 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Description / Core Bio</label>
                    <textarea
                      rows={3}
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      className="w-full text-xs bg-black/80 text-zinc-100 border border-zinc-700 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {selected.assetType === "CHARACTER" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-blue-400 mb-1">
                          Google Flow Character Creation Prompt (Paste into Google Flow &ldquo;Characters&rdquo; Menu)
                        </label>
                        <textarea
                          rows={4}
                          value={editFlowPrompt}
                          onChange={e => setEditFlowPrompt(e.target.value)}
                          className="w-full text-xs font-mono bg-black/80 text-zinc-100 border border-blue-500/50 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-purple-400 mb-1">
                          Voice Settings Directive (Accent, tone, cadence for Character Voice Settings)
                        </label>
                        <textarea
                          rows={2}
                          value={editVoice}
                          onChange={e => setEditVoice(e.target.value)}
                          className="w-full text-xs font-mono bg-black/80 text-zinc-100 border border-purple-500/50 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Locked Wardrobe</label>
                          <input
                            type="text"
                            value={editWardrobe}
                            onChange={e => setEditWardrobe(e.target.value)}
                            className="w-full text-xs bg-black/80 text-zinc-100 border border-zinc-700 rounded-lg px-3 py-2 focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Personality / Demeanor</label>
                          <input
                            type="text"
                            value={editPersonality}
                            onChange={e => setEditPersonality(e.target.value)}
                            className="w-full text-xs bg-black/80 text-zinc-100 border border-zinc-700 rounded-lg px-3 py-2 focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-amber-400 mb-1">Master AI Consistency Anchor</label>
                        <textarea
                          rows={2}
                          value={editAnchor}
                          onChange={e => setEditAnchor(e.target.value)}
                          className="w-full text-xs font-mono bg-black/80 text-zinc-100 border border-amber-600/40 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none leading-relaxed"
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">{selected.description}</p>
              
              {(() => {
                const attrs = JSON.parse(selected.attributes || "{}");
                const charTag = attrs.characterTag || `@${selected.name.replace(/[^a-zA-Z0-9]/g, "")}`;
                const flowPrompt = attrs.googleFlowCharacterPrompt || `${selected.name}, ${selected.description}, wearing ${attrs.wardrobe || "traditional attire"}. 8k, photorealistic cinematic portrait, soft daylight, neutral background.`;
                const voiceProfile = attrs.voiceProfile || "Authentic regional native accent, natural vocal inflection and grounded tone.";

                return (
                  <div className="space-y-4">
                    {/* Google Flow "Characters" Setup Guide (Crucial for VideoFX / Veo consistency) */}
                    {selected.assetType === "CHARACTER" && (
                      <div className="rounded-xl border border-blue-600/40 bg-blue-950/20 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-900/40">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              Google Flow Workflow
                            </span>
                            <span className="text-xs font-semibold text-zinc-200">
                              1. Create Character Model ({charTag})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.open("https://aitestkitchen.withgoogle.com/tools/video-fx", "_blank")}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded border border-blue-700/60 transition"
                          >
                            <span>Open Google Flow ↗</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed">
                          In Google Flow, characters are created first in the left sidebar under <strong className="text-blue-300">"Characters"</strong>. Name this character <strong className="text-amber-300">{selected.name}</strong> and set their voice. Once saved, every scene video prompt tags <strong className="text-blue-300">{charTag}</strong> to lock their face and voice!
                        </p>

                        {/* Character Generation Prompt */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-400" /> Character Creation Prompt (Paste in "Characters" Menu)
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(flowPrompt, "charPrompt")}
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 font-semibold transition"
                            >
                              {copiedField === "charPrompt" ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedField === "charPrompt" ? "Copied Prompt!" : "Copy Character Prompt"}</span>
                            </button>
                          </div>
                          <pre className="text-xs text-zinc-300 bg-black/60 p-3 rounded-lg border border-blue-900/40 font-mono whitespace-pre-wrap leading-relaxed">
                            {flowPrompt}
                          </pre>
                        </div>

                        {/* Voice Directive */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                              <Mic className="h-3 w-3 text-purple-400" /> Voice Settings Directive (Set in Character Voice Menu)
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(voiceProfile, "voiceProfile")}
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-semibold transition"
                            >
                              {copiedField === "voiceProfile" ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedField === "voiceProfile" ? "Copied Voice!" : "Copy Voice Settings"}</span>
                            </button>
                          </div>
                          <p className="text-xs text-purple-200/90 bg-purple-950/40 p-2.5 rounded-lg border border-purple-800/40 font-mono leading-relaxed">
                            {voiceProfile}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Master Character Consistency Anchor */}
                    {attrs.consistencyAnchor && (
                      <div className="rounded-xl border border-amber-600/40 bg-amber-950/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Master AI Video Consistency Anchor
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(attrs.consistencyAnchor, "anchor")}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold transition"
                          >
                            {copiedField === "anchor" ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedField === "anchor" ? "Copied Anchor!" : "Copy Anchor"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-amber-200/90 leading-relaxed font-mono bg-black/50 p-3 rounded-lg border border-amber-800/40">
                          {attrs.consistencyAnchor}
                        </p>
                      </div>
                    )}

                    {/* Wardrobe & Attributes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {attrs.wardrobe && (
                        <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Locked Wardrobe</span>
                          <p className="text-xs text-zinc-300 mt-1">{attrs.wardrobe}</p>
                        </div>
                      )}
                      {attrs.personality && (
                        <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Personality & Posture</span>
                          <p className="text-xs text-zinc-300 mt-1">{attrs.personality}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

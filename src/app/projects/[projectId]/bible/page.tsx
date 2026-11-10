"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { ProjectWorkflowNav } from "@/components/nav/ProjectWorkflowNav";
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
  const [project, setProject]         = useState<any>(null);
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
    const [bRes, pRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/bible`).then(r => r.json()),
      fetch(`/api/projects/${projectId}`).then(r => r.json()).catch(() => null),
    ]);
    setAssets(bRes.data?.assets ?? []);
    if (pRes?.data?.project) setProject(pRes.data.project);
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
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Global Film Production 5-Step Workflow Nav */}
        <ProjectWorkflowNav
          projectId={projectId}
          activeStep="assets"
          projectTitle={project?.title}
          visualStyle={project?.visualStyle}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto py-6 px-3 shadow-xs">
          <div className="px-3 mb-4 text-xs text-slate-500 flex gap-1 items-center font-medium">
            <Link href={`/projects/${projectId}`} className="hover:text-slate-800">Project</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-slate-900 font-bold">Production Bible</span>
          </div>

          {assets.length === 0 && !activeJobId && (
            <div className="px-3 space-y-3">
              <p className="text-sm text-slate-600">Extract characters, locations, and props from your approved screenplay.</p>
              {error && <p className="text-rose-600 text-xs font-medium">{error}</p>}
              <Button size="sm" loading={generating} onClick={() => generate(false)} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Extract Bible
              </Button>
              <Button size="sm" variant="ghost" onClick={() => generate(true)} className="w-full text-slate-600">Test mock</Button>
            </div>
          )}

          {activeJobId && (
            <div className="px-3 flex items-center gap-2 text-sm text-blue-700 font-medium">
              <span className="h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              Extracting…
            </div>
          )}

          {assets.length > 0 && (
            <>
              {Object.entries(grouped).map(([type, list]) => list.length > 0 && (
                <div key={type} className="mb-4">
                  <p className="px-3 text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{type}S</p>
                  {list.map(a => (
                    <button key={a.id} onClick={() => setSelected(a)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition-all ${
                        selected?.id === a.id
                          ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200/80 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}>
                      {TYPE_ICON[type]}
                      <span className="flex-1 truncate">{a.name}</span>
                      <Badge status={artifactStatusBadge(a.approvalStatus)} label="" />
                    </button>
                  ))}
                </div>
              ))}
              <div className="px-3 mt-4">
                <Button size="sm" variant="ghost" loading={generating} onClick={() => generate(false)} className="w-full text-slate-600 hover:text-slate-900">
                  Re-extract
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/40">
          {!selected ? (
            <div className="text-slate-400 text-sm mt-10">Select an asset from the list to view details.</div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{isEditing ? "Edit Asset" : selected.name}</h2>
                  <span className="text-xs bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-700 font-semibold">{selected.assetType}</span>
                  {!isEditing && <Badge status={artifactStatusBadge(selected.approvalStatus)} label={selected.approvalStatus} />}
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEditing(selected)}
                        className="gap-1.5 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>Edit Asset</span>
                      </Button>

                      {selected.approvalStatus !== "APPROVED" && (
                        <Button size="sm" onClick={() => { approve(selected.id); setSelected({ ...selected, approvalStatus: "APPROVED" }); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                          Approve
                        </Button>
                      )}

                      <Link href={`/projects/${projectId}/storyboard`}>
                        <Button size="sm" variant="secondary" className="gap-1.5 text-xs bg-white border-slate-200 shadow-2xs text-slate-800 font-semibold">
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
                        className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{savingAsset ? "Saving…" : "Save Changes"}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full text-sm bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description / Core Bio</label>
                    <textarea
                      rows={3}
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      className="w-full text-xs bg-slate-50 text-slate-900 border border-slate-300 rounded-xl p-3 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {selected.assetType === "CHARACTER" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-blue-700 mb-1">
                          Google Flow Character Creation Prompt (Paste into Google Flow &ldquo;Characters&rdquo; Menu)
                        </label>
                        <textarea
                          rows={4}
                          value={editFlowPrompt}
                          onChange={e => setEditFlowPrompt(e.target.value)}
                          className="w-full text-xs font-mono bg-blue-50/40 text-slate-900 border border-blue-300 rounded-xl p-3 focus:border-blue-500 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-700 mb-1">
                          Voice Settings Directive (Accent, tone, cadence for Character Voice Settings)
                        </label>
                        <textarea
                          rows={2}
                          value={editVoice}
                          onChange={e => setEditVoice(e.target.value)}
                          className="w-full text-xs font-mono bg-purple-50/40 text-slate-900 border border-purple-300 rounded-xl p-3 focus:border-purple-500 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Locked Wardrobe</label>
                          <input
                            type="text"
                            value={editWardrobe}
                            onChange={e => setEditWardrobe(e.target.value)}
                            className="w-full text-xs bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Personality / Demeanor</label>
                          <input
                            type="text"
                            value={editPersonality}
                            onChange={e => setEditPersonality(e.target.value)}
                            className="w-full text-xs bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-800 mb-1">Master AI Consistency Anchor</label>
                        <textarea
                          rows={2}
                          value={editAnchor}
                          onChange={e => setEditAnchor(e.target.value)}
                          className="w-full text-xs font-mono bg-amber-50/40 text-slate-900 border border-amber-300 rounded-xl p-3 focus:border-amber-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-slate-700 text-sm leading-relaxed mb-5 font-medium">{selected.description}</p>
              
              {(() => {
                const attrs = JSON.parse(selected.attributes || "{}");
                const charTag = attrs.characterTag || `@${selected.name.replace(/[^a-zA-Z0-9]/g, "")}`;
                const flowPrompt = attrs.googleFlowCharacterPrompt || `${selected.name}, ${selected.description}, wearing ${attrs.wardrobe || "traditional attire"}. 8k, photorealistic cinematic portrait, soft daylight, neutral background.`;
                const voiceProfile = attrs.voiceProfile || "Authentic regional native accent, natural vocal inflection and grounded tone.";

                return (
                  <div className="space-y-4">
                    {/* Google Flow "Characters" Setup Guide (Crucial for VideoFX / Veo consistency) */}
                    {selected.assetType === "CHARACTER" && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-3.5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-blue-200">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
                              Google Flow Workflow
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              1. Create Character Model ({charTag})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.open("https://aitestkitchen.withgoogle.com/tools/video-fx", "_blank")}
                            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs"
                          >
                            <span>Open Google Flow ↗</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          In Google Flow, characters are created first in the left sidebar under <strong className="text-blue-800">"Characters"</strong>. Name this character <strong className="text-amber-800">{selected.name}</strong> and set their voice. Once saved, every scene video prompt tags <strong className="text-blue-800">{charTag}</strong> to lock their face and voice!
                        </p>

                        {/* Character Generation Prompt */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-600" /> Character Creation Prompt (Paste in "Characters" Menu)
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(flowPrompt, "charPrompt")}
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold transition shadow-2xs"
                            >
                              {copiedField === "charPrompt" ? <CheckCheck className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedField === "charPrompt" ? "Copied Prompt!" : "Copy Character Prompt"}</span>
                            </button>
                          </div>
                          <pre className="text-xs text-slate-900 bg-white p-3.5 rounded-xl border border-blue-200 font-mono whitespace-pre-wrap leading-relaxed shadow-2xs">
                            {flowPrompt}
                          </pre>
                        </div>

                        {/* Voice Directive */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                              <Mic className="h-3 w-3 text-purple-600" /> Voice Settings Directive (Set in Character Voice Menu)
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(voiceProfile, "voiceProfile")}
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold transition shadow-2xs"
                            >
                              {copiedField === "voiceProfile" ? <CheckCheck className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedField === "voiceProfile" ? "Copied Voice!" : "Copy Voice Settings"}</span>
                            </button>
                          </div>
                          <p className="text-xs text-purple-900 bg-white p-3 rounded-xl border border-purple-200 font-mono leading-relaxed shadow-2xs">
                            {voiceProfile}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Master Character Consistency Anchor */}
                    {attrs.consistencyAnchor && (
                      <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Master AI Video Consistency Anchor
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(attrs.consistencyAnchor, "anchor")}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold transition shadow-2xs"
                          >
                            {copiedField === "anchor" ? <CheckCheck className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedField === "anchor" ? "Copied Anchor!" : "Copy Anchor"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-900 leading-relaxed font-mono bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                          {attrs.consistencyAnchor}
                        </p>
                      </div>
                    )}

                    {/* Wardrobe & Attributes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {attrs.wardrobe && (
                        <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locked Wardrobe</span>
                          <p className="text-xs text-slate-800 font-medium mt-1">{attrs.wardrobe}</p>
                        </div>
                      )}
                      {attrs.personality && (
                        <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personality &amp; Posture</span>
                          <p className="text-xs text-slate-800 font-medium mt-1">{attrs.personality}</p>
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
    </div>
    </AppShell>
  );
}

"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge, artifactStatusBadge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle, Edit2, Save, X } from "lucide-react";

interface ArtifactVersion { id: string; versionNumber: number; contentText: string; source: string; approvedAt?: string; }
interface Artifact {
  id: string; artifactType: string; approvalStatus: string;
  currentVersionId?: string; versions: ArtifactVersion[];
}

const TYPE_LABELS: Record<string, string> = {
  LOGLINE: "Logline", PREMISE: "Premise", SYNOPSIS: "Synopsis",
  OUTLINE: "Outline", CHARACTER_ARCS: "Character Arcs", SCREENPLAY: "Screenplay",
};
const ORDER = ["LOGLINE","PREMISE","SYNOPSIS","OUTLINE","CHARACTER_ARCS","SCREENPLAY"];

function formatContent(type: string, text: string) {
  if (["OUTLINE","CHARACTER_ARCS","SCREENPLAY"].includes(type)) {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch {}
  }
  return text;
}

export default function StoryStudioPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [active, setActive]       = useState<string>("LOGLINE");
  const [editing, setEditing]     = useState(false);
  const [editText, setEditText]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [approving, setApproving] = useState(false);

  async function load() {
    const r = await fetch(`/api/projects/${projectId}/story`);
    const d = await r.json();
    const list: Artifact[] = (d.data?.artifacts ?? []).sort(
      (a: Artifact, b: Artifact) => ORDER.indexOf(a.artifactType) - ORDER.indexOf(b.artifactType),
    );
    setArtifacts(list);
  }
  useEffect(() => { load(); }, [projectId]);

  const artifact = artifacts.find(a => a.artifactType === active);
  const currentVersion = artifact?.versions.find(v => v.id === artifact.currentVersionId)
    ?? artifact?.versions[artifact.versions.length - 1];

  function startEdit() {
    setEditText(currentVersion?.contentText ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    if (!artifact) return;
    setSaving(true);
    await fetch(`/api/story-artifacts/${artifact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentText: editText }),
    });
    setSaving(false);
    setEditing(false);
    load();
  }

  async function approve() {
    if (!artifact) return;
    setApproving(true);
    await fetch(`/api/story-artifacts/${artifact.id}/approve`, { method: "POST" });
    setApproving(false);
    load();
  }

  const allApproved = artifacts.length > 0 && artifacts.every(a => a.approvalStatus === "APPROVED");

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden">
        {/* Left: artifact list */}
        <div className="w-52 shrink-0 border-r border-zinc-800 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-3">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Link href={`/projects/${projectId}`} className="hover:text-zinc-300">Project</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span>Story</span>
            </div>
          </div>
          {ORDER.map(type => {
            const art = artifacts.find(a => a.artifactType === type);
            return (
              <button key={type} onClick={() => { setActive(type); setEditing(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors ${active === type ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}
              >
                {TYPE_LABELS[type]}
                {art && <Badge status={artifactStatusBadge(art.approvalStatus)} label="" />}
              </button>
            );
          })}
        </div>

        {/* Right: content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!artifact ? (
            <div className="text-zinc-500 text-sm mt-10">No story content yet.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{TYPE_LABELS[active]}</h2>
                  <Badge status={artifactStatusBadge(artifact.approvalStatus)} label={artifact.approvalStatus} />
                  {currentVersion && (
                    <span className="text-xs text-zinc-500">v{currentVersion.versionNumber} · {currentVersion.source}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!editing && artifact.approvalStatus !== "APPROVED" && (
                    <>
                      <Button variant="secondary" size="sm" onClick={startEdit}>
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" onClick={approve} loading={approving}>
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </>
                  )}
                  {editing && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /> Cancel</Button>
                      <Button size="sm" loading={saving} onClick={saveEdit}><Save className="h-3.5 w-3.5" /> Save</Button>
                    </>
                  )}
                </div>
              </div>

              {editing ? (
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full h-[calc(100vh-200px)] rounded-md border border-zinc-700 bg-zinc-950 p-4 text-sm font-mono focus:border-amber-500 focus:outline-none resize-none"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-mono leading-relaxed bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 min-h-32">
                  {currentVersion ? formatContent(active, currentVersion.contentText) : "No content yet."}
                </pre>
              )}

              {/* Version history */}
              {artifact.versions.length > 1 && !editing && (
                <div className="mt-4">
                  <p className="text-xs text-zinc-500 mb-2">Versions ({artifact.versions.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {artifact.versions.map(v => (
                      <span key={v.id} className={`text-xs px-2 py-0.5 rounded border ${v.id === artifact.currentVersionId ? "border-amber-500 text-amber-400" : "border-zinc-700 text-zinc-500"}`}>
                        v{v.versionNumber} · {v.source} {v.approvedAt ? "✓" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Approve all banner */}
          {allApproved && (
            <div className="mt-8 rounded-lg border border-emerald-700/50 bg-emerald-900/20 p-4 text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              All story artifacts approved. Ready to move to the Production Bible stage (Phase 2).
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

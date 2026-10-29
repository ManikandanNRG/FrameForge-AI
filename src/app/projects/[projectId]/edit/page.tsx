"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Play, Download, AlertCircle } from "lucide-react";
import type { Timeline, TimelineItem } from "@/lib/edit/timeline";
import { emptyTimeline, secondsToFrames } from "@/lib/edit/timeline";

interface Sequence { id: string; name: string; status: string; timelineJson: string; frameRate: number; width: number; height: number; }
interface ExportJob { id: string; status: string; outputPath?: string; outputFilename?: string; errorMessage?: string; durationSeconds?: number; }

export default function EditPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [sequence, setSequence]       = useState<Sequence | null>(null);
  const [timeline, setTimeline]       = useState<Timeline | null>(null);
  const [exports, setExports]         = useState<ExportJob[]>([]);
  const [creating, setCreating]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [building, setBuilding]       = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/projects/${projectId}/sequences`);
    const d = await r.json();
    const seqs = d.data?.sequences ?? [];
    if (seqs.length > 0) {
      const seq = seqs[0] as Sequence;
      setSequence(seq);
      try { setTimeline(JSON.parse(seq.timelineJson)); } catch { setTimeline(emptyTimeline(seq.frameRate, seq.width, seq.height)); }
      loadExports(seq.id);
    }
  }

  async function loadExports(seqId: string) {
    const r = await fetch(`/api/sequences/${seqId}/export`);
    const d = await r.json();
    setExports(d.data?.exports ?? []);
  }

  useEffect(() => { load(); }, [projectId]);

  // Poll active export job
  useEffect(() => {
    if (!exportJobId) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/jobs/${exportJobId}`);
      const d = await r.json();
      const s = d.data?.job?.status;
      if (s === "SUCCEEDED" || s === "FAILED") { clearInterval(t); setExportJobId(null); if (sequence) loadExports(sequence.id); }
    }, 3000);
    return () => clearInterval(t);
  }, [exportJobId]);

  async function createSequence() {
    setCreating(true);
    const r = await fetch(`/api/projects/${projectId}/sequences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Main sequence" }),
    });
    setCreating(false);
    if (r.ok) load();
  }

  async function saveTimeline() {
    if (!sequence || !timeline) return;
    setSaving(true);
    await fetch(`/api/sequences/${sequence.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timelineJson: JSON.stringify(timeline) }),
    });
    setSaving(false);
  }

  async function exportFilm() {
    if (!sequence) return;
    setExporting(true); setError(null);
    const r = await fetch(`/api/sequences/${sequence.id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: `${projectId}-export.mp4` }),
    });
    const d = await r.json();
    setExporting(false);
    if (r.ok) { setExportJobId(d.data.jobId); if (sequence) loadExports(sequence.id); }
    else setError(d.error?.message ?? "Export failed");
  }

  async function buildTimelineFromShots() {
    setBuilding(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/sequences/build-from-shots`, { method: "POST" });
    const d = await r.json();
    setBuilding(false);
    if (r.ok) {
      load();
    } else {
      setError(d.error?.message ?? "Failed to assemble timeline from shots");
    }
  }

  async function addClipFromFile(file: File) {
    if (!timeline || !sequence) return;
    // Temporarily add as a local path entry using an import
    alert("To add clips to the timeline: import them on the Storyboard page first, then add them here.\n\nFull drag-and-drop timeline is coming in a future update.");
  }

  const videoTrack = timeline?.tracks.find(t => t.type === "VIDEO");
  const totalFrames = videoTrack?.items.reduce((max, i) => Math.max(max, i.timelineStartFrames + (i.sourceOutFrames - i.sourceInFrames)), 0) ?? 0;
  const totalSeconds = timeline ? totalFrames / timeline.frameRate : 0;

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-5xl">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href={`/projects/${projectId}`} className="hover:text-zinc-300">Project</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Edit & Export</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit &amp; Export</h1>
          {sequence && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" loading={building} onClick={buildTimelineFromShots}>
                Sync from shots
              </Button>
              <Button variant="secondary" size="sm" loading={saving} onClick={saveTimeline}>Save</Button>
              <Button size="sm" loading={exporting} onClick={exportFilm}>
                <Play className="h-3.5 w-3.5" /> Render MP4
              </Button>
            </div>
          )}
        </div>

        {!sequence ? (
          <div className="rounded-lg border border-dashed border-zinc-700 p-12 text-center">
            <p className="text-zinc-400 mb-4">No edit sequence yet. Assemble one from your shots or create an empty one.</p>
            <div className="flex justify-center gap-3">
              <Button loading={building} onClick={buildTimelineFromShots}><Plus className="h-4 w-4" /> Assemble from shots</Button>
              <Button variant="ghost" loading={creating} onClick={createSequence}>Create empty sequence</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Timeline info */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{sequence.name}</span>
                <span className="text-zinc-500">{sequence.width}×{sequence.height} · {sequence.frameRate}fps · {totalSeconds.toFixed(1)}s</span>
              </div>
              {videoTrack && videoTrack.items.length === 0 && (
                <div className="mt-3">
                  <p className="text-zinc-400 text-sm mb-3">
                    Timeline is empty. If you generated or imported clips on the <Link href={`/projects/${projectId}/storyboard`} className="text-amber-400 underline">Storyboard</Link> page, click below to assemble them into this timeline automatically in order.
                  </p>
                  <Button size="sm" loading={building} onClick={buildTimelineFromShots}>
                    <Plus className="h-3.5 w-3.5" /> Auto-assemble clips from shots
                  </Button>
                </div>
              )}
              {videoTrack && videoTrack.items.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    {videoTrack.items.map((item, i) => {
                      const dur = (item.sourceOutFrames - item.sourceInFrames) / (timeline?.frameRate ?? 24);
                      const w = Math.max(60, dur * 30);
                      return (
                        <div key={item.id} style={{ width: w }} className="h-12 rounded bg-amber-900/60 border border-amber-700 flex items-center justify-center text-xs text-amber-300 overflow-hidden px-1">
                          <span className="truncate">{item.label ?? `Clip ${i + 1}`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Add clip from local file */}
            <div className="mb-4">
              <label className="cursor-pointer">
                <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) addClipFromFile(f); }} />
                <span className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 border border-dashed border-zinc-700 rounded-md px-4 py-2">
                  <Plus className="h-4 w-4" /> Add clip to timeline
                </span>
              </label>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-800 bg-rose-900/20 p-3 text-sm text-rose-300">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Export history */}
            {exports.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Exports</h3>
                <div className="space-y-2">
                  {exports.map(ex => (
                    <div key={ex.id} className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={ex.status === "SUCCEEDED" ? "text-emerald-400" : ex.status === "FAILED" ? "text-rose-400" : "text-zinc-400"}>
                          {ex.status === "RENDERING" && <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />}
                          {ex.status}
                        </span>
                        {ex.outputFilename && <span className="text-zinc-400 font-mono text-xs">{ex.outputFilename}</span>}
                        {ex.durationSeconds && <span className="text-zinc-500 text-xs">{ex.durationSeconds.toFixed(1)}s</span>}
                      </div>
                      {ex.outputPath && ex.status === "SUCCEEDED" && (
                        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">{ex.outputPath}</p>
                      )}
                      {ex.errorMessage && <p className="mt-1 text-xs text-rose-400">{ex.errorMessage}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

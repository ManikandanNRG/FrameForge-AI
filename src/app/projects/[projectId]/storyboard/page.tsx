"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge, artifactStatusBadge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, Upload, Check, Image as ImageIcon, Video, AlertCircle } from "lucide-react";

interface ShotMedia {
  id: string; kind: string; versionNumber: number; filename: string;
  storagePath: string; mimeType: string; approvalStatus: string;
  width?: number; height?: number; durationSeconds?: number; provenance: string;
}
interface Shot {
  id: string; shotNumber: number; actionDescription: string; shotSize?: string;
  imagePrompt?: string; videoPrompt?: string; approvalStatus: string;
  targetDurationSeconds: number; mediaVersions: ShotMedia[];
}
interface Scene { id: string; sceneNumber: number; heading: string; shots: Shot[]; }

function mediaUrl(p: string) {
  return `/api/media/file?path=${encodeURIComponent(p)}`;
}

export default function StoryboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [scenes, setScenes]               = useState<Scene[]>([]);
  const [generating, setGenerating]       = useState(false);
  const [genImages, setGenImages]         = useState(false);
  const [genVideos, setGenVideos]         = useState(false);
  const [activeJobId, setActiveJobId]     = useState<string | null>(null);
  const [imageJobIds, setImageJobIds]     = useState<string[]>([]);
  const [videoJobIds, setVideoJobIds]     = useState<string[]>([]);
  const [error, setError]                 = useState<string | null>(null);
  const [selected, setSelected]           = useState<Shot | null>(null);
  const [importing, setImporting]         = useState<string | null>(null);
  const [imgProgress, setImgProgress]     = useState<{ done: number; total: number } | null>(null);
  const [vidProgress, setVidProgress]     = useState<{ done: number; total: number } | null>(null);

  async function load() {
    const r = await fetch(`/api/projects/${projectId}/shots`);
    const d = await r.json();
    setScenes(d.data?.scenes ?? []);
    // Refresh selected shot
    if (selected) {
      const allShots = (d.data?.scenes ?? []).flatMap((s: Scene) => s.shots);
      const fresh = allShots.find((sh: Shot) => sh.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  // Poll shot-plan job
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

  // Poll image generation jobs
  useEffect(() => {
    if (imageJobIds.length === 0) return;
    const t = setInterval(async () => {
      const results = await Promise.all(
        imageJobIds.map(id => fetch(`/api/jobs/${id}`).then(r => r.json())),
      );
      const statuses = results.map(d => d.data?.job?.status as string);
      const done = statuses.filter(s => s === "SUCCEEDED" || s === "FAILED").length;
      setImgProgress({ done, total: imageJobIds.length });
      if (done === imageJobIds.length) {
        clearInterval(t);
        setImageJobIds([]);
        setImgProgress(null);
        setGenImages(false);
        load();
      }
    }, 3000);
    return () => clearInterval(t);
  }, [imageJobIds]);

  // Poll video generation jobs
  useEffect(() => {
    if (videoJobIds.length === 0) return;
    const t = setInterval(async () => {
      const results = await Promise.all(
        videoJobIds.map(id => fetch(`/api/jobs/${id}`).then(r => r.json())),
      );
      const statuses = results.map(d => d.data?.job?.status as string);
      const done = statuses.filter(s => s === "SUCCEEDED" || s === "FAILED").length;
      setVidProgress({ done, total: videoJobIds.length });
      if (done === videoJobIds.length) {
        clearInterval(t);
        setVideoJobIds([]);
        setVidProgress(null);
        setGenVideos(false);
        load();
      }
    }, 5000);
    return () => clearInterval(t);
  }, [videoJobIds]);

  async function generateShotPlan(useMock = false) {
    setGenerating(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/shots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useMock }),
    });
    const d = await r.json();
    setGenerating(false);
    if (r.ok) setActiveJobId(d.data.jobId);
    else setError(d.error?.message ?? "Failed");
  }

  async function generateImages() {
    setGenImages(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/shots/generate-images`, { method: "POST" });
    const d = await r.json();
    if (r.ok) {
      if (d.data.queued === 0) { setGenImages(false); setError(d.data.message); return; }
      setImageJobIds(d.data.jobIds ?? []);
      setImgProgress({ done: 0, total: d.data.queued });
    } else {
      setGenImages(false);
      setError(d.error?.message ?? "Failed to start image generation");
    }
  }

  async function generateVideos() {
    setGenVideos(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/shots/generate-videos`, { method: "POST" });
    const d = await r.json();
    if (r.ok) {
      if (d.data.queued === 0) { setGenVideos(false); setError(d.data.message); return; }
      setVideoJobIds(d.data.jobIds ?? []);
      setVidProgress({ done: 0, total: d.data.queued });
    } else {
      setGenVideos(false);
      setError(d.error?.message ?? "Failed to start video generation");
    }
  }

  async function importVideo(shotId: string, file: File) {
    setImporting(shotId);
    const form = new FormData();
    form.append("file", file);
    const r = await fetch(`/api/projects/${projectId}/shots/${shotId}/import`, { method: "POST", body: form });
    const d = await r.json();
    setImporting(null);
    if (r.ok) load();
    else setError(d.error?.message ?? "Import failed");
  }

  async function approveShot(shotId: string) {
    await fetch(`/api/projects/${projectId}/shots/${shotId}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    load();
  }

  const allShots = scenes.flatMap(s => s.shots);
  const approvedCount     = allShots.filter(s => s.approvalStatus === "APPROVED").length;
  const hasImages         = allShots.some(s => s.mediaVersions.some(m => m.kind === "STORYBOARD_STILL"));
  const hasVideos         = allShots.some(s => s.mediaVersions.some(m => m.kind === "VIDEO_CLIP"));
  const selectedImage     = selected?.mediaVersions.find(m => m.kind === "STORYBOARD_STILL");
  const selectedVideo     = selected?.mediaVersions.find(m => m.kind === "VIDEO_CLIP");

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden">
        {/* Left: scene/shot list */}
        <div className="w-72 shrink-0 border-r border-zinc-800 overflow-y-auto py-4 px-2">
          <div className="px-3 mb-3 text-xs text-zinc-500 flex gap-1 items-center">
            <Link href={`/projects/${projectId}`} className="hover:text-zinc-300">Project</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span>Storyboard</span>
          </div>

          {/* Action bar */}
          <div className="px-3 mb-4 space-y-2">
            {scenes.length === 0 && !activeJobId && (
              <>
                <p className="text-sm text-zinc-400">Generate your shot plan from the screenplay.</p>
                {error && <p className="text-rose-400 text-xs">{error}</p>}
                <Button size="sm" loading={generating} onClick={() => generateShotPlan(false)} className="w-full">
                  <Sparkles className="h-3.5 w-3.5" /> Plan shots with AI
                </Button>
                <Button size="sm" variant="ghost" onClick={() => generateShotPlan(true)} className="w-full">
                  Test mock
                </Button>
              </>
            )}

            {activeJobId && (
              <div className="flex items-center gap-2 text-sm text-blue-300">
                <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                Planning shots…
              </div>
            )}

            {scenes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">{approvedCount}/{allShots.length} shots approved</p>

                {/* Image generation */}
                {imgProgress ? (
                  <div className="text-xs text-amber-300 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    Generating images… {imgProgress.done}/{imgProgress.total}
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" loading={genImages} onClick={generateImages} className="w-full text-xs">
                    <ImageIcon className="h-3 w-3" />
                    {hasImages ? "Regenerate images" : "Generate storyboard images"}
                  </Button>
                )}

                {/* Video generation */}
                {vidProgress ? (
                  <div className="text-xs text-purple-300 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    Generating videos… {vidProgress.done}/{vidProgress.total}
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" loading={genVideos} onClick={generateVideos} className="w-full text-xs">
                    <Video className="h-3 w-3" />
                    {hasVideos ? "Regenerate videos" : "Generate video clips (Kling)"}
                  </Button>
                )}

                {error && (
                  <div className="flex items-start gap-1.5 text-rose-400 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shot list */}
          {scenes.map(sc => (
            <div key={sc.id} className="mb-3">
              <p className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">
                Scene {sc.sceneNumber}: {sc.heading}
              </p>
              {sc.shots.map(sh => {
                const img = sh.mediaVersions.find(m => m.kind === "STORYBOARD_STILL");
                const vid = sh.mediaVersions.find(m => m.kind === "VIDEO_CLIP");
                return (
                  <button key={sh.id} onClick={() => setSelected(sh)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${selected?.id === sh.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}>
                    {/* Thumbnail */}
                    <span className="h-8 w-12 rounded overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(img.storagePath)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-3 w-3 text-zinc-600" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-zinc-600 text-xs">S{sh.shotNumber}</span>
                      <span className="block truncate text-xs">{sh.actionDescription}</span>
                    </span>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      {img && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Image ready" />}
                      {vid && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Video ready" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right: shot detail */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!selected ? (
            <div className="mt-10 text-center text-zinc-500">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
              <p className="text-sm">Select a shot to view its prompts and generated media.</p>
            </div>
          ) : (
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Shot {selected.shotNumber}</h2>
                {selected.shotSize && <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{selected.shotSize}</span>}
                <Badge status={artifactStatusBadge(selected.approvalStatus)} label={selected.approvalStatus} />
                <span className="text-xs text-zinc-500">{selected.targetDurationSeconds}s</span>
              </div>
              <p className="text-zinc-300 text-sm">{selected.actionDescription}</p>

              {/* Generated image */}
              {selectedImage && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> Generated image
                    <span className="ml-1 text-zinc-600 font-normal normal-case">({selectedImage.provenance})</span>
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(selectedImage.storagePath)}
                    alt={`Shot ${selected.shotNumber}`}
                    className="w-full rounded-lg border border-zinc-700 object-cover max-h-80"
                  />
                </div>
              )}

              {/* Generated video */}
              {selectedVideo && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase flex items-center gap-1">
                    <Video className="h-3 w-3" /> Generated video
                    <span className="ml-1 text-zinc-600 font-normal normal-case">({selectedVideo.durationSeconds?.toFixed(1)}s · {selectedVideo.provenance})</span>
                  </p>
                  <video
                    src={mediaUrl(selectedVideo.storagePath)}
                    controls
                    className="w-full rounded-lg border border-zinc-700 max-h-80"
                  />
                </div>
              )}

              {/* Image prompt */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 mb-1 uppercase">Image prompt</p>
                <pre className="whitespace-pre-wrap text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 rounded p-3">{selected.imagePrompt ?? "—"}</pre>
              </div>

              {/* Video prompt */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 mb-1 uppercase">Video prompt</p>
                <pre className="whitespace-pre-wrap text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 rounded p-3">{selected.videoPrompt ?? "—"}</pre>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <label className="cursor-pointer">
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) importVideo(selected.id, f); }} />
                  <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 ${importing === selected.id ? "opacity-50 pointer-events-none" : ""}`}>
                    <Upload className="h-3.5 w-3.5" />
                    {importing === selected.id ? "Importing…" : "Import clip manually"}
                  </span>
                </label>
                {selected.approvalStatus !== "APPROVED" && (
                  <Button size="sm" onClick={() => { approveShot(selected.id); setSelected({ ...selected, approvalStatus: "APPROVED" }); }}>
                    <Check className="h-3.5 w-3.5" /> Approve shot
                  </Button>
                )}
              </div>

              {!selectedImage && !selectedVideo && (
                <p className="text-xs text-zinc-600">
                  Use the buttons in the left panel to generate images (DALL·E 3) or video clips (Kling AI) for all shots at once.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

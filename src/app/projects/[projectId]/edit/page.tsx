"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Scissors,
  ZoomIn,
  ZoomOut,
  Download,
  AlertCircle,
  Film,
  Music,
  Mic,
  FileText,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  X,
} from "lucide-react";
import type { Timeline, TimelineItem } from "@/lib/edit/timeline";
import { emptyTimeline, secondsToFrames, framesToSeconds } from "@/lib/edit/timeline";

// --- Types ---

interface Sequence {
  id: string;
  name: string;
  status: string;
  timelineJson: string;
  frameRate: number;
  width: number;
  height: number;
}

interface ExportJob {
  id: string;
  status: string;
  outputPath?: string;
  outputFilename?: string;
  errorMessage?: string;
  durationSeconds?: number;
  createdAt: string;
}

interface ShotMedia {
  id: string;
  kind: string;
  storagePath: string;
  durationSeconds?: number | null;
  versionNumber: number;
}

interface ProjectShot {
  id: string;
  shotNumber: number;
  actionDescription: string;
  shotSize?: string | null;
  targetDurationSeconds?: number | null;
  selectedStillId?: string | null;
  selectedVideoId?: string | null;
  voiceover?: string;
  dialogue?: string;
  mediaVersions: ShotMedia[];
}

interface ProjectScene {
  id: string;
  sceneNumber: number;
  heading: string;
  shots: ProjectShot[];
}

// Format seconds into NLE timecode: HH:MM:SS:FF
function formatTimecode(seconds: number, fps = 24): string {
  const totalFrames = Math.max(0, Math.floor(seconds * fps));
  const f = totalFrames % fps;
  const totalSecs = Math.floor(totalFrames / fps);
  const s = totalSecs % 60;
  const m = Math.floor(totalSecs / 60) % 60;
  const h = Math.floor(totalSecs / 3600);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

// Generate authentic speech waveform profiles based on the shot's actual narration text
function generateSpeechWaveform(text: string, count: number): number[] {
  const clean = text?.trim() || "cinematic narrative dialogue scene audio voiceover";
  const words = clean.split(/\s+/);
  const bars: number[] = [];

  // Deterministic seed from character sum
  let seed = 0;
  for (let c = 0; c < clean.length; c++) {
    seed = (seed * 31 + clean.charCodeAt(c)) & 0xffffff;
  }

  for (let i = 0; i < count; i++) {
    const progress = i / count;
    // Word index and character weighting
    const wordIdx = Math.floor(progress * words.length);
    const word = words[wordIdx] || "beat";
    const charCode = word.charCodeAt(i % word.length) || 65;

    // Natural speech cadence: pause at start/end, syllables, pauses between words
    const envelope = Math.sin(progress * Math.PI); // Arc over phrase
    const syllablePulse = Math.abs(Math.sin((i * 1.4) + (seed % 7)));
    const isWordBreak = i % 8 === 0 || i % 9 === 0;

    let height: number;
    if (progress < 0.05 || progress > 0.95 || isWordBreak) {
      height = 12 + ((charCode + i) % 8); // Low background noise / breath
    } else {
      height = Math.floor(25 + envelope * 35 + syllablePulse * 30 + ((charCode * 3) % 15));
    }

    bars.push(Math.min(95, Math.max(12, height)));
  }
  return bars;
}

export default function NLEEditorPage() {
  const routeParams = useParams();
  const projectId = (routeParams?.projectId as string) || "";

  // Core Data
  const [sequence, setSequence]           = useState<Sequence | null>(null);
  const [timeline, setTimeline]           = useState<Timeline | null>(null);
  const [exports, setExports]             = useState<ExportJob[]>([]);
  const [projectScenes, setProjectScenes] = useState<ProjectScene[]>([]);

  // Editor State
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<"media" | "audio" | "script">("media");
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(45); // Timeline zoom
  const [currentTime, setCurrentTime]       = useState<number>(0);
  const [isPlaying, setIsPlaying]           = useState<boolean>(false);
  const [previewMode, setPreviewMode]       = useState<"timeline" | "export">("timeline");
  const [volume, setVolume]                 = useState<number>(1.0); // 0.0 to 1.0

  // Track Mute & Lock State
  const [muteV1, setMuteV1] = useState(false);
  const [muteA1, setMuteA1] = useState(false);
  const [lockV1, setLockV1] = useState(false);

  // Async Actions State
  const [saving, setSaving]           = useState(false);
  const [building, setBuilding]       = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  // Media Player References
  const videoPlayerRef   = useRef<HTMLVideoElement>(null);
  const timelineRulerRef = useRef<HTMLDivElement>(null);

  // --- 1. Load Data ---

  async function loadSequence() {
    try {
      const r = await fetch(`/api/projects/${projectId}/sequences`);
      const d = await r.json();
      const seqs = d.data?.sequences ?? [];
      if (seqs.length > 0) {
        const seq = seqs[0] as Sequence;
        setSequence(seq);
        try {
          const parsed = JSON.parse(seq.timelineJson) as Timeline;
          setTimeline(parsed);
          const vItems = parsed.tracks.find((t) => t.type === "VIDEO")?.items ?? [];
          if (vItems.length > 0 && !selectedClipId) {
            setSelectedClipId(vItems[0]!.id);
          }
        } catch {
          setTimeline(emptyTimeline(seq.frameRate, seq.width, seq.height));
        }
        await loadExports(seq.id);
      }
    } catch (e: any) {
      console.error("Failed to load sequence", e);
    }
  }

  async function loadProjectShots() {
    try {
      const r = await fetch(`/api/projects/${projectId}/shots`);
      const d = await r.json();
      if (d.data?.scenes) {
        setProjectScenes(d.data.scenes);
      }
    } catch (e: any) {
      console.error("Failed to load project shots", e);
    }
  }

  async function loadExports(seqId: string) {
    try {
      const r = await fetch(`/api/sequences/${seqId}/export`);
      const d = await r.json();
      const exps = (d.data?.exports ?? []) as ExportJob[];
      setExports(exps);
    } catch (e: any) {
      console.error("Failed to load exports", e);
    }
  }

  useEffect(() => {
    loadSequence();
    loadProjectShots();
  }, [projectId]);

  // Polling export job
  useEffect(() => {
    if (!exportJobId) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/jobs/${exportJobId}`);
        const d = await r.json();
        const s = d.data?.job?.status;
        if (s === "SUCCEEDED" || s === "FAILED") {
          clearInterval(interval);
          setExportJobId(null);
          setExporting(false);
          if (sequence) await loadExports(sequence.id);
          if (s === "SUCCEEDED") {
            setSuccessMsg("🎬 Master MP4 rendered successfully! Play or download it in the monitor.");
            setPreviewMode("export");
          } else {
            setError(d.data?.job?.errorMessage ?? "Rendering failed. Please check clips.");
          }
        }
      } catch (err) {
        console.error("Poll error", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [exportJobId, sequence]);

  // --- 2. Timeline Helpers & Calculations ---

  const fps = timeline?.frameRate || 24;
  const videoTrack = timeline?.tracks.find((t) => t.type === "VIDEO");
  const videoClips = videoTrack?.items ?? [];

  // Calculate total timeline duration in frames and seconds
  const totalFrames = videoClips.reduce((max, item) => {
    const end = item.timelineStartFrames + (item.sourceOutFrames - item.sourceInFrames);
    return Math.max(max, end);
  }, 0);
  const totalDurationSeconds = totalFrames > 0 ? totalFrames / fps : 0;

  // Flattened shots list for lookup
  const allShots = projectScenes.flatMap((scene) =>
    scene.shots.map((shot) => ({ scene, shot }))
  );

  // Find clip at current playhead time
  const currentClip = videoClips.find((item) => {
    const startSec = item.timelineStartFrames / fps;
    const endSec = startSec + (item.sourceOutFrames - item.sourceInFrames) / fps;
    return currentTime >= startSec && currentTime < endSec;
  }) || (videoClips.length > 0 ? videoClips[0] : null);

  // Selected clip object
  const selectedClip = videoClips.find((i) => i.id === selectedClipId) || currentClip;
  const selectedShotContext = allShots.find(
    (s) =>
      s.shot.mediaVersions.some((m) => m.storagePath === selectedClip?.storagePath) ||
      selectedClip?.label?.includes(`Scene ${s.scene.sceneNumber} · Shot ${s.shot.shotNumber}`)
  );

  // Latest succeeded master film export
  const latestExport = exports.find((e) => e.status === "SUCCEEDED" && e.outputPath);

  // Active video source for the cinema monitor
  const activeVideoUrl =
    previewMode === "export" && latestExport?.outputPath
      ? `/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`
      : selectedClip?.storagePath
      ? `/api/media/file?path=${encodeURIComponent(selectedClip.storagePath)}`
      : null;

  // --- 3. Native Video & Audio Playback Sync ---

  // Toggle Play / Pause with native audio output
  const togglePlay = useCallback(() => {
    const vid = videoPlayerRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.muted = muteV1 || muteA1;
      vid.volume = volume;
      vid.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Video playback requires interaction:", err));
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [muteV1, muteA1, volume]);

  // Synchronize native video timeupdate with timeline playhead
  function handleVideoTimeUpdate() {
    const vid = videoPlayerRef.current;
    if (!vid || !currentClip) return;

    const localTime = vid.currentTime;
    const clipInSec = currentClip.sourceInFrames / fps;
    const clipOutSec = currentClip.sourceOutFrames / fps;

    // Check if clip reached its out-point trim
    if (localTime >= clipOutSec - 0.05) {
      advanceToNextClip();
      return;
    }

    const clipStartSec = currentClip.timelineStartFrames / fps;
    const globalTime = clipStartSec + Math.max(0, localTime - clipInSec);
    setCurrentTime(globalTime);
  }

  // Smoothly advance to the next clip in timeline sequence when current clip finishes
  function advanceToNextClip() {
    const currentIndex = videoClips.findIndex((i) => i.id === currentClip?.id);
    if (currentIndex >= 0 && currentIndex < videoClips.length - 1) {
      const nextClip = videoClips[currentIndex + 1]!;
      setSelectedClipId(nextClip.id);
      const nextStartSec = nextClip.timelineStartFrames / fps;
      setCurrentTime(nextStartSec);

      // Give browser a microtask to switch source and continue playing audio & video
      setTimeout(() => {
        const vid = videoPlayerRef.current;
        if (vid && isPlaying) {
          vid.currentTime = nextClip.sourceInFrames / fps;
          vid.play().catch(() => {});
        }
      }, 50);
    } else {
      // Reached the end of the entire timeline
      setIsPlaying(false);
      setCurrentTime(0);
      if (videoClips.length > 0) {
        setSelectedClipId(videoClips[0]!.id);
      }
    }
  }

  // Seek playhead to specific seconds
  function seekToTime(timeSec: number) {
    const clampedTime = Math.max(0, Math.min(totalDurationSeconds, timeSec));
    setCurrentTime(clampedTime);

    // Find which clip covers this time
    const targetClip = videoClips.find((item) => {
      const s = item.timelineStartFrames / fps;
      const e = s + (item.sourceOutFrames - item.sourceInFrames) / fps;
      return clampedTime >= s && clampedTime < e;
    });

    if (targetClip) {
      setSelectedClipId(targetClip.id);
      const vid = videoPlayerRef.current;
      if (vid) {
        const clipStartSec = targetClip.timelineStartFrames / fps;
        const inSec = targetClip.sourceInFrames / fps;
        const offset = Math.max(0, clampedTime - clipStartSec) + inSec;
        vid.currentTime = offset;
      }
    }
  }

  // Sync volume & mute changes directly onto the HTML5 video element
  useEffect(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.muted = muteV1 || muteA1;
      videoPlayerRef.current.volume = volume;
    }
  }, [muteV1, muteA1, volume]);

  // Keyboard Shortcuts: Space (Play/Pause), Delete/Backspace (Delete selected scene)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedClipId, togglePlay]);

  // --- 4. Timeline Editing Actions ---

  // Save timeline directly to backend
  async function persistTimeline(newTimeline: Timeline) {
    if (!sequence) return;
    setSaving(true);
    try {
      await fetch(`/api/sequences/${sequence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineJson: JSON.stringify(newTimeline) }),
      });
    } catch (e) {
      console.error("Save error", e);
    } finally {
      setSaving(false);
    }
  }

  // Recalculate sequential start frames for all items
  function recalculateTrack(items: TimelineItem[]): TimelineItem[] {
    let cursor = 0;
    return items.map((item) => {
      const dur = item.sourceOutFrames - item.sourceInFrames;
      const updated = { ...item, timelineStartFrames: cursor };
      cursor += dur;
      return updated;
    });
  }

  // DELETE SCENE: Permanently remove a scene from the timeline sequence
  function handleDeleteClip(clipId: string) {
    if (!timeline) return;
    const clipToRemove = videoClips.find((i) => i.id === clipId);
    const clipLabel = clipToRemove?.label || "Scene";

    const remaining = videoClips.filter((i) => i.id !== clipId);
    const recalculated = recalculateTrack(remaining);

    const newTracks = timeline.tracks.map((t) =>
      t.type === "VIDEO" ? { ...t, items: recalculated } : t
    );
    const updated = { ...timeline, tracks: newTracks };
    setTimeline(updated);

    // Auto-select adjacent clip or reset
    const nextSelected = recalculated.length > 0 ? recalculated[0]!.id : null;
    setSelectedClipId(nextSelected);

    persistTimeline(updated);
    setSuccessMsg(`🗑️ Removed "${clipLabel}" from timeline.`);
  }

  // TOGGLE SCENE ACTIVE / MUTED (Disable without deleting)
  function handleToggleClipMute(clipId: string) {
    if (!timeline) return;
    const updatedItems = videoClips.map((item) => {
      if (item.id === clipId) {
        const newVolume = (item.volume ?? 1) > 0 ? 0 : 1;
        return { ...item, volume: newVolume };
      }
      return item;
    });

    const newTracks = timeline.tracks.map((t) =>
      t.type === "VIDEO" ? { ...t, items: updatedItems } : t
    );
    const updated = { ...timeline, tracks: newTracks };
    setTimeline(updated);
    persistTimeline(updated);
  }

  // Split clip at current playhead position (CapCut Blade tool)
  function handleSplitClip() {
    if (!timeline || !selectedClip) return;
    const clipStartSec = selectedClip.timelineStartFrames / fps;
    const clipDurSec = (selectedClip.sourceOutFrames - selectedClip.sourceInFrames) / fps;
    const splitOffsetSec = currentTime - clipStartSec;

    if (splitOffsetSec <= 0.3 || splitOffsetSec >= clipDurSec - 0.3) {
      setError("Place the playhead inside the clip (at least 0.3s from edges) to split.");
      return;
    }

    const splitFrameOffset = secondsToFrames(splitOffsetSec, fps);

    // Part A: from sourceIn to splitFrame
    const partA: TimelineItem = {
      ...selectedClip,
      sourceOutFrames: selectedClip.sourceInFrames + splitFrameOffset,
    };

    // Part B: from splitFrame to sourceOut
    const partB: TimelineItem = {
      ...selectedClip,
      id: "clip_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      timelineStartFrames: selectedClip.timelineStartFrames + splitFrameOffset,
      sourceInFrames: selectedClip.sourceInFrames + splitFrameOffset,
      sourceOutFrames: selectedClip.sourceOutFrames,
      label: `${selectedClip.label || "Clip"} (Part 2)`,
    };

    const newItems: TimelineItem[] = [];
    for (const item of videoClips) {
      if (item.id === selectedClip.id) {
        newItems.push(partA, partB);
      } else {
        newItems.push(item);
      }
    }

    const recalculated = recalculateTrack(newItems);
    const newTracks = timeline.tracks.map((t) =>
      t.type === "VIDEO" ? { ...t, items: recalculated } : t
    );
    const updated = { ...timeline, tracks: newTracks };
    setTimeline(updated);
    setSelectedClipId(partB.id);
    persistTimeline(updated);
    setSuccessMsg(`✂️ Split clip into 2 segments at ${currentTime.toFixed(2)}s`);
  }

  // Trim In/Out of selected clip
  function handleTrim(deltaSeconds: number, target: "in" | "out") {
    if (!timeline || !selectedClip) return;
    const deltaFrames = secondsToFrames(deltaSeconds, fps);

    let newIn = selectedClip.sourceInFrames;
    let newOut = selectedClip.sourceOutFrames;

    if (target === "in") {
      newIn = Math.max(0, newIn + deltaFrames);
      if (newIn >= newOut - fps * 0.5) return;
    } else {
      newOut = Math.max(newIn + fps * 0.5, newOut + deltaFrames);
    }

    const updatedItems = videoClips.map((item) =>
      item.id === selectedClip.id
        ? { ...item, sourceInFrames: newIn, sourceOutFrames: newOut }
        : item
    );

    const recalculated = recalculateTrack(updatedItems);
    const newTracks = timeline.tracks.map((t) =>
      t.type === "VIDEO" ? { ...t, items: recalculated } : t
    );
    const updated = { ...timeline, tracks: newTracks };
    setTimeline(updated);
    persistTimeline(updated);
  }

  // Reorder clip (move left or right)
  function handleMoveClip(direction: -1 | 1) {
    if (!timeline || !selectedClip) return;
    const idx = videoClips.findIndex((i) => i.id === selectedClip.id);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= videoClips.length) return;

    const newItems = [...videoClips];
    const [moved] = newItems.splice(idx, 1);
    newItems.splice(targetIdx, 0, moved!);

    const recalculated = recalculateTrack(newItems);
    const newTracks = timeline.tracks.map((t) =>
      t.type === "VIDEO" ? { ...t, items: recalculated } : t
    );
    const updated = { ...timeline, tracks: newTracks };
    setTimeline(updated);
    persistTimeline(updated);
  }

  // Add a shot from Library into Timeline
  function addShotToTimeline(scene: ProjectScene, shot: ProjectShot) {
    if (!timeline) return;
    const videoMedia =
      shot.mediaVersions.find((m) => m.id === shot.selectedVideoId) ||
      shot.mediaVersions.find((m) => m.kind === "VIDEO_CLIP");

    if (!videoMedia) {
      alert("This shot doesn't have an animated video yet. Generate or import one in the Storyboard first.");
      return;
    }

    const durSecs = videoMedia.durationSeconds || shot.targetDurationSeconds || 5;
    const durFrames = secondsToFrames(durSecs, fps);

    const newItem: TimelineItem = {
      id: "clip_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      mediaId: videoMedia.id,
      storagePath: videoMedia.storagePath,
      timelineStartFrames: totalFrames,
      sourceInFrames: 0,
      sourceOutFrames: durFrames,
      layer: 0,
      transitionIn: null,
      transitionOut: null,
      transitionDurationFrames: 0,
      volume: 1,
      label: `Scene ${scene.sceneNumber} · Shot ${shot.shotNumber}`,
    };

    const newTracks = timeline.tracks.map((t) =>
      t.type === "VIDEO" ? { ...t, items: [...t.items, newItem] } : t
    );
    const updated = { ...timeline, tracks: newTracks };
    setTimeline(updated);
    setSelectedClipId(newItem.id);
    persistTimeline(updated);
    setSuccessMsg(`+ Added Scene ${scene.sceneNumber}·Shot ${shot.shotNumber} to timeline`);
  }

  // Auto-assemble from all storyboard shots
  async function handleSyncFromShots() {
    setBuilding(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/sequences/build-from-shots`, { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        await loadSequence();
        await loadProjectShots();
        setSuccessMsg(`⚡ Auto-assembled ${d.data?.clipsAdded ?? "all"} scene video clips into the timeline!`);
      } else {
        setError(d.error?.message ?? "Failed to assemble sequence.");
      }
    } catch (err: any) {
      setError(err.message ?? "Assemble error");
    } finally {
      setBuilding(false);
    }
  }

  // Render Master MP4
  async function handleExportFilm() {
    if (!sequence || !timeline || videoClips.length === 0) {
      setError("Timeline has no video clips. Add or sync scenes first.");
      return;
    }
    setExporting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await fetch(`/api/sequences/${sequence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineJson: JSON.stringify(timeline) }),
      });

      const r = await fetch(`/api/sequences/${sequence.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: `master_film_${Date.now()}.mp4` }),
      });
      const d = await r.json();

      if (r.ok) {
        setExportJobId(d.data.jobId);
        await loadExports(sequence.id);
      } else {
        setExporting(false);
        setError(d.error?.message ?? "Render export failed to start");
      }
    } catch (err: any) {
      setExporting(false);
      setError(err.message ?? "Export request failed");
    }
  }

  // Handle timeline ruler scrub click
  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!timelineRulerRef.current) return;
    const rect = timelineRulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, Math.min(totalDurationSeconds, clickX / pixelsPerSecond));
    seekToTime(clickedTime);
  }

  // Ticks for time ruler (every 1s, major labels every 5s)
  const rulerTicks = [];
  const maxRulerSecs = Math.max(totalDurationSeconds + 10, 60);
  for (let s = 0; s <= maxRulerSecs; s += 1) {
    rulerTicks.push(s);
  }

  return (
    <AppShell>
      {/* Full-Height Desktop NLE Workspace (CapCut / Premiere Pro Studio Theme) */}
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-[#111215] text-zinc-200 select-none overflow-hidden font-sans">

        {/* 1. TOP STUDIO HEADER */}
        <header className="h-12 bg-[#18191d] border-b border-[#26282f] px-4 flex items-center justify-between shrink-0">
          {/* Left: Breadcrumbs & Project Name */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href={`/projects/${projectId}/storyboard`}
              className="text-zinc-400 hover:text-amber-400 transition flex items-center gap-1 font-medium"
            >
              <Film className="h-3.5 w-3.5 text-amber-500" /> Storyboard
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              NLE Video Editor &amp; Timeline
            </span>
            <span className="bg-[#242730] border border-[#313540] text-zinc-400 text-[10px] px-2 py-0.5 rounded font-mono">
              {sequence ? `${sequence.width}×${sequence.height} · ${sequence.frameRate}fps` : "1080p 24fps"}
            </span>
          </div>

          {/* Center: Live Timecode readout */}
          <div className="flex items-center gap-2 bg-[#0e0f12] px-3 py-1 rounded-md border border-[#26282f] font-mono text-xs">
            <span className="text-cyan-400 font-bold">{formatTimecode(currentTime, fps)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{formatTimecode(totalDurationSeconds, fps)}</span>
          </div>

          {/* Right: Actions (Sync, Save, Export Master MP4) */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={building}
              onClick={handleSyncFromShots}
              className="h-7 text-xs bg-[#242730] hover:bg-[#2e323e] border-[#313540] text-zinc-300"
              title="Automatically assemble all generated shots into order"
            >
              <RefreshCw className="h-3 w-3 text-zinc-400" />
              Sync from Storyboard
            </Button>

            <Button
              variant="secondary"
              size="sm"
              loading={saving}
              onClick={() => timeline && persistTimeline(timeline)}
              className="h-7 text-xs bg-[#242730] hover:bg-[#2e323e] border-[#313540] text-zinc-300"
            >
              Save
            </Button>

            <Button
              size="sm"
              loading={exporting || !!exportJobId}
              onClick={handleExportFilm}
              className="h-7 text-xs bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold px-3 shadow-md shadow-amber-500/10"
            >
              <Download className="h-3 w-3 fill-current" />
              Export Film (MP4)
            </Button>
          </div>
        </header>

        {/* Global Notifications */}
        {error && (
          <div className="bg-rose-950/80 border-b border-rose-800 text-rose-300 px-4 py-1.5 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 px-4 py-1.5 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
          </div>
        )}

        {/* 2. MIDDLE SECTION: 3-PANEL STUDIO DESKTOP (Library 30% | Cinema Monitor 45% | Inspector 25%) */}
        <div className="flex-1 flex overflow-hidden min-h-[360px] max-h-[55vh] border-b border-[#26282f]">

          {/* LEFT PANEL: Media Pool & Assets Library (CapCut Style) */}
          <aside className="w-[30%] min-w-[280px] max-w-[380px] bg-[#16171b] border-r border-[#26282f] flex flex-col overflow-hidden">
            {/* Library Tabs */}
            <div className="h-10 bg-[#141518] border-b border-[#26282f] px-2 flex items-center gap-1 shrink-0 text-xs">
              <button
                onClick={() => setActiveTab("media")}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                  activeTab === "media"
                    ? "bg-[#252830] text-cyan-400 border border-[#363a46]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Film className="h-3.5 w-3.5" /> Media ({allShots.length})
              </button>

              <button
                onClick={() => setActiveTab("audio")}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                  activeTab === "audio"
                    ? "bg-[#252830] text-cyan-400 border border-[#363a46]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Music className="h-3.5 w-3.5" /> Audio ({allShots.length})
              </button>

              <button
                onClick={() => setActiveTab("script")}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                  activeTab === "script"
                    ? "bg-[#252830] text-cyan-400 border border-[#363a46]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Screenplay
              </button>
            </div>

            {/* Library Content Grid */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {activeTab === "media" && (
                <div className="grid grid-cols-2 gap-2">
                  {allShots.map(({ scene, shot }) => {
                    const videoMedia =
                      shot.mediaVersions.find((m) => m.id === shot.selectedVideoId) ||
                      shot.mediaVersions.find((m) => m.kind === "VIDEO_CLIP");
                    const stillMedia =
                      shot.mediaVersions.find((m) => m.id === shot.selectedStillId) ||
                      shot.mediaVersions.find((m) => m.kind === "STORYBOARD_STILL");

                    const thumbSrc = stillMedia?.storagePath || videoMedia?.storagePath;
                    const dur = videoMedia?.durationSeconds || shot.targetDurationSeconds || 5;
                    const isAdded = videoClips.some(
                      (item) => item.storagePath === videoMedia?.storagePath
                    );

                    return (
                      <div
                        key={shot.id}
                        className="group relative bg-[#1c1d22] border border-[#2b2d36] rounded-lg overflow-hidden flex flex-col hover:border-cyan-500/60 transition cursor-pointer"
                        onClick={() => {
                          if (videoMedia) {
                            const foundItem = videoClips.find(
                              (i) => i.storagePath === videoMedia.storagePath
                            );
                            if (foundItem) {
                              setSelectedClipId(foundItem.id);
                              seekToTime(foundItem.timelineStartFrames / fps);
                            }
                          }
                        }}
                      >
                        {/* Thumbnail View */}
                        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                          {thumbSrc ? (
                            <img
                              src={`/api/media/file?path=${encodeURIComponent(thumbSrc)}`}
                              alt={`S${scene.sceneNumber}S${shot.shotNumber}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <Film className="h-6 w-6 text-zinc-600" />
                          )}

                          {/* Duration Badge */}
                          <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono px-1 rounded text-zinc-300">
                            00:{String(Math.floor(dur)).padStart(2, "0")}
                          </div>

                          {/* "Added" Badge */}
                          {isAdded && (
                            <div className="absolute top-1 left-1 bg-emerald-950/90 border border-emerald-600 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Added
                            </div>
                          )}

                          {/* Hover Action: Add to timeline */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addShotToTimeline(scene, shot);
                              }}
                              className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1"
                              title="Add to Timeline"
                            >
                              <Plus className="h-3 w-3" /> Insert
                            </button>
                          </div>
                        </div>

                        {/* Title Bar */}
                        <div className="p-1.5 bg-[#17181d] border-t border-[#26282f] flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-zinc-200 truncate">
                            S{scene.sceneNumber}·Shot {shot.shotNumber}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {videoMedia ? "Video" : "Still"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "audio" && (
                <div className="space-y-2">
                  {allShots.map(({ scene, shot }) => (
                    <div
                      key={shot.id}
                      className="bg-[#1c1d22] border border-[#2b2d36] rounded-lg p-2 flex items-center justify-between text-xs hover:border-cyan-500/50 transition cursor-pointer"
                      onClick={() => {
                        const foundItem = videoClips.find(
                          (i) => i.label?.includes(`Scene ${scene.sceneNumber} · Shot ${shot.shotNumber}`)
                        );
                        if (foundItem) {
                          setSelectedClipId(foundItem.id);
                          seekToTime(foundItem.timelineStartFrames / fps);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="h-7 w-7 rounded bg-teal-950/60 border border-teal-800 flex items-center justify-center text-teal-400 shrink-0">
                          <Mic className="h-3.5 w-3.5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-zinc-200 truncate">
                            Scene {scene.sceneNumber} · Narration VO
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate italic">
                            "{shot.voiceover || shot.dialogue || shot.actionDescription}"
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-teal-400 shrink-0 ml-2 font-mono">VO Ready</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "script" && (
                <div className="space-y-3 text-xs">
                  {projectScenes.map((scene) => (
                    <div key={scene.id} className="bg-[#1c1d22] border border-[#2b2d36] rounded-lg p-2.5">
                      <p className="font-bold text-amber-400 text-xs uppercase mb-1">
                        Scene {scene.sceneNumber}: {scene.heading}
                      </p>
                      <div className="space-y-1.5 pl-2 border-l border-zinc-700">
                        {scene.shots.map((shot) => (
                          <div key={shot.id} className="text-zinc-300">
                            <span className="text-zinc-500 font-mono text-[11px]">Shot {shot.shotNumber}: </span>
                            {shot.actionDescription}
                            {shot.voiceover && (
                              <p className="text-cyan-300 text-[11px] mt-0.5 italic">
                                VO: "{shot.voiceover}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* CENTER PANEL: Cinema Monitor / Viewport (CapCut Style) */}
          <main className="flex-1 bg-[#0c0d0f] flex flex-col items-center justify-between p-3 overflow-hidden relative">
            {/* Monitor Header */}
            <div className="w-full flex items-center justify-between text-xs text-zinc-400 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-medium">Monitor:</span>
                <button
                  onClick={() => setPreviewMode("timeline")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    previewMode === "timeline"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Live Timeline Preview
                </button>
                {latestExport && (
                  <button
                    onClick={() => setPreviewMode("export")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      previewMode === "export"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    🎬 Master Film Export
                  </button>
                )}
              </div>

              {/* Volume & Audio Slider on Monitor */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#181a20] px-2 py-0.5 rounded border border-[#26282f]">
                  <button
                    onClick={() => setMuteA1(!muteA1)}
                    className="text-zinc-400 hover:text-zinc-200"
                    title={muteA1 ? "Unmute VO Audio" : "Mute VO Audio"}
                  >
                    {muteA1 || volume === 0 ? (
                      <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-teal-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={muteA1 ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      if (muteA1) setMuteA1(false);
                    }}
                    className="w-16 h-1 bg-zinc-700 accent-teal-400 rounded cursor-pointer"
                    title="Volume"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 w-6">
                    {muteA1 ? "0%" : `${Math.round(volume * 100)}%`}
                  </span>
                </div>

                {latestExport?.outputPath && (
                  <a
                    href={`/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`}
                    download={latestExport.outputFilename || "master-film.mp4"}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline"
                  >
                    <Download className="h-3 w-3" /> Download MP4 ({latestExport.durationSeconds?.toFixed(1) || totalDurationSeconds.toFixed(1)}s)
                  </a>
                )}
              </div>
            </div>

            {/* Video Canvas Box */}
            <div className="relative w-full flex-1 flex items-center justify-center bg-black rounded-lg border border-[#21232b] overflow-hidden shadow-2xl">
              {activeVideoUrl ? (
                <video
                  ref={videoPlayerRef}
                  src={activeVideoUrl}
                  playsInline
                  className="max-h-full max-w-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={advanceToNextClip}
                />
              ) : (
                <div className="text-center p-6 text-zinc-600">
                  <Film className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No video clip active. Sync from Storyboard or click a clip to preview.</p>
                </div>
              )}
            </div>

            {/* Monitor Control Bar (Playhead transport controls) */}
            <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-[#1c1e24] text-xs">
              <span className="font-mono text-[11px] text-zinc-400">
                {formatTimecode(currentTime, fps)}
              </span>

              {/* Transport Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => seekToTime(0)}
                  className="p-1 hover:text-zinc-100 text-zinc-400 transition"
                  title="Jump to Start"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  onClick={() => seekToTime(currentTime - 1)}
                  className="p-1 hover:text-zinc-100 text-zinc-400 transition"
                  title="Step Back 1s"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="h-8 w-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-lg transition"
                  title={isPlaying ? "Pause (Space)" : "Play with Voiceover Audio (Space)"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => seekToTime(currentTime + 1)}
                  className="p-1 hover:text-zinc-100 text-zinc-400 transition"
                  title="Step Forward 1s"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="font-mono text-[11px] text-zinc-500">
                {formatTimecode(totalDurationSeconds, fps)}
              </span>
            </div>
          </main>

          {/* RIGHT PANEL: Clip Inspector / Properties (CapCut Style) */}
          <aside className="w-[25%] min-w-[240px] max-w-[320px] bg-[#16171b] border-l border-[#26282f] p-3 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            {selectedClip ? (
              <div className="space-y-4 text-xs">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#26282f]">
                  <div>
                    <span className="font-bold text-zinc-100 text-xs block">
                      {selectedClip.label || "Selected Clip"}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Duration: {((selectedClip.sourceOutFrames - selectedClip.sourceInFrames) / fps).toFixed(2)}s
                    </span>
                  </div>

                  {/* Top Delete button */}
                  <button
                    onClick={() => handleDeleteClip(selectedClip.id)}
                    className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded transition flex items-center gap-1"
                    title="Delete clip from timeline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Primary Action: Remove Scene Button */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleDeleteClip(selectedClip.id)}
                    className="w-full py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Trash2 className="h-4 w-4 text-rose-400" /> Remove Scene from Timeline
                  </button>
                  <button
                    onClick={() => handleToggleClipMute(selectedClip.id)}
                    className="w-full py-1.5 px-3 rounded-md bg-[#22242c] hover:bg-[#2b2d38] border border-[#313540] text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {(selectedClip.volume ?? 1) > 0 ? (
                      <>
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Scene Active (Click to Mute/Skip)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-zinc-500">Scene Muted / Excluded from Render</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Trim In/Out Controls */}
                <div className="space-y-1.5 bg-[#1b1d22] p-2.5 rounded-lg border border-[#292c36]">
                  <span className="text-[11px] font-semibold text-zinc-300 block">Trim In &amp; Out</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Start Trim:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          onClick={() => handleTrim(-0.5, "in")}
                          className="px-1.5 py-0.5 bg-[#252830] hover:bg-[#2d323e] rounded text-zinc-300"
                        >
                          -0.5s
                        </button>
                        <button
                          onClick={() => handleTrim(0.5, "in")}
                          className="px-1.5 py-0.5 bg-[#252830] hover:bg-[#2d323e] rounded text-zinc-300"
                        >
                          +0.5s
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">End Trim:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          onClick={() => handleTrim(-0.5, "out")}
                          className="px-1.5 py-0.5 bg-[#252830] hover:bg-[#2d323e] rounded text-zinc-300"
                        >
                          -0.5s
                        </button>
                        <button
                          onClick={() => handleTrim(0.5, "out")}
                          className="px-1.5 py-0.5 bg-[#252830] hover:bg-[#2d323e] rounded text-zinc-300"
                        >
                          +0.5s
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blade / Split Tool Action */}
                <div className="bg-[#1b1d22] p-2.5 rounded-lg border border-[#292c36] space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-300 block">Edit Operations</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSplitClip}
                      className="flex-1 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded px-2 py-1.5 flex items-center justify-center gap-1 font-semibold text-[11px]"
                    >
                      <Scissors className="h-3.5 w-3.5" /> Split at Playhead
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveClip(-1)}
                      className="flex-1 bg-[#252830] hover:bg-[#2e323e] text-zinc-300 rounded px-2 py-1 text-[11px]"
                    >
                      ← Move Earlier
                    </button>
                    <button
                      onClick={() => handleMoveClip(1)}
                      className="flex-1 bg-[#252830] hover:bg-[#2e323e] text-zinc-300 rounded px-2 py-1 text-[11px]"
                    >
                      Move Later →
                    </button>
                  </div>
                </div>

                {/* Audio Script / Dialogue details for this clip */}
                {selectedShotContext && (
                  <div className="bg-[#1b1d22] p-2.5 rounded-lg border border-[#292c36] space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-300 block flex items-center gap-1">
                      <Mic className="h-3 w-3 text-teal-400" /> Voiceover Script &amp; Action
                    </span>
                    <p className="text-[11px] text-teal-300 italic">
                      "{selectedShotContext.shot.voiceover || selectedShotContext.shot.actionDescription}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-4 text-zinc-500 text-xs">
                <Sliders className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Click on any clip in the timeline below to inspect, trim, split, or remove it.</p>
              </div>
            )}

            {/* Quick sequence stats */}
            <div className="pt-2 border-t border-[#26282f] text-[10px] text-zinc-500 flex justify-between">
              <span>{videoClips.length} video clips</span>
              <span>Total: {totalDurationSeconds.toFixed(1)}s</span>
            </div>
          </aside>
        </div>

        {/* 3. BOTTOM SECTION: CAPCUT / PREMIERE PRO NLE MULTI-TRACK TIMELINE */}
        <div className="flex-1 min-h-[220px] max-h-[45vh] bg-[#121316] flex flex-col overflow-hidden">

          {/* Timeline Action Toolbar */}
          <div className="h-9 bg-[#17181c] border-b border-[#26282f] px-3 flex items-center justify-between shrink-0 text-xs text-zinc-400">
            {/* Left Tools: Split, Delete, Move */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSplitClip}
                className="px-2.5 py-1 bg-[#22242b] hover:bg-[#2b2e38] text-zinc-200 hover:text-cyan-400 rounded flex items-center gap-1 border border-[#313540] transition"
                title="Split clip at playhead position (Blade tool)"
              >
                <Scissors className="h-3 w-3" /> Split
              </button>

              <button
                disabled={!selectedClip}
                onClick={() => selectedClip && handleDeleteClip(selectedClip.id)}
                className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded flex items-center gap-1 transition disabled:opacity-40"
                title="Delete selected clip (or press Backspace / Delete)"
              >
                <Trash2 className="h-3 w-3" /> Delete Clip
              </button>

              <div className="h-4 w-px bg-zinc-700 mx-1" />

              <span className="text-[11px] text-zinc-400 font-mono">
                {videoClips.length} Scenes in Timeline
              </span>
              <span className="text-[10px] text-zinc-600 hidden sm:inline">
                (Press Backspace to delete selected clip, Space to play)
              </span>
            </div>

            {/* Right Tools: Timeline Zoom Slider */}
            <div className="flex items-center gap-2">
              <ZoomOut className="h-3 w-3 text-zinc-500" />
              <input
                type="range"
                min="20"
                max="120"
                value={pixelsPerSecond}
                onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
                className="w-24 h-1 bg-zinc-700 accent-cyan-400 rounded-lg cursor-pointer"
                title="Zoom Timeline"
              />
              <ZoomIn className="h-3 w-3 text-zinc-500" />
              <span className="text-[10px] font-mono text-zinc-500 w-8">{pixelsPerSecond}px/s</span>
            </div>
          </div>

          {/* Main Timeline Workspace: Left Track Headers & Scrollable Multi-Track Canvas */}
          <div className="flex-1 flex overflow-hidden">

            {/* Fixed Left Track Headers (V1, A1, A2) */}
            <div className="w-28 bg-[#15161a] border-r border-[#26282f] flex flex-col shrink-0 text-xs">
              {/* Header space above tracks (aligns with time ruler) */}
              <div className="h-7 border-b border-[#26282f] bg-[#131417] px-2 flex items-center text-[10px] text-zinc-500 font-bold uppercase">
                Tracks
              </div>

              {/* V1 Video Track Header */}
              <div className="h-16 border-b border-[#26282f] p-2 flex flex-col justify-between bg-[#17181c]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 text-xs flex items-center gap-1">
                    <Film className="h-3 w-3 text-cyan-400" /> V1
                  </span>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <button
                      onClick={() => setMuteV1(!muteV1)}
                      className={`p-0.5 hover:text-zinc-200 ${muteV1 ? "text-rose-400" : ""}`}
                      title="Mute Video Track"
                    >
                      {muteV1 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => setLockV1(!lockV1)}
                      className={`p-0.5 hover:text-zinc-200 ${lockV1 ? "text-amber-400" : ""}`}
                      title="Lock Track"
                    >
                      {lockV1 ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase">Video Track</span>
              </div>

              {/* A1 Audio Track Header (Voiceover) */}
              <div className="h-14 border-b border-[#26282f] p-2 flex flex-col justify-between bg-[#17181c]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 text-xs flex items-center gap-1">
                    <Mic className="h-3 w-3 text-teal-400" /> A1
                  </span>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <button
                      onClick={() => setMuteA1(!muteA1)}
                      className={`p-0.5 hover:text-zinc-200 ${muteA1 ? "text-rose-400" : ""}`}
                      title="Mute Voiceover Audio"
                    >
                      {muteA1 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <span className="text-[9px] text-teal-400 uppercase">Voiceover</span>
              </div>

              {/* A2 Ambient Sound Bed Track */}
              <div className="h-12 border-b border-[#26282f] p-2 flex flex-col justify-between bg-[#17181c]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 text-xs flex items-center gap-1">
                    <Music className="h-3 w-3 text-purple-400" /> A2
                  </span>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase">Atmosphere</span>
              </div>
            </div>

            {/* Horizontal Scrollable Timeline Canvas */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0d0e11] relative custom-scrollbar">

              {/* 1. Time Ruler Strip */}
              <div
                ref={timelineRulerRef}
                onClick={handleRulerClick}
                className="h-7 border-b border-[#26282f] bg-[#141518] relative cursor-pointer select-none"
                style={{ width: `${Math.max(totalDurationSeconds + 15, 60) * pixelsPerSecond}px` }}
              >
                {rulerTicks.map((sec) => (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 border-l border-zinc-800"
                    style={{ left: `${sec * pixelsPerSecond}px` }}
                  >
                    {sec % 5 === 0 && (
                      <span className="text-[9px] font-mono text-zinc-500 pl-1 pt-0.5 block select-none">
                        {formatTimecode(sec, fps).slice(3, 8)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* 2. Track Lanes Container */}
              <div
                className="relative"
                style={{ width: `${Math.max(totalDurationSeconds + 15, 60) * pixelsPerSecond}px` }}
              >
                {/* Vertical Playhead Scrub Line */}
                <div
                  className="absolute top-0 bottom-0 z-30 pointer-events-none"
                  style={{
                    left: `${currentTime * pixelsPerSecond}px`,
                    height: "220px",
                  }}
                >
                  <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <div className="-ml-1.5 -mt-[170px] w-3 h-3 bg-cyan-400 rotate-45 rounded-sm" />
                </div>

                {/* Track V1 Lane (Video Clips with Repeating Filmstrip Thumbnails & Direct Delete Button) */}
                <div className="h-16 border-b border-[#21232a] bg-[#131417]/60 relative">
                  {videoClips.map((item, idx) => {
                    const durSec = (item.sourceOutFrames - item.sourceInFrames) / fps;
                    const startSec = item.timelineStartFrames / fps;
                    const widthPx = Math.max(30, durSec * pixelsPerSecond);
                    const leftPx = startSec * pixelsPerSecond;
                    const isSelected = selectedClipId === item.id;
                    const isMuted = (item.volume ?? 1) === 0;

                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(item.id);
                          seekToTime(startSec);
                        }}
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        className={`group absolute top-1 bottom-1 rounded-md border overflow-hidden cursor-pointer flex flex-col justify-between transition-all select-none shadow-md ${
                          isSelected
                            ? "border-cyan-400 ring-2 ring-cyan-400/50 z-20"
                            : "border-cyan-900/60 hover:border-cyan-500/60 z-10"
                        } ${
                          isMuted ? "opacity-40 grayscale" : "bg-[#182a30]"
                        }`}
                      >
                        {/* Filmstrip Repeating Thumbnails inside Clip */}
                        <div className="absolute inset-0 opacity-40 flex overflow-hidden pointer-events-none">
                          <img
                            src={`/api/media/file?path=${encodeURIComponent(item.storagePath)}`}
                            alt="thumb"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Top Label Banner with Instant Delete 'X' Button */}
                        <div className="relative z-10 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm flex items-center justify-between text-[10px] text-cyan-200">
                          <span className="font-semibold truncate">
                            {item.label || `Clip ${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-mono text-[9px] text-zinc-400">
                              {durSec.toFixed(1)}s
                            </span>
                            {/* Hover / Selected Direct Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClip(item.id);
                              }}
                              className="h-4 w-4 rounded bg-rose-900/80 hover:bg-rose-700 text-rose-200 flex items-center justify-center transition"
                              title="Delete Scene from Timeline"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Trim Bar */}
                        <div className="relative z-10 px-1 text-[8px] font-mono text-zinc-400 bg-black/40 flex justify-between">
                          <span>In: {(item.sourceInFrames / fps).toFixed(1)}s</span>
                          <span>Out: {(item.sourceOutFrames / fps).toFixed(1)}s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Track A1 Lane (Audio Waveform Clips matching Screenplay Voiceover) */}
                <div className="h-14 border-b border-[#21232a] bg-[#111215]/80 relative">
                  {videoClips.map((item) => {
                    const durSec = (item.sourceOutFrames - item.sourceInFrames) / fps;
                    const startSec = item.timelineStartFrames / fps;
                    const widthPx = Math.max(30, durSec * pixelsPerSecond);
                    const leftPx = startSec * pixelsPerSecond;
                    const isSelected = selectedClipId === item.id;

                    // Match with authentic screenplay dialogue text for unique speech waveform
                    const shotCtx = allShots.find(
                      (s) =>
                        s.shot.mediaVersions.some((m) => m.storagePath === item.storagePath) ||
                        item.label?.includes(`Scene ${s.scene.sceneNumber} · Shot ${s.shot.shotNumber}`)
                    );
                    const voText = shotCtx?.shot.voiceover || shotCtx?.shot.dialogue || item.label || "";
                    const bars = generateSpeechWaveform(voText, Math.max(12, Math.floor(widthPx / 3.5)));

                    return (
                      <div
                        key={`audio-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(item.id);
                          seekToTime(startSec);
                        }}
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        className={`absolute top-1 bottom-1 rounded border overflow-hidden cursor-pointer flex flex-col justify-between select-none ${
                          isSelected
                            ? "border-teal-400 bg-teal-950/80"
                            : "border-teal-900/60 bg-teal-950/40 hover:border-teal-500/60"
                        }`}
                      >
                        {/* Audio Waveform visualization: Symmetrical Dual-Polarity Peak Bars */}
                        <div className="absolute inset-0 px-1 flex items-center justify-between gap-[1px] pointer-events-none opacity-85">
                          {bars.map((h, i) => (
                            <div
                              key={i}
                              style={{ height: `${h}%` }}
                              className="w-[2px] bg-gradient-to-t from-teal-500 via-teal-300 to-emerald-400 rounded-full"
                            />
                          ))}
                        </div>

                        {/* Audio Clip Header with Real Script Snippet */}
                        <div className="relative z-10 px-1 text-[9px] font-mono text-teal-200 truncate bg-black/40 flex items-center gap-1">
                          <Mic className="h-2.5 w-2.5 text-teal-400 shrink-0" />
                          <span className="truncate">
                            {shotCtx ? `S${shotCtx.scene.sceneNumber}: "${voText.slice(0, 22)}..."` : `VO_${item.label}.mp3`}
                          </span>
                        </div>

                        {/* Audio Footer */}
                        <div className="relative z-10 px-1 text-[8px] font-mono text-teal-400/80 bg-black/30 flex justify-between">
                          <span>44.1kHz AAC</span>
                          <span>Vol: {Math.round((item.volume ?? 1) * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Track A2 Lane (Atmosphere Sound Bed) */}
                <div className="h-12 border-b border-[#21232a] bg-[#0f1013] relative">
                  {videoClips.length > 0 && (
                    <div
                      style={{
                        left: "0px",
                        width: `${totalDurationSeconds * pixelsPerSecond}px`,
                      }}
                      className="absolute top-1 bottom-1 rounded border border-purple-900/40 bg-purple-950/20 overflow-hidden flex items-center px-2 select-none"
                    >
                      <span className="text-[9px] font-mono text-purple-300">
                        Atmospheric Ambient Foley &amp; Village Soundscape (Continuous)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

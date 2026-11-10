"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Users,
  Clapperboard,
  Video,
  Rocket,
  ChevronRight,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Film,
  X,
  Share2,
  ExternalLink,
  Image as ImageIcon,
  Wand2,
  Layers,
  Zap,
} from "lucide-react";

export type WorkflowStepId = "overview" | "script" | "assets" | "storyboard" | "editor" | "launch";

interface ProjectWorkflowNavProps {
  projectId: string;
  activeStep: WorkflowStepId;
  projectTitle?: string;
  visualStyle?: string;
  rightAction?: React.ReactNode;
}

export function ProjectWorkflowNav({
  projectId,
  activeStep,
  projectTitle,
  visualStyle = "PHOTOREALISTIC_CINEMATIC",
  rightAction,
}: ProjectWorkflowNavProps) {
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [latestExport, setLatestExport] = useState<any>(null);
  const [loadingExport, setLoadingExport] = useState(false);

  // YouTube Thumbnail Studio State
  const [thumbnail, setThumbnail] = useState<any>(null);
  const [thumbnailStyle, setThumbnailStyle] = useState<"CURIOSITY_SHOCK" | "EPIC_CINEMATIC" | "DRAMATIC_CONFLICT">("CURIOSITY_SHOCK");
  const [thumbnailHeadline, setThumbnailHeadline] = useState<string>("DON'T MISS THIS!");
  const [showHeadlineOverlay, setShowHeadlineOverlay] = useState<boolean>(true);
  const [generatingThumbnail, setGeneratingThumbnail] = useState<boolean>(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    // Fetch project details for launch metadata
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.project) setProjectData(d.data.project);
      })
      .catch(() => {});
  }, [projectId]);

  async function openLaunchKit() {
    setShowLaunchModal(true);
    setLoadingExport(true);
    try {
      // 1. Fetch export
      const seqRes = await fetch(`/api/projects/${projectId}/sequences`).then((r) => r.json());
      const firstSeq = seqRes.data?.sequences?.[0];
      if (firstSeq) {
        const expRes = await fetch(`/api/sequences/${firstSeq.id}/export`).then((r) => r.json());
        const successful = (expRes.data?.exports || []).find((e: any) => e.status === "SUCCEEDED");
        if (successful) {
          setLatestExport(successful);
        }
      }
      // 2. Fetch thumbnail
      fetch(`/api/projects/${projectId}/thumbnail`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.thumbnail) {
            setThumbnail(d.thumbnail);
            if (d.thumbnail.headlineText) setThumbnailHeadline(d.thumbnail.headlineText);
            if (d.thumbnail.style) setThumbnailStyle(d.thumbnail.style);
          }
        })
        .catch(() => {});
    } catch (e) {
      console.error("Failed to load exports for launch kit", e);
    } finally {
      setLoadingExport(false);
    }
  }

  async function handleGenerateThumbnail() {
    setGeneratingThumbnail(true);
    setThumbnailError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/thumbnail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: thumbnailStyle,
          headlineText: thumbnailHeadline,
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        throw new Error(d.error || d.message || "Failed to generate thumbnail");
      }
      setThumbnail(d.thumbnail);
    } catch (err: any) {
      setThumbnailError(err.message || "Thumbnail generation error");
    } finally {
      setGeneratingThumbnail(false);
    }
  }

  function copyToClipboard(text: string, fieldId: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  }

  // Format visual style label for header badge
  const styleLabel = visualStyle
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // 5-Step Production Workflow
  const steps = [
    {
      id: "script" as WorkflowStepId,
      number: "1",
      label: "Script",
      sublabel: "Story & Dialogue",
      href: `/projects/${projectId}/story`,
      icon: FileText,
    },
    {
      id: "assets" as WorkflowStepId,
      number: "2",
      label: "Assets",
      sublabel: "Characters & Bible",
      href: `/projects/${projectId}/bible`,
      icon: Users,
    },
    {
      id: "storyboard" as WorkflowStepId,
      number: "3",
      label: "Storyboard",
      sublabel: "Prompts & Stills",
      href: `/projects/${projectId}/storyboard`,
      icon: Clapperboard,
    },
    {
      id: "editor" as WorkflowStepId,
      number: "4",
      label: "Video Studio",
      sublabel: "Timeline Editor",
      href: `/projects/${projectId}/edit`,
      icon: Video,
    },
    {
      id: "launch" as WorkflowStepId,
      number: "5",
      label: "YouTube Launch",
      sublabel: "Export & Publish",
      href: `/projects/${projectId}/edit?view=export`,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        openLaunchKit();
      },
      icon: Rocket,
    },
  ];

  // Derive Next step button
  const nextStepMap: Record<WorkflowStepId, { label: string; href: string; action?: () => void }> = {
    overview: { label: "1. Start Script →", href: `/projects/${projectId}/story` },
    script: { label: "Next: Assets (Bible) →", href: `/projects/${projectId}/bible` },
    assets: { label: "Next: Storyboard →", href: `/projects/${projectId}/storyboard` },
    storyboard: { label: "Next: Video Studio →", href: `/projects/${projectId}/edit` },
    editor: { label: "5. YouTube Launch 🚀", href: `/projects/${projectId}/edit?view=export`, action: openLaunchKit },
    launch: { label: "← Back to Studio", href: `/projects/${projectId}/edit` },
  };

  const nextStep = nextStepMap[activeStep];

  // YouTube / Social Media Launch Metadata
  const cleanTitle = projectData?.title || projectTitle || "AI Film Project";
  const youtubeTitle = `${cleanTitle} | Official AI Short Film (${projectData?.storyLanguage === "ta" ? "தமிழ்" : "English"})`;
  const youtubeDescription = `🎬 "${cleanTitle}" - Created with CineFlow AI Filmmaking Studio.

📖 STORY SYNOPSIS:
${projectData?.description || projectData?.sourceIdea || "An exciting cinematic story brought to life with generative AI."}

✨ PRODUCTION SPECS:
- Visual Style: ${styleLabel}
- Audio & Dialogue: ${projectData?.dialogueMode || "Native Dialogue & Narration"}
- Format: ${projectData?.aspectRatio === "PORTRAIT_9_16" ? "9:16 Shorts / Vertical Video (1080x1920)" : "16:9 Cinematic Widescreen (1920x1080)"}
- AI Pipeline: FrameForge AI · Google Flow (Veo) · FLUX.1 · FFmpeg

#AIFilm #GenerativeAI #ShortFilm #CinematicAI #GoogleFlow #Veo #Filmmaking`;

  const youtubeTags = `${cleanTitle}, AI Film, Generative Video, Google Flow, Veo, AI Director, Cinematic AI, Tamil Short Film, NextGen Cinema`;

  return (
    <>
      {/* Top Workflow Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-2.5 shadow-xs">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Project Branding & Return */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/projects/${projectId}`}
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-amber-600 hover:bg-slate-200 transition shadow-xs"
              title="Return to Project Dashboard"
            >
              <Film className="h-4 w-4" />
            </Link>
            <div>
              <Link
                href={`/projects/${projectId}`}
                className="text-sm font-bold text-slate-900 hover:text-amber-600 transition flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs md:max-w-sm"
              >
                <span>{cleanTitle}</span>
              </Link>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <span>CineFlow Studio</span>
                <span>·</span>
                <span className="text-amber-600 font-semibold capitalize">
                  {activeStep === "overview" ? "Production Hub" : `${steps.find((s) => s.id === activeStep)?.label} Stage`}
                </span>
              </div>
            </div>
          </div>

          {/* Center: 5-Step Order of Workflow (Script -> Assets -> Storyboard -> Video Studio -> YouTube Launch) */}
          <nav className="order-last lg:order-none w-full lg:w-auto flex items-center justify-center overflow-x-auto py-1">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
              {steps.map((step) => {
                const isActive = activeStep === step.id;
                const Icon = step.icon;

                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    onClick={step.onClick}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition text-xs whitespace-nowrap ${
                      isActive
                        ? "bg-white text-blue-700 border border-slate-200 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono ${
                        isActive ? "text-blue-600 font-bold" : "text-slate-400"
                      }`}
                    >
                      {step.number}.
                    </span>
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span>{step.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right: Visual Style Badge & Next Step Action */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto lg:ml-0">
            {/* Visual Style Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-mono">
              <span className="text-slate-400">Style:</span>
              <span className="text-slate-900 font-bold">{styleLabel}</span>
            </div>

            {/* Custom Right Action (e.g. 2 Story Options button or Shot planner) */}
            {rightAction}

            {/* Next Step Quick-Jump Button */}
            {nextStep && activeStep !== "launch" && (
              nextStep.action ? (
                <button
                  type="button"
                  onClick={nextStep.action}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <span>{nextStep.label}</span>
                </button>
              ) : (
                <Link
                  href={nextStep.href}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <span>{nextStep.label}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )
            )}
          </div>

        </div>
      </header>

      {/* 5. YouTube Launch & Film Export Kit Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    5. YouTube Launch &amp; Film Export Kit
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-semibold">
                      Final Master
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download your master rendered MP4 and copy pre-formatted launch metadata for YouTube, Shorts &amp; TikTok.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 1. Master Film Export Preview / Download */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Film className="h-4 w-4 text-amber-500" /> Master Video Status
                  </span>
                  {latestExport ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono flex items-center gap-1 font-semibold">
                      <Check className="h-3 w-3" /> Rendered &amp; Ready
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono font-semibold">
                      Ready to Render in Video Studio
                    </span>
                  )}
                </div>

                {latestExport?.outputPath ? (
                  <div className="space-y-3">
                    <video
                      controls
                      src={`/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`}
                      className="w-full max-h-72 rounded-xl bg-black object-contain border border-slate-200 shadow-xs"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-xs text-slate-500 font-mono">
                        <span>File: {latestExport.outputFilename || "master_film.mp4"}</span>
                        {latestExport.outputFileSize && (
                          <span> · {(latestExport.outputFileSize / (1024 * 1024)).toFixed(1)} MB</span>
                        )}
                      </div>
                      <a
                        href={`/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`}
                        download={latestExport.outputFilename || "master_film.mp4"}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download 1080p Master MP4</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Assemble all scene clips and VO audio tracks in the Video Studio, then click &ldquo;Render Master MP4&rdquo; to produce the final export.
                    </p>
                    <Link
                      href={`/projects/${projectId}/edit`}
                      onClick={() => setShowLaunchModal(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs"
                    >
                      <Video className="h-4 w-4" />
                      <span>Open Video Studio &amp; Render</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. High-CTR YouTube Thumbnail Studio (1280x720, FLUX.1 Free) */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        High-CTR YouTube Thumbnail Studio
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-mono font-semibold">
                          1280×720 · 16:9 · Free FLUX.1
                        </span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Viral curiosity-gap composition engineered for maximum YouTube Feed click-through-rate.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateThumbnail}
                    disabled={generatingThumbnail}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{generatingThumbnail ? "Synthesizing 1280×720..." : (thumbnail ? "Re-Generate Thumbnail" : "Generate Thumbnail (Free)")}</span>
                  </button>
                </div>

                {thumbnailError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                    {thumbnailError}
                  </div>
                )}

                {/* 2-Column Studio Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  
                  {/* Left: Thumbnail Preview & Overlay */}
                  <div className="space-y-2">
                    <div className="relative aspect-video w-full rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center group">
                      {thumbnail?.thumbnailUrl ? (
                        <>
                          <img
                            src={thumbnail.thumbnailUrl}
                            alt="YouTube Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          {/* Live YouTube-Style Bold Text Overlay */}
                          {showHeadlineOverlay && thumbnailHeadline && (
                            <div className="absolute top-3 right-3 max-w-[65%] px-3 py-1 bg-yellow-400 text-black font-black uppercase text-xs sm:text-sm tracking-tight rounded shadow-2xl border-2 border-black rotate-[-2deg] select-none pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
                              {thumbnailHeadline}
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-zinc-300 border border-zinc-700">
                            1280 × 720 HD
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6 space-y-2 text-slate-400">
                          <Zap className="h-8 w-8 text-amber-500/60 mx-auto" />
                          <p className="text-xs text-slate-300 font-medium">
                            No thumbnail generated yet.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Click &ldquo;Generate Thumbnail&rdquo; to create a high-contrast 16:9 viral thumbnail using the project&apos;s lead character and visual style.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Download & Copy Buttons */}
                    {thumbnail?.thumbnailUrl && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(thumbnail.prompt || "", "thumbPrompt")}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono transition"
                        >
                          {copiedField === "thumbPrompt" ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>

                        <a
                          href={thumbnail.thumbnailUrl}
                          download={`youtube_thumbnail_${projectId}.jpg`}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download 1280×720 PNG</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right: Controls & Presets */}
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase font-mono tracking-wider">
                        Viral Visual Style Preset:
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setThumbnailStyle("CURIOSITY_SHOCK")}
                          className={`px-3 py-2 rounded-lg text-left text-xs transition flex items-center justify-between border ${
                            thumbnailStyle === "CURIOSITY_SHOCK"
                              ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                          }`}
                        >
                          <span>⚡ Curiosity &amp; Shock (Wide Eyes, Mouth Open)</span>
                          {thumbnailStyle === "CURIOSITY_SHOCK" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbnailStyle("EPIC_CINEMATIC")}
                          className={`px-3 py-2 rounded-lg text-left text-xs transition flex items-center justify-between border ${
                            thumbnailStyle === "EPIC_CINEMATIC"
                              ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                          }`}
                        >
                          <span>🎬 Epic Cinematic (Golden Hour &amp; Deep Bokeh)</span>
                          {thumbnailStyle === "EPIC_CINEMATIC" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbnailStyle("DRAMATIC_CONFLICT")}
                          className={`px-3 py-2 rounded-lg text-left text-xs transition flex items-center justify-between border ${
                            thumbnailStyle === "DRAMATIC_CONFLICT"
                              ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                          }`}
                        >
                          <span>⚔️ Dramatic Conflict (Teal/Orange Standoff)</span>
                          {thumbnailStyle === "DRAMATIC_CONFLICT" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 uppercase font-mono tracking-wider">
                          Bold YouTube Headline Overlay:
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showHeadlineOverlay}
                            onChange={(e) => setShowHeadlineOverlay(e.target.checked)}
                            className="rounded border-slate-300 bg-white text-amber-500 focus:ring-0"
                          />
                          <span>Show in Preview</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={thumbnailHeadline}
                        onChange={(e) => setThumbnailHeadline(e.target.value)}
                        placeholder='e.g. "DON&apos;T MISS THIS!", "99% WRONG!", "1900 MYSTERY"'
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 font-sans transition"
                      />
                      <p className="text-[10px] text-slate-500">
                        Simulates high-contrast YouTube click-hook text overlay on the 1280x720 canvas.
                      </p>
                    </div>

                  </div>

                </div>
              </div>

              {/* 3. YouTube Video Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    YouTube &amp; Shorts Video Title
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(youtubeTitle, "title")}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                  >
                    {copiedField === "title" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Title</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={youtubeTitle}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-sans focus:outline-none select-all"
                />
              </div>

              {/* 4. YouTube Video Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    YouTube Video Description (With Story Synopsis &amp; AI Credits)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(youtubeDescription, "desc")}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                  >
                    {copiedField === "desc" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Description</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={6}
                  readOnly
                  value={youtubeDescription}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
                />
              </div>

              {/* 5. Hashtags & Tags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    SEO Keywords &amp; Hashtags
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(youtubeTags, "tags")}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                  >
                    {copiedField === "tags" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Tags</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={youtubeTags}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none select-all"
                />
              </div>

              {/* 6. Production Pipeline Completion Checklist */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  AI Production Pipeline Checklist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 1. Screenplay &amp; Dialogues crafted
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 2. Character &amp; Wardrobe consistency locked
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 3. Google Flow / Veo prompts generated
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 4. Free FLUX.1 stills &amp; shots ready
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50">
              <span className="text-[11px] text-slate-500 font-mono">
                CineFlow AI Filmmaking Studio · Step 5 of 5
              </span>
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}


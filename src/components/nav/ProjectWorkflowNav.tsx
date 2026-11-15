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
  MessageSquare,
  Music,
  ShieldCheck,
  Flame,
  Smartphone,
  Monitor,
} from "lucide-react";
import { generateSocialLaunchKit } from "@/lib/story/launch-kit";

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

  // Social Launch Kit & Thumbnail State
  const [launchKit, setLaunchKit] = useState<any>(null);
  const [launchPlatformTab, setLaunchPlatformTab] = useState<"youtube" | "instagram" | "thumbnail">("youtube");
  const [thumbnailRatio, setThumbnailRatio] = useState<"16:9" | "9:16">("16:9");
  const [thumbnail, setThumbnail] = useState<any>(null);
  const [thumbnailStyle, setThumbnailStyle] = useState<"OBJECT_COOKING_HOOK" | "CURIOSITY_SHOCK" | "EPIC_CINEMATIC" | "DRAMATIC_CONFLICT">("OBJECT_COOKING_HOOK");
  const [thumbnailHeadline, setThumbnailHeadline] = useState<string>("COOKED IN 500°F WOK!");
  const [showHeadlineOverlay, setShowHeadlineOverlay] = useState<boolean>(true);
  const [generatingThumbnail, setGeneratingThumbnail] = useState<boolean>(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    // Fetch project details for launch metadata
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.project) {
          setProjectData(d.data.project);
          if (d.data.project.aspectRatio === "PORTRAIT_9_16") {
            setThumbnailRatio("9:16");
          }
        }
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
      // 2. Fetch thumbnail & launch kit
      const thumbRes = await fetch(`/api/projects/${projectId}/thumbnail`);
      const thumbJson = await thumbRes.json();
      const resData = thumbJson.data || thumbJson;
      if (resData) {
        if (resData.thumbnail) {
          setThumbnail(resData.thumbnail);
          if (resData.thumbnail.headlineText) setThumbnailHeadline(resData.thumbnail.headlineText);
          if (resData.thumbnail.style) setThumbnailStyle(resData.thumbnail.style);
          if (resData.thumbnail.aspectRatio) setThumbnailRatio(resData.thumbnail.aspectRatio);
        }
        if (resData.launchKit) {
          setLaunchKit(resData.launchKit);
        }
      }
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
          aspectRatio: thumbnailRatio,
          headlineText: thumbnailHeadline,
        }),
      });
      const d = await res.json();
      const resData = d.data || d;
      if (!res.ok || (d.error && !resData.thumbnail)) {
        throw new Error(d.error?.message || d.message || "Failed to generate thumbnail");
      }
      if (resData.thumbnail) setThumbnail(resData.thumbnail);
      if (resData.launchKit) setLaunchKit(resData.launchKit);
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

  // Base Project Details
  const cleanTitle = projectData?.title || projectTitle || "AI Film Project";
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

  // Derive Active Launch Kit (combines fetched kit with instant client fallback)
  const activeKit = launchKit || (projectData ? generateSocialLaunchKit(projectData) : null);
  const displayYtTitles = activeKit?.youtube?.titles || [
    `${cleanTitle} | Official AI Cinematic Short Film`,
    `I Cooked a Mechanical Keyboard into a 5-Star Meal (Oddly Satisfying ASMR)`,
    `Cooking a Mechanical Keyboard... And It Sizzles! 🍳⌨️ #ASMR`,
  ];
  const displayYtDesc = activeKit?.youtube?.description || youtubeDescription;
  const displayYtTags = activeKit?.youtube?.tags || youtubeTags;
  const displayPrompt = thumbnailRatio === "9:16"
    ? (activeKit?.thumbnailPrompts?.portrait9x16 || "")
    : (activeKit?.thumbnailPrompts?.landscape16x9 || "");

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

              {/* Platform Selector Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLaunchPlatformTab("youtube")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      launchPlatformTab === "youtube"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Film className="h-3.5 w-3.5" />
                    <span>YouTube Launch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchPlatformTab("instagram")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      launchPlatformTab === "instagram"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Instagram Reels</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchPlatformTab("thumbnail")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      launchPlatformTab === "thumbnail"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>AI Thumbnail Studio</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Zero-Ingestion ASMR Guard Active</span>
                </div>
              </div>

              {/* TAB 1: YOUTUBE LAUNCH SUITE */}
              {launchPlatformTab === "youtube" && (
                <div className="space-y-4">
                  {/* Title Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <span>High-CTR YouTube Title Options (1-Click Copy)</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {displayYtTitles.map((titleOpt: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 hover:border-slate-300 transition"
                        >
                          <span className="font-medium truncate">{titleOpt}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(titleOpt, `yt-title-${idx}`)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-[11px] font-semibold shrink-0 flex items-center gap-1 transition"
                          >
                            {copiedField === `yt-title-${idx}` ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Thumbnail Prompt Card (Front & Center!) */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-900">
                          AI Thumbnail Prompt (Google Flow / Midjourney / FLUX)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-semibold">
                          {thumbnailRatio === "9:16" ? "9:16 Shorts/Reels" : "16:9 Landscape"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Aspect Ratio Toggle */}
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setThumbnailRatio("9:16")}
                            className={`px-2 py-0.5 rounded font-bold transition ${
                              thumbnailRatio === "9:16" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            9:16 Shorts
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnailRatio("16:9")}
                            className={`px-2 py-0.5 rounded font-bold transition ${
                              thumbnailRatio === "16:9" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            16:9 Video
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(displayPrompt, "hero-thumb-prompt")}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs transition"
                        >
                          {copiedField === "hero-thumb-prompt" ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy AI Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      readOnly
                      value={displayPrompt}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Left hand raw cut object · Right hand spatula with glazed dish · Center sizzling wok</span>
                      <button
                        type="button"
                        onClick={() => setLaunchPlatformTab("thumbnail")}
                        className="text-amber-700 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <span>Open Generator &amp; Preview →</span>
                      </button>
                    </div>
                  </div>

                  {/* YouTube Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        YouTube Description (With Inedible Disclaimer, Timestamps &amp; Foley Notes)
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(displayYtDesc, "yt-desc")}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "yt-desc" ? (
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
                      rows={8}
                      readOnly
                      value={displayYtDesc}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
                    />
                  </div>

                  {/* YouTube Tags */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        SEO Search Keywords &amp; Tags
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(displayYtTags, "yt-tags")}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "yt-tags" ? (
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
                      value={displayYtTags}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none select-all"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: INSTAGRAM REELS SUITE */}
              {launchPlatformTab === "instagram" && (
                <div className="space-y-4">
                  {/* Reel Caption */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-pink-600" />
                        <span>High-Retention Reel Caption (Hook + Menu Vote)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(launchKit?.instagram?.caption || "", "ig-caption")}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "ig-caption" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Caption</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      readOnly
                      value={launchKit?.instagram?.caption || ""}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
                    />
                  </div>

                  {/* Audio & Pinned Comment Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                      <span className="text-[11px] font-bold text-purple-900 uppercase font-mono flex items-center gap-1">
                        <Music className="h-3.5 w-3.5 text-purple-600" />
                        <span>Recommended Audio Track:</span>
                      </span>
                      <p className="text-xs text-purple-950 font-medium">
                        {launchKit?.instagram?.audioRecommendation || "Original Audio · ASMR Wok Sizzle & Click"}
                      </p>
                      <p className="text-[10px] text-purple-700">
                        Pair with crisp mechanical foley audio for maximum algorithm push.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-pink-900 uppercase font-mono flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5 text-pink-600" />
                          <span>Pinned Comment:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(launchKit?.instagram?.pinnedComment || "", "ig-comment")}
                          className="text-[10px] text-pink-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          {copiedField === "ig-comment" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-pink-950 font-medium">
                        {launchKit?.instagram?.pinnedComment || "Menu Vote: Comment what to cook next! 👇"}
                      </p>
                    </div>
                  </div>

                  {/* Viral Hashtags */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        25+ Curated Viral Instagram Hashtags
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(launchKit?.instagram?.hashtags || "", "ig-tags")}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "ig-tags" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Hashtags</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      readOnly
                      value={launchKit?.instagram?.hashtags || ""}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none select-all"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: THUMBNAIL STUDIO & AI PROMPTS */}
              {launchPlatformTab === "thumbnail" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          High-CTR Thumbnail Studio &amp; AI Prompts
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-mono font-semibold">
                            {thumbnailRatio === "9:16" ? "720×1280 (9:16)" : "1280×720 (16:9)"} · Free FLUX.1
                          </span>
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Dual-handed hook composition engineered for maximum click-through-rate.
                        </p>
                      </div>
                    </div>

                    {/* Aspect Ratio Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setThumbnailRatio("16:9")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                          thumbnailRatio === "16:9"
                            ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Monitor className="h-3 w-3" />
                        <span>16:9 YouTube</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailRatio("9:16")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                          thumbnailRatio === "9:16"
                            ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Smartphone className="h-3 w-3" />
                        <span>9:16 Shorts/Reels</span>
                      </button>
                    </div>
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
                      <div
                        className={`relative w-full rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center group ${
                          thumbnailRatio === "9:16" ? "aspect-[9/16] max-h-[380px] mx-auto" : "aspect-video"
                        }`}
                      >
                        {thumbnail?.thumbnailUrl ? (
                          <>
                            <img
                              src={thumbnail.thumbnailUrl}
                              alt="Thumbnail Preview"
                              className="w-full h-full object-cover"
                            />
                            {/* Live YouTube-Style Bold Text Overlay */}
                            {showHeadlineOverlay && thumbnailHeadline && (
                              <div className="absolute top-3 right-3 max-w-[70%] px-3 py-1 bg-yellow-400 text-black font-black uppercase text-xs sm:text-sm tracking-tight rounded shadow-2xl border-2 border-black rotate-[-2deg] select-none pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
                                {thumbnailHeadline}
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-zinc-300 border border-zinc-700">
                              {thumbnailRatio === "9:16" ? "720 × 1280" : "1280 × 720"}
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-2 text-slate-400">
                            <Zap className="h-8 w-8 text-amber-500/60 mx-auto" />
                            <p className="text-xs text-slate-300 font-medium">
                              No thumbnail generated yet.
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Generate for free or copy the prompt into Google Flow / Midjourney.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Download & Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleGenerateThumbnail}
                          disabled={generatingThumbnail}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{generatingThumbnail ? "Rendering..." : (thumbnail ? "Re-Generate" : "Generate Free")}</span>
                        </button>

                        {thumbnail?.thumbnailUrl && (
                          <a
                            href={thumbnail.thumbnailUrl}
                            download={`thumbnail_${thumbnailRatio.replace(":", "x")}_${projectId}.jpg`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PNG</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right: Copyable AI Prompt & Style Presets */}
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-800 uppercase font-mono tracking-wider">
                            Verified AI Prompt ({thumbnailRatio}):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const promptToCopy =
                                thumbnailRatio === "9:16"
                                  ? (launchKit?.thumbnailPrompts?.portrait9x16 || "")
                                  : (launchKit?.thumbnailPrompts?.landscape16x9 || "");
                              copyToClipboard(promptToCopy, "ai-thumb-prompt");
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                          >
                            {copiedField === "ai-thumb-prompt" ? (
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
                        </div>
                        <textarea
                          rows={6}
                          readOnly
                          value={
                            thumbnailRatio === "9:16"
                              ? (launchKit?.thumbnailPrompts?.portrait9x16 || "")
                              : (launchKit?.thumbnailPrompts?.landscape16x9 || "")
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 font-mono leading-relaxed select-all focus:outline-none"
                        />
                      </div>

                      {/* Style Preset Selector */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase font-mono tracking-wider">
                          Thumbnail Style Hook:
                        </label>
                        <div className="grid grid-cols-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setThumbnailStyle("OBJECT_COOKING_HOOK")}
                            className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition flex items-center justify-between border ${
                              thumbnailStyle === "OBJECT_COOKING_HOOK"
                                ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <span>🍳 Inedible Object Cooking (Dual-Hand Hook)</span>
                            {thumbnailStyle === "OBJECT_COOKING_HOOK" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnailStyle("CURIOSITY_SHOCK")}
                            className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition flex items-center justify-between border ${
                              thumbnailStyle === "CURIOSITY_SHOCK"
                                ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <span>⚡ Curiosity &amp; Shock (High Contrast Eyes)</span>
                            {thumbnailStyle === "CURIOSITY_SHOCK" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnailStyle("EPIC_CINEMATIC")}
                            className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition flex items-center justify-between border ${
                              thumbnailStyle === "EPIC_CINEMATIC"
                                ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <span>🎬 Epic Cinematic (Golden Hour &amp; Bokeh)</span>
                            {thumbnailStyle === "EPIC_CINEMATIC" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                          </button>
                        </div>
                      </div>

                      {/* Headline Text Overlay */}
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono tracking-wider">
                            Headline Text Overlay:
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showHeadlineOverlay}
                              onChange={(e) => setShowHeadlineOverlay(e.target.checked)}
                              className="rounded border-slate-300 bg-white text-amber-500 focus:ring-0"
                            />
                            <span>Show</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={thumbnailHeadline}
                          onChange={(e) => setThumbnailHeadline(e.target.value)}
                          placeholder='e.g. "COOKED IN 500°F WOK!"'
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 font-sans transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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


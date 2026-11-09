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
      const seqRes = await fetch(`/api/projects/${projectId}/sequences`).then((r) => r.json());
      const firstSeq = seqRes.data?.sequences?.[0];
      if (firstSeq) {
        const expRes = await fetch(`/api/sequences/${firstSeq.id}/export`).then((r) => r.json());
        const successful = (expRes.data?.exports || []).find((e: any) => e.status === "SUCCEEDED");
        if (successful) {
          setLatestExport(successful);
        }
      }
    } catch (e) {
      console.error("Failed to load exports for launch kit", e);
    } finally {
      setLoadingExport(false);
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
      <header className="sticky top-0 z-40 w-full bg-[#0d0e12]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-6 py-2.5">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Project Branding & Return */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/projects/${projectId}`}
              className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 hover:bg-zinc-800 hover:border-zinc-700 transition shadow-sm"
              title="Return to Project Dashboard"
            >
              <Film className="h-4 w-4" />
            </Link>
            <div>
              <Link
                href={`/projects/${projectId}`}
                className="text-sm font-bold text-zinc-100 hover:text-amber-400 transition flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs md:max-w-sm"
              >
                <span>{cleanTitle}</span>
              </Link>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                <span>CineFlow Studio</span>
                <span>·</span>
                <span className="text-amber-400/90 font-medium capitalize">
                  {activeStep === "overview" ? "Production Hub" : `${steps.find((s) => s.id === activeStep)?.label} Stage`}
                </span>
              </div>
            </div>
          </div>

          {/* Center: 5-Step Order of Workflow (Script -> Assets -> Storyboard -> Video Studio -> YouTube Launch) */}
          <nav className="order-last lg:order-none w-full lg:w-auto flex items-center justify-center overflow-x-auto py-1">
            <div className="flex items-center gap-1 p-1 bg-zinc-950/90 rounded-2xl border border-zinc-800/90 shadow-inner">
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
                        ? "bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-900 text-sky-200 border border-sky-500/50 shadow-md font-semibold"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/90 font-medium"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono ${
                        isActive ? "text-sky-400 font-bold" : "text-zinc-500"
                      }`}
                    >
                      {step.number}.
                    </span>
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-sky-300" : "text-zinc-500"
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
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <span className="text-zinc-500">Style:</span>
              <span className="text-amber-400 font-semibold">{styleLabel}</span>
            </div>

            {/* Custom Right Action (e.g. 2 Story Options button or Shot planner) */}
            {rightAction}

            {/* Next Step Quick-Jump Button */}
            {nextStep && activeStep !== "launch" && (
              nextStep.action ? (
                <button
                  type="button"
                  onClick={nextStep.action}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <span>{nextStep.label}</span>
                </button>
              ) : (
                <Link
                  href={nextStep.href}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-sky-500/40 bg-zinc-950 shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-blue-950/60 via-zinc-950 to-indigo-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sky-400">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    5. YouTube Launch &amp; Film Export Kit
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/40 font-mono">
                      Final Master
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Download your master rendered MP4 and copy pre-formatted launch metadata for YouTube, Shorts &amp; TikTok.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 1. Master Film Export Preview / Download */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Film className="h-4 w-4 text-amber-400" /> Master Video Status
                  </span>
                  {latestExport ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono flex items-center gap-1">
                      <Check className="h-3 w-3" /> Rendered &amp; Ready
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                      Ready to Render in Video Studio
                    </span>
                  )}
                </div>

                {latestExport?.outputPath ? (
                  <div className="space-y-3">
                    <video
                      controls
                      src={`/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`}
                      className="w-full max-h-72 rounded-lg bg-black object-contain border border-zinc-800"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-xs text-zinc-400 font-mono">
                        <span>File: {latestExport.outputFilename || "master_film.mp4"}</span>
                        {latestExport.outputFileSize && (
                          <span> · {(latestExport.outputFileSize / (1024 * 1024)).toFixed(1)} MB</span>
                        )}
                      </div>
                      <a
                        href={`/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`}
                        download={latestExport.outputFilename || "master_film.mp4"}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download 1080p Master MP4</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Assemble all scene clips and VO audio tracks in the Video Studio, then click &ldquo;Render Master MP4&rdquo; to produce the final export.
                    </p>
                    <Link
                      href={`/projects/${projectId}/edit`}
                      onClick={() => setShowLaunchModal(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition shadow-md"
                    >
                      <Video className="h-4 w-4" />
                      <span>Open Video Studio &amp; Render</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. YouTube Video Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">
                    YouTube &amp; Shorts Video Title
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(youtubeTitle, "title")}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition"
                  >
                    {copiedField === "title" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-sans focus:outline-none select-all"
                />
              </div>

              {/* 3. YouTube Video Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">
                    YouTube Video Description (With Story Synopsis &amp; AI Credits)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(youtubeDescription, "desc")}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition"
                  >
                    {copiedField === "desc" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none select-all"
                />
              </div>

              {/* 4. Hashtags & Tags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">
                    SEO Keywords &amp; Hashtags
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(youtubeTags, "tags")}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition"
                  >
                    {copiedField === "tags" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
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
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 font-mono focus:outline-none select-all"
                />
              </div>

              {/* 5. Production Pipeline Completion Checklist */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-2">
                <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  AI Production Pipeline Checklist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> 1. Screenplay &amp; Dialogues crafted
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> 2. Character &amp; Wardrobe consistency locked
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> 3. Google Flow / Veo prompts generated
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> 4. Free FLUX.1 stills &amp; shots ready
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-950">
              <span className="text-[11px] text-zinc-500 font-mono">
                CineFlow AI Filmmaking Studio · Step 5 of 5
              </span>
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
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


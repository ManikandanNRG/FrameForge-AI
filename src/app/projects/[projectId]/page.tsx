"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/nav/AppShell";
import { ProjectWorkflowNav } from "@/components/nav/ProjectWorkflowNav";
import { Button } from "@/components/ui/button";
import { Badge, jobStatusBadge } from "@/components/ui/badge";
import {
  Sparkles,
  BookOpen,
  AlertCircle,
  SplitSquareVertical,
  Edit3,
  Clock,
  Smartphone,
  Monitor,
  Square,
  Save,
  X,
  Film,
  CheckCircle2,
  Users,
  Clapperboard,
  Video,
  Rocket,
  FileText,
  Volume2,
  Sliders,
  Settings2,
  ArrowRight,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  sourceIdea: string;
  currentStage: string;
  genre?: string;
  tone?: string;
  visualStyle: string;
  aspectRatio?: string;
  storyLanguage?: string;
  targetRuntime?: number;
  dialogueMode?: string;
  description?: string;
}

interface Job {
  id: string;
  status: string;
  jobType: string;
  createdAt: string;
  errorMessage?: string;
}

const RUNTIME_PRESETS = [
  { seconds: 30, label: "30s — Viral Reel / Quick Short (~3-4 scenes)" },
  { seconds: 45, label: "45s — Teaser / Short Scene (~5-6 scenes)" },
  { seconds: 60, label: "60s (1 min) — Standard Short Film (~6-8 scenes) [Recommended]" },
  { seconds: 90, label: "90s (1.5 min) — Extended Story Scene (~10-12 scenes)" },
  { seconds: 120, label: "120s (2 min) — Mini Cinema Drama (~14-16 scenes)" },
  { seconds: 180, label: "180s (3 min) — Full Narrative Film (~18-22 scenes)" },
  { seconds: 300, label: "300s (5 min) — Mini-Movie Short (~30+ scenes)" },
];

const ASPECT_RATIO_OPTIONS = [
  { value: "PORTRAIT_9_16", label: "9:16 Vertical / Portrait", sublabel: "YouTube Shorts, Reels, TikTok", icon: Smartphone },
  { value: "LANDSCAPE_16_9", label: "16:9 Widescreen", sublabel: "YouTube Main, Cinema, Desktop", icon: Monitor },
  { value: "SQUARE_1_1", label: "1:1 Square", sublabel: "Instagram Feed, Social Square", icon: Square },
];

const VISUAL_STYLES = [
  { value: "PHOTOREALISTIC_CINEMATIC", label: "Photorealistic Cinematic (35mm Film)" },
  { value: "CULINARY_MACRO_ASMR", label: "Culinary ASMR & Cooking (Macro Food Realism)" },
  { value: "HYPERREALISTIC_FILM", label: "8K Hyperrealistic Live Action" },
  { value: "DOCUMENTARY", label: "Documentary Realism" },
  { value: "ANIMATION_3D", label: "3D Animated Film (Pixar / Disney)" },
  { value: "ANIME", label: "Anime / Studio Ghibli" },
  { value: "VINTAGE_FILM", label: "Vintage 1970s Film Grain" },
  { value: "COMIC_BOOK", label: "Comic Book / Graphic Novel" },
  { value: "LIVE_ACTION_AD", label: "Live-action Commercial" },
];

const STORY_LANGUAGES = [
  { value: "Tamil", label: "Tamil (தமிழ்)" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
  { value: "Telugu", label: "Telugu (తెలుగు)" },
  { value: "Malayalam", label: "Malayalam (മലയാളം)" },
  { value: "Spanish", label: "Spanish (Español)" },
  { value: "French", label: "French (Français)" },
  { value: "German", label: "German (Deutsch)" },
];

const DIALOGUE_MODES = [
  { value: "DIALOGUE", label: "Native Character Dialogue + Voiceover (Full Audio)" },
  { value: "PURE_ASMR_FOLEY", label: "Pure ASMR Sound Effects (Zero Dialogue / Ultra-Crisp Foley)" },
  { value: "VOICEOVER", label: "Narrator Voiceover Only (No lip sync)" },
  { value: "NO_DIALOGUE", label: "Silent Cinematic Story (Foley / Atmosphere only)" },
];

export default function ProjectPage() {
  const routeParams = useParams();
  const projectId = (routeParams?.projectId as string) || "";
  const [project, setProject] = useState<Project | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [running1Click, setRunning1Click] = useState(false);
  const [oneClickStepMessage, setOneClickStepMessage] = useState<string | null>(null);
  const [oneClickSuccess, setOneClickSuccess] = useState<string | null>(null);

  // Edit Specifications Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    sourceIdea: "",
    aspectRatio: "PORTRAIT_9_16",
    targetRuntime: 60,
    visualStyle: "PHOTOREALISTIC_CINEMATIC",
    storyLanguage: "Tamil",
    dialogueMode: "DIALOGUE",
    genre: "",
    tone: "",
  });

  async function load() {
    const [pr, jr, pvr] = await Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/jobs?projectId=${projectId}`).then((r) => r.json()),
      fetch("/api/settings/providers").then((r) => r.json()),
    ]);
    if (pr.data?.project) {
      setProject(pr.data.project);
    }
    setJobs(jr.data?.jobs ?? []);
    setHasProvider((pvr.data?.providers ?? []).some((p: { status: string }) => p.status === "CONNECTED"));
  }

  useEffect(() => {
    load();
  }, [projectId]);

  // Poll while any generation job is running
  useEffect(() => {
    const running = jobs.find((j) =>
      ["QUEUED", "SUBMITTING", "RUNNING", "WAITING_FOR_PROVIDER"].includes(j.status)
    );
    if (!running) return;
    const t = setInterval(() => {
      fetch(`/api/jobs/${running.id}`)
        .then((r) => r.json())
        .then((d) => {
          const s = d.data?.job?.status;
          if (s === "SUCCEEDED" || s === "FAILED") {
            clearInterval(t);
            load();
          }
        });
    }, 2000);
    return () => clearInterval(t);
  }, [jobs]);

  function openEditModal() {
    if (!project) return;
    setEditForm({
      title: project.title || "",
      sourceIdea: project.sourceIdea || "",
      aspectRatio: project.aspectRatio || "PORTRAIT_9_16",
      targetRuntime: project.targetRuntime || 60,
      visualStyle: project.visualStyle || "PHOTOREALISTIC_CINEMATIC",
      storyLanguage: project.storyLanguage || "Tamil",
      dialogueMode: project.dialogueMode || "DIALOGUE",
      genre: project.genre || "Rural Village Drama / Realistic",
      tone: project.tone || "Suspenseful, Tense & Thrilling",
    });
    setIsEditModalOpen(true);
  }

  async function saveSpecs() {
    setSavingSpecs(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const d = await res.json();
      if (res.ok && d.data?.project) {
        setProject(d.data.project);
        setIsEditModalOpen(false);
      } else {
        alert(d.error?.message || "Failed to update film specifications");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save specifications");
    } finally {
      setSavingSpecs(false);
    }
  }

  async function generateStory(useMock = false) {
    setGenerating(true);
    setGenError(null);
    const r = await fetch(`/api/projects/${projectId}/story`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: "gpt-4o-mini", useMock }),
    });
    const d = await r.json();
    setGenerating(false);
    if (r.ok) load();
    else setGenError(d.error?.message ?? "Failed to start generation");
  }

  async function runOneClickPipeline(useMock = false) {
    setRunning1Click(true);
    setGenError(null);
    setOneClickSuccess(null);
    setOneClickStepMessage("Step 1/3: Crafting complete screenplay with native dialogue…");

    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/one-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useMock, autoGenerateVideos: false }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "1-Click generation failed");

      setOneClickSuccess(
        `Complete film package generated! ${d.data.scenesCount} Scenes, ${d.data.shotsCount} Shots, ${d.data.charactersCount} Characters ready with Google Flow prompts.`
      );
      load();
    } catch (e: any) {
      setGenError(e.message || "Failed to execute 1-Click pipeline");
    } finally {
      setRunning1Click(false);
      setOneClickStepMessage(null);
    }
  }

  const activeJob = jobs.find(
    (j) =>
      j.jobType === "STORY" &&
      ["QUEUED", "SUBMITTING", "RUNNING", "WAITING_FOR_PROVIDER"].includes(j.status)
  );
  const hasStory = (project?.currentStage ?? "BRIEF") !== "BRIEF";

  if (!project) {
    return (
      <AppShell>
        <div className="p-10 text-zinc-500">Loading project details…</div>
      </AppShell>
    );
  }

  // Calculate human-friendly duration details
  const runtimeSeconds = project.targetRuntime || 60;
  const runtimeMinutes = Math.max(0.5, Math.round((runtimeSeconds / 60) * 10) / 10);
  const approxScenes = Math.max(3, Math.round(runtimeSeconds / 8));

  // Determine aspect ratio label and icon
  const currentRatio = ASPECT_RATIO_OPTIONS.find((r) => r.value === project.aspectRatio) || ASPECT_RATIO_OPTIONS[0];
  const RatioIcon = currentRatio.icon;

  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        {/* Global Film Production 5-Step Workflow Nav */}
        <ProjectWorkflowNav
          projectId={projectId}
          activeStep="overview"
          projectTitle={project.title}
          visualStyle={project.visualStyle}
          rightAction={
            <Button
              size="sm"
              onClick={openEditModal}
              className="h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              <span>Edit Film Specs</span>
            </Button>
          }
        />

        <div className="flex-1 px-6 sm:px-10 py-8 max-w-5xl mx-auto w-full space-y-8">
          {/* Provider warning */}
          {hasProvider === false && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-700/50 bg-amber-900/20 p-4 text-sm text-amber-300">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold">No AI Provider Connected</p>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Connect a free Google Gemini API key or OpenRouter free key in Settings to generate screenplays, character prompts, and shots.
                </p>
                <Link href="/settings" className="inline-block mt-2 text-xs underline font-bold text-amber-300 hover:text-white">
                  Open Settings →
                </Link>
              </div>
            </div>
          )}

          {/* 1. HERO PRODUCTION BRIEF & SPECIFICATIONS CARD */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Film Production Brief
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {project.id}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {project.title}
                </h1>
              </div>

              <Button
                onClick={openEditModal}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold px-3 py-2 shadow-xs transition"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                <span>Edit Specs &amp; Timing</span>
              </Button>
            </div>

            {/* Original Story Idea Box */}
            <div className="my-5 rounded-xl border border-slate-200/90 bg-slate-50 p-4 font-sans text-sm text-slate-800 leading-relaxed shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <span className="text-amber-700 flex items-center gap-1.5 font-bold">
                  <Film className="h-3.5 w-3.5 text-amber-600" /> Original Story Idea &amp; Premise
                </span>
                <span className="text-slate-400 font-mono">{project.sourceIdea.length} characters</span>
              </div>
              <p className="text-slate-800 italic font-serif text-sm sm:text-base leading-relaxed">
                &ldquo;{project.sourceIdea}&rdquo;
              </p>
            </div>

            {/* Production Specifications Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2">
              {/* Orientation */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold">
                  <span>Orientation</span>
                  <RatioIcon className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {currentRatio.label}
                </p>
                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  {project.aspectRatio === "PORTRAIT_9_16" ? "9:16 Shorts/Reels" : "16:9 Widescreen"}
                </span>
              </div>

              {/* Timing & Runtime */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold">
                  <span>Target Timing</span>
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {runtimeSeconds}s ({runtimeMinutes} min)
                </p>
                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  ~{approxScenes} Scenes (8s-10s ea)
                </span>
              </div>

              {/* Visual Style */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold">
                  <span>Visual Style</span>
                  <Sliders className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {project.visualStyle.replace(/_/g, " ")}
                </p>
                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  35mm Film Aesthetic
                </span>
              </div>

              {/* Audio & Dialogue */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold">
                  <span>Language</span>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {project.storyLanguage || "Tamil"}
                </p>
                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  {project.dialogueMode || "Native Dialogue"}
                </span>
              </div>

              {/* Genre & Tone */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold">
                  <span>Genre / Tone</span>
                  <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {project.genre || "Drama"}
                </p>
                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  {project.tone || "Realistic"}
                </span>
              </div>
            </div>
          </section>

          {/* 2. THE 5-STEP FILM PRODUCTION PIPELINE */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>5-Step Production Pipeline</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Follow in Order
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Each stage builds directly on the previous one to keep characters, story, and shots 100% consistent.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
              {/* Step 1: Script */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition shadow-xs group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Step 1
                    </span>
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
                    Script
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Screenplay development, native Tamil dialogue, and 2 distinct story options (A vs B).
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <Link href={`/projects/${projectId}/story?action=options`}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-[11px] h-7 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold"
                    >
                      <SplitSquareVertical className="h-3 w-3 mr-1 text-purple-600" />
                      <span>2 Story Options</span>
                    </Button>
                  </Link>
                  <Link href={`/projects/${projectId}/story`}>
                    <Button
                      size="sm"
                      className="w-full text-[11px] h-7 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
                    >
                      <span>Open Script Studio →</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Step 2: Assets */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition shadow-xs group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Step 2
                    </span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                    Assets (Bible)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Locked character appearance, wardrobe consistency, and Google Flow character setup.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link href={`/projects/${projectId}/bible`}>
                    <Button
                      size="sm"
                      className="w-full text-[11px] h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium"
                    >
                      <span>Production Bible →</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Step 3: Storyboard */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition shadow-xs group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Step 3
                    </span>
                    <Clapperboard className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
                    Storyboard
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Google Flow &amp; Kling master prompts, Free FLUX.1 stills for I2V, and shot approvals.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link href={`/projects/${projectId}/storyboard`}>
                    <Button
                      size="sm"
                      className="w-full text-[11px] h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium"
                    >
                      <span>Open Storyboard →</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Step 4: Video Studio */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-cyan-400 hover:shadow-md transition shadow-xs group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      Step 4
                    </span>
                    <Video className="h-4 w-4 text-cyan-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition">
                    Video Studio
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Desktop multi-track NLE timeline editor, clip trimming, speech audio, and timecode.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link href={`/projects/${projectId}/edit`}>
                    <Button
                      size="sm"
                      className="w-full text-[11px] h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium"
                    >
                      <span>Open Video Studio →</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Step 5: YouTube Launch */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition shadow-xs group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Step 5
                    </span>
                    <Rocket className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">
                    YouTube Launch
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    1080p MP4 download, copyable YouTube Title, Description, and Cinematic Hashtags.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link href={`/projects/${projectId}/edit?view=export`}>
                    <Button
                      size="sm"
                      className="w-full text-[11px] h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold"
                    >
                      <span>Launch Kit 🚀</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 3. OPTIONAL 1-CLICK GENERATION ACCELERATOR */}
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    Fast-Track Option
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    ⚡ 1-Click Full Studio Generation
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  Want to automate the whole process? 1-Click generates the complete screenplay with dialogue, extracts character profiles with Google Flow prompts, and builds the full scene storyboard in one background pass.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  loading={running1Click}
                  disabled={hasProvider === false}
                  onClick={() => runOneClickPipeline(false)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition px-4 py-2"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  <span>{running1Click ? "Processing Pipeline…" : "Generate Entire Film"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={running1Click}
                  onClick={() => runOneClickPipeline(true)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Mock Test
                </Button>
              </div>
            </div>

            {running1Click && (
              <div className="mt-4 pt-4 border-t border-amber-200/80 flex items-center gap-3 text-xs text-amber-800 animate-pulse font-medium">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                <span>{oneClickStepMessage || "Executing end-to-end film pipeline…"}</span>
              </div>
            )}
            {oneClickSuccess && (
              <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>✓ {oneClickSuccess}</span>
                <Link
                  href={`/projects/${projectId}/storyboard`}
                  className="underline font-bold text-amber-700 hover:text-amber-800"
                >
                  Open Storyboard Now →
                </Link>
              </div>
            )}
          </section>

          {/* 4. RECENT JOBS */}
          {jobs.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Recent Generation Jobs</h3>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                    onClick={async () => {
                      await fetch(`/api/projects/${projectId}/shots/generate-videos`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ force: true }),
                      });
                      load();
                    }}
                  >
                    🎬 Generate All Videos Now
                  </Button>
                  {jobs.some((j) => j.status === "FAILED") && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/jobs?projectId=${projectId}`, { method: "DELETE" });
                        load();
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      Clear failed history
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {jobs.slice(0, 5).map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-xs"
                  >
                    <span className="text-slate-700 font-mono font-medium">{j.jobType}</span>
                    <div className="flex items-center gap-3">
                      {j.errorMessage && (
                        <span className="text-rose-600 text-xs truncate max-w-xs">{j.errorMessage}</span>
                      )}
                      <Badge status={jobStatusBadge(j.status)} label={j.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* EDIT FILM SPECIFICATIONS MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col text-slate-900">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Edit Film Specifications &amp; Story Idea
                    </h2>
                    <p className="text-xs text-slate-500">
                      Update your story concept, timing duration, aspect ratio orientation, and styling
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Film Title */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Film Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-medium text-sm transition"
                    placeholder="e.g. Sugarcane Harvest"
                  />
                </div>

                {/* Story Idea (Prompt) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-amber-800">
                      Story Idea / Creative Concept
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {editForm.sourceIdea.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={editForm.sourceIdea}
                    onChange={(e) => setEditForm((f) => ({ ...f, sourceIdea: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-sans text-xs leading-relaxed transition"
                    placeholder="Describe your film idea in detail..."
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    The AI uses this exact idea to analyze, craft 2 creative treatments, and generate scene actions.
                  </p>
                </div>

                {/* Aspect Ratio / Orientation Cards */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    Video Orientation &amp; Aspect Ratio
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {ASPECT_RATIO_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const selected = editForm.aspectRatio === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditForm((f) => ({ ...f, aspectRatio: opt.value }))}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                            selected
                              ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">{opt.label}</span>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] text-slate-400">{opt.sublabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Duration & Timing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Target Duration &amp; Timing
                    </label>
                    <select
                      value={editForm.targetRuntime}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, targetRuntime: parseInt(e.target.value, 10) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                    >
                      {RUNTIME_PRESETS.map((p) => (
                        <option key={p.seconds} value={p.seconds}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Visual Style</label>
                    <select
                      value={editForm.visualStyle}
                      onChange={(e) => setEditForm((f) => ({ ...f, visualStyle: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                    >
                      {VISUAL_STYLES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language & Dialogue Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Story &amp; Dialogue Language
                    </label>
                    <select
                      value={editForm.storyLanguage}
                      onChange={(e) => setEditForm((f) => ({ ...f, storyLanguage: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                    >
                      {STORY_LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dialogue Mode</label>
                    <select
                      value={editForm.dialogueMode}
                      onChange={(e) => setEditForm((f) => ({ ...f, dialogueMode: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                    >
                      {DIALOGUE_MODES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Genre & Tone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Genre</label>
                    <input
                      type="text"
                      value={editForm.genre}
                      onChange={(e) => setEditForm((f) => ({ ...f, genre: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                      placeholder="e.g. Rural Village Drama / Realistic"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dramatic Tone</label>
                    <input
                      type="text"
                      value={editForm.tone}
                      onChange={(e) => setEditForm((f) => ({ ...f, tone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
                      placeholder="e.g. Suspenseful, Tense & Thrilling"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/80">
                <span className="text-[11px] text-slate-400">
                  Updates will apply to newly generated screenplay and shot prompts.
                </span>
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    loading={savingSpecs}
                    onClick={saveSpecs}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 shadow-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    <span>Save Specifications</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

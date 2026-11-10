"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { ProjectWorkflowNav } from "@/components/nav/ProjectWorkflowNav";
import { Button } from "@/components/ui/button";
import { Badge, artifactStatusBadge } from "@/components/ui/badge";
import {
  ChevronRight,
  CheckCircle,
  Edit2,
  Save,
  X,
  Sparkles,
  RefreshCw,
  Film,
  Layers,
  Clapperboard,
  Video,
  ExternalLink,
  MessageSquare,
  Mic,
  Volume2,
  BookOpen,
  ArrowRight,
  Check,
  SplitSquareVertical,
  Zap,
  Link as LinkIcon,
} from "lucide-react";

interface ArtifactVersion {
  id: string;
  versionNumber: number;
  contentText: string;
  source: string;
  approvedAt?: string;
}

interface Artifact {
  id: string;
  artifactType: string;
  approvalStatus: string;
  currentVersionId?: string;
  versions: ArtifactVersion[];
}

interface SceneData {
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  action: string;
  voiceover?: string;
  dialogue?: string;
  audioScript?: string;
  soundEffects?: string;
  estimatedDurationSeconds?: number;
}

interface StoryOption {
  optionId: "A" | "B";
  title: string;
  conceptAngle: string;
  logline: string;
  premise: string;
  scenes: SceneData[];
}

interface ProjectData {
  id: string;
  title: string;
  description?: string;
  sourceIdea?: string;
  visualStyle: string;
  storyLanguage: string;
  aspectRatio: string;
  genre?: string;
  tone?: string;
}

const TYPE_LABELS: Record<string, string> = {
  SCREENPLAY: "Screenplay (Script)",
  LOGLINE: "Logline & Premise",
  SYNOPSIS: "Synopsis",
  OUTLINE: "Outline",
  CHARACTER_ARCS: "Character Arcs",
};

const ORDER = ["SCREENPLAY", "LOGLINE", "SYNOPSIS", "OUTLINE", "CHARACTER_ARCS"];

const CASHCOW_PRESETS = [
  {
    id: "health",
    icon: "🍎",
    label: "Health & Remedies",
    prompt: "Top 5 hidden dangers and miraculous benefits of drinking organic apple cider vinegar daily on an empty stomach, revealing what modern medical doctors don't talk about.",
  },
  {
    id: "vintage",
    icon: "📜",
    label: "1900s Vintage Pudukkottai",
    prompt: "I need to show the old years Pudukkottai city in 1900 years (vintage), with antique wooden bullock carts, brass oil lamps, royal palace courtyards, and ancestral pride.",
  },
  {
    id: "elephant",
    icon: "🌾",
    label: "Village Boy & Wild Elephant",
    prompt: "One small boy running in the agriculture sugarcane land, and suddenly he sees an elephant eating sugarcane leaves, shouting and running back to call his mother and village people to chase it out.",
  },
  {
    id: "mystery",
    icon: "🛸",
    label: "Unsolved Mystery",
    prompt: "The terrifying true mystery of a ghost vessel found adrift undamaged in deep waters with the captain's warm tea still on the table and all crew vanishing without a trace.",
  },
  {
    id: "wealth",
    icon: "💰",
    label: "Psychology of Money",
    prompt: "The psychological trap why 90% of sudden lottery millionaires lose everything within 3 years, and the ancient Chettiar compounding wealth secrets that endure centuries.",
  },
  {
    id: "tech",
    icon: "⚡",
    label: "Cyber AI 2050",
    prompt: "The world's first autonomous flying hypercar test over a futuristic neon megacity takes an unexpected trajectory into a heavily classified off-grid research compound.",
  },
];

export default function StoryStudioPage() {
  const routeParams = useParams();
  const projectId = (routeParams?.projectId as string) || "";
  const actionOptionsHandledRef = useRef(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [dbScenesFallback, setDbScenesFallback] = useState<SceneData[]>([]);
  const [activeTab, setActiveTab] = useState<string>("SCREENPLAY");
  const [isRawView, setIsRawView] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Scene Edit State
  const [editingScene, setEditingScene] = useState<SceneData | null>(null);
  const [savingScene, setSavingScene] = useState<boolean>(false);

  // Scene AI Regeneration State
  const [regenSceneNum, setRegenSceneNum] = useState<number | null>(null);
  const [regenInstructions, setRegenInstructions] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  // Inline Scene AI Director Chat Co-Pilot State
  const [sceneAiInputs, setSceneAiInputs] = useState<Record<number, string>>({});
  const [inlineRegenLoadingScene, setInlineRegenLoadingScene] = useState<number | null>(null);
  const [inlineRegenError, setInlineRegenError] = useState<string | null>(null);
  const [inlineRegenErrorScene, setInlineRegenErrorScene] = useState<number | null>(null);
  const [inlineRegenSuccessScene, setInlineRegenSuccessScene] = useState<number | null>(null);

  // 2-Story Options Generation State (Option A vs Option B)
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [storyOptions, setStoryOptions] = useState<StoryOption[] | null>(null);
  const [selectedOptionTab, setSelectedOptionTab] = useState<"A" | "B">("A");
  const [optionsIdeaText, setOptionsIdeaText] = useState<string>("");
  const [ytCompetitorUrl, setYtCompetitorUrl] = useState<string>("");
  const [isGeneratingOptions, setIsGeneratingOptions] = useState<boolean>(false);
  const [isSelectingOption, setIsSelectingOption] = useState<boolean>(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Whole Story Artifact Edit
  const [rawEditing, setRawEditing] = useState<boolean>(false);
  const [rawEditText, setRawEditText] = useState<string>("");
  const [savingRaw, setSavingRaw] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);

  async function loadData() {
    setLoading(true);
    try {
      const [projRes, storyRes, shotsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/story`),
        fetch(`/api/projects/${projectId}/shots`).catch(() => null),
      ]);
      const projData = await projRes.json();
      const storyData = await storyRes.json();
      const shotsData = shotsRes ? await shotsRes.json() : null;

      if (projData.data?.project) {
        setProject(projData.data.project);
        setOptionsIdeaText(projData.data.project.sourceIdea || projData.data.project.description || projData.data.project.title || "");
      }

      const list: Artifact[] = (storyData.data?.artifacts ?? []).sort(
        (a: Artifact, b: Artifact) => ORDER.indexOf(a.artifactType) - ORDER.indexOf(b.artifactType),
      );
      setArtifacts(list);

      // Extract DB fallback scenes from shots if screenplay text wasn't in JSON
      if (shotsData?.data?.scenes) {
        const fallback: SceneData[] = shotsData.data.scenes.flatMap((sc: any) =>
          sc.shots.map((sh: any) => {
            let audio: any = {};
            try { audio = JSON.parse(sh.negativeConstraints || "{}"); } catch {}
            return {
              sceneNumber: sh.shotNumber,
              heading: `${sc.heading || "SCENE"} · SHOT ${sh.shotNumber}`,
              location: sc.location || "Village",
              timeOfDay: sc.timeOfDay || "DAY",
              action: sh.actionDescription,
              dialogue: sh.dialogue || audio.dialogue || "",
              voiceover: sh.voiceover || audio.voiceover || "",
              audioScript: sh.audioPrompt || audio.audioPrompt || "",
              estimatedDurationSeconds: sh.targetDurationSeconds || 8,
            };
          })
        );
        setDbScenesFallback(fallback);
      }
    } catch (e) {
      console.error("Failed to load story data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined" && !actionOptionsHandledRef.current) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "options") {
        actionOptionsHandledRef.current = true;
        window.history.replaceState({}, "", window.location.pathname);
        setShowOptionsModal(true);
      }
    }
  }, [projectId]);

  const activeArtifact = artifacts.find(a => a.artifactType === activeTab);
  const currentVersion = activeArtifact?.versions.find(v => v.id === activeArtifact.currentVersionId)
    ?? activeArtifact?.versions[activeArtifact.versions.length - 1];

  // Parse scenes from current screenplay version
  let screenplayScenes: SceneData[] = [];
  let screenplayTitle = project?.title || "Screenplay";
  if (activeArtifact?.artifactType === "SCREENPLAY" && currentVersion?.contentText) {
    try {
      const parsed = JSON.parse(currentVersion.contentText);
      if (parsed && Array.isArray(parsed.scenes)) {
        screenplayScenes = parsed.scenes;
        if (parsed.title) screenplayTitle = parsed.title;
      }
    } catch {}
  }

  // If screenplay artifact had plain text or was empty, use DB scenes fallback so Scene Cards ALWAYS render!
  if (screenplayScenes.length === 0 && dbScenesFallback.length > 0) {
    screenplayScenes = dbScenesFallback;
  }

  // Handle Edit Scene Save
  async function handleSaveScene() {
    if (!editingScene) return;
    setSavingScene(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/story/scene`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingScene),
      });
      if (res.ok) {
        setEditingScene(null);
        await loadData();
      }
    } catch (e) {
      console.error("Failed to save scene", e);
    } finally {
      setSavingScene(false);
    }
  }

  // Handle AI Scene Regeneration
  async function handleRegenerateScene() {
    if (regenSceneNum === null) return;
    setIsRegenerating(true);
    setRegenError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/story/regenerate-scene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneNumber: regenSceneNum,
          instructions: regenInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to regenerate scene with AI");
      }
      setRegenSceneNum(null);
      setRegenInstructions("");
      await loadData();
    } catch (err: any) {
      setRegenError(err.message || "Failed to regenerate scene.");
    } finally {
      setIsRegenerating(false);
    }
  }

  // Handle Inline Scene AI Director Chat-Bot Co-Pilot
  async function handleInlineSceneRegenerate(sceneNum: number) {
    const instructions = sceneAiInputs[sceneNum] || "";
    setInlineRegenLoadingScene(sceneNum);
    setInlineRegenError(null);
    setInlineRegenErrorScene(null);
    setInlineRegenSuccessScene(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/story/regenerate-scene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneNumber: sceneNum,
          instructions: instructions.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to rewrite scene with AI");
      }

      setSceneAiInputs(prev => ({ ...prev, [sceneNum]: "" }));
      setInlineRegenSuccessScene(sceneNum);
      setTimeout(() => setInlineRegenSuccessScene(null), 4000);
      await loadData();
    } catch (err: any) {
      setInlineRegenErrorScene(sceneNum);
      setInlineRegenError(err.message || "Failed to rewrite scene.");
    } finally {
      setInlineRegenLoadingScene(null);
    }
  }

  // Handle Generate 2 Competing Story Options (Option A vs Option B) based on Idea Analysis
  async function handleGenerateStoryOptions(useMock = false) {
    setIsGeneratingOptions(true);
    setOptionsError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/story/generate-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: optionsIdeaText,
          useMock,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to generate story options.");
      }
      setStoryOptions(data.data?.options || []);
      setSelectedOptionTab("A");
    } catch (err: any) {
      setOptionsError(err.message || "Failed to generate story options.");
    } finally {
      setIsGeneratingOptions(false);
    }
  }

  // Handle Select Story Option
  async function handleSelectStoryOption(option: StoryOption) {
    setIsSelectingOption(true);
    setOptionsError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/story/select-option`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to select story option.");
      }
      setShowOptionsModal(false);
      setStoryOptions(null);
      await loadData();
    } catch (err: any) {
      setOptionsError(err.message || "Failed to activate story option.");
    } finally {
      setIsSelectingOption(false);
    }
  }

  // Handle Raw Text Edit Save
  async function handleSaveRawEdit() {
    if (!activeArtifact) return;
    setSavingRaw(true);
    try {
      await fetch(`/api/story-artifacts/${activeArtifact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentText: rawEditText }),
      });
      setRawEditing(false);
      await loadData();
    } finally {
      setSavingRaw(false);
    }
  }

  // Handle Approve
  async function handleApprove() {
    if (!activeArtifact) return;
    setApproving(true);
    try {
      await fetch(`/api/story-artifacts/${activeArtifact.id}/approve`, { method: "POST" });
      await loadData();
    } finally {
      setApproving(false);
    }
  }

  // Extract emotional delivery tag helper
  function extractDialogueDelivery(dialogueText = ""): { speaker: string; text: string; delivery: string } {
    let speaker = "Character";
    let text = dialogueText;
    let delivery = "உற்சாகமாகவும், தெளிவாகவும்";

    const speakerMatch = dialogueText.match(/^(?:\[@?([A-Za-z0-9_-]+)\]|@?([A-Za-z0-9_-]+))\s*(?:speaks|says)?:?\s*(.*)$/i);
    if (speakerMatch) {
      speaker = speakerMatch[1] || speakerMatch[2];
      text = speakerMatch[3] || text;
    }

    if (text.includes("?") || text.includes("நடுங்குது") || text.includes("பயம்")) {
      delivery = "பயத்துடனும், அவசரமாகவும்";
    } else if (text.includes("யானை") || text.includes("வாம்மா") || text.includes("கத்துற")) {
      delivery = "அதிர்ச்சியுடனும், ஆவேசமாகவும்";
    } else if (text.includes("ஜெயிப்போம்") || text.includes("களமிறங்குவோம்") || text.includes("வாங்கடா")) {
      delivery = "உற்சாகமாகவும், போர் முழக்கமாகவும்";
    }

    return { speaker, text: text.replace(/^"|"$/g, ""), delivery };
  }

  return (
    <AppShell>
      <div className="flex flex-col min-h-screen bg-black text-zinc-100">
        
        {/* Global Film Production 5-Step Workflow Nav */}
        <ProjectWorkflowNav
          projectId={projectId}
          activeStep="script"
          projectTitle={project?.title}
          visualStyle={project?.visualStyle}
          rightAction={
            <button
              type="button"
              onClick={() => {
                setShowOptionsModal(true);
                if (!storyOptions) handleGenerateStoryOptions();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-700/80 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              title="Develop two different story options from your idea to compare and choose the best one"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">✨ 2 Story Options (A / B)</span>
              <span className="sm:hidden">Options</span>
            </button>
          }
        />

        {/* Studio Sub-Header & Artifact Selector */}
        <div className="border-b border-slate-200 bg-white px-6 py-2.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {ORDER.map(type => {
                const art = artifacts.find(a => a.artifactType === type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveTab(type);
                      setRawEditing(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                      activeTab === type
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span>{TYPE_LABELS[type]}</span>
                    {art?.approvalStatus === "APPROVED" && (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* View & Version Controls */}
            <div className="flex items-center gap-2 text-xs">
              {activeTab === "SCREENPLAY" && (
                <button
                  type="button"
                  onClick={() => setIsRawView(!isRawView)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-mono text-[11px] font-medium transition"
                >
                  {isRawView ? "Show Card View" : "Show Raw View"}
                </button>
              )}
              {activeArtifact?.approvalStatus !== "APPROVED" && (
                <Button size="sm" onClick={handleApprove} loading={approving} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <CheckCircle className="h-3 w-3 mr-1" /> Approve Script
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-3" />
              <p className="text-sm font-medium">Loading screenplay and scene data…</p>
            </div>
          ) : activeTab === "SCREENPLAY" && !isRawView && screenplayScenes.length > 0 ? (
            
            /* High-End Production Script Scene Cards (Matching User Screenshots) */
            <div className="space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Scene-by-Scene Director Script</span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {screenplayScenes.length} Scenes
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Finalize your story and dialogue here. Click <strong className="text-amber-700">Edit Script</strong> on any scene to edit dialogue, or <strong className="text-purple-700">AI Regenerate</strong> to rewrite that specific scene.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsModal(true);
                      if (!storyOptions) handleGenerateStoryOptions();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition shadow-xs"
                  >
                    <SplitSquareVertical className="h-3.5 w-3.5 text-purple-600" />
                    <span>Develop 2 Story Options (A / B)</span>
                  </button>

                  <Link
                    href={`/projects/${projectId}/bible`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-xs"
                    title="Proceed to Step 2: Assets (Lock characters, appearance, and wardrobe)"
                  >
                    <span>Proceed to Step 2: Assets</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {screenplayScenes.map((scene) => {
                const dlgInfo = extractDialogueDelivery(scene.dialogue);
                const duration = scene.estimatedDurationSeconds || 8;

                return (
                  <div
                    key={scene.sceneNumber}
                    className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                      
                      {/* Left Column: Scene Metadata Badge (Matching Screenshot) */}
                      <div className="lg:col-span-3 bg-slate-50/80 p-5 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="inline-block px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs font-bold uppercase tracking-wider mb-2.5">
                            SCENE {String(scene.sceneNumber).padStart(2, "0")}
                          </div>
                          
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {scene.heading || `SCENE ${scene.sceneNumber}`}
                          </h3>

                          <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-mono">
                            <p className="flex items-center gap-1.5">
                              <span>⏱️</span>
                              <span className="font-bold text-amber-600">{duration}s</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500 font-sans">Omni Flash / Veo 2</span>
                            </p>
                            <p className="text-slate-500 text-[11px] font-sans">
                              {scene.location} · {scene.timeOfDay}
                            </p>
                          </div>
                        </div>

                        {/* Quick Action Badges */}
                        <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                          <Link
                            href={`/projects/${projectId}/storyboard`}
                            className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
                          >
                            <span>Open in Storyboard Studio</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Right Column: Complete Screenplay Script Beat */}
                      <div className="lg:col-span-9 p-6 space-y-4 bg-white">
                        
                        {/* Heading & Action Buttons (Matching Screenshot Top Right) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>{scene.heading}</span>
                          </h4>

                          <div className="flex items-center gap-2">
                            {/* AI Regenerate Scene Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setRegenSceneNum(scene.sceneNumber);
                                setRegenInstructions("");
                                setRegenError(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold shadow-xs transition"
                              title="Regenerate only this scene using AI with custom instructions"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                              <span>AI Regenerate</span>
                            </button>

                            {/* Edit Script Button (Matching User Screenshot Red Circle) */}
                            <button
                              type="button"
                              onClick={() => setEditingScene({ ...scene })}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold shadow-xs transition group"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                              <span>Edit Script</span>
                            </button>
                          </div>
                        </div>

                        {/* VOICEOVER NARRATION */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                            <Mic className="h-3 w-3 text-amber-600" /> VOICEOVER NARRATION:
                          </span>
                          {scene.voiceover && scene.voiceover.trim().length > 0 ? (
                            <div className="rounded-xl bg-amber-50/50 border border-amber-200/70 p-3.5">
                              <p className="text-xs md:text-sm text-slate-800 italic font-serif leading-relaxed">
                                “{scene.voiceover}”
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic pl-1">
                              (Pure dialogue & visual action beat; narrator silent)
                            </p>
                          )}
                        </div>

                        {/* SPOKEN CHARACTER DIALOGUE & DELIVERY */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3 text-sky-600" /> SPOKEN CHARACTER DIALOGUE &amp; DELIVERY:
                          </span>
                          {scene.dialogue && scene.dialogue.trim().length > 0 ? (
                            <div className="rounded-xl bg-sky-50/50 border border-sky-200/70 p-3.5 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-sky-800 font-mono">
                                  {dlgInfo.speaker}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                                  {dlgInfo.delivery}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-slate-900 font-mono font-medium leading-relaxed pl-1">
                                “{dlgInfo.text}”
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic pl-1">
                              (No character dialogue spoken in this scene)
                            </p>
                          )}
                        </div>

                        {/* VISUAL PROMPT & ACTION */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                            <Film className="h-3 w-3 text-slate-500" /> VISUAL PROMPT &amp; CAMERA:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans">
                            {scene.action}
                          </p>
                        </div>

                        {/* AUDIO & SOUND DESIGN */}
                        {scene.audioScript && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                              <Volume2 className="h-3 w-3 text-slate-500" /> AUDIO ATMOSPHERE &amp; FOLEY:
                            </span>
                            <p className="text-xs text-slate-600 font-mono leading-relaxed pl-1">
                              {scene.audioScript}
                            </p>
                          </div>
                        )}

                        {/* AI Director Co-Pilot (Chat-Bot Style Inline Scene Instruction) */}
                        <div className="mt-4 pt-3.5 border-t border-purple-100 bg-purple-50/40 -mx-6 -mb-6 p-4 rounded-b-2xl space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                              <span>AI Director Co-Pilot · Modify Scene {scene.sceneNumber}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Type instruction like a chat bot &amp; click AI Rewrite
                            </span>
                          </div>

                          {/* Quick instruction pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "Make dialogue more emotional",
                              "Add frantic screams & fear",
                              "Increase suspense with elephant threat",
                              "Add mother comforting Karthi",
                              "Make action faster & urgent",
                            ].map((hint) => (
                              <button
                                key={hint}
                                type="button"
                                onClick={() => {
                                  setSceneAiInputs((prev) => ({
                                    ...prev,
                                    [scene.sceneNumber]: prev[scene.sceneNumber]
                                      ? `${prev[scene.sceneNumber]}, ${hint}`
                                      : hint,
                                  }));
                                }}
                                className="text-[10px] px-2.5 py-0.5 rounded-full bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 transition font-medium shadow-2xs"
                              >
                                + {hint}
                              </button>
                            ))}
                          </div>

                          {/* Chat-bot input form */}
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={sceneAiInputs[scene.sceneNumber] || ""}
                                onChange={(e) =>
                                  setSceneAiInputs((prev) => ({
                                    ...prev,
                                    [scene.sceneNumber]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleInlineSceneRegenerate(scene.sceneNumber);
                                  }
                                }}
                                placeholder={`e.g. "Make Karthi shout louder in Tamil", "Add sound of crashing basket", "Make mother hug him"...`}
                                disabled={inlineRegenLoadingScene === scene.sceneNumber}
                                className="w-full px-3.5 py-2 rounded-xl bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-500 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition font-sans pr-8 shadow-xs"
                              />
                              {sceneAiInputs[scene.sceneNumber] && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSceneAiInputs((prev) => ({
                                      ...prev,
                                      [scene.sceneNumber]: "",
                                    }))
                                  }
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleInlineSceneRegenerate(scene.sceneNumber)}
                              disabled={inlineRegenLoadingScene === scene.sceneNumber}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              <Sparkles
                                className={`h-3.5 w-3.5 ${
                                  inlineRegenLoadingScene === scene.sceneNumber ? "animate-spin" : ""
                                }`}
                              />
                              <span>
                                {inlineRegenLoadingScene === scene.sceneNumber
                                  ? "Rewriting Scene…"
                                  : "✨ AI Rewrite"}
                              </span>
                            </button>
                          </div>

                          {inlineRegenError && inlineRegenErrorScene === scene.sceneNumber && (
                            <p className="text-[11px] text-rose-600 font-medium">{inlineRegenError}</p>
                          )}
                          {inlineRegenSuccessScene === scene.sceneNumber && (
                            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-600" /> Scene {scene.sceneNumber} successfully rewritten with your instructions!
                            </p>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Step 1 Completion & Next Action Guidance Card */}
              <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-6 mt-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Step 1: Script &amp; Dialogues Finalized
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      {screenplayScenes.length} Scenes Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    Your screenplay dialogue, camera blocking, and timings are set. Next, proceed to <strong>Step 2: Assets (Bible)</strong> to review your locked character facial profiles, wardrobe, and voice directives before generating video prompts.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${projectId}/bible`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-xs"
                  >
                    <span>Proceed to Step 2: Assets (Bible)</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            
            /* Standard / Raw View for Other Story Artifacts or Empty Screenplay */
            <div className="space-y-4">
              {/* Prominent AI Generation & Options Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-amber-50 border border-purple-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-200 text-purple-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Develop Story from One-Line Idea</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-bold">
                        AI Studio
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Generate 2 competing story treatments (Option A vs Option B) to compare and pick the best one.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsModal(true);
                      if (!storyOptions) handleGenerateStoryOptions();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <SplitSquareVertical className="h-4 w-4" />
                    <span>✨ Develop 2 Story Options (A / B)</span>
                  </button>

                  <Link
                    href={`/projects/${projectId}/storyboard`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition"
                  >
                    <span>Open Storyboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Artifact Card / Textarea */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{TYPE_LABELS[activeTab]}</h3>
                    <Badge status={artifactStatusBadge(activeArtifact?.approvalStatus || "DRAFT")} label={activeArtifact?.approvalStatus || "DRAFT"} />
                  </div>
                  {!rawEditing && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRawEditText(currentVersion?.contentText || "");
                        setRawEditing(true);
                      }}
                      className="h-7 text-xs border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Raw Text
                    </Button>
                  )}
                </div>

                {rawEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={rawEditText}
                      onChange={e => setRawEditText(e.target.value)}
                      className="w-full h-[450px] rounded-xl border border-slate-300 bg-white p-4 text-xs font-mono text-slate-900 focus:border-amber-500 focus:outline-none resize-none leading-relaxed shadow-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setRawEditing(false)}>
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" loading={savingRaw} onClick={handleSaveRawEdit} className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 shadow-xs">
                        <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <pre className="whitespace-pre-wrap text-xs font-mono text-slate-800 leading-relaxed bg-slate-50 rounded-xl p-5 border border-slate-200 max-h-[600px] overflow-y-auto">
                      {(() => {
                        if (currentVersion?.contentText && currentVersion.contentText.trim().length > 0) {
                          return currentVersion.contentText;
                        }
                        if (screenplayScenes.length === 0) {
                          return "No content generated yet. Click 'Develop 2 Story Options' above to generate your screenplay.";
                        }
                        if (activeTab === "SYNOPSIS") {
                          return `FILM SYNOPSIS & NARRATIVE SUMMARY:\n\n${project?.sourceIdea ? `ORIGINAL PREMISE:\n"${project.sourceIdea}"\n\n` : ""}SCENE-BY-SCENE NARRATIVE ARC:\n${screenplayScenes.map(s => `• Scene ${s.sceneNumber} (${s.heading}):\n  Visual: ${s.action}\n  ${s.dialogue ? `Dialogue: ${s.dialogue}` : ""}`).join("\n\n")}`;
                        }
                        if (activeTab === "OUTLINE") {
                          const act1 = screenplayScenes.slice(0, 2);
                          const act2 = screenplayScenes.slice(2, 4);
                          const act3 = screenplayScenes.slice(4);
                          return `3-ACT DRAMATIC FILM OUTLINE:\n\nACT I — THE HOOK & WORLD SETUP (Scenes 1-2):\n${act1.map(s => `• Scene ${s.sceneNumber} (${s.heading}): ${s.action}`).join("\n\n")}\n\nACT II — RISING CONFLICT & COMPLICATIONS (Scenes 3-4):\n${act2.map(s => `• Scene ${s.sceneNumber} (${s.heading}): ${s.action}`).join("\n\n")}\n\nACT III — CLIMAX & PAYOFF (Scenes 5-6):\n${act3.map(s => `• Scene ${s.sceneNumber} (${s.heading}): ${s.action}`).join("\n\n")}`;
                        }
                        if (activeTab === "CHARACTER_ARCS") {
                          const charSet = new Set<string>();
                          screenplayScenes.forEach(s => {
                            const matches = (s.action + " " + (s.dialogue || "")).match(/\[@([A-Za-z0-9_-]+)\]/g) || [];
                            matches.forEach(m => charSet.add(m.replace(/\[@|\]/g, "")));
                          });
                          if (charSet.size === 0) charSet.add("Protagonist");
                          return `CHARACTER PROFILES & DRAMATIC ROLES:\n\n${Array.from(charSet).map((name, idx) => `• [@${name}] (${idx === 0 ? "Protagonist" : "Supporting Character"}):\n  Appears in: ${screenplayScenes.filter(s => (s.action + (s.dialogue || "")).includes(`[@${name}]`)).map(s => `Scene ${s.sceneNumber}`).join(", ") || "Main Scenes"}\n  Wardrobe & Role: Locked regional character profile used for Google Flow visual continuity.`).join("\n\n")}`;
                        }
                        return "No content generated yet.";
                      })()}
                    </pre>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveTab("SCREENPLAY")}
                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 transition"
                      >
                        ← Return to Screenplay (Script) Scene Cards
                      </button>

                      <Link
                        href={`/projects/${projectId}/bible`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-md"
                      >
                        <span>Proceed to Step 2: Assets (Bible)</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* 1. Modal: Edit Scene Script (When User Clicks 'Edit Script') */}
        {editingScene && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Script · Scene {editingScene.sceneNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingScene(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Scene Heading */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scene Heading</label>
                  <input
                    type="text"
                    value={editingScene.heading}
                    onChange={e => setEditingScene({ ...editingScene, heading: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. EXT. SUGARCANE PLANTATION - DAY"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingScene.location || ""}
                      onChange={e => setEditingScene({ ...editingScene, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                      placeholder="e.g. Village Courtyard"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Duration (Seconds)</label>
                    <div className="flex gap-2">
                      {[8, 10].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setEditingScene({ ...editingScene, estimatedDurationSeconds: sec })}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition shadow-xs ${
                            (editingScene.estimatedDurationSeconds || 8) === sec
                              ? "bg-amber-500 text-slate-950 border border-amber-400 font-bold"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-200"
                          }`}
                        >
                          ⏱️ {sec}s (Omni)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Spoken Character Dialogue */}
                <div>
                  <label className="block text-xs font-semibold text-sky-800 mb-1">
                    Spoken Character Dialogue ({project?.storyLanguage || "Tamil"})
                  </label>
                  <textarea
                    rows={3}
                    value={editingScene.dialogue || ""}
                    onChange={e => setEditingScene({ ...editingScene, dialogue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-300 text-xs font-mono text-slate-900 focus:border-sky-500 focus:outline-none leading-relaxed"
                    placeholder='e.g. [@Amma] speaks: "கார்த்தி! ஏன் இப்படி அலறிட்டே ஓடி வர்ற?!"'
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format with character tag: <code className="text-sky-700 font-semibold">[@Name] speaks: "..."</code>. When dialogue is present, narrator voice-over is suppressed.
                  </p>
                </div>

                {/* Voice-Over Narration */}
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Voice-Over Narration ({project?.storyLanguage || "Tamil"})
                  </label>
                  <textarea
                    rows={2}
                    value={editingScene.voiceover || ""}
                    onChange={e => setEditingScene({ ...editingScene, voiceover: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-300 text-xs font-serif italic text-slate-900 focus:border-amber-500 focus:outline-none leading-relaxed"
                    placeholder='Narrator voiceover script (leave empty if character is actively speaking dialogue above)'
                  />
                </div>

                {/* Visual Action */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visual Action Description (English)</label>
                  <textarea
                    rows={4}
                    value={editingScene.action}
                    onChange={e => setEditingScene({ ...editingScene, action: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:border-amber-500 focus:outline-none leading-relaxed"
                    placeholder="Describe character movements, dramatic facial reactions, and camera blocking in vivid detail..."
                  />
                </div>

                {/* Audio Atmosphere & Foley */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sound Design &amp; Foley</label>
                  <input
                    type="text"
                    value={editingScene.audioScript || ""}
                    onChange={e => setEditingScene({ ...editingScene, audioScript: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Screams echoing in distance, vegetable basket crashing to dirt, heavy panting"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50/80">
                <Button variant="ghost" size="sm" onClick={() => setEditingScene(null)} className="text-slate-600 hover:text-slate-900">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={savingScene}
                  onClick={handleSaveScene}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Script Changes
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* 2. Modal: AI Scene Regenerate (When User Clicks 'AI Regenerate') */}
        {regenSceneNum !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl flex flex-col">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-purple-50/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-purple-900">
                    Regenerate Scene {regenSceneNum} with AI
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRegenSceneNum(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-purple-100/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  AI will rewrite only <strong className="text-purple-700">Scene {regenSceneNum}</strong> while preserving character wardrobe, voice, and strict cause-and-effect continuity with previous and upcoming scenes.
                </p>

                {regenError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {regenError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Director's Instructions for AI (Optional):
                  </label>
                  <textarea
                    rows={4}
                    value={regenInstructions}
                    onChange={e => setRegenInstructions(e.target.value)}
                    placeholder="e.g. 'Make Karthi shout more frantically to his mother', 'Add emotional Tamil dialogue for grandmother', 'Increase the suspense when elephant appears'..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none leading-relaxed shadow-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leave blank for an automatic smart refresh, or specify exact dramatic adjustments.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50/80">
                <Button variant="ghost" size="sm" onClick={() => setRegenSceneNum(null)} disabled={isRegenerating} className="text-slate-600 hover:text-slate-900">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={isRegenerating}
                  onClick={handleRegenerateScene}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  {isRegenerating ? "Regenerating Scene…" : `Regenerate Scene ${regenSceneNum}`}
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* 3. Modal: Develop 2 Competing Story Options (Option A vs Option B) */}
        {showOptionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl flex flex-col">
              
              {/* Modal Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 via-white to-purple-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 border border-purple-200 text-purple-700">
                    <SplitSquareVertical className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Develop 2 Story Options (A vs B)
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-semibold font-mono">
                        Director Pitch
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review both fully developed screenplays, compare their tone and dialogues, and choose the best one.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOptionsModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Idea Prompt Input Bar (If user wants to refine their one-line idea) */}
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 space-y-3.5">
                
                {/* 1. Viral Cash-Cow 1-Click Presets (Sabarkaro Mode) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> 1-Click Viral Cash-Cow Presets (Sabarkaro Mode):
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Click any pill to auto-fill proven hook
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CASHCOW_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setOptionsIdeaText(preset.prompt)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-xs text-slate-700 hover:text-amber-900 transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Core Idea Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
                      Initial Story Idea (AI will analyze this to build 2 unique story treatments):
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {optionsIdeaText.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={optionsIdeaText}
                    onChange={e => setOptionsIdeaText(e.target.value)}
                    placeholder="Enter your film idea here (any genre, character, or setting)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none leading-relaxed shadow-xs"
                  />
                </div>

                {/* 3. Clone Viral YouTube Competitor Video */}
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-sky-800 font-mono font-semibold">
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Clone Viral YouTube Video:</span>
                  </div>
                  <div className="flex-1 min-w-[240px] flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Paste viral YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                      value={ytCompetitorUrl}
                      onChange={(e) => setYtCompetitorUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      disabled={!ytCompetitorUrl.trim()}
                      onClick={() => {
                        setOptionsIdeaText(`Analyze and clone the viral hook and storytelling structure of this YouTube video: ${ytCompetitorUrl.trim()}. Re-engineer it into an original 5-scene cinematic screenplay in native dialogue with fresh narrative perspective.`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition disabled:opacity-40 shadow-xs"
                    >
                      Import Hook
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">
                    💡 AI analyzes your specific idea and derives two organic, contrasting creative angles.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isGeneratingOptions}
                      onClick={() => handleGenerateStoryOptions(true)}
                      className="text-xs text-slate-600 hover:text-slate-900 h-8"
                    >
                      Instant Mock Preview
                    </Button>
                    <Button
                      size="sm"
                      loading={isGeneratingOptions}
                      onClick={() => handleGenerateStoryOptions(false)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs h-8 px-4 shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      <span>{isGeneratingOptions ? "Analyzing & Developing…" : "Generate 2 Options with AI"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {optionsError && (
                <div className="mx-6 mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 font-medium">
                  <span className="font-bold">Error:</span>
                  <span>{optionsError}</span>
                </div>
              )}

              {/* Options Comparison Stage */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isGeneratingOptions ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                    <p className="text-sm font-semibold text-slate-800">Analyzing your story idea &amp; developing 2 unique creative treatments…</p>
                    <p className="text-xs text-slate-500">Writing custom narrative angles, 8s/10s scene breakdowns, and authentic native dialogues.</p>
                  </div>
                ) : storyOptions && storyOptions.length >= 2 ? (
                  <div className="space-y-4">
                    {/* Option Selection Tabs */}
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                      {storyOptions.map(opt => (
                        <button
                          key={opt.optionId}
                          type="button"
                          onClick={() => setSelectedOptionTab(opt.optionId)}
                          className={`p-3 rounded-lg text-left transition flex items-start justify-between gap-2 ${
                            selectedOptionTab === opt.optionId
                              ? "bg-white border border-purple-500 shadow-xs"
                              : "hover:bg-slate-200/60 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 block">
                              OPTION {opt.optionId} · {opt.conceptAngle}
                            </span>
                            <span className="text-sm font-bold text-slate-900 block mt-0.5">
                              {opt.title}
                            </span>
                          </div>
                          {selectedOptionTab === opt.optionId && (
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 mt-1" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Active Selected Option Presentation */}
                    {(() => {
                      const activeOpt = storyOptions.find(o => o.optionId === selectedOptionTab) || storyOptions[0];
                      return (
                        <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                          {/* Option Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                            <div>
                              <span className="text-xs font-mono font-bold text-purple-700">
                                OPTION {activeOpt.optionId}: {activeOpt.conceptAngle}
                              </span>
                              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                                {activeOpt.title}
                              </h3>
                              <p className="text-xs text-slate-600 italic mt-1 leading-relaxed">
                                Logline: &ldquo;{activeOpt.logline}&rdquo;
                              </p>
                            </div>

                            <Button
                              size="sm"
                              loading={isSelectingOption}
                              onClick={() => handleSelectStoryOption(activeOpt)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 py-2 shadow-xs"
                            >
                              <Check className="h-4 w-4 mr-1.5" />
                              <span>Select &amp; Use Option {activeOpt.optionId}</span>
                            </Button>
                          </div>

                          {/* Premise */}
                          <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-sans shadow-2xs">
                            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-0.5">Premise &amp; Tone:</span>
                            {activeOpt.premise}
                          </div>

                          {/* Scene by Scene Preview */}
                          <div className="space-y-3 pt-2">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                              Scene Breakdown ({activeOpt.scenes.length} Scenes):
                            </span>

                            {activeOpt.scenes.map(sc => (
                              <div
                                key={sc.sceneNumber}
                                className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                                  <span className="font-bold text-amber-700">SCENE {sc.sceneNumber}: {sc.heading}</span>
                                  <span className="font-semibold">{sc.estimatedDurationSeconds || 8}s</span>
                                </div>
                                <p className="text-slate-800 leading-relaxed">
                                  {sc.action}
                                </p>
                                {sc.dialogue && (
                                  <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 font-mono text-[11px]">
                                    {sc.dialogue}
                                  </div>
                                )}
                                {sc.voiceover && (
                                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 italic font-serif text-[11px]">
                                    &ldquo;{sc.voiceover}&rdquo;
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                    <SplitSquareVertical className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No story options generated yet.</p>
                    <p className="text-xs text-slate-500 max-w-md text-center">
                      Click the &ldquo;Develop 2 Options&rdquo; button above to create two full screenplay concepts from your idea.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

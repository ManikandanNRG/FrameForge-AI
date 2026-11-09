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
        <div className="border-b border-zinc-900 bg-zinc-950/40 px-6 py-2.5">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
                      activeTab === type
                        ? "bg-zinc-800 text-amber-300 shadow-sm border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    <span>{TYPE_LABELS[type]}</span>
                    {art?.approvalStatus === "APPROVED" && (
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
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
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 font-mono text-[11px] transition"
                >
                  {isRawView ? "Show Card View" : "Show Raw View"}
                </button>
              )}
              {activeArtifact?.approvalStatus !== "APPROVED" && (
                <Button size="sm" onClick={handleApprove} loading={approving} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500">
                  <CheckCircle className="h-3 w-3 mr-1" /> Approve Script
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-400 mb-3" />
              <p className="text-sm">Loading screenplay and scene data…</p>
            </div>
          ) : activeTab === "SCREENPLAY" && !isRawView && screenplayScenes.length > 0 ? (
            
            /* High-End Production Script Scene Cards (Matching User Screenshots) */
            <div className="space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
                <div>
                  <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
                    <span>Scene-by-Scene Director Script</span>
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700/60">
                      {screenplayScenes.length} Scenes
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Finalize your story and dialogue here. Click <strong className="text-amber-400">Edit Script</strong> on any scene to edit dialogue, or <strong className="text-purple-400">AI Regenerate</strong> to rewrite that specific scene.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsModal(true);
                      if (!storyOptions) handleGenerateStoryOptions();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-medium transition"
                  >
                    <SplitSquareVertical className="h-3.5 w-3.5 text-purple-400" />
                    <span>Develop 2 Story Options (A / B)</span>
                  </button>

                  <Link
                    href={`/projects/${projectId}/storyboard`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-md"
                  >
                    <span>Proceed to Storyboard Prompts</span>
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
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 shadow-xl overflow-hidden transition-all hover:border-zinc-700/90"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/60">
                      
                      {/* Left Column: Scene Metadata Badge (Matching Screenshot) */}
                      <div className="lg:col-span-3 bg-zinc-900/40 p-5 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="inline-block px-3 py-1 rounded-md bg-blue-950/80 border border-blue-700/50 text-blue-300 font-mono text-xs font-bold uppercase tracking-wider mb-2.5">
                            SCENE {String(scene.sceneNumber).padStart(2, "0")}
                          </div>
                          
                          <h3 className="text-sm font-semibold text-zinc-200 leading-snug">
                            {scene.heading || `SCENE ${scene.sceneNumber}`}
                          </h3>

                          <div className="mt-3 space-y-1.5 text-xs text-zinc-400 font-mono">
                            <p className="flex items-center gap-1.5">
                              <span className="text-zinc-600">⏱️</span>
                              <span className="font-bold text-amber-400">{duration}s</span>
                              <span className="text-zinc-600">·</span>
                              <span>Omni Flash / Veo 2</span>
                            </p>
                            <p className="text-zinc-500 text-[11px]">
                              {scene.location} · {scene.timeOfDay}
                            </p>
                          </div>
                        </div>

                        {/* Quick Action Badges */}
                        <div className="pt-2 border-t border-zinc-800/50 flex flex-col gap-1.5">
                          <Link
                            href={`/projects/${projectId}/storyboard`}
                            className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 font-medium"
                          >
                            <span>Open in Storyboard Studio</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Right Column: Complete Screenplay Script Beat */}
                      <div className="lg:col-span-9 p-6 space-y-4 bg-zinc-950/60">
                        
                        {/* Heading & Action Buttons (Matching Screenshot Top Right) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-700/80 rounded-lg text-xs font-semibold shadow-sm transition"
                              title="Regenerate only this scene using AI with custom instructions"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                              <span>AI Regenerate</span>
                            </button>

                            {/* Edit Script Button (Matching User Screenshot Red Circle) */}
                            <button
                              type="button"
                              onClick={() => setEditingScene({ ...scene })}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-amber-500/60 hover:border-amber-400 rounded-lg text-xs font-semibold shadow-sm transition group"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                              <span className="text-amber-300">Edit Script</span>
                            </button>
                          </div>
                        </div>

                        {/* VOICEOVER NARRATION */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                            <Mic className="h-3 w-3 text-amber-400/80" /> VOICEOVER NARRATION:
                          </span>
                          {scene.voiceover && scene.voiceover.trim().length > 0 ? (
                            <div className="rounded-xl bg-black/60 border border-amber-900/30 p-3.5">
                              <p className="text-xs md:text-sm text-zinc-200 italic font-serif leading-relaxed">
                                “{scene.voiceover}”
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500 italic pl-1">
                              (Pure dialogue & visual action beat; narrator silent)
                            </p>
                          )}
                        </div>

                        {/* SPOKEN CHARACTER DIALOGUE & DELIVERY */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3 text-sky-400/80" /> SPOKEN CHARACTER DIALOGUE &amp; DELIVERY:
                          </span>
                          {scene.dialogue && scene.dialogue.trim().length > 0 ? (
                            <div className="rounded-xl bg-black/60 border border-sky-900/30 p-3.5 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-sky-300 font-mono">
                                  {dlgInfo.speaker}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/80 border border-purple-700/60 text-purple-300">
                                  {dlgInfo.delivery}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-zinc-100 font-mono leading-relaxed pl-1">
                                “{dlgInfo.text}”
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500 italic pl-1">
                              (No character dialogue spoken in this scene)
                            </p>
                          )}
                        </div>

                        {/* VISUAL PROMPT & ACTION */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                            <Film className="h-3 w-3 text-zinc-400" /> VISUAL PROMPT &amp; CAMERA:
                          </span>
                          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60 font-sans">
                            {scene.action}
                          </p>
                        </div>

                        {/* AUDIO & SOUND DESIGN */}
                        {scene.audioScript && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                              <Volume2 className="h-3 w-3 text-zinc-400" /> AUDIO ATMOSPHERE &amp; FOLEY:
                            </span>
                            <p className="text-xs text-zinc-400 font-mono leading-relaxed pl-1">
                              {scene.audioScript}
                            </p>
                          </div>
                        )}

                        {/* AI Director Co-Pilot (Chat-Bot Style Inline Scene Instruction) */}
                        <div className="mt-4 pt-3.5 border-t border-purple-900/40 bg-purple-950/25 -mx-6 -mb-6 p-4 rounded-b-2xl space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                              <span>AI Director Co-Pilot · Modify Scene {scene.sceneNumber}</span>
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">
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
                                className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-750/60 transition font-medium"
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
                                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-purple-900/60 hover:border-purple-700 focus:border-purple-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition font-sans pr-8 shadow-inner"
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
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleInlineSceneRegenerate(scene.sceneNumber)}
                              disabled={inlineRegenLoadingScene === scene.sceneNumber}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
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
                            <p className="text-[11px] text-rose-400 font-medium">{inlineRegenError}</p>
                          )}
                          {inlineRegenSuccessScene === scene.sceneNumber && (
                            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              <Check className="h-3 w-3" /> Scene {scene.sceneNumber} successfully rewritten with your instructions!
                            </p>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            
            /* Standard / Raw View for Other Story Artifacts or Empty Screenplay */
            <div className="space-y-4">
              {/* Prominent AI Generation & Options Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-zinc-900 to-amber-950/40 border border-purple-800/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <span>Develop Story from One-Line Idea</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                        AI Studio
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition"
                  >
                    <SplitSquareVertical className="h-4 w-4" />
                    <span>✨ Develop 2 Story Options (A / B)</span>
                  </button>

                  <Link
                    href={`/projects/${projectId}/storyboard`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition"
                  >
                    <span>Open Storyboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Artifact Card / Textarea */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-200">{TYPE_LABELS[activeTab]}</h3>
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
                      className="h-7 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit Raw Text
                    </Button>
                  )}
                </div>

                {rawEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={rawEditText}
                      onChange={e => setRawEditText(e.target.value)}
                      className="w-full h-[450px] rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-xs font-mono text-zinc-200 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setRawEditing(false)}>
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button size="sm" loading={savingRaw} onClick={handleSaveRawEdit} className="bg-amber-500 text-black font-semibold hover:bg-amber-400">
                        <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs font-mono text-zinc-300 leading-relaxed bg-black/60 rounded-xl p-4 border border-zinc-800 max-h-[600px] overflow-y-auto">
                    {currentVersion?.contentText || "No content generated yet."}
                  </pre>
                )}
              </div>
            </div>
          )}
        </main>

        {/* 1. Modal: Edit Scene Script (When User Clicks 'Edit Script') */}
        {editingScene && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-zinc-100">
                    Edit Script · Scene {editingScene.sceneNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingScene(null)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Scene Heading */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Scene Heading</label>
                  <input
                    type="text"
                    value={editingScene.heading}
                    onChange={e => setEditingScene({ ...editingScene, heading: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. EXT. SUGARCANE PLANTATION - DAY"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingScene.location || ""}
                      onChange={e => setEditingScene({ ...editingScene, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
                      placeholder="e.g. Village Courtyard"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Duration (Seconds)</label>
                    <div className="flex gap-2">
                      {[8, 10].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setEditingScene({ ...editingScene, estimatedDurationSeconds: sec })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                            (editingScene.estimatedDurationSeconds || 8) === sec
                              ? "bg-amber-500 text-black border border-amber-400"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
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
                  <label className="block text-xs font-semibold text-sky-400 mb-1">
                    Spoken Character Dialogue ({project?.storyLanguage || "Tamil"})
                  </label>
                  <textarea
                    rows={3}
                    value={editingScene.dialogue || ""}
                    onChange={e => setEditingScene({ ...editingScene, dialogue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-sky-900/40 text-xs font-mono text-zinc-200 focus:border-sky-500 focus:outline-none leading-relaxed"
                    placeholder='e.g. [@Amma] speaks: "கார்த்தி! ஏன் இப்படி அலறிட்டே ஓடி வர்ற?!"'
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Format with character tag: <code className="text-sky-300">[@Name] speaks: "..."</code>. When dialogue is present, narrator voice-over is suppressed.
                  </p>
                </div>

                {/* Voice-Over Narration */}
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">
                    Voice-Over Narration ({project?.storyLanguage || "Tamil"})
                  </label>
                  <textarea
                    rows={2}
                    value={editingScene.voiceover || ""}
                    onChange={e => setEditingScene({ ...editingScene, voiceover: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-amber-900/40 text-xs font-serif italic text-zinc-200 focus:border-amber-500 focus:outline-none leading-relaxed"
                    placeholder='Narrator voiceover script (leave empty if character is actively speaking dialogue above)'
                  />
                </div>

                {/* Visual Action */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Visual Action Description (English)</label>
                  <textarea
                    rows={4}
                    value={editingScene.action}
                    onChange={e => setEditingScene({ ...editingScene, action: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none leading-relaxed"
                    placeholder="Describe character movements, dramatic facial reactions, and camera blocking in vivid detail..."
                  />
                </div>

                {/* Audio Atmosphere & Foley */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Sound Design &amp; Foley</label>
                  <input
                    type="text"
                    value={editingScene.audioScript || ""}
                    onChange={e => setEditingScene({ ...editingScene, audioScript: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Screams echoing in distance, vegetable basket crashing to dirt, heavy panting"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-zinc-800 bg-zinc-900/80">
                <Button variant="ghost" size="sm" onClick={() => setEditingScene(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={savingScene}
                  onClick={handleSaveScene}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Script Changes
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* 2. Modal: AI Scene Regenerate (When User Clicks 'AI Regenerate') */}
        {regenSceneNum !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-purple-800 bg-zinc-950 shadow-2xl flex flex-col">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/50 bg-purple-950/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-purple-200">
                    Regenerate Scene {regenSceneNum} with AI
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRegenSceneNum(null)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  AI will rewrite only <strong className="text-purple-300">Scene {regenSceneNum}</strong> while preserving character wardrobe, voice, and strict cause-and-effect continuity with previous and upcoming scenes.
                </p>

                {regenError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                    {regenError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Director's Instructions for AI (Optional):
                  </label>
                  <textarea
                    rows={4}
                    value={regenInstructions}
                    onChange={e => setRegenInstructions(e.target.value)}
                    placeholder="e.g. 'Make Karthi shout more frantically to his mother', 'Add emotional Tamil dialogue for grandmother', 'Increase the suspense when elephant appears'..."
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Leave blank for an automatic smart refresh, or specify exact dramatic adjustments.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-zinc-800 bg-zinc-900/80">
                <Button variant="ghost" size="sm" onClick={() => setRegenSceneNum(null)} disabled={isRegenerating}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={isRegenerating}
                  onClick={handleRegenerateScene}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-purple-700/80 bg-zinc-950 shadow-2xl flex flex-col">
              
              {/* Modal Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-purple-900/50 bg-gradient-to-r from-purple-950/80 via-zinc-950 to-purple-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    <SplitSquareVertical className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      Develop 2 Story Options (A vs B)
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                        Director Pitch
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Review both fully developed screenplays, compare their tone and dialogues, and choose the best one.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOptionsModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Idea Prompt Input Bar (If user wants to refine their one-line idea) */}
              <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Initial Story Idea (AI will analyze this to build 2 unique story treatments):
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {optionsIdeaText.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={optionsIdeaText}
                    onChange={e => setOptionsIdeaText(e.target.value)}
                    placeholder="Enter your film idea here (any genre, character, or setting)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-zinc-400">
                    💡 AI analyzes your specific idea and derives two organic, contrasting creative angles.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isGeneratingOptions}
                      onClick={() => handleGenerateStoryOptions(true)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 h-8"
                    >
                      Instant Mock Preview
                    </Button>
                    <Button
                      size="sm"
                      loading={isGeneratingOptions}
                      onClick={() => handleGenerateStoryOptions(false)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs h-8 px-4 shadow-md"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      <span>{isGeneratingOptions ? "Analyzing & Developing…" : "Generate 2 Options with AI"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {optionsError && (
                <div className="mx-6 mt-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{optionsError}</span>
                </div>
              )}

              {/* Options Comparison Stage */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isGeneratingOptions ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                    <p className="text-sm font-semibold text-zinc-200">Analyzing your story idea &amp; developing 2 unique creative treatments…</p>
                    <p className="text-xs text-zinc-500">Writing custom narrative angles, 8s/10s scene breakdowns, and authentic native dialogues.</p>
                  </div>
                ) : storyOptions && storyOptions.length >= 2 ? (
                  <div className="space-y-4">
                    {/* Option Selection Tabs */}
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
                      {storyOptions.map(opt => (
                        <button
                          key={opt.optionId}
                          type="button"
                          onClick={() => setSelectedOptionTab(opt.optionId)}
                          className={`p-3 rounded-lg text-left transition flex items-start justify-between gap-2 ${
                            selectedOptionTab === opt.optionId
                              ? "bg-zinc-800 border border-purple-500/80 shadow-md"
                              : "hover:bg-zinc-850 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 block">
                              OPTION {opt.optionId} · {opt.conceptAngle}
                            </span>
                            <span className="text-sm font-bold text-zinc-100 block mt-0.5">
                              {opt.title}
                            </span>
                          </div>
                          {selectedOptionTab === opt.optionId && (
                            <span className="w-2 h-2 rounded-full bg-purple-400 mt-1" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Active Selected Option Presentation */}
                    {(() => {
                      const activeOpt = storyOptions.find(o => o.optionId === selectedOptionTab) || storyOptions[0];
                      return (
                        <div className="space-y-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80">
                          {/* Option Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                            <div>
                              <span className="text-xs font-mono font-bold text-purple-400">
                                OPTION {activeOpt.optionId}: {activeOpt.conceptAngle}
                              </span>
                              <h3 className="text-lg font-bold text-zinc-100 mt-0.5">
                                {activeOpt.title}
                              </h3>
                              <p className="text-xs text-zinc-300 italic mt-1 leading-relaxed">
                                Logline: &ldquo;{activeOpt.logline}&rdquo;
                              </p>
                            </div>

                            <Button
                              size="sm"
                              loading={isSelectingOption}
                              onClick={() => handleSelectStoryOption(activeOpt)}
                              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-5 py-2 shadow-md"
                            >
                              <Check className="h-4 w-4 mr-1.5" />
                              <span>Select &amp; Use Option {activeOpt.optionId}</span>
                            </Button>
                          </div>

                          {/* Premise */}
                          <div className="text-xs text-zinc-300 bg-black/40 p-3 rounded-lg border border-zinc-800/80 leading-relaxed font-sans">
                            <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider block mb-0.5">Premise &amp; Tone:</span>
                            {activeOpt.premise}
                          </div>

                          {/* Scene by Scene Preview */}
                          <div className="space-y-3 pt-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                              Scene Breakdown ({activeOpt.scenes.length} Scenes):
                            </span>

                            {activeOpt.scenes.map(sc => (
                              <div
                                key={sc.sceneNumber}
                                className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
                                  <span className="font-bold text-amber-400">SCENE {sc.sceneNumber}: {sc.heading}</span>
                                  <span>{sc.estimatedDurationSeconds || 8}s</span>
                                </div>
                                <p className="text-zinc-200 leading-relaxed">
                                  {sc.action}
                                </p>
                                {sc.dialogue && (
                                  <div className="p-2 rounded bg-sky-950/40 border border-sky-900/30 text-sky-200 font-mono text-[11px]">
                                    {sc.dialogue}
                                  </div>
                                )}
                                {sc.voiceover && (
                                  <div className="p-2 rounded bg-amber-950/40 border border-amber-900/30 text-amber-200 italic font-serif text-[11px]">
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
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-3">
                    <SplitSquareVertical className="h-10 w-10 text-zinc-700" />
                    <p className="text-sm font-semibold text-zinc-300">No story options generated yet.</p>
                    <p className="text-xs text-zinc-500 max-w-md text-center">
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

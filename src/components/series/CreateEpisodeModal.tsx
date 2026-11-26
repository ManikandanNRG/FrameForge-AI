"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Tv,
  Film,
  Zap,
  Layers,
  Flame,
  Wand2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Monitor,
  Square,
  Clock,
  Languages,
} from "lucide-react";

interface SeriesInfo {
  id: string;
  title: string;
  slug: string;
  visualStyle: string;
  genre?: string | null;
  tone?: string | null;
  aspectRatio: string;
  targetRuntime: number;
  dialogueMode: string;
  storyLanguage?: string | null;
  defaultStudioEnvironment?: string | null;
  defaultChefWardrobe?: string | null;
  episodes?: Array<{ id: string; episodeNumber: number | null; title: string }>;
}

interface CreateEpisodeModalProps {
  series: SeriesInfo;
  isOpen: boolean;
  onClose: () => void;
  nextEpisodeNumber: number;
}

const GENRES = [
  "Culinary & Cooking ASMR",
  "Action & Adventure / Thriller",
  "Rural Village Drama / Realistic",
  "Sports / Motivational Drama",
  "Friendship / Buddy Comedy",
  "Emotional Family Drama",
  "Suspense & Mystery",
  "Romance & Feel-Good Drama",
  "Sci-Fi / Futuristic",
  "Historical / Period / Cultural",
  "Horror & Supernatural",
  "Children & Animation",
  "Documentary Realism",
];

const TONES = [
  "Satisfying, Crisp & Hypnotic",
  "Playful, Authentic & Energetic",
  "Grounded, Heartfelt & Emotional",
  "Suspenseful, Tense & Thrilling",
  "Inspiring & Motivational",
  "Comedic & Lighthearted",
  "Dark, Gritty & Intense",
  "Poetic & Nostalgic",
  "Epic & Grand",
];

const RUNTIME_PRESETS = [
  { seconds: 20, label: "20s — Viral Rapid ASMR (Bayashi 2X Pacing · 4-5 High-Density Scenes) [60M+ Views Standard]" },
  { seconds: 30, label: "30s — Viral Reel / Quick Short (~4-5 scenes)" },
  { seconds: 45, label: "45s — Teaser / Short Scene (~6-7 scenes)" },
  { seconds: 60, label: "60s (1 min) — Standard Short Film (~8-10 scenes) [Recommended]" },
  { seconds: 90, label: "90s (1.5 min) — Extended Story Scene (~12-14 scenes)" },
  { seconds: 120, label: "120s (2 min) — Mini Cinema Drama (~16-20 scenes)" },
  { seconds: 180, label: "180s (3 min) — Cinematic Narrative Film" },
  { seconds: 300, label: "300s (5 min) — Full Narrative Short" },
];

const VISUAL_STYLES = [
  ["CULINARY_MACRO_ASMR",      "Culinary ASMR & Cooking (Macro Food Realism)"],
  ["PHOTOREALISTIC_CINEMATIC", "Photorealistic Cinematic (35mm Film)"],
  ["GHIBLI_ANIME",             "Studio Ghibli & Whimsical Animation (Lush Scenery)"],
  ["CARTOON_2D",               "2D Kids Cartoon (Storybook Whimsical)"],
  ["ANIMATION_3D",             "3D Kids Animation (Pixar / Disney Style)"],
  ["ANIME",                    "Anime (Japanese Cinematic)"],
  ["DOCUMENTARY",              "Documentary Realism"],
  ["LIVE_ACTION_AD",           "Live-action Commercial"],
  ["STOP_MOTION",              "Stop-motion"],
  ["VINTAGE_FILM",             "Vintage Film / Retro"],
  ["COMIC_BOOK",               "Comic-book / Graphic Novel"],
  ["WATERCOLOR",               "Watercolor Illustration"],
  ["FANTASY_CONCEPT_ART",      "Fantasy Concept Art"],
];

const STORY_LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Tamil", label: "Tamil (தமிழ்)" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
  { value: "Telugu", label: "Telugu (తెలుగు)" },
  { value: "Malayalam", label: "Malayalam (മലയാളം)" },
  { value: "Spanish", label: "Spanish (Español)" },
  { value: "French", label: "French (Français)" },
  { value: "German", label: "German (Deutsch)" },
  { value: "Japanese", label: "Japanese (日本語)" },
];

const ASPECT_RATIOS = [
  { value: "PORTRAIT_9_16", label: "9:16 Vertical / Portrait (YouTube Shorts, Reels, TikTok)" },
  { value: "LANDSCAPE_16_9", label: "16:9 Widescreen (YouTube Main, Cinema, Desktop)" },
  { value: "SQUARE_1_1", label: "1:1 Square (Instagram Feed, Social Square)" },
];

const DIALOGUE_MODES = [
  { value: "PURE_ASMR_FOLEY", label: "Pure ASMR Foley (Zero Dialogue / Ultra-Crisp Foley)" },
  { value: "DIALOGUE", label: "Spoken dialogue" },
  { value: "VOICEOVER", label: "Voice-over narration" },
  { value: "NO_DIALOGUE", label: "No dialogue (visual only)" },
];

export function CreateEpisodeModal({
  series,
  isOpen,
  onClose,
  nextEpisodeNumber,
}: CreateEpisodeModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Form states with clean defaults derived from series
  const [title, setTitle] = useState(`Episode ${nextEpisodeNumber}`);
  const [sourceIdea, setSourceIdea] = useState("");
  const [targetRuntime, setTargetRuntime] = useState<number>(series.targetRuntime || 20);
  const [isCustomRuntime, setIsCustomRuntime] = useState(false);
  const [storyLanguage, setStoryLanguage] = useState<string>(series.storyLanguage || "English");
  const [aspectRatio, setAspectRatio] = useState<string>(series.aspectRatio || "PORTRAIT_9_16");
  const [visualStyle, setVisualStyle] = useState<string>(series.visualStyle || "CULINARY_MACRO_ASMR");
  const [dialogueMode, setDialogueMode] = useState<string>(series.dialogueMode || "PURE_ASMR_FOLEY");
  const [genre, setGenre] = useState<string>(series.genre || "Culinary & Cooking ASMR");
  const [tone, setTone] = useState<string>(series.tone || "Satisfying, Crisp & Hypnotic");
  const [studioEnvironment, setStudioEnvironment] = useState<string>(
    series.defaultStudioEnvironment || ""
  );

  const [analyzingIdea, setAnalyzingIdea] = useState(false);
  const [autoDetectedBadge, setAutoDetectedBadge] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SSR-safe mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync defaults when modal opens or series changes
  useEffect(() => {
    if (isOpen) {
      setTitle(`Episode ${nextEpisodeNumber}`);
      setSourceIdea("");
      setTargetRuntime(series.targetRuntime || 20);
      setIsCustomRuntime(!RUNTIME_PRESETS.some((p) => p.seconds === (series.targetRuntime || 20)));
      setStoryLanguage(series.storyLanguage || "English");
      setAspectRatio(series.aspectRatio || "PORTRAIT_9_16");
      setVisualStyle(series.visualStyle || "CULINARY_MACRO_ASMR");
      setDialogueMode(series.dialogueMode || "PURE_ASMR_FOLEY");
      setGenre(series.genre || "Culinary & Cooking ASMR");
      setTone(series.tone || "Satisfying, Crisp & Hypnotic");
      setStudioEnvironment(series.defaultStudioEnvironment || "");
      setAutoDetectedBadge(null);
      setError(null);
    }
  }, [isOpen, nextEpisodeNumber, series]);

  // ESC key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mounted) return null;

  async function handleAutoDetect() {
    if (!sourceIdea.trim()) {
      setError("Please write your episode idea first so AI can analyze it.");
      return;
    }
    setAnalyzingIdea(true);
    setError(null);
    setAutoDetectedBadge(null);

    try {
      const res = await fetch("/api/projects/analyze-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: sourceIdea.trim() }),
      });
      const d = await res.json();
      if (d.data?.analysis) {
        const a = d.data.analysis;
        if (a.suggestedTitle && (!title || title === `Episode ${nextEpisodeNumber}`)) {
          setTitle(`Episode ${nextEpisodeNumber}: ${a.suggestedTitle}`);
        }
        if (a.genre) setGenre(a.genre);
        if (a.tone) setTone(a.tone);
        if (a.visualStyle) setVisualStyle(a.visualStyle);
        if (a.dialogueMode) setDialogueMode(a.dialogueMode);
        if (a.storyLanguage) setStoryLanguage(a.storyLanguage);
        if (a.aspectRatio) setAspectRatio(a.aspectRatio);
        if (a.targetRuntimeSeconds) {
          setTargetRuntime(a.targetRuntimeSeconds);
          setIsCustomRuntime(!RUNTIME_PRESETS.some((p) => p.seconds === a.targetRuntimeSeconds));
        }
        setAutoDetectedBadge(
          `✓ Auto-detected: ${a.genre || genre} · ${a.tone || tone} · ${a.targetRuntimeSeconds || targetRuntime}s · ${a.storyLanguage || storyLanguage}`
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze idea");
    } finally {
      setAnalyzingIdea(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sourceIdea.trim()) {
      setError("Please fill in both the episode title and story idea.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/series/${series.id}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sourceIdea: sourceIdea.trim(),
          targetRuntime,
          storyLanguage,
          aspectRatio,
          visualStyle,
          genre,
          tone,
          dialogueMode,
          studioEnvironment: studioEnvironment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create episode");
      }

      const newEpisode = data.data?.episode || data.episode;
      if (newEpisode?.id) {
        onClose();
        router.push(`/projects/${newEpisode.id}/story`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition";

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-center justify-center py-4">
        <div
          className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative shrink-0">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
              title="Close Modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase mb-1">
              <Tv className="h-4 w-4" />
              <span>Channel Episode Studio</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span>Create Episode {nextEpisodeNumber}</span>
              <span className="text-sm font-normal text-slate-300">
                in {series.title}
              </span>
            </h2>

            {/* Inherited Channel Defaults Pill Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-300 font-mono">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" />
                Defaults Linked to {series.title}
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                Customizable Below
              </span>
            </div>
          </div>

          {/* Form Body (Scrollable) */}
          <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Episode Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Episode Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. Episode ${nextEpisodeNumber}: Your Custom Episode Title`}
                className={inputCls}
              />
            </div>

            {/* Episode Story Idea / Premise with Auto-Detect */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Episode Story Idea / Premise *
                </label>
                <button
                  type="button"
                  disabled={analyzingIdea}
                  onClick={handleAutoDetect}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-semibold transition shadow-xs disabled:opacity-50"
                  title="AI reads your idea and automatically tunes title, runtime, language, style and orientation"
                >
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  <span>{analyzingIdea ? "Analyzing with AI…" : "✨ Auto-detect Settings from Idea"}</span>
                </button>
              </div>
              <textarea
                required
                rows={4}
                value={sourceIdea}
                onChange={(e) => setSourceIdea(e.target.value)}
                placeholder="Describe your episode idea in detail. What object, dish, or story unfolds, what are the steps, and what sounds and actions take place?"
                className={`${inputCls} leading-relaxed`}
              />
              {autoDetectedBadge && (
                <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium">
                  {autoDetectedBadge}
                </div>
              )}
            </div>

            {/* Grid 1: Film Length & Story Language */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Film Length / Target Runtime
                </label>
                <div className="flex gap-2">
                  <select
                    value={isCustomRuntime ? "custom" : targetRuntime}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomRuntime(true);
                      } else {
                        setIsCustomRuntime(false);
                        setTargetRuntime(parseInt(val, 10));
                      }
                    }}
                    className={`${inputCls} flex-1`}
                  >
                    {RUNTIME_PRESETS.map((p) => (
                      <option key={p.seconds} value={p.seconds}>
                        {p.label}
                      </option>
                    ))}
                    <option value="custom">Custom duration (seconds)…</option>
                  </select>
                  {isCustomRuntime && (
                    <div className="flex items-center gap-1.5 w-28 shrink-0">
                      <input
                        type="number"
                        min={15}
                        max={3600}
                        value={targetRuntime}
                        onChange={(e) =>
                          setTargetRuntime(
                            Math.max(15, parseInt(e.target.value, 10) || 20)
                          )
                        }
                        className={`${inputCls} text-center`}
                      />
                      <span className="text-xs text-slate-500 font-mono">sec</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Story Language
                </label>
                <select
                  value={storyLanguage}
                  onChange={(e) => setStoryLanguage(e.target.value)}
                  className={inputCls}
                >
                  {STORY_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid 2: Aspect Ratio & Dialogue Mode */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Aspect Ratio / Orientation
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className={inputCls}
                >
                  {ASPECT_RATIOS.map((ratio) => (
                    <option key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dialogue Mode
                </label>
                <select
                  value={dialogueMode}
                  onChange={(e) => setDialogueMode(e.target.value)}
                  className={inputCls}
                >
                  {DIALOGUE_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid 3: Visual Style & Studio Setting */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visual Style
                </label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  className={inputCls}
                >
                  {VISUAL_STYLES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Studio / Workstation Setting
                </label>
                <input
                  type="text"
                  value={studioEnvironment}
                  onChange={(e) => setStudioEnvironment(e.target.value)}
                  placeholder="e.g. Bright Sunlit Oak Butcher Block, Outdoor Daylight Hearth, Open Stainless Kitchen..."
                  className={inputCls}
                />
              </div>
            </div>

            {/* Grid 4: Genre & Tone */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className={inputCls}
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={inputCls}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* Footer (Sticky at bottom) */}
          <div className="p-4 px-6 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Episode & Screenplay...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Launch Episode {nextEpisodeNumber} & Screenplay</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
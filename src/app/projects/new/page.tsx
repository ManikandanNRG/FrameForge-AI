"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const GENRES = [
  "Rural Village Drama / Realistic",
  "Sports / Motivational Drama",
  "Culinary & Cooking ASMR",
  "Friendship / Buddy Comedy",
  "Emotional Family Drama",
  "Action & Adventure / Thriller",
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

const AUDIENCES = [
  "Universal / Family Audience",
  "Youth & Young Adults (18–35)",
  "Kids & Children (All Ages)",
  "Rural & Regional Cinema Community",
  "Social Media & Short-form Viewers (Reels / Shorts)",
  "Mature & Thoughtful Cinema Lovers",
];

const RUNTIME_PRESETS = [
  { seconds: 30, label: "30s — Viral Reel / Quick Short (~4-5 shots)" },
  { seconds: 45, label: "45s — Teaser / Short Scene (~6-7 shots)" },
  { seconds: 60, label: "60s (1 min) — Standard Short Film (~8-10 shots) [Recommended]" },
  { seconds: 90, label: "90s (1.5 min) — Extended Story Scene (~12-14 shots)" },
  { seconds: 120, label: "120s (2 min) — Mini Cinema Drama (~16-20 shots)" },
  { seconds: 180, label: "180s (3 min) — Cinematic Narrative Film" },
  { seconds: 300, label: "300s (5 min) — Full Narrative Short" },
];

const VISUAL_STYLES = [
  ["PHOTOREALISTIC_CINEMATIC", "Photorealistic Cinematic"],
  ["CULINARY_MACRO_ASMR",      "Culinary ASMR & Cooking (Macro Food Realism)"],
  ["DOCUMENTARY",              "Documentary Realism"],
  ["LIVE_ACTION_AD",           "Live-action Commercial"],
  ["ANIME",                    "Anime"],
  ["CARTOON_2D",               "2D Cartoon"],
  ["ANIMATION_3D",             "3D Animated Film"],
  ["STOP_MOTION",              "Stop-motion"],
  ["VINTAGE_FILM",             "Vintage Film / Retro"],
  ["COMIC_BOOK",               "Comic-book / Graphic Novel"],
  ["WATERCOLOR",               "Watercolor Illustration"],
  ["FANTASY_CONCEPT_ART",      "Fantasy Concept Art"],
  ["CUSTOM",                   "Custom style"],
];

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [autoRunPipeline, setAutoRunPipeline] = useState(true);
  const [pipelineProgress, setPipelineProgress] = useState<string | null>(null);
  const [analyzingIdea, setAnalyzingIdea] = useState(false);
  const [autoDetectedBadge, setAutoDetectedBadge] = useState<string | null>(null);
  const [form, setForm]       = useState({
    title:         "",
    sourceIdea:    "",
    description:   "",
    genre:         "",
    tone:          "",
    visualStyle:   "PHOTOREALISTIC_CINEMATIC",
    dialogueMode:  "DIALOGUE",
    targetRuntime: 60,
    audience:      "",
    storyLanguage: "Tamil",
    aspectRatio:   "LANDSCAPE_16_9",
  });

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function autoDetectSettings() {
    if (!form.sourceIdea.trim()) {
      setError("Please type a film idea first so AI can analyze it.");
      return;
    }
    setAnalyzingIdea(true);
    setError(null);
    setAutoDetectedBadge(null);

    try {
      const res = await fetch("/api/projects/analyze-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: form.sourceIdea }),
      });
      const d = await res.json();
      if (d.data?.analysis) {
        const a = d.data.analysis;
        const autoRuntime = a.targetRuntimeSeconds || 60;
        setForm(prev => ({
          ...prev,
          title: prev.title ? prev.title : a.suggestedTitle,
          genre: a.genre || prev.genre,
          tone: a.tone || prev.tone,
          targetRuntime: autoRuntime,
          audience: a.targetAudience || prev.audience,
          visualStyle: a.visualStyle || prev.visualStyle,
          dialogueMode: a.dialogueMode || prev.dialogueMode,
          storyLanguage: a.storyLanguage || prev.storyLanguage,
          aspectRatio: a.aspectRatio || prev.aspectRatio,
        }));
        setAutoDetectedBadge(`✓ Auto-detected: ${a.genre} · ${a.tone} · ${autoRuntime}s · ${a.storyLanguage} · ${a.aspectRatio === "PORTRAIT_9_16" ? "9:16 Portrait" : "16:9 Landscape"}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze idea");
    } finally {
      setAnalyzingIdea(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    setPipelineProgress(null);
    
    try {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message ?? "Failed to create project");

      const newProjectId = d.data.project.id;

      if (autoRunPipeline) {
        setPipelineProgress("⚡ 1-Click Studio: Generating screenplay, characters, and storyboard prompts…");
        const pipeRes = await fetch(`/api/projects/${newProjectId}/pipeline/one-click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoGenerateVideos: false }),
        });
        const pipeData = await pipeRes.json();
        if (pipeRes.ok) {
          router.push(`/projects/${newProjectId}/storyboard`);
          return;
        }
      }

      router.push(`/projects/${newProjectId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      setSaving(false);
      setPipelineProgress(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-8 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">New project</h1>
        <p className="text-slate-500 text-sm mb-8">Describe your film. AI will develop the story, characters, and shots from here.</p>

        <form onSubmit={submit} className="space-y-6">
          {/* Title */}
          <Field label="Project title *">
            <input required value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. Pudukkottai Chronicles" className={inputCls} />
          </Field>

          {/* Idea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-800">Film idea *</label>
              <button
                type="button"
                disabled={analyzingIdea}
                onClick={autoDetectSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold transition shadow-xs"
                title="AI reads your idea and automatically configures title, genre, tone, language, orientation, and style"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>{analyzingIdea ? "Analyzing with AI…" : "✨ Auto-detect Settings from Idea"}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Describe your film in one sentence or paragraph. Click &ldquo;Auto-detect Settings&rdquo; to have AI automatically pick the best genre, tone, and orientation!
            </p>
            <textarea
              required
              rows={4}
              value={form.sourceIdea}
              onChange={e => set("sourceIdea", e.target.value)}
              placeholder="e.g. One small boy running in the agriculture sugarcane land and suddenly sees an elephant eating sugarcane leaves. He shouts and runs back calling his amma..."
              className={inputCls}
            />

            {autoDetectedBadge && (
              <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between font-medium">
                <span>{autoDetectedBadge}</span>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Genre">
              <select value={form.genre} onChange={e => set("genre", e.target.value)} className={inputCls}>
                <option value="">Select a genre…</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                {form.genre && !GENRES.includes(form.genre) && (
                  <option value={form.genre}>{form.genre}</option>
                )}
              </select>
            </Field>

            <Field label="Tone">
              <select value={form.tone} onChange={e => set("tone", e.target.value)} className={inputCls}>
                <option value="">Select a tone…</option>
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                {form.tone && !TONES.includes(form.tone) && (
                  <option value={form.tone}>{form.tone}</option>
                )}
              </select>
            </Field>
          </div>

          {/* Visual style */}
          <Field label="Visual style">
            <select value={form.visualStyle} onChange={e => set("visualStyle", e.target.value)} className={inputCls}>
              {VISUAL_STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Dialogue */}
            <Field label="Dialogue mode">
              <select value={form.dialogueMode} onChange={e => set("dialogueMode", e.target.value)} className={inputCls}>
                <option value="DIALOGUE">Spoken dialogue</option>
                <option value="PURE_ASMR_FOLEY">Pure ASMR Foley (Zero Dialogue / Ultra-Crisp Foley)</option>
                <option value="VOICEOVER">Voice-over narration</option>
                <option value="NO_DIALOGUE">No dialogue (visual only)</option>
              </select>
            </Field>
            {/* Video Length / Runtime */}
            <Field label="Film length / Target runtime" hint="AI will plan pacing and shot breakdown to fit this duration">
              <div className="flex gap-2">
                <select
                  value={RUNTIME_PRESETS.some(p => p.seconds === form.targetRuntime) ? form.targetRuntime : "custom"}
                  onChange={e => {
                    const val = e.target.value;
                    if (val !== "custom") {
                      set("targetRuntime", parseInt(val, 10));
                    }
                  }}
                  className={`${inputCls} flex-1`}
                >
                  {RUNTIME_PRESETS.map(p => (
                    <option key={p.seconds} value={p.seconds}>{p.label}</option>
                  ))}
                  <option value="custom">Custom duration (seconds)…</option>
                </select>
                {(!RUNTIME_PRESETS.some(p => p.seconds === form.targetRuntime)) && (
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <input
                      type="number"
                      min={10}
                      max={3600}
                      value={form.targetRuntime}
                      onChange={e => set("targetRuntime", Math.max(10, parseInt(e.target.value, 10) || 60))}
                      className={`${inputCls} text-center`}
                    />
                    <span className="text-xs text-zinc-400 font-mono">sec</span>
                  </div>
                )}
              </div>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Aspect ratio / Orientation" hint="Camera framing format for all shots & AI video generation">
              <select value={form.aspectRatio} onChange={e => set("aspectRatio", e.target.value)} className={inputCls}>
                <option value="LANDSCAPE_16_9">16:9 Landscape (1920x1080) — YouTube, Film, Desktop</option>
                <option value="PORTRAIT_9_16">9:16 Vertical / Portrait (1080x1920) — Reels, Shorts, TikTok</option>
                <option value="SQUARE_1_1">1:1 Square (1080x1080) — Instagram Feed, Socials</option>
              </select>
            </Field>

            <Field label="Target audience">
              <select value={form.audience} onChange={e => set("audience", e.target.value)} className={inputCls}>
                <option value="">Select target audience…</option>
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                {form.audience && !AUDIENCES.includes(form.audience) && (
                  <option value={form.audience}>{form.audience}</option>
                )}
              </select>
            </Field>
          </div>

          <div>
            <Field label="Story language" hint="Voiceover narration and character dialogue will be written in this native language">
              <select value={form.storyLanguage} onChange={e => set("storyLanguage", e.target.value)} className={inputCls}>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Malayalam">Malayalam (മലയാളം)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </select>
            </Field>
          </div>

          {/* 1-Click Pipeline Toggle */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 space-y-2 shadow-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRunPipeline}
                onChange={e => setAutoRunPipeline(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  ⚡ 1-Click Studio: Generate Full Film Package Immediately
                </span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Automatically writes the screenplay with native dialogue, extracts characters with Google Flow prompts &amp; voice directives, creates scene storyboard with <span className="font-mono text-amber-800 font-semibold">[@Character]</span> tags, and opens the Storyboard ready to generate!
                </p>
              </div>
            </label>
          </div>

          {error && <p className="text-rose-600 text-sm font-medium">{error}</p>}

          {pipelineProgress && (
            <div className="flex items-center gap-2.5 text-xs text-amber-900 bg-amber-100 border border-amber-300 p-3.5 rounded-xl font-medium animate-pulse">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
              <span>{pipelineProgress}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs">
              {autoRunPipeline ? "⚡ Create & Generate 1-Click Film" : "Create project"}
            </Button>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => router.push("/projects")} className="text-slate-600 hover:text-slate-900">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-xs transition";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

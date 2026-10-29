"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";

const VISUAL_STYLES = [
  ["PHOTOREALISTIC_CINEMATIC", "Photorealistic Cinematic"],
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
  const [form, setForm]       = useState({
    title:         "",
    sourceIdea:    "",
    description:   "",
    genre:         "",
    tone:          "",
    visualStyle:   "PHOTOREALISTIC_CINEMATIC",
    dialogueMode:  "DIALOGUE",
    targetRuntime: 360,
    audience:      "",
    storyLanguage: "en",
  });

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setSaving(false);
    if (r.ok) router.push(`/projects/${d.data.project.id}`);
    else setError(d.error?.message ?? "Failed to create project");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-8 py-10">
        <h1 className="text-2xl font-bold mb-1">New project</h1>
        <p className="text-zinc-400 text-sm mb-8">Describe your film. AI will develop the story from here.</p>

        <form onSubmit={submit} className="space-y-6">
          {/* Title */}
          <Field label="Project title *">
            <input required value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="My Film" className={inputCls} />
          </Field>

          {/* Idea */}
          <Field label="Film idea *" hint="Describe your film in one paragraph. Be specific — the AI will develop this.">
            <textarea required rows={5} value={form.sourceIdea} onChange={e => set("sourceIdea", e.target.value)}
              placeholder="A lone lighthouse keeper discovers a message in a bottle that reveals a conspiracy stretching back 100 years..."
              className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Genre">
              <input value={form.genre} onChange={e => set("genre", e.target.value)}
                placeholder="Thriller, Drama, Sci-fi…" className={inputCls} />
            </Field>
            <Field label="Tone">
              <input value={form.tone} onChange={e => set("tone", e.target.value)}
                placeholder="Dark, Hopeful, Comedic…" className={inputCls} />
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
                <option value="VOICEOVER">Voice-over narration</option>
                <option value="NO_DIALOGUE">No dialogue (visual only)</option>
              </select>
            </Field>
            {/* Runtime */}
            <Field label="Target runtime (minutes)">
              <input type="number" min={1} max={120} value={Math.round(form.targetRuntime / 60)}
                onChange={e => set("targetRuntime", parseInt(e.target.value, 10) * 60)}
                className={inputCls} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Target audience">
              <input value={form.audience} onChange={e => set("audience", e.target.value)}
                placeholder="General / Adults / Kids…" className={inputCls} />
            </Field>
            <Field label="Story language">
              <input value={form.storyLanguage} onChange={e => set("storyLanguage", e.target.value)}
                placeholder="en" className={inputCls} />
            </Field>
          </div>

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>Create project</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/projects")}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

const inputCls = "w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-zinc-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

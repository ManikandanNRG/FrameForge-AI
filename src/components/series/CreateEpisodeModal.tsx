"use client";

import { useState } from "react";
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
} from "lucide-react";

interface SeriesInfo {
  id: string;
  title: string;
  slug: string;
  visualStyle: string;
  aspectRatio: string;
  targetRuntime: number;
  dialogueMode: string;
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

const STUDIO_PRESETS = [
  {
    label: "🔥 Teppanyaki Flat-Top Griddle",
    value: "Japanese Teppanyaki Flat-Top Griddle & Dual Steel Spatulas",
  },
  {
    label: "🪵 Walnut Cutting Board & Pot",
    value: "Dark Walnut End-Grain Butcher Block & Cast Iron Pot",
  },
  {
    label: "🏭 Scrapyard Workbench & Wok",
    value: "Dark Cyberpunk Scrapyard Workbench & Industrial Wok Burner",
  },
  {
    label: "⛺ Outdoor Campfire Skillet",
    value: "Rustic Campfire Charcoal Grill & Seasoned Cast Iron Skillet",
  },
  {
    label: "🌋 Industrial Metallurgy Forge",
    value: "Heavy Industrial Metallurgy Anvil & Smelting Crucible",
  },
];

export function CreateEpisodeModal({
  series,
  isOpen,
  onClose,
  nextEpisodeNumber,
}: CreateEpisodeModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(
    `Episode ${nextEpisodeNumber}: The Sony Walkman Teppanyaki (ASMR)`
  );
  const [sourceIdea, setSourceIdea] = useState(
    `A rogue masked alchemist chef cooks a vintage Sony Walkman cassette player into acoustic yakisoba noodles on a scorching hot teppanyaki flat-top griddle with sizzling copper ribbons and rosin glaze.`
  );
  const [studioEnvironment, setStudioEnvironment] = useState(
    STUDIO_PRESETS[0].value
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sourceIdea.trim()) {
      setError("Please fill in both the episode title and idea.");
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
          studioEnvironment: studioEnvironment.trim(),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
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

          {/* Inherited DNA Pill */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-300 font-mono">
            <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="h-3 w-3" />
              100% Channel DNA Inherited
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full">
              {series.aspectRatio === "PORTRAIT_9_16" ? "9:16 Shorts" : "16:9 Landscape"}
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full">
              {series.targetRuntime}s Bayashi 2X
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full">
              Pure Binaural Foley
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full text-amber-300">
              @TheShadowAlchemistChef Locked
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Episode Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Episode Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Episode 3: The Sony Walkman Teppanyaki (ASMR)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
          </div>

          {/* One-Line Idea / Hero Object */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Episode Concept & Hero Object Pitch
            </label>
            <textarea
              rows={3}
              value={sourceIdea}
              onChange={(e) => setSourceIdea(e.target.value)}
              placeholder="What inedible item or tech is being transformed into a culinary masterpiece?"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition leading-relaxed"
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Tip: Mention the exact hardware item (e.g. Sony Walkman, Earbuds, Watch, Nike Sneaker).
            </p>
          </div>

          {/* Studio / Workstation Environment Override */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Studio / Workstation Setting
              </label>
              <span className="text-[11px] text-blue-600 font-semibold">
                Episode Override
              </span>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {STUDIO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setStudioEnvironment(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    studioEnvironment === preset.value
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={studioEnvironment}
              onChange={(e) => setStudioEnvironment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
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
        </form>
      </div>
    </div>
  );
}

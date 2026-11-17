"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tv,
  ChevronDown,
  Plus,
  Sparkles,
  Check,
  Film,
  Layers,
} from "lucide-react";
import { CreateEpisodeModal } from "./CreateEpisodeModal";

interface EpisodeItem {
  id: string;
  title: string;
  episodeNumber: number | null;
  status: string;
}

interface SeriesData {
  id: string;
  title: string;
  slug: string;
  visualStyle: string;
  aspectRatio: string;
  targetRuntime: number;
  dialogueMode: string;
  defaultStudioEnvironment?: string | null;
  defaultChefWardrobe?: string | null;
  episodes: EpisodeItem[];
}

interface SeriesEpisodeBarProps {
  currentProjectId: string;
  series: SeriesData;
  currentEpisodeNumber?: number | null;
}

export function SeriesEpisodeBar({
  currentProjectId,
  series,
  currentEpisodeNumber,
}: SeriesEpisodeBarProps) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract active subpath so switching episodes keeps user on same step (e.g. /story, /storyboard, /launch)
  const subpath = pathname?.replace(`/projects/${currentProjectId}`, "") || "";

  const episodes = series.episodes || [];
  const latestEpNum = episodes.reduce(
    (max, ep) => Math.max(max, ep.episodeNumber || 0),
    0
  );
  const nextEpNum = latestEpNum + 1;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Series & Episode Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs border border-slate-700/60"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <Tv className="h-3.5 w-3.5" />
              <span className="font-bold hidden sm:inline">{series.title}</span>
              <span className="font-bold sm:hidden">Series</span>
            </div>

            <span className="text-slate-400 font-normal">·</span>

            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold">
              {currentEpisodeNumber ? `Ep ${currentEpisodeNumber}` : "Episode"}
            </span>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Channel Episodes ({episodes.length})
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {series.title}
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {episodes.map((ep) => {
                    const isCurrent = ep.id === currentProjectId;
                    return (
                      <Link
                        key={ep.id}
                        href={`/projects/${ep.id}${subpath}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2 text-xs transition ${
                          isCurrent
                            ? "bg-amber-50 text-amber-900 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
                            Ep {ep.episodeNumber ?? 1}
                          </span>
                          <span className="truncate">{ep.title}</span>
                        </div>
                        {isCurrent && (
                          <Check className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* + New Episode Button in Dropdown */}
                <div className="p-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Episode {nextEpNum}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick New Episode Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition"
          title={`Launch Episode ${nextEpNum} in this Channel`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Episode</span>
        </button>
      </div>

      {/* 1-Click Create Episode Modal */}
      <CreateEpisodeModal
        series={series}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nextEpisodeNumber={nextEpNum}
      />
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Film, Plus, ArrowRight } from "lucide-react";

interface Project {
  id: string; title: string; description?: string;
  currentStage: string; status: string; updatedAt: string;
}

const stageLabel: Record<string, string> = {
  BRIEF: "Brief", STORY: "Story ✓", BIBLE: "Production Bible",
  STORYBOARD: "Storyboard", GENERATION: "Generating", EDITING: "Editing",
  EXPORT: "Export", COMPLETE: "Complete ✓",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => {
      setProjects(d.data?.projects ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-slate-500 text-sm mt-1">Your AI film productions &amp; YouTube channels</p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" /> New project
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="py-20 text-center">
            <p className="text-slate-500 text-sm">Loading productions…</p>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <Film className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-800 font-semibold text-base">No projects yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-5">Start by describing your film idea or YouTube concept</p>
            <Link href="/projects/new">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                <Plus className="h-4 w-4 mr-1.5" /> Create first project
              </Button>
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group block">
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-md transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <h2 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                      {p.title}
                    </h2>
                    <ArrowRight className="h-4 w-4 text-slate-400 shrink-0 mt-0.5 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  {p.description && (
                    <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 font-medium text-slate-700">
                    {stageLabel[p.currentStage] ?? p.currentStage}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

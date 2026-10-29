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
      <div className="px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-zinc-400 text-sm mt-1">Your AI film productions</p>
          </div>
          <Link href="/projects/new">
            <Button><Plus className="h-4 w-4" /> New project</Button>
          </Link>
        </div>

        {loading && <p className="text-zinc-500 text-sm">Loading…</p>}

        {!loading && projects.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-700 p-12 text-center">
            <Film className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No projects yet</p>
            <p className="text-zinc-600 text-sm mt-1 mb-4">Start by describing your film idea</p>
            <Link href="/projects/new">
              <Button><Plus className="h-4 w-4" /> Create first project</Button>
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group block">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-semibold text-zinc-100 line-clamp-2">{p.title}</h2>
                  <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5 group-hover:text-amber-400 transition-colors" />
                </div>
                {p.description && (
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-3">{p.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="rounded bg-zinc-800 px-2 py-0.5">
                    {stageLabel[p.currentStage] ?? p.currentStage}
                  </span>
                  <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

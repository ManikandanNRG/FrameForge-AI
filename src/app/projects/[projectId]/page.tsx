"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge, jobStatusBadge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, BookOpen, AlertCircle } from "lucide-react";

interface Project {
  id: string; title: string; sourceIdea: string; currentStage: string;
  genre?: string; tone?: string; visualStyle: string;
}
interface Job { id: string; status: string; jobType: string; createdAt: string; errorMessage?: string; }

const stageOrder = ["BRIEF","STORY","BIBLE","STORYBOARD","GENERATION","EDITING","EXPORT","COMPLETE"];

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject]       = useState<Project | null>(null);
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);

  async function load() {
    const [pr, jr, pvr] = await Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/jobs?projectId=${projectId}`).then(r => r.json()),
      fetch("/api/settings/providers").then(r => r.json()),
    ]);
    setProject(pr.data?.project ?? null);
    setJobs(jr.data?.jobs ?? []);
    setHasProvider((pvr.data?.providers ?? []).some((p: { status: string }) => p.status === "CONNECTED"));
  }

  useEffect(() => { load(); }, [projectId]);

  // Poll while a story job is running
  useEffect(() => {
    const running = jobs.find(j => j.jobType === "STORY" && ["QUEUED","SUBMITTING","RUNNING","WAITING_FOR_PROVIDER"].includes(j.status));
    if (!running) return;
    const t = setInterval(() => {
      fetch(`/api/jobs/${running.id}`).then(r => r.json()).then(d => {
        const s = d.data?.job?.status;
        if (s === "SUCCEEDED") { clearInterval(t); load(); }
        if (s === "FAILED")    { clearInterval(t); setGenError(d.data?.job?.errorMessage ?? "Generation failed"); load(); }
      });
    }, 2000);
    return () => clearInterval(t);
  }, [jobs]);

  async function generateStory(useMock = false) {
    setGenerating(true); setGenError(null);
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

  const activeJob = jobs.find(j => j.jobType === "STORY" && ["QUEUED","SUBMITTING","RUNNING","WAITING_FOR_PROVIDER"].includes(j.status));
  const stageIdx = stageOrder.indexOf(project?.currentStage ?? "BRIEF");
  const hasStory = (project?.currentStage ?? "BRIEF") !== "BRIEF";

  if (!project) return <AppShell><div className="p-10 text-zinc-500">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="px-8 py-10 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/projects" className="hover:text-zinc-300">Projects</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-300">{project.title}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">{project.title}</h1>
          <p className="text-zinc-400 text-sm">{project.sourceIdea}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {project.genre && <span className="bg-zinc-800 rounded px-2 py-0.5 text-zinc-400">{project.genre}</span>}
            {project.tone  && <span className="bg-zinc-800 rounded px-2 py-0.5 text-zinc-400">{project.tone}</span>}
            <span className="bg-zinc-800 rounded px-2 py-0.5 text-zinc-400">{project.visualStyle.replace(/_/g," ")}</span>
          </div>
        </div>

        {/* Stage progress */}
        <div className="mb-8 flex items-center gap-1 overflow-x-auto pb-1">
          {stageOrder.slice(0, 6).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${i <= stageIdx ? "bg-amber-500 text-zinc-950 font-semibold" : "bg-zinc-800 text-zinc-500"}`}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </span>
              {i < 5 && <ChevronRight className="h-3 w-3 text-zinc-700 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Provider warning */}
        {hasProvider === false && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-700/50 bg-amber-900/20 p-4 text-sm text-amber-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>No AI provider connected. <Link href="/settings" className="underline font-medium">Add a Gemini (free) or OpenAI API key in Settings</Link> to generate with AI.</span>
          </div>
        )}

        {/* Story section */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <h2 className="font-semibold">Story</h2>
            </div>
            {hasStory && (
              <Link href={`/projects/${projectId}/story`}>
                <Button variant="secondary" size="sm">Open story studio →</Button>
              </Link>
            )}
          </div>

          {activeJob && (
            <div className="flex items-center gap-3 py-3 text-sm text-blue-300">
              <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              Generating your story… this takes 30–90 seconds.
            </div>
          )}

          {!activeJob && !hasStory && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">
                Generate a logline, synopsis, outline, and full screenplay from your idea.
                Uses your configured AI provider (Gemini or OpenAI).
              </p>
              {genError && (
                <div className="flex items-start gap-2 text-rose-400 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {genError}
                </div>
              )}
              <div className="flex gap-3">
                <Button loading={generating} onClick={() => generateStory(false)} disabled={hasProvider === false}>
                  <Sparkles className="h-4 w-4" /> Generate story with AI
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateStory(true)}>
                  Test with mock (no API call)
                </Button>
              </div>
            </div>
          )}

          {!activeJob && hasStory && (
            <p className="text-emerald-400 text-sm">✓ Story generated. Open the Story Studio to review and approve.</p>
          )}
        </section>

        {/* Other stages — unlocked progressively */}
        {hasStory && (
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { href: `/projects/${projectId}/bible`,      label: "Production Bible",  stage: "BIBLE" },
              { href: `/projects/${projectId}/storyboard`, label: "Storyboard",         stage: "STORYBOARD" },
              { href: `/projects/${projectId}/edit`,       label: "Edit & Export",      stage: "EDITING" },
            ].map(({ href, label, stage }) => (
              <Link key={href} href={href}>
                <div className={`rounded-lg border p-4 text-sm font-medium transition-colors ${stageIdx >= stageOrder.indexOf(stage) ? "border-amber-700/60 bg-amber-900/10 text-amber-300 hover:bg-amber-900/20" : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700"}`}>
                  {label} →
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Recent jobs */}
        {jobs.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-400">Recent jobs</h3>
              {jobs.some(j => j.status === "FAILED") && (
                <button
                  onClick={async () => {
                    await fetch(`/api/jobs?projectId=${projectId}`, { method: "DELETE" });
                    load();
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  Clear failed history
                </button>
              )}
            </div>
            <div className="space-y-2">
              {jobs.slice(0, 5).map(j => (
                <div key={j.id} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm">
                  <span className="text-zinc-300">{j.jobType}</span>
                  <div className="flex items-center gap-3">
                    {j.errorMessage && <span className="text-rose-400 text-xs truncate max-w-xs">{j.errorMessage}</span>}
                    <Badge status={jobStatusBadge(j.status)} label={j.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

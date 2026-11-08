"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge, jobStatusBadge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, BookOpen, AlertCircle, SplitSquareVertical } from "lucide-react";

interface Project {
  id: string; title: string; sourceIdea: string; currentStage: string;
  genre?: string; tone?: string; visualStyle: string; aspectRatio?: string; storyLanguage?: string;
}
interface Job { id: string; status: string; jobType: string; createdAt: string; errorMessage?: string; }

const stageOrder = ["BRIEF","STORY","BIBLE","STORYBOARD","GENERATION","EDITING","EXPORT","COMPLETE"];

export default function ProjectPage() {
  const routeParams = useParams();
  const projectId = (routeParams?.projectId as string) || "";
  const router = useRouter();
  const [project, setProject]       = useState<Project | null>(null);
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [running1Click, setRunning1Click] = useState(false);
  const [oneClickStepMessage, setOneClickStepMessage] = useState<string | null>(null);
  const [oneClickSuccess, setOneClickSuccess] = useState<string | null>(null);

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

  // Poll while any generation job is running
  useEffect(() => {
    const running = jobs.find(j => ["QUEUED","SUBMITTING","RUNNING","WAITING_FOR_PROVIDER"].includes(j.status));
    if (!running) return;
    const t = setInterval(() => {
      fetch(`/api/jobs/${running.id}`).then(r => r.json()).then(d => {
        const s = d.data?.job?.status;
        if (s === "SUCCEEDED" || s === "FAILED") {
          clearInterval(t);
          load();
        }
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

  async function runOneClickPipeline(useMock = false) {
    setRunning1Click(true);
    setGenError(null);
    setOneClickSuccess(null);
    setOneClickStepMessage("Step 1/3: Crafting complete screenplay with native dialogue…");

    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/one-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useMock, autoGenerateVideos: false }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "1-Click generation failed");

      setOneClickSuccess(`Complete film package generated! ${d.data.scenesCount} Scenes, ${d.data.shotsCount} Shots, ${d.data.charactersCount} Characters ready with Google Flow prompts.`);
      load();
    } catch (e: any) {
      setGenError(e.message || "Failed to execute 1-Click pipeline");
    } finally {
      setRunning1Click(false);
      setOneClickStepMessage(null);
    }
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
            <span className="bg-zinc-800 rounded px-2 py-0.5 text-amber-300/90 border border-amber-500/30">
              {project.aspectRatio === "PORTRAIT_9_16" ? "9:16 Vertical / Portrait" : project.aspectRatio === "SQUARE_1_1" ? "1:1 Square" : "16:9 Landscape"}
            </span>
            {project.storyLanguage && (
              <span className="bg-zinc-800 rounded px-2 py-0.5 text-blue-300/90 border border-blue-500/30">
                {project.storyLanguage}
              </span>
            )}
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

        {/* 1-Click Studio: Full Production from Idea */}
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-amber-950/20 p-5 shadow-lg mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black">
                  1-Click Studio
                </span>
                <h2 className="text-base font-bold text-zinc-100">
                  Generate Entire Film in Single Process
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                From your idea, automatically generates complete screenplay with dialogue, extracts characters with Google Flow prompts &amp; voice directives, creates scene storyboard with <span className="font-mono text-amber-300">[@Character]</span> tags, and sets up timeline!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link href={`/projects/${projectId}/story?action=options`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-purple-950/70 hover:bg-purple-900 border border-purple-700/80 text-purple-200 text-xs font-semibold px-3 py-2 shadow-sm"
                >
                  <SplitSquareVertical className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
                  <span>✨ 2 Story Options (A / B)</span>
                </Button>
              </Link>
              <Button
                loading={running1Click}
                disabled={hasProvider === false}
                onClick={() => runOneClickPipeline(false)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition px-4 py-2"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                <span>{running1Click ? "Processing Pipeline…" : "⚡ 1-Click Full Generation"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={running1Click}
                onClick={() => runOneClickPipeline(true)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Mock Test
              </Button>
            </div>
          </div>

          {running1Click && (
            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center gap-3 text-xs text-amber-300 animate-pulse">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>{oneClickStepMessage || "Executing end-to-end film pipeline: Screenplay → Characters → Shot List…"}</span>
            </div>
          )}
          {oneClickSuccess && (
            <div className="mt-3 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-xs text-emerald-400">
              <span>✓ {oneClickSuccess}</span>
              <Link href={`/projects/${projectId}/storyboard`} className="underline font-bold text-amber-300 hover:text-amber-200">
                Open Storyboard Now →
              </Link>
            </div>
          )}
        </div>

        {/* Story section */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <h2 className="font-semibold text-zinc-100">Story &amp; Screenplay Studio</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/projects/${projectId}/story?action=options`}>
                <Button variant="secondary" size="sm" className="bg-purple-950/60 border border-purple-700/60 text-purple-300 hover:bg-purple-900/40 text-xs">
                  <SplitSquareVertical className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
                  <span>✨ 2 Story Options (A / B)</span>
                </Button>
              </Link>
              {hasStory && (
                <Link href={`/projects/${projectId}/story`}>
                  <Button variant="secondary" size="sm" className="text-xs border-amber-500/50 text-amber-300 hover:bg-amber-950/30">
                    Open Story Studio →
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {activeJob && (
            <div className="flex items-center gap-3 py-3 text-sm text-blue-300">
              <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              Generating your story… this takes 30–90 seconds.
            </div>
          )}

          {!activeJob && !hasStory && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm leading-relaxed">
                Develop your initial one-line idea into full screenplay options with authentic Tamil dialogue, character arcs, and cinematic scenes.
              </p>
              {genError && (
                <div className="flex items-start gap-2 text-rose-400 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {genError}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/projects/${projectId}/story?action=options`}>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md">
                    <Sparkles className="h-4 w-4 mr-1.5" /> ✨ Develop 2 Story Concepts (Compare &amp; Choose)
                  </Button>
                </Link>
                <Button loading={generating} onClick={() => generateStory(false)} disabled={hasProvider === false} className="bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-400" /> Generate Standard Story
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateStory(true)} className="text-xs text-zinc-400">
                  Test with mock
                </Button>
              </div>
            </div>
          )}

          {!activeJob && hasStory && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <p className="text-emerald-400 text-xs font-medium">✓ Complete screenplay &amp; scenes ready in Story Studio.</p>
              <div className="flex items-center gap-2">
                <Link href={`/projects/${projectId}/story?action=options`}>
                  <Button variant="ghost" size="sm" className="text-xs text-purple-300 hover:text-purple-200">
                    ✨ Compare 2 Alternative Options
                  </Button>
                </Link>
                <Link href={`/projects/${projectId}/story`}>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs">
                    Edit Script &amp; Scenes →
                  </Button>
                </Link>
              </div>
            </div>
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
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs border-amber-700/60 text-amber-300 hover:bg-amber-900/20"
                  onClick={async () => {
                    await fetch(`/api/projects/${projectId}/shots/generate-videos`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ force: true }),
                    });
                    load();
                  }}
                >
                  🎬 Generate All Videos Now
                </Button>
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

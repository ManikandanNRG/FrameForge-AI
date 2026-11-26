"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  Clapperboard,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Maximize2,
  Minimize2,
  GripVertical,
  Plus,
  History,
  Trash2,
} from "lucide-react";
import { FormattedChatContent } from "./FormattedChatContent";

interface ThreadSummary {
  id: string;
  scope: "STUDIO" | "PROJECT";
  title: string;
  messageCount: number;
  updatedAt: string;
}

interface ActionItem {
  type: string;
  details?: string;
  sceneNumber?: number;
  sceneNumbers?: number[];
}

interface CreatedEpisodeLink {
  id: string;
  title: string;
  episodeNumber: number;
  url: string;
}

interface ComparisonRow {
  realElement: string;
  inedibleCounterpart: string;
  cookingMethod: string;
}

interface ProposedEpisodePlan {
  episodeNumber: number;
  title: string;
  sourceIdea: string;
  dishName: string;
  targetRuntime: number;
  sceneCount?: number;
  mode?: "CREATE_NEW" | "REVISE_CURRENT";
  targetProjectId?: string;
  comparisonTable?: ComparisonRow[];
}

interface ChatMessage {
  id: string;
  sender: "USER" | "AI_DIRECTOR" | "SYSTEM";
  message: string;
  actionsTaken?: ActionItem[];
  createdEpisode?: CreatedEpisodeLink;
  proposedEpisodePlan?: ProposedEpisodePlan;
  proposalStatus?: "PENDING" | "APPROVED" | "SUPERSEDED";
  createdAt: string;
}

interface AiDirectorChatDrawerProps {
  projectId?: string;
  projectTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated?: () => void;
}

function extractApiError(errData: any, fallback: string): string {
  if (!errData) return fallback;
  if (typeof errData.error === "string" && errData.error.trim()) return errData.error;
  if (typeof errData.error?.message === "string" && errData.error.message.trim()) {
    return errData.error.message;
  }
  if (typeof errData.message === "string" && errData.message.trim()) return errData.message;
  return fallback;
}

export function AiDirectorChatDrawer({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onProjectUpdated,
}: AiDirectorChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qcScore, setQcScore] = useState<number | null>(null);
  const [qcRating, setQcRating] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined);
  const [drawerWidth, setDrawerWidth] = useState<number>(540);
  const [isResizing, setIsResizing] = useState(false);
  const hasLoadedWidthRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadStorageKey = `ai-director-thread:${projectId || "studio"}`;
  const chatEndpointBase = projectId ? `/api/projects/${projectId}/chat` : "/api/chat";

  const clampWidth = useCallback((w: number) => {
    const maxAllowed = typeof window !== "undefined" ? Math.max(540, window.innerWidth - 32) : 1280;
    return Math.min(Math.max(440, w), maxAllowed);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai-director-drawer-width");
      if (saved) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed >= 440) {
          setDrawerWidth(clampWidth(parsed));
        }
      }
    } catch {}
    hasLoadedWidthRef.current = true;
  }, [clampWidth]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const nextWidth = clampWidth(window.innerWidth - e.clientX);
      setDrawerWidth(nextWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, clampWidth]);

  useEffect(() => {
    if (!hasLoadedWidthRef.current) return;
    try {
      localStorage.setItem("ai-director-drawer-width", String(drawerWidth));
    } catch {}
  }, [drawerWidth]);

  const isExpanded = drawerWidth >= 780;
  const toggleWidthMode = () => {
    if (drawerWidth < 780) {
      setDrawerWidth(clampWidth(900));
    } else if (drawerWidth < 1100 && typeof window !== "undefined" && window.innerWidth > 1200) {
      setDrawerWidth(clampWidth(window.innerWidth - 64));
    } else {
      setDrawerWidth(540);
    }
  };

  const isQuartz = /quartz|granite|stone|idiyappam/i.test(projectTitle || "");

  // Project-aware Quick Action Suggestions
  const quickActions = projectId
    ? [
        {
          label: "⚡ Audit ASMR QC & Hook",
          prompt: "Audit ASMR QC and verify the 0.0s Acoustic Hook and Loop score.",
        },
        {
          label: "🎣 Upgrade Scene 1 Hook",
          prompt: "Upgrade Scene 1 to a 0.0s Zero-Second Acoustic Slam Hook for maximum Shorts retention.",
        },
        ...(isQuartz
          ? [
              {
                label: "💎 Enforce Inedible Quartz (S7 & S8)",
                prompt: "Make sure Scene 7 and Scene 8 strictly look like optical-quartz silica glass noodles and raw quartz crystals, not real food.",
              },
            ]
          : [
              {
                label: "⚙️ Align Prop Continuity (S4 & S5)",
                prompt: "Align machine and cookware continuity between Scene 4 and Scene 5.",
              },
            ]),
        {
          label: "🎬 Recompile All Prompts",
          prompt: "Recompile all cinematic prompts across all scenes.",
        },
      ]
    : [
        {
          label: "🏏 Plan Ep 8: Cricket Bat & Ball",
          prompt: "For episode 8 I am going to plan the cricket Bat,and Ball. can you create the project for this",
        },
        {
          label: "⚡ Audit Latest Project QC",
          prompt: "Audit ASMR QC and verify the 0.0s Acoustic Hook and Loop score.",
        },
      ];

  // Fetch chat history & saved threads for both Studio (/projects) and Project routes
  const fetchMessages = useCallback(
    async (explicitThreadId?: string) => {
      try {
        setFetchingHistory(true);
        setError(null);
        let targetThreadId = explicitThreadId;
        if (!targetThreadId) {
          try {
            targetThreadId = localStorage.getItem(threadStorageKey) || undefined;
          } catch {}
        }
        const query = targetThreadId ? `?threadId=${encodeURIComponent(targetThreadId)}` : "";
        const res = await fetch(`${chatEndpointBase}${query}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(extractApiError(json, "Unable to load chat history. Restart server if schema updated."));
          return;
        }
        const payload = json.data ?? json;
        if (payload.threadId) {
          setActiveThreadId(payload.threadId);
          try {
            localStorage.setItem(threadStorageKey, payload.threadId);
          } catch {}
        }
        if (Array.isArray(payload.threads)) {
          setThreads(payload.threads);
        }
        if (Array.isArray(payload.messages)) {
          setMessages(payload.messages);
        }
      } catch (err: any) {
        setError(err?.message || "Network error loading chat history");
      } finally {
        setFetchingHistory(false);
      }
    },
    [chatEndpointBase, threadStorageKey]
  );

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, projectId, fetchMessages]);

  const handleCreateNewThread = async () => {
    if (loading || fetchingHistory) return;
    try {
      setError(null);
      setFetchingHistory(true);
      const res = await fetch(chatEndpointBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_thread" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiError(json, "Failed to create new chat"));
      const payload = json.data ?? json;
      if (payload.threadId) {
        setActiveThreadId(payload.threadId);
        try {
          localStorage.setItem(threadStorageKey, payload.threadId);
        } catch {}
      }
      if (Array.isArray(payload.threads)) setThreads(payload.threads);
      setMessages([]);
    } catch (err: any) {
      setError(err?.message || "Failed to start new chat");
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleDeleteCurrentThread = async () => {
    if (!activeThreadId || loading || fetchingHistory) return;
    try {
      setError(null);
      setFetchingHistory(true);
      const res = await fetch(chatEndpointBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_thread", threadId: activeThreadId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiError(json, "Failed to delete chat thread"));
      const payload = json.data ?? json;
      if (payload.threadId) {
        setActiveThreadId(payload.threadId);
        try {
          localStorage.setItem(threadStorageKey, payload.threadId);
        } catch {}
      }
      if (Array.isArray(payload.threads)) setThreads(payload.threads);
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
    } catch (err: any) {
      setError(err?.message || "Failed to delete chat");
    } finally {
      setFetchingHistory(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string, approvePlan?: ProposedEpisodePlan) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    if (!textToSend) setInputText("");
    setError(null);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "USER",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch(chatEndpointBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          ...(activeThreadId ? { threadId: activeThreadId } : {}),
          ...(approvePlan ? { approvePlan } : {}),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(extractApiError(json, "Failed to communicate with AI Director"));
      }

      const payload = json.data ?? json;
      if (payload.threadId) {
        setActiveThreadId(payload.threadId);
        try {
          localStorage.setItem(threadStorageKey, payload.threadId);
        } catch {}
      }
      if (Array.isArray(payload.threads)) {
        setThreads(payload.threads);
      }

      const replyText = payload.reply || "Director updated the project.";
      const actionsTaken: ActionItem[] = Array.isArray(payload.actionsTaken) ? payload.actionsTaken : [];

      const wasApproved = Boolean(
        payload.createdEpisode || actionsTaken.some((a) => a.type === "REVISE_EPISODE")
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "AI_DIRECTOR",
        message: replyText,
        actionsTaken,
        createdEpisode: payload.createdEpisode,
        proposedEpisodePlan: payload.proposedEpisodePlan,
        proposalStatus: payload.proposedEpisodePlan
          ? wasApproved
            ? "APPROVED"
            : "PENDING"
          : undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = wasApproved
          ? prev.map((msg) =>
              msg.proposalStatus === "PENDING"
                ? { ...msg, proposalStatus: "APPROVED" as const }
                : msg
            )
          : payload.proposedEpisodePlan
          ? prev.map((msg) =>
              msg.proposalStatus === "PENDING"
                ? { ...msg, proposalStatus: "SUPERSEDED" as const }
                : msg
            )
          : prev;
        return [...updated, aiMsg];
      });

      if (payload.qcReport) {
        setQcScore(payload.qcReport.overallScore);
        setQcRating(payload.qcReport.rating);
      }

      const mutatedCurrentProject = actionsTaken.some(
        (a) =>
          a.type === "UPDATE_SCENE" ||
          a.type === "RECOMPILE_PROMPTS" ||
          a.type === "ALIGN_PROP_CONTINUITY" ||
          a.type === "REVISE_EPISODE"
      );
      if (mutatedCurrentProject && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("frameforge:project-updated", { detail: { projectId } })
        );
      }
      if ((mutatedCurrentProject || payload.createdEpisode) && onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setError("AI Director timed out after 55s while waiting on the model provider. Please send again.");
      } else {
        setError(err?.message || "Failed to get response");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        style={{ width: `${drawerWidth}px`, maxWidth: "100vw" }}
        className={`relative bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full text-slate-100 ${
          isResizing ? "" : "transition-[width] duration-200 ease-out"
        }`}
      >
        {/* Left-Edge Drag Resize Handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize AI Director drawer width"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          title="Drag left or right to resize drawer width"
          className="hidden sm:flex absolute left-0 top-0 bottom-0 w-2 -translate-x-1 cursor-ew-resize z-20 items-center justify-center group"
        >
          <div className="w-0.5 h-full bg-transparent group-hover:bg-amber-400/70 transition-colors" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 py-2 px-0.5 rounded-l-md bg-slate-800 border border-r-0 border-slate-700 text-slate-400 group-hover:text-amber-300 group-hover:border-amber-500/40 shadow-md opacity-70 group-hover:opacity-100 transition">
            <GripVertical className="w-3 h-3" />
          </div>
        </div>

        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide text-white truncate">AI Director Co-Pilot</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">
                {projectTitle || "Cinematic Project"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {qcScore !== null && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold"
                title={qcRating || undefined}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{qcScore}/100</span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleWidthMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 transition"
              title={isExpanded ? "Switch drawer width" : "Extend drawer width for tables"}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {drawerWidth >= 1100 ? "Compact" : isExpanded ? "Full" : "Extend"}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History & Thread Switcher */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              aria-label="Switch chat history thread"
              value={activeThreadId || ""}
              onChange={(e) => {
                const nextId = e.target.value;
                if (nextId) fetchMessages(nextId);
              }}
              disabled={loading || fetchingHistory || threads.length === 0}
              className="flex-1 min-w-0 bg-slate-900 border border-slate-700/70 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 truncate"
            >
              {threads.length === 0 ? (
                <option value="">Default Conversation</option>
              ) : (
                threads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.messageCount} msgs)
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCreateNewThread}
              disabled={loading || fetchingHistory}
              title="Start a new conversation thread"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/70 text-[11px] font-semibold text-slate-200 transition disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
              <span>New Chat</span>
            </button>
            {(threads.length > 1 || messages.length > 0) && activeThreadId && (
              <button
                type="button"
                onClick={handleDeleteCurrentThread}
                disabled={loading || fetchingHistory}
                title="Delete current chat thread"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickActions.map((qa, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qa.prompt)}
              disabled={loading}
              className="text-[11px] font-medium whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-600/20 hover:text-amber-300 hover:border-amber-500/30 border border-slate-700/60 text-slate-300 transition shrink-0"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {fetchingHistory && (
            <div className="flex justify-center py-6 text-slate-400 text-xs gap-2 items-center">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Loading conversation history...</span>
            </div>
          )}

          {!fetchingHistory && messages.length === 0 && (
            <div className="text-center py-12 px-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-amber-400">
                <Clapperboard className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-slate-200">Your In-App AI Director is Ready</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask for script edits, prop continuity fixes, ASMR QC hook audits, or say &ldquo;Create Episode 8 for Cricket Bat and Ball&rdquo; to spin up a new episode.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.sender === "USER";
            const hasTable = !isUser && m.message.includes("|") && m.message.includes("---");
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`${
                    hasTable ? "w-full max-w-[98%]" : "max-w-[90%]"
                  } rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? "bg-amber-500 text-slate-950 font-medium rounded-br-xs shadow-md"
                      : "bg-slate-800/90 text-slate-200 rounded-bl-xs border border-slate-700/70 shadow-sm"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  ) : (
                    <FormattedChatContent content={m.message} />
                  )}

                  {!isUser &&
                    m.proposedEpisodePlan &&
                    !m.createdEpisode &&
                    m.proposalStatus !== "APPROVED" &&
                    m.proposalStatus !== "SUPERSEDED" && (() => {
                      const isRevise = m.proposedEpisodePlan!.mode === "REVISE_CURRENT";
                      return (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                              Episode {m.proposedEpisodePlan!.episodeNumber}{" "}
                              {isRevise ? "In-Place Revision" : "Proposal"} ·{" "}
                              {m.proposedEpisodePlan!.targetRuntime}s
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold">
                              Awaiting Approval
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white">
                            {m.proposedEpisodePlan!.dishName}
                          </div>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              handleSendMessage(
                                isRevise
                                  ? `Approved! Please update Episode ${m.proposedEpisodePlan!.episodeNumber} in-place with this revised plan.`
                                  : `Approved! Please create Episode ${m.proposedEpisodePlan!.episodeNumber} with this plan.`,
                                m.proposedEpisodePlan
                              )
                            }
                            className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isRevise
                                ? `Approve & Update Episode ${m.proposedEpisodePlan!.episodeNumber} In-Place`
                                : `Approve & Create Episode ${m.proposedEpisodePlan!.episodeNumber}`}
                            </span>
                          </button>
                        </div>
                      );
                    })()}

                  {!isUser && m.proposedEpisodePlan && !m.createdEpisode && m.proposalStatus === "APPROVED" && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Episode {m.proposedEpisodePlan.episodeNumber} Plan Approved</span>
                    </div>
                  )}

                  {!isUser && m.createdEpisode && (
                    <Link
                      href={m.createdEpisode.url}
                      onClick={onClose}
                      className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                    >
                      <span className="truncate">
                        Open Ep {m.createdEpisode.episodeNumber}: {m.createdEpisode.title}
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </Link>
                  )}

                  {/* Actions Taken Badges */}
                  {!isUser && m.actionsTaken && m.actionsTaken.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 space-y-1">
                      <p className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Actions Executed:
                      </p>
                      {m.actionsTaken.map((act, idx) => (
                        <div
                          key={idx}
                          className="text-[10px] font-mono text-slate-300 bg-slate-900/60 px-2 py-1 rounded border border-slate-800 flex items-start gap-1"
                        >
                          <span className="text-amber-400">›</span>
                          <span>{act.details || act.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>AI Director analyzing screenplay &amp; compiling prompts...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Create Episode 8 for cricket bat & ball, or Audit QC..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold shadow-md shadow-amber-500/10"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Sleek Floating Button to open the AI Director Drawer from any project page.
 */
export function AiDirectorChatFloatingButton({
  onClick,
  unreadCount = 0,
}: {
  onClick: () => void;
  unreadCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all transform hover:scale-105 active:scale-95"
      title="Open AI Director Co-Pilot"
    >
      <Sparkles className="w-4 h-4 text-slate-950 fill-current animate-pulse" />
      <span className="font-extrabold tracking-wide">AI Director</span>
      {unreadCount > 0 && (
        <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

import { clsx } from "clsx";

type BadgeVariant = "draft" | "approved" | "rejected" | "stale" | "running" | "failed" | "succeeded" | "neutral";

const styles: Record<BadgeVariant, string> = {
  draft:     "bg-zinc-800 text-zinc-300",
  approved:  "bg-emerald-900/60 text-emerald-300 border border-emerald-700",
  rejected:  "bg-rose-900/60 text-rose-300 border border-rose-700",
  stale:     "bg-amber-900/60 text-amber-300 border border-amber-700",
  running:   "bg-blue-900/60 text-blue-300 border border-blue-700 animate-pulse",
  failed:    "bg-rose-900/60 text-rose-300 border border-rose-700",
  succeeded: "bg-emerald-900/60 text-emerald-300 border border-emerald-700",
  neutral:   "bg-zinc-800 text-zinc-400",
};

export function Badge({ status, label }: { status: BadgeVariant; label?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", styles[status])}>
      {label ?? status}
    </span>
  );
}

export function jobStatusBadge(status: string): BadgeVariant {
  if (status === "SUCCEEDED") return "succeeded";
  if (status === "FAILED")    return "failed";
  if (["RUNNING", "SUBMITTING", "SUBMITTED", "WAITING_FOR_PROVIDER"].includes(status)) return "running";
  if (status === "QUEUED" || status === "RETRY_WAIT") return "draft";
  return "neutral";
}

export function artifactStatusBadge(status: string): BadgeVariant {
  if (status === "APPROVED")          return "approved";
  if (status === "REJECTED")          return "rejected";
  if (status === "POTENTIALLY_STALE") return "stale";
  return "draft";
}

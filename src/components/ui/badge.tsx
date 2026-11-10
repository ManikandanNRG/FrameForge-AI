import { clsx } from "clsx";

type BadgeVariant = "draft" | "approved" | "rejected" | "stale" | "running" | "failed" | "succeeded" | "neutral";

const styles: Record<BadgeVariant, string> = {
  draft:     "bg-slate-100 text-slate-700 border border-slate-200",
  approved:  "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
  rejected:  "bg-rose-50 text-rose-700 border border-rose-200",
  stale:     "bg-amber-50 text-amber-700 border border-amber-200",
  running:   "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse font-semibold",
  failed:    "bg-rose-50 text-rose-700 border border-rose-200",
  succeeded: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
  neutral:   "bg-slate-100 text-slate-600 border border-slate-200",
};

export function Badge({ status, label }: { status: BadgeVariant; label?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium", styles[status])}>
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

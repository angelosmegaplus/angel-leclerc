import type { ReactNode } from "react";

export type AdminStatusTone = "success" | "pending" | "error" | "info" | "neutral";

const toneClasses: Record<AdminStatusTone, string> = {
  success: "text-emerald-400",
  pending: "text-yellow-400",
  error: "text-red-500",
  info: "text-blue-400",
  neutral: "text-muted-foreground",
};

function Marker({ tone }: { tone: AdminStatusTone }) {
  if (tone === "pending") {
    return (
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        <span className="h-3 w-0.5 rounded-full bg-current" />
        <span className="h-3 w-0.5 rounded-full bg-current" />
      </span>
    );
  }

  return <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden />;
}

export function AdminStatus({
  tone = "neutral",
  children,
  compact = false,
}: {
  tone?: AdminStatusTone;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 font-medium ${compact ? "text-xs" : "text-sm"} ${toneClasses[tone]}`}
    >
      <Marker tone={tone} />
      <span className="text-foreground">{children}</span>
    </span>
  );
}

export function AdminMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: AdminStatusTone;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/70 py-3 last:border-b-0">
      <span className="truncate text-sm font-medium text-foreground">{label}</span>
      <AdminStatus tone={tone} compact>{value}</AdminStatus>
    </div>
  );
}

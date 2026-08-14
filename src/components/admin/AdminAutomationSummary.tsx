import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, Inbox, Mail, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CacheRow = { key: string; payload: Record<string, any>; updated_at: string };
const anyDb = supabase as unknown as { from: (table: string) => any };

async function loadSummaries(): Promise<Record<string, CacheRow>> {
  const { data, error } = await anyDb
    .from("angel_os_cache")
    .select("key,payload,updated_at")
    .in("key", ["google_calendar_dashboard", "gmail_dashboard", "admin_cockpit_summary"]);
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as CacheRow[]).map((row) => [row.key, row]));
}

function formatEventDate(value?: string) {
  if (!value) return "Date non précisée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(date);
}

function readable(value: any) {
  if (!value) return "Aucune synthèse récente disponible.";
  if (typeof value === "string") return value;
  if (typeof value.summary === "string") return value.summary;
  return Object.entries(value)
    .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
    .map(([key, item]) => `${key.replace(/_/g, " ")} : ${String(item)}`)
    .join(" · ") || "Synthèse disponible dans les données détaillées.";
}

export function AdminAutomationSummary({ mode = "dashboard" }: { mode?: "dashboard" | "applications" | "mail" | "messages" | "stats" | "publications" }) {
  const { data = {}, isLoading } = useQuery({
    queryKey: ["admin-automation-summaries"],
    queryFn: loadSummaries,
    refetchInterval: 5 * 60 * 1000,
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement de la synthèse automatique…</p>;

  const calendar = data.google_calendar_dashboard?.payload;
  const gmail = data.gmail_dashboard?.payload;
  const cockpit = data.admin_cockpit_summary?.payload;
  const next = calendar?.nextEvent;
  const waiting = !calendar && !gmail && !cockpit;

  if (waiting) return <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Synthèse automatique en attente du prochain passage horaire.</p>;

  if (mode !== "dashboard") {
    const mapping: Record<string, { icon: typeof Inbox; title: string; value: any }> = {
      applications: { icon: Inbox, title: "Point candidatures", value: cockpit?.applications },
      mail: { icon: Mail, title: "Point Gmail", value: gmail?.summary ?? gmail?.otherSummary },
      messages: { icon: Mail, title: "Point messages", value: cockpit?.messages },
      stats: { icon: TrendingUp, title: "Point statistiques", value: cockpit?.stats },
      publications: { icon: FileText, title: "Point publications", value: cockpit?.publications },
    };
    const item = mapping[mode];
    const text = readable(item.value);
    return <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4"><p className="flex items-center gap-2 font-medium text-foreground"><item.icon className="h-4 w-4 text-primary" />{item.title}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-primary" />Prochain rendez-vous</p>
        <p className="mt-2 font-medium text-foreground">{next?.title ?? "Aucun rendez-vous remonté"}</p>
        {next?.start && <p className="mt-1 text-sm text-muted-foreground">{formatEventDate(next.start)}</p>}
        {next?.advice && <p className="mt-2 text-sm text-muted-foreground">Conseil : {next.advice}</p>}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-primary" />Gmail important</p>
        <p className="mt-2 text-2xl font-bold">{gmail?.important?.length ?? cockpit?.gmail?.important ?? 0}</p>
        <p className="text-sm text-muted-foreground">message(s) à regarder, aucune réponse envoyée automatiquement.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-primary" />État Angel OS</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cockpit?.summary ?? "Publications, candidatures, messages et statistiques sont synthétisés à chaque passage."}</p>
      </div>
    </div>
  );
}

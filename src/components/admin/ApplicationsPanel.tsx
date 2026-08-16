import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  MailCheck,
  RefreshCw,
  SearchCheck,
  XCircle,
} from "lucide-react";
import { listRows, str, type Row } from "@/lib/angelos";
import {
  getAlternanceResearchSnapshot,
  syncGoogleApplications,
  type AlternanceResearchLead,
} from "@/lib/applications.functions";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";
import { AdminStatus, type AdminStatusTone } from "./AdminStatus";

function getApplicationStatus(status: string): { label: string; tone: AdminStatusTone } {
  if (status === "refusee") return { label: "Refusée", tone: "error" };
  if (status === "acceptee") return { label: "Acceptée", tone: "success" };
  if (status === "entretien") return { label: "Entretien", tone: "info" };
  if (status === "erreur") return { label: "Erreur 😞", tone: "neutral" };
  if (status === "partiel") return { label: "Envoi partiel 😞", tone: "neutral" };
  if (status === "relancee") return { label: "Relancée", tone: "info" };
  if (status === "envoyee") return { label: "Mail envoyé", tone: "success" };
  if (status === "action_manuelle") return { label: "Action requise", tone: "pending" };
  if (status === "entretien" || status === "peut_etre") return { label: "Peut-être", tone: "pending" };
  return { label: "En attente", tone: "pending" };
}

function sentMailOf(row: Row) {
  return (
    str(row, "sent_message") ||
    str(row, "email_body") ||
    str(row, "mail_body") ||
    str(row, "message_sent") ||
    ""
  );
}

function cleanApplicationText(value: string) {
  if (!value) return "";
  const looksLikeBrokenPage = /<!doctype html|this page didn't load|something went wrong on our end|lovable\.app|id-preview-/i.test(value);
  if (looksLikeBrokenPage) return "";
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSyncError(value: unknown) {
  const raw = value instanceof Error ? value.message : String(value ?? "");
  if (/<!doctype html|<html|this page didn't load|something went wrong on our end|id-preview-|lovable\.app/i.test(raw)) {
    return "Le service de synchronisation est momentanément indisponible. Les candidatures déjà enregistrées restent intactes. Réessaie dans quelques instants.";
  }
  const cleaned = raw
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 280) || "La synchronisation des candidatures a échoué. Réessaie dans quelques instants.";
}

type CompleteItem = {
  key: string;
  company: string;
  city: string;
  position: string;
  source: string;
  freshness: string;
  missions: string;
  level: string;
  contract: string;
  fit: string;
  action: string;
  status: string;
  lastAction: string;
  lastActionAt: string;
  nextAction: string;
  reason: string;
  recipient: string;
};

function normalizedKey(company: string, city: string, position: string) {
  return `${company}|${city}|${position}`
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function leadToItem(lead: AlternanceResearchLead): CompleteItem {
  const company = lead.employer || lead.company || "Piste sans nom";
  const city = lead.city || "";
  const position = lead.position || "";
  return {
    key: normalizedKey(company, city, position),
    company,
    city,
    position,
    source: lead.source || "",
    freshness: lead.freshness || "",
    missions: lead.missions || "",
    level: lead.level || "",
    contract: lead.contract || "",
    fit: lead.fit || "",
    action: lead.action || "",
    status: lead.status || "",
    lastAction: lead.lastAction || "",
    lastActionAt: lead.lastActionAt || "",
    nextAction: lead.nextAction || "",
    reason: lead.reason || "",
    recipient: lead.recipient || "",
  };
}

function rowToItem(row: Row): CompleteItem {
  const company = str(row, "company") || "Candidature";
  const city = str(row, "city");
  const position = str(row, "position");
  return {
    key: normalizedKey(company, city, position),
    company,
    city,
    position,
    source: str(row, "source"),
    freshness: str(row, "sent_at") || str(row, "created_at"),
    missions: str(row, "missions"),
    level: str(row, "level"),
    contract: str(row, "contract"),
    fit: str(row, "fit"),
    action: str(row, "last_action"),
    status: str(row, "status"),
    lastAction: str(row, "last_action") || (str(row, "sent_at") ? "Candidature enregistrée comme envoyée." : ""),
    lastActionAt: str(row, "last_action_at") || str(row, "updated_at") || str(row, "sent_at"),
    nextAction: str(row, "next_action") || (str(row, "follow_up_at") ? `Relance prévue : ${str(row, "follow_up_at")}` : ""),
    reason: str(row, "error_reason"),
    recipient: str(row, "recipient") || str(row, "email"),
  };
}

function mergeItem(base: CompleteItem, incoming: CompleteItem): CompleteItem {
  const prefer = (next: string, current: string) => next || current;
  return {
    ...base,
    company: prefer(incoming.company, base.company),
    city: prefer(incoming.city, base.city),
    position: prefer(incoming.position, base.position),
    source: prefer(incoming.source, base.source),
    freshness: prefer(incoming.freshness, base.freshness),
    missions: prefer(incoming.missions, base.missions),
    level: prefer(incoming.level, base.level),
    contract: prefer(incoming.contract, base.contract),
    fit: prefer(incoming.fit, base.fit),
    action: prefer(incoming.action, base.action),
    status: prefer(incoming.status, base.status),
    lastAction: prefer(incoming.lastAction, base.lastAction),
    lastActionAt: prefer(incoming.lastActionAt, base.lastActionAt),
    nextAction: prefer(incoming.nextAction, base.nextAction),
    reason: prefer(incoming.reason, base.reason),
    recipient: prefer(incoming.recipient, base.recipient),
  };
}

function completeStatus(item: CompleteItem): { label: string; tone: AdminStatusTone; group: "sent" | "valid" | "rejected" | "other" } {
  const status = item.status.toLowerCase();
  const action = `${item.action} ${item.lastAction} ${item.fit} ${item.reason}`.toLowerCase();

  if (status === "refusee") return { label: "Refusée", tone: "error", group: "rejected" };
  if (status === "acceptee") return { label: "Acceptée", tone: "success", group: "valid" };
  if (status === "entretien") return { label: "Entretien", tone: "info", group: "valid" };
  if (status === "erreur") return { label: "Erreur 😞", tone: "neutral", group: "other" };
  if (status === "partiel") return { label: "Envoi partiel 😞", tone: "neutral", group: "sent" };
  if (status === "relancee" || /relance/.test(action)) return { label: "Relancée", tone: "info", group: "sent" };
  if (status === "envoyee" || /candidature envoy[eé]e|mail envoy[eé]/.test(action)) return { label: "Mail envoyé", tone: "success", group: "sent" };
  if (status === "action_manuelle") return { label: "Action requise", tone: "pending", group: "valid" };
  if (/écart|ecart|ne correspond|incompatib|filtre école|filtre ecole|inscription .* impos/.test(action)) {
    return { label: "Ne correspond pas", tone: "neutral", group: "rejected" };
  }
  if (/conserv[eé]e|tr[eè]s compatible|compatible|pertinent|priorit[eé]/.test(action)) {
    return { label: "Validée", tone: "success", group: "valid" };
  }
  return { label: "À étudier", tone: "pending", group: "other" };
}

function shortDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function ApplicationsPanel() {
  const queryClient = useQueryClient();
  const syncApplications = useServerFn(syncGoogleApplications);
  const loadResearchSnapshot = useServerFn(getAlternanceResearchSnapshot);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"followup" | "complete">("followup");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ["angel", "applications"],
    queryFn: () => listRows("applications"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const { data: researchSnapshot, isFetching: researchFetching } = useQuery({
    queryKey: ["angel", "applications", "research-snapshot"],
    queryFn: () => loadResearchSnapshot(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const applications = useMemo(() => {
    return [...rows]
      .filter((row) => str(row, "status") !== "a_envoyer")
      .sort((a, b) => {
        const aDate = str(a, "sent_at") || str(a, "created_at") || str(a, "updated_at");
        const bDate = str(b, "sent_at") || str(b, "created_at") || str(b, "updated_at");
        return bDate.localeCompare(aDate);
      });
  }, [rows]);

  const completeItems = useMemo(() => {
    const merged = new Map<string, CompleteItem>();
    const upsert = (item: CompleteItem) => {
      const existing = merged.get(item.key);
      merged.set(item.key, existing ? mergeItem(existing, item) : item);
    };

    for (const lead of researchSnapshot?.screenedLeads || []) upsert(leadToItem(lead));
    if (researchSnapshot?.newApplication) upsert(leadToItem(researchSnapshot.newApplication));
    for (const lead of researchSnapshot?.gmailActions || []) upsert(leadToItem(lead));
    for (const row of rows) upsert(rowToItem(row));

    return [...merged.values()].sort((a, b) => {
      const aDate = a.lastActionAt || a.freshness;
      const bDate = b.lastActionAt || b.freshness;
      if (aDate && bDate) return bDate.localeCompare(aDate);
      if (aDate) return -1;
      if (bDate) return 1;
      return a.company.localeCompare(b.company, "fr");
    });
  }, [researchSnapshot, rows]);

  const completeCounts = useMemo(() => {
    return completeItems.reduce(
      (acc, item) => {
        const group = completeStatus(item).group;
        acc.total += 1;
        if (group === "sent") acc.sent += 1;
        if (group === "valid") acc.valid += 1;
        if (group === "rejected") acc.rejected += 1;
        return acc;
      },
      { total: 0, sent: 0, valid: 0, rejected: 0 },
    );
  }, [completeItems]);

  const refresh = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      const result = await syncApplications();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["angel", "applications"] }),
        queryClient.invalidateQueries({ queryKey: ["angel", "applications", "research-snapshot"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["angel", "applications"], type: "active" });

      if (result.status === "not_connected") {
        setSyncError(cleanSyncError(result.message || "La source Gmail n’est pas connectée au serveur."));
      } else {
        const details = [
          result.imported ? `${result.imported} ajoutée${result.imported > 1 ? "s" : ""}` : null,
          result.updated ? `${result.updated} mise${result.updated > 1 ? "s" : ""} à jour` : null,
          result.skipped ? `${result.skipped} inchangée${result.skipped > 1 ? "s" : ""}` : null,
        ].filter(Boolean).join(" · ");
        setSyncMessage(details || result.message || "Candidatures synchronisées.");
      }
    } catch (error) {
      setSyncError(cleanSyncError(error));
      await queryClient.invalidateQueries({ queryKey: ["angel", "applications"] });
    } finally {
      setSyncing(false);
    }
  };

  const busy = syncing || isFetching || researchFetching;

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display font-bold text-foreground">Candidatures</h2>
              <p className="text-xs text-muted-foreground">Suivi des envois et historique complet de la recherche d’alternance.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void refresh()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation…" : "Actualiser"}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/45 p-1 sm:inline-grid sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setView("followup")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${view === "followup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Suivi des candidatures
          </button>
          <button
            type="button"
            onClick={() => setView("complete")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${view === "complete" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Tableau complet
          </button>
        </div>

        {syncMessage ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        ) : null}
        {syncError ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        ) : null}

        {view === "followup" ? (
          <div className="mt-4 divide-y divide-border">
            {applications.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Aucune candidature envoyée pour le moment.</p>
            ) : (
              applications.map((row, index) => {
                const id = str(row, "id") || `application-${index}`;
                const status = getApplicationStatus(str(row, "status"));
                const company = str(row, "company") || "Candidature";
                const position = str(row, "position");
                const city = str(row, "city");
                const mail = sentMailOf(row);
                const response = cleanApplicationText(str(row, "response"));
                const isOpen = openId === id;

                return (
                  <div key={id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 py-3 text-left"
                      aria-expanded={isOpen}
                      onClick={() => setOpenId(isOpen ? null : id)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{company}</p>
                        {(position || city) && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {[position, city].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <AdminStatus tone={status.tone} compact>{status.label}</AdminStatus>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="pb-4 pl-0 sm:pl-2">
                        <div className="grid gap-3 rounded-xl border border-border bg-background/60 p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Mail envoyé</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {mail || "Le contenu du mail n’est pas enregistré dans cette candidature."}
                            </p>
                          </div>
                          <div className="border-t border-border pt-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Réponse</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {response || "Aucune réponse reçue pour le moment."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-muted-foreground"><ClipboardList className="h-4 w-4" /><span className="text-xs font-medium">Analysées</span></div>
                <p className="mt-1 text-xl font-bold text-foreground">{completeCounts.total}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-emerald-500"><SearchCheck className="h-4 w-4" /><span className="text-xs font-medium text-muted-foreground">Validées</span></div>
                <p className="mt-1 text-xl font-bold text-foreground">{completeCounts.valid}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-blue-500"><MailCheck className="h-4 w-4" /><span className="text-xs font-medium text-muted-foreground">Envoyées / relancées</span></div>
                <p className="mt-1 text-xl font-bold text-foreground">{completeCounts.sent}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-muted-foreground"><XCircle className="h-4 w-4" /><span className="text-xs font-medium">Ne correspondent pas</span></div>
                <p className="mt-1 text-xl font-bold text-foreground">{completeCounts.rejected}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/50">
              <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                Toutes les pistes conservées ou écartées par la recherche automatique, plus les candidatures réellement enregistrées. Les lignes rejetées restent visibles : elles ne disparaissent plus du suivi.
                {researchSnapshot?.updatedAt ? ` · Recherche mise à jour ${shortDate(researchSnapshot.updatedAt)}` : ""}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Employeur</th>
                      <th className="px-3 py-3 font-semibold">Poste / ville</th>
                      <th className="px-3 py-3 font-semibold">Source</th>
                      <th className="px-3 py-3 font-semibold">Niveau / contrat</th>
                      <th className="px-3 py-3 font-semibold">Évaluation</th>
                      <th className="px-3 py-3 font-semibold">Statut</th>
                      <th className="px-3 py-3 font-semibold">Dernière action</th>
                      <th className="px-3 py-3 font-semibold">Prochaine action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {completeItems.length === 0 ? (
                      <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Aucune piste de recherche enregistrée pour le moment.</td></tr>
                    ) : (
                      completeItems.map((item) => {
                        const status = completeStatus(item);
                        return (
                          <tr key={item.key} className="align-top hover:bg-muted/20">
                            <td className="px-3 py-3">
                              <p className="font-semibold text-foreground">{item.company}</p>
                              {item.recipient ? <p className="mt-1 max-w-[190px] break-all text-xs text-muted-foreground">{item.recipient}</p> : null}
                            </td>
                            <td className="px-3 py-3">
                              <p className="max-w-[220px] text-foreground">{item.position || "—"}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{item.city || "—"}</p>
                            </td>
                            <td className="px-3 py-3">
                              <p className="max-w-[180px] text-foreground">{item.source || "—"}</p>
                              {item.freshness ? <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">{item.freshness}</p> : null}
                            </td>
                            <td className="px-3 py-3">
                              <p className="max-w-[190px] text-foreground">{item.level || "—"}</p>
                              {item.contract ? <p className="mt-1 max-w-[190px] text-xs text-muted-foreground">{item.contract}</p> : null}
                            </td>
                            <td className="px-3 py-3">
                              <p className="max-w-[240px] text-xs leading-relaxed text-foreground">{item.fit || item.missions || "—"}</p>
                              {item.reason ? <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">{item.reason}</p> : null}
                            </td>
                            <td className="px-3 py-3"><AdminStatus tone={status.tone} compact>{status.label}</AdminStatus></td>
                            <td className="px-3 py-3">
                              <p className="max-w-[260px] text-xs leading-relaxed text-foreground">{item.lastAction || item.action || "—"}</p>
                              {item.lastActionAt ? <p className="mt-1 text-xs text-muted-foreground">{shortDate(item.lastActionAt)}</p> : null}
                            </td>
                            <td className="px-3 py-3"><p className="max-w-[260px] text-xs leading-relaxed text-foreground">{item.nextAction || "—"}</p></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {researchSnapshot?.angelOsSync?.status === "blocked" ? (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>La dernière recherche a été journalisée dans GitHub mais sa synchronisation directe vers la base Angel OS était bloquée. Le tableau complet utilise ce journal afin de ne perdre aucune piste.</span>
              </div>
            ) : null}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

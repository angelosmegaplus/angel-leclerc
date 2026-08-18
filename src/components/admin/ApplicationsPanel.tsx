import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock3,
  RefreshCw,
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
import { CrudModule } from "./CrudModule";
import { applicationFields } from "@/lib/angelos";

function sentMailOf(row?: Row) {
  if (!row) return "";
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
  if (
    /<!doctype html|this page didn't load|something went wrong on our end|lovable\.app|id-preview-/i.test(
      value,
    )
  )
    return "";
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
  if (
    /<!doctype html|<html|this page didn't load|something went wrong on our end|id-preview-|lovable\.app/i.test(
      raw,
    )
  ) {
    return "Le service de synchronisation est momentanément indisponible. Les candidatures déjà enregistrées restent intactes.";
  }
  return (
    raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) ||
    "La synchronisation des candidatures a échoué."
  );
}

type CompleteItem = {
  key: string;
  company: string;
  city: string;
  position: string;
  source: string;
  applicationDate: string;
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
  origin: "database" | "research";
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9@.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedKey(company: string, city: string, position: string) {
  return `${normalize(company)}|${normalize(city)}|${normalize(position)}`;
}

function placeholderCompany(value: string) {
  const company = normalize(value);
  return (
    !company ||
    /^(candidature|piste sans nom|entreprise a identifier|perigueux|sarlat|sarlat la caneda|dordogne|monpazier|marsac sur l isle|septembre 20\d{2}|retour concernant les offres d alternance|animateur|animateur bafa|community manager en alternance|alternance marketing communication|charge de communication graphisme en alternance)$/.test(
      company,
    )
  );
}

function candidatureKey(item: CompleteItem) {
  const recipient = normalize(item.recipient);
  if (recipient.includes("@")) {
    const domain = recipient.split("@").pop() || "";
    if (placeholderCompany(item.company)) {
      return `mail:${recipient}|${normalize(item.applicationDate).slice(0, 10) || normalize(item.city)}`;
    }
    return `${normalize(item.company)}|${domain}|${normalize(item.city)}`;
  }
  return normalizedKey(item.company, item.city, item.position);
}

function parseDate(value: string) {
  if (!value) return 0;
  const direct = Date.parse(value);
  if (Number.isFinite(direct)) return direct;
  const fr = value.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(?:\s+(\d{1,2}):?(\d{2})?)?/);
  if (!fr) return 0;
  const year = Number(fr[3]) < 100 ? 2000 + Number(fr[3]) : Number(fr[3]);
  return new Date(
    year,
    Number(fr[2]) - 1,
    Number(fr[1]),
    Number(fr[4] || 0),
    Number(fr[5] || 0),
  ).getTime();
}

function applicationTime(item: CompleteItem) {
  return parseDate(item.applicationDate);
}

function activityTime(item: CompleteItem) {
  return parseDate(item.lastActionAt) || applicationTime(item);
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
    // Une piste de veille n'est jamais une preuve d'envoi. Les champs freshness,
    // firstSeenAt et lastSeenAt servent au suivi de veille, pas à dater une candidature.
    applicationDate: "",
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
    origin: "research",
  };
}

function rowToItem(row: Row): CompleteItem {
  const company = str(row, "company") || "Entreprise à identifier";
  const city = str(row, "city");
  const position = str(row, "position");
  const sentAt = str(row, "sent_at");
  return {
    key: normalizedKey(company, city, position),
    company,
    city,
    position,
    source: str(row, "source"),
    // sent_at est la seule date de candidature admise ici. created_at/updated_at
    // décrivent la fiche Angel OS et ne doivent jamais être présentés comme un envoi.
    applicationDate: sentAt,
    freshness: "",
    missions: str(row, "missions"),
    level: str(row, "level"),
    contract: str(row, "contract"),
    fit: str(row, "fit"),
    action: str(row, "last_action"),
    status: str(row, "status"),
    lastAction:
      str(row, "last_action") || (sentAt ? "Candidature enregistrée comme envoyée." : ""),
    lastActionAt:
      str(row, "last_action_at") || sentAt || str(row, "updated_at") || str(row, "created_at"),
    nextAction:
      str(row, "next_action") ||
      (str(row, "follow_up_at") ? `Relance prévue : ${str(row, "follow_up_at")}` : ""),
    reason: str(row, "error_reason"),
    recipient: str(row, "recipient") || str(row, "email"),
    origin: "database",
  };
}

function mergeItem(base: CompleteItem, incoming: CompleteItem): CompleteItem {
  const baseIsDatabase = base.origin === "database";
  const incomingIsDatabase = incoming.origin === "database";
  const canonical = incomingIsDatabase && !baseIsDatabase ? incoming : base;
  const other = canonical === base ? incoming : base;
  const newest = activityTime(incoming) >= activityTime(base) ? incoming : base;
  const prefer = (current: string, fallback: string) => current || fallback;

  return {
    ...canonical,
    key: canonical.key,
    company: prefer(canonical.company, other.company),
    city: prefer(canonical.city, other.city),
    position: prefer(canonical.position, other.position),
    source: prefer(canonical.source, other.source),
    applicationDate: canonical.applicationDate,
    freshness: prefer(canonical.freshness, other.freshness),
    missions: prefer(canonical.missions, other.missions),
    level: prefer(canonical.level, other.level),
    contract: prefer(canonical.contract, other.contract),
    fit: prefer(canonical.fit, other.fit),
    action: prefer(newest.action, canonical.action),
    status: prefer(canonical.status, other.status),
    lastAction: prefer(newest.lastAction, canonical.lastAction),
    lastActionAt: prefer(newest.lastActionAt, canonical.lastActionAt),
    nextAction: prefer(canonical.nextAction, other.nextAction),
    reason: prefer(newest.reason, canonical.reason),
    recipient: prefer(canonical.recipient, other.recipient),
    origin: canonical.origin,
  };
}

function completeStatus(item: CompleteItem): { label: string; tone: AdminStatusTone } {
  const status = normalize(item.status);
  const action = normalize(`${item.action} ${item.lastAction} ${item.reason}`);

  if (item.origin === "research") {
    return { label: "En attente", tone: "pending" };
  }
  if (/refusee|refused|rejected/.test(status)) return { label: "Refusée", tone: "error" };
  if (/acceptee|accepted|embauchee/.test(status)) return { label: "Acceptée", tone: "success" };
  if (status === "entretien") return { label: "Entretien", tone: "info" };
  if (status === "erreur") return { label: "Erreur 😞", tone: "neutral" };
  if (status === "partiel") return { label: "Envoi partiel 😞", tone: "neutral" };
  if (status === "relancee" || /relance/.test(action)) return { label: "Relancée", tone: "info" };
  if (status === "envoyee" || /candidature envoyee|mail envoye/.test(action)) {
    return { label: "Mail envoyé", tone: "success" };
  }
  if (status === "action manuelle" || status === "action_manuelle") {
    return { label: "Action requise", tone: "pending" };
  }
  return { label: "En attente", tone: "pending" };
}

function isRealFollowup(item: CompleteItem) {
  if (item.origin !== "database") return false;
  const status = normalize(item.status);
  const history = normalize(`${item.action} ${item.lastAction} ${item.nextAction} ${item.reason}`);
  if (/envoyee|relancee|refusee|acceptee|entretien|partiel|erreur|action manuelle/.test(status)) {
    return true;
  }
  return /candidature envoyee|mail envoye|relance|refus|entretien|acceptee|reponse recue|non distribue|adresse invalide/.test(
    history,
  );
}

function shortDate(value: string) {
  if (!value) return "—";
  const parsed = parseDate(value);
  if (!parsed) return "—";

  // Les anciennes synchronisations Gmail stockaient parfois seulement YYYY-MM-DD.
  // Dans ce cas, ne jamais fabriquer une heure locale (02:00, 01:00, etc.).
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  return new Intl.DateTimeFormat(
    "fr-FR",
    dateOnly
      ? { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Paris",
        },
  ).format(new Date(parsed));
}

function dedupeAndSort(items: CompleteItem[]) {
  const merged = new Map<string, CompleteItem>();
  for (const item of items) {
    const key = candidatureKey(item);
    const previous = merged.get(key);
    merged.set(key, previous ? mergeItem(previous, item) : item);
  }
  return [...merged.values()].sort((a, b) => {
    const byApplicationDate = applicationTime(b) - applicationTime(a);
    if (byApplicationDate) return byApplicationDate;
    const byActivity = activityTime(b) - activityTime(a);
    if (byActivity) return byActivity;
    return a.company.localeCompare(b.company, "fr", { sensitivity: "base" });
  });
}

function candidatureGroup(
  item: CompleteItem,
): "accepted" | "rejected" | "pending" | "technical" {
  const status = normalize(item.status);
  const text = normalize(`${item.status} ${item.lastAction} ${item.action} ${item.reason}`);
  if (/acceptee|accepted|embauchee/.test(status)) return "accepted";
  if (/refusee|refused|rejected/.test(status) || /refus explicite/.test(text)) return "rejected";
  if (/erreur|partiel|non distribue|adresse invalide/.test(text)) return "technical";
  return "pending";
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
    staleTime: 15_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: researchSnapshot, isFetching: researchFetching } = useQuery({
    queryKey: ["angel", "applications", "research-snapshot"],
    queryFn: () => loadResearchSnapshot(),
    staleTime: 15_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const databaseItems = useMemo(() => rows.map(rowToItem), [rows]);

  const researchItems = useMemo(() => {
    const items: CompleteItem[] = [];
    for (const lead of researchSnapshot?.screenedLeads || []) items.push(leadToItem(lead));
    if (researchSnapshot?.newApplication) items.push(leadToItem(researchSnapshot.newApplication));
    for (const lead of researchSnapshot?.gmailActions || []) items.push(leadToItem(lead));
    return items;
  }, [researchSnapshot]);

  const allItems = useMemo(() => {
    // Les candidatures réellement envoyées viennent exclusivement de la table applications,
    // elle-même réconciliée depuis Gmail. Le runtime de recherche ne peut compléter que les pistes.
    const pendingResearch = researchItems.filter((item) => {
      const status = normalize(item.status);
      const action = normalize(`${item.action} ${item.lastAction}`);
      return !/envoyee|relancee|refusee|acceptee|entretien|partiel|erreur/.test(status) &&
        !/candidature envoyee|mail envoye|relance envoyee/.test(action);
    });
    return dedupeAndSort([...databaseItems, ...pendingResearch]);
  }, [databaseItems, researchItems]);

  const followupItems = useMemo(
    () => dedupeAndSort(databaseItems.filter(isRealFollowup)),
    [databaseItems],
  );

  const rowsByApplication = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of rows) {
      const item = rowToItem(row);
      const key = candidatureKey(item);
      const previous = map.get(key);
      if (!previous || activityTime(item) >= activityTime(rowToItem(previous))) map.set(key, row);
    }
    return map;
  }, [rows]);

  const counts = useMemo(() => {
    return followupItems.reduce(
      (acc, item) => {
        const group = candidatureGroup(item);
        acc.total += 1;
        if (group === "accepted") acc.accepted += 1;
        else if (group === "rejected") acc.rejected += 1;
        else if (group === "pending") acc.pending += 1;
        return acc;
      },
      { total: 0, accepted: 0, rejected: 0, pending: 0 },
    );
  }, [followupItems]);

  const refresh = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const result = await syncApplications();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["angel", "applications"] }),
        queryClient.invalidateQueries({
          queryKey: ["angel", "applications", "research-snapshot"],
        }),
      ]);
      if (result.status === "not_connected") {
        setSyncError(cleanSyncError(result.message || "Gmail n’est pas connecté au serveur."));
      } else {
        setSyncMessage(result.message || "Candidatures synchronisées.");
      }
    } catch (error) {
      setSyncError(cleanSyncError(error));
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
              <p className="text-xs text-muted-foreground">
                Suivi chronologique basé uniquement sur les envois réellement enregistrés.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void refresh()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation…" : "Actualiser"}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/45 p-1 sm:inline-grid">
          <button
            type="button"
            onClick={() => setView("followup")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              view === "followup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Suivi des candidatures
          </button>
          <button
            type="button"
            onClick={() => setView("complete")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              view === "complete"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Tableau complet
          </button>
        </div>

        {syncMessage ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            {syncMessage}
          </div>
        ) : null}
        {syncError ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            {syncError}
          </div>
        ) : null}

        {view === "followup" ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 text-2xl font-bold">{counts.total}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">Acceptées</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{counts.accepted}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <p className="text-xs text-muted-foreground">Refusées</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{counts.rejected}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{counts.pending}</p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-border">
              {followupItems.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Aucune candidature envoyée disponible.
                </p>
              ) : (
                followupItems.map((item, index) => {
                  const row = rowsByApplication.get(candidatureKey(item));
                  const id = row ? str(row, "id") || item.key : item.key || `application-${index}`;
                  const status = completeStatus(item);
                  const mail = sentMailOf(row);
                  const response = cleanApplicationText(
                    row ? str(row, "response") : item.reason,
                  );
                  const isOpen = openId === id;
                  return (
                    <div key={`${candidatureKey(item)}-${id}`}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 py-3 text-left"
                        aria-expanded={isOpen}
                        onClick={() => setOpenId(isOpen ? null : id)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{item.company}</p>
                          {item.position || item.city ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {[item.position, item.city].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] font-medium text-foreground/70">
                            Candidature : {item.applicationDate ? shortDate(item.applicationDate) : "date inconnue"}
                          </p>
                          {activityTime(item) && activityTime(item) !== applicationTime(item) ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Dernière activité : {shortDate(item.lastActionAt)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <AdminStatus tone={status.tone} compact>
                            {status.label}
                          </AdminStatus>
                          <ChevronDown
                            className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                      {isOpen ? (
                        <div className="pb-4">
                          <div className="grid gap-3 rounded-xl border border-border bg-background/60 p-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Dernière action
                              </p>
                              <p className="mt-2 whitespace-pre-wrap">
                                {item.lastAction || item.action || "Candidature enregistrée."}
                              </p>
                              {item.nextAction ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  À suivre : {item.nextAction}
                                </p>
                              ) : null}
                            </div>
                            <div className="border-t border-border pt-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Mail envoyé
                              </p>
                              <p className="mt-2 whitespace-pre-wrap">
                                {mail || "Contenu non enregistré dans cette source."}
                              </p>
                            </div>
                            <div className="border-t border-border pt-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Réponse / état
                              </p>
                              <p className="mt-2 whitespace-pre-wrap">
                                {response || item.reason || "Aucune réponse enregistrée."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-background/50">
            <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
              Historique complet · les dates de candidature proviennent uniquement des envois enregistrés ; sinon la date reste inconnue.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Employeur</th>
                    <th className="px-3 py-3">Poste / ville</th>
                    <th className="px-3 py-3">Date candidature</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Dernière activité</th>
                    <th className="px-3 py-3">Prochaine action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allItems.map((item) => {
                    const status = completeStatus(item);
                    return (
                      <tr key={candidatureKey(item)} className="align-top">
                        <td className="px-3 py-3 font-semibold">{item.company}</td>
                        <td className="px-3 py-3">
                          <p>{item.position || "—"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.city || "—"}</p>
                        </td>
                        <td className="px-3 py-3 text-xs font-medium">
                          {item.applicationDate ? shortDate(item.applicationDate) : "—"}
                        </td>
                        <td className="px-3 py-3 text-xs">{item.source || "—"}</td>
                        <td className="px-3 py-3">
                          <AdminStatus tone={status.tone} compact>
                            {status.label}
                          </AdminStatus>
                        </td>
                        <td className="px-3 py-3">
                          <p className="max-w-[280px] text-xs">
                            {item.lastAction || item.action || "—"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {activityTime(item) ? shortDate(item.lastActionAt) : "—"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-xs">{item.nextAction || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

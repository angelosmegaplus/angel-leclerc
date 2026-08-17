import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  CalendarDays,
  ContactRound,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Youtube,
} from "lucide-react";
import { AdminCard } from "./AdminShell";
import {
  getGoogleYouTubeAnalytics,
  getGoogleYouTubeChannel,
  listGoogleContacts,
  type GoogleContact,
  type GoogleYouTubeAnalytics,
  type GoogleYouTubeChannel,
} from "@/lib/google-workspace.functions";
import { GOOGLE_SERVICES, hasGoogleServiceScopes } from "@/lib/oauth/google-services";

function serviceEnabled(scopes: string[], id: "gmail" | "calendar" | "drive" | "contacts" | "youtube" | "youtube_analytics") {
  const service = GOOGLE_SERVICES.find((item) => item.id === id);
  return service ? hasGoogleServiceScopes(scopes, service) : false;
}

function ModuleLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition hover:border-primary/40"
    >
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function formatNumber(value: number | null) {
  if (value === null) return "Masqué";
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function GoogleServicesModules({ grantedScopes }: { grantedScopes: string[] }) {
  const loadContacts = useServerFn(listGoogleContacts);
  const loadChannel = useServerFn(getGoogleYouTubeChannel);
  const loadAnalytics = useServerFn(getGoogleYouTubeAnalytics);

  const contactsEnabled = serviceEnabled(grantedScopes, "contacts");
  const youtubeEnabled = serviceEnabled(grantedScopes, "youtube");
  const analyticsEnabled = serviceEnabled(grantedScopes, "youtube_analytics");

  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [channel, setChannel] = useState<GoogleYouTubeChannel | null>(null);
  const [analytics, setAnalytics] = useState<GoogleYouTubeAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const refresh = async () => {
    setLoading(true);
    setErrors({});
    const nextErrors: Record<string, string> = {};

    const jobs: Promise<void>[] = [];
    if (contactsEnabled) {
      jobs.push(loadContacts().then(setContacts).catch(() => {
        nextErrors.contacts = "Contacts autorisés, mais People API n’a pas répondu.";
      }));
    }
    if (youtubeEnabled) {
      jobs.push(loadChannel().then(setChannel).catch(() => {
        nextErrors.youtube = "YouTube est autorisé, mais la chaîne n’a pas pu être lue.";
      }));
    }
    if (analyticsEnabled) {
      jobs.push(loadAnalytics().then(setAnalytics).catch(() => {
        nextErrors.analytics = "YouTube Analytics est autorisé, mais les statistiques ne sont pas disponibles.";
      }));
    }

    await Promise.all(jobs);
    setErrors(nextErrors);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, [contactsEnabled, youtubeEnabled, analyticsEnabled]);

  const baseModules = [
    {
      id: "gmail",
      name: "Gmail",
      Icon: Inbox,
      enabled: serviceEnabled(grantedScopes, "gmail"),
      description: "Boîte mail et candidatures reliées au compte Google.",
      href: "/admin?tab=boite-mail",
      action: "Ouvrir la boîte mail",
    },
    {
      id: "calendar",
      name: "Google Agenda",
      Icon: CalendarDays,
      enabled: serviceEnabled(grantedScopes, "calendar"),
      description: "Événements Google directement dans l’agenda Angel OS.",
      href: "/admin?tab=agenda",
      action: "Ouvrir l’agenda",
    },
    {
      id: "drive",
      name: "Google Drive",
      Icon: FileText,
      enabled: serviceEnabled(grantedScopes, "drive"),
      description: "Fichiers Drive dans la bibliothèque privée Angel OS.",
      href: "/admin?tab=fichiers",
      action: "Ouvrir les fichiers",
    },
  ];

  return (
    <AdminCard
      title="Modules Google actifs"
      description="Les modules apparaissent comme actifs uniquement lorsque le scope OAuth correspondant est réellement accordé."
    >
      <div className="flex justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualiser les modules
        </button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {baseModules.map(({ id, name, Icon, enabled, description, href, action }) => (
          <section key={id} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-red-500" />
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${enabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                {enabled ? "Actif" : "Non autorisé"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
            {enabled ? <div className="mt-3"><ModuleLink href={href} label={action} /></div> : null}
          </section>
        ))}

        <section className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <ContactRound className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-foreground">Google Contacts</p>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${contactsEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
              {contactsEnabled ? "Actif" : "Non autorisé"}
            </span>
          </div>
          {contactsEnabled ? (
            errors.contacts ? <p className="mt-2 text-xs text-red-600">{errors.contacts}</p> : contacts.length ? (
              <ul className="mt-2 space-y-1.5">
                {contacts.slice(0, 5).map((contact) => (
                  <li key={contact.id} className="rounded-lg bg-muted/40 px-2.5 py-2">
                    <p className="truncate text-xs font-medium text-foreground">{contact.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{contact.email || contact.phone || contact.organization || "Aucune coordonnée principale"}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-xs text-muted-foreground">Aucun contact retourné par Google.</p>
          ) : <p className="mt-2 text-xs text-muted-foreground">Autorise People API pour activer ce module.</p>}
        </section>

        <section className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-foreground">YouTube</p>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${youtubeEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
              {youtubeEnabled ? "Actif" : "Non autorisé"}
            </span>
          </div>
          {youtubeEnabled ? (
            errors.youtube ? <p className="mt-2 text-xs text-red-600">{errors.youtube}</p> : channel ? (
              <div className="mt-2">
                <p className="truncate text-sm font-medium text-foreground">{channel.title}</p>
                <dl className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-lg bg-muted/40 p-2"><dt className="text-[10px] text-muted-foreground">Abonnés</dt><dd className="text-xs font-semibold">{formatNumber(channel.subscribers)}</dd></div>
                  <div className="rounded-lg bg-muted/40 p-2"><dt className="text-[10px] text-muted-foreground">Vues</dt><dd className="text-xs font-semibold">{formatNumber(channel.views)}</dd></div>
                  <div className="rounded-lg bg-muted/40 p-2"><dt className="text-[10px] text-muted-foreground">Vidéos</dt><dd className="text-xs font-semibold">{formatNumber(channel.videos)}</dd></div>
                </dl>
              </div>
            ) : <p className="mt-2 text-xs text-muted-foreground">Aucune chaîne YouTube liée à ce compte.</p>
          ) : <p className="mt-2 text-xs text-muted-foreground">Autorise YouTube Data API pour activer ce module.</p>}
        </section>

        <section className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-foreground">YouTube Analytics</p>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${analyticsEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
              {analyticsEnabled ? "Actif" : "Non autorisé"}
            </span>
          </div>
          {analyticsEnabled ? (
            errors.analytics ? <p className="mt-2 text-xs text-red-600">{errors.analytics}</p> : analytics ? (
              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground">28 derniers jours consolidés</p>
                <dl className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-lg bg-muted/40 p-2"><dt className="text-[10px] text-muted-foreground">Vues</dt><dd className="text-xs font-semibold">{formatNumber(analytics.views)}</dd></div>
                  <div className="rounded-lg bg-muted/40 p-2"><dt className="text-[10px] text-muted-foreground">Minutes</dt><dd className="text-xs font-semibold">{formatNumber(analytics.estimatedMinutesWatched)}</dd></div>
                  <div className="rounded-lg bg-muted/40 p-2"><dt className="text-[10px] text-muted-foreground">Abonnés +</dt><dd className="text-xs font-semibold">{formatNumber(analytics.subscribersGained)}</dd></div>
                </dl>
              </div>
            ) : null
          ) : <p className="mt-2 text-xs text-muted-foreground">Autorise YouTube Analytics API pour activer ce module.</p>}
        </section>
      </div>
    </AdminCard>
  );
}

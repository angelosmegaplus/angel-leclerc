import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  Loader2,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { listRows, upsertRow, fmtDate, str, type Row } from "@/lib/angelos";
import { getServiceWorkerRegistration } from "@/lib/pwa";
import {
  pushStatus,
  refreshNotifications,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/notifications.functions";

const KINDS: { key: string; label: string; help: string }[] = [
  { key: "task", label: "Tâches en retard", help: "Échéance dépassée dans Projets." },
  { key: "application", label: "Candidatures à relancer", help: "Date de relance atteinte." },
  { key: "message", label: "Nouveaux messages", help: "Demandes de contact non lues." },
  { key: "ai", label: "Actions Angel AI terminées", help: "File d'actions résolue." },
  { key: "connection", label: "Problèmes de connexion", help: "Compte externe à réautoriser." },
  { key: "agenda", label: "Rendez-vous proches", help: "Interviews dans moins de 48 h." },
  { key: "publication", label: "Publications terminées", help: "Article mis en ligne." },
];

const PREF_KEY = "angelos:notif-prefs";

function loadPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    /* préférences illisibles : on repart des valeurs par défaut */
  }
  return Object.fromEntries(KINDS.map((k) => [k.key, true]));
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function NotificationsPanel() {
  const qc = useQueryClient();
  const status = useServerFn(pushStatus);
  const sync = useServerFn(refreshNotifications);
  const save = useServerFn(savePushSubscription);
  const remove = useServerFn(removePushSubscription);

  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [swAvailable, setSwAvailable] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
    void (async () => {
      const reg = await getServiceWorkerRegistration();
      setSwAvailable(Boolean(reg));
      const sub = await reg?.pushManager?.getSubscription().catch(() => null);
      setSubscribed(Boolean(sub));
    })();
  }, []);

  const { data: push } = useQuery({ queryKey: ["push-status"], queryFn: () => status() });
  const { data: items = [], isPending } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listRows("notifications"),
  });

  const syncMutation = useMutation({
    mutationFn: () => sync(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        r.created > 0
          ? `${r.created} notification(s) ajoutée(s).`
          : "Aucun nouvel évènement à signaler.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Vérification des évènements réels à l'ouverture du centre de notifications.
  useEffect(() => {
    syncMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = useMutation({
    mutationFn: (id: string) => upsertRow("notifications", { is_read: true }, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const visible = useMemo(
    () => items.filter((n: Row) => prefs[str(n, "kind")] !== false),
    [items, prefs],
  );
  const unread = visible.filter((n) => n["is_read"] !== true);

  function togglePref(key: string, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      toast.error("Ce navigateur ne gère pas les notifications web.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      toast.error("Permission refusée : vous pouvez la réactiver dans les réglages du navigateur.");
      return;
    }
    const reg = await getServiceWorkerRegistration();
    setSwAvailable(Boolean(reg));
    if (reg) {
      reg.showNotification("Notifications Angel OS activées", {
        body: "Vous recevrez les alertes utiles de votre centre de contrôle.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });
    } else {
      new Notification("Notifications Angel OS activées");
    }

    const key = push?.publicKey;
    if (!key || !reg?.pushManager) {
      toast.success("Notifications locales prêtes. Push serveur à activer.");
      return;
    }
    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      await save({
        data: {
          endpoint: json.endpoint ?? sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          userAgent: navigator.userAgent,
        },
      });
      setSubscribed(true);
      qc.invalidateQueries({ queryKey: ["push-status"] });
      toast.success("Notifications push activées sur cet appareil.");
    } catch {
      toast.error("Abonnement push refusé par le navigateur. Notifications locales conservées.");
    }
  }

  async function disablePush() {
    const reg = await getServiceWorkerRegistration();
    const sub = await reg?.pushManager?.getSubscription().catch(() => null);
    if (sub) {
      await remove({ data: { endpoint: sub.endpoint } }).catch(() => undefined);
      await sub.unsubscribe().catch(() => undefined);
    }
    setSubscribed(false);
    qc.invalidateQueries({ queryKey: ["push-status"] });
    toast.success("Cet appareil ne recevra plus de push.");
  }

  return (
    <div className="space-y-5">
      <AdminCard title="Notifications de cet appareil">
        <div className="flex flex-wrap items-center gap-2">
          {permission === "granted" ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BellRing className="h-3.5 w-3.5" /> Autorisées
            </span>
          ) : (
            <Button className="min-h-11" onClick={enableNotifications} disabled={permission === "unsupported"}>
              <Bell className="mr-2 h-4 w-4" /> Activer les notifications
            </Button>
          )}
          {subscribed && (
            <Button variant="outline" className="min-h-11" onClick={disablePush}>
              <BellOff className="mr-2 h-4 w-4" /> Désactiver le push ici
            </Button>
          )}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {permission === "unsupported"
            ? "Ce navigateur ne gère pas les notifications web ; le centre interne ci-dessous reste complet."
            : permission === "denied"
              ? "Notifications bloquées par le navigateur. Autorisez le site dans les réglages puis revenez ici."
              : push?.serverReady
                ? "Push serveur configuré : les alertes peuvent arriver même application fermée."
                : "Notifications locales prêtes / push serveur à activer (clés VAPID non configurées)."}
        </p>
        {!swAvailable && (
          <p className="mt-2 text-xs text-muted-foreground">
            <Smartphone className="mr-1 inline h-3.5 w-3.5" />
            Le mode application installée (écran d'accueil Android) offre les notifications les plus
            fiables. Sur l'aperçu de développement, le service worker est volontairement désactivé.
          </p>
        )}
      </AdminCard>

      <AdminCard title="Préférences" description="Choisissez les évènements qui vous alertent.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {KINDS.map((k) => (
            <li
              key={k.key}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{k.label}</p>
                <p className="text-xs text-muted-foreground">{k.help}</p>
              </div>
              <Switch
                checked={prefs[k.key] !== false}
                onCheckedChange={(v) => togglePref(k.key, v)}
                aria-label={k.label}
              />
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard
        title={`Centre de notifications${unread.length ? ` — ${unread.length} non lue(s)` : ""}`}
        description="Évènements réels d'Angel OS, visibles même sans push système."
      >
        <Button
          variant="outline"
          size="sm"
          className="mb-3 min-h-11"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Vérifier les évènements
        </Button>

        {isPending && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!isPending && visible.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune notification pour le moment.</p>
        )}
        <ul className="grid gap-2">
          {visible.slice(0, 60).map((n) => {
            const read = n["is_read"] === true;
            const link = str(n, "link");
            return (
              <li
                key={n.id}
                className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-start sm:justify-between ${
                  read ? "border-border bg-background" : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{str(n, "title")}</p>
                  {str(n, "content") && (
                    <p className="text-sm text-muted-foreground">{str(n, "content")}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDate(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {link && (
                    <Button asChild size="sm" variant="outline" className="min-h-10">
                      <a href={link}>Ouvrir</a>
                    </Button>
                  )}
                  {!read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-10"
                      onClick={() => markRead.mutate(n.id)}
                    >
                      <Check className="mr-1 h-4 w-4" /> Lu
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </AdminCard>
    </div>
  );
}

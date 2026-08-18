import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { refreshNotifications } from "@/lib/notifications.functions";
import { getAdminAiHealth, type AdminAiHealth } from "@/lib/ai-health.functions";
import { getAdminIntegritySnapshot } from "@/lib/admin-integrity.functions";
import { getServiceWorkerRegistration } from "@/lib/pwa";
import { playRetroSound } from "@/lib/retro-sounds";
import { queueAdminRefresh } from "@/lib/admin-refresh-queue";
import { AdminErrorNotifier, reportAdminError } from "./AdminErrorNotifier";

const CHECK_EVERY_MS = 5 * 60 * 1000;
const AI_HEALTH_EVERY_MS = 30_000;
const IMPORTANT_KINDS = new Set(["application", "message", "agenda", "task", "ai"]);
const AI_OUTAGE_QUEUE_KEY = "angel-os-ai-outage-queued";

async function showSystemAlert(created: number, kinds: string[]) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (!kinds.some((kind) => IMPORTANT_KINDS.has(kind))) return;
  const title = created > 1 ? `Angel OS · ${created} alertes importantes` : "Angel OS · alerte importante";
  const body = kinds.includes("application") ? "Une candidature demande votre attention." : kinds.includes("message") ? "Un message important attend votre attention." : kinds.includes("agenda") ? "Un rendez-vous approche." : kinds.includes("task") ? "Une échéance importante demande votre attention." : "Angel AI a détecté une action importante.";
  const registration = await getServiceWorkerRegistration().catch(() => null);
  if (registration) {
    await registration.showNotification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", tag: "angel-os-important", data: { url: "/admin?tab=notifications" } }).catch(() => undefined);
    return;
  }
  try { new Notification(title, { body, icon: "/icons/icon-192.png", tag: "angel-os-important" }); } catch { /* centre interne */ }
}

async function showAiOutageNotification(minutes: number) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const title = "Angel OS · service IA indisponible";
  const body = `L’IA intégrée ne répond plus. Reprise ChatGPT demandée · nouvelle tentative dans ${minutes} min.`;
  const registration = await getServiceWorkerRegistration().catch(() => null);
  if (registration) {
    await registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "angel-os-ai-outage",
      requireInteraction: true,
      data: { url: "/admin" },
    }).catch(() => undefined);
    return;
  }
  try { new Notification(title, { body, icon: "/icons/icon-192.png", tag: "angel-os-ai-outage" }); } catch { /* bannière interne disponible */ }
}

function refreshSectionFromButton(button: HTMLButtonElement) {
  const aria = button.getAttribute("aria-label")?.trim() ?? "";
  const text = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const explicit = aria || text;
  if (explicit && !/^actualis/i.test(explicit)) return null;
  if (explicit && !/^actualiser$/i.test(explicit)) return explicit.replace(/^actualiser\s*/i, "").replace(/^(les|la|le|l’|l')\s*/i, "").trim() || explicit;
  const container = button.closest("section, article, [role='region'], main, div");
  const localHeading = container?.querySelector("h1, h2, h3, [data-section-title]")?.textContent?.trim();
  if (localHeading) return localHeading;
  return document.querySelector("main h1, header h1")?.textContent?.trim() || "Espace administrateur";
}

function minutesUntilRetry(aiHealth: AdminAiHealth | null, now: number) {
  if (!aiHealth?.retryAt) return 1;
  return Math.max(1, Math.ceil((aiHealth.retryAt - now) / 60_000));
}

export function AINotificationMonitor() {
  const sync = useServerFn(refreshNotifications);
  const readAiHealth = useServerFn(getAdminAiHealth);
  const readIntegrity = useServerFn(getAdminIntegritySnapshot);
  const running = useRef(false);
  const [aiHealth, setAiHealth] = useState<AdminAiHealth | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(ticker);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      const [aiResult, integrityResult] = await Promise.allSettled([readAiHealth(), readIntegrity()]);
      if (cancelled) return;
      if (aiResult.status === "rejected") reportAdminError(aiResult.reason);
      // Integrity still runs and records its real state for Maintenance/Angel OS,
      // but a cache/schema problem is deliberately not rendered as a giant fixed
      // homepage banner. It is infrastructure telemetry, not a user action.
      if (integrityResult.status === "rejected") console.warn("[admin-integrity]", integrityResult.reason);
      setAiHealth(aiResult.status === "fulfilled" ? aiResult.value : null);
    };
    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), AI_HEALTH_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void checkHealth(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [readAiHealth, readIntegrity]);

  const aiBroken = Boolean(aiHealth && (!aiHealth.enabled || !aiHealth.providerConfigured || !aiHealth.healthy));

  useEffect(() => {
    if (!aiHealth) return;
    if (!aiBroken) {
      window.localStorage.removeItem(AI_OUTAGE_QUEUE_KEY);
      return;
    }

    const outageId = String(aiHealth.lastFailureAt ?? `${aiHealth.lastReason}:${aiHealth.retryAt ?? 0}`);
    if (window.localStorage.getItem(AI_OUTAGE_QUEUE_KEY) === outageId) return;
    window.localStorage.setItem(AI_OUTAGE_QUEUE_KEY, outageId);

    const retryMinutes = minutesUntilRetry(aiHealth, Date.now());
    playRetroSound("notify");
    void showAiOutageNotification(retryMinutes);
    void queueAdminRefresh("Angel OS IA — reprise ChatGPT", {
      source: "automatic_ai_outage_detection",
      outage_reason: aiHealth.lastReason,
      last_failure_at: aiHealth.lastFailureAt,
      retry_at: aiHealth.retryAt,
      requested_takeover: "chatgpt_operator",
      path: window.location.pathname,
      message: `Service IA intégré indisponible. Reprise ChatGPT demandée. Nouvelle tentative automatique dans environ ${retryMinutes} minute(s).`,
    })
      .then(() => window.dispatchEvent(new CustomEvent("angel-os:chatgpt-queue-updated")))
      .catch((error) => reportAdminError(error));
  }, [aiBroken, aiHealth]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (cancelled || running.current) return;
      running.current = true;
      try {
        const result = await sync();
        if (cancelled || result.created <= 0) return;
        if (result.kinds.some((kind) => IMPORTANT_KINDS.has(kind))) {
          playRetroSound("notify");
          await showSystemAlert(result.created, result.kinds);
          window.dispatchEvent(new CustomEvent("angel-os:notifications-updated", { detail: result }));
        }
      } catch (error) {
        reportAdminError(error);
      } finally { running.current = false; }
    };
    const initial = window.setTimeout(() => void check(), 8_000);
    const interval = window.setInterval(() => void check(), CHECK_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; window.clearTimeout(initial); window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [sync]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement) || button.closest("[data-no-refresh-queue='true']")) return;
      const aria = button.getAttribute("aria-label") ?? "";
      const text = button.textContent ?? "";
      if (!/actualis/i.test(`${aria} ${text}`)) return;
      const section = refreshSectionFromButton(button);
      if (!section) return;
      void queueAdminRefresh(section, { label: (aria || text).replace(/\s+/g, " ").trim().slice(0, 180), path: window.location.pathname })
        .then(() => window.dispatchEvent(new CustomEvent("angel-os:chatgpt-queue-updated")))
        .catch((error) => {
          reportAdminError(error);
          console.error("[angel-os] impossible d’ajouter le contrôle d’actualisation", error);
        });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const retryMinutes = minutesUntilRetry(aiHealth, now);
  let monitorAlert = null;

  if (aiBroken) {
    const cause = !aiHealth?.providerConfigured
      ? "Aucun fournisseur Angel OS IA n’est actuellement disponible côté serveur."
      : !aiHealth.enabled
        ? "Angel OS IA est désactivée côté serveur."
        : aiHealth.lastReason === "provider"
          ? "Le fournisseur IA n’a pas répondu correctement à la dernière tentative."
          : aiHealth.lastReason === "circuit_open"
            ? "Le circuit de protection IA est temporairement ouvert après plusieurs échecs."
            : `L’IA intégrée est indisponible (${aiHealth.lastReason || "erreur inconnue"}).`;

    monitorAlert = (
      <div className="fixed inset-x-3 top-3 z-[90] mx-auto max-w-3xl rounded-2xl border-2 border-red-500 bg-red-950/95 p-4 text-red-50 shadow-[0_15px_60px_rgba(239,68,68,.35)] backdrop-blur-xl" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
          <div className="min-w-0">
            <p className="font-bold">SERVICE IA INDISPONIBLE</p>
            <p className="mt-1 text-sm text-red-100/95">Angel OS IA ne répond plus. La reprise par ChatGPT a été demandée automatiquement.</p>
            <p className="mt-1 text-sm font-semibold text-red-50">Nouvelle tentative automatique dans environ {retryMinutes} min.</p>
            <p className="mt-2 text-xs text-red-200/75">{cause} Aucun moteur local ne remplace silencieusement l’IA dans l’administration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminErrorNotifier />
      {monitorAlert}
    </>
  );
}

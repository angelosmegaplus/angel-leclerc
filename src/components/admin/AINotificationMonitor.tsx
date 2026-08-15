import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { refreshNotifications } from "@/lib/notifications.functions";
import { getAdminAiHealth, type AdminAiHealth } from "@/lib/ai-health.functions";
import { getServiceWorkerRegistration } from "@/lib/pwa";
import { playRetroSound } from "@/lib/retro-sounds";
import { queueAdminRefresh } from "@/lib/admin-refresh-queue";

const CHECK_EVERY_MS = 5 * 60 * 1000;
const IMPORTANT_KINDS = new Set(["application", "message", "agenda", "task", "ai"]);

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

export function AINotificationMonitor() {
  const sync = useServerFn(refreshNotifications);
  const readAiHealth = useServerFn(getAdminAiHealth);
  const running = useRef(false);
  const [aiHealth, setAiHealth] = useState<AdminAiHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkAi = async () => {
      try {
        const result = await readAiHealth();
        if (!cancelled) setAiHealth(result);
      } catch {
        if (!cancelled) setAiHealth(null);
      }
    };
    void checkAi();
    const interval = window.setInterval(() => void checkAi(), 60_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [readAiHealth]);

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
      } catch { /* surveillance silencieuse */ } finally { running.current = false; }
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
      void queueAdminRefresh(section, { label: (aria || text).replace(/\s+/g, " ").trim().slice(0, 180), path: window.location.pathname }).then(() => window.dispatchEvent(new CustomEvent("angel-os:chatgpt-queue-updated"))).catch((error) => console.error("[angel-os] impossible d’ajouter le contrôle d’actualisation", error));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const broken = aiHealth && (!aiHealth.enabled || !aiHealth.providerConfigured || !aiHealth.healthy);
  if (!broken) return null;
  const message = !aiHealth.providerConfigured
    ? "OPENAI_API_KEY absente : l’IA intégrée ne peut pas fonctionner."
    : !aiHealth.enabled
      ? "Angel AI est désactivée côté serveur."
      : `OpenAI est en erreur (${aiHealth.lastReason || "provider"}) : vérifiez la clé API et le fournisseur.`;

  return (
    <div className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-3xl rounded-2xl border-2 border-red-500 bg-red-950/95 p-4 text-red-50 shadow-[0_15px_60px_rgba(239,68,68,.35)] backdrop-blur-xl" role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
        <div><p className="font-bold">ALERTE IA INTÉGRÉE</p><p className="mt-1 text-sm text-red-100/90">{message}</p></div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { refreshNotifications } from "@/lib/notifications.functions";
import { getServiceWorkerRegistration } from "@/lib/pwa";
import { playRetroSound } from "@/lib/retro-sounds";

const CHECK_EVERY_MS = 5 * 60 * 1000;
const IMPORTANT_KINDS = new Set(["application", "message", "agenda", "task", "ai"]);

async function showSystemAlert(created: number, kinds: string[]) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (!kinds.some((kind) => IMPORTANT_KINDS.has(kind))) return;

  const title = created > 1 ? `Angel OS · ${created} alertes importantes` : "Angel OS · alerte importante";
  const body = kinds.includes("application")
    ? "Une candidature demande votre attention."
    : kinds.includes("message")
      ? "Un message important attend votre attention."
      : kinds.includes("agenda")
        ? "Un rendez-vous approche."
        : kinds.includes("task")
          ? "Une échéance importante demande votre attention."
          : "Angel AI a détecté une action importante.";

  const registration = await getServiceWorkerRegistration().catch(() => null);
  if (registration) {
    await registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "angel-os-important",
      renotify: true,
      data: { url: "/admin?tab=notifications" },
    }).catch(() => undefined);
    return;
  }

  try {
    new Notification(title, { body, icon: "/icons/icon-192.png", tag: "angel-os-important" });
  } catch {
    // Le centre de notifications interne reste la source de vérité si le navigateur refuse l'affichage système.
  }
}

export function AINotificationMonitor() {
  const sync = useServerFn(refreshNotifications);
  const running = useRef(false);

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
      } catch {
        // Surveillance silencieuse : une panne temporaire ne doit jamais gêner l'admin.
      } finally {
        running.current = false;
      }
    };

    const initial = window.setTimeout(() => void check(), 8_000);
    const interval = window.setInterval(() => void check(), CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync]);

  return null;
}

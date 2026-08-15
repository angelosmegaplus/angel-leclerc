import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { refreshNotifications } from "@/lib/notifications.functions";
import { getServiceWorkerRegistration } from "@/lib/pwa";
import { playRetroSound } from "@/lib/retro-sounds";
import { queueAdminRefresh } from "@/lib/admin-refresh-queue";

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

function refreshSectionFromButton(button: HTMLButtonElement) {
  const aria = button.getAttribute("aria-label")?.trim() ?? "";
  const text = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const explicit = aria || text;
  if (explicit && !/^actualis/i.test(explicit)) return null;

  if (explicit && !/^actualiser$/i.test(explicit)) {
    return explicit.replace(/^actualiser\s*/i, "").replace(/^(les|la|le|l’|l')\s*/i, "").trim() || explicit;
  }

  const container = button.closest("section, article, [role='region'], main, div");
  const localHeading = container?.querySelector("h1, h2, h3, [data-section-title]")?.textContent?.trim();
  if (localHeading) return localHeading;

  const pageHeading = document.querySelector("main h1, header h1")?.textContent?.trim();
  return pageHeading || "Espace administrateur";
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

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (button.closest("[data-no-refresh-queue='true']")) return;

      const aria = button.getAttribute("aria-label") ?? "";
      const text = button.textContent ?? "";
      if (!/actualis/i.test(`${aria} ${text}`)) return;

      const section = refreshSectionFromButton(button);
      if (!section) return;

      void queueAdminRefresh(section, {
        label: (aria || text).replace(/\s+/g, " ").trim().slice(0, 180),
        path: window.location.pathname,
      }).then(() => {
        window.dispatchEvent(new CustomEvent("angel-os:chatgpt-queue-updated"));
      }).catch((error) => {
        console.error("[angel-os] impossible d’ajouter le contrôle d’actualisation", error);
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

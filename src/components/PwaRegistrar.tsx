import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

const RECOVERY_KEY = "angel-os:asset-recovery";
const RECOVERY_WINDOW_MS = 60_000;

async function recoverFromStaleBundle() {
  const now = Date.now();
  const previous = Number(window.sessionStorage.getItem(RECOVERY_KEY) || "0");
  if (previous && now - previous < RECOVERY_WINDOW_MS) return;
  window.sessionStorage.setItem(RECOVERY_KEY, String(now));

  // Un ancien service worker ou un bundle HTML mis en cache peut continuer à
  // demander des chunks qui n'existent plus après un déploiement. Purger seulement
  // les caches Angel OS évite de transformer ce cas en faux problème de connexion.
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(
        keys.filter((key) => key.startsWith("alc-") || key.startsWith("workbox-")).map((key) => caches.delete(key)),
      );
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.update()));
    }
  } catch {
    // La récupération doit toujours finir par un rechargement, même si l'API de
    // cache n'est pas disponible ou si le navigateur refuse une mise à jour SW.
  }

  window.location.reload();
}

/**
 * Monté une seule fois dans la racine : enregistre le service worker en production
 * et répare automatiquement un onglet resté ouvert pendant un nouveau déploiement.
 */
export function PwaRegistrar() {
  useEffect(() => {
    let controllerReloaded = false;

    const onControllerChange = () => {
      if (controllerReloaded) return;
      controllerReloaded = true;
      void recoverFromStaleBundle();
    };

    const onPreloadError = (event: Event) => {
      event.preventDefault();
      void recoverFromStaleBundle();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "");
      if (!/(dynamically imported module|chunkloaderror|loading chunk|failed to fetch.*module script)/i.test(message)) return;
      event.preventDefault();
      void recoverFromStaleBundle();
    };

    const onOnline = () => {
      void navigator.serviceWorker?.getRegistration().then((registration) => registration?.update()).catch(() => undefined);
    };

    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("vite:preloadError", onPreloadError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("online", onOnline);

    void registerServiceWorker();

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("vite:preloadError", onPreloadError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("online", onOnline);
    };
  }, []);
  return null;
}

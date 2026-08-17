import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

const RECOVERY_KEY = "angel-os:asset-recovery";
const RECOVERY_WINDOW_MS = 60_000;

function recoverFromStaleBundle() {
  const now = Date.now();
  const previous = Number(window.sessionStorage.getItem(RECOVERY_KEY) || "0");
  if (previous && now - previous < RECOVERY_WINDOW_MS) return;
  window.sessionStorage.setItem(RECOVERY_KEY, String(now));
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
      recoverFromStaleBundle();
    };

    const onPreloadError = (event: Event) => {
      // Vite émet cet événement lorsqu'un ancien bundle tente de charger un chunk
      // qui n'existe plus après un déploiement. Sans récupération, TanStack Router
      // finit sur l'écran d'erreur global jusqu'à un rechargement manuel complet.
      event.preventDefault();
      recoverFromStaleBundle();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "");
      if (!/(dynamically imported module|chunkloaderror|loading chunk|failed to fetch.*module script)/i.test(message)) return;
      event.preventDefault();
      recoverFromStaleBundle();
    };

    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("vite:preloadError", onPreloadError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    void registerServiceWorker();

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("vite:preloadError", onPreloadError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
  return null;
}

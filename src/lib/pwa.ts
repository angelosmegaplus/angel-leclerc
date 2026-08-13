/**
 * Enregistrement unique et protégé du service worker Angel OS.
 * Jamais actif en développement ni dans les aperçus Lovable (iframe/preview),
 * pour ne jamais servir un vieux tableau de bord depuis un cache navigateur.
 */
const SW_URL = "/sw.js";

function isBlockedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (
    new URLSearchParams(window.location.search).has("sw") &&
    new URLSearchParams(window.location.search).get("sw") === "off"
  )
    return true;
  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active ?? r.waiting ?? r.installing)?.scriptURL.endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (isBlockedContext()) {
    await unregisterAppWorkers().catch(() => undefined);
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    // Mise à jour agressive : on vérifie à chaque retour au premier plan.
    const check = () => {
      if (document.visibilityState === "visible") registration.update().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", check);
    return registration;
  } catch {
    return null;
  }
}

/** Registration existante, sans en créer une nouvelle (utilisé par les notifications). */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration(SW_URL)) ?? null;
  } catch {
    return null;
  }
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

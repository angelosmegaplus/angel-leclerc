import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

/** Monté une seule fois dans la racine : enregistre le service worker en production. */
export function PwaRegistrar() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);
  return null;
}

import { useEffect, useState } from "react";
import {
  DEFAULT_CONSENT,
  readConsent,
  type ConsentCategory,
  type ConsentRecord,
} from "@/lib/cookie-consent";

/** Lit le consentement courant et se met à jour lors des changements. */
export function useConsent(): { record: ConsentRecord | null; ready: boolean } {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecord(readConsent());
    setReady(true);
    const onChange = (e: Event) => setRecord((e as CustomEvent<ConsentRecord | null>).detail);
    window.addEventListener("alc-consent-change", onChange);
    return () => window.removeEventListener("alc-consent-change", onChange);
  }, []);

  return { record, ready };
}

export function useConsentFor(category: ConsentCategory): boolean {
  const { record } = useConsent();
  if (category === "necessary") return true;
  return record ? record.categories[category] : DEFAULT_CONSENT[category];
}

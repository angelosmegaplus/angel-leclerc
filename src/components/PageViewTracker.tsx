import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { trackPageView } from "@/lib/analytics.functions";
import { useConsentFor } from "@/hooks/useConsent";

function deviceType(): "mobile" | "tablette" | "ordinateur" {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablette";
  return "ordinateur";
}

function sessionId(): string {
  try {
    const key = "alc_sid";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Enregistre discrètement chaque page vue (hors espace admin). */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const track = useServerFn(trackPageView);
  const last = useRef<string | null>(null);
  const allowed = useConsentFor("audience");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!allowed) return;
    if (last.current === pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;
    last.current = pathname;
    track({
      data: {
        path: pathname,
        referrer: document.referrer || "",
        device: deviceType(),
        sessionId: sessionId(),
      },
    }).catch(() => {});
  }, [pathname, track, allowed]);

  return null;
}

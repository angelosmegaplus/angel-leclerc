import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackEvent } from "@/lib/analytics.functions";
import { emitAngelOSEvent } from "@/lib/angel-os-runtime";

function deviceType(): "mobile" | "tablette" | "ordinateur" {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablette";
  return "ordinateur";
}

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/** UUID aléatoire first-party, pseudonyme (aucun fingerprint). */
function visitorId(): string {
  try {
    let id = localStorage.getItem("alc_vid");
    if (!id) {
      id = uuid();
      localStorage.setItem("alc_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Session aléatoire, expirée après 30 min d'inactivité. */
function sessionId(): string {
  try {
    const raw = localStorage.getItem("alc_sess");
    const now = Date.now();
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; ts: number };
      if (parsed?.id && now - parsed.ts < 30 * 60 * 1000) {
        localStorage.setItem("alc_sess", JSON.stringify({ id: parsed.id, ts: now }));
        return parsed.id;
      }
    }
    const id = uuid();
    localStorage.setItem("alc_sess", JSON.stringify({ id, ts: now }));
    localStorage.removeItem("alc_acq");
    return id;
  } catch {
    return "";
  }
}

type Acq = {
  source: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

function acquisition(): Acq {
  try {
    const cached = localStorage.getItem("alc_acq");
    if (cached) return JSON.parse(cached) as Acq;
  } catch {
    /* ignore */
  }
  const params = new URLSearchParams(window.location.search);
  let referrerHost: string | undefined;
  try {
    referrerHost = document.referrer
      ? new URL(document.referrer).hostname.replace(/^www\./, "").toLowerCase()
      : undefined;
  } catch {
    referrerHost = undefined;
  }
  const utmSource = params.get("utm_source") ?? undefined;
  const here = window.location.hostname.replace(/^www\./, "");
  let source = "direct";
  if (utmSource) source = `utm:${utmSource.toLowerCase()}`;
  else if (referrerHost && referrerHost !== here) {
    if (/google|bing|duckduckgo|qwant|ecosia|yahoo|yandex|brave/.test(referrerHost))
      source = "recherche";
    else if (
      /facebook|instagram|linkedin|twitter|x\.com|threads|tiktok|youtube|reddit|substack|t\.co/.test(
        referrerHost,
      )
    )
      source = `social:${referrerHost}`;
    else source = `referral:${referrerHost}`;
  }
  const acq: Acq = {
    source,
    referrerHost,
    utmSource,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
  };
  try {
    localStorage.setItem("alc_acq", JSON.stringify(acq));
  } catch {
    /* ignore */
  }
  return acq;
}

function isExcluded(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/auth");
}

/** Enregistre discrètement l'activité (hors espace admin), sans donnée personnelle. */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (last.current === pathname) return;
    if (isExcluded(pathname)) return;
    last.current = pathname;

    const acq = acquisition();
    const base = {
      path: pathname,
      device: deviceType(),
      visitorId: visitorId(),
      sessionId: sessionId(),
      ...acq,
    };

    void emitAngelOSEvent("angel-os:web:navigation", {
      path: pathname,
      title: document.title.slice(0, 200),
      device: base.device,
      source: acq.source,
    }).catch(() => {});

    const send = (payload: Record<string, unknown>) => {
      trackEvent({ data: { ...base, ...payload } as never }).catch(() => {});
    };

    send({
      eventType: "pageview",
      title: document.title.slice(0, 200),
      referrer: document.referrer || "",
      language: (navigator.language || "").slice(0, 20),
      screenWidth: window.screen?.width ?? 0,
      screenHeight: window.screen?.height ?? 0,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });

    // Clics utiles uniquement (liens, boutons, éléments marqués).
    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest?.(
        "a, button, [role='button'], [data-analytics]",
      ) as HTMLElement | null;
      if (!el) return;
      if (el.closest("form input, textarea")) return;
      const href = el.getAttribute("href") ?? "";
      let safeHref = "";
      try {
        safeHref = href ? new URL(href, window.location.origin).origin + new URL(href, window.location.origin).pathname : "";
      } catch {
        safeHref = "";
      }
      send({
        eventType: "click",
        eventName: el.dataset["analytics"] ?? el.tagName.toLowerCase(),
        metadata: {
          label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 60),
          href: safeHref.slice(0, 200),
        },
      });
    };

    // Profondeur de lecture : un envoi par seuil.
    const thresholds = [25, 50, 75, 90];
    const done = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const pct = Math.round(((window.scrollY || 0) / h) * 100);
      for (const t of thresholds) {
        if (pct >= t && !done.has(t)) {
          done.add(t);
          send({ eventType: "scroll", eventName: `depth-${t}`, metadata: { depth: t } });
        }
      }
    };

    // Temps actif (onglet visible).
    let activeMs = 0;
    let since = document.visibilityState === "visible" ? Date.now() : 0;
    const tick = () => {
      if (document.visibilityState === "visible") {
        since = since || Date.now();
      } else if (since) {
        activeMs += Date.now() - since;
        since = 0;
      }
    };
    let sentEngagement = false;
    const flush = () => {
      tick();
      if (sentEngagement) return;
      const seconds = Math.round(activeMs / 1000);
      if (seconds < 2) return;
      sentEngagement = true;
      send({ eventType: "engagement", eventName: "active-time", metadata: { seconds } });
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("pagehide", flush);

    return () => {
      flush();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  return null;
}

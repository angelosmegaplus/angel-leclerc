import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";

type AdminErrorNotice = {
  id: number;
  reason: string;
  summary: string;
  detail: string;
};

const ADMIN_ERROR_EVENT = "angel-os:admin-error";

function rawReason(value: unknown): string {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value ?? ""); }
}

function isHtmlPayload(value: string) {
  return /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(value);
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function compactRaw(value: unknown): string {
  const raw = rawReason(value);
  const text = isHtmlPayload(raw) ? stripHtml(raw) : raw;
  return text.replace(/\s+/g, " ").trim();
}

function isInternalServerFn(value: string) {
  return /\/_serverFn\//i.test(value) || /server function/i.test(value);
}

function cleanReason(value: unknown): string {
  const compact = compactRaw(value);
  if (!compact) return "Une opération n’a pas pu être terminée.";
  if (/failed to fetch|networkerror|network request failed/i.test(compact)) return "Connexion réseau momentanément impossible.";
  if (/401|unauthori[sz]ed|non autoris/i.test(compact)) return "La session ou l’autorisation n’est plus valide.";
  if (/403|forbidden|accès refusé/i.test(compact)) return "L’accès à cette opération a été refusé.";
  if (/404|not found|introuvable/i.test(compact)) return "La ressource demandée est introuvable.";
  if (/429|too many requests|rate limit/i.test(compact)) return "Trop de demandes en même temps. Angel OS va devoir ralentir brièvement.";
  if (/500|502|503|504|internal server|service unavailable|bad gateway|gateway timeout/i.test(compact)) {
    return isInternalServerFn(compact)
      ? "Une fonction interne d’Angel OS n’a pas terminé correctement l’opération."
      : "Le serveur n’a pas pu terminer cette opération pour le moment.";
  }
  if (/^error:?$/i.test(compact)) return "Une opération interne a échoué sans message exploitable.";
  return compact.length > 120 ? `${compact.slice(0, 117)}…` : compact;
}

function summarizeProblem(value: unknown): string {
  const compact = compactRaw(value);
  if (!compact) return "Angel OS n’a pas reçu assez d’informations pour identifier précisément la cause.";
  if (/failed to fetch|networkerror|network request failed/i.test(compact)) return "La requête n’a pas pu atteindre sa destination. Angel OS peut réessayer sans considérer automatiquement qu’une API est mal configurée.";
  if (/401|unauthori[sz]ed|non autoris/i.test(compact)) return "L’autorisation n’est plus valable ou ne couvre pas l’opération demandée. Une reconnexion peut être nécessaire.";
  if (/403|forbidden|accès refusé/i.test(compact)) return "L’opération a atteint le service mais les droits actuels ne permettent pas de la terminer.";
  if (/404|not found|introuvable/i.test(compact)) return "La route ou la ressource demandée n’existe pas à l’adresse utilisée.";
  if (/429|too many requests|rate limit/i.test(compact)) return "Une limite de débit a été atteinte. Les appels doivent être regroupés, mis en cache ou retentés après un court délai.";
  if (/500|502|503|504|internal server|service unavailable|bad gateway|gateway timeout/i.test(compact)) {
    return isInternalServerFn(compact)
      ? "Une fonction serveur interne d’Angel OS a échoué. Cela ne signifie pas automatiquement qu’un fournisseur externe est en panne ; le journal serveur doit identifier la vraie cause."
      : "Le serveur a reçu la demande mais n’a pas pu l’achever normalement. Angel OS doit utiliser son repli lorsqu’il existe et conserver l’interface utilisable.";
  }
  if (isHtmlPayload(rawReason(value))) return "Le serveur a renvoyé une page HTML d’erreur à la place d’une réponse applicative. Angel OS masque désormais ce contenu technique et conserve seulement un diagnostic utile.";
  return `L’opération a échoué avec le message suivant : ${compact.slice(0, 260)}${compact.length > 260 ? "…" : ""}`;
}

function technicalDetail(value: unknown): string {
  const raw = rawReason(value).replace(/\s+$/g, "");
  if (!raw) return "Aucun détail technique supplémentaire n’a été fourni.";
  if (isHtmlPayload(raw)) {
    const compact = stripHtml(raw);
    const title = compact.match(/(?:This page didn'?t load|Internal Server Error|Service Unavailable|Bad Gateway)/i)?.[0];
    return title ? `Réponse HTML serveur masquée · ${title}` : "Réponse HTML serveur masquée pour éviter d’afficher une page d’erreur brute.";
  }
  return raw.slice(0, 1600);
}

function makeNotice(value: unknown, id: number): AdminErrorNotice {
  return {
    id,
    reason: cleanReason(value),
    summary: summarizeProblem(value),
    detail: technicalDetail(value),
  };
}

export function reportAdminError(reason: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_ERROR_EVENT, { detail: reason }));
}

function playAlertTone() {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(740, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    window.setTimeout(() => void ctx.close(), 450);
  } catch {
    // L’alerte visuelle reste disponible si le navigateur bloque l’audio.
  }
}

export function AdminErrorNotifier() {
  const [notice, setNotice] = useState<AdminErrorNotice | null>(null);
  const [expanded, setExpanded] = useState(false);
  const lastReason = useRef("");
  const lastAt = useRef(0);
  const sequence = useRef(0);

  useEffect(() => {
    const show = (reason: unknown) => {
      const cleaned = cleanReason(reason);
      const now = Date.now();
      if (cleaned === lastReason.current && now - lastAt.current < 5000) return;
      lastReason.current = cleaned;
      lastAt.current = now;
      sequence.current += 1;
      setExpanded(false);
      setNotice(makeNotice(reason, sequence.current));
      playAlertTone();
    };

    const onAdminError = (event: Event) => show((event as CustomEvent<unknown>).detail);
    const onError = (event: ErrorEvent) => show(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => show(event.reason);

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 500) {
          const rawUrl = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : "";
          const url = new URL(rawUrl || window.location.href, window.location.href);
          const internal = url.origin === window.location.origin;
          show(`HTTP ${response.status} — ${internal ? "Angel OS" : url.hostname} — ${url.pathname}`);
        }
        return response;
      } catch (error) {
        show(error);
        throw error;
      }
    };

    window.addEventListener(ADMIN_ERROR_EVENT, onAdminError);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener(ADMIN_ERROR_EVENT, onAdminError);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useEffect(() => {
    if (!notice || expanded) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice, expanded]);

  if (!notice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(.75rem+env(safe-area-inset-top))] z-[100] flex justify-center px-3 sm:top-[calc(1rem+env(safe-area-inset-top))]">
      <div key={notice.id} role="alert" aria-live="assertive" className="pointer-events-auto w-full max-w-md animate-in slide-in-from-top-4 fade-in duration-300 overflow-hidden rounded-[1.35rem] border border-red-500/35 bg-[#0b0d10]/96 shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-xl">
        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="relative shrink-0"><img src="/angel-os/logo.png" alt="Angel OS" className="h-11 w-11 rounded-xl border border-red-500/25 object-cover shadow-[0_0_28px_rgba(239,68,68,.18)]" /><span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-red-400/30 bg-red-500 text-white"><AlertTriangle className="h-3 w-3" /></span></div>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left" aria-expanded={expanded}>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-red-300">Angel OS · alerte</p>
            <p className="mt-1 text-sm font-semibold text-white">Il y a un problème.</p>
            <p className="mt-1 text-xs leading-relaxed text-white/62">{notice.reason}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-red-200/75">{expanded ? "Masquer les détails" : "Voir le problème"}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} /></span>
          </button>
          <button type="button" onClick={() => setNotice(null)} aria-label="Fermer l’alerte" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-white/55 transition hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {expanded ? <div className="border-t border-white/10 bg-black/25 px-4 pb-4 pt-3"><p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Résumé du problème</p><p className="mt-2 text-xs leading-5 text-white/72">{notice.summary}</p><details className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3"><summary className="cursor-pointer text-[10px] font-semibold text-white/45">Détail technique</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-4 text-white/35">{notice.detail}</pre></details></div> : null}
        {!expanded ? <div className="h-0.5 w-full origin-left animate-[adminErrorLife_7s_linear_forwards] bg-red-400/80" /> : null}
      </div>
      <style>{`@keyframes adminErrorLife { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>
    </div>
  );
}

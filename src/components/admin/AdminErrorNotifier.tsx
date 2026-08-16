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

function compactRaw(value: unknown): string {
  return rawReason(value)
    .replace(/<!doctype[\s\S]*/i, "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanReason(value: unknown): string {
  const compact = compactRaw(value);
  if (!compact) return "Une opération n’a pas pu être terminée.";
  if (/failed to fetch|networkerror|network request failed/i.test(compact)) return "Connexion au service impossible.";
  if (/401|unauthori[sz]ed|non autoris/i.test(compact)) return "La session ou l’autorisation n’est plus valide.";
  if (/403|forbidden|accès refusé/i.test(compact)) return "Le service a refusé l’accès.";
  if (/404|not found|introuvable/i.test(compact)) return "La ressource demandée est introuvable.";
  if (/429|too many requests|rate limit/i.test(compact)) return "Le service reçoit trop de demandes pour le moment.";
  if (/500|502|503|504|internal server|service unavailable|bad gateway|gateway timeout/i.test(compact)) return "Un service distant est momentanément indisponible.";
  return compact.length > 120 ? `${compact.slice(0, 117)}…` : compact;
}

function summarizeProblem(value: unknown): string {
  const compact = compactRaw(value);
  if (!compact) return "Angel OS n’a pas reçu assez d’informations pour identifier précisément la cause.";
  if (/failed to fetch|networkerror|network request failed/i.test(compact)) return "La requête n’a pas réussi à joindre le service attendu. Cela peut venir d’une coupure réseau, d’un service hors ligne ou d’un blocage temporaire.";
  if (/401|unauthori[sz]ed|non autoris/i.test(compact)) return "Le service demande une authentification valide. La session a pu expirer ou le jeton d’accès n’est plus accepté.";
  if (/403|forbidden|accès refusé/i.test(compact)) return "La requête est arrivée au service, mais celui-ci refuse l’opération avec les droits actuellement disponibles.";
  if (/404|not found|introuvable/i.test(compact)) return "Angel OS a demandé une ressource ou une route qui n’existe pas, a été déplacée ou n’est plus disponible à cette adresse.";
  if (/429|too many requests|rate limit/i.test(compact)) return "Le fournisseur limite temporairement le nombre de requêtes. Il faut attendre avant de réessayer ou réduire la fréquence des appels.";
  if (/500|502|503|504|internal server|service unavailable|bad gateway|gateway timeout/i.test(compact)) return "Le problème vient probablement du service distant ou de son infrastructure. Angel OS a bien lancé l’opération, mais le serveur n’a pas pu la terminer normalement.";
  return `L’opération a échoué avec le message suivant : ${compact.slice(0, 260)}${compact.length > 260 ? "…" : ""}`;
}

function makeNotice(value: unknown, id: number): AdminErrorNotice {
  const detail = rawReason(value).replace(/\s+$/g, "").slice(0, 3000) || "Aucun détail technique supplémentaire n’a été fourni.";
  return {
    id,
    reason: cleanReason(value),
    summary: summarizeProblem(value),
    detail,
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
    // Browsers can block audio before the first user interaction. The visual alert still works.
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
        if (!response.ok && response.status >= 400) {
          const url = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : "service";
          show(`HTTP ${response.status} — ${new URL(url, window.location.href).pathname}`);
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
      <div
        key={notice.id}
        role="alert"
        aria-live="assertive"
        className="pointer-events-auto w-full max-w-md animate-in slide-in-from-top-4 fade-in duration-300 overflow-hidden rounded-[1.35rem] border border-red-500/35 bg-[#0b0d10]/96 shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-xl"
      >
        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="relative shrink-0">
            <img src="/angel-os/logo.png" alt="Angel OS" className="h-11 w-11 rounded-xl border border-red-500/25 object-cover shadow-[0_0_28px_rgba(239,68,68,.18)]" />
            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-red-400/30 bg-red-500 text-white">
              <AlertTriangle className="h-3 w-3" />
            </span>
          </div>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left" aria-expanded={expanded}>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-red-300">Angel OS · alerte</p>
            <p className="mt-1 text-sm font-semibold text-white">Il y a un problème.</p>
            <p className="mt-1 text-xs leading-relaxed text-white/62">{notice.reason}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-red-200/75">
              {expanded ? "Masquer les détails" : "Voir le problème"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </span>
          </button>
          <button type="button" onClick={() => setNotice(null)} aria-label="Fermer l’alerte" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-white/55 transition hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {expanded ? (
          <div className="border-t border-white/10 bg-black/25 px-4 pb-4 pt-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Résumé du problème</p>
            <p className="mt-2 text-xs leading-5 text-white/72">{notice.summary}</p>
            <details className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
              <summary className="cursor-pointer text-[10px] font-semibold text-white/45">Détail technique</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-4 text-white/35">{notice.detail}</pre>
            </details>
          </div>
        ) : null}

        {!expanded ? <div className="h-0.5 w-full origin-left animate-[adminErrorLife_7s_linear_forwards] bg-red-400/80" /> : null}
      </div>
      <style>{`@keyframes adminErrorLife { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>
    </div>
  );
}

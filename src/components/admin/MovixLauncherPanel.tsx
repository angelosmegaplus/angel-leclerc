import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe2, Maximize2, RefreshCw, Save, Trash2, X } from "lucide-react";
import { getMovixOfficialSource, type MovixOfficialSource } from "@/lib/movix-source.functions";

const OVERRIDE_KEY = "angel-movies-movix-override-v2";
const LAST_KEY = "angel-movies-movix-launcher-last-v2";

function normalize(raw: string) { const value = raw.trim(); if (!value) return ""; return /^https?:\/\//i.test(value) ? value : `https://${value}`; }
function hostOf(url: string) { try { return new URL(url).host; } catch { return url; } }
function withPath(base: string, path: string) { try { const url = new URL(base); const queryIndex = path.indexOf("?"); const pathname = queryIndex >= 0 ? path.slice(0, queryIndex) : path; const search = queryIndex >= 0 ? path.slice(queryIndex) : ""; url.pathname = pathname.startsWith("/") ? pathname : `/${pathname}`; url.search = search; url.hash = ""; return url.toString(); } catch { return base; } }
function sourceLabel(source?: MovixOfficialSource["source"]) { if (source === "last_known") return "dernier lien valide"; if (source === "persisted") return "lien automatisé enregistré"; if (source === "rentry") return "liste officielle Movix"; if (source === "movix_help") return "référence publique Movix"; if (source === "movix_online") return "movix.online"; if (source === "github") return "GitHub Movix"; if (source === "lovable_ai") return "recherche web IA Lovable"; if (source === "fallback") return "secours"; return "résolution automatique"; }
async function enterCinemaMode() {}
async function leaveCinemaMode() {}

export function MovixLauncherPanel({ targetPath, targetLabel }: { targetPath?: string | null; targetLabel?: string | null } = {}) {
  const resolveOfficialSource = useServerFn(getMovixOfficialSource);
  const [official, setOfficial] = useState<MovixOfficialSource | null>(null);
  const [override, setOverride] = useState("");
  const [draftOverride, setDraftOverride] = useState("");
  const [embed, setEmbed] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [testingOverride, setTestingOverride] = useState(false);
  const [overrideOk, setOverrideOk] = useState<boolean | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const lastAutoOpenedRef = useRef<string | null>(null);

  useEffect(() => { try { const saved = normalize(localStorage.getItem(OVERRIDE_KEY) || ""); setOverride(saved); setDraftOverride(saved); } catch {} }, []);
  useEffect(() => () => { if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current); }, []);

  async function resolveOfficial() { setResolving(true); try { const source = await resolveOfficialSource(); if (source?.url) { setOfficial(source); return source.url; } return ""; } finally { setResolving(false); } }
  useEffect(() => { void resolveOfficial(); }, []);

  const activeBase = override || official?.url || "";
  const targetUrl = targetPath && activeBase ? withPath(activeBase, targetPath) : null;

  function openIntegrated(url: string) {
    if (!url) return;
    try { localStorage.setItem(LAST_KEY, url); } catch {}
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    setEmbed(null);
    setPendingUrl(url);
    transitionTimerRef.current = window.setTimeout(() => {
      setPendingUrl(null);
      setEmbed(url);
      setFrameKey((value) => value + 1);
    }, 900);
  }

  useEffect(() => {
    if (!targetPath) return;
    const requestKey = `${targetPath}|${override}`;
    if (lastAutoOpenedRef.current === requestKey) return;
    lastAutoOpenedRef.current = requestKey;
    let cancelled = false;
    void (async () => {
      const base = override || official?.url || await resolveOfficial();
      if (cancelled || !base) return;
      openIntegrated(withPath(base, targetPath));
    })();
    return () => { cancelled = true; };
  }, [targetPath, override]);

  useEffect(() => {
    if (!embed && !pendingUrl) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.overflow = "hidden"; body.style.position = "fixed"; body.style.top = `-${scrollY}px`; body.style.width = "100%";
    return () => { body.style.overflow = previous.overflow; body.style.position = previous.position; body.style.top = previous.top; body.style.width = previous.width; window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }); };
  }, [embed, pendingUrl]);

  async function testUrl(url: string) { const value = normalize(url); if (!value) return false; try { const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 7000); await fetch(value, { mode: "no-cors", signal: controller.signal, cache: "no-store" }); window.clearTimeout(timeout); return true; } catch { return false; } }
  async function saveOverride() { const value = normalize(draftOverride); if (!value) return; setTestingOverride(true); const ok = await testUrl(value); setTestingOverride(false); setOverrideOk(ok); if (!ok) return; setOverride(value); try { localStorage.setItem(OVERRIDE_KEY, value); } catch {} }
  async function clearOverride() { setOverride(""); setDraftOverride(""); setOverrideOk(null); try { localStorage.removeItem(OVERRIDE_KEY); } catch {} await resolveOfficial(); }
  async function verifyActive() { if (!activeBase) { await resolveOfficial(); return; } const ok = await testUrl(activeBase); if (ok) return; if (override) await clearOverride(); else await resolveOfficial(); }
  async function closeIntegrated() { if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current); setPendingUrl(null); setEmbed(null); await leaveCinemaMode(); }

  return <>
    <section id="movix-launcher" className="mt-12 border-t border-white/10 pt-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          <div><div className="flex items-center gap-2 text-red-300"><Globe2 className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Angel Movies · Movix</span></div><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Lecture Movix</h2><p className="mt-2 text-sm leading-6 text-white/50">L’adresse active est résolue silencieusement. Le lecteur s’ouvre automatiquement après une très courte transition.</p>{targetLabel ? <div className="mt-3 rounded-xl border border-violet-400/20 bg-violet-400/10 p-4"><p className="text-sm text-violet-100">Lecture demandée : <strong>{targetLabel}</strong></p>{targetUrl ? <button type="button" onClick={() => openIntegrated(targetUrl)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white"><PlayIcon />Lecteur intégré</button> : <p className="mt-2 text-xs text-white/40">Préparation de la lecture…</p>}</div> : null}</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Adresse active</p><p className="mt-2 break-all font-mono text-base text-white/85">{activeBase || "Détection en cours…"}</p><p className="mt-2 text-[11px] text-white/35">Source : {override ? "adresse forcée" : sourceLabel(official?.source)}</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" disabled={!activeBase} onClick={() => activeBase && openIntegrated(activeBase)} className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Lecteur intégré</button><button type="button" onClick={() => void verifyActive()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65"><RefreshCw className={`h-4 w-4 ${resolving ? "animate-spin" : ""}`} />Vérifier</button></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><h3 className="text-sm font-semibold">Changer manuellement le domaine</h3><input value={draftOverride} onChange={(e) => { setDraftOverride(e.target.value); setOverrideOk(null); }} placeholder="https://nouveau-domaine.example" className="mt-3 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void saveOverride()} disabled={testingOverride || !draftOverride.trim()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"><Save className="h-4 w-4" />{testingOverride ? "Test…" : "Tester et utiliser"}</button>{override ? <button type="button" onClick={() => void clearOverride()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/55"><Trash2 className="h-4 w-4" />Retirer</button> : null}</div>{overrideOk === false ? <p className="mt-2 text-xs text-amber-300">Cette adresse ne répond pas.</p> : null}</div>
        </div>
        <div id="movix-launcher-frame" className="rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.12em] text-white/35">Lecteur intégré</p>{embed ? <button type="button" onClick={() => openIntegrated(embed)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60"><Maximize2 className="h-3.5 w-3.5" />Rouvrir</button> : null}</div><div className="mt-4 grid min-h-[360px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/30">Choisis un film ou une série.</div></div>
      </div>
    </section>

    {pendingUrl ? <div className="fixed inset-0 z-[10000] grid h-[100dvh] w-screen place-items-center overflow-hidden bg-[#050506] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,.14),transparent_48%)] animate-pulse" />
      <div className="relative mx-5 max-w-lg text-center animate-in fade-in zoom-in-90 duration-200">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-red-400/25 bg-red-400/10 shadow-[0_0_50px_rgba(239,68,68,.16)]"><PlayIcon /></div>
        <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-red-300/75">Angel Movies</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Ouverture du lecteur Movix</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/60"><strong className="text-white">Ne cliquez pas sur Retour.</strong><br />Pour fermer le lecteur, utilisez la croix ✕.</p>
        <div className="mx-auto mt-5 h-1 w-28 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full origin-left animate-[pulse_450ms_ease-in-out_infinite] rounded-full bg-white/70" /></div>
      </div>
    </div> : null}

    {embed ? <div className="fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-hidden bg-black"><iframe key={frameKey} src={embed} title={`Movix Launcher — ${hostOf(embed)}`} referrerPolicy="no-referrer" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" sandbox="allow-forms allow-same-origin allow-scripts allow-presentation" className="absolute inset-0 h-full w-full border-0 bg-black" /><div className="absolute bottom-3 right-3 z-20 flex gap-2 sm:bottom-5 sm:right-5"><button type="button" onClick={() => setFrameKey((v) => v + 1)} className="rounded-full border border-white/15 bg-black/70 px-3 py-2 text-xs text-white/75 backdrop-blur-lg">Recharger</button><button type="button" onClick={() => void closeIntegrated()} aria-label="Fermer le lecteur" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-lg"><X className="h-4 w-4" /></button></div></div> : null}
  </>;
}

function PlayIcon() { return <span aria-hidden="true" className="text-sm">▶</span>; }

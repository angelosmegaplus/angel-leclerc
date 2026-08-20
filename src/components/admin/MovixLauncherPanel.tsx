import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe2, Maximize2, Play, RefreshCw, Save, Trash2, X } from "lucide-react";
import { getMovixOfficialSource, type MovixOfficialSource } from "@/lib/movix-source.functions";

const OVERRIDE_KEY = "angel-movies-movix-override-v2";
const LAST_KEY = "angel-movies-movix-launcher-last-v2";

function normalize(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function withPath(base: string, path: string) {
  try {
    const url = new URL(base);
    const queryIndex = path.indexOf("?");
    const pathname = queryIndex >= 0 ? path.slice(0, queryIndex) : path;
    const search = queryIndex >= 0 ? path.slice(queryIndex) : "";
    url.pathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
    url.search = search;
    url.hash = "";
    return url.toString();
  } catch {
    return base;
  }
}

function sourceLabel(source?: MovixOfficialSource["source"]) {
  if (source === "last_known") return "dernier lien valide";
  if (source === "persisted") return "lien automatisé enregistré";
  if (source === "rentry") return "liste officielle Movix";
  if (source === "movix_help") return "référence publique Movix";
  if (source === "movix_online") return "movix.online";
  if (source === "github") return "GitHub Movix";
  if (source === "lovable_ai") return "recherche web IA Lovable";
  if (source === "fallback") return "secours";
  return "résolution automatique";
}

async function leaveCinemaMode() {}

function updateBannerDomain(url: string) {
  if (!url || typeof document === "undefined") return;
  const domain = hostOf(url);
  const status = Array.from(document.querySelectorAll("span")).find((node) =>
    node.textContent?.includes("On recherche le bon domaine"),
  ) as HTMLElement | undefined;
  if (!status) return;
  status.textContent = `Domaine actuel : ${domain}`;
  const wrapper = status.parentElement;
  if (!wrapper) return;
  Array.from(wrapper.children).forEach((child) => {
    if (child !== status && child instanceof HTMLElement && child.className.includes("animate-bounce")) {
      child.style.display = "none";
    }
  });
}

export function MovixLauncherPanel({
  targetPath,
  targetLabel,
}: {
  targetPath?: string | null;
  targetLabel?: string | null;
} = {}) {
  const resolveOfficialSource = useServerFn(getMovixOfficialSource);
  const [official, setOfficial] = useState<MovixOfficialSource | null>(null);
  const [override, setOverride] = useState("");
  const [draftOverride, setDraftOverride] = useState("");
  const [embed, setEmbed] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [testingOverride, setTestingOverride] = useState(false);
  const [overrideOk, setOverrideOk] = useState<boolean | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [launcherDismissed, setLauncherDismissed] = useState(false);
  const lastAutoOpenedRef = useRef<string | null>(null);
  const iframeLoadCountRef = useRef(0);
  const controlsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = normalize(localStorage.getItem(OVERRIDE_KEY) || "");
      setOverride(saved);
      setDraftOverride(saved);
    } catch {}
  }, []);

  async function resolveOfficial() {
    setResolving(true);
    try {
      const source = await resolveOfficialSource();
      if (source?.url) {
        setOfficial(source);
        updateBannerDomain(source.url);
        return source.url;
      }
      return "";
    } finally {
      setResolving(false);
    }
  }

  useEffect(() => {
    void resolveOfficial();
  }, []);

  const activeBase = override || official?.url || "";
  const targetUrl = targetPath && activeBase ? withPath(activeBase, targetPath) : null;

  useEffect(() => {
    if (activeBase) updateBannerDomain(activeBase);
  }, [activeBase]);

  function scheduleControlsHide(delay = 3500) {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), delay);
  }

  function revealControls() {
    setControlsVisible(true);
    scheduleControlsHide(3000);
  }

  function openPlayer(url: string) {
    if (!url) return;
    try {
      localStorage.setItem(LAST_KEY, url);
    } catch {}
    iframeLoadCountRef.current = 0;
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    setControlsVisible(true);
    setEmbed(url);
    setFrameKey((value) => value + 1);
  }

  async function launchMovix() {
    const base = activeBase || (await resolveOfficial());
    if (!base) return;
    openPlayer(base);
  }

  useEffect(() => {
    if (!targetPath) return;
    const requestKey = `${targetPath}|${override}`;
    if (lastAutoOpenedRef.current === requestKey) return;
    lastAutoOpenedRef.current = requestKey;

    let cancelled = false;
    void (async () => {
      const base = override || official?.url || (await resolveOfficial());
      if (cancelled || !base) return;
      openPlayer(withPath(base, targetPath));
    })();

    return () => {
      cancelled = true;
    };
  }, [targetPath, override, official?.url]);

  useEffect(() => {
    if (!embed) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };
  }, [embed]);

  async function testUrl(url: string) {
    const value = normalize(url);
    if (!value) return false;
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 7000);
      await fetch(value, { mode: "no-cors", signal: controller.signal, cache: "no-store" });
      window.clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  async function saveOverride() {
    const value = normalize(draftOverride);
    if (!value) return;
    setTestingOverride(true);
    const ok = await testUrl(value);
    setTestingOverride(false);
    setOverrideOk(ok);
    if (!ok) return;
    setOverride(value);
    updateBannerDomain(value);
    try {
      localStorage.setItem(OVERRIDE_KEY, value);
    } catch {}
  }

  async function clearOverride() {
    setOverride("");
    setDraftOverride("");
    setOverrideOk(null);
    try {
      localStorage.removeItem(OVERRIDE_KEY);
    } catch {}
    await resolveOfficial();
  }

  async function verifyActive() {
    if (!activeBase) {
      await resolveOfficial();
      return;
    }
    const ok = await testUrl(activeBase);
    if (ok) {
      updateBannerDomain(activeBase);
      return;
    }
    if (override) await clearOverride();
    else await resolveOfficial();
  }

  async function closeIntegrated() {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    setEmbed(null);
    setControlsVisible(true);
    await leaveCinemaMode();
  }

  function handleIframeLoad() {
    iframeLoadCountRef.current += 1;
    if (iframeLoadCountRef.current > 1) {
      setControlsVisible(false);
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    } else {
      setControlsVisible(true);
    }
  }

  return (
    <>
      {!embed && !launcherDismissed ? (
        <div className="fixed inset-x-3 top-[6.35rem] z-40 mx-auto w-auto max-w-[1100px] sm:inset-x-6 sm:top-28">
          <div className="relative">
            <button
              type="button"
              onClick={() => void launchMovix()}
              disabled={resolving && !activeBase}
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-red-400/35 bg-gradient-to-r from-red-600/95 via-red-500/95 to-red-600/95 px-12 py-3 text-sm font-bold text-white shadow-[0_12px_40px_rgba(239,68,68,.28)] backdrop-blur-xl transition hover:scale-[1.01] hover:from-red-500 hover:to-red-500 disabled:cursor-wait disabled:opacity-60 sm:min-h-16 sm:text-base"
              aria-label="Lancer Movix en plein écran"
            >
              {resolving && !activeBase ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current sm:h-6 sm:w-6" />}
              <span>Lancer Movix</span>
              <span className="hidden text-xs font-medium text-white/70 sm:inline">· plein écran</span>
            </button>
            <button
              type="button"
              onClick={() => setLauncherDismissed(true)}
              aria-label="Masquer le bouton Lancer Movix"
              title="Masquer"
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/20 text-white/75 backdrop-blur transition hover:bg-black/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <section id="movix-launcher" className="mt-12 border-t border-white/10 pt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-red-300">
                <Globe2 className="h-5 w-5" />
                <span className="font-mono text-xs uppercase tracking-[.18em]">Angel Movies · Movix</span>
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Lecture Movix</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">Le lecteur s’ouvre maintenant directement, sans transition intermédiaire.</p>

              {targetLabel ? (
                <div className="mt-3 rounded-xl border border-violet-400/20 bg-violet-400/10 p-4">
                  <p className="text-sm text-violet-100">Lecture demandée : <strong>{targetLabel}</strong></p>
                  {targetUrl ? (
                    <button type="button" onClick={() => openPlayer(targetUrl)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white">
                      <PlayIcon /> Lecteur intégré
                    </button>
                  ) : <p className="mt-2 text-xs text-white/40">Préparation de la lecture…</p>}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Adresse active</p>
              <p className="mt-2 break-all font-mono text-base text-white/85">{activeBase || "Détection en cours…"}</p>
              <p className="mt-2 text-[11px] text-white/35">Source : {override ? "adresse forcée" : sourceLabel(official?.source)}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" disabled={!activeBase} onClick={() => activeBase && openPlayer(activeBase)} className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Lecteur intégré</button>
                <button type="button" onClick={() => void verifyActive()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65">
                  <RefreshCw className={`h-4 w-4 ${resolving ? "animate-spin" : ""}`} /> Vérifier
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <h3 className="text-sm font-semibold">Changer manuellement le domaine</h3>
              <input value={draftOverride} onChange={(event) => { setDraftOverride(event.target.value); setOverrideOk(null); }} placeholder="https://nouveau-domaine.example" className="mt-3 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void saveOverride()} disabled={testingOverride || !draftOverride.trim()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">
                  <Save className="h-4 w-4" /> {testingOverride ? "Test…" : "Tester et utiliser"}
                </button>
                {override ? <button type="button" onClick={() => void clearOverride()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/55"><Trash2 className="h-4 w-4" /> Retirer</button> : null}
              </div>
              {overrideOk === false ? <p className="mt-2 text-xs text-amber-300">Cette adresse ne répond pas.</p> : null}
            </div>
          </div>

          <div id="movix-launcher-frame" className="rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-white/35">Lecteur intégré</p>
              {embed ? <button type="button" onClick={() => openPlayer(embed)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60"><Maximize2 className="h-3.5 w-3.5" /> Rouvrir</button> : null}
            </div>
            <div className="mt-4 grid min-h-[360px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/30">Choisis un film ou une série.</div>
          </div>
        </div>
      </section>

      {embed ? (
        <div className="fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-hidden bg-black">
          <iframe
            key={frameKey}
            src={embed}
            title={`Movix — ${hostOf(embed)}`}
            referrerPolicy="no-referrer"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            sandbox="allow-forms allow-same-origin allow-scripts allow-presentation"
            onLoad={handleIframeLoad}
            className="absolute inset-0 h-full w-full border-0 bg-black"
          />

          <button
            type="button"
            onClick={revealControls}
            aria-label="Afficher les commandes Movix"
            className={`absolute bottom-0 right-0 z-20 h-14 w-14 bg-transparent transition-opacity ${controlsVisible ? "pointer-events-none opacity-0" : "opacity-100"}`}
          />

          <div className={`absolute bottom-3 right-3 z-30 flex items-center gap-2 transition-all duration-300 sm:bottom-4 sm:right-4 ${controlsVisible ? "translate-y-0 opacity-85 hover:opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}>
            <button
              type="button"
              onClick={() => { setFrameKey((value) => value + 1); revealControls(); }}
              className="rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[10px] font-medium text-white/85 shadow-lg backdrop-blur-md transition hover:bg-black/85 hover:text-white"
            >
              Recharger
            </button>
            <button
              type="button"
              onClick={() => void closeIntegrated()}
              aria-label="Quitter Movix"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/65 text-white/90 shadow-lg backdrop-blur-md transition hover:bg-black/85 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlayIcon() {
  return <span aria-hidden="true" className="text-sm">▶</span>;
}
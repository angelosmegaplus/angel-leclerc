import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ExternalLink, Globe2, Maximize2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { getMovixOfficialSource, type MovixOfficialSource } from "@/lib/movix-source.functions";

type Mirror = { id: string; label: string; url: string; custom?: boolean };
type LinkStatus = "up" | "down" | "unknown";

const DEFAULT_MIRRORS: Mirror[] = [{ id: "main", label: "Source principale", url: "https://movix.online/" }];
const STORAGE_KEY = "angel-os-movix-launcher-mirrors-v1";
const LAST_KEY = "angel-os-movix-launcher-last-v1";
const AUTO_REFRESH_MS = 60 * 60_000;

function normalize(raw: string) { const value = raw.trim(); if (!value) return ""; return /^https?:\/\//i.test(value) ? value : `https://${value}`; }
function hostOf(url: string) { try { return new URL(url).host; } catch { return url; } }
function sourceLabel(source?: MovixOfficialSource["source"]) {
  if (source === "last_known") return "Dernière source valide";
  if (source === "movix_online") return "Source officielle";
  if (source === "github") return "Source GitHub";
  if (source === "fallback") return "Source de secours";
  return "Synchronisation";
}

export function MovixLauncherPanel() {
  const resolveOfficialSource = useServerFn(getMovixOfficialSource);
  const [mirrors, setMirrors] = useState<Mirror[]>(DEFAULT_MIRRORS);
  const [input, setInput] = useState("");
  const [label, setLabel] = useState("");
  const [last, setLast] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<Record<string, LinkStatus>>({});
  const [embed, setEmbed] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [sourceMeta, setSourceMeta] = useState<MovixOfficialSource | null>(null);
  const [syncingSource, setSyncingSource] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Mirror[];
        if (Array.isArray(parsed) && parsed.length) setMirrors(parsed);
      }
      setLast(localStorage.getItem(LAST_KEY));
    } catch { /* optional */ }
  }, []);

  useEffect(() => {
    let active = true;
    const syncOfficial = async () => {
      setSyncingSource(true);
      try {
        const source = await resolveOfficialSource();
        if (!active || !source?.url) return;
        setSourceMeta(source);
        setMirrors((current) => {
          const custom = current.filter((mirror) => mirror.id !== "main");
          const next = [{ id: "main", label: "Source principale synchronisée", url: source.url }, ...custom];
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* optional */ }
          return next;
        });
      } catch (error) {
        console.error("[cinema-sandbox] source sync failed", error);
      } finally {
        if (active) setSyncingSource(false);
      }
    };
    void syncOfficial();
    const interval = window.setInterval(() => void syncOfficial(), AUTO_REFRESH_MS);
    return () => { active = false; window.clearInterval(interval); };
  }, [resolveOfficialSource]);

  const persist = (next: Mirror[]) => {
    const safe = next.length ? next : DEFAULT_MIRRORS;
    setMirrors(safe);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); } catch { /* optional */ }
  };

  const primary = mirrors[0] ?? DEFAULT_MIRRORS[0];
  const lastLabel = useMemo(() => (last ? mirrors.find((item) => item.url === last)?.label ?? hostOf(last) : null), [last, mirrors]);

  const openIntegrated = (url: string) => {
    try { localStorage.setItem(LAST_KEY, url); } catch { /* optional */ }
    setLast(url);
    setEmbed(url);
    setFrameKey((value) => value + 1);
    window.setTimeout(() => document.getElementById("cinema-sandbox-frame")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const addMirror = (event: React.FormEvent) => {
    event.preventDefault();
    const url = normalize(input);
    if (!url || mirrors.some((mirror) => mirror.url === url)) { setInput(""); return; }
    persist([...mirrors, { id: `${Date.now()}`, label: label.trim() || hostOf(url), url, custom: true }]);
    setInput("");
    setLabel("");
  };

  const removeMirror = (id: string) => persist(mirrors.filter((mirror) => mirror.id !== id));

  const checkAll = async () => {
    setChecking(true);
    const results: Record<string, LinkStatus> = {};
    await Promise.all(mirrors.map(async (mirror) => {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 6000);
        await fetch(mirror.url, { mode: "no-cors", signal: controller.signal, cache: "no-store" });
        window.clearTimeout(timeout);
        results[mirror.id] = "up";
      } catch {
        results[mirror.id] = "down";
      }
    }));
    setStatus(results);
    setChecking(false);
  };

  return (
    <section id="cinema-sandbox" className="mt-8">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#08090b] shadow-[0_30px_100px_rgba(0,0,0,.42)]">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(220,38,38,.16),transparent_30%)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Maximize2 className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[.2em]">Angel Cinema Sandbox</span></div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Bac à sable grand écran</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-white/35">La zone principale reste volontairement immense. Les outils techniques sont rangés en dessous.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-emerald-200/65"><ShieldCheck className="h-3 w-3" />sandbox actif</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-white/40"><RefreshCw className={`h-3 w-3 ${syncingSource ? "animate-spin" : ""}`} />{sourceLabel(sourceMeta?.source)}</span>
          </div>
        </div>

        <div id="cinema-sandbox-frame" className="scroll-mt-3 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-white/25">Source chargée</p><p className="mt-1 font-mono text-xs text-white/45">{embed ? hostOf(embed) : "aucune source chargée"}</p></div>
            <div className="flex flex-wrap gap-2">
              {!embed ? <button type="button" onClick={() => openIntegrated(primary.url)} className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-500">Lancer la source principale</button> : null}
              {embed ? <><button type="button" onClick={() => setFrameKey((value) => value + 1)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/55">Recharger</button><a href={embed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/55">Nouvelle page <ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => setEmbed(null)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/40">Fermer</button></> : null}
            </div>
          </div>
          {embed ? <iframe key={frameKey} src={embed} title={`Angel Cinema Sandbox — ${hostOf(embed)}`} referrerPolicy="no-referrer" allow="fullscreen" sandbox="allow-forms allow-same-origin allow-scripts" className="h-[82dvh] min-h-[680px] w-full rounded-2xl border border-white/10 bg-black shadow-inner" /> : <div className="grid h-[78dvh] min-h-[640px] place-items-center rounded-2xl border border-dashed border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.04),transparent_42%)] p-8 text-center"><div><Globe2 className="mx-auto h-8 w-8 text-white/15" /><p className="mt-4 text-sm font-medium text-white/40">Grand écran prêt</p><p className="mt-2 max-w-md text-xs leading-5 text-white/25">Charge la source principale pour l’ouvrir dans l’environnement isolé du navigateur.</p><button type="button" onClick={() => openIntegrated(primary.url)} className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500">Ouvrir dans le bac à sable</button></div></div>}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
        <button type="button" onClick={() => setToolsOpen((value) => !value)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left"><div><p className="text-sm font-semibold text-white/75">Sources & outils techniques</p><p className="mt-0.5 text-[11px] text-white/30">Synchronisation, sources enregistrées et contrôles</p></div><ChevronDown className={`h-4 w-4 text-white/35 transition ${toolsOpen ? "rotate-180" : ""}`} /></button>
        {toolsOpen ? <div className="grid gap-4 border-t border-white/10 p-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">Source principale</p><p className="mt-2 font-mono text-sm text-white/70">{hostOf(primary.url)}</p>{lastLabel ? <p className="mt-1 text-[11px] text-white/25">Dernier accès : {lastLabel}</p> : null}</div><button type="button" onClick={() => openIntegrated(primary.url)} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black">Ouvrir</button></div>
            {sourceMeta ? <p className="mt-3 text-[10px] leading-5 text-white/20">Vérifié {new Date(sourceMeta.checkedAt).toLocaleString("fr-FR")}{sourceMeta.upstreamSha ? ` · ${sourceMeta.upstreamSha.slice(0, 7)}` : ""}</p> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold uppercase tracking-[.12em] text-white/35">Sources enregistrées</h3><button type="button" onClick={checkAll} disabled={checking} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />{checking ? "Test…" : "Tester"}</button></div>
            <div className="mt-3 space-y-2">{mirrors.map((mirror) => <div key={mirror.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2"><span className={`h-2 w-2 shrink-0 rounded-full ${status[mirror.id] === "up" ? "bg-emerald-400" : status[mirror.id] === "down" ? "bg-red-400" : "bg-white/20"}`} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white/60">{mirror.label}</p><p className="truncate font-mono text-[10px] text-white/20">{hostOf(mirror.url)}</p></div><button type="button" onClick={() => openIntegrated(mirror.url)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-white/55">Ouvrir</button>{mirror.custom ? <button type="button" onClick={() => removeMirror(mirror.id)} aria-label={`Supprimer ${mirror.label}`} className="grid h-8 w-8 place-items-center text-white/25 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button> : null}</div>)}</div>
          </div>

          <form onSubmit={addMirror} className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-2"><h3 className="text-xs font-semibold uppercase tracking-[.12em] text-white/35">Ajouter une source</h3><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://…" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-red-400/40" /><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Nom" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-red-400/40" /><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-4 text-sm font-medium text-white/70 hover:bg-white/[.1]"><Plus className="h-4 w-4" />Ajouter</button></div></form>
        </div> : null}
      </div>
    </section>
  );
}

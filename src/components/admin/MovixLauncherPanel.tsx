import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Globe2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { getMovixOfficialSource, type MovixOfficialSource } from "@/lib/movix-source.functions";

type Mirror = { id: string; label: string; url: string; custom?: boolean };
type LinkStatus = "up" | "down" | "unknown";

const DEFAULT_MIRRORS: Mirror[] = [{ id: "main", label: "Movix — lien principal", url: "https://movix.online/" }];
const STORAGE_KEY = "angel-os-movix-launcher-mirrors-v1";
const LAST_KEY = "angel-os-movix-launcher-last-v1";

function normalize(raw: string) { const value = raw.trim(); if (!value) return ""; return /^https?:\/\//i.test(value) ? value : `https://${value}`; }
function hostOf(url: string) { try { return new URL(url).host; } catch { return url; } }
function sourceLabel(source?: MovixOfficialSource["source"]) {
  if (source === "last_known") return "Dernier lien valide";
  if (source === "movix_online") return "Movix.online";
  if (source === "github") return "GitHub Movix";
  if (source === "fallback") return "Secours";
  return "Synchronisation";
}
function withPath(base: string, path: string) {
  try {
    const url = new URL(base);
    url.pathname = path.startsWith("/") ? path : `/${path}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return base;
  }
}

export function MovixLauncherPanel({ targetPath, targetLabel }: { targetPath?: string | null; targetLabel?: string | null } = {}) {
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Mirror[];
        if (Array.isArray(parsed) && parsed.length) setMirrors(parsed);
      }
      setLast(localStorage.getItem(LAST_KEY));
    } catch {}
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
          const next = [{ id: "main", label: "Movix — lien actuel synchronisé", url: source.url }, ...custom];
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
      } catch (error) {
        console.error("[movix-launcher] source sync failed", error);
      } finally {
        if (active) setSyncingSource(false);
      }
    };
    void syncOfficial();
    return () => { active = false; };
  }, [resolveOfficialSource]);

  const persist = (next: Mirror[]) => {
    const safe = next.length ? next : DEFAULT_MIRRORS;
    setMirrors(safe);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); } catch {}
  };

  const primary = mirrors[0] ?? DEFAULT_MIRRORS[0];
  const lastLabel = useMemo(() => (last ? mirrors.find((item) => item.url === last)?.label ?? hostOf(last) : null), [last, mirrors]);

  const openIntegrated = (url: string) => {
    try { localStorage.setItem(LAST_KEY, url); } catch {}
    setLast(url);
    setEmbed(url);
    setFrameKey((value) => value + 1);
    window.setTimeout(() => document.getElementById("movix-launcher-frame")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  useEffect(() => {
    if (!targetPath || !primary.url) return;
    openIntegrated(withPath(primary.url, targetPath));
    // targetPath est volontairement la clé : un nouveau clic Lecture recharge le contenu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPath, primary.url]);

  const addMirror = (event: React.FormEvent) => {
    event.preventDefault();
    const url = normalize(input);
    if (!url || mirrors.some((mirror) => mirror.url === url)) { setInput(""); return; }
    persist([...mirrors, { id: `${Date.now()}`, label: label.trim() || hostOf(url), url, custom: true }]);
    setInput(""); setLabel("");
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
        window.clearTimeout(timeout); results[mirror.id] = "up";
      } catch { results[mirror.id] = "down"; }
    }));
    setStatus(results); setChecking(false);
  };

  return (
    <section id="movix-launcher" className="mt-12 border-t border-white/10 pt-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Globe2 className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Movix Link Launcher</span></div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Bac à sable Movix</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Le domaine actif est résolu automatiquement. Quand tu cliques sur Lecture sur un film TMDB, Angel OS ouvre directement sa route Movix dans ce cadre. Pour une série, il ouvre la fiche Movix afin de choisir la saison et l’épisode.</p>
            {targetLabel ? <p className="mt-3 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-100">Lecture demandée : <strong>{targetLabel}</strong></p> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Lien principal synchronisé</p><p className="mt-2 font-mono text-lg text-white/85">{hostOf(primary.url)}</p></div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-white/45"><RefreshCw className={`h-3 w-3 ${syncingSource ? "animate-spin" : ""}`} />{sourceLabel(sourceMeta?.source)}</span>
            </div>
            {sourceMeta ? <p className="mt-2 text-[11px] text-white/30">Vérifié {new Date(sourceMeta.checkedAt).toLocaleString("fr-FR")}{sourceMeta.upstreamSha ? ` · ${sourceMeta.upstreamSha.slice(0, 7)}` : ""}{sourceMeta.chain?.length ? ` · parcours : ${sourceMeta.chain.join(" → ")}` : ""}</p> : null}
            <button type="button" onClick={() => openIntegrated(primary.url)} className="mt-4 w-full rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400">Ouvrir Movix</button>
            {lastLabel ? <p className="mt-3 text-xs text-white/35">Dernier accès : {lastLabel}</p> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold uppercase tracking-[.12em] text-white/45">Liens enregistrés</h3><button type="button" onClick={checkAll} disabled={checking} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-white/65 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />{checking ? "Test…" : "Tester"}</button></div>
            <div className="mt-3 space-y-2">{mirrors.map((mirror) => <div key={mirror.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status[mirror.id] === "up" ? "bg-emerald-400" : status[mirror.id] === "down" ? "bg-red-400" : "bg-white/25"}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white/80">{mirror.label}</p><p className="truncate font-mono text-[11px] text-white/30">{hostOf(mirror.url)}</p></div><button type="button" onClick={() => openIntegrated(mirror.url)} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black">Ouvrir</button>{mirror.custom ? <button type="button" onClick={() => removeMirror(mirror.id)} aria-label={`Supprimer ${mirror.label}`} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/35 hover:text-red-300"><Trash2 className="h-4 w-4" /></button> : null}</div>)}</div>
          </div>

          <form onSubmit={addMirror} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><h3 className="text-sm font-semibold uppercase tracking-[.12em] text-white/45">Ajouter un lien</h3><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_auto]"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://…" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/20" /><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Nom" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/20" /><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-4 text-sm font-medium text-white/75"><Plus className="h-4 w-4" /> Ajouter</button></div></form>
        </div>

        <div id="movix-launcher-frame" className="scroll-mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-white/35">Cadre intégré</p><p className="mt-1 max-w-[70vw] truncate font-mono text-xs text-white/30">{embed || "aucun lien chargé"}</p></div>{embed ? <div className="flex gap-2"><button type="button" onClick={() => setFrameKey((value) => value + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">Recharger</button><a href={embed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">Nouvelle page <ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => setEmbed(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40">Fermer</button></div> : null}</div>
          <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs leading-5 text-white/45">Si Movix interdit l’intégration iframe sur une version donnée, utilise « Nouvelle page ». Angel OS ne contourne pas les protections du site.</p>
          {embed ? <iframe key={frameKey} src={embed} title={`Movix Launcher — ${hostOf(embed)}`} referrerPolicy="no-referrer" allow="fullscreen" sandbox="allow-forms allow-same-origin allow-scripts" className="mt-4 h-[70vh] min-h-[520px] w-full rounded-xl border border-white/10 bg-black" /> : <div className="mt-4 grid min-h-[520px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/30">Clique sur Lecture sous un film ou ouvre Movix manuellement.</div>}
        </div>
      </div>
    </section>
  );
}

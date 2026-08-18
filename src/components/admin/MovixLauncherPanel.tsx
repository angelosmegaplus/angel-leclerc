import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Globe2, RefreshCw, Save, Trash2 } from "lucide-react";
import { getMovixOfficialSource, type MovixOfficialSource } from "@/lib/movix-source.functions";

const OVERRIDE_KEY = "angel-os-movix-override-v1";
const LAST_KEY = "angel-os-movix-launcher-last-v1";

function normalize(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function hostOf(url: string) {
  try { return new URL(url).host; } catch { return url; }
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

function sourceLabel(source?: MovixOfficialSource["source"]) {
  if (source === "last_known") return "dernier lien valide";
  if (source === "movix_online") return "movix.online";
  if (source === "github") return "GitHub Movix";
  if (source === "fallback") return "secours";
  return "résolution automatique";
}

export function MovixLauncherPanel({ targetPath, targetLabel }: { targetPath?: string | null; targetLabel?: string | null } = {}) {
  const resolveOfficialSource = useServerFn(getMovixOfficialSource);
  const [official, setOfficial] = useState<MovixOfficialSource | null>(null);
  const [override, setOverride] = useState("");
  const [draftOverride, setDraftOverride] = useState("");
  const [embed, setEmbed] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [testingOverride, setTestingOverride] = useState(false);
  const [overrideOk, setOverrideOk] = useState<boolean | null>(null);

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
      if (source?.url) setOfficial(source);
      return source?.url || "https://movix.online/";
    } finally {
      setResolving(false);
    }
  }

  useEffect(() => { void resolveOfficial(); }, []);

  const activeBase = override || official?.url || "https://movix.online/";

  function openIntegrated(url: string) {
    try { localStorage.setItem(LAST_KEY, url); } catch {}
    setEmbed(url);
    setFrameKey((value) => value + 1);
    window.setTimeout(() => document.getElementById("movix-launcher-frame")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  useEffect(() => {
    if (!targetPath || !activeBase) return;
    openIntegrated(withPath(activeBase, targetPath));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPath, activeBase]);

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
    try { localStorage.setItem(OVERRIDE_KEY, value); } catch {}
  }

  async function clearOverride() {
    setOverride("");
    setDraftOverride("");
    setOverrideOk(null);
    try { localStorage.removeItem(OVERRIDE_KEY); } catch {}
    await resolveOfficial();
  }

  async function verifyActive() {
    const ok = await testUrl(activeBase);
    if (ok) return;
    if (override) await clearOverride();
    else await resolveOfficial();
  }

  return (
    <section id="movix-launcher" className="mt-12 border-t border-white/10 pt-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-red-300"><Globe2 className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-[.18em]">Movix Link Launcher</span></div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Bac à sable Movix</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Le domaine est retrouvé automatiquement via le dernier lien valide, movix.online et le dépôt officiel Movix. Tu peux aussi forcer manuellement une nouvelle adresse. Si elle ne répond plus, le système revient au résolveur automatique.</p>
            {targetLabel ? <p className="mt-3 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-100">Lecture demandée : <strong>{targetLabel}</strong></p> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Adresse active</p>
            <p className="mt-2 break-all font-mono text-base text-white/85">{activeBase}</p>
            <p className="mt-2 text-[11px] text-white/35">Source : {override ? "adresse forcée" : sourceLabel(official?.source)}{official?.checkedAt && !override ? ` · vérifiée ${new Date(official.checkedAt).toLocaleString("fr-FR")}` : ""}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => openIntegrated(activeBase)} className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white">Ouvrir Movix</button>
              <button type="button" onClick={() => void verifyActive()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65"><RefreshCw className={`h-4 w-4 ${resolving ? "animate-spin" : ""}`} />Vérifier le lien</button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <h3 className="text-sm font-semibold">Changer manuellement le domaine</h3>
            <p className="mt-1 text-xs leading-5 text-white/35">Colle uniquement l’adresse de base. Les routes de lecture sont ajoutées automatiquement à partir de l’ID TMDB.</p>
            <input value={draftOverride} onChange={(event) => { setDraftOverride(event.target.value); setOverrideOk(null); }} placeholder="https://nouveau-domaine.example" className="mt-3 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/20" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void saveOverride()} disabled={testingOverride || !draftOverride.trim()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"><Save className="h-4 w-4" />{testingOverride ? "Test…" : "Tester et utiliser"}</button>
              {override ? <button type="button" onClick={() => void clearOverride()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/55"><Trash2 className="h-4 w-4" />Retirer l’adresse forcée</button> : null}
            </div>
            {overrideOk === true ? <p className="mt-2 text-xs text-emerald-300">Adresse valide et utilisée.</p> : null}
            {overrideOk === false ? <p className="mt-2 text-xs text-amber-300">Cette adresse ne répond pas : elle n’a pas remplacé le lien automatique.</p> : null}
          </div>
        </div>

        <div id="movix-launcher-frame" className="scroll-mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[.12em] text-white/35">Cadre intégré</p><p className="mt-1 max-w-[70vw] truncate font-mono text-xs text-white/30">{embed || "aucun lien chargé"}</p></div>
            {embed ? <div className="flex gap-2"><button type="button" onClick={() => setFrameKey((value) => value + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">Recharger</button><a href={embed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">Nouvelle page <ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => setEmbed(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40">Fermer</button></div> : null}
          </div>
          <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs leading-5 text-white/45">Si une version de Movix refuse l’intégration iframe, utilise « Nouvelle page ». Aucune protection du site n’est contournée.</p>
          {embed ? <iframe key={frameKey} src={embed} title={`Movix Launcher — ${hostOf(embed)}`} referrerPolicy="no-referrer" allow="fullscreen" sandbox="allow-forms allow-same-origin allow-scripts" className="mt-4 h-[70vh] min-h-[520px] w-full rounded-xl border border-white/10 bg-black" /> : <div className="mt-4 grid min-h-[520px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/30">Clique sur Lecture sous un film ou ouvre Movix.</div>}
        </div>
      </div>
    </section>
  );
}

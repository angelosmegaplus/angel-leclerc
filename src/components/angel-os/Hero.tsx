import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Github, Sparkles, Terminal, Activity } from "lucide-react";

function TypeLine({ text, delay = 0, speed = 24, className = "" }: { text: string; delay?: number; speed?: number; className?: string }) {
  const [visible, setVisible] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVisible(text); setDone(true); return; }
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      let i = 0;
      interval = window.setInterval(() => {
        i += 1;
        setVisible(text.slice(0, i));
        if (i >= text.length) { if (interval) window.clearInterval(interval); setDone(true); }
      }, speed);
    }, delay);
    return () => { window.clearTimeout(timeout); if (interval) window.clearInterval(interval); };
  }, [text, delay, speed]);
  return <span className={`whitespace-pre-wrap break-words ${className}`}>{visible}<span aria-hidden className={`ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] bg-red-400 ${done ? "animate-pulse opacity-45" : "animate-pulse"}`} /></span>;
}

type Commit = { sha: string; html_url: string; commit: { message: string; author?: { date?: string } } };

function RecentChanges() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits?per_page=6", { headers: { Accept: "application/vnd.github+json" } });
        if (!response.ok) throw new Error(`GitHub ${response.status}`);
        const data = (await response.json()) as Commit[];
        if (!cancelled) setCommits(data);
      } catch (error) { console.warn("[angel-os] changelog indisponible", error); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, []);
  const visible = useMemo(() => commits.map((commit) => ({ ...commit, title: commit.commit.message.split("\n")[0].trim() })).filter((commit) => commit.title).slice(0, 5), [commits]);
  return (
    <div className="mt-10 rounded-[1.75rem] border border-white/10 bg-[#090b0d]/95 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10"><Activity className="h-4 w-4 text-red-300" /></span><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-red-300">live.changelog</p><h2 className="mt-1 text-lg font-semibold text-white">Nouveautés récentes</h2></div></div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[.18em] text-emerald-300">Synchronisé avec GitHub</span>
      </div>
      <div className="mt-5 space-y-3">
        {loading && <div className="flex items-center gap-2 font-mono text-xs text-white/40"><span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />lecture des dernières modifications...</div>}
        {!loading && visible.length === 0 && <p className="text-sm leading-6 text-white/45">Les dernières évolutions du projet apparaîtront ici automatiquement dès qu’elles seront disponibles.</p>}
        {visible.map((commit, index) => <a key={commit.sha} href={commit.html_url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[.025] p-3 transition hover:border-red-500/20 hover:bg-red-500/[.04]"><span className="mt-1 font-mono text-[10px] text-red-400">0{index + 1}</span><span className="min-w-0 flex-1 break-words text-sm leading-6 text-white/60 transition group-hover:text-white/85">{commit.title}</span></a>)}
      </div>
    </div>
  );
}

function goBackToPreviousLocation() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.assign("/parcours#realisations");
}

export function Hero() {
  return (
    <section className="relative isolate overflow-x-clip px-5 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(225,55,55,.16),transparent_30%),linear-gradient(180deg,#0a0b0d_0%,#050607_76%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4"><button type="button" onClick={goBackToPreviousLocation} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:text-white" aria-label="Revenir exactement à la page précédente"><ArrowLeft size={15} /> Retour</button><div className="hidden items-center gap-2 sm:flex"><img src="/angel-os/logo.png" alt="" className="h-8 w-8 rounded-lg object-cover" /><span className="text-sm font-semibold text-white/70">Angel OS</span></div></div>
        <div className="grid items-start gap-10 pt-14 lg:grid-cols-[1.2fr_.8fr] lg:pt-20">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-red-300"><Sparkles size={13} /> Linux-ready orchestration core</div>
            <h1 className="mt-6 break-words font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl lg:text-8xl">Angel <span className="text-red-500">OS</span></h1>
            <div className="mt-5 max-w-2xl text-xl font-medium leading-snug text-white/85 sm:text-2xl"><TypeLine text="Un noyau d’orchestration hybride pour relier IA, données, workflows et services." delay={250} speed={30} /></div>
            <div className="mt-4 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8"><TypeLine text="Linux reste la cible serveur de référence. Le web, l’administration, les moteurs natifs et les services externes travaillent comme des couches complémentaires autour du même noyau." delay={1550} speed={16} /></div>
            <div className="mt-7 rounded-[1.75rem] border border-red-500/20 bg-black/50 p-5 sm:p-6">
              <div className="mb-4 flex min-w-0 items-center gap-3"><span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-400" /><p className="font-mono text-[10px] uppercase tracking-[.2em] text-red-300">Documentation technique</p><div className="h-px min-w-8 flex-1 bg-gradient-to-r from-red-500/35 to-transparent" /></div>
              <p className="max-w-3xl text-sm leading-7 text-white/50">Le Core réunit bus d’événements, registre de modules, files de tâches, workflows durables, mémoire, télémétrie et orchestration adaptative. Les moteurs Angel Native renforcent les services existants : ils ne simulent pas une connexion et ne suppriment pas une infrastructure fiable simplement parce qu’une brique interne existe.</p>
              <div className="mt-5 overflow-x-auto pb-1 font-mono text-[11px] leading-relaxed text-white/40"><TypeLine text="linux.boot → core → event.log → durable.workflow → hybrid.orchestrator → memory + telemetry" delay={3300} speed={20} className="inline-block min-w-max" /></div>
            </div>
            <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-black/35 p-5 font-mono sm:p-6">
              <div className="flex items-center gap-2 text-red-300"><Terminal className="h-4 w-4" /><span className="text-[10px] uppercase tracking-[.22em]">angel@os:~$</span></div>
              <div className="mt-4 space-y-2 text-xs leading-6 text-emerald-300/80 sm:text-sm">
                <div><TypeLine text="> initialisation du noyau Linux-ready... OK" delay={4300} speed={24} /></div>
                <div><TypeLine text="> chargement mémoire + event log + télémétrie... OK" delay={5200} speed={20} /></div>
                <div><TypeLine text="> orchestration hybride + stockage multi-couches... OK" delay={6100} speed={20} /></div>
                <div><TypeLine text="> Angel OS opérationnel." delay={7150} speed={30} /></div>
              </div>
            </div>
            <a href="https://github.com/angelosmegaplus/angel-leclerc/tree/main/angel-os" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"><Github size={17} /> Voir le noyau Angel OS sur GitHub</a>
          </div>
          <div className="min-w-0 rounded-[2rem] border border-white/10 bg-[#0b0d10]/95 p-6 shadow-2xl">
            <div className="flex items-start gap-5"><img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-20 w-20 shrink-0 rounded-2xl object-cover" /><div className="min-w-0"><p className="text-xs uppercase tracking-[.22em] text-white/35">Architecture</p><p className="mt-2 break-words text-2xl font-bold">Angel OS Core</p><p className="mt-1 break-words text-sm leading-6 text-white/45">Linux-ready · hybride · observable · durable</p></div></div>
            <div className="mt-6 space-y-3 font-mono text-xs leading-6 text-white/55">
              <p><span className="text-red-400">workflow</span> → checkpoints, retries, reprise</p>
              <p><span className="text-red-400">memory</span> → contexte et recherche transversale</p>
              <p><span className="text-red-400">events</span> → chronologie centrale</p>
              <p><span className="text-red-400">telemetry</span> → santé, erreurs, latences</p>
              <p><span className="text-red-400">hybrid</span> → externe + moteurs Angel Native</p>
              <p><span className="text-red-400">storage</span> → production + Drive + archive</p>
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/35">Angel OS IA</p><p className="mt-2 text-sm leading-7 text-white/55">La distribution IA ajoute OpenAI, mémoire contextuelle, supervision, automatisations et orchestration multi-moteurs au-dessus du noyau.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/35">angel-leclerc.fr</p><p className="mt-2 text-sm leading-7 text-white/55">L’application web exploite le noyau, le cockpit admin, les données et les services externes tout en restant distincte du Core.</p></div>
        </div>
        <RecentChanges />
      </div>
    </section>
  );
}

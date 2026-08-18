import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Brain, Cpu, Database, Network, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { getAngelSupervisorSnapshot } from "@/lib/angel-supervisor.functions";

export function AngelCoreStatus() {
  const readSupervisor = useServerFn(getAngelSupervisorSnapshot);
  const { data } = useQuery({
    queryKey: ["angel-os", "supervisor"],
    queryFn: () => readSupervisor(),
    staleTime: 30_000,
    retry: 1,
  });

  if (!data) return null;
  const os = data.angelOs;
  const ia = data.angelOsIa;
  const warning = os.health.level !== "ok";
  const counters = os.runtime.telemetry.counters ?? {};
  const success = Object.entries(counters)
    .filter(([key]) => key.startsWith("angel.operation.success"))
    .reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const failures = Object.entries(counters)
    .filter(([key]) => key.startsWith("angel.operation.failure"))
    .reduce((sum, [, value]) => sum + Number(value || 0), 0);

  return (
    <section className={`rounded-[1.7rem] border p-4 sm:p-5 ${warning ? "border-amber-400/25 bg-amber-500/[.06]" : "border-emerald-400/20 bg-emerald-500/[.045]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl border ${warning ? "border-amber-400/25 bg-amber-500/10 text-amber-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"}`}>
            {warning ? <TriangleAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">Angel OS Core · superviseur système</p>
            <p className="mt-1 font-semibold text-white">{warning ? "Attention système requise" : "Noyau opérationnel"}</p>
            {os.health.warnings.length ? <p className="mt-1 text-xs text-amber-100/75">{os.health.warnings.join(" · ")}</p> : <p className="mt-1 text-xs text-white/40">Le noyau fonctionne indépendamment d’Angel OS IA.</p>}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[.12em] ${warning ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/12 text-emerald-200"}`}>{os.health.level}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat icon={Brain} label="Mémoire" value={String(os.runtime.memory.total)} />
        <Stat icon={Activity} label="Événements" value={String(os.runtime.recentEvents.length)} />
        <Stat icon={Cpu} label="Succès" value={String(success)} />
        <Stat icon={Database} label="Échecs" value={String(failures)} />
        <Stat icon={Network} label="Nœuds" value={String(os.runtime.nodes.length)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-red-300" />
          <div>
            <p className="text-xs font-semibold text-white">Angel OS IA</p>
            <p className="text-[11px] text-white/45">Distribution IA distincte du noyau</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[.12em] ${ia.health.level === "ok" ? "bg-emerald-500/12 text-emerald-200" : ia.health.level === "critical" ? "bg-red-500/15 text-red-200" : "bg-amber-500/15 text-amber-200"}`}>{ia.health.level}</span>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-2 text-white/40"><Icon className="h-3.5 w-3.5" /><span className="text-[10px] uppercase tracking-[.12em]">{label}</span></div>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

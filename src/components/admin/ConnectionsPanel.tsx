import { Bot, CheckCircle2, Database, ShieldCheck } from "lucide-react";
import { AdminCard } from "./AdminShell";

const SERVICES = [
  {
    title: "Mails",
    detail: "Lecture, tri, bilans et préparation des réponses sont pilotés depuis ChatGPT et les automatisations prévues. Angel OS affiche uniquement les résultats réellement synchronisés.",
  },
  {
    title: "Agenda",
    detail: "Les rendez-vous et synthèses peuvent être récupérés et analysés depuis ChatGPT. L’interface Agenda reste l’endroit où Angel OS présente les informations disponibles.",
  },
  {
    title: "Services externes",
    detail: "Google, Microsoft et les autres fournisseurs ne demandent plus de configuration dans l’espace administrateur. Les traitements passent par les outils disponibles dans ChatGPT quand ils sont accessibles.",
  },
];

export function ConnectionsPanel() {
  return (
    <div className="space-y-4">
      <AdminCard className="border-red-500/15 bg-gradient-to-br from-red-500/[.06] via-[#090b0d] to-[#090b0d]">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><Bot className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-white sm:text-lg">Services pilotés par ChatGPT</p>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              Aucune connexion Google, Microsoft ou autre n’est à configurer ici. Les automatisations et outils ChatGPT gèrent les opérations externes prévues, puis Angel OS affiche uniquement les données réellement disponibles.
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Fonctionnement" description="Simple : aucun faux statut connecté, aucun secret affiché, uniquement l’état réellement observé.">
        <div className="grid gap-2 sm:grid-cols-3">
          {SERVICES.map((service) => (
            <div key={service.title} className="rounded-xl border border-white/10 bg-white/[.025] p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-sm font-semibold text-white">{service.title}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/50">{service.detail}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          <div>
            <p className="text-sm font-semibold text-white">Règle de fiabilité</p>
            <p className="mt-1 text-xs leading-5 text-white/50">
              Angel OS ne prétend jamais qu’un compte ou fournisseur est connecté. Si aucune donnée récente n’a été obtenue, le module concerné l’indique comme indisponible ou en attente de synchronisation.
            </p>
          </div>
        </div>
      </AdminCard>

      <div className="flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[.14em] text-white/40">
        <Database className="h-3.5 w-3.5 text-red-300" /> données externes → ChatGPT / automatisations → Angel OS
      </div>
    </div>
  );
}

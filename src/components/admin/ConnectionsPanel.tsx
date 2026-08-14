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
    <div className="space-y-5 pb-24 sm:pb-28">
      <AdminCard className="border-l-4 border-l-[#0078d7]">
        <div className="flex gap-3">
          <Bot className="mt-0.5 h-5 w-5 shrink-0 text-[#1684df]" />
          <div>
            <p className="text-lg font-light text-white">Services pilotés par ChatGPT</p>
            <p className="mt-1 text-sm font-light leading-relaxed text-white/55">
              Aucune connexion Google, Microsoft ou autre n’est à configurer ici. Les automatisations et les outils ChatGPT gèrent les opérations externes prévues, puis Angel OS affiche les données réellement disponibles.
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Fonctionnement" description="Une interface simple : pas de jetons, pas de boutons OAuth, pas de faux statut connecté.">
        <div className="grid gap-2 sm:grid-cols-3">
          {SERVICES.map((service) => (
            <div key={service.title} className="border border-white/10 bg-black/35 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-sm font-semibold text-white">{service.title}</p>
              </div>
              <p className="mt-2 text-xs font-light leading-5 text-white/50">{service.detail}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white/55" />
          <div>
            <p className="text-sm font-semibold text-white">Règle de fiabilité</p>
            <p className="mt-1 text-xs leading-5 text-white/45">
              Angel OS ne prétend jamais qu’un compte ou un fournisseur est connecté. Si ChatGPT ou une automatisation n’a pas fourni de donnée récente, le module concerné doit simplement l’indiquer comme indisponible ou en attente de synchronisation.
            </p>
          </div>
        </div>
      </AdminCard>

      <div className="flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[.16em] text-white/30">
        <Database className="h-3.5 w-3.5" /> données externes → ChatGPT/automatisations → Angel OS
      </div>
    </div>
  );
}

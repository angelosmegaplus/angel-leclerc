import { siteFlow } from "./siteFlowData";

const codeLines = [
  "browser -> react.ui -> tanstack.router -> page",
  "page -> angelOS.web -> core.eventBus -> module.registry",
  "server -> supabase -> external.api -> response",
  "github.main -> vercel.build -> cdn -> angel-leclerc.fr",
];

function FlowTerminal() {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-black p-4">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/30">
        <span className="h-2 w-2 rounded-full bg-red-500" /> flux système
      </div>
      <svg viewBox="0 0 900 112" role="img" aria-label="Flux technique animé du site" className="h-28 w-full overflow-hidden font-mono">
        {codeLines.map((line, index) => (
          <text key={line} x="40" y={22 + index * 27} fill="rgba(255,255,255,.48)" fontSize="13">
            <tspan fill="#f87171">{String(index + 1).padStart(2, "0")}  </tspan>
            {line}      {line}
            <animate attributeName="x" from="80" to="-260" dur={`${20 + index * 4}s`} repeatCount="indefinite" />
          </text>
        ))}
      </svg>
    </div>
  );
}

export function SiteFlow() {
  return (
    <section id="site" className="border-y border-white/10 bg-white/[.02] px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Exemple réel</p>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Comment fonctionne angel-leclerc.fr, de A à Z.</h2>
          <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">Le site sert d'exemple concret d'utilisation d'Angel OS. Chaque outil garde son rôle : interface, noyau, données, services externes et déploiement restent séparés.</p>
        </div>
        <FlowTerminal />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {siteFlow.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0b0d10] p-6 transition-colors duration-200 hover:border-red-500/25">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{item.text}</p>
              <p className="mt-4 border-t border-white/10 pt-3 font-mono text-[11px] leading-relaxed text-red-300/70">{item.tech}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#090a0c] p-6">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-red-400">En clair</p>
          <p className="mt-3 text-sm leading-relaxed text-white/55">React et TanStack affichent le site. Angel OS fournit le socle commun. Angel OS IA ajoute les outils personnels et l'automatisation. Supabase conserve les données. Les fonctions serveur parlent aux services externes. GitHub garde le code et Vercel construit puis publie le site. Une autre personne peut reprendre Angel OS et remplacer ces briques par ses propres choix.</p>
        </div>
      </div>
    </section>
  );
}

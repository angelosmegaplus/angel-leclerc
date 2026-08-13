import { Logo } from "@/components/Logo";
import { siteFlow } from "./siteFlowData";

const orderedFlow = [siteFlow[3], siteFlow[4], siteFlow[1], siteFlow[2], siteFlow[6], siteFlow[5], siteFlow[7], siteFlow[8], siteFlow[9], siteFlow[0]];

export function SiteFlow() {
  return (
    <section id="site" className="border-y border-white/10 bg-white/[.02] px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Exemple concret</p>
        <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Du noyau Angel OS jusqu'à angel-leclerc.fr.</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/55 sm:text-lg">Une chronologie simple : le Core démarre, les couches s'ajoutent, les services se branchent, le code est publié et le site arrive enfin dans le navigateur.</p>

        <div className="mt-12">
          {orderedFlow.map((item, index) => (
            <div key={`${item.step}-${index}`}>
              <article className="relative ml-7 rounded-2xl border border-white/10 bg-[#0b0d10] p-5 sm:p-6">
                <span className="absolute -left-[2.15rem] top-7 h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-red-500/10" />
                <div className="flex items-start gap-4">
                  {"logo" in item && item.logo ? (
                    <img src={item.logo} alt={item.alt} className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <Logo
                      domain={"domain" in item ? item.domain : "angel-leclerc.fr"}
                      alt={item.alt}
                      size={48}
                      link={false}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[.18em] text-red-400">étape {String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{item.text}</p>
                    <p className="mt-4 font-mono text-[11px] text-red-300/70">{item.tech}</p>
                  </div>
                </div>
              </article>

              {index < orderedFlow.length - 1 && (
                <div className="ml-7 h-12 overflow-hidden border-l border-red-500/25 pl-5">
                  <svg viewBox="0 0 900 48" aria-hidden className="h-12 w-full font-mono">
                    <text x="70" y="29" fill="rgba(248,113,113,.6)" fontSize="12">
                      {item.code}      {item.code}
                      <animate attributeName="x" from="70" to="-320" dur="22s" repeatCount="indefinite" />
                    </text>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-4 rounded-2xl border border-red-500/15 bg-red-500/[.05] p-6">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
          <p className="text-sm leading-relaxed text-white/60"><strong className="text-white">Le principe :</strong> Angel OS ne remplace pas React, Supabase, GitHub, Vercel ou ChatGPT. Il sert de noyau commun entre ces couches. Quelqu'un d'autre peut reprendre le Core et remplacer chaque outil par ses propres choix.</p>
        </div>
      </div>
    </section>
  );
}

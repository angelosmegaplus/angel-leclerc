import { siteFlow } from "./siteFlowData";

export function SiteFlow() {
  return (
    <section id="site" className="border-y border-white/10 bg-white/[.02] px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Exemple réel</p>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">angel-leclerc.fr, de A à Z.</h2>
          <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">Chaque couche garde son rôle. Le Core peut ainsi être repris ailleurs sans emporter le blog, la boutique ou mon administration personnelle.</p>
        </div>
        <div className="mx-auto mt-12 max-w-4xl">
          {siteFlow.map(([title, text], i) => (
            <div key={title}>
              <article className="rounded-3xl border border-white/10 bg-[#0b0d10] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-red-500/25">
                <p className="font-mono text-[10px] uppercase tracking-wider text-red-400">layer {String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{text}</p>
              </article>
              {i < siteFlow.length - 1 && <div className="mx-auto hidden h-8 w-px bg-white/10 md:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

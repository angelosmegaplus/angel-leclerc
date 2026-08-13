import { Logo } from "@/components/Logo";

const steps = [
  { n: "01", title: "Idée / besoin", text: "Une évolution est décrite en langage naturel.", logo: "/angel-os/logo.png", code: "idea -> brief" },
  { n: "02", title: "ChatGPT / Codex", text: "L'IA aide à analyser, écrire ou modifier le code et à vérifier la cohérence.", domain: "chatgpt.com", code: "brief -> code.change" },
  { n: "03", title: "GitHub", text: "Le changement est versionné dans une branche ou un commit avant publication.", domain: "github.com", code: "code.change -> git.commit" },
  { n: "04", title: "Vercel", text: "Le projet est construit puis déployé si le build est valide.", domain: "vercel.com", code: "github -> build -> deploy" },
  { n: "05", title: "Site en ligne", text: "La nouvelle version arrive sur angel-leclerc.fr sans reconstruire tout le projet.", logo: "/angel-os/logo.png", code: "deploy -> production" },
] as const;

export function DevFlow() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Comment le site évolue</p>
        <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">De l'idée au code, puis à la mise en ligne.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {steps.map((s, i) => (
            <article key={s.n} className="rounded-2xl border border-white/10 bg-[#0b0d10] p-5">
              {"logo" in s ? <img src={s.logo} alt="" className="h-10 w-10 rounded-lg object-contain" loading="lazy" /> : <Logo domain={s.domain} alt={s.title} size={40} link={false} />}
              <p className="mt-4 font-mono text-[10px] text-red-400">{s.n}</p>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{s.text}</p>
              <svg viewBox="0 0 260 20" className="mt-4 h-5 w-full overflow-hidden" aria-hidden>
                <text x="20" y="14" fill="rgba(248,113,113,.7)" fontSize="10">{s.code}   {s.code}<animate attributeName="x" from="20" to="-140" dur={`${18 + i * 2}s`} repeatCount="indefinite" /></text>
              </svg>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  ["01", "Idée / besoin", "Une évolution est décrite en langage naturel.", "/angel-os/logo.png", "idea -> brief"],
  ["02", "ChatGPT / Codex", "L'IA aide à analyser, écrire ou modifier le code et à vérifier la cohérence.", "/logos/chatgpt.com.svg", "brief -> code.change"],
  ["03", "GitHub", "Le changement est versionné dans une branche ou un commit avant publication.", "/logos/github.com.svg", "code.change -> git.commit"],
  ["04", "Vercel", "Le projet est construit puis déployé si le build est valide.", "/logos/vercel.com.svg", "github -> build -> deploy"],
  ["05", "Site en ligne", "La nouvelle version arrive sur angel-leclerc.fr sans reconstruire tout le projet.", "/angel-os/logo.png", "deploy -> production"],
] as const;

export function DevFlow() {
  return <section className="px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-red-400">Comment le site évolue</p><h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">De l'idée au code, puis à la mise en ligne.</h2><div className="mt-10 grid gap-4 md:grid-cols-5">{steps.map(([n,title,text,logo,code],i)=><article key={n} className="rounded-2xl border border-white/10 bg-[#0b0d10] p-5"><img src={logo} alt="" className="h-10 w-10 rounded-lg object-contain" loading="lazy"/><p className="mt-4 font-mono text-[10px] text-red-400">{n}</p><h3 className="mt-1 font-semibold">{title}</h3><p className="mt-2 text-xs leading-relaxed text-white/50">{text}</p><div className="mt-4 overflow-hidden font-mono text-[10px] text-red-300/60"><svg viewBox="0 0 260 20" className="h-5 w-full" aria-hidden><text x="20" y="14" fill="rgba(248,113,113,.7)" fontSize="10">{code}   {code}<animate attributeName="x" from="20" to="-140" dur={`${18+i*2}s`} repeatCount="indefinite"/></text></svg></div></article>)}</div></div></section>;
}

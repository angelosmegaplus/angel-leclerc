import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Ban,
  Bot,
  Braces,
  Gauge,
  Globe2,
  LockKeyhole,
  Network,
  Radar,
  RefreshCcw,
  ShieldCheck,
  ShieldHalf,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/angel-guard-os")({
  head: () => ({
    meta: [
      { title: "Angel Guard — sécurité et supervision de Flamme OS" },
      {
        name: "description",
        content: "Angel Guard est la couche de sécurité et de supervision de Flamme OS : classification des signaux, politiques WAF, limitation, anti-bot, contrôle d’accès, incidents et récupération.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Angel Guard — sécurité et supervision" },
      {
        property: "og:description",
        content: "Une couche de sécurité inspirée des architectures WAF modernes, intégrée à Flamme OS.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/angel-guard-os" }],
  }),
  component: AngelGuardPage,
});

const protections = [
  {
    icon: ShieldHalf,
    title: "Détection Web",
    text: "Classe les signaux associés aux injections SQL, XSS, RCE, SSRF, XXE, traversées de chemin et autres attaques applicatives.",
    status: "Moteur actif",
  },
  {
    icon: Gauge,
    title: "Rate limiting",
    text: "Peut décider de ralentir un client en cas de flood HTTP, brute force, rafale de requêtes ou comportement abusif.",
    status: "Décision active",
  },
  {
    icon: Bot,
    title: "Anti-bot",
    text: "Identifie les signaux issus de bots ou automatisations suspectes et peut demander un challenge lorsqu’un exécuteur compatible existe.",
    status: "Prêt à connecter",
  },
  {
    icon: Ban,
    title: "Contrôle d’accès",
    text: "Prend en compte listes de blocage, IP hostiles, ACL et chemins sensibles pour produire une décision cohérente.",
    status: "Moteur actif",
  },
  {
    icon: RefreshCcw,
    title: "Récupération",
    text: "Surveille les pannes de fournisseurs, API et déploiements afin de demander retry, fallback ou rollback selon le signal.",
    status: "Automatisable",
  },
  {
    icon: Activity,
    title: "Journal d’incidents",
    text: "Conserve signaux, décisions et exécutions récentes pour expliquer ce qui s’est passé et pourquoi une action a été choisie.",
    status: "Traçabilité",
  },
] as const;

const attackFamilies = [
  "SQL injection",
  "XSS",
  "RCE / command injection",
  "SSRF / XXE",
  "Path traversal",
  "Brute force",
  "HTTP flood",
  "Bots suspects",
  "ACL / IP hostiles",
];

const profiles = [
  ["Observation", "Journalise et classe les signaux sans dépendre d’un blocage automatique."],
  ["Équilibré", "Bloque les attaques évidentes, limite les abus et conserve une marge pour éviter les faux positifs."],
  ["Strict", "Renforce les décisions pour les zones sensibles ou les périodes où la surface d’attaque doit être réduite."],
] as const;

function AngelGuardPage() {
  return (
    <main className="overflow-hidden bg-[#07090d] text-white">
      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_12%,rgba(249,115,22,.22),transparent_34%),radial-gradient(circle_at_25%_85%,rgba(59,130,246,.10),transparent_35%),#07090d]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.16] [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="container-tight py-16 md:py-24">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[.16em] text-orange-300">
              <LockKeyhole className="h-4 w-4" /> Flamme OS · Security layer
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Policy engine active
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-end">
            <div>
              <h1 className="font-display text-5xl font-black tracking-[-.055em] sm:text-6xl md:text-7xl">Angel Guard</h1>
              <p className="mt-6 max-w-3xl text-xl font-semibold leading-snug text-white/90 md:text-3xl">
                Détecter, décider, limiter, bloquer et récupérer.
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">
                Angel Guard est la couche de sécurité et de supervision de <strong className="text-white">Flamme OS</strong>. Son moteur transforme les signaux techniques en décisions explicables : observer, challenger, limiter, isoler, récupérer, restaurer ou bloquer.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600">
                  <Link to="/experiences">Voir Flamme OS <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <a href="https://github.com/angelosmegaplus/angel-leclerc" target="_blank" rel="noreferrer">Voir le code</a>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[.045] p-5 shadow-2xl backdrop-blur md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Protection profile</p>
                  <p className="mt-1 text-2xl font-black">Équilibré</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-orange-400" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["WAF signals", "ON"],
                  ["Rate limit", "ON"],
                  ["Bot signals", "ON"],
                  ["Recovery", "ON"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/45">{label}</p>
                    <p className="mt-1 font-mono text-sm font-bold text-emerald-300">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-400">Protection engine</p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-[-.04em] md:text-5xl">Une vraie logique de défense, pas seulement un écran de statut.</h2>
          <p className="mt-5 leading-7 text-white/55">Le moteur associe chaque signal à une famille, applique les politiques par priorité et conserve la décision ainsi que le résultat de son exécution.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {protections.map(({ icon: Icon, title, text, status }) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[.035] p-6 transition hover:border-orange-400/25 hover:bg-white/[.055]">
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-orange-400/20 bg-orange-400/10 text-orange-300"><Icon className="h-5 w-5" /></span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white/45">{status}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/50">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025]">
        <div className="container-tight py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-400">WAF intelligence</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-[-.04em] md:text-4xl">Les familles d’attaques sont traitées comme des signaux structurés.</h2>
              <p className="mt-5 leading-7 text-white/55">Cette couche s’inspire des principes des WAF modernes : classification, règles, limitation, contrôle d’accès et réponse graduée.</p>
            </div>
            <div className="flex flex-wrap content-start gap-2.5">
              {attackFamilies.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm font-semibold text-white/75">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-tight py-14 md:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6 md:p-8">
            <div className="flex items-center gap-3"><Network className="h-5 w-5 text-blue-300" /><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-300">Architecture</p></div>
            <h2 className="mt-4 text-2xl font-black">Signal → Policy → Decision → Executor</h2>
            <div className="mt-6 space-y-3">
              {[
                ["1", "Signal", "auth, WAF, bot, trafic, fournisseur, déploiement…"],
                ["2", "Policy", "une règle prioritaire classe le risque"],
                ["3", "Decision", "observe, challenge, rate-limit, recover, rollback ou block"],
                ["4", "Executor", "l’action n’est lancée que si un exécuteur vérifié est disponible"],
              ].map(([number, title, text]) => (
                <div key={number} className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-xs font-bold">{number}</span>
                  <div><p className="font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-white/45">{text}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6 md:p-8">
            <div className="flex items-center gap-3"><Radar className="h-5 w-5 text-orange-300" /><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">Profils</p></div>
            <h2 className="mt-4 text-2xl font-black">Protection adaptable</h2>
            <div className="mt-6 space-y-3">
              {profiles.map(([title, text], index) => (
                <div key={title} className={`rounded-2xl border p-4 ${index === 1 ? "border-orange-400/30 bg-orange-400/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-center justify-between gap-3"><p className="font-bold">{title}</p>{index === 1 ? <span className="text-[10px] font-bold uppercase tracking-[.12em] text-orange-300">Par défaut</span> : null}</div>
                  <p className="mt-2 text-sm leading-6 text-white/45">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/30">
        <div className="container-tight py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_.9fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3"><Siren className="h-5 w-5 text-amber-300" /><p className="text-xs font-bold uppercase tracking-[.16em] text-amber-300">Important</p></div>
              <h2 className="mt-4 font-display text-3xl font-black tracking-[-.04em]">Angel Guard ne prétend pas être un reverse-proxy quand il n’y en a pas.</h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">
                Le moteur sait classifier et décider. Pour bloquer réellement du trafic HTTP avant qu’il atteigne l’application, appliquer un challenge anti-bot ou imposer une limitation réseau, il faut connecter Angel Guard à une couche d’exécution compatible — par exemple un WAF ou reverse-proxy déployé devant le site. Si aucun exécuteur n’est disponible, Angel Guard marque l’action comme indisponible plutôt que de simuler une protection.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-white/35">Références techniques</p>
              <div className="mt-4 space-y-3">
                <a href="https://github.com/bunkerity/bunkerweb" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-orange-400/25">
                  <div><p className="font-bold">BunkerWeb</p><p className="mt-1 text-xs text-white/45">WAF, secure-by-default, reverse proxy, règles et bannissements</p></div><Globe2 className="h-4 w-4 text-white/40" />
                </a>
                <a href="https://github.com/chaitin/SafeLine" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-orange-400/25">
                  <div><p className="font-bold">SafeLine</p><p className="mt-1 text-xs text-white/45">Détection d’attaques, rate limiting, anti-bot et contrôle d’accès</p></div><Braces className="h-4 w-4 text-white/40" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

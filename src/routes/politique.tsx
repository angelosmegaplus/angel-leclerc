import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeEuro,
  Building2,
  ChevronRight,
  Factory,
  Flag,
  Globe2,
  GraduationCap,
  Handshake,
  Home,
  Landmark,
  Languages,
  Map,
  Radio,
  Scale,
  Shield,
  TrainFront,
  Users,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/politique")({
  head: () => ({
    meta: [
      { title: "Les Régionalistes Français — Projet politique et fédéralisme français" },
      {
        name: "description",
        content:
          "Dossier de propositions sur le régionalisme, le fédéralisme français, la souveraineté nationale, la démocratie, l'économie, le social et les services publics.",
      },
      { property: "og:title", content: "Les Régionalistes Français" },
      {
        property: "og:description",
        content:
          "Une France unie, des territoires capables de décider : faits, analyses et propositions pour un modèle français plus régionalisé.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.angel-leclerc.fr/politique" },
    ],
    links: [{ rel: "canonical", href: "https://www.angel-leclerc.fr/politique" }],
  }),
  component: PolitiquePage,
});

type Pillar = {
  icon: LucideIcon;
  title: string;
  text: string;
  points: string[];
};

const federalPillars: Pillar[] = [
  {
    icon: Landmark,
    title: "Un État national commun",
    text: "La France conserve ses institutions nationales, sa citoyenneté, sa défense, sa diplomatie et les grandes garanties communes.",
    points: ["Unité nationale", "Citoyenneté française", "Compétences stratégiques communes"],
  },
  {
    icon: Map,
    title: "Des régions politiques fortes",
    text: "Les territoires disposent de compétences garanties par la Constitution et ne dépendent plus d'une simple délégation révocable de l'État central.",
    points: ["Pouvoir législatif régional", "Budgets propres", "Institutions territoriales"],
  },
  {
    icon: Scale,
    title: "Deux niveaux de lois",
    text: "La loi nationale s'applique dans les matières communes ; la loi régionale s'applique dans les domaines attribués aux territoires.",
    points: ["Compétences clairement réparties", "Contrôle constitutionnel", "Droit adapté aux réalités locales"],
  },
  {
    icon: Building2,
    title: "Un Sénat des territoires",
    text: "Le Sénat représente les Français à travers leurs territoires et participe à l'équilibre entre population, régions et intérêt national.",
    points: ["Représentation territoriale", "Équilibre avec l'Assemblée", "Protection du pacte fédéral"],
  },
];

const policyPillars: Pillar[] = [
  {
    icon: Handshake,
    title: "Protection sociale et dignité",
    text: "La solidarité doit garantir qu'aucune personne ne soit abandonnée, tout en liant les aides durables à un accompagnement réel vers l'autonomie, la formation ou l'emploi lorsque cela est possible.",
    points: ["Hébergement et accompagnement", "Services sociaux accessibles", "Retour vers l'autonomie"],
  },
  {
    icon: Factory,
    title: "Produire davantage en France",
    text: "La politique économique privilégie la réindustrialisation, les chaînes de production nationales et la réduction des dépendances stratégiques.",
    points: ["Relocalisation", "Industrie", "Protection des secteurs stratégiques"],
  },
  {
    icon: BadgeEuro,
    title: "Économie sociale et responsabilité",
    text: "L'entreprise, le travail et l'investissement restent au cœur de l'économie, avec une intervention publique forte lorsque l'intérêt national, l'emploi ou les services essentiels sont en jeu.",
    points: ["Travail mieux reconnu", "Investissement productif", "État stratège"],
  },
  {
    icon: Vote,
    title: "Démocratie directe",
    text: "Des référendums d'initiative citoyenne peuvent compléter la démocratie représentative aux niveaux national et régional, avec des règles de déclenchement connues à l'avance.",
    points: ["RIC national", "RIC régional et local", "Contrôle citoyen"],
  },
  {
    icon: Users,
    title: "Immigration organisée et intégration exigeante",
    text: "L'accueil légal s'accompagne d'un parcours structuré : apprentissage du français, connaissance des règles communes, orientation professionnelle et répartition selon les capacités d'accueil et les besoins réels.",
    points: ["Langue française", "Formation", "Intégration par l'activité"],
  },
  {
    icon: Shield,
    title: "Sécurité et autorité publique",
    text: "Les moyens de renseignement, de prévention et de police sont renforcés, avec une coordination entre forces nationales et territoriales et un contrôle juridictionnel effectif.",
    points: ["Renseignement", "Police de proximité", "Coordination nationale-régionale"],
  },
  {
    icon: Scale,
    title: "Justice nationale et justice territoriale",
    text: "Le modèle fédéral peut répartir certaines compétences judiciaires entre le niveau national et les régions. Les droits fondamentaux et les garanties de procédure restent protégés par la Constitution.",
    points: ["Juridictions territoriales", "Garanties constitutionnelles", "Arbitrage national"],
  },
  {
    icon: Zap,
    title: "Énergie et écologie de production",
    text: "La décarbonation repose sur une énergie abondante et pilotable, notamment nucléaire, associée aux renouvelables pertinents, aux transports collectifs et à la modernisation industrielle.",
    points: ["Nucléaire", "Décarbonation", "Réalisme industriel"],
  },
  {
    icon: Home,
    title: "Logement et aménagement",
    text: "Les régions et collectivités disposent de davantage d'outils pour construire, rénover, maîtriser le foncier et adapter les règles aux zones rurales, touristiques ou tendues.",
    points: ["Logement accessible", "Foncier", "Adaptation territoriale"],
  },
  {
    icon: TrainFront,
    title: "Services publics au plus près",
    text: "Santé, mobilité, accès administratif et services essentiels doivent être organisés en fonction des bassins de vie plutôt qu'à partir d'un modèle uniforme décidé à Paris.",
    points: ["Santé", "Transports", "Présence publique"],
  },
  {
    icon: GraduationCap,
    title: "Éducation commune, ancrage local",
    text: "Un socle national commun peut coexister avec des programmes régionaux portant sur l'histoire, la géographie, l'économie et les réalités culturelles du territoire.",
    points: ["Socle national", "Histoire régionale", "Formation adaptée"],
  },
  {
    icon: Languages,
    title: "Langues et cultures de France",
    text: "Le français reste la langue commune nationale. Les régions peuvent reconnaître, enseigner et utiliser leurs langues historiques dans les institutions et services territoriaux selon la volonté locale.",
    points: ["Français commun", "Langues régionales", "Transmission culturelle"],
  },
  {
    icon: Radio,
    title: "Médias moins concentrés à Paris",
    text: "Le pluralisme passe aussi par des rédactions, productions culturelles et médias capables d'exister durablement dans les territoires.",
    points: ["Médias régionaux", "Création locale", "Pluralisme"],
  },
  {
    icon: Globe2,
    title: "Souveraineté française",
    text: "Le fédéralisme intérieur ne suppose aucun transfert supplémentaire de souveraineté à l'Union européenne. La relation de la France avec l'UE relève d'un choix national distinct.",
    points: ["Souveraineté nationale", "Coopération entre nations", "Aucun fédéralisme européen automatique"],
  },
];

const stats = [
  ["71 %", "favorables à une France plus fédérale et à un fort renforcement du pouvoir régional"],
  ["73 %", "favorables à la possibilité d'adapter des lois nationales aux réalités locales"],
  ["68 %", "favorables à une nouvelle réforme tenant davantage compte des réalités historiques et culturelles"],
  ["84 %", "favorables à l'enseignement de l'histoire régionale à l'école"],
];

const history = [
  {
    date: "XIXe siècle",
    title: "La région comme réponse au centralisme",
    text: "Le régionalisme français se développe autour des langues, des cultures, de la décentralisation et de la recherche d'un équilibre entre unité nationale et libertés locales.",
  },
  {
    date: "1900",
    title: "Fédération régionaliste française",
    text: "Jean Charles-Brun rassemble des courants très différents autour d'une critique commune de l'hypercentralisation et d'un projet donnant davantage de réalité politique aux régions.",
  },
  {
    date: "Années 1960–1970",
    title: "Un nouveau régionalisme",
    text: "Les questions économiques, sociales, linguistiques et démocratiques ramènent la revendication territoriale dans le débat, notamment en Bretagne, Corse, Alsace, Occitanie et au Pays basque.",
  },
  {
    date: "1982",
    title: "La décentralisation change l'échelle",
    text: "Les régions deviennent progressivement de véritables collectivités politiques, mais restent dépourvues du pouvoir législatif général des entités fédérées allemandes, suisses ou américaines.",
  },
  {
    date: "2015–2025",
    title: "Le découpage et l'autonomie reviennent au centre du débat",
    text: "Le redécoupage régional, le débat corse et de nouvelles enquêtes d'opinion ravivent la question d'une organisation territoriale plus politique et plus proche des réalités historiques.",
  },
];

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-red-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{text}</p> : null}
    </div>
  );
}

function PillarCard({ pillar }: { pillar: Pillar }) {
  const Icon = pillar.icon;
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-950 text-white">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-5 text-xl font-extrabold text-slate-950">{pillar.title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{pillar.text}</p>
      <ul className="mt-5 space-y-2 text-sm font-semibold text-slate-700">
        {pillar.points.map((point) => (
          <li key={point} className="flex gap-2">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PolitiquePage() {
  return (
    <div className="min-h-screen bg-[#f7f4ed] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7f4ed]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3 font-black tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-950 text-white">
              <Flag className="h-4 w-4" aria-hidden />
            </span>
            <span>Les Régionalistes Français</span>
          </a>
          <nav className="hidden items-center gap-5 text-sm font-bold text-slate-600 md:flex" aria-label="Navigation politique">
            <a className="hover:text-blue-950" href="#federalisme">Fédéralisme</a>
            <a className="hover:text-blue-950" href="#projet">Projet</a>
            <a className="hover:text-blue-950" href="#histoire">Histoire</a>
            <a className="hover:text-blue-950" href="#sources">Sources</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-slate-200">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage:
                "linear-gradient(#172554 1px, transparent 1px), linear-gradient(90deg, #172554 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.25fr_.75fr] lg:px-8 lg:py-28">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-red-700">Régionalisme • souveraineté • démocratie</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-blue-950 sm:text-6xl lg:text-7xl">
                Une France unie. Des territoires libres de décider.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
                Le régionalisme peut aller plus loin qu'une simple décentralisation administrative : une organisation fédérale française peut donner de véritables pouvoirs aux territoires tout en conservant une nation, une citoyenneté, une solidarité et une souveraineté communes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#federalisme" className="rounded-full bg-blue-950 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-blue-900">
                  Comprendre le modèle
                </a>
                <a href="#projet" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-900 transition hover:border-blue-950">
                  Lire les propositions
                </a>
              </div>
            </div>

            <aside className="self-end rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Ligne éditoriale</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Un dossier de propositions, pas une institution publique</h2>
              <p className="mt-4 leading-7 text-slate-600">
                Le site adopte une rédaction impersonnelle et documentée. Les données vérifiables, l'analyse historique et les choix politiques sont distingués afin de ne pas présenter une proposition comme un fait établi.
              </p>
            </aside>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Opinion publique"
              title="Le débat territorial dépasse les seuls mouvements régionalistes"
              text="Une enquête IFOP publiée en 2025 pour Régions et Peuples Solidaires fait apparaître un soutien important à plusieurs formes de renforcement régional. Ces chiffres décrivent une opinion à un moment donné ; ils ne constituent pas à eux seuls un mandat institutionnel."
            />
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([value, label]) => (
                <article key={label} className="rounded-3xl border border-slate-200 bg-[#f7f4ed] p-6">
                  <p className="text-4xl font-black tracking-tight text-blue-950">{value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{label}</p>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Source indiquée par l'étude : IFOP pour Régions et Peuples Solidaires, présentation du 25 août 2025. Les formulations doivent être lues avec la méthodologie et les questionnaires complets de l'enquête.
            </p>
          </div>
        </section>

        <section id="federalisme" className="scroll-mt-24 border-b border-slate-200 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Organisation de la France"
              title="Fédéraliser à l'intérieur sans dissoudre la nation"
              text="Le principe proposé est simple : ce qui exige l'unité reste national ; ce qui gagne à être décidé au plus près des habitants devient régional. La Constitution fixe les compétences de chacun."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {federalPillars.map((pillar) => <PillarCard key={pillar.title} pillar={pillar} />)}
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article className="rounded-3xl bg-blue-950 p-7 text-white sm:p-9">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Compétences nationales</p>
                <h3 className="mt-3 text-2xl font-black">Ce qui reste commun à toute la France</h3>
                <ul className="mt-6 grid gap-3 text-sm leading-6 text-blue-50 sm:grid-cols-2">
                  {["Défense et armées", "Diplomatie", "Nationalité et frontières", "Grandes infrastructures stratégiques", "Solidarité entre territoires", "Garanties constitutionnelles", "Politique macroéconomique nationale", "Grands intérêts stratégiques"].map((item) => (
                    <li key={item} className="rounded-2xl bg-white/10 px-4 py-3">{item}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Compétences régionales</p>
                <h3 className="mt-3 text-2xl font-black">Ce qui peut varier selon les territoires</h3>
                <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                  {["Transports", "Logement et foncier", "Culture et langues", "Développement économique", "Formation", "Aménagement", "Une partie de la fiscalité", "Certaines règles de droit et d'organisation publique"].map((item) => (
                    <li key={item} className="rounded-2xl bg-[#f7f4ed] px-4 py-3">{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="projet" className="scroll-mt-24 border-b border-slate-200 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Projet politique"
              title="Le régionalisme n'est qu'une partie du projet"
              text="L'organisation territoriale s'inscrit dans un ensemble plus large : politique sociale, souveraineté, industrie, démocratie, services publics, sécurité, énergie, logement et transmission culturelle."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {policyPillars.map((pillar) => <PillarCard key={pillar.title} pillar={pillar} />)}
            </div>

            <article className="mt-10 rounded-3xl border border-amber-300 bg-amber-50 p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">Point juridique important</p>
              <h3 className="mt-3 text-xl font-black text-slate-950">L'autonomie régionale ne permet pas d'ignorer la Constitution</h3>
              <p className="mt-3 max-w-4xl leading-7 text-slate-700">
                Dans le droit français actuel, une région ne peut pas rétablir seule une sanction interdite nationalement, comme la peine de mort. Un modèle fédéral donnant aux territoires une compétence pénale plus large devrait définir précisément les limites constitutionnelles ; toute remise en cause d'une interdiction constitutionnelle ou d'un engagement international nécessiterait d'abord une modification du cadre national correspondant.
              </p>
            </article>
          </div>
        </section>

        <section className="border-b border-slate-200 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Souveraineté"
              title="Moins de centralisme français ne signifie pas davantage de fédéralisme européen"
              text="La répartition du pouvoir entre la France et ses régions est une question intérieure. Elle ne préjuge pas de la relation entre la France et l'Union européenne."
            />
            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              <article className="rounded-3xl border border-slate-200 bg-white p-6">
                <Flag className="h-7 w-7 text-blue-950" aria-hidden />
                <h3 className="mt-4 text-lg font-black">Souveraineté nationale</h3>
                <p className="mt-2 leading-7 text-slate-600">La défense des pouvoirs régionaux n'implique pas de transférer les compétences retirées à Paris vers Bruxelles.</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-6">
                <Globe2 className="h-7 w-7 text-blue-950" aria-hidden />
                <h3 className="mt-4 text-lg font-black">Coopération internationale</h3>
                <p className="mt-2 leading-7 text-slate-600">Les régions peuvent coopérer avec leurs voisines, tandis que la diplomatie et les choix internationaux majeurs restent français.</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-6">
                <Landmark className="h-7 w-7 text-blue-950" aria-hidden />
                <h3 className="mt-4 text-lg font-black">Europe : débat distinct</h3>
                <p className="mt-2 leading-7 text-slate-600">Maintien, réforme profonde, coopération entre nations ou autre relation : ce choix relève du débat national et n'est pas une conséquence automatique du régionalisme.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="histoire" className="scroll-mt-24 border-b border-slate-200 bg-blue-950 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Histoire</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Deux siècles de débats entre centre et territoires</h2>
            <div className="mt-10 grid gap-5 lg:grid-cols-5">
              {history.map((item) => (
                <article key={item.date} className="rounded-3xl border border-white/15 bg-white/5 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">{item.date}</p>
                  <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-blue-100">{item.text}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-4xl text-sm leading-7 text-blue-100">
              Cette histoire est politiquement diverse : conservateurs, républicains décentralisateurs, fédéralistes, catholiques sociaux, socialistes et mouvements autonomistes ont porté des conceptions différentes de la région. Les compromissions de certains courants avec Vichy ou les puissances de l'Axe font également partie de cette histoire et ne doivent pas être effacées.
            </p>
          </div>
        </section>

        <section id="sources" className="scroll-mt-24 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Méthode et sources"
              title="Séparer ce qui est documenté de ce qui est proposé"
              text="Les références historiques et les enquêtes sont utilisées comme sources ; elles ne valent pas approbation automatique des propositions présentées sur cette page."
            />
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <a href="https://books.openedition.org/pur/128519" target="_blank" rel="noreferrer" className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-blue-950">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Histoire politique</p>
                <h3 className="mt-3 font-black">Régionalisme et compétition politique en France</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Romain Pasquier, Presses universitaires de Rennes / OpenEdition Books.</p>
              </a>
              <a href="https://www.federation-rps.org/" target="_blank" rel="noreferrer" className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-blue-950">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Enquête 2025</p>
                <h3 className="mt-3 font-black">IFOP — régionalisme, autonomie et langues régionales</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Enquête commandée par Régions et Peuples Solidaires ; consulter la méthodologie complète avant toute interprétation.</p>
              </a>
              <a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000571356" target="_blank" rel="noreferrer" className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-blue-950">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Droit actuel</p>
                <h3 className="mt-3 font-black">Constitution du 4 octobre 1958</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Le cadre constitutionnel actuel permet de distinguer clairement le droit existant des transformations proposées.</p>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Les Régionalistes Français — dossier de réflexion et de propositions politiques.</p>
          <p>Faits, analyses et propositions sont distingués.</p>
        </div>
      </footer>
    </div>
  );
}

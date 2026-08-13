import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/articles/reponse-article-chni-tombola-patrimoine")({
  head: () => ({
    meta: [
      { title: "Article – Réponse à l'article du Ch'ni sur la Tombola Patrimoine" },
      {
        name: "description",
        content:
          "Angel Leclerc Communication apporte des précisions à la suite de l'article publié par Le Ch'ni concernant la Tombola Patrimoine de Besançon.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:title",
        content: "Réponse d'Angel Leclerc Communication à l'article du Ch'ni",
      },
      {
        property: "og:description",
        content:
          "Article concernant la Tombola Patrimoine de la chapelle des Visitandines de Besançon.",
      },
      {
        name: "twitter:title",
        content: "Réponse d'Angel Leclerc Communication à l'article du Ch'ni",
      },
      {
        name: "twitter:description",
        content:
          "Article concernant la Tombola Patrimoine de la chapelle des Visitandines de Besançon.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.angel-leclerc.fr/articles/reponse-article-chni-tombola-patrimoine",
      },
    ],
  }),
  component: ArticleReponseChniPage,
});

const paragraphs: string[] = [
  "À la suite de la publication de l'article intitulé « À Besançon, une tombola au (discret) profit des catholiques intégristes », Angel Leclerc Communication souhaite apporter plusieurs précisions afin de répondre aux interrogations soulevées et de rétablir certains éléments de contexte.",
  "Angel Leclerc Communication est intervenue exclusivement en qualité de prestataire indépendant en communication. Son intervention concernait la promotion d'une opération de restauration patrimoniale. L'entreprise ne représente ni la Fraternité Saint-Pie-X ni ses positions religieuses ou politiques.",
  "Le choix d'accompagner cette opération reposait uniquement sur son objectif patrimonial. Si ce bâtiment avait appartenu à une autre association, une autre communauté religieuse ou une autre institution, notre intervention aurait été identique. La mission confiée concernait la restauration d'une chapelle, indépendamment de l'identité de son propriétaire.",
  "Cette opération s'inscrivait dans un cadre clairement défini, avec un règlement public, la plateforme GoTombola, l'intervention de la Fondation du patrimoine ainsi que le contrôle d'un commissaire de justice. Ces éléments constituaient un cadre encadré, traçable et vérifiable.",
  "L'article affirme que l'identité du bénéficiaire aurait été volontairement dissimulée. Cette présentation ne correspond pas à la réalité. La Fraternité Saint-Pie-X était mentionnée dans le règlement officiel et le site de l'opération diffusait notamment une vidéo de France 3 dans laquelle l'appartenance de la chapelle à cette communauté était clairement indiquée. Toute personne consultant les contenus mis à disposition pouvait donc accéder à cette information.",
  "Il est possible de considérer que cette appartenance aurait pu être davantage mise en avant dans certains supports de communication. Cette appréciation peut être discutée. Elle ne permet cependant pas de présenter l'ensemble de l'opération comme une « supercherie » ou comme une volonté de tromper le public.",
  "Notre communication mettait principalement en avant la chapelle et sa restauration. Ce choix correspondait à l'objet de la mission confiée à Angel Leclerc Communication. Il ne constituait pas une prise de position religieuse ou politique.",
  "L'article s'interroge également sur la destination des fonds collectés. Le règlement de la tombola prévoyait pourtant que l'intégralité des bénéfices soit versée à la Fondation du patrimoine pour la restauration de la chapelle.",
  "Si des interrogations subsistaient sur le fonctionnement de l'opération, elles pouvaient être adressées directement à la Fondation du patrimoine, à GoTombola ou au commissaire de justice chargé de son contrôle. Ces interlocuteurs disposent des informations nécessaires concernant le déroulement de la tombola, le suivi des sommes collectées et leur destination.",
  "À ce jour, aucun élément concret présenté dans l'article ne démontre que les fonds auraient été destinés à un autre usage que celui prévu par le règlement. Il convient donc de distinguer clairement les faits établis des hypothèses formulées.",
  "Le raisonnement développé conduit également à mettre indirectement en doute le sérieux du cadre mis en place avec la Fondation du patrimoine. Si des éléments précis permettent de remettre en cause ce cadre ou les contrôles effectués, ils doivent être présentés clairement. En leur absence, une interrogation ne peut pas être traitée comme la preuve d'une irrégularité.",
  "L'article rapproche par ailleurs cette tombola de nombreuses personnes, organisations et controverses historiques. Chacun reste libre de porter une appréciation critique sur la Fraternité Saint-Pie-X, son histoire ou ses positions. Ces rapprochements ne démontrent toutefois pas, à eux seuls, une irrégularité concernant la tombola, le travail réalisé par Angel Leclerc Communication ou l'utilisation des fonds collectés.",
  "Le texte qualifie également la Fraternité Saint-Pie-X d'« organisation religieuse intégriste ». Cette expression relève d'un choix éditorial et non d'une qualification juridique officielle. En droit français, la structure concernée relève du régime des associations cultuelles. Sa situation canonique au sein de l'Église catholique constitue une question distincte de son statut juridique en France.",
  "Le Ch'ni revendique une ligne éditoriale engagée, notamment dans la lutte contre l'extrême droite. Cette orientation lui appartient. Elle ne dispense cependant pas de distinguer les faits, les opinions et les suppositions.",
  "L'emploi de termes tels que « supercherie », « officine », « ultras », « illuminés » ou « naufrage total » traduit un traitement particulièrement orienté. Ce vocabulaire mérite d'être mis en perspective avec la volonté affichée du média de proposer une information pluraliste, indépendante et de qualité.",
  "Angel Leclerc Communication respecte la liberté de la presse, le débat public et le droit à la critique. L'entreprise ne cherche pas à engager un conflit avec Le Ch'ni. Elle reste disponible pour un échange téléphonique direct et apaisé avec sa rédaction, ainsi que pour répondre aux questions des autres journalistes.",
  "Angel Leclerc Communication demande néanmoins que les interrogations concernant l'utilisation des fonds soient appuyées par des éléments précis et vérifiables. En l'absence de tels éléments, les passages concernés devraient clairement être présentés comme des hypothèses et non comme des risques établis.",
  "La restauration d'un bâtiment patrimonial peut être discutée, critiquée ou contestée. Elle ne peut cependant pas être transformée en soupçon financier ou politique sans faits directement liés à l'opération.",
];

function ArticleReponseChniPage() {
  return (
    <article className="bg-background py-14 md:py-20">
      <div className="mx-auto w-full max-w-[850px] px-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Article</p>

        <h1 className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Réponse d'Angel Leclerc Communication à l'article publié par Le Ch'ni concernant la
          Tombola Patrimoine
        </h1>

        <p className="mt-4 text-sm text-muted-foreground">Publié le 1er août 2026</p>

        <hr className="mt-8 border-border" />

        <div className="mt-8 space-y-6 text-left text-[15px] leading-[1.8] text-foreground/90 md:text-base">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>

        <aside className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
            Contact presse
          </h2>
          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Angel Leclerc</p>
            <p>Angel Leclerc Communication</p>
            <p>
              Site :{" "}
              <a
                href="https://www.angel-leclerc.fr"
                className="text-primary underline-offset-4 hover:underline"
              >
                https://www.angel-leclerc.fr
              </a>
            </p>
          </div>
        </aside>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </article>
  );
}

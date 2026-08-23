import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Mail,
  Cloud,
  CalendarDays,
  Images,
  Navigation,
  ContactRound,
  Landmark,
  Map,
  Video,
  Clapperboard,
  Music2,
  BookOpen,
  Sparkles,
  Languages,
  ExternalLink,
  Newspaper,

  Grid3X3,
} from "lucide-react";
import { FormEvent, useState } from "react";

export const Route = createFileRoute("/flamme")({
  head: () => ({
    meta: [
      { title: "Flamme — bêta" },
      {
        name: "description",
        content:
          "Flamme est une page bêta de recherche et d’accès rapide à des services numériques français, avec Qwant comme moteur de recherche.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FlammeBetaPage,
});

type Service = {
  name: string;
  description: string;
  url: string;
  icon: typeof Search;
  accent: string;
  badge?: string;
};

const services: Service[] = [
  {
    name: "Mailo",
    description: "Mail, cloud et agenda",
    url: "https://webmail.mailo.com/",
    icon: Mail,
    accent: "#2b6cb0",
  },
  {
    name: "CaraMail",
    description: "Messagerie GMX CaraMail",
    url: "https://www.gmx.fr/",
    icon: Mail,
    accent: "#1d4ed8",
  },
  {
    name: "Cloud Mailo",
    description: "Documents et fichiers",
    url: "https://webmail.mailo.com/",
    icon: Cloud,
    accent: "#0f766e",
  },
  {
    name: "Agenda Mailo",
    description: "Calendrier et rendez-vous",
    url: "https://webmail.mailo.com/",
    icon: CalendarDays,
    accent: "#2563eb",
  },
  {
    name: "Joomeo",
    description: "Photos et vidéos personnelles",
    url: "https://account.joomeo.com/",
    icon: Images,
    accent: "#e11d48",
  },
  {
    name: "Mappy",
    description: "GPS, plans et itinéraires",
    url: "https://fr.mappy.com/",
    icon: Navigation,
    accent: "#7c3aed",
  },
  {
    name: "PagesJaunes",
    description: "Professionnels et PagesBlanches",
    url: "https://www.pagesjaunes.fr/",
    icon: ContactRound,
    accent: "#eab308",
  },
  {
    name: "La Poste",
    description: "Courrier, colis et services",
    url: "https://www.laposte.fr/",
    icon: Landmark,
    accent: "#facc15",
  },
  {
    name: "FranceConnect",
    description: "Connexion aux services publics",
    url: "https://franceconnect.gouv.fr/",
    icon: Landmark,
    accent: "#000091",
    badge: "Service public",
  },
  {
    name: "IGN",
    description: "Terre, cartes et données géographiques",
    url: "https://cartes.gouv.fr/",
    icon: Map,
    accent: "#15803d",
    badge: "Public",
  },
  {
    name: "Dailymotion",
    description: "Vidéo",
    url: "https://www.dailymotion.com/fr",
    icon: Video,
    accent: "#111827",
  },
  {
    name: "CANAL+",
    description: "Films et séries",
    url: "https://www.canalplus.com/",
    icon: Clapperboard,
    accent: "#111827",
  },
  {
    name: "Deezer",
    description: "Musique",
    url: "https://www.deezer.com/fr/",
    icon: Music2,
    accent: "#a21caf",
  },
  {
    name: "Vivlio",
    description: "Livres numériques",
    url: "https://www.vivlio.com/",
    icon: BookOpen,
    accent: "#c2410c",
  },
  {
    name: "Mistral Vibe",
    description: "IA française",
    url: "https://chat.mistral.ai/",
    icon: Sparkles,
    accent: "#f97316",
    badge: "IA",
  },
  {
    name: "Reverso",
    description: "Traduction et langues",
    url: "https://www.reverso.net/traduction-texte",
    icon: Languages,
    accent: "#0369a1",
  },
];

const newsTopics = [
  { label: "À la une", query: "actualités France", headline: "Les principaux titres du jour" },
  { label: "France", query: "politique France", headline: "Politique et société" },
  { label: "International", query: "actualité internationale", headline: "Le monde en continu" },
  { label: "Économie", query: "économie entreprises", headline: "Entreprises, emploi et marchés" },
  { label: "Tech", query: "technologie numérique", headline: "Numérique, IA et innovation" },
  { label: "Sport", query: "sport résultats", headline: "Résultats et compétitions" },
];

function FlammeBetaPage() {

  const [query, setQuery] = useState("");
  const [appsOpen, setAppsOpen] = useState(false);

  const searchQwant = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = `https://www.qwant.com/?l=fr&t=all&q=${encodeURIComponent(q)}`;
  };

  const askMistral = () => {
    window.open("https://chat.mistral.ai/", "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-white text-[#202124]"
      style={{ fontFamily: "Roboto, arial, sans-serif" }}
    >
      <header className="flex h-[60px] items-center justify-end gap-4 px-5 text-[13px] text-[#202124]">
        <a href="https://www.qwant.com/?l=fr" className="hidden hover:underline sm:inline">Recherche</a>
        <a href="https://webmail.mailo.com/" className="hidden hover:underline sm:inline">Mail</a>
        <a href="https://account.joomeo.com/" className="hidden hover:underline sm:inline">Images</a>
        <div className="relative">
          <button
            type="button"
            aria-label="Applications Flamme"
            className="rounded-full p-2 hover:bg-[#f1f3f4]"
            onClick={() => setAppsOpen((value) => !value)}
          >
            <Grid3X3 className="h-5 w-5 text-[#5f6368]" />
          </button>
          {appsOpen && (
            <div className="absolute right-0 top-11 z-20 grid max-h-[420px] w-[320px] grid-cols-3 gap-1 overflow-y-auto rounded-lg border border-[#dadce0] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <a
                    key={service.name}
                    href={service.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-lg p-2 text-center hover:bg-[#f1f3f4]"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${service.accent}14`, color: service.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[12px] leading-4 text-[#3c4043]">{service.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[652px] px-5 pb-16">
        <div className="mt-[80px] flex justify-center sm:mt-[120px]">
          <img src="/logos/qwant.svg" alt="Qwant" width={272} height={92} className="h-[64px] w-auto sm:h-[80px]" />
        </div>

        <form onSubmit={searchQwant} className="mt-[26px]">
          <div className="mx-auto flex h-11 w-full items-center gap-3 rounded-full border border-[#dfe1e5] bg-white px-4 hover:border-transparent hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:border-transparent focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)]">
            <Search className="h-5 w-5 shrink-0 text-[#9aa0a6]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#202124] outline-none"
              placeholder="Rechercher sur le Web"
              aria-label="Recherche Qwant"
            />
            <button
              type="button"
              onClick={askMistral}
              className="rounded-full p-1.5 text-[#f97316] hover:bg-[#f8f9fa]"
              title="Demander à Mistral Vibe"
              aria-label="Demander à Mistral Vibe"
            >
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-[29px] flex flex-wrap justify-center gap-3">
            <button
              type="submit"
              className="h-9 rounded border border-transparent bg-[#f8f9fa] px-4 text-[14px] text-[#3c4043] hover:border-[#dadce0] hover:shadow-sm"
            >
              Recherche Qwant
            </button>
            <button
              type="button"
              onClick={askMistral}
              className="h-9 rounded border border-transparent bg-[#f8f9fa] px-4 text-[14px] text-[#3c4043] hover:border-[#dadce0] hover:shadow-sm"
            >
              Demander à Mistral
            </button>
          </div>
        </form>
      </main>

      <section className="mx-auto w-full max-w-[652px] px-5 pb-20">
        <h1 className="mb-3 text-[14px] font-medium text-[#5f6368]">Actualités</h1>
        <div className="overflow-hidden rounded-lg border border-[#dadce0]">
          {newsTopics.map((topic, index) => (
            <a
              key={topic.label}
              href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(topic.query)}`}
              target="_blank"
              rel="noreferrer"
              className={`block px-4 py-3 hover:bg-[#f8f9fa] ${index > 0 ? "border-t border-[#e8eaed]" : ""}`}
            >
              <span className="text-[12px] text-[#5f6368]">{topic.label}</span>
              <p className="mt-0.5 text-[16px] leading-6 text-[#1a0dab]">{topic.headline}</p>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#dadce0] bg-[#f2f2f2] px-5 py-4 text-[14px] text-[#70757a]">
        Flamme est une bêta indépendante. Recherches effectuées par Qwant ; les marques citées restent la propriété de leurs éditeurs.
      </footer>
    </div>
  );
}


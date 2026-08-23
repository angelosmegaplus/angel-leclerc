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
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white text-[#202124]">
      <header className="flex h-16 items-center justify-between px-4 text-sm sm:px-6">
        <div className="flex items-center gap-4 text-[#3c4043]">
          <span className="rounded-full bg-[#f1f3f4] px-3 py-1 text-xs font-medium">Bêta</span>
          <a href="https://www.qwant.com/?l=fr" className="hover:underline">Recherche</a>
        </div>
        <div className="relative flex items-center gap-4">
          <a href="https://webmail.mailo.com/" className="hidden hover:underline sm:inline">Mail</a>
          <a href="https://account.joomeo.com/" className="hidden hover:underline sm:inline">Photos</a>
          <button
            type="button"
            aria-label="Applications Flamme"
            className="rounded-full p-2 hover:bg-[#f1f3f4]"
            onClick={() => setAppsOpen((value) => !value)}
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          {appsOpen && (
            <div className="absolute right-0 top-12 z-20 grid w-[320px] grid-cols-3 gap-2 rounded-3xl border border-[#dadce0] bg-white p-4 shadow-xl">
              {services.slice(0, 12).map((service) => {
                const Icon = service.icon;
                return (
                  <a
                    key={service.name}
                    href={service.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-24 flex-col items-center justify-center rounded-2xl p-2 text-center hover:bg-[#f8fafd]"
                  >
                    <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${service.accent}14`, color: service.accent }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium">{service.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl flex-col items-center px-4 pb-16 pt-14 sm:pt-20">
        <div className="select-none text-center">
          <img
            src="/logos/qwant.svg"
            alt="Qwant"
            width={272}
            height={87}
            className="mx-auto h-[68px] w-auto sm:h-[87px]"
          />
          <p className="mt-2 text-sm text-[#5f6368]">Recherche propulsée par Qwant</p>
        </div>


        <form onSubmit={searchQwant} className="mt-8 w-full max-w-[640px]">
          <div className="flex h-12 items-center gap-3 rounded-full border border-[#dfe1e5] bg-white px-4 shadow-sm transition hover:shadow-md focus-within:shadow-md">
            <Search className="h-5 w-5 shrink-0 text-[#9aa0a6]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
              placeholder="Rechercher sur le Web"
              aria-label="Recherche Qwant"
            />
            <button type="button" onClick={askMistral} className="rounded-full p-2 text-[#f97316] hover:bg-[#fff7ed]" title="Demander à Mistral Vibe">
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="submit" className="rounded-md bg-[#f8f9fa] px-4 py-2 text-sm hover:ring-1 hover:ring-[#dadce0]">Recherche Qwant</button>
            <button type="button" onClick={askMistral} className="rounded-md bg-[#f8f9fa] px-4 py-2 text-sm hover:ring-1 hover:ring-[#dadce0]">Demander à Mistral</button>
          </div>
        </form>

        <section className="mt-12 w-full max-w-5xl">
          <div className="mb-4 flex items-center gap-2 text-[#5f6368]">
            <Newspaper className="h-4 w-4" />
            <h2 className="text-sm font-medium">Actualités</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newsTopics.map((topic) => (
              <a
                key={topic.label}
                href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(topic.query)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[#e5e7eb] bg-white p-4 transition hover:border-[#d2d6dc] hover:shadow-md"
              >
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#1a73e8]">{topic.label}</span>
                <p className="mt-1 text-sm font-medium leading-5 text-[#202124]">{topic.headline}</p>
                <p className="mt-2 text-xs text-[#5f6368]">Voir les dernières actualités sur Qwant Actualités</p>
              </a>
            ))}
          </div>
        </section>


        <section className="mt-14 w-full max-w-5xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-lg font-medium text-[#202124]">Services Flamme</h1>
              <p className="mt-1 text-sm text-[#5f6368]">Un point d’entrée unique vers des services français et francophones.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <a
                  key={service.name}
                  href={service.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-[#e5e7eb] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#d2d6dc] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${service.accent}14`, color: service.accent }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <ExternalLink className="h-4 w-4 text-[#9aa0a6] opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{service.name}</h2>
                      {service.badge && <span className="rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">{service.badge}</span>}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#5f6368]">{service.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-10 w-full max-w-5xl rounded-3xl border border-[#fed7aa] bg-[#fff7ed] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#f97316] shadow-sm">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-semibold">IA Flamme · Mistral Vibe</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6b7280]">
                  L’intelligence artificielle de Flamme pointe en priorité vers Mistral Vibe. Le bouton étoile dans la barre de recherche permet d’y accéder immédiatement.
                </p>
              </div>
            </div>
            <a href="https://chat.mistral.ai/" target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-[#f97316] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ea580c]">
              Ouvrir Mistral
            </a>
          </div>
        </section>

        <footer className="mt-14 w-full border-t border-[#e5e7eb] pt-6 text-center text-xs leading-5 text-[#6b7280]">
          Flamme est une bêta indépendante. Les marques citées restent la propriété de leurs éditeurs respectifs. Les recherches sont effectuées par Qwant.
        </footer>
      </main>
    </div>
  );
}

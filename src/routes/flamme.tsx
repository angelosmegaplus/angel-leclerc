import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Mail,
  Cloud,
  CalendarDays,
  Images,
  Navigation,
  ContactRound,
  Map,
  Video,
  Clapperboard,
  Music2,
  BookOpen,
  Sparkles,
  Languages,
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
  { name: "Mail", description: "Messagerie avec Mailo", url: "https://webmail.mailo.com/", icon: Mail, accent: "#2b6cb0" },
  { name: "Stockage", description: "Fichiers et espace en ligne avec Mailo", url: "https://webmail.mailo.com/", icon: Cloud, accent: "#0f766e" },
  { name: "Agenda", description: "Calendrier avec Mailo", url: "https://webmail.mailo.com/", icon: CalendarDays, accent: "#2563eb" },
  { name: "Photos", description: "Photos avec Joomeo", url: "https://account.joomeo.com/", icon: Images, accent: "#e11d48" },
  { name: "Itinéraires", description: "Plans et guidage avec Mappy", url: "https://fr.mappy.com/", icon: Navigation, accent: "#7c3aed" },
  { name: "Annuaire", description: "PagesJaunes et PagesBlanches", url: "https://www.pagesjaunes.fr/", icon: ContactRound, accent: "#eab308" },
  { name: "Carte", description: "Cartes et données avec l’IGN", url: "https://cartes.gouv.fr/", icon: Map, accent: "#15803d", badge: "Public" },
  { name: "Vidéo", description: "Avec Dailymotion", url: "https://www.dailymotion.com/fr", icon: Video, accent: "#111827" },
  { name: "Films & Séries", description: "Avec CANAL+", url: "https://www.canalplus.com/", icon: Clapperboard, accent: "#111827" },
  { name: "Musique", description: "Avec Deezer", url: "https://www.deezer.com/fr/", icon: Music2, accent: "#a21caf" },
  { name: "Livres", description: "Avec Vivlio", url: "https://www.vivlio.com/", icon: BookOpen, accent: "#c2410c" },
  { name: "IA", description: "Avec Mistral", url: "https://chat.mistral.ai/", icon: Sparkles, accent: "#f97316", badge: "IA" },
  { name: "Traduction", description: "Avec Reverso", url: "https://www.reverso.net/traduction-texte", icon: Languages, accent: "#0369a1" },
];

type NewsTopic = {
  label: string;
  query: string;
  headline: string;
  subline: string;
  from: string;
  to: string;
  symbol: string;
};

const newsTopics: NewsTopic[] = [
  {
    label: "À la une",
    query: "actualités France",
    headline: "Les principaux titres du jour",
    subline: "Retrouvez les informations les plus suivies en France et dans le monde.",
    from: "#1a73e8",
    to: "#7baaf7",
    symbol: "FR",
  },
  {
    label: "France",
    query: "politique France société",
    headline: "Politique et société",
    subline: "Les sujets qui font l’actualité nationale.",
    from: "#0b57d0",
    to: "#a8c7fa",
    symbol: "FR",
  },
  {
    label: "International",
    query: "actualité internationale",
    headline: "Le monde en continu",
    subline: "Les événements majeurs à l’étranger.",
    from: "#146c43",
    to: "#6dd58c",
    symbol: "MONDE",
  },
  {
    label: "Économie",
    query: "économie entreprises emploi",
    headline: "Entreprises, emploi et économie",
    subline: "Marchés, entreprises, travail et pouvoir d’achat.",
    from: "#b06000",
    to: "#fdd663",
    symbol: "€",
  },
  {
    label: "Technologies",
    query: "technologie numérique intelligence artificielle",
    headline: "Numérique, IA et innovation",
    subline: "Les nouveautés technologiques et numériques.",
    from: "#9334e6",
    to: "#d7aefb",
    symbol: "IA",
  },
  {
    label: "Sport",
    query: "sport résultats compétitions",
    headline: "Résultats et compétitions",
    subline: "L’essentiel de l’actualité sportive.",
    from: "#c5221f",
    to: "#f28b82",
    symbol: "SPORT",
  },
];

function newsVisual(topic: NewsTopic) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${topic.from}"/><stop offset="1" stop-color="${topic.to}"/></linearGradient></defs><rect width="640" height="360" rx="28" fill="url(#g)"/><circle cx="535" cy="76" r="88" fill="white" fill-opacity=".16"/><circle cx="110" cy="316" r="120" fill="white" fill-opacity=".10"/><path d="M78 232 C170 160 260 278 350 190 S510 165 590 106" fill="none" stroke="white" stroke-opacity=".35" stroke-width="12" stroke-linecap="round"/><text x="48" y="92" fill="white" font-family="Arial,sans-serif" font-size="28" font-weight="700">FLAMME ACTUALITÉS</text><text x="48" y="286" fill="white" font-family="Arial,sans-serif" font-size="64" font-weight="800">${topic.symbol}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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

  const mainNews = newsTopics[0];
  const secondaryNews = newsTopics.slice(1);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white text-[#202124]" style={{ fontFamily: "Roboto, arial, sans-serif" }}>
      <header className="flex h-[60px] items-center justify-end gap-4 px-5 text-[13px] text-[#202124]">
        <a href="https://www.qwant.com/?l=fr" className="hidden hover:underline sm:inline">Qwant</a>
        <a href="https://webmail.mailo.com/" className="hidden hover:underline sm:inline">Mail</a>
        <a href="https://account.joomeo.com/" className="hidden hover:underline sm:inline">Photos</a>
        <div className="relative">
          <button type="button" aria-label="Applications Flamme" className="rounded-full p-2 hover:bg-[#f1f3f4]" onClick={() => setAppsOpen((value) => !value)}>
            <Grid3X3 className="h-5 w-5 text-[#5f6368]" />
          </button>
          {appsOpen && (
            <div className="absolute right-0 top-11 z-20 grid max-h-[420px] w-[320px] grid-cols-3 gap-1 overflow-y-auto rounded-2xl border border-[#dadce0] bg-white p-3 shadow-[0_4px_18px_rgba(60,64,67,0.24)]">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <a key={service.name} href={service.url} target="_blank" rel="noreferrer" title={service.description} className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl p-2 text-center hover:bg-[#f1f3f4]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${service.accent}14`, color: service.accent }}>
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

      <main className="mx-auto w-full max-w-[652px] px-5 pb-14">
        <div className="mt-[80px] flex justify-center sm:mt-[120px]">
          <div className="relative left-[7px] flex justify-center">
            <img src="/logos/qwant.svg" alt="Qwant" width={272} height={92} className="h-[64px] w-auto sm:h-[80px]" />
          </div>
        </div>

        <form onSubmit={searchQwant} className="mt-[26px]">
          <div className="mx-auto flex h-11 w-full items-center gap-3 rounded-full border border-[#dfe1e5] bg-white px-4 hover:border-transparent hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:border-transparent focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)]">
            <Search className="h-5 w-5 shrink-0 text-[#9aa0a6]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#202124] outline-none" placeholder="Rechercher sur Internet" aria-label="Recherche Qwant" />
            <button type="button" onClick={askMistral} className="rounded-full p-1.5 text-[#f97316] hover:bg-[#f8f9fa]" title="IA" aria-label="Ouvrir l’IA">
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-[29px] flex flex-wrap justify-center gap-3">
            <button type="submit" className="h-9 rounded border border-transparent bg-[#f8f9fa] px-4 text-[14px] text-[#3c4043] hover:border-[#dadce0] hover:shadow-sm">Recherche Qwant</button>
            <button type="button" onClick={askMistral} className="h-9 rounded border border-transparent bg-[#f8f9fa] px-4 text-[14px] text-[#3c4043] hover:border-[#dadce0] hover:shadow-sm">IA</button>
          </div>
        </form>
      </main>

      <section className="mx-auto w-full max-w-[1040px] px-5 pb-20 sm:px-7">
        <div className="mb-4 flex items-center justify-between border-b border-[#dadce0] pb-3">
          <div>
            <h1 className="text-[22px] font-normal text-[#202124]">Actualités</h1>
            <p className="mt-1 text-[13px] text-[#5f6368]">Explorer les sujets du moment avec Qwant Actualités</p>
          </div>
          <a href="https://www.qwant.com/?l=fr&t=news&q=actualités" target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#1a73e8] hover:underline">Voir plus</a>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <a href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(mainNews.query)}`} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-[#dadce0] bg-white transition-shadow hover:shadow-[0_2px_10px_rgba(60,64,67,.18)]">
            <img src={newsVisual(mainNews)} alt="Illustration des actualités à la une" className="aspect-[16/8.6] w-full object-cover" />
            <div className="p-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] text-[#5f6368]">
                <span className="font-medium text-[#1a73e8]">{mainNews.label}</span>
                <span>•</span>
                <span>Qwant Actualités</span>
              </div>
              <h2 className="text-[23px] font-normal leading-8 text-[#202124] group-hover:underline">{mainNews.headline}</h2>
              <p className="mt-2 text-[14px] leading-5 text-[#5f6368]">{mainNews.subline}</p>
            </div>
          </a>

          <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">
            {secondaryNews.map((topic, index) => (
              <a key={topic.label} href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(topic.query)}`} target="_blank" rel="noreferrer" className={`group grid grid-cols-[1fr_118px] gap-4 p-4 hover:bg-[#f8f9fa] ${index > 0 ? "border-t border-[#e8eaed]" : ""}`}>
                <div className="min-w-0 py-1">
                  <div className="mb-1 text-[12px] font-medium text-[#5f6368]">{topic.label}</div>
                  <h3 className="text-[16px] leading-5 text-[#202124] group-hover:underline">{topic.headline}</h3>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-4 text-[#70757a]">{topic.subline}</p>
                </div>
                <img src={newsVisual(topic)} alt={`Illustration ${topic.label}`} className="h-[82px] w-[118px] rounded-xl object-cover" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dadce0] bg-[#f2f2f2] px-5 py-4 text-[14px] text-[#70757a]">
        Flamme est une bêta indépendante. Recherches effectuées par Qwant ; les services ouverts restent fournis par leurs éditeurs respectifs.
      </footer>
    </div>
  );
}

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
import { FormEvent, useMemo, useState } from "react";

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
};

const services: Service[] = [
  { name: "Mail", description: "Messagerie avec Mailo", url: "https://webmail.mailo.com/", icon: Mail, accent: "#2b6cb0" },
  { name: "Stockage", description: "Fichiers avec Mailo", url: "https://webmail.mailo.com/", icon: Cloud, accent: "#0f766e" },
  { name: "Agenda", description: "Calendrier avec Mailo", url: "https://webmail.mailo.com/", icon: CalendarDays, accent: "#2563eb" },
  { name: "Photos", description: "Photos avec Joomeo", url: "https://account.joomeo.com/", icon: Images, accent: "#e11d48" },
  { name: "Itinéraires", description: "Guidage avec Mappy", url: "https://fr.mappy.com/", icon: Navigation, accent: "#7c3aed" },
  { name: "Annuaire", description: "PagesJaunes et PagesBlanches", url: "https://www.pagesjaunes.fr/", icon: ContactRound, accent: "#eab308" },
  { name: "Carte", description: "Cartes avec l’IGN", url: "https://cartes.gouv.fr/", icon: Map, accent: "#15803d" },
  { name: "Vidéo", description: "Avec Dailymotion", url: "https://www.dailymotion.com/fr", icon: Video, accent: "#111827" },
  { name: "Films & Séries", description: "Avec CANAL+", url: "https://www.canalplus.com/", icon: Clapperboard, accent: "#111827" },
  { name: "Musique", description: "Avec Deezer", url: "https://www.deezer.com/fr/", icon: Music2, accent: "#a21caf" },
  { name: "Livres", description: "Avec Vivlio", url: "https://www.vivlio.com/", icon: BookOpen, accent: "#c2410c" },
  { name: "IA", description: "Avec Mistral", url: "https://chat.mistral.ai/", icon: Sparkles, accent: "#f97316" },
  { name: "Traduction", description: "Avec Reverso", url: "https://www.reverso.net/traduction-texte", icon: Languages, accent: "#0369a1" },
];

const shortcuts = services.slice(0, 7);
const localSuggestions = [
  "actualités France",
  "météo aujourd’hui",
  "programme TV ce soir",
  "résultats sportifs",
  "itinéraire",
  "traduction français anglais",
  "intelligence artificielle française",
  "actualités économie",
];

const searchTabs = [
  { name: "Tous", type: "all" },
  { name: "Actualités", type: "news" },
  { name: "Images", type: "images" },
  { name: "Vidéos", type: "videos" },
  { name: "Cartes", type: "maps" },
] as const;

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
  { label: "À la une", query: "actualités France", headline: "Les principaux titres du jour", subline: "Retrouvez les informations les plus suivies en France et dans le monde.", from: "#1a73e8", to: "#7baaf7", symbol: "FR" },
  { label: "France", query: "politique France société", headline: "Politique et société", subline: "Les sujets qui font l’actualité nationale.", from: "#0b57d0", to: "#a8c7fa", symbol: "FR" },
  { label: "International", query: "actualité internationale", headline: "Le monde en continu", subline: "Les événements majeurs à l’étranger.", from: "#146c43", to: "#6dd58c", symbol: "MONDE" },
  { label: "Économie", query: "économie entreprises emploi", headline: "Entreprises, emploi et économie", subline: "Marchés, entreprises, travail et pouvoir d’achat.", from: "#b06000", to: "#fdd663", symbol: "€" },
  { label: "Technologies", query: "technologie numérique intelligence artificielle", headline: "Numérique, IA et innovation", subline: "Les nouveautés technologiques et numériques.", from: "#9334e6", to: "#d7aefb", symbol: "IA" },
  { label: "Sport", query: "sport résultats compétitions", headline: "Résultats et compétitions", subline: "L’essentiel de l’actualité sportive.", from: "#c5221f", to: "#f28b82", symbol: "SPORT" },
];

function newsVisual(topic: NewsTopic) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${topic.from}"/><stop offset="1" stop-color="${topic.to}"/></linearGradient></defs><rect width="640" height="360" rx="28" fill="url(#g)"/><circle cx="535" cy="76" r="88" fill="white" fill-opacity=".16"/><circle cx="110" cy="316" r="120" fill="white" fill-opacity=".10"/><path d="M78 232 C170 160 260 278 350 190 S510 165 590 106" fill="none" stroke="white" stroke-opacity=".35" stroke-width="12" stroke-linecap="round"/><text x="48" y="92" fill="white" font-family="Arial,sans-serif" font-size="28" font-weight="700">FLAMME ACTUALITÉS</text><text x="48" y="286" fill="white" font-family="Arial,sans-serif" font-size="64" font-weight="800">${topic.symbol}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function FlammeBetaPage() {
  const [query, setQuery] = useState("");
  const [appsOpen, setAppsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof searchTabs)[number]["type"]>("all");

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localSuggestions.slice(0, 5);
    const matching = localSuggestions.filter((item) => item.toLowerCase().includes(q));
    return [...new Set([query.trim(), ...matching])].filter(Boolean).slice(0, 5);
  }, [query]);

  const goToSearch = (value: string, type = activeTab) => {
    const q = value.trim();
    if (!q) return;
    if (type === "maps") {
      window.location.href = `https://cartes.gouv.fr/?q=${encodeURIComponent(q)}`;
      return;
    }
    window.location.href = `https://www.qwant.com/?l=fr&t=${type}&q=${encodeURIComponent(q)}`;
  };

  const searchQwant = (event: FormEvent) => {
    event.preventDefault();
    goToSearch(query);
  };

  const askMistral = () => window.open("https://chat.mistral.ai/", "_blank", "noopener,noreferrer");
  const mainNews = newsTopics[0];
  const secondaryNews = newsTopics.slice(1);

  return (
    <div className="fixed inset-0 z-[100] min-h-[100dvh] overflow-y-auto bg-white text-[#202124]" style={{ fontFamily: "Roboto, arial, sans-serif" }}>
      <header className="sticky top-0 z-30 flex h-[56px] items-center justify-end gap-3 bg-white/95 px-3 backdrop-blur sm:h-[60px] sm:px-5">
        <a href="https://www.qwant.com/?l=fr" className="hidden text-[13px] hover:underline sm:inline">Qwant</a>
        <a href="https://webmail.mailo.com/" className="hidden text-[13px] hover:underline sm:inline">Mail</a>
        <a href="https://account.joomeo.com/" className="hidden text-[13px] hover:underline sm:inline">Photos</a>
        <button type="button" aria-label="Applications Flamme" aria-expanded={appsOpen} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#f1f3f4]" onClick={() => setAppsOpen((value) => !value)}>
          <Grid3X3 className="h-5 w-5 text-[#5f6368]" />
        </button>
      </header>

      {appsOpen && (
        <>
          <button type="button" aria-label="Fermer les applications" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setAppsOpen(false)} />
          <div className="fixed right-3 top-[58px] z-50 max-h-[68dvh] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-3xl border border-[#dadce0] bg-white p-3 shadow-[0_8px_28px_rgba(60,64,67,.28)] sm:right-4 sm:top-14 sm:max-h-[520px] sm:w-[340px]">
            <div className="grid grid-cols-3 gap-2">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <a key={service.name} href={service.url} target="_blank" rel="noreferrer" title={service.description} onClick={() => setAppsOpen(false)} className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center active:bg-[#f1f3f4] sm:hover:bg-[#f1f3f4]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${service.accent}14`, color: service.accent }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[12px] leading-4 text-[#3c4043] sm:text-[13px]">{service.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}

      <main className="mx-auto w-full max-w-[652px] px-4 pb-6 sm:px-5 sm:pb-12">
        <div className="mt-8 flex justify-center sm:mt-16">
          <div className="relative left-[5px] flex justify-center sm:left-[7px]">
            <img src="/logos/qwant.svg" alt="Qwant" width={272} height={92} className="h-[58px] w-auto sm:h-[80px]" />
          </div>
        </div>

        <form onSubmit={searchQwant} className="mt-6">
          <div className={`relative mx-auto rounded-[26px] border bg-white transition-shadow ${searchFocused ? "border-transparent shadow-[0_1px_8px_rgba(32,33,36,.28)]" : "border-[#dfe1e5]"}`}>
            <div className="flex h-[52px] items-center gap-3 px-4 sm:h-[46px]">
              <Search className="h-5 w-5 shrink-0 text-[#9aa0a6]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none"
                placeholder="Rechercher sur Internet"
                aria-label="Recherche Qwant"
                autoComplete="off"
              />
              <button type="button" onClick={askMistral} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#f97316] hover:bg-[#f8f9fa]" title="IA" aria-label="Ouvrir l’IA">
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
            {searchFocused && suggestions.length > 0 && (
              <div className="border-t border-[#e8eaed] pb-2 pt-1">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => goToSearch(suggestion)} className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] hover:bg-[#f1f3f4]">
                    <Search className="h-4 w-4 text-[#9aa0a6]" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1 border-b border-[#e8eaed]">
            {searchTabs.map((tab) => (
              <button key={tab.type} type="button" onClick={() => setActiveTab(tab.type)} className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-[14px] ${activeTab === tab.type ? "border-[#1a73e8] font-medium text-[#1a73e8]" : "border-transparent text-[#5f6368]"}`}>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-4 pb-2">
            {shortcuts.map((service) => {
              const Icon = service.icon;
              return (
                <a key={service.name} href={service.url} target="_blank" rel="noreferrer" className="flex w-[68px] flex-col items-center gap-2 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f3f4]" style={{ color: service.accent }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="max-w-[68px] truncate text-[12px] text-[#3c4043]">{service.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </main>

      <section className="mx-auto w-full max-w-[1040px] px-4 pb-16 sm:px-7 sm:pb-20">
        <div className="mb-4 flex items-end justify-between border-b border-[#dadce0] pb-3">
          <div>
            <h1 className="text-[21px] font-normal text-[#202124] sm:text-[22px]">Actualités</h1>
            <p className="mt-1 text-[12px] text-[#5f6368] sm:text-[13px]">Sujets du moment avec Qwant Actualités</p>
          </div>
          <a href="https://www.qwant.com/?l=fr&t=news&q=actualités" target="_blank" rel="noreferrer" className="min-h-11 px-2 py-3 text-[14px] font-medium text-[#1a73e8]">Voir plus</a>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr] lg:gap-5">
          <a href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(mainNews.query)}`} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-[#dadce0] bg-white transition-shadow hover:shadow-[0_2px_10px_rgba(60,64,67,.18)]">
            <img src={newsVisual(mainNews)} alt="Illustration des actualités à la une" className="aspect-[16/9] w-full object-cover sm:aspect-[16/8.6]" />
            <div className="p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] text-[#5f6368]"><span className="font-medium text-[#1a73e8]">{mainNews.label}</span><span>•</span><span>Qwant Actualités</span></div>
              <h2 className="text-[20px] font-normal leading-7 text-[#202124] group-hover:underline sm:text-[23px] sm:leading-8">{mainNews.headline}</h2>
              <p className="mt-2 text-[14px] leading-5 text-[#5f6368]">{mainNews.subline}</p>
            </div>
          </a>

          <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">
            {secondaryNews.map((topic, index) => (
              <a key={topic.label} href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(topic.query)}`} target="_blank" rel="noreferrer" className={`group grid min-h-[112px] grid-cols-[1fr_104px] gap-3 p-3.5 hover:bg-[#f8f9fa] sm:grid-cols-[1fr_118px] sm:gap-4 sm:p-4 ${index > 0 ? "border-t border-[#e8eaed]" : ""}`}>
                <div className="min-w-0 py-1">
                  <div className="mb-1 text-[12px] font-medium text-[#5f6368]">{topic.label}</div>
                  <h3 className="text-[15px] leading-5 text-[#202124] group-hover:underline sm:text-[16px]">{topic.headline}</h3>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-4 text-[#70757a]">{topic.subline}</p>
                </div>
                <img src={newsVisual(topic)} alt={`Illustration ${topic.label}`} className="h-[82px] w-[104px] rounded-xl object-cover sm:w-[118px]" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dadce0] bg-[#f2f2f2] px-4 py-4 text-center text-[12px] leading-5 text-[#70757a] sm:px-5 sm:text-left sm:text-[14px]">
        Flamme est une bêta indépendante. Recherches effectuées par Qwant ; les services ouverts restent fournis par leurs éditeurs respectifs.
      </footer>
    </div>
  );
}

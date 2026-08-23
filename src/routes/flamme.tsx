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
  Mic,
  Camera,
  History,
  X,
  Settings,
  Info,
  Moon,
  Sun,
  UserRound,
  Trash2,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

function readableAccent(hex: string, dark: boolean) {
  if (!dark) return hex;
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luminance >= 0.42) return hex;
  const lighten = (channel: number) => Math.round(channel + (255 - channel) * 0.62);
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
}

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

type SearchType = (typeof searchTabs)[number]["type"];


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
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchType>("all");
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [imageName, setImageName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem("flamme-search-history") || "[]");
      if (Array.isArray(storedHistory)) setHistoryItems(storedHistory.filter((item) => typeof item === "string").slice(0, 10));
      const storedTheme = localStorage.getItem("flamme-theme");
      if (storedTheme === "dark") setDarkMode(true);
      else if (storedTheme === "light") setDarkMode(false);
      else setDarkMode(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
    } catch {
      setHistoryItems([]);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const historyMatches = historyItems.filter((item) => !q || item.toLowerCase().includes(q));
    const localMatches = localSuggestions.filter((item) => !q || item.toLowerCase().includes(q));
    const serviceMatches = services.filter((service) => q && (service.name.toLowerCase().includes(q) || service.description.toLowerCase().includes(q)));
    return {
      history: historyMatches.slice(0, q ? 3 : 5),
      local: [...new Set(localMatches.filter((item) => !historyMatches.includes(item)))].slice(0, 5),
      services: serviceMatches.slice(0, 3),
    };
  }, [historyItems, query]);

  const saveHistory = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setHistoryItems((current) => {
      const next = [clean, ...current.filter((item) => item !== clean)].slice(0, 10);
      try {
        localStorage.setItem("flamme-search-history", JSON.stringify(next));
      } catch {
        // Le stockage local peut être indisponible en navigation privée stricte.
      }
      return next;
    });
  };

  const goToSearch = (value: string, type: SearchType = activeTab) => {
    const q = value.trim();
    if (!q) return;
    saveHistory(q);
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

  const startVoiceSearch = () => {
    setVoiceMessage("");
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceMessage("La recherche vocale n’est pas prise en charge par ce navigateur.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      if (!transcript) return;
      setQuery(transcript);
      goToSearch(transcript);
    };
    recognition.onerror = () => setVoiceMessage("Impossible d’utiliser le micro pour le moment.");
    recognition.start();
  };

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageName(file.name);
    setImagePreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  const closeImagePreview = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
    setImageName("");
  };

  const toggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      try {
        localStorage.setItem("flamme-theme", next ? "dark" : "light");
      } catch {
        // Sans stockage local, le thème reste actif pour la session.
      }
      return next;
    });
  };

  const removeHistoryItem = (item: string) => {
    setHistoryItems((current) => {
      const next = current.filter((entry) => entry !== item);
      try {
        localStorage.setItem("flamme-search-history", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistoryItems([]);
    try {
      localStorage.removeItem("flamme-search-history");
    } catch {}
  };

  const mainNews = newsTopics[0];
  const secondaryNews = newsTopics.slice(1);
  const pageBg = darkMode ? "bg-[#202124] text-[#e8eaed]" : "bg-white text-[#202124]";
  const surface = darkMode ? "bg-[#303134] border-[#5f6368]" : "bg-white border-[#dfe1e5]";
  const muted = darkMode ? "text-[#bdc1c6]" : "text-[#5f6368]";

  return (
    <div className={`fixed inset-0 z-[100] min-h-[100dvh] overflow-y-auto ${pageBg}`} style={{ fontFamily: "Roboto, arial, sans-serif" }}>
      <header className={`sticky top-0 z-30 flex h-[56px] items-center justify-end gap-2 px-3 backdrop-blur sm:h-[60px] sm:gap-3 sm:px-5 ${darkMode ? "bg-[#202124]/95" : "bg-white/95"}`}>
        <a href="https://www.qwant.com/?l=fr" className="hidden text-[13px] hover:underline sm:inline">Qwant</a>
        <a href="https://webmail.mailo.com/" className="hidden text-[13px] hover:underline sm:inline">Mail</a>
        <a href="https://account.joomeo.com/" className="hidden text-[13px] hover:underline sm:inline">Photos</a>
        <button type="button" aria-label="Compte et paramètres Flamme" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-[14px] font-medium text-white shadow-sm">
          F
        </button>
      </header>

      {profileOpen && (
        <>
          <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setProfileOpen(false)} />
          <div className={`fixed right-3 top-[58px] z-50 w-[min(300px,calc(100vw-24px))] rounded-3xl border p-3 shadow-[0_8px_28px_rgba(60,64,67,.28)] sm:right-4 sm:top-14 ${surface}`}>
            <div className="flex items-center gap-3 px-2 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a73e8] font-medium text-white">F</span>
              <div>
                <div className="text-[15px] font-medium">Flamme</div>
                <div className={`text-[12px] ${muted}`}>Bêta indépendante</div>
              </div>
            </div>
            <div className={`my-2 h-px ${darkMode ? "bg-[#5f6368]" : "bg-[#e8eaed]"}`} />
            <button type="button" onClick={toggleTheme} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {darkMode ? "Apparence claire" : "Apparence sombre"}
            </button>
            <button type="button" onClick={() => { setProfileOpen(false); document.getElementById("flamme-settings")?.scrollIntoView({ behavior: "smooth" }); }} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
              <Settings className="h-5 w-5" /> Paramètres
            </button>
            <a href="/flamme" className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
              <Info className="h-5 w-5" /> À propos de Flamme
            </a>
          </div>
        </>
      )}

      <main className="mx-auto flex w-full max-w-[652px] flex-col px-4 pb-5 sm:px-5 md:min-h-[calc(100dvh-170px)] md:justify-center md:pb-16 md:pt-0">
        <div className="mt-7 flex justify-center sm:mt-12 md:mt-0">
          <div className={`relative left-[5px] flex justify-center sm:left-[7px] ${darkMode ? "rounded-2xl bg-white/92 px-5 py-3 shadow-[0_1px_10px_rgba(0,0,0,.35)]" : ""}`}>
            <img src="/logos/qwant.svg" alt="Qwant" width={272} height={92} className="h-[58px] w-auto sm:h-[80px]" />
          </div>
        </div>

        <form onSubmit={searchQwant} className="mt-6">
          <div className={`relative mx-auto rounded-[26px] border transition-shadow ${surface} ${searchFocused ? "shadow-[0_1px_8px_rgba(32,33,36,.28)]" : "hover:shadow-[0_1px_6px_rgba(32,33,36,.2)]"}`}>
            <div className="flex h-[52px] items-center gap-1 px-3 sm:h-[46px] sm:gap-2 sm:px-4">
              <Search className={`h-5 w-5 shrink-0 ${darkMode ? "text-[#9aa0a6]" : "text-[#9aa0a6]"}`} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 140)}
                className="h-full min-w-0 flex-1 bg-transparent px-1 text-[16px] outline-none"
                placeholder="Rechercher"
                aria-label="Rechercher"
                autoComplete="off"
              />
              <button type="button" onClick={startVoiceSearch} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f8f9fa]"}`} title="Recherche vocale" aria-label="Recherche vocale">
                <Mic className="h-5 w-5 text-[#4285f4]" />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f8f9fa]"}`} title="Recherche par image — bêta" aria-label="Recherche par image — bêta">
                <Camera className="h-5 w-5 text-[#4285f4]" />
              </button>
              <button type="button" onClick={askMistral} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f8f9fa]"}`} title="IA" aria-label="Ouvrir l’IA">
                <Sparkles className="h-5 w-5 text-[#f97316]" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </div>

            {searchFocused && (suggestions.history.length > 0 || suggestions.local.length > 0 || suggestions.services.length > 0) && (
              <div className={`border-t pb-2 pt-1 ${darkMode ? "border-[#5f6368]" : "border-[#e8eaed]"}`}>
                {suggestions.history.map((suggestion) => (
                  <div key={`history-${suggestion}`} className={`group flex min-h-11 items-center ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => goToSearch(suggestion)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-4 text-left text-[15px]">
                      <History className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                    <button type="button" aria-label={`Supprimer ${suggestion}`} onMouseDown={(event) => event.preventDefault()} onClick={() => removeHistoryItem(suggestion)} className={`mr-2 flex h-9 w-9 items-center justify-center rounded-full opacity-70 ${darkMode ? "hover:bg-white/10" : "hover:bg-white"}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {suggestions.services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <a key={`service-${service.name}`} href={service.url} target="_blank" rel="noreferrer" onMouseDown={(event) => event.preventDefault()} className={`flex min-h-11 items-center gap-3 px-4 text-[15px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
                      <Icon className="h-4 w-4 shrink-0" style={{ color: readableAccent(service.accent, darkMode) }} />
                      <span className="truncate"><strong className="font-medium">{service.name}</strong> <span className={muted}>— {service.description}</span></span>
                    </a>
                  );
                })}
                {suggestions.local.map((suggestion) => (
                  <button key={`local-${suggestion}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => goToSearch(suggestion)} className={`flex min-h-11 w-full items-center gap-3 px-4 text-left text-[15px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
                    <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {voiceMessage && <p className={`mt-2 text-center text-[12px] ${muted}`}>{voiceMessage}</p>}

        {imagePreview && (
          <div className={`mx-auto mt-3 flex w-full items-center gap-3 rounded-2xl border p-3 ${surface}`}>
            <img src={imagePreview} alt="Aperçu de l’image sélectionnée" className="h-14 w-14 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{imageName}</div>
              <div className={`text-[11px] ${muted}`}>Recherche par image bêta : Qwant ne propose pas de recherche visuelle directe.</div>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => goToSearch(imageName.replace(/\.[^.]+$/, ""), "images")} className="rounded-full bg-[#1a73e8] px-3 py-1.5 text-[12px] font-medium text-white">Chercher le nom</button>
                <button type="button" onClick={askMistral} className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${darkMode ? "bg-white/10" : "bg-[#f1f3f4]"}`}>Ouvrir l’IA</button>
              </div>
            </div>
            <button type="button" onClick={closeImagePreview} aria-label="Fermer" className={`flex h-9 w-9 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="mt-6 hidden justify-center gap-3 md:flex">
          <button type="button" onClick={() => goToSearch(query)} className={`h-9 rounded border border-transparent px-4 text-[14px] ${darkMode ? "bg-[#303134] text-[#e8eaed] hover:border-[#5f6368]" : "bg-[#f8f9fa] text-[#3c4043] hover:border-[#dadce0]"}`}>Recherche Qwant</button>
          <button type="button" onClick={askMistral} className={`h-9 rounded border border-transparent px-4 text-[14px] ${darkMode ? "bg-[#303134] text-[#e8eaed] hover:border-[#5f6368]" : "bg-[#f8f9fa] text-[#3c4043] hover:border-[#dadce0]"}`}>IA</button>
        </div>

        <div className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
          <div role="tablist" aria-label="Type de recherche" className={`flex min-w-max gap-1 border-b ${darkMode ? "border-[#5f6368]" : "border-[#e8eaed]"}`}>
            {searchTabs.map((tab) => (
              <button key={tab.type} type="button" role="tab" aria-selected={activeTab === tab.type} aria-current={activeTab === tab.type ? "true" : undefined} onClick={() => setActiveTab(tab.type)} className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-[14px] ${activeTab === tab.type ? "border-[#1a73e8] font-medium text-[#1a73e8]" : `border-transparent ${muted}`}`}>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <nav aria-label="Services Flamme" className="-mx-4 mt-5 overflow-x-auto overscroll-x-contain px-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-4 pb-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <a key={service.name} href={service.url} target="_blank" rel="noreferrer" title={service.description} className="flex w-[68px] shrink-0 flex-col items-center gap-2 text-center">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${darkMode ? "bg-[#3c4043]" : "bg-[#f1f3f4]"}`} style={{ color: readableAccent(service.accent, darkMode) }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="max-w-[68px] truncate text-[12px]">{service.name}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </main>

      <section className="mx-auto w-full max-w-[720px] px-4 pb-14 md:hidden">
        <div className={`mb-4 flex items-end justify-between border-b pb-3 ${darkMode ? "border-[#5f6368]" : "border-[#dadce0]"}`}>
          <div>
            <h1 className="text-[21px] font-normal">Découvrir</h1>
            <p className={`mt-1 text-[12px] ${muted}`}>Actualités et sujets du moment avec Qwant</p>
          </div>
          <a href="https://www.qwant.com/?l=fr&t=news&q=actualités" target="_blank" rel="noreferrer" className="min-h-11 px-2 py-3 text-[14px] font-medium text-[#1a73e8]">Voir plus</a>
        </div>

        <div className="grid gap-4">
          <a href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(mainNews.query)}`} target="_blank" rel="noreferrer" className={`group overflow-hidden rounded-2xl border ${surface}`}>
            <img src={newsVisual(mainNews)} alt="Illustration des actualités à la une" className="aspect-[16/9] w-full object-cover" />
            <div className="p-4">
              <div className={`mb-2 flex items-center gap-2 text-[12px] ${muted}`}><span className="font-medium text-[#1a73e8]">{mainNews.label}</span><span>•</span><span>Qwant Actualités</span></div>
              <h2 className="text-[20px] font-normal leading-7 group-hover:underline">{mainNews.headline}</h2>
              <p className={`mt-2 text-[14px] leading-5 ${muted}`}>{mainNews.subline}</p>
            </div>
          </a>

          <div className={`overflow-hidden rounded-2xl border ${surface}`}>
            {secondaryNews.map((topic, index) => (
              <a key={topic.label} href={`https://www.qwant.com/?l=fr&t=news&q=${encodeURIComponent(topic.query)}`} target="_blank" rel="noreferrer" className={`group grid min-h-[112px] grid-cols-[1fr_104px] gap-3 p-3.5 ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f8f9fa]"} ${index > 0 ? darkMode ? "border-t border-[#5f6368]" : "border-t border-[#e8eaed]" : ""}`}>
                <div className="min-w-0 py-1">
                  <div className={`mb-1 text-[12px] font-medium ${muted}`}>{topic.label}</div>
                  <h3 className="text-[15px] leading-5 group-hover:underline">{topic.headline}</h3>
                  <p className={`mt-1 line-clamp-2 text-[12px] leading-4 ${muted}`}>{topic.subline}</p>
                </div>
                <img src={newsVisual(topic)} alt={`Illustration ${topic.label}`} className="h-[82px] w-[104px] rounded-xl object-cover" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer id="flamme-settings" className={`${darkMode ? "bg-[#171717] text-[#bdc1c6]" : "bg-[#f2f2f2] text-[#70757a]"} md:mt-auto`}>
        <div className={`border-b px-6 py-3 text-[14px] ${darkMode ? "border-[#3c4043]" : "border-[#dadce0]"}`}>France</div>
        <div className="flex flex-col items-center justify-between gap-2 px-5 py-3 text-[13px] sm:flex-row sm:text-[14px]">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
            <a href="/flamme" className="hover:underline">À propos</a>
            <a href="https://www.qwant.com/privacy" target="_blank" rel="noreferrer" className="hover:underline">Confidentialité</a>
            <a href="https://help.qwant.com/" target="_blank" rel="noreferrer" className="hover:underline">Aide</a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
            {historyItems.length > 0 && <button type="button" onClick={clearHistory} className="inline-flex items-center gap-1 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Effacer l’historique</button>}
            <button type="button" onClick={toggleTheme} className="inline-flex items-center gap-1 hover:underline"><Settings className="h-3.5 w-3.5" /> Paramètres</button>
          </div>
        </div>
        <div className={`px-5 pb-3 text-center text-[11px] ${darkMode ? "text-[#9aa0a6]" : "text-[#80868b]"}`}>Flamme est une bêta indépendante. Qwant effectue les recherches ; les services restent fournis par leurs éditeurs respectifs.</div>
      </footer>
    </div>
  );
}

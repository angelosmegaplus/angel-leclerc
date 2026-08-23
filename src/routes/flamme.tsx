import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Mail,
  Cloud,
  CloudSun,
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
  History,
  X,
  Settings,
  Info,
  Moon,
  Sun,
  UserRound,
  Trash2,
  Newspaper,
  Flame,
  Star,
  Heart,
  Leaf,
  Smile,
  Cat,
  Globe,
  LayoutGrid,
  Pencil,
  Users,
  Check,
} from "lucide-react";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FLAMME_AVATAR_IDS,
  FlammeAvatarId,
  FlammeProfile,
  MAX_PROFILE_NAME,
  normalizeProfileName,
  readActiveKey,
  readProfiles,
  sanitizeProfileName,
  writeActiveKey,
  writeProfiles,
} from "@/lib/flamme-profile";
import type { FlammeNewsItem } from "@/lib/flamme-news-types";
import { getFlammeNews } from "@/lib/flamme-news.functions";
import { FlammeInstallCard } from "@/components/flamme/FlammeInstallCard";
import { FlammeNewsList, FlammeNewsRefresh, FlammeNewsSkeleton, formatUpdatedAt } from "@/components/flamme/FlammeNews";


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
  { name: "Mail", description: "Messagerie avec Mailo", url: "https://www.mailo.com/?language=fr&page=id", icon: Mail, accent: "#2b6cb0" },
  { name: "Stockage", description: "Fichiers avec Mailo", url: "https://www.mailo.com/?language=fr&page=id", icon: Cloud, accent: "#0f766e" },
  { name: "Agenda", description: "Calendrier avec Mailo", url: "https://www.mailo.com/?language=fr&page=id", icon: CalendarDays, accent: "#2563eb" },
  { name: "Photos", description: "Photos avec Photoweb Cloud", url: "https://account.photowebcloud.fr/login.php", icon: Images, accent: "#e11d48" },
  { name: "Itinéraires", description: "Guidage avec Mappy", url: "https://fr.mappy.com/itineraire", icon: Navigation, accent: "#7c3aed" },
  { name: "Annuaire", description: "PagesJaunes et PagesBlanches", url: "https://www.pagesjaunes.fr/", icon: ContactRound, accent: "#eab308" },
  { name: "Carte", description: "Cartes avec l’IGN", url: "https://cartes.gouv.fr/decouvrir/explorer-les-cartes/", icon: Map, accent: "#15803d" },
  { name: "Vidéo", description: "Avec Dailymotion", url: "https://www.dailymotion.com/fr", icon: Video, accent: "#111827" },
  { name: "Films & Séries", description: "Films et séries avec AlloCiné", url: "https://www.allocine.fr/", icon: Clapperboard, accent: "#111827" },
  { name: "Musique", description: "Avec Deezer", url: "https://www.deezer.com/fr/", icon: Music2, accent: "#a21caf" },
  { name: "Livres", description: "Avec Vivlio", url: "https://www.vivlio.com/", icon: BookOpen, accent: "#c2410c" },
  { name: "IA", description: "Avec Mistral", url: "https://chat.mistral.ai/chat", icon: Sparkles, accent: "#f97316" },
  { name: "Météo", description: "Prévisions avec Météo-France", url: "https://meteofrance.com/", icon: CloudSun, accent: "#0284c7" },
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

const searchIcon: Record<SearchType, typeof Search> = {
  all: Search,
  news: Newspaper,
  images: Images,
  videos: Video,
  maps: Map,
};

const avatarIcons: Record<FlammeAvatarId, typeof Search> = {
  user: UserRound,
  flame: Flame,
  star: Star,
  heart: Heart,
  leaf: Leaf,
  smile: Smile,
  cat: Cat,
  sparkles: Sparkles,
};

type SuggestionKind = "history" | "qwant" | "service" | "local";

type SuggestionItem = {
  id: string;
  kind: SuggestionKind;
  value: string;
  label: string;
  description?: string;
  url?: string;
  icon: typeof Search;
  accent?: string;
};

const suggestionMeta: Record<SuggestionKind, { label: string; icon: typeof Search }> = {
  history: { label: "Historique", icon: History },
  qwant: { label: "Qwant", icon: Globe },
  service: { label: "Service", icon: LayoutGrid },
  local: { label: "Suggestion", icon: Search },
};

function foldText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function fetchQwantSuggestions(query: string, signal: AbortSignal): Promise<string[]> {
  const encoded = encodeURIComponent(query);
  try {
    const response = await fetch(`https://api.qwant.com/v3/suggest?q=${encoded}&locale=fr_FR&version=2`, { signal });
    if (response.ok) {
      const payload = (await response.json()) as any;
      if (payload?.status === "success" && Array.isArray(payload?.data?.items)) {
        const values = payload.data.items
          .map((item: any) => (typeof item?.value === "string" ? item.value : ""))
          .filter(Boolean) as string[];
        if (values.length) return values;
      }
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
  }
  try {
    const response = await fetch(`https://api.qwant.com/api/suggest/?client=opensearch&q=${encoded}`, { signal });
    if (!response.ok) return [];
    const payload = (await response.json()) as unknown;
    if (Array.isArray(payload)) {
      const list = payload.find((entry) => Array.isArray(entry)) as unknown[] | undefined;
      if (list) return list.filter((entry): entry is string => typeof entry === "string");
    }
    return [];
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    return [];
  }
}


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

type PanelKey = "about" | "privacy" | "help" | "settings";

const panelTitles: Record<PanelKey, string> = {
  about: "À propos de Flamme",
  privacy: "Confidentialité",
  help: "Aide",
  settings: "Paramètres",
};

function FlammeBetaPage() {
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchType>("all");
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [panel, setPanel] = useState<PanelKey | null>(null);
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [profiles, setProfiles] = useState<Record<string, FlammeProfile>>({});
  const [activeProfileKey, setActiveProfileKey] = useState<string | null>(null);
  const [profileMode, setProfileMode] = useState<"view" | "create" | "edit" | "switch">("view");
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [profileAvatarDraft, setProfileAvatarDraft] = useState<FlammeAvatarId>("user");
  const [profileError, setProfileError] = useState("");
  const remoteAbort = useRef<AbortController | null>(null);
  const [newsItems, setNewsItems] = useState<FlammeNewsItem[]>([]);
  const [newsFetchedAt, setNewsFetchedAt] = useState<string | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsFailed, setNewsFailed] = useState(false);

  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);


  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      const created = document.createElement("link");
      created.rel = "manifest";
      created.href = "/flamme.webmanifest";
      created.dataset["flammeManifest"] = "true";
      document.head.appendChild(created);
      return () => {
        created.remove();
      };
    }
    const previous = link.getAttribute("href");
    link.setAttribute("href", "/flamme.webmanifest");
    return () => {
      if (previous) link.setAttribute("href", previous);
    };
  }, []);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const payload = await getFlammeNews();
      if (payload?.items?.length) {
        setNewsItems(payload.items);
        setNewsFetchedAt(payload.fetchedAt);
        setNewsFailed(false);
      } else {
        setNewsFailed(true);
      }
    } catch {
      setNewsFailed(true);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

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
    const storedProfiles = readProfiles();
    setProfiles(storedProfiles);
    const key = readActiveKey();
    setActiveProfileKey(key && storedProfiles[key] ? key : null);
  }, []);

  useEffect(() => {
    const q = query.trim();
    remoteAbort.current?.abort();
    if (q.length < 2) {
      setRemoteSuggestions([]);
      return;
    }
    const controller = new AbortController();
    remoteAbort.current = controller;
    const timer = window.setTimeout(() => {
      fetchQwantSuggestions(q, controller.signal)
        .then((values) => {
          if (!controller.signal.aborted) setRemoteSuggestions(values.slice(0, 8));
        })
        .catch(() => {
          if (!controller.signal.aborted) setRemoteSuggestions([]);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [query]);

  const suggestions = useMemo<SuggestionItem[]>(() => {
    const raw = query.trim();
    const q = foldText(raw);
    const seen = new Set<string>();
    const items: SuggestionItem[] = [];

    const push = (item: SuggestionItem) => {
      const dedupeKey = `${item.kind === "service" ? "service:" : "query:"}${foldText(item.value)}`;
      if (!item.value || seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      items.push(item);
    };

    const historyMatches = historyItems.filter((item) => !q || foldText(item).includes(q));
    const localMatches = localSuggestions.filter((item) => !q || foldText(item).includes(q));
    const serviceMatches = q
      ? services.filter((service) => foldText(service.name).includes(q) || foldText(service.description).includes(q))
      : [];

    if (q) {
      const completion = [...historyMatches, ...remoteSuggestions, ...localMatches].find((item) => foldText(item).startsWith(q));
      if (completion) push({ id: `top-${completion}`, kind: foldText(completion) === q ? "local" : "qwant", value: completion, label: completion, icon: Search });
    }

    historyMatches.slice(0, q ? 3 : 5).forEach((item) =>
      push({ id: `history-${item}`, kind: "history", value: item, label: item, icon: History }),
    );
    remoteSuggestions.forEach((item) => push({ id: `qwant-${item}`, kind: "qwant", value: item, label: item, icon: Globe }));
    serviceMatches.slice(0, 3).forEach((service) =>
      push({
        id: `service-${service.name}`,
        kind: "service",
        value: service.name,
        label: service.name,
        description: service.description,
        url: service.url,
        icon: service.icon,
        accent: service.accent,
      }),
    );
    localMatches.slice(0, 5).forEach((item) => push({ id: `local-${item}`, kind: "local", value: item, label: item, icon: Search }));

    return items.slice(0, 10);
  }, [historyItems, query, remoteSuggestions]);


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

  const askMistral = () => window.open("https://chat.mistral.ai/chat", "_blank", "noopener,noreferrer");

  const askQwantAi = () => window.open("https://www.qwant.com/ai?l=fr", "_blank", "noopener,noreferrer");

  const startVoiceSearch = () => {
    if (isListening) return;
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
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setIsListening(false);
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      if (!transcript) return;
      setQuery(transcript);
      goToSearch(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceMessage("Impossible d’utiliser le micro pour le moment.");
    };
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceMessage("Impossible de démarrer la recherche vocale.");
    }
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

  const activeProfile = activeProfileKey ? profiles[activeProfileKey] ?? null : null;

  const runSuggestion = (item: SuggestionItem) => {
    if (item.kind === "service" && item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    goToSearch(item.value);
  };

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!searchFocused || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Escape") {
      setSearchFocused(false);
      setHighlightIndex(-1);
    } else if (event.key === "Enter" && highlightIndex >= 0) {
      event.preventDefault();
      const item = suggestions[highlightIndex];
      if (item) runSuggestion(item);
    }
  };

  const openProfileMenu = () => {
    setProfileError("");
    setProfileMode(activeProfile ? "view" : "create");
    setProfileNameDraft(activeProfile ? activeProfile.name : "");
    setProfileAvatarDraft(activeProfile ? activeProfile.avatar : "user");
    setProfileOpen((value) => !value);
  };

  const openProfileManager = () => {
    setPanel(null);
    setProfileError("");
    setProfileMode(activeProfile ? "view" : "create");
    setProfileNameDraft(activeProfile ? activeProfile.name : "");
    setProfileAvatarDraft(activeProfile ? activeProfile.avatar : "user");
    setProfileOpen(true);
  };




  const persistProfiles = (next: Record<string, FlammeProfile>, activeKey: string | null) => {
    setProfiles(next);
    setActiveProfileKey(activeKey);
    writeProfiles(next);
    writeActiveKey(activeKey);
  };

  const saveProfileDraft = () => {
    const name = sanitizeProfileName(profileNameDraft).trim();
    if (!name) {
      setProfileError("Indiquez un nom d’utilisateur.");
      return;
    }
    const key = normalizeProfileName(name);
    const isEditingActive = profileMode === "edit" && activeProfileKey !== null;
    const existing = profiles[key];

    if (existing && !(isEditingActive && activeProfileKey === key)) {
      // Profil déjà enregistré sur cet appareil : on le réactive sans écraser son avatar.
      persistProfiles(profiles, key);
      setProfileNameDraft(existing.name);
      setProfileAvatarDraft(existing.avatar);
      setProfileMode("view");
      setProfileError("");
      return;
    }

    const next = { ...profiles };
    if (isEditingActive && activeProfileKey && activeProfileKey !== key) delete next[activeProfileKey];
    next[key] = { key, name, avatar: profileAvatarDraft };
    persistProfiles(next, key);
    setProfileMode("view");
    setProfileError("");
  };


  const switchToProfile = () => {
    const name = sanitizeProfileName(profileNameDraft).trim();
    if (!name) {
      setProfileError("Indiquez un nom d’utilisateur.");
      return;
    }
    const key = normalizeProfileName(name);
    const existing = profiles[key];
    if (existing) {
      persistProfiles(profiles, key);
      setProfileMode("view");
      setProfileError("");
      return;
    }
    setProfileMode("create");
    setProfileAvatarDraft("user");
    setProfileError("Nouveau profil : choisissez un avatar puis enregistrez.");
  };

  const deleteActiveProfile = () => {
    if (!activeProfileKey) return;
    const next = { ...profiles };
    delete next[activeProfileKey];
    persistProfiles(next, null);
    setProfileMode("create");
    setProfileNameDraft("");
    setProfileAvatarDraft("user");
  };

  const ActiveAvatarIcon = activeProfile ? avatarIcons[activeProfile.avatar] : UserRound;


  const mainNews = newsTopics[0];
  const secondaryNews = newsTopics.slice(1);
  const pageBg = darkMode ? "bg-[#202124] text-[#e8eaed]" : "bg-white text-[#202124]";
  const surface = darkMode ? "bg-[#303134] border-[#5f6368]" : "bg-white border-[#dfe1e5]";
  const muted = darkMode ? "text-[#bdc1c6]" : "text-[#5f6368]";

  return (
    <div className={`fixed inset-0 z-[100] min-h-[100dvh] overflow-y-auto ${pageBg}`} style={{ fontFamily: "Roboto, arial, sans-serif" }}>
      <header className={`sticky top-0 z-30 flex h-[56px] items-center justify-end gap-2 px-3 backdrop-blur sm:h-[60px] sm:gap-3 sm:px-5 ${darkMode ? "bg-[#202124]/95" : "bg-white/95"}`}>
        <a href="https://www.qwant.com/?l=fr" className="hidden text-[13px] hover:underline sm:inline">Qwant</a>
        <a href="https://www.mailo.com/?language=fr&page=id" className="hidden text-[13px] hover:underline sm:inline">Mail</a>
        <a href="https://account.photowebcloud.fr/login.php" className="hidden text-[13px] hover:underline sm:inline">Photos</a>
        <button type="button" aria-label={activeProfile ? `Profil local ${activeProfile.name}` : "Profil local Flamme"} aria-expanded={profileOpen} onClick={openProfileMenu} className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm ${activeProfile ? "bg-[#1a73e8] text-white" : darkMode ? "border border-[#5f6368] text-[#e8eaed]" : "border border-[#dfe1e5] text-[#3c4043]"}`}>
          <ActiveAvatarIcon className="h-[18px] w-[18px]" />
        </button>
      </header>

      {profileOpen && (
        <>
          <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setProfileOpen(false)} />
          <div className={`fixed right-3 top-[58px] z-50 w-[min(320px,calc(100vw-24px))] rounded-3xl border p-3 shadow-[0_8px_28px_rgba(60,64,67,.28)] sm:right-4 sm:top-14 ${surface}`}>
            <div className="flex items-center gap-3 px-2 py-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${activeProfile ? "bg-[#1a73e8] text-white" : darkMode ? "bg-[#3c4043]" : "bg-[#f1f3f4]"}`}>
                <ActiveAvatarIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-medium">{activeProfile ? activeProfile.name : "Flamme"}</div>
                <div className={`text-[12px] ${muted}`}>{activeProfile ? "Profil local" : "Aucun profil local"}</div>
              </div>
            </div>
            <p className={`px-2 pb-1 text-[11px] leading-4 ${muted}`}>Profil enregistré uniquement sur cet appareil.</p>
            <div className={`my-2 h-px ${darkMode ? "bg-[#5f6368]" : "bg-[#e8eaed]"}`} />

            {profileMode === "view" && activeProfile && (
              <>
                <button type="button" onClick={() => { setProfileMode("edit"); setProfileNameDraft(activeProfile.name); setProfileAvatarDraft(activeProfile.avatar); setProfileError(""); }} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
                  <Pencil className="h-5 w-5" /> Modifier le profil
                </button>
                <button type="button" onClick={() => { setProfileMode("switch"); setProfileNameDraft(""); setProfileError(""); }} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
                  <Users className="h-5 w-5" /> Changer d’utilisateur
                </button>
                <button type="button" onClick={deleteActiveProfile} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] text-[#d93025] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
                  <Trash2 className="h-5 w-5" /> Supprimer ce profil de cet appareil
                </button>
              </>
            )}

            {(profileMode === "create" || profileMode === "edit" || profileMode === "switch") && (
              <div className="space-y-3 px-2 pb-1">
                <label className="block">
                  <span className={`text-[12px] ${muted}`}>Nom d’utilisateur</span>
                  <input
                    value={profileNameDraft}
                    onChange={(event) => setProfileNameDraft(sanitizeProfileName(event.target.value))}
                    maxLength={MAX_PROFILE_NAME}
                    placeholder="Votre prénom ou pseudo"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 text-[14px] outline-none ${darkMode ? "border-[#5f6368] bg-transparent" : "border-[#dfe1e5] bg-white"}`}
                  />
                </label>

                {profileMode !== "switch" && (
                  <div>
                    <span className={`text-[12px] ${muted}`}>Avatar</span>
                    <div className="mt-1 grid grid-cols-4 gap-2">
                      {FLAMME_AVATAR_IDS.map((id) => {
                        const Icon = avatarIcons[id];
                        const selected = profileAvatarDraft === id;
                        return (
                          <button key={id} type="button" aria-label={`Avatar ${id}`} aria-pressed={selected} onClick={() => setProfileAvatarDraft(id)} className={`flex h-11 items-center justify-center rounded-xl border ${selected ? "border-[#1a73e8] text-[#1a73e8]" : darkMode ? "border-[#5f6368]" : "border-[#dfe1e5]"}`}>
                            <Icon className="h-5 w-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {profileError && <p className="text-[12px] text-[#d93025]">{profileError}</p>}

                <div className="flex gap-2">
                  <button type="button" onClick={profileMode === "switch" ? switchToProfile : saveProfileDraft} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-3 text-[14px] font-medium text-white">
                    <Check className="h-4 w-4" /> {profileMode === "switch" ? "Continuer" : "Enregistrer"}
                  </button>
                  {activeProfile && (
                    <button type="button" onClick={() => { setProfileMode("view"); setProfileError(""); }} className={`min-h-10 rounded-xl border px-3 text-[14px] ${darkMode ? "border-[#5f6368]" : "border-[#dfe1e5]"}`}>Annuler</button>
                  )}
                </div>
              </div>
            )}

            <div className={`my-2 h-px ${darkMode ? "bg-[#5f6368]" : "bg-[#e8eaed]"}`} />
            <FlammeInstallCard darkMode={darkMode} />
            <div className={`my-2 h-px ${darkMode ? "bg-[#5f6368]" : "bg-[#e8eaed]"}`} />
            <button type="button" onClick={toggleTheme} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {darkMode ? "Apparence claire" : "Apparence sombre"}
            </button>
            <button type="button" onClick={() => { setProfileOpen(false); setPanel("settings"); }} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
              <Settings className="h-5 w-5" /> Paramètres
            </button>
            <button type="button" onClick={() => { setProfileOpen(false); setPanel("about"); }} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
              <Info className="h-5 w-5" /> À propos de Flamme
            </button>
          </div>
        </>
      )}


      <main className="mx-auto flex w-full max-w-[652px] flex-col px-4 pb-5 sm:px-5 md:min-h-[calc(100dvh-170px)] md:justify-center md:pb-16 md:pt-0">
        <div className="mt-7 flex justify-center sm:mt-12 md:mt-0">
          <div className="flex select-none items-end justify-center gap-2">
            <span
              className={`text-[46px] font-extrabold leading-none tracking-[-0.045em] sm:text-[64px] ${darkMode ? "text-[#f1f3f4]" : "text-[#181716]"}`}
            >
              Flamme
            </span>
            <span className="mb-[10px] h-[9px] w-[9px] shrink-0 rounded-full bg-[#e2372f] sm:mb-[14px] sm:h-[12px] sm:w-[12px]" aria-hidden="true" />
            <span className={`mb-[6px] text-[15px] font-medium lowercase tracking-tight sm:mb-[9px] sm:text-[20px] ${darkMode ? "text-[#9aa0a6]" : "text-[#6b6f76]"}`}>
              bêta
            </span>
          </div>
        </div>

        <form onSubmit={searchQwant} className="mt-6">
          <div className={`relative mx-auto rounded-[26px] border transition-shadow ${surface} ${searchFocused ? "shadow-[0_1px_8px_rgba(32,33,36,.28)]" : "hover:shadow-[0_1px_6px_rgba(32,33,36,.2)]"}`}>
            <div className="flex h-[52px] items-center gap-1 px-3 sm:h-[46px] sm:gap-2 sm:px-4">
              {(() => {
                const ActiveIcon = searchIcon[activeTab];
                return <ActiveIcon className="h-5 w-5 shrink-0 text-[#9aa0a6]" />;
              })()}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => { setSearchFocused(false); setHighlightIndex(-1); }, 140)}
                onKeyDown={onSearchKeyDown}

                className="h-full min-w-0 flex-1 bg-transparent px-1 text-[16px] outline-none"
                placeholder="Rechercher sur Qwant"
                aria-label="Rechercher sur Qwant"
                autoComplete="off"
              />
              <button type="button" onClick={startVoiceSearch} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f8f9fa]"}`} title="Recherche vocale" aria-label="Recherche vocale" aria-pressed={isListening}>
                {isListening ? (
                  <span className="flex items-center gap-[3px]" aria-hidden="true">
                    <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-[#4285f4] [animation-duration:.9s]" />
                    <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-[#4285f4] [animation-delay:.15s] [animation-duration:.9s]" />
                    <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-[#4285f4] [animation-delay:.3s] [animation-duration:.9s]" />
                  </span>
                ) : (
                  <Mic className="h-5 w-5 text-[#4285f4]" />
                )}
              </button>
              <button type="button" onClick={askQwantAi} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f8f9fa]"}`} title="Rechercher avec l’IA de Qwant" aria-label="Rechercher avec l’IA de Qwant">
                <Sparkles className="h-5 w-5 text-[#f97316]" />
              </button>

            </div>

            {searchFocused && suggestions.length > 0 && (
              <ul role="listbox" aria-label="Suggestions de recherche" className={`border-t pb-2 pt-1 ${darkMode ? "border-[#5f6368]" : "border-[#e8eaed]"}`}>
                {suggestions.map((item, index) => {
                  const Icon = item.icon;
                  const highlighted = index === highlightIndex;
                  const rowClass = highlighted ? (darkMode ? "bg-white/10" : "bg-[#f1f3f4]") : darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]";
                  return (
                    <li key={item.id} role="option" aria-selected={highlighted} className={`group flex min-h-11 items-center ${rowClass}`}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => runSuggestion(item)}
                        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-4 text-left text-[15px]"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#9aa0a6]" style={item.accent ? { color: readableAccent(item.accent, darkMode) } : undefined} />
                        <span className="min-w-0 flex-1 truncate">
                          <span className={item.kind === "service" ? "font-medium" : undefined}>{item.label}</span>
                          {item.description && <span className={muted}> — {item.description}</span>}
                        </span>
                        <span className={`ml-2 hidden shrink-0 text-[11px] sm:inline ${muted}`}>{suggestionMeta[item.kind].label}</span>
                      </button>
                      {item.kind === "history" && (
                        <button type="button" aria-label={`Supprimer ${item.value}`} onMouseDown={(event) => event.preventDefault()} onClick={() => removeHistoryItem(item.value)} className={`mr-2 flex h-9 w-9 items-center justify-center rounded-full opacity-70 ${darkMode ? "hover:bg-white/10" : "hover:bg-white"}`}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

          </div>
        </form>

        {voiceMessage && <p className={`mt-2 text-center text-[12px] ${muted}`}>{voiceMessage}</p>}



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

      <footer className={`${darkMode ? "bg-[#171717] text-[#bdc1c6]" : "bg-[#f2f2f2] text-[#70757a]"} md:mt-auto`}>
        <div className={`border-b px-6 py-3 text-[14px] ${darkMode ? "border-[#3c4043]" : "border-[#dadce0]"}`}>France</div>
        <div className="flex flex-col items-center justify-between gap-2 px-5 py-3 text-[13px] sm:flex-row sm:text-[14px]">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
            <button type="button" onClick={() => setPanel("about")} className="min-h-11 hover:underline sm:min-h-0">À propos</button>
            <button type="button" onClick={() => setPanel("privacy")} className="min-h-11 hover:underline sm:min-h-0">Confidentialité</button>
            <button type="button" onClick={() => setPanel("help")} className="min-h-11 hover:underline sm:min-h-0">Aide</button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
            <button type="button" onClick={() => setPanel("settings")} className="inline-flex min-h-11 items-center gap-1 hover:underline sm:min-h-0"><Settings className="h-3.5 w-3.5" /> Paramètres</button>
          </div>
        </div>
        <div className={`px-5 pb-3 text-center text-[11px] ${darkMode ? "text-[#9aa0a6]" : "text-[#80868b]"}`}>Flamme est une bêta indépendante. Qwant effectue les recherches ; les services restent fournis par leurs éditeurs respectifs.</div>
      </footer>

      {panel && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="flamme-panel-title">
          <button type="button" aria-label="Fermer la fenêtre" onClick={() => setPanel(null)} className="absolute inset-0 cursor-default bg-black/45" />
          <div className={`relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-[0_8px_28px_rgba(0,0,0,.35)] sm:max-w-[560px] sm:rounded-3xl ${surface}`}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 id="flamme-panel-title" className="text-[19px] font-medium">{panelTitles[panel]}</h2>
              <button type="button" onClick={() => setPanel(null)} aria-label="Fermer" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {panel === "about" && (
              <div className={`space-y-3 text-[14px] leading-6 ${muted}`}>
                <p>Flamme bêta est une interface de démarrage indépendante, développée pour ce site. Elle n’est affiliée à aucun des services qu’elle référence.</p>
                <p>La recherche est effectuée par <strong className="font-medium">Qwant</strong> : Flamme se contente d’ouvrir Qwant avec votre requête et le type choisi (Tous, Actualités, Images, Vidéos). Les Cartes ouvrent le service public IGN.</p>
                <p>Le carrousel de services est une liste de raccourcis vers des sites tiers (Mailo, Photoweb Cloud, Mappy, PagesJaunes, Dailymotion, AlloCiné, Deezer, Vivlio, Mistral, Reverso…). Chaque service reste géré par son éditeur.</p>
                <p>Flamme n’héberge aucun compte, n’indexe aucun contenu et ne stocke aucune donnée sur un serveur.</p>
              </div>
            )}

            {panel === "privacy" && (
              <div className={`space-y-3 text-[14px] leading-6 ${muted}`}>
                <p>Flamme ne dispose pas de serveur propre pour la recherche : voici exactement ce qui se passe.</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Votre <strong className="font-medium">historique de recherche</strong>, vos <strong className="font-medium">profils locaux</strong> (nom et avatar) et votre <strong className="font-medium">thème clair/sombre</strong> sont enregistrés uniquement dans le stockage local de votre navigateur, sans compte ni serveur. Vous pouvez les effacer depuis Paramètres.</li>
                  <li>Lorsque vous lancez une recherche, la requête est <strong className="font-medium">envoyée à Qwant</strong> (ou au service de cartes IGN pour l’onglet Cartes).</li>
                  <li>Cliquer sur un service du carrousel ouvre directement le site de l’éditeur concerné, qui applique ses propres règles.</li>
                  <li>La <strong className="font-medium">recherche vocale</strong> utilise la reconnaissance vocale de votre navigateur ou de votre appareil ; l’audio peut être traité par le fournisseur de ce navigateur/système.</li>
                </ul>
                <p>Flamme ne prétend pas gérer ni contrôler les données traitées par ces services tiers. Ressources externes :</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                  <a href="https://about.qwant.com/legal/confidentialite/" target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline">Confidentialité Qwant</a>
                  <a href="https://pro.mailo.com/mailo/fr/regles-de-confidentialite.php" target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline">Confidentialité Mailo</a>
                  <a href="https://cartes.gouv.fr/" target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline">cartes.gouv.fr (IGN)</a>
                </div>
              </div>
            )}

            {panel === "help" && (
              <div className={`space-y-3 text-[14px] leading-6 ${muted}`}>
                <p><strong className="font-medium">Onglets de recherche</strong> — Tous, Actualités, Images et Vidéos préparent le type de recherche envoyé à Qwant ; Cartes envoie la requête au service de cartes IGN. Cliquer sur un onglet ne lance pas de recherche : il sélectionne le mode, utilisé lors de la recherche suivante. Le pictogramme à gauche du champ reflète le mode actif.</p>
                <p><strong className="font-medium">Recherche vocale</strong> — Touchez le micro et dictez : trois points animés indiquent l’écoute. La recherche se lance dès que la phrase est reconnue. Si le navigateur ne prend pas en charge la dictée, un message s’affiche.</p>
                <p><strong className="font-medium">Carrousel de services</strong> — Faites glisser horizontalement pour accéder à l’ensemble des raccourcis ; chaque service s’ouvre dans un nouvel onglet.</p>
                <p><strong className="font-medium">Qwant IA</strong> — L’icône ✦ dans la barre de recherche ouvre le chat IA de Qwant. Le raccourci « IA » du carrousel ouvre Mistral.</p>
              </div>
            )}

            {panel === "settings" && (
              <div className="space-y-3">
                <button type="button" onClick={toggleTheme} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left text-[14px] ${darkMode ? "border-[#5f6368] hover:bg-white/10" : "border-[#dfe1e5] hover:bg-[#f1f3f4]"}`}>
                  <span className="flex items-center gap-3">{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />} Apparence</span>
                  <span className={`text-[13px] ${muted}`}>{darkMode ? "Sombre" : "Claire"}</span>
                </button>
                <div className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 text-[14px] ${darkMode ? "border-[#5f6368]" : "border-[#dfe1e5]"}`}>
                  <span className="flex items-center gap-3"><History className="h-5 w-5" /> Historique local</span>
                  <span className={`text-[13px] ${muted}`}>{historyItems.length} élément{historyItems.length > 1 ? "s" : ""}</span>
                </div>
                <button type="button" onClick={clearHistory} disabled={historyItems.length === 0} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left text-[14px] disabled:opacity-50 ${darkMode ? "border-[#5f6368] hover:bg-white/10" : "border-[#dfe1e5] hover:bg-[#f1f3f4]"}`}>
                  <Trash2 className="h-5 w-5" /> Effacer l’historique
                </button>
                <div className={`rounded-2xl border px-4 py-3 ${darkMode ? "border-[#5f6368]" : "border-[#dfe1e5]"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activeProfile ? "bg-[#1a73e8] text-white" : darkMode ? "bg-[#3c4043]" : "bg-[#f1f3f4]"}`}>
                      <ActiveAvatarIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">{activeProfile ? activeProfile.name : "Aucun profil"}</div>
                      <div className={`text-[12px] leading-4 ${muted}`}>Profil enregistré uniquement sur cet appareil.</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button type="button" onClick={openProfileManager} className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-[14px] ${darkMode ? "border-[#5f6368] hover:bg-white/10" : "border-[#dfe1e5] hover:bg-[#f1f3f4]"}`}>
                      <Users className="h-4 w-4" /> Gérer le profil
                    </button>
                    <span className={`text-[12px] ${muted}`}>{Object.keys(profiles).length} profil{Object.keys(profiles).length > 1 ? "s" : ""} sur cet appareil</span>
                  </div>
                </div>

                <p className={`text-[12px] leading-5 ${muted}`}>Ces réglages, l’historique et les profils sont enregistrés uniquement dans ce navigateur.</p>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


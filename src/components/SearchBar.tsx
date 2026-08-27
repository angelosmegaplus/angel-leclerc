import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CornerDownLeft, Sparkles, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { askSiteAi } from "@/lib/site-search.functions";

type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
  keywords: string[];
};

const SEARCH_INDEX: SearchResult[] = [
  { title: "Accueil", description: "Angel Leclerc Communication — Conseil & Rédaction", href: "/", category: "Page", keywords: ["accueil", "angel", "leclerc", "communication", "conseil", "redaction", "home"] },
  { title: "Entreprise", description: "Services de communication, rédaction et conseil", href: "/entreprise", category: "Services", keywords: ["entreprise", "services", "communication", "redaction", "conseil", "tarifs", "tarif", "prix", "devis", "association", "reseaux sociaux", "site internet", "referencement"] },
  { title: "Mon parcours", description: "CV, expériences, formations, engagements", href: "/parcours", category: "Page", keywords: ["parcours", "cv", "experience", "formation", "diplome", "certification", "engagement", "cgt", "syndicat", "republique souveraine", "bts", "alternance"] },
  { title: "Blog", description: "Articles, analyses et réflexions", href: "/articles", category: "Contenu", keywords: ["blog", "article", "articles", "analyse", "reflexion", "societe", "politique", "actualite"] },
  { title: "Contact", description: "Échangez sur votre projet", href: "/contact", category: "Page", keywords: ["contact", "email", "mail", "message", "devis", "projet", "rendez vous", "appeler", "telephone"] },
  { title: "Mentions légales", description: "Informations légales du site", href: "/mentions-legales", category: "Légal", keywords: ["mentions", "legales", "legal", "editeur", "hebergeur", "siret"] },
  { title: "Politique de confidentialité", description: "RGPD et protection des données", href: "/politique-confidentialite", category: "Légal", keywords: ["confidentialite", "rgpd", "donnees", "cookies", "protection", "vie privee"] },
  { title: "Mes objectifs", description: "Projets et ambitions professionnelles", href: "/mes-objectifs", category: "Page", keywords: ["objectifs", "ambition", "projet", "avenir"] },
  { title: "Flamme", description: "Moteur de recherche et services", href: "/flamme", category: "Outil", keywords: ["flamme", "recherche", "moteur", "actus", "meteo", "forum", "radio", "tv"] },
  { title: "Espace admin", description: "Connexion à l'espace administrateur", href: "/auth", category: "Admin", keywords: ["admin", "auth", "connexion", "espace", "login", "angel os"] },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function scoreItem(item: SearchResult, tokens: string[]) {
  const haystackTitle = normalize(item.title);
  const haystackRest = normalize(`${item.description} ${item.category} ${item.keywords.join(" ")}`);
  let score = 0;
  for (const token of tokens) {
    if (haystackTitle.startsWith(token)) score += 6;
    else if (haystackTitle.includes(token)) score += 4;
    else if (haystackRest.includes(token)) score += 2;
    else return 0;
  }
  return score;
}

function JumpingDino() {
  return (
    <div className="flex flex-col items-center gap-1 py-8">
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        className="text-3xl select-none"
        aria-hidden="true"
      >
        🦖
      </motion.div>
      <span className="text-xs text-muted-foreground">Le dino cherche…</span>
    </div>
  );
}

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const openSearch = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebounced("");
    setLoading(false);
    setAiLoading(false);
    setAiAnswer(null);
    setAiError(null);
  }, []);

  // Débounce + petit délai pour laisser le dino sauter
  useEffect(() => {
    if (!query.trim()) {
      setDebounced("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setAiAnswer(null);
    setAiError(null);
    const timer = setTimeout(() => {
      setDebounced(query);
      setLoading(false);
      setActiveIndex(0);
    }, 380);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    const q = debounced.trim();
    if (!q) return [];
    const tokens = normalize(q).split(/\s+/).filter(Boolean);
    return SEARCH_INDEX
      .map((item) => ({ item, score: scoreItem(item, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [debounced]);

  const runAi = useCallback(async () => {
    const question = query.trim();
    if (!question) return;
    setAiLoading(true);
    setAiError(null);
    setAiAnswer(null);
    try {
      const response = await askSiteAi({ data: { question } });
      if (response.ok && response.text) setAiAnswer(response.text);
      else setAiError("L'IA n'est pas joignable pour le moment. Passez par la page Contact 🙂");
    } catch {
      setAiError("L'IA n'est pas joignable pour le moment. Passez par la page Contact 🙂");
    } finally {
      setAiLoading(false);
    }
  }, [query]);

  // Raccourci clavier global
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeSearch();
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    }
    if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIndex]) {
        navigate({ to: results[activeIndex].href });
        closeSearch();
      } else if (!loading && query.trim()) {
        void runAi();
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-label="Rechercher sur le site"
        className={`inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${compact ? "h-10 w-10 border-transparent bg-transparent" : "h-9 w-9 shrink-0"}`}
      >
        <Search size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-foreground/40 px-4 pt-20 backdrop-blur-sm sm:pt-28"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeSearch(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Recherche sur le site"
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="relative flex items-center border-b border-border">
                <Search size={18} className="pointer-events-none absolute left-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher une page, un service, un article…"
                  className="w-full bg-transparent py-4 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                  aria-label="Rechercher sur le site"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Fermer la recherche"
                  className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <JumpingDino />
                ) : !debounced.trim() ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">
                    Tapez un mot-clé : <span className="text-foreground">tarifs</span>, <span className="text-foreground">CV</span>, <span className="text-foreground">blog</span>, <span className="text-foreground">contact</span>…
                  </div>
                ) : results.length > 0 ? (
                  <ul className="py-1">
                    {results.map((result, i) => (
                      <li key={result.href}>
                        <Link
                          to={result.href}
                          onClick={closeSearch}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={`flex flex-col gap-0.5 px-4 py-3 transition-colors ${i === activeIndex ? "bg-primary/10" : "hover:bg-muted"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">{result.title}</span>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                              {result.category}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-1">{result.description}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Aucun résultat pour « {debounced} »
                    </p>
                    <button
                      type="button"
                      onClick={() => void runAi()}
                      disabled={aiLoading}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      Demander à l'IA 👀
                    </button>
                  </div>
                )}

                {(aiAnswer || aiError) && (
                  <div className="border-t border-border bg-muted/40 px-4 py-4 text-left">
                    <div className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-primary">
                      <Sparkles size={12} /> Réponse de l'IA
                    </div>
                    <p className="whitespace-pre-line text-sm text-foreground">{aiAnswer ?? aiError}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-[0.7rem] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CornerDownLeft size={11} /> Entrée · ↑↓ naviguer · Échap fermer</span>
                <span className="hidden sm:inline">⌘K / Ctrl+K</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

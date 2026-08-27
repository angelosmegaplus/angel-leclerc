import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CornerDownLeft } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
  keywords: string[];
};

const SEARCH_INDEX: SearchResult[] = [
  { title: "Accueil", description: "Angel Leclerc Communication — Conseil & Rédaction", href: "/", category: "Page", keywords: ["accueil", "angel", "leclerc", "communication", "conseil", "redaction"] },
  { title: "Entreprise", description: "Services de communication, rédaction et conseil", href: "/entreprise", category: "Services", keywords: ["entreprise", "services", "communication", "redaction", "conseil", "tarifs", "prix"] },
  { title: "Mon parcours", description: "CV, expériences, formations, engagements", href: "/parcours", category: "Page", keywords: ["parcours", "cv", "experience", "formation", "diplome", "engagement", "cgt", "republique souveraine"] },
  { title: "Blog", description: "Articles, analyses et réflexions", href: "/articles", category: "Contenu", keywords: ["blog", "article", "articles", "analyse", "reflexion", "societe", "politique"] },
  { title: "Contact", description: "Échangez sur votre projet", href: "/contact", category: "Page", keywords: ["contact", "email", "message", "devis", "projet"] },
  { title: "Mentions légales", description: "Informations légales du site", href: "/mentions-legales", category: "Légal", keywords: ["mentions", "legales", "legal", "editeur", "hebergeur"] },
  { title: "Politique de confidentialité", description: "RGPD et protection des données", href: "/politique-confidentialite", category: "Légal", keywords: ["confidentialite", "rgpd", "donnees", "cookies", "protection"] },
  { title: "Mes objectifs", description: "Projets et ambitions professionnelles", href: "/mes-objectifs", category: "Page", keywords: ["objectifs", "ambition", "projet", "bts", "communication", "alternance"] },
  { title: "Flamme", description: "Moteur de recherche et services", href: "/flamme", category: "Outil", keywords: ["flamme", "recherche", "moteur", "actus", "meteo", "forum"] },
  { title: "Espace admin", description: "Connexion à l'espace administrateur", href: "/auth", category: "Admin", keywords: ["admin", "auth", "connexion", "espace", "login"] },
];

function JumpingDino() {
  return (
    <div className="flex flex-col items-center gap-1 py-6">
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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ouvrir / fermer
  const openSearch = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
  }, []);

  // Recherche avec délai simulé pour afficher le dino
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const q = query.toLowerCase().trim();
      const matched = SEARCH_INDEX.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q)) ||
        item.category.toLowerCase().includes(q)
      );
      setResults(matched);
      setLoading(false);
      setActiveIndex(0);
    }, 450);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Navigation au clavier
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
    if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      navigate({ to: results[activeIndex].href });
      closeSearch();
    }
  };

  // Bouton déclencheur (loupe)
  if (!open) {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label="Rechercher sur le site"
        className={`inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${compact ? "h-10 w-10 border-transparent bg-transparent" : "h-9 w-9 shrink-0"}`}
      >
        <Search size={20} />
      </button>
    );
  }

  return (
    <div className="relative flex items-center">
      {/* Champ de recherche */}
      <div className="relative flex items-center">
        <Search size={16} className="pointer-events-none absolute left-3 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher…"
          className="w-40 rounded-full border border-border bg-card py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-56"
          aria-label="Rechercher sur le site"
        />
        <button
          type="button"
          onClick={closeSearch}
          aria-label="Fermer la recherche"
          className="absolute right-2.5 text-muted-foreground hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>

      {/* Dropdown des résultats */}
      <AnimatePresence>
        {(query.trim() || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:w-80"
          >
            {loading ? (
              <JumpingDino />
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Aucun résultat pour « {query} »
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((result, i) => (
                  <li key={result.href}>
                    <Link
                      to={result.href}
                      onClick={closeSearch}
                      className={`flex flex-col gap-0.5 px-4 py-2.5 transition-colors ${i === activeIndex ? "bg-primary/10" : "hover:bg-muted"}`}
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
            )}
            {!loading && results.length > 0 && (
              <div className="border-t border-border px-4 py-2 text-[0.7rem] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CornerDownLeft size={11} /> Entrée pour ouvrir · ↑↓ naviguer · Échap fermer</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CornerDownLeft, Sparkles, Loader2, FileText, Image as ImageIcon, Film, File } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { askSiteAi } from "@/lib/site-search.functions";
import { PUBLIC_ASSETS } from "@/lib/public-assets.generated";

type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
  keywords: string[];
  external?: boolean;
};

const PAGE_INDEX: SearchResult[] = [
  { title: "Accueil", description: "Angel Leclerc Communication — Conseil & Rédaction", href: "/", category: "Page", keywords: ["accueil", "angel", "leclerc", "communication", "conseil", "redaction", "home"] },
  { title: "Entreprise", description: "Services de communication, rédaction et conseil", href: "/entreprise", category: "Services", keywords: ["entreprise", "services", "communication", "redaction", "conseil", "tarifs", "tarif", "prix", "devis", "association", "reseaux sociaux", "site internet", "referencement"] },
  { title: "Mon parcours", description: "CV, expériences, formations, engagements", href: "/parcours", category: "Page", keywords: ["parcours", "cv", "experience", "formation", "diplome", "certification", "engagement", "cgt", "syndicat", "republique souveraine", "bts", "alternance", "talis", "ibsac"] },
  { title: "Expériences", description: "Détail des expériences professionnelles", href: "/experiences", category: "Page", keywords: ["experiences", "emploi", "stage", "mission", "poste"] },
  { title: "Accueil client externalisé", description: "Permanence téléphonique et accueil client, dès 39 €/mois", href: "/accueil-client", category: "Services", keywords: ["accueil", "client", "permanence", "telephonique", "appel", "appels", "secretariat", "standard", "perigord"] },
  { title: "Blog", description: "Articles, analyses et réflexions", href: "/articles", category: "Contenu", keywords: ["blog", "article", "articles", "analyse", "reflexion", "societe", "politique", "actualite"] },
  { title: "Contact", description: "Échangez sur votre projet", href: "/contact", category: "Page", keywords: ["contact", "email", "mail", "message", "devis", "projet", "rendez vous", "appeler", "telephone"] },
  { title: "Mentions légales", description: "Informations légales du site", href: "/mentions-legales", category: "Légal", keywords: ["mentions", "legales", "legal", "editeur", "hebergeur", "siret"] },
  { title: "Politique de confidentialité", description: "RGPD et protection des données", href: "/politique-confidentialite", category: "Légal", keywords: ["confidentialite", "rgpd", "donnees", "protection", "vie privee"] },
  { title: "Politique de cookies", description: "Usage des cookies sur le site", href: "/politique-cookies", category: "Légal", keywords: ["cookies", "traceurs", "consentement"] },
  { title: "Conditions d'utilisation", description: "Conditions générales du site", href: "/conditions-utilisation", category: "Légal", keywords: ["conditions", "cgu", "utilisation"] },
  { title: "Mes objectifs", description: "Projets et ambitions professionnelles", href: "/mes-objectifs", category: "Page", keywords: ["objectifs", "ambition", "projet", "avenir"] },
  { title: "Flamme", description: "Moteur de recherche et services", href: "/flamme", category: "Outil", keywords: ["flamme", "recherche", "moteur", "actus", "meteo", "forum", "radio", "tv"] },
  { title: "Espace admin", description: "Connexion à l'espace administrateur", href: "/auth", category: "Admin", keywords: ["admin", "auth", "connexion", "espace", "login", "angel os"] },
];

const ASSET_INDEX: SearchResult[] = PUBLIC_ASSETS.map((asset) => ({
  title: asset.title,
  description: `Fichier public · ${asset.href}`,
  href: asset.href,
  category: asset.kind,
  keywords: asset.keywords,
  external: true,
}));


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

function CategoryIcon({ category }: { category: string }) {
  const props = { size: 14, className: "shrink-0 text-muted-foreground" } as const;
  if (category === "Document") return <FileText {...props} />;
  if (category === "Image") return <ImageIcon {...props} />;
  if (category === "Vidéo") return <Film {...props} />;
  if (category === "Fichier") return <File {...props} />;
  return null;
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
  const [articleIndex, setArticleIndex] = useState<SearchResult[]>([]);
  const articlesLoaded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Index des articles publiés, chargé une seule fois à la première ouverture
  useEffect(() => {
    if (!open || articlesLoaded.current) return;
    articlesLoaded.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const { fetchPublishedArticles } = await import("@/lib/articles");
        const articles = await fetchPublishedArticles();
        if (cancelled) return;
        setArticleIndex(
          articles.map((article) => ({
            title: article.title,
            description: (article.excerpt ?? "").slice(0, 140) || "Article du blog",
            href: `/articles/${article.slug}`,
            category: "Article",
            keywords: [
              ...(Array.isArray(article.topics) ? article.topics : []),
              ...(Array.isArray(article.badges) ? article.badges : []),
              article.category ?? "",
              article.slug ?? "",
            ]
              .filter((value): value is string => typeof value === "string" && value.length > 0)
              .map((value) => normalize(value)),

            external: true,
          })),
        );
      } catch {
        /* index d'articles indisponible : la recherche reste fonctionnelle */
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

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
    const boost: Record<string, number> = { Page: 3, Services: 3, Contenu: 2, Article: 2, Légal: 1, Outil: 1, Admin: 0 };
    return [...PAGE_INDEX, ...articleIndex, ...ASSET_INDEX]
      .map((item) => ({ item, score: scoreItem(item, tokens) + (boost[item.category] ?? 0) }))
      .filter((entry) => entry.score > (boost[entry.item.category] ?? 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((entry) => entry.item);
  }, [debounced, articleIndex]);


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

  // Blocage du défilement de la page quand la recherche est ouverte
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

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
        const target = results[activeIndex];
        if (target.external) window.location.href = target.href;
        else navigate({ to: target.href });

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

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 top-16 z-[100] flex items-center justify-center bg-foreground/45 p-3 sm:p-6"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeSearch(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Recherche sur le site"
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.72 }}
              className="flex h-[calc(100%-1.5rem)] max-h-[760px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:h-[min(78vh,760px)]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-center gap-3 border-b border-border p-3 sm:p-5">
                <div className="relative flex min-w-0 flex-1 items-center overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary/30">
                  <Search size={19} className="pointer-events-none absolute left-4 text-primary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Que recherchez-vous ?"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  className="w-full bg-transparent py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:py-5 sm:text-lg"
                  aria-label="Rechercher sur le site"
                />
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Fermer la recherche"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

                {loading ? (
                  <JumpingDino />
                ) : !debounced.trim() ? (
                    <div className="px-5 py-8 text-sm text-muted-foreground sm:px-8 sm:py-10">
                    Tapez un mot-clé : <span className="text-foreground">tarifs</span>, <span className="text-foreground">CV</span>, <span className="text-foreground">blog</span>, <span className="text-foreground">contact</span>…
                  </div>
                ) : results.length > 0 ? (
                  <ul className="grid gap-1 p-2 sm:grid-cols-2 sm:p-4">
                    {results.map((result, i) => {
                      const inner = (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2">
                              <CategoryIcon category={result.category} />
                              <span className="truncate text-sm font-medium text-foreground">{result.title}</span>
                            </span>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                              {result.category}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-1">{result.description}</span>
                        </>
                      );
                      const className = `flex min-h-[64px] flex-col justify-center gap-1 rounded-2xl px-4 py-3 transition-colors active:bg-primary/15 ${i === activeIndex ? "bg-primary/10" : "hover:bg-muted"}`;
                      return (
                        <motion.li
                          key={`${result.category}-${result.href}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.16, delay: Math.min(i, 8) * 0.02 }}
                        >
                          {result.external ? (
                            <a
                              href={result.href}
                              onClick={closeSearch}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={className}
                            >
                              {inner}
                            </a>
                          ) : (
                            <Link
                              to={result.href}
                              onClick={closeSearch}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={className}
                            >
                              {inner}
                            </Link>
                          )}
                        </motion.li>
                      );

                    })}
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

              <div className="hidden shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-2 text-[0.7rem] text-muted-foreground sm:flex">
                <span className="inline-flex items-center gap-1"><CornerDownLeft size={11} /> Entrée · ↑↓ naviguer · Échap fermer</span>
                <span>⌘K / Ctrl+K</span>
              </div>
              <div className="h-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0 sm:hidden" />

            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, MessageCircle, Briefcase, PenLine, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "alc-promo-banner-dismissed";
const SHOW_DELAY = 2200; // ms après le chargement
const ROTATE_INTERVAL = 3500; // ms entre chaque message

/**
 * Bannière promotionnelle animée (façon pub Google) : messages qui défilent,
 * encourage à faire appel aux services et à discuter avec l'IA sur la page contact.
 * Fermable, persiste le refus en localStorage.
 */
const MESSAGES = [
  {
    icon: Briefcase,
    accent: "Conseil en communication",
    text: "Donnons du souffle à votre projet — stratégie, identité, déploiement.",
  },
  {
    icon: PenLine,
    accent: "Rédaction & contenus",
    text: "Articles, sites web, réseaux sociaux : vos idées, bien écrites.",
  },
  {
    icon: MessageCircle,
    accent: "Discutez avec mon IA",
    text: "Posez vos questions, Explorez vos options — un assistant vous répond.",
  },
  {
    icon: Sparkles,
    accent: "Méthode en 4 étapes",
    text: "Écoute, stratégie, création, suivi — un accompagnement sur mesure.",
  },
];

export function PromoBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* localStorage indisponible */
    }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY);
    return () => clearTimeout(t);
  }, []);

  // Rotation des messages
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(t);
  }, [visible]);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (dismissed) return null;

  const current = MESSAGES[index]!;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden border-b border-primary/20 bg-primary/10 backdrop-blur-sm"
          role="status"
        >
          {/* Barre de progression animée (style pub Google) */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/10">
            <motion.div
              key={index}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: ROTATE_INTERVAL / 1000, ease: "linear" }}
              className="h-full bg-primary"
            />
          </div>

          <div className="container-tight flex items-center gap-3 py-2">
            {/* Icône animée qui change */}
            <span className="hidden shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary sm:flex">
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
                  transition={{ duration: 0.3 }}
                  className="flex"
                >
                  <current.icon className="h-4 w-4" />
                </motion.span>
              </AnimatePresence>
            </span>

            {/* Texte rotatif */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={index}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="text-xs leading-snug text-foreground/90 sm:text-sm"
                >
                  <span className="font-semibold text-primary">{current.accent}</span>{" "}
                  {current.text}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Indicateurs de progression (points) */}
            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              {MESSAGES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-4 bg-primary" : "w-1.5 bg-primary/30"
                  }`}
                />
              ))}
            </div>

            <Link
              to="/contact"
              onClick={dismiss}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span className="hidden sm:inline">Parler de votre projet</span>
              <span className="sm:hidden">Contact</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer la bannière"
              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Bouton rotation manuelle discret */}
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % MESSAGES.length)}
            aria-label="Message suivant"
            className="absolute right-8 top-1 hidden rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-primary sm:block"
            style={{ top: 2 }}
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

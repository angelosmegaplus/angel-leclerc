import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "alc-promo-banner-dismissed";
const SHOW_DELAY = 2500; // ms après le chargement

/**
 * Bannière promotionnelle discrète : s'affiche sous le header après un court
 * délai, encourage à faire appel aux services. Fermable, persiste le refus
 * en localStorage pour ne pas réapparaître à chaque visite.
 */
export function PromoBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* localStorage indisponible */
    }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY);
    return () => clearTimeout(t);
  }, []);

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-b border-primary/20 bg-primary/10 backdrop-blur-sm"
          role="status"
        >
          <div className="container-tight flex items-center gap-3 py-2">
            <span className="hidden shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary sm:flex">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="flex-1 text-xs leading-snug text-foreground/90 sm:text-sm">
              <span className="font-semibold text-primary">Besoin d’un coup de pro ?</span>{" "}
              Conseil en communication, rédaction et gestion de projet — premier échange gratuit.
            </p>
            <Link
              to="/contact"
              onClick={dismiss}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Parler de votre projet
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

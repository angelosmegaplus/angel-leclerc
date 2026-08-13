import { useEffect, useState } from "react";
import { GraduationCap, Moon, Sun } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useThemePreference } from "@/components/ThemeController";

export function ApprenticeshipBanner() {
  const { preference, setPreference } = useThemePreference();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncResolvedTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    syncResolvedTheme();
    media.addEventListener("change", syncResolvedTheme);
    window.addEventListener("alc-theme-change", syncResolvedTheme);

    return () => {
      media.removeEventListener("change", syncResolvedTheme);
      window.removeEventListener("alc-theme-change", syncResolvedTheme);
    };
  }, [preference]);

  const toggleTheme = () => {
    setPreference(isDark ? "light" : "dark");
    setIsDark(!isDark);
  };

  return (
    <div className="w-full bg-muted/60 text-foreground transition-colors hover:bg-muted">
      <div className="container-tight flex items-center justify-center gap-2 py-1.5 text-xs">
        <Link
          to="/parcours"
          className="flex min-w-0 items-center justify-center gap-2"
        >
          <GraduationCap size={14} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="font-medium">
            BTS Communication en alternance — je recherche une entreprise
          </span>
          <span className="hidden sm:inline text-muted-foreground">
            · communication majoritaire (ex. 60 % com / 40 % vente)
          </span>
          <span aria-hidden="true">→</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/50 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          {isDark ? <Moon size={12} aria-hidden="true" /> : <Sun size={12} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

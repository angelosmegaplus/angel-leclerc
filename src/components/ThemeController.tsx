import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyTheme,
  readPreference,
  setPreference,
  type ThemePreference,
} from "@/lib/theme";

/** Suit automatiquement le thème du système et réagit en direct à ses changements. */
export function useThemePreference() {
  const [preference, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    const initial = readPreference();
    setPref(initial);
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (readPreference() === "system") applyTheme("system");
    };
    media.addEventListener("change", onSystemChange);

    const onManualChange = (e: Event) =>
      setPref((e as CustomEvent<ThemePreference>).detail ?? readPreference());
    window.addEventListener("alc-theme-change", onManualChange);

    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("alc-theme-change", onManualChange);
    };
  }, []);

  const update = useCallback((next: ThemePreference) => {
    setPref(next);
    setPreference(next);
  }, []);

  return { preference, setPreference: update };
}

/** Monté une fois à la racine : garde l'app synchronisée avec le thème de l'appareil. */
export function ThemeSync() {
  useThemePreference();
  return null;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { preference, setPreference: choose } = useThemePreference();
  const systemDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = preference === "dark" || (preference === "system" && systemDark);
  const next: ThemePreference = isDark ? "light" : "dark";
  const label = isDark ? "Passer en mode clair" : "Passer en mode sombre";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => choose(next)}
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition-colors hover:bg-muted ${className}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

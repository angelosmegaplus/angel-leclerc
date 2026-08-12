import { useCallback, useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
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

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "system", label: "Système", icon: Monitor },
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
];

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { preference, setPreference: choose } = useThemePreference();

  return (
    <div
      role="group"
      aria-label="Apparence"
      className={`inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-white/5 p-0.5 ${className}`}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            title={label}
            onClick={() => choose(value)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              active ? "bg-white/20 text-white" : "text-white/55 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

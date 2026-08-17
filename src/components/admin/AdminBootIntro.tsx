import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { SystemBootExperience } from "@/components/angel-os/SystemBootExperience";
import "./admin-light.css";

export const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";
const ADMIN_THEME_KEY = "angel-os:admin-theme";

type AdminTheme = "light" | "dark";

function hasPendingBoot() {
  try {
    return window.sessionStorage.getItem(ADMIN_BOOT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function consumePendingBoot() {
  try {
    window.sessionStorage.removeItem(ADMIN_BOOT_PENDING_KEY);
  } catch {
    /* stockage indisponible */
  }
}

function readAdminTheme(): AdminTheme {
  try {
    return window.localStorage.getItem(ADMIN_THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyAdminTheme(theme: AdminTheme) {
  const root = document.documentElement;
  const dark = theme === "dark";
  root.classList.toggle("admin-light", !dark);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function AdminBootIntro() {
  const [visible, setVisible] = useState(false);
  const [theme, setTheme] = useState<AdminTheme>("light");

  useEffect(() => {
    const initialTheme = readAdminTheme();
    setTheme(initialTheme);

    // AdminShell appliquait historiquement le sombre au montage. L'application
    // différée garantit que la préférence admin gagne toujours, sans flash durable.
    const frame = window.requestAnimationFrame(() => applyAdminTheme(initialTheme));

    if (hasPendingBoot()) {
      consumePendingBoot();
      setVisible(true);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      document.documentElement.classList.remove("admin-light");
    };
  }, []);

  const toggleTheme = () => {
    const next: AdminTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      window.localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      /* le choix reste actif pour la session */
    }
    applyAdminTheme(next);
  };

  return (
    <>
      {visible ? (
        <SystemBootExperience done={() => setVisible(false)} label="Démarrage de l'espace administrateur Angel OS" />
      ) : null}
      <button
        type="button"
        onClick={toggleTheme}
        className="admin-theme-toggle"
        title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </>
  );
}

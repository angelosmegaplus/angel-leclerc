import { useEffect, useState } from "react";
import { SystemBootExperience } from "@/components/angel-os/SystemBootExperience";
import { applyAdminTheme, readAdminTheme } from "@/lib/admin-theme";
import "./admin-light.css";

export const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";

function hasPendingBoot() {
  if (typeof window === "undefined") return false;
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

export function AdminBootIntro() {
  // Important : lire l'indicateur au premier rendu client. L'ancienne version
  // attendait useEffect et laissait donc le dashboard apparaître une frame avant le boot.
  const [visible, setVisible] = useState(() => hasPendingBoot());

  useEffect(() => {
    // Le thème est piloté par AdminShell ; on l'applique aussi ici pour que
    // l'écran de démarrage soit déjà dans la bonne teinte.
    applyAdminTheme(readAdminTheme());
    if (hasPendingBoot()) consumePendingBoot();
  }, []);

  return (
    <>
      {visible ? (
        <SystemBootExperience done={() => setVisible(false)} label="Démarrage de l'espace administrateur Angel OS" />
      ) : null}
    </>
  );
}

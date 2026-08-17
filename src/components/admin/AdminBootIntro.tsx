import { useEffect, useState } from "react";
import { SystemBootExperience } from "@/components/angel-os/SystemBootExperience";

export const ADMIN_BOOT_PENDING_KEY = "angel-os:admin-boot-pending";

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

export function AdminBootIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasPendingBoot()) return;
    consumePendingBoot();
    setVisible(true);
  }, []);

  if (!visible) return null;

  return <SystemBootExperience done={() => setVisible(false)} label="Démarrage de l'espace administrateur Angel OS" />;
}

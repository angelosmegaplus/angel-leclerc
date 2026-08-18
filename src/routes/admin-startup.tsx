import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SystemBootExperience } from "@/components/angel-os/SystemBootExperience";
import { useAuth } from "@/hooks/useAuth";

export const ADMIN_STARTUP_TICKET = "angel-os:admin-startup-ticket";

export const Route = createFileRoute("/admin-startup")({
  head: () => ({
    meta: [
      { title: "Démarrage Angel OS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminStartupPage,
});

function readTicket() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(ADMIN_STARTUP_TICKET) === "1";
  } catch {
    return false;
  }
}

function consumeTicket() {
  try {
    window.sessionStorage.removeItem(ADMIN_STARTUP_TICKET);
  } catch {
    // Session storage unavailable: navigation still remains protected by auth.
  }
}

function AdminStartupPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [ticket] = useState(() => readTicket());

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin || !ticket) {
      void navigate({ to: session && isAdmin ? "/admin" : "/auth" });
    }
  }, [loading, session, isAdmin, ticket, navigate]);

  if (loading || !session || !isAdmin || !ticket) {
    return <div className="fixed inset-0 z-[9999] bg-black" aria-label="Vérification du démarrage Angel OS" />;
  }

  return (
    <SystemBootExperience
      label="Démarrage de l'espace administrateur Angel OS"
      done={() => {
        consumeTicket();
        void navigate({ to: "/admin" });
      }}
    />
  );
}

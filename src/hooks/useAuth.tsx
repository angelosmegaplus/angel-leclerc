import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getFreshSupabaseSession, supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAdminRole(next: Session | null) {
      if (!active) return;
      setSession(next);
      if (!next) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", next.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      setIsAdmin(Boolean(data));
      setLoading(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      window.setTimeout(() => void loadAdminRole(next), 0);
    });

    void getFreshSupabaseSession()
      .then((freshSession) => loadAdminRole(freshSession))
      .catch(() => loadAdminRole(null));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading || !session || isAdmin || typeof window === "undefined") return;
    if (window.location.pathname !== "/auth") return;
    const next = new URLSearchParams(window.location.search).get("next");
    if (!next || !next.startsWith("/") || next.startsWith("//")) return;
    window.location.replace(next);
  }, [isAdmin, loading, session]);

  return { session, user: session?.user ?? null, isAdmin, loading };
}

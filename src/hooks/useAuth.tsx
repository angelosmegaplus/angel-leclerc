import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAngelIdentityToken, clearAngelIdentityToken } from "@/lib/angel-auth-client";
import { readAngelIdentitySession } from "@/lib/angel-identity-session.functions";

type NativeSession = {
  provider: "angel-identity";
  expires_at: string;
  user: { id: string; email: string; role: string };
};

type AuthSession = Session | NativeSession;

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const nativeToken = getAngelIdentityToken();
      if (nativeToken) {
        try {
          const native = await readAngelIdentitySession();
          if (active && native?.user) {
            setSession({
              provider: "angel-identity",
              expires_at: native.expiresAt,
              user: native.user,
            });
            setIsAdmin(native.user.role === "admin");
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to Supabase compatibility mode.
        }
        clearAngelIdentityToken();
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (!data.session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      setIsAdmin(Boolean(role));
      setLoading(false);
    }

    void load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (!getAngelIdentityToken()) void load();
    });
    const onNativeChange = () => void load();
    window.addEventListener("angel-identity-change", onNativeChange);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("angel-identity-change", onNativeChange);
    };
  }, []);

  return { session, user: session?.user ?? null, isAdmin, loading };
}

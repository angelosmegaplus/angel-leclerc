import { useEffect, useState } from "react";
import { getAngelIdentityToken, clearAngelIdentityToken } from "@/lib/angel-auth-client";
import { readAngelIdentitySession } from "@/lib/angel-identity-session.functions";

type AuthSession = {
  provider: "angel-identity";
  expires_at: string;
  user: { id: string; email: string; role: string };
};

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const nativeToken = getAngelIdentityToken();
      if (!nativeToken) {
        if (active) {
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        const native = await readAngelIdentitySession();
        if (!active) return;
        if (native?.user) {
          setSession({
            provider: "angel-identity",
            expires_at: native.expiresAt,
            user: native.user,
          });
          setIsAdmin(native.user.role === "admin");
        } else {
          clearAngelIdentityToken();
          setSession(null);
          setIsAdmin(false);
        }
      } catch {
        clearAngelIdentityToken();
        if (active) {
          setSession(null);
          setIsAdmin(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    const onNativeChange = () => void load();
    window.addEventListener("angel-identity-change", onNativeChange);

    return () => {
      active = false;
      window.removeEventListener("angel-identity-change", onNativeChange);
    };
  }, []);

  return { session, user: session?.user ?? null, isAdmin, loading };
}

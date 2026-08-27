import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { verifyTurnstileToken } from "@/lib/turnstile.functions";

const SITE_KEY = "0x4AAAAAAEduxbWEOvf2WOuE";
const STORAGE_KEY = "alc-human-check";
const VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
          language?: string;
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

function hasValidPass(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < VALIDITY_MS;
  } catch {
    return false;
  }
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script")));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset["turnstile"] = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("script"));
    document.head.appendChild(script);
  });
}

export function HumanCheckGate({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const [status, setStatus] = useState<"checking" | "challenge" | "verifying" | "passed" | "error">("checking");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    if (disabled) {
      setStatus("passed");
      return;
    }
    setStatus(hasValidPass() ? "passed" : "challenge");
  }, [disabled]);

  const onToken = useCallback(async (token: string) => {
    setStatus("verifying");
    try {
      const result = await verifyTurnstileToken({ data: { token } });
      if (result.ok) {
        try {
          window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          /* stockage indisponible */
        }
        setStatus("passed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (status !== "challenge") return;
    let cancelled = false;

    void loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        containerRef.current.innerHTML = "";
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: "auto",
          language: "fr",
          callback: (token) => void onToken(token),
          "error-callback": () => setStatus("error"),
          "expired-callback": () => setStatus("challenge"),
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetRef.current);
        } catch {
          /* widget déjà retiré */
        }
        widgetRef.current = null;
      }
    };
  }, [status, onToken]);

  if (status === "passed") return <>{children}</>;

  const robots = ["🤖", "👾", "🔋", "🛸", "⚙️"];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* petits robots flottants en fond */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {robots.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute select-none text-3xl opacity-[0.12] sm:text-4xl"
            style={{ left: `${(i * 19 + 8) % 90}%`, top: `${(i * 27 + 15) % 80}%` }}
            animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-sm"
      >
        <motion.div
          className="mx-auto mb-4 text-6xl"
          aria-hidden="true"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          👾
        </motion.div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Oups… il faut qu’on vérifie que tu n’es pas un robot
        </h1>

        <div className="mt-6 flex min-h-[70px] items-center justify-center">
          <AnimatePresence mode="wait">
            {status === "checking" || status === "verifying" ? (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
                role="status"
              >
                {status === "verifying" ? "Vérification en cours…" : "Chargement…"}
              </motion.p>
            ) : (
              <motion.div
                key="widget"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                ref={containerRef}
              />
            )}
          </AnimatePresence>
        </div>

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <p className="text-sm text-destructive">La vérification n’a pas abouti. Réessayons.</p>
            <button
              type="button"
              onClick={() => setStatus("challenge")}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Réessayer
            </button>
          </motion.div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Protégé par Cloudflare Turnstile — sans cookie publicitaire ni pistage.
        </p>
      </motion.div>
    </div>
  );
}

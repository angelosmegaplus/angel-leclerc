import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";

export type CaptchaValue = { token: string; answer: string };

type Props = {
  value: CaptchaValue;
  onChange: (value: CaptchaValue) => void;
  error?: string | undefined;
};

const SITE_KEY = "6LdQwYMtAAAAAPrqj0Z_p5xtaSn-dHchUbucDlwa";
const SCRIPT_ID = "google-recaptcha-script";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

/** Google reCAPTCHA, validé côté serveur avant toute action protégée. */
export function Captcha({ onChange, error }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.grecaptcha || widgetIdRef.current !== null)
        return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onChange({ token, answer: "verified" }),
        "expired-callback": () => onChange({ token: "", answer: "" }),
        "error-callback": () => onChange({ token: "", answer: "" }),
      });
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (window.grecaptcha) {
      renderWidget();
    } else if (existing) {
      existing.addEventListener("load", renderWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      document.head.appendChild(script);
    }

    onChange({ token: "", answer: "" });

    return () => {
      cancelled = true;
      if (existing) existing.removeEventListener("load", renderWidget);
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          // Le widget peut déjà avoir été retiré du DOM.
        }
      }
      widgetIdRef.current = null;
    };
  }, [onChange]);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" /> Vérification anti-robot
      </p>
      <div ref={containerRef} className="min-h-[78px] overflow-hidden" />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

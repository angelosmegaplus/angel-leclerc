import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  CATEGORY_INFO,
  DEFAULT_CONSENT,
  readConsent,
  writeConsent,
  type ConsentCategory,
} from "@/lib/cookie-consent";

const ALL_ON: Record<ConsentCategory, boolean> = {
  necessary: true,
  audience: true,
  personalisation: true,
  embeds: true,
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [choices, setChoices] = useState<Record<ConsentCategory, boolean>>(DEFAULT_CONSENT);

  const openPanel = useCallback((withDetails: boolean) => {
    const existing = readConsent();
    setChoices(existing ? existing.categories : DEFAULT_CONSENT);
    setDetails(withDetails);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!readConsent()) openPanel(false);
    const onOpen = () => openPanel(true);
    window.addEventListener("alc-consent-open", onOpen);
    return () => window.removeEventListener("alc-consent-open", onOpen);
  }, [openPanel]);

  if (!visible) return null;

  const save = (categories: Record<ConsentCategory, boolean>) => {
    writeConsent(categories);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 sm:left-3 sm:right-auto sm:max-w-md"
    >
      <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-lg">
        <p className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
          <Cookie size={16} className="text-primary" aria-hidden />
          Cookies et données de navigation
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Ce site utilise des cookies strictement nécessaires, ainsi que des mesures
          d'audience internes et des contenus tiers uniquement si vous les acceptez.
          Rien n'est déposé avant votre choix.{" "}
          <Link
            to="/politique-cookies"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Politique des cookies
          </Link>
          .
        </p>

        {details && (
          <ul className="mt-3 space-y-3">
            {CATEGORY_INFO.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{c.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {c.purpose}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      Exemples : {c.examples} · Durée : {c.duration}
                    </p>
                  </div>
                  <Switch
                    checked={c.locked ? true : choices[c.id]}
                    disabled={c.locked ?? false}
                    aria-label={`Activer la catégorie ${c.label}`}
                    onCheckedChange={(v) =>
                      setChoices((prev) => ({ ...prev, [c.id]: v }))
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Button size="sm" onClick={() => save(ALL_ON)}>
            Tout accepter
          </Button>
          <Button size="sm" variant="outline" onClick={() => save(DEFAULT_CONSENT)}>
            Tout refuser
          </Button>
          {details ? (
            <Button size="sm" variant="outline" onClick={() => save(choices)}>
              Enregistrer mes choix
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setDetails(true)}>
              Personnaliser
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isStandalone } from "@/lib/pwa";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "angelos:install-dismissed:v2";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    if (Date.now() - at < DISMISS_FOR_MS) return true;
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    return false;
  }
  return false;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const ios = useMemo(() => isIosDevice(), []);

  useEffect(() => {
    setDismissed(wasDismissedRecently());
    setInstalled(isStandalone());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        // Stockage privé/indisponible : l'installation reste fonctionnelle.
      }
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showInstall = !installed && !dismissed && Boolean(deferred || ios);
  if (!showInstall) return null;

  return (
    <aside
      aria-label="Installer Angel OS"
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-red-500/15 bg-red-500/[.055] p-3 text-white shadow-[0_12px_35px_rgba(0,0,0,.24)] sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
          {ios && !deferred ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Installer Angel OS</p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/50">
            {ios && !deferred
              ? "Sur iPhone ou iPad : Partager → Sur l’écran d’accueil. Angel OS s’ouvrira ensuite comme une application."
              : "Installez le centre de contrôle : lancement plein écran, raccourci direct et navigation pensée pour le téléphone."}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        {deferred ? (
          <Button
            size="sm"
            className="min-h-11 rounded-xl bg-red-600 px-4 text-white hover:bg-red-500"
            onClick={async () => {
              await deferred.prompt();
              const choice = await deferred.userChoice;
              if (choice.outcome === "accepted") setInstalled(true);
              setDeferred(null);
            }}
          >
            Installer
          </Button>
        ) : null}
        <button
          type="button"
          aria-label="Masquer la proposition d'installation pendant une semaine"
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/50 transition hover:text-white"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, String(Date.now()));
            } catch {
              // Rien à faire : on masque seulement pour cette session.
            }
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

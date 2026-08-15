import { useEffect, useMemo, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isStandalone } from "@/lib/pwa";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "angelos:install-dismissed";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const ios = useMemo(() => isIosDevice(), []);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setInstalled(isStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
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
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/[.055] p-3 text-white shadow-[0_12px_35px_rgba(0,0,0,.24)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
        {ios && !deferred ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Installer Angel OS</p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/50">
          {ios && !deferred
            ? "Sur iPhone ou iPad : ouvrez Partager puis choisissez « Sur l’écran d’accueil »."
            : "Ajoutez le centre de contrôle à votre appareil pour un accès direct."}
        </p>
      </div>
      {deferred ? (
        <Button
          size="sm"
          className="min-h-10 shrink-0 rounded-xl bg-red-600 text-white hover:bg-red-500"
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
        aria-label="Masquer la proposition d'installation"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/50 transition hover:text-white"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

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

  if (installed || dismissed || (!deferred && !ios)) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
      {ios && !deferred ? (
        <Share className="h-5 w-5 shrink-0 text-primary" />
      ) : (
        <Download className="h-5 w-5 shrink-0 text-primary" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Installer Angel OS IA</p>
        <p className="text-xs text-muted-foreground">
          {ios && !deferred
            ? "Sur iPhone ou iPad : ouvrez le menu Partager puis choisissez « Sur l’écran d’accueil » pour installer Angel OS."
            : "Ajoutez le centre de contrôle à votre appareil avec le mécanisme d’installation du navigateur."}
        </p>
      </div>
      {deferred ? (
        <Button
          size="sm"
          className="min-h-10 shrink-0"
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
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
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

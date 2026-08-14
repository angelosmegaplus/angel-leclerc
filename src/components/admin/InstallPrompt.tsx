import { useEffect, useMemo, useState } from "react";
import { Download, Grid2X2, Search, Share, X } from "lucide-react";
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

function openAngelSearch() {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "k",
      code: "KeyK",
      ctrlKey: true,
      bubbles: true,
    }),
  );
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

  return (
    <>
      {showInstall ? (
        <div className="mb-4 flex items-center gap-3 rounded-[1.75rem] bg-[#d3e3fd] p-3 text-[#15345f] shadow-sm">
          {ios && !deferred ? <Share className="h-5 w-5 shrink-0" /> : <Download className="h-5 w-5 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Installer Angel OS</p>
            <p className="text-xs text-[#49617f]">
              {ios && !deferred
                ? "Sur iPhone ou iPad : ouvrez Partager puis choisissez « Sur l’écran d’accueil »."
                : "Ajoutez le centre de contrôle à votre appareil."}
            </p>
          </div>
          {deferred ? (
            <Button
              size="sm"
              className="min-h-10 shrink-0 rounded-full"
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
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#49617f] hover:bg-white/30"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setDismissed(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(.65rem+env(safe-area-inset-bottom))] z-40 flex justify-center lg:inset-x-auto lg:bottom-5 lg:left-1/2 lg:w-[min(720px,calc(100vw-3rem))] lg:-translate-x-1/2">
        <button
          type="button"
          onClick={openAngelSearch}
          className="pointer-events-auto flex h-16 w-full max-w-2xl items-center gap-3 rounded-full bg-[#eef3fb]/95 px-4 text-left text-[#3c4043] shadow-[0_6px_28px_rgba(60,64,67,.22)] backdrop-blur-xl transition-transform active:scale-[0.985]"
          aria-label="Rechercher dans Angel OS"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70">
            <Search className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#5f6368]">Rechercher dans Angel OS</span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d3e3fd] text-[#0b57d0]">
            <Grid2X2 className="h-5 w-5" />
          </span>
        </button>
      </div>
    </>
  );
}

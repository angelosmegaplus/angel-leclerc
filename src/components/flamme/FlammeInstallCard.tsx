import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, Download, Share, Smartphone } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  if (isIos) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function FlammeInstallCard({ darkMode }: { darkMode: boolean }) {
  const reduceMotion = useReducedMotion();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setPlatform(detectPlatform());
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const runInstall = async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
    } catch {
      setPromptEvent(null);
    }
  };

  const border = darkMode ? "border-[#5f6368]" : "border-[#dfe1e5]";
  const muted = darkMode ? "text-[#bdc1c6]" : "text-[#5f6368]";

  if (installed) {
    return (
      <div className={`mx-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] ${border} ${muted}`}>
        <Check className="h-4 w-4 text-[#188038]" />
        Flamme est installée.
      </div>
    );
  }

  const hint =
    platform === "ios"
      ? "Partager → Sur l’écran d’accueil"
      : platform === "android"
        ? "Menu ⋮ → Ajouter à l’écran d’accueil"
        : "Menu du navigateur → Installer Flamme";

  const HintIcon = platform === "ios" ? Share : platform === "android" ? Smartphone : ArrowDown;

  return (
    <div className={`mx-2 rounded-xl border px-3 py-2.5 ${border}`}>
      <div className="flex items-center gap-2.5">
        <motion.span
          aria-hidden="true"
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2372f]/12 text-[#e2372f]"
          animate={reduceMotion ? undefined : { y: [0, -2.5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {!reduceMotion && (
            <motion.span
              className="absolute inset-0 rounded-full border border-[#e2372f]/35"
              animate={{ scale: [1, 1.28, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <Download className="h-4 w-4" />
        </motion.span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">Installer Flamme</div>
          <div className={`text-[11px] leading-4 ${muted}`}>Accès direct depuis l’appareil, sans compte.</div>
        </div>
        {!reduceMotion && (
          <span className="flex shrink-0 items-center gap-[3px]" aria-hidden="true">
            {[0, 0.18, 0.36].map((delay) => (
              <motion.span
                key={delay}
                className="h-[4px] w-[4px] rounded-full bg-[#e2372f]/70"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.4, repeat: Infinity, delay, ease: "easeInOut" }}
              />
            ))}
          </span>
        )}
      </div>

      {promptEvent ? (
        <button
          type="button"
          onClick={runInstall}
          className="mt-2.5 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#e2372f] px-3 text-[13px] font-medium text-white"
        >
          <Download className="h-4 w-4" /> Installer Flamme
        </button>
      ) : (
        <div className={`mt-2 flex items-center gap-2 text-[11px] leading-4 ${muted}`}>
          <HintIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

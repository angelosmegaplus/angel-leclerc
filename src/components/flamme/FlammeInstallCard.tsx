import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Chrome,
  Compass,
  Download,
  Laptop,
  RotateCcw,
  Share,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type DeviceId = "android" | "ios" | "desktop";
type BrowserId = "chrome" | "samsung" | "edge" | "safari" | "firefox";

const DEVICES: Array<{ id: DeviceId; label: string; hint: string; icon: typeof Smartphone }> = [
  { id: "android", label: "Android", hint: "Téléphone ou tablette Android", icon: Smartphone },
  { id: "ios", label: "iPhone / iPad", hint: "Appareil Apple mobile", icon: Tablet },
  { id: "desktop", label: "PC / Mac / Linux", hint: "Ordinateur", icon: Laptop },
];

const BROWSERS: Record<DeviceId, Array<{ id: BrowserId; label: string; icon: typeof Chrome; recommended?: boolean }>> = {
  android: [
    { id: "chrome", label: "Chrome", icon: Chrome, recommended: true },
    { id: "samsung", label: "Samsung Internet", icon: Compass },
    { id: "edge", label: "Edge", icon: Compass },
    { id: "firefox", label: "Firefox / autre", icon: Compass },
  ],
  ios: [
    { id: "safari", label: "Safari", icon: Compass, recommended: true },
    { id: "chrome", label: "Chrome", icon: Chrome },
    { id: "firefox", label: "Firefox / autre", icon: Compass },
  ],
  desktop: [
    { id: "chrome", label: "Chrome", icon: Chrome, recommended: true },
    { id: "edge", label: "Edge", icon: Compass },
    { id: "safari", label: "Safari (Mac)", icon: Compass },
    { id: "firefox", label: "Firefox / autre", icon: Compass },
  ],
};

type Guide = { title: string; steps: string[]; note?: string };

function guideFor(device: DeviceId, browser: BrowserId): Guide {
  if (device === "android") {
    if (browser === "chrome")
      return {
        title: "Android · Chrome",
        steps: [
          "Ouvrez le menu ⋮ en haut à droite.",
          "Touchez « Installer l’application » (ou « Ajouter à l’écran d’accueil » selon la version).",
          "Confirmez avec « Installer ».",
          "Ouvrez Flamme depuis l’écran d’accueil.",
        ],
      };
    if (browser === "samsung")
      return {
        title: "Android · Samsung Internet",
        steps: [
          "Ouvrez le menu ☰ en bas à droite.",
          "Touchez « Ajouter la page à ».",
          "Choisissez « Écran d’accueil ».",
          "Confirmez avec « Ajouter ».",
        ],
      };
    if (browser === "edge")
      return {
        title: "Android · Edge",
        steps: [
          "Ouvrez le menu ⋯ en bas.",
          "Touchez « Ajouter au téléphone » ou « Ajouter à l’écran d’accueil ».",
          "Confirmez l’ajout.",
        ],
      };
    return {
      title: "Android · Firefox ou autre navigateur",
      steps: [
        "Ouvrez le menu du navigateur.",
        "Cherchez « Installer » ou « Ajouter à l’écran d’accueil ».",
        "Si l’option n’existe pas, ouvrez Flamme dans Chrome pour une vraie application.",
      ],
      note: "Certains navigateurs ne proposent qu’un simple raccourci, pas une installation complète.",
    };
  }

  if (device === "ios") {
    if (browser === "safari")
      return {
        title: "iPhone / iPad · Safari",
        steps: [
          "Touchez le bouton Partager (carré avec une flèche).",
          "Faites défiler et touchez « Sur l’écran d’accueil ».",
          "Activez « Ouvrir comme app web » si l’option est proposée.",
          "Touchez « Ajouter ».",
        ],
      };
    return {
      title: "iPhone / iPad · autre navigateur",
      steps: [
        "Ouvrez la même page Flamme dans Safari.",
        "Touchez le bouton Partager.",
        "Touchez « Sur l’écran d’accueil », puis « Ajouter ».",
      ],
      note: "Sur iOS, l’ajout comme application web se fait depuis Safari.",
    };
  }

  if (browser === "edge")
    return {
      title: "Ordinateur · Edge",
      steps: [
        "Ouvrez le menu ⋯ en haut à droite.",
        "Allez dans « Applications ».",
        "Cliquez sur « Installer ce site en tant qu’application ».",
        "Confirmez avec « Installer ».",
      ],
    };
  if (browser === "chrome")
    return {
      title: "Ordinateur · Chrome",
      steps: [
        "Regardez l’icône d’installation à droite de la barre d’adresse.",
        "Si elle est absente, ouvrez le menu ⋮ puis « Diffuser, enregistrer et partager ».",
        "Choisissez « Installer la page en tant qu’application ».",
        "Confirmez avec « Installer ».",
      ],
    };
  if (browser === "safari")
    return {
      title: "Mac · Safari",
      steps: [
        "Ouvrez le menu « Fichier ».",
        "Choisissez « Ajouter au Dock » si l’option est disponible.",
        "Sinon, enregistrez Flamme dans vos favoris.",
      ],
      note: "« Ajouter au Dock » existe sur les versions récentes de macOS.",
    };
  return {
    title: "Ordinateur · Firefox ou autre",
    steps: [
      "Ajoutez Flamme à vos favoris (Ctrl/Cmd + D).",
      "Ou créez un raccourci sur le bureau depuis le navigateur.",
      "Pour une vraie application, ouvrez Flamme dans Chrome, Edge ou Safari.",
    ],
    note: "L’installation d’application web n’est pas disponible partout.",
  };
}

function detectDevice(): DeviceId {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  if (isIos) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function detectBrowser(device: DeviceId): BrowserId {
  if (typeof navigator === "undefined") return "chrome";
  const ua = navigator.userAgent || "";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox|FxiOS/i.test(ua)) return "firefox";
  if (/CriOS|Chrome/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua)) return device === "desktop" || device === "ios" ? "safari" : "chrome";
  return device === "ios" ? "safari" : "chrome";
}

export function FlammeInstallCard({ darkMode, compact = false }: { darkMode: boolean; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [browser, setBrowser] = useState<BrowserId>("chrome");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const detected = detectDevice();
    setDevice(detected);
    setBrowser(detectBrowser(detected));
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
      setWizardOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!wizardOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWizardOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wizardOpen]);

  const guide = useMemo(() => guideFor(device, browser), [device, browser]);

  const border = darkMode ? "border-[#5f6368]" : "border-[#dfe1e5]";
  const muted = darkMode ? "text-[#bdc1c6]" : "text-[#5f6368]";
  const surface = darkMode ? "bg-[#202124] text-[#e8eaed]" : "bg-white text-[#202124]";
  const option = (active: boolean) =>
    active
      ? "border-[#e2372f] bg-[#e2372f]/10 text-[#e2372f]"
      : darkMode
        ? "border-[#5f6368] hover:bg-white/10"
        : "border-[#dfe1e5] hover:bg-[#f1f3f4]";

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

  const openWizard = () => {
    setDone(false);
    setStep(1);
    setWizardOpen(true);
  };

  if (installed) {
    return (
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] ${compact ? "mx-2" : ""} ${border} ${muted}`}>
        <Check className="h-4 w-4 text-[#188038]" />
        Flamme est installée sur cet appareil.
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border px-3 py-2.5 ${compact ? "mx-2" : ""} ${border}`}>
        <div className="flex items-center gap-2.5">
          <motion.span
            aria-hidden="true"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2372f]/12 text-[#e2372f]"
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
            <div className="text-[13px] font-medium">Installer Flamme sur cet appareil</div>
            <div className={`text-[11px] leading-4 ${muted}`}>Accès direct depuis l’appareil, sans compte.</div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {promptEvent ? (
            <button
              type="button"
              onClick={runInstall}
              className="flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#e2372f] px-3 text-[13px] font-medium text-white"
            >
              <Download className="h-4 w-4" /> Installer Flamme
            </button>
          ) : null}
          <button
            type="button"
            onClick={openWizard}
            className={`flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-medium ${border} ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}
          >
            <Share className="h-4 w-4" /> Voir comment
          </button>
        </div>
      </div>

      <AnimatePresence>
        {wizardOpen && (
          <div
            className="fixed inset-0 z-[160] flex items-end justify-center sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flamme-install-title"
          >
            <motion.button
              type="button"
              aria-label="Fermer l’assistant d’installation"
              onClick={() => setWizardOpen(false)}
              className="absolute inset-0 cursor-default bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className={`relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border p-4 shadow-[0_8px_28px_rgba(0,0,0,.35)] sm:max-w-[460px] sm:rounded-3xl ${border} ${surface}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 id="flamme-install-title" className="text-[17px] font-medium">
                  Installer Flamme
                </h2>
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  aria-label="Fermer"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className={`mb-1 flex items-center justify-between text-[11px] ${muted}`}>
                <span>Étape {step} sur 3</span>
                <span>{step === 1 ? "Appareil" : step === 2 ? "Navigateur" : "Étapes"}</span>
              </div>
              <div
                className={`mb-4 h-1.5 w-full overflow-hidden rounded-full ${darkMode ? "bg-white/10" : "bg-[#f1f3f4]"}`}
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={3}
                aria-valuenow={step}
              >
                <motion.div
                  className="h-full rounded-full bg-[#e2372f]"
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
                />
              </div>

              {done ? (
                <motion.div
                  className="flex flex-col items-center gap-3 py-6 text-center"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <CheckCircle2 className="h-12 w-12 text-[#188038]" />
                  <p className="text-[15px] font-medium">Bravo, c’est fait&nbsp;!</p>
                  <p className={`text-[13px] leading-5 ${muted}`}>Retrouvez Flamme depuis l’icône de votre appareil.</p>
                  <button
                    type="button"
                    onClick={() => setWizardOpen(false)}
                    className="mt-1 min-h-10 rounded-lg bg-[#e2372f] px-4 text-[13px] font-medium text-white"
                  >
                    Fermer
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === 1 && (
                      <div className="space-y-2">
                        <p className="text-[15px] font-medium">Quel appareil&nbsp;?</p>
                        {DEVICES.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-pressed={device === item.id}
                              onClick={() => {
                                setDevice(item.id);
                                setBrowser(detectBrowser(item.id));
                                setStep(2);
                              }}
                              className={`flex min-h-[60px] w-full items-center gap-3 rounded-2xl border px-3 text-left ${option(device === item.id)}`}
                            >
                              <Icon className="h-6 w-6 shrink-0" />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[14px] font-medium">{item.label}</span>
                                <span className={`block text-[12px] ${muted}`}>{item.hint}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-2">
                        <p className="text-[15px] font-medium">Quel navigateur&nbsp;?</p>
                        {BROWSERS[device].map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-pressed={browser === item.id}
                              onClick={() => {
                                setBrowser(item.id);
                                setStep(3);
                              }}
                              className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-3 text-left ${option(browser === item.id)}`}
                            >
                              <Icon className="h-5 w-5 shrink-0" />
                              <span className="flex-1 text-[14px] font-medium">{item.label}</span>
                              {item.recommended && (
                                <span className={`rounded-full px-2 py-[2px] text-[11px] ${darkMode ? "bg-white/10" : "bg-[#f1f3f4]"} ${muted}`}>
                                  Recommandé
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-2">
                        <p className="text-[15px] font-medium">{guide.title}</p>
                        <ol className="space-y-2">
                          {guide.steps.map((text, index) => (
                            <motion.li
                              key={text}
                              className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${border}`}
                              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: reduceMotion ? 0 : index * 0.07 }}
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e2372f]/12 text-[13px] font-semibold text-[#e2372f]">
                                {index + 1}
                              </span>
                              <span className="pt-[3px] text-[13px] leading-5">{text}</span>
                            </motion.li>
                          ))}
                        </ol>
                        {guide.note && <p className={`text-[12px] leading-4 ${muted}`}>{guide.note}</p>}
                        <button
                          type="button"
                          onClick={() => setDone(true)}
                          className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#e2372f] px-3 text-[14px] font-medium text-white"
                        >
                          <Check className="h-4 w-4" /> C’est fait
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {!done && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={step === 1}
                    onClick={() => setStep((current) => (current === 3 ? 2 : 1))}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-[13px] disabled:opacity-40 ${border} ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setDone(false);
                    }}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] ${muted} ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}
                  >
                    <RotateCcw className="h-4 w-4" /> Recommencer
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

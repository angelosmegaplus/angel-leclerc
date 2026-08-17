import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Info, Loader2, Monitor, RefreshCw, Smartphone } from "lucide-react";
import { AdminCard } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getServiceWorkerRegistration, isStandalone } from "@/lib/pwa";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "android" | "windows";

const MANUAL_STEPS: Record<Platform, string> = {
  android:
    "Sur Android (Chrome ou Edge) : ouvrez le menu ⋮ du navigateur, puis choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».",
  windows:
    "Sur Windows (Chrome ou Edge) : cliquez sur l'icône d'installation dans la barre d'adresse, ou menu ⋮ → Applications → « Installer Angel OS ».",
};

export function SettingsPanel() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [release, setRelease] = useState<{ sha?: string; builtAt?: string | null } | null>(null);
  const [swState, setSwState] = useState<string>("inconnu");
  const [checking, setChecking] = useState(false);
  const [updateNote, setUpdateNote] = useState<string | null>(null);

  useEffect(() => {
    setInstalled(isStandalone());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setHint(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    void fetch("/angel-release.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRelease(data))
      .catch(() => undefined);

    void getServiceWorkerRegistration().then((reg) => {
      if (!reg) {
        setSwState("non actif (aperçu ou développement)");
        return;
      }
      setSwState(reg.active ? "actif" : reg.installing ? "installation" : "en attente");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const version = useMemo(() => {
    const sha = release?.sha ?? "—";
    return sha.length > 12 ? sha.slice(0, 12) : sha;
  }, [release]);

  const install = async (platform: Platform) => {
    if (installed) return;
    if (deferred) {
      setHint(null);
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    setHint(MANUAL_STEPS[platform]);
  };

  const checkUpdate = async () => {
    setChecking(true);
    setUpdateNote(null);
    try {
      const reg = await getServiceWorkerRegistration();
      if (!reg) {
        setUpdateNote("Aucun service worker actif ici : la mise à jour se vérifie sur le site publié.");
        return;
      }
      await reg.update();
      setUpdateNote(
        reg.waiting
          ? "Une nouvelle version est prête : fermez puis rouvrez l'application."
          : "Angel OS est à jour.",
      );
    } catch {
      setUpdateNote("Vérification impossible pour le moment.");
    } finally {
      setChecking(false);
    }
  };

  const cards: Array<{ platform: Platform; label: string; Icon: typeof Smartphone }> = [
    { platform: "android", label: "Android", Icon: Smartphone },
    { platform: "windows", label: "Windows", Icon: Monitor },
  ];

  return (
    <div className="mt-6 space-y-4">
      <AdminCard
        title="Application"
        description="Installer Angel OS comme application web (PWA). Ce n'est pas un APK natif : c'est l'installation officielle proposée par le navigateur."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {cards.map(({ platform, label, Icon }) => (
            <button
              key={platform}
              type="button"
              disabled={installed}
              onClick={() => void install(platform)}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-left transition hover:border-primary/40 disabled:opacity-60"
            >
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border/70 bg-muted/40 text-foreground">
                <Icon className="h-5 w-5" />
                {installed ? null : (
                  <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Download className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">
                  {installed ? "Installée" : deferred ? "Installer maintenant" : "Voir la procédure"}
                </span>
              </span>
              {installed ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" /> : null}
            </button>
          ))}
        </div>

        {hint ? (
          <p className="mt-3 flex gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {hint}
          </p>
        ) : null}
      </AdminCard>

      <AdminCard title="État de l'application" description="Version installée et mise à jour du service worker.">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">Version</dt>
            <dd className="font-mono text-xs text-foreground">{version}</dd>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">Service worker</dt>
            <dd className="text-xs text-foreground">{swState}</dd>
          </div>
        </dl>
        <Button variant="outline" size="sm" className="mt-3 min-h-10" disabled={checking} onClick={() => void checkUpdate()}>
          {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Vérifier les mises à jour
        </Button>
        {updateNote ? <p className="mt-2 text-xs text-muted-foreground">{updateNote}</p> : null}
      </AdminCard>
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";

const TEMPORARY_SITE_URL = "https://angel-leclerc.lovable.app";

function isMaintenanceEnabled() {
  const envEnabled = import.meta.env.VITE_MAINTENANCE_MODE === "true";

  if (typeof window === "undefined") {
    return envEnabled;
  }

  const params = new URLSearchParams(window.location.search);
  const previewEnabled = params.get("maintenance") === "1";

  return envEnabled || previewEnabled;
}

type Bug = {
  id: number;
  x: number;
  y: number;
  speed: number;
};

function BugDodger() {
  const [playerX, setPlayerX] = useState(50);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const nextId = useRef(1);

  const move = (delta: number) => {
    setPlayerX((x) => Math.max(6, Math.min(94, x + delta)));
  };

  const startGame = () => {
    setPlayerX(50);
    setBugs([]);
    setScore(0);
    setGameOver(false);
    setRunning(true);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        move(-8);
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        move(8);
      }
      if ((event.key === " " || event.key === "Enter") && !running) {
        event.preventDefault();
        startGame();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const spawn = window.setInterval(() => {
      setBugs((current) => [
        ...current,
        {
          id: nextId.current++,
          x: 8 + Math.random() * 84,
          y: -8,
          speed: 2.6 + Math.random() * 1.8,
        },
      ]);
    }, 700);

    return () => window.clearInterval(spawn);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const tick = window.setInterval(() => {
      setBugs((current) => {
        let hit = false;
        let passed = 0;

        const next = current
          .map((bug) => ({ ...bug, y: bug.y + bug.speed }))
          .filter((bug) => {
            if (bug.y > 104) {
              passed += 1;
              return false;
            }

            if (bug.y > 78 && bug.y < 96 && Math.abs(bug.x - playerX) < 9) {
              hit = true;
              return false;
            }

            return true;
          });

        if (passed > 0) {
          setScore((value) => value + passed);
        }

        if (hit) {
          setRunning(false);
          setGameOver(true);
          setBest((value) => Math.max(value, score));
        }

        return next;
      });
    }, 70);

    return () => window.clearInterval(tick);
  }, [playerX, running, score]);

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card/80 p-4 text-left shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">En attendant… chasse les bugs</p>
          <p className="text-xs text-muted-foreground">Flèches / A-D / boutons tactiles</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Score {score}</div>
          <div>Record {best}</div>
        </div>
      </div>

      <div className="relative h-52 overflow-hidden rounded-xl border border-border bg-muted/35">
        <div className="absolute inset-x-0 bottom-8 border-t border-dashed border-border/70" />

        {bugs.map((bug) => (
          <div
            key={bug.id}
            className="absolute -translate-x-1/2 text-xl drop-shadow-sm"
            style={{ left: `${bug.x}%`, top: `${bug.y}%` }}
            aria-hidden="true"
          >
            🐛
          </div>
        ))}

        <div
          className="absolute bottom-3 -translate-x-1/2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-bold shadow-md transition-[left] duration-75"
          style={{ left: `${playerX}%` }}
          aria-label="Joueur"
        >
          🛡️
        </div>

        {!running && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 px-5 text-center backdrop-blur-[2px]">
            <div>
              <p className="text-sm font-semibold">
                {gameOver ? "Un bug t’a eu. Nous aussi, visiblement." : "Prêt à nettoyer la maintenance ?"}
              </p>
              <button
                type="button"
                onClick={startGame}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:scale-[1.03] active:scale-100"
              >
                {gameOver ? "Rejouer" : "Jouer"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
        <button
          type="button"
          onPointerDown={() => move(-10)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold active:scale-[0.98]"
          aria-label="Aller à gauche"
        >
          ← Gauche
        </button>
        <button
          type="button"
          onPointerDown={() => move(10)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold active:scale-[0.98]"
          aria-label="Aller à droite"
        >
          Droite →
        </button>
      </div>
    </div>
  );
}

function MaintenancePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl items-center justify-center py-8">
        <section className="w-full text-center motion-safe:animate-[fadeIn_.55s_ease-out]">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-7 w-7 rounded-full border-[3px] border-primary/20 border-t-primary motion-safe:animate-spin" />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Maintenance en cours
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            angel-leclerc.fr revient bientôt
          </h1>

          <a
            href={TEMPORARY_SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            Site temporaire →
          </a>

          <p className="mx-auto mt-4 max-w-md text-xs leading-5 text-muted-foreground">
            Attention : certaines informations peuvent être obsolètes et des bugs peuvent survenir.
          </p>

          <BugDodger />
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

export function MaintenanceGate({
  children,
  bypass = false,
}: {
  children: ReactNode;
  bypass?: boolean;
}) {
  if (bypass || !isMaintenanceEnabled()) {
    return <>{children}</>;
  }

  return <MaintenancePage />;
}

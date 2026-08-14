import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Clock3, RotateCcw, Wrench } from "lucide-react";

type SiteStatus = {
  maintenance?: boolean;
  reason?: string;
};

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
  label: string;
};

function MaintenanceRunner() {
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [jumpY, setJumpY] = useState(0);
  const velocityRef = useRef(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const nextObstacleId = useRef(1);
  const lastSpawn = useRef(0);

  useEffect(() => {
    try {
      setBest(Number(window.localStorage.getItem("angel-os-runner-best") || 0));
    } catch {
      // Local storage is optional.
    }
  }, []);

  const reset = useCallback(() => {
    setRunning(true);
    setGameOver(false);
    setScore(0);
    setJumpY(0);
    velocityRef.current = 0;
    setObstacles([]);
    nextObstacleId.current = 1;
    lastSpawn.current = performance.now();
  }, []);

  const jump = useCallback(() => {
    if (gameOver) {
      reset();
      return;
    }

    if (!running) setRunning(true);
    if (jumpY <= 1) velocityRef.current = 10.5;
  }, [gameOver, jumpY, reset, running]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "ArrowUp") return;
      event.preventDefault();
      jump();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  useEffect(() => {
    if (!running || gameOver) return;

    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 16.67, 2);
      previous = now;
      const speed = 4.7 + Math.min(score / 450, 3.5);

      velocityRef.current -= 0.62 * dt;
      setJumpY((current) => {
        const next = Math.max(0, current + velocityRef.current * dt);
        if (next <= 0 && velocityRef.current < 0) velocityRef.current = 0;
        return next;
      });

      if (now - lastSpawn.current > Math.max(760, 1450 - score * 1.2)) {
        const labels = ["404", "BUG", "ERR", "</>"];
        const height = 26 + Math.random() * 26;
        setObstacles((items) => [
          ...items,
          {
            id: nextObstacleId.current++,
            x: 104,
            width: 20 + Math.random() * 14,
            height,
            label: labels[Math.floor(Math.random() * labels.length)],
          },
        ]);
        lastSpawn.current = now;
      }

      setObstacles((items) =>
        items
          .map((item) => ({ ...item, x: item.x - speed * dt }))
          .filter((item) => item.x > -16),
      );

      setScore((current) => current + Math.max(1, Math.round(dt)));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [gameOver, running, score]);

  useEffect(() => {
    if (!running || gameOver) return;

    const playerLeft = 10;
    const playerRight = 20;
    const playerBottom = jumpY;
    const playerTop = jumpY + 34;

    const collided = obstacles.some((item) => {
      const left = item.x;
      const right = item.x + item.width / 3.2;
      return right > playerLeft && left < playerRight && playerBottom < item.height && playerTop > 0;
    });

    if (!collided) return;

    setGameOver(true);
    setRunning(false);
    setBest((currentBest) => {
      const nextBest = Math.max(currentBest, score);
      try {
        window.localStorage.setItem("angel-os-runner-best", String(nextBest));
      } catch {
        // Local storage is optional.
      }
      return nextBest;
    });
  }, [gameOver, jumpY, obstacles, running, score]);

  return (
    <div className="mx-auto mt-8 w-full max-w-lg rounded-2xl border border-white/10 bg-black/30 p-3 text-left shadow-2xl backdrop-blur-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Angel OS Runner</p>
          <p className="mt-1 text-xs text-white/55">Touchez la zone ou utilisez Espace pour sauter.</p>
        </div>
        <div className="text-right font-mono text-[11px] leading-5 text-white/60">
          <div>Score {String(score).padStart(5, "0")}</div>
          <div>Record {String(best).padStart(5, "0")}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={jump}
        className="relative h-36 w-full touch-manipulation overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] text-left outline-none select-none sm:h-40"
        aria-label="Jouer à Angel OS Runner"
      >
        <div className="absolute inset-x-0 bottom-7 h-px bg-white/15" />
        <div className="absolute inset-x-0 bottom-0 h-7 opacity-35 [background-image:linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:22px_100%]" />

        <div
          className="absolute bottom-7 left-[10%] flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white text-[11px] font-black text-black shadow-lg transition-none"
          style={{ transform: `translateY(-${jumpY}px)` }}
        >
          OS
        </div>

        {obstacles.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-7 flex items-center justify-center rounded-md border border-white/20 bg-white/10 font-mono text-[8px] font-bold text-white/65"
            style={{
              left: `${item.x}%`,
              width: `${item.width}px`,
              height: `${item.height}px`,
            }}
          >
            {item.label}
          </div>
        ))}

        {!running && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/15">
            <span className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur">
              Toucher pour jouer
            </span>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <p className="text-sm font-semibold text-white">Collision détectée</p>
            <p className="mt-1 text-[11px] text-white/50">Score : {score}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/75">
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> Rejouer
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

export function MaintenanceGate({ children, bypass = false }: { children: ReactNode; bypass?: boolean }) {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    if (bypass) {
      setMaintenance(false);
      return;
    }

    let cancelled = false;

    const checkStatus = async () => {
      try {
        const response = await fetch("/system-status", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return;

        const status = (await response.json()) as SiteStatus;
        if (!cancelled) setMaintenance(Boolean(status.maintenance));
      } catch {
        // Fail open: losing the status endpoint must never make the site inaccessible.
      }
    };

    void checkStatus();
    const interval = window.setInterval(checkStatus, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bypass]);

  if (!maintenance || bypass) return <>{children}</>;

  return (
    <main className="fixed inset-0 z-[99999] min-h-screen overflow-y-auto bg-[#080808] px-4 py-8 text-white sm:px-6">
      <div className="fixed inset-0 opacity-40 [background-image:radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.16),transparent_45%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-center text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/15 bg-white/5 p-2.5 shadow-2xl backdrop-blur sm:h-24 sm:w-24 sm:p-3">
          <img src="/icons/apple-touch-icon.png" alt="Angel OS" className="h-full w-full rounded-2xl object-contain" />
        </div>
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/55">
          <Wrench className="h-3.5 w-3.5 animate-[spin_5s_linear_infinite]" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">Maintenance automatique</span>
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Angel OS</p>
        <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight sm:text-5xl">Mise à jour en cours</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">
          Une nouvelle version de angel-leclerc.fr est en cours de déploiement. Le site reviendra automatiquement dès que la mise à jour sera terminée.
        </p>
        <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          <span><strong className="font-semibold text-white/90">Temps estimé :</strong> généralement 2 à 10 minutes</span>
        </div>
        <div className="mx-auto mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[maintenance-progress_1.4s_ease-in-out_infinite] rounded-full bg-white/80" />
        </div>
        <p className="mt-3 text-xs text-white/35">Cette estimation peut varier. Vérification automatique toutes les 15 secondes.</p>

        <MaintenanceRunner />
      </section>
      <style>{`
        @keyframes maintenance-progress {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </main>
  );
}

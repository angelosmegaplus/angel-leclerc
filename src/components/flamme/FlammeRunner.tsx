import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
  kind: "flame" | "block" | "spike";
};

const BEST_SCORE_KEY = "flamme-runner-best";
const GROUND = 18;
const PLAYER_X = 42;
const PLAYER_WIDTH = 18;
const PLAYER_HEIGHT = 32;

export function FlammeRunner({ darkMode, onClose }: { darkMode: boolean; onClose: () => void }) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const spawnRef = useRef(0);
  const nextId = useRef(1);
  const velocity = useRef(0);
  const playerY = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const [renderY, setRenderY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem(BEST_SCORE_KEY) || 0) || 0;
    } catch {
      return 0;
    }
  });
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const saveBest = useCallback((value: number) => {
    if (value <= best) return;
    setBest(value);
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(value));
    } catch {}
  }, [best]);

  const reset = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    lastRef.current = null;
    spawnRef.current = 0;
    velocity.current = 0;
    playerY.current = 0;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    setRenderY(0);
    setObstacles([]);
    setScore(0);
    setStarted(false);
    setGameOver(false);
  }, []);

  const jump = useCallback(() => {
    if (gameOver) {
      reset();
      return;
    }
    if (!started) setStarted(true);
    if (playerY.current <= 1) velocity.current = 520;
  }, [gameOver, reset, started]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === " " || event.key === "ArrowUp") {
        event.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, onClose]);

  useEffect(() => {
    if (!started || gameOver) return;

    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = Math.min((now - lastRef.current) / 1000, 0.035);
      lastRef.current = now;
      const fieldWidth = fieldRef.current?.clientWidth || 320;
      const speed = Math.min(220 + scoreRef.current * 1.8, 430);

      velocity.current -= 1450 * dt;
      playerY.current = Math.max(0, playerY.current + velocity.current * dt);
      if (playerY.current <= 0) {
        playerY.current = 0;
        velocity.current = Math.max(0, velocity.current);
      }

      spawnRef.current -= dt;
      const next = obstaclesRef.current.map((item) => ({ ...item, x: item.x - speed * dt })).filter((item) => item.x + item.width > -10);
      if (spawnRef.current <= 0) {
        const variants: Array<Pick<Obstacle, "width" | "height" | "kind">> = [
          { width: 18, height: 25, kind: "flame" },
          { width: 22, height: 34, kind: "block" },
          { width: 28, height: 18, kind: "spike" },
        ];
        const variant = variants[Math.floor(Math.random() * variants.length)] ?? variants[0];
        next.push({ id: nextId.current++, x: fieldWidth + 20, ...variant });
        spawnRef.current = Math.max(0.85, 1.45 - scoreRef.current * 0.004) + Math.random() * 0.55;
      }

      const playerBottom = GROUND + playerY.current;
      const playerTop = playerBottom + PLAYER_HEIGHT;
      const playerLeft = PLAYER_X;
      const playerRight = PLAYER_X + PLAYER_WIDTH;
      const hit = next.some((item) => {
        const obstacleLeft = item.x;
        const obstacleRight = item.x + item.width;
        const obstacleTop = GROUND + item.height;
        return playerRight > obstacleLeft + 3 && playerLeft < obstacleRight - 3 && playerBottom < obstacleTop - 3 && playerTop > GROUND;
      });

      if (hit) {
        const finalScore = Math.floor(scoreRef.current);
        saveBest(finalScore);
        setScore(finalScore);
        setGameOver(true);
        setStarted(false);
        return;
      }

      scoreRef.current += dt * 10;
      obstaclesRef.current = next;
      setRenderY(playerY.current);
      setObstacles(next);
      setScore(Math.floor(scoreRef.current));
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [gameOver, saveBest, started]);

  const surface = darkMode ? "bg-[#202124] text-[#e8eaed] border-[#5f6368]" : "bg-white text-[#202124] border-[#dfe1e5]";
  const muted = darkMode ? "text-[#bdc1c6]" : "text-[#5f6368]";

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label="Jeu caché Flamme">
      <div className={`w-full max-w-[680px] rounded-3xl border p-4 shadow-2xl ${surface}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[18px] font-semibold">Flamme Runner</p>
            <p className={`text-[12px] ${muted}`}>Easter egg trouvé. Saute et tiens le plus longtemps possible.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer le jeu" className={`flex h-9 w-9 items-center justify-center rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-[#f1f3f4]"}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between text-[12px] font-medium">
          <span>Score : {score}</span>
          <span>Record : {Math.max(best, score)}</span>
        </div>

        <button
          ref={fieldRef}
          type="button"
          onClick={jump}
          className={`relative block h-[220px] w-full touch-manipulation overflow-hidden rounded-2xl border text-left outline-none ${darkMode ? "border-[#5f6368] bg-[#171819]" : "border-[#dfe1e5] bg-[#fafafa]"}`}
          aria-label="Zone de jeu. Touchez pour sauter."
        >
          <span className={`absolute inset-x-0 bottom-[17px] h-px ${darkMode ? "bg-[#5f6368]" : "bg-[#dadce0]"}`} />

          <span
            className="absolute left-[42px] flex w-[18px] flex-col items-center"
            style={{ bottom: GROUND + renderY, height: PLAYER_HEIGHT }}
            aria-hidden="true"
          >
            <span className={`h-[11px] w-[11px] rounded-full ${darkMode ? "bg-[#e8eaed]" : "bg-[#5f6368]"}`} />
            <span className={`mt-[2px] h-[16px] w-[7px] rounded-[3px] ${darkMode ? "bg-[#e8eaed]" : "bg-[#5f6368]"}`} />
            <span className="mt-[-1px] flex gap-[3px]">
              <span className={`h-[7px] w-[3px] origin-top rotate-[18deg] rounded-full ${darkMode ? "bg-[#e8eaed]" : "bg-[#5f6368]"}`} />
              <span className={`h-[7px] w-[3px] origin-top -rotate-[18deg] rounded-full ${darkMode ? "bg-[#e8eaed]" : "bg-[#5f6368]"}`} />
            </span>
          </span>

          {obstacles.map((item) => (
            <span
              key={item.id}
              className="absolute"
              style={{ left: item.x, bottom: GROUND, width: item.width, height: item.height }}
              aria-hidden="true"
            >
              {item.kind === "flame" ? (
                <span className="flex h-full w-full items-end justify-center text-[22px] leading-none">🔥</span>
              ) : item.kind === "spike" ? (
                <span className={`block h-full w-full [clip-path:polygon(0_100%,20%_25%,40%_100%,60%_15%,80%_100%,100%_35%,100%_100%)] ${darkMode ? "bg-[#9aa0a6]" : "bg-[#5f6368]"}`} />
              ) : (
                <span className={`block h-full w-full rounded-t-md border-2 ${darkMode ? "border-[#9aa0a6]" : "border-[#5f6368]"}`} />
              )}
            </span>
          ))}

          {!started && !gameOver && (
            <span className={`absolute inset-0 flex items-center justify-center text-center text-[14px] ${muted}`}>
              Touchez l’écran ou appuyez sur Espace pour commencer
            </span>
          )}

          {gameOver && (
            <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/15 text-center">
              <span className="text-[20px] font-semibold">Perdu !</span>
              <span className={`mt-1 text-[13px] ${muted}`}>Touchez pour recommencer</span>
            </span>
          )}
        </button>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className={`text-[11px] ${muted}`}>Mobile : toucher · Ordinateur : Espace / ↑ · Échap : fermer</p>
          <button type="button" onClick={reset} className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[12px] ${darkMode ? "border-[#5f6368] hover:bg-white/10" : "border-[#dfe1e5] hover:bg-[#f1f3f4]"}`}>
            <RotateCcw className="h-4 w-4" /> Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FlammeRunner } from "@/components/flamme/FlammeRunner";

type Props = { darkMode: boolean };

/**
 * Wordmark « Flamme • bêta ». De temps en temps, un tout petit personnage
 * vient chercher ou rapporter le badge « bêta », dans un sens puis dans l'autre.
 * Le personnage cache aussi un easter egg : pendant son passage, un clic ouvre
 * le mini-jeu Flamme Runner.
 */
export function FlammeWordmark({ darkMode }: Props) {
  const reduced = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const run = () => {
      if (cancelled || gameOpen) return;
      setPlaying(true);
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setPlaying(false);
          setCycle((value) => value + 1);
          timers.push(setTimeout(run, 20000));
        }, 3200),
      );
    };

    timers.push(setTimeout(run, 4000));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [gameOpen, reduced]);

  const direction = cycle % 2 === 0 ? 1 : -1;

  return (
    <>
      <div className="relative flex select-none items-end justify-center gap-2">
        <span
          className={`text-[46px] font-extrabold leading-none tracking-[-0.045em] sm:text-[64px] ${darkMode ? "text-[#f1f3f4]" : "text-[#181716]"}`}
        >
          Flamme
        </span>
        <span className="mb-[10px] h-[9px] w-[9px] shrink-0 rounded-full bg-[#e2372f] sm:mb-[14px] sm:h-[12px] sm:w-[12px]" aria-hidden="true" />

        <span className="relative mb-[6px] sm:mb-[9px]">
          <span className="sr-only">bêta</span>
          <motion.span
            aria-hidden="true"
            className={`block text-[15px] font-medium lowercase tracking-tight sm:text-[20px] ${darkMode ? "text-[#9aa0a6]" : "text-[#6b6f76]"}`}
            animate={
              reduced || !playing
                ? { x: 0, y: 0, rotate: 0, opacity: 1 }
                : { x: [0, direction * 10, 0], y: [0, -14, 0], rotate: [0, direction * 8, 0], opacity: [1, 1, 1] }
            }
            transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
          >
            bêta
          </motion.span>

          {!reduced && playing && (
            <motion.button
              type="button"
              aria-label=""
              title=""
              onClick={(event) => {
                event.stopPropagation();
                setPlaying(false);
                setGameOpen(true);
              }}
              className="absolute -top-7 left-1/2 z-10 flex cursor-pointer flex-col items-center border-0 bg-transparent p-1 outline-none"
              initial={{ x: direction * -34, opacity: 0 }}
              animate={{ x: [direction * -34, 0, direction * 30], opacity: [0, 1, 0] }}
              transition={{ duration: 3, ease: "easeInOut" }}
            >
              <span className={`h-[7px] w-[7px] rounded-full ${darkMode ? "bg-[#9aa0a6]" : "bg-[#6b6f76]"}`} />
              <motion.span
                className={`mt-[2px] h-[9px] w-[5px] rounded-[2px] ${darkMode ? "bg-[#9aa0a6]" : "bg-[#6b6f76]"}`}
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ duration: 0.7, repeat: 3, ease: "easeInOut" }}
              />
            </motion.button>
          )}
        </span>
      </div>

      {gameOpen && <FlammeRunner darkMode={darkMode} onClose={() => setGameOpen(false)} />}
    </>
  );
}

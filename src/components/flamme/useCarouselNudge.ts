import { useEffect, useRef } from "react";
import { useAnimationControls } from "framer-motion";

/**
 * Suggère discrètement que le carrousel de services se fait défiler
 * horizontalement : une micro-translation visuelle, jamais en boucle,
 * jamais si l'utilisateur vient d'interagir, jamais en reduced-motion.
 */
export function useCarouselNudge() {
  const controls = useAnimationControls();
  const interacted = useRef(false);
  const lastInteraction = useRef(0);

  const markInteraction = () => {
    interacted.current = true;
    lastInteraction.current = Date.now();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let cancelled = false;
    let direction = -1;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const play = () => {
      if (cancelled) return;
      const idle = Date.now() - lastInteraction.current > 15000;
      if (!interacted.current || idle) {
        void controls.start({
          x: [0, direction * 14, 0],
          transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], times: [0, 0.45, 1] },
        });
        direction = direction === -1 ? 1 : -1;
      }
      timers.push(setTimeout(play, 28000));
    };

    timers.push(setTimeout(play, 2000));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [controls]);

  return { controls, markInteraction };
}

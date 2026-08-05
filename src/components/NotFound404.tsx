import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Compass, Home, Mail, Volume2 } from "lucide-react";

/**
 * Petit son façon "chime" Windows XP, synthétisé en Web Audio
 * (aucun fichier externe, aucun droit d'auteur).
 */
function playXpChime() {
  const Ctx =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)
      : undefined;
  if (!Ctx) return false;
  const ctx = new Ctx();
  // Do - Sol - Mi - Do (arpège descendant/ascendant caractéristique)
  const notes = [
    { f: 659.25, t: 0, d: 0.5 },
    { f: 880.0, t: 0.12, d: 0.5 },
    { f: 587.33, t: 0.26, d: 0.55 },
    { f: 440.0, t: 0.38, d: 0.9 },
  ];
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);

  notes.forEach(({ f, t, d }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    const start = ctx.currentTime + t;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.9, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + d);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + d + 0.05);
  });

  window.setTimeout(() => void ctx.close(), 2000);
  return true;
}

export function NotFound404() {
  const [played, setPlayed] = useState(false);
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    try {
      if (playXpChime()) setPlayed(true);
    } catch {
      /* autoplay bloqué : bouton de secours */
    }
  }, []);

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-background px-4 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-primary) 18%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Compass size={14} className="text-primary" />
          Erreur 404
        </div>

        <h1 className="mt-6 font-display text-[clamp(4rem,18vw,8rem)] font-bold leading-none tracking-tight text-foreground">
          4<span className="text-primary">0</span>4
        </h1>

        <h2 className="mt-2 font-display text-xl font-semibold text-foreground md:text-2xl">
          Cette page n'existe pas
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          L'adresse saisie est peut-être incorrecte, ou la page a été déplacée.
          Revenez à l'accueil pour reprendre la navigation.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent sm:w-auto"
          >
            <Home size={16} />
            Retour à l'accueil
          </Link>
          <Link
            to="/contact"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary sm:w-auto"
          >
            <Mail size={16} className="text-primary" />
            Me contacter
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            try {
              playXpChime();
              setPlayed(true);
            } catch {
              /* ignore */
            }
          }}
          className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Volume2 size={14} className="text-primary" />
          {played ? "Rejouer le petit son" : "Activer le petit son"}
        </button>
      </div>
    </section>
  );
}

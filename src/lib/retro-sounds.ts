export type RetroSound = "click" | "notify" | "success" | "error";

const patterns: Record<RetroSound, Array<[number, number, number]>> = {
  click: [[520, 0, 0.045], [760, 0.035, 0.055]],
  notify: [[440, 0, 0.09], [660, 0.08, 0.11], [880, 0.18, 0.18]],
  success: [[392, 0, 0.09], [523, 0.08, 0.1], [784, 0.17, 0.22]],
  error: [[220, 0, 0.13], [165, 0.11, 0.2]],
};

/** Sons originaux synthétisés dans le navigateur, inspirés des interfaces rétro. */
export function playRetroSound(kind: RetroSound, volume = 0.11) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = volume;
    master.connect(context.destination);
    const start = context.currentTime;

    patterns[kind].forEach(([frequency, delay, duration], index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === "error" ? "square" : index % 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + delay);
      gain.gain.exponentialRampToValueAtTime(1, start + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + delay + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start + delay);
      oscillator.stop(start + delay + duration + 0.02);
    });
    window.setTimeout(() => void context.close(), 800);
  } catch {
    /* Le son reste un enrichissement facultatif. */
  }
}

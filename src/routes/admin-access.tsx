import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin-access")({
  head: () => ({
    meta: [
      { title: "Angel Guard — Accès administrateur" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAccessGate,
});

let audioContext: AudioContext | null = null;

function tone(frequency: number, duration = 0.08, delay = 0) {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  audioContext ??= new Ctor();
  if (audioContext.state === "suspended") void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.018, audioContext.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(audioContext.currentTime + delay);
  oscillator.stop(audioContext.currentTime + delay + duration + 0.02);
}

function AdminAccessGate() {
  const [step, setStep] = useState(0);
  const checks = [
    "ACCESS REQUEST CAPTURED",
    "BROWSER SECURITY CONTEXT",
    "AUTHENTICATION GATE",
    "SESSION STORAGE ISOLATION",
    "ADMIN SURFACE LOCK",
    "ANGEL GUARD CLEARANCE",
  ];

  useEffect(() => {
    const arm = () => tone(92, 0.07);
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });

    const timers = checks.map((_, index) => window.setTimeout(() => {
      setStep(index + 1);
      if (index === 2) tone(138, 0.06);
      if (index === checks.length - 1) tone(220, 0.1);
    }, 220 + index * 280));

    const finish = window.setTimeout(() => {
      window.location.assign("/auth?adminFlow=1");
    }, 220 + checks.length * 280 + 520);

    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, []);

  return (
    <section className="guard-shell" aria-label="Inspection Angel Guard" role="status">
      <div className="guard-scanline" aria-hidden />
      <div className="guard-terminal">
        <div className="guard-title"><span>ANGEL GUARD</span><span>ACCESS INSPECTION</span></div>
        <div className="guard-mark"><ShieldCheck className="h-12 w-12" /><span>GUARD</span></div>
        <p className="guard-warning">RESTRICTED ADMINISTRATIVE SURFACE</p>
        <div className="guard-lines">
          {checks.map((check, index) => (
            <p key={check} className={step > index ? "done" : step === index ? "active" : "pending"}>
              <span>{step > index ? "[PASS]" : step === index ? "[....]" : "[WAIT]"}</span> {check}
            </p>
          ))}
        </div>
        <p className="guard-foot">Inspection visuelle de la porte d’accès Angel OS. Aucune donnée sensible n’est affichée.</p>
      </div>
      <style>{`
        .guard-shell{position:fixed;inset:0;z-index:10000;background:#020402;color:#a8ffb1;display:grid;place-items:center;padding:24px;overflow:hidden;font-family:Consolas,Monaco,monospace}.guard-scanline{position:absolute;inset:-40% 0;background:linear-gradient(transparent 0 47%,rgba(70,255,105,.08) 49%,rgba(70,255,105,.18) 50%,rgba(70,255,105,.08) 51%,transparent 53%);animation:guardScan 2.2s linear infinite;pointer-events:none}.guard-terminal{position:relative;width:min(690px,100%);border:1px solid #22622d;background:rgba(0,12,2,.96);box-shadow:0 0 80px rgba(42,255,84,.09),inset 0 0 45px rgba(0,0,0,.9);padding:20px}.guard-title{display:flex;justify-content:space-between;border-bottom:1px solid #174a20;padding-bottom:10px;color:#65ff79;font-size:11px;font-weight:700;letter-spacing:.12em}.guard-mark{display:flex;align-items:center;justify-content:center;gap:14px;margin:28px 0 8px;color:#52ff6a}.guard-mark span{font-size:30px;font-weight:800;letter-spacing:.18em}.guard-warning{text-align:center;color:#ff5d5d;font-size:11px;letter-spacing:.13em;margin-bottom:25px;animation:guardPulse 1.1s steps(2) infinite}.guard-lines{border:1px solid #123a18;background:#000;padding:14px 16px;font-size:12px;line-height:2}.guard-lines .pending{color:#315b36}.guard-lines .active{color:#ffe66d}.guard-lines .done{color:#68ff7d}.guard-lines span{display:inline-block;width:54px}.guard-foot{margin-top:14px;color:#48704e;font-size:9px;line-height:1.6;text-transform:uppercase;letter-spacing:.06em}@keyframes guardScan{from{transform:translateY(-25%)}to{transform:translateY(25%)}}@keyframes guardPulse{50%{opacity:.42}}@media(max-width:600px){.guard-shell{padding:12px}.guard-terminal{padding:14px}.guard-mark span{font-size:22px}.guard-lines{font-size:10px;padding:10px}.guard-title{font-size:9px}}
      `}</style>
    </section>
  );
}

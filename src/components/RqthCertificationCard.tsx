import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Accessibility } from "lucide-react";

export function RqthCertificationCard() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const certificationsSection = document.getElementById("certifications");
    const grid = certificationsSection?.querySelector<HTMLElement>(".grid");
    if (!grid) return;

    const mount = document.createElement("div");
    mount.dataset.rqthCertification = "true";
    grid.appendChild(mount);
    setTarget(mount);

    return () => mount.remove();
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">
      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
        <Accessibility size={22} />
      </div>
      <div>
        <p className="font-display text-base font-semibold text-foreground">RQTH</p>
        <p className="text-sm text-muted-foreground">Reconnaissance de la qualité de travailleur handicapé</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Reconnaissance administrative pouvant être présentée à un employeur si utile, notamment pour certains aménagements ou dispositifs d'accompagnement.
        </p>
      </div>
    </div>,
    target,
  );
}

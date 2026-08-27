import { useState } from "react";
import { BookOpen, BriefcaseBusiness, CircleCheck, Download, School, Sparkles } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import talisLogo from "@/assets/talis-logo.png";

const LOGO_VERSION = "20260822-1";
const local = (name: string) => `/logos/objectives/${name}.svg?v=${LOGO_VERSION}`;

type BrandData = { name: string; localLogo?: string; webLogo?: string; mark?: string };

function SectionHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles size={12} /> {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">{title}</h2>
      {intro ? <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground md:mt-4 md:text-base">{intro}</p> : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">{children}</div>;
}

function BrandMark({ name, localLogo, webLogo, mark }: BrandData) {
  const sources = [webLogo, localLogo].filter(Boolean) as string[];
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];
  return (
    <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2.5 shadow-sm">
      {src ? <img src={src} alt={`Logo ${name}`} className="h-full w-full object-contain" loading="lazy" decoding="async" onError={() => setSourceIndex((index) => index + 1)} /> : <span className="text-center font-display text-[13px] font-black uppercase leading-tight tracking-tight text-black">{mark ?? name}</span>}
    </span>
  );
}

const institutions = [
  { name: "Talis", place: "Périgueux", type: "BTS Communication · alternance", href: "https://www.talis.community/campus/perigueux/", localLogo: talisLogo, status: "accepted" },
  { name: "IBSAC", place: "Brive-la-Gaillarde", type: "BTS Communication · alternance", href: "https://www.ibsac.fr/", localLogo: local("ibsac"), status: "accepted" },
  { name: "CNED", place: "À distance", type: "BTS Communication · solution de secours", href: "https://www.cned.fr/bts/bts-communication", localLogo: local("cned"), status: "fallback" },
];

export function BtsCommunicationSection() {
  return (
    <AnimatedSection>
      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          <SectionHeader eyebrow="Formation" title="BTS Communication" intro="Talis Périgueux et IBSAC Brive sont deux possibilités équivalentes : le choix dépend principalement de la localisation de l'entreprise d'alternance. Le CNED reste une solution de secours." />
          <div className="mt-8 grid gap-4 sm:grid-cols-3 md:mt-12">
            <Card><BookOpen className="text-primary" size={22} /><p className="mt-4 font-semibold">BTS Communication</p></Card>
            <Card><School className="text-primary" size={22} /><p className="mt-4 font-semibold">Brive ou Périgueux</p></Card>
            <Card><BriefcaseBusiness className="text-primary" size={22} /><p className="mt-4 font-semibold">Selon l'entreprise</p></Card>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {institutions.map((item) => (
              <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <BrandMark name={item.name} localLogo={item.localLogo} mark={item.name} />
                  {item.status === "accepted" ? <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><CircleCheck size={14} /> Accepté</span> : <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Solution de secours</span>}
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold sm:text-xl">{item.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.place}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{item.type}</p>
              </a>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <p className="font-semibold">Documents Talis</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="/bts/programme-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold"><Download size={14} /> Programme PDF</a>
              <a href="/bts/calendrier-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold"><Download size={14} /> Calendrier indicatif</a>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

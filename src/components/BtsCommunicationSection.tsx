import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, BriefcaseBusiness, CircleCheck, Download, School, ChevronDown, Search, Sparkles } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import talisLogo from "@/assets/talis-logo.png";

const LOGO_VERSION = "20260822-1";
const local = (name: string) => `/logos/objectives/${name}.svg?v=${LOGO_VERSION}`;

type BrandData = { name: string; localLogo?: string; webLogo?: string; mark?: string };

function BrandMark({ name, localLogo, webLogo, mark }: BrandData) {
  const sources = [webLogo, localLogo].filter(Boolean) as string[];
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];
  return (
    <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2.5 shadow-sm">
      {src ? (
        <img src={src} alt={`Logo ${name}`} className="h-full w-full object-contain" loading="lazy" decoding="async" onError={() => setSourceIndex((index) => index + 1)} />
      ) : (
        <span className="text-center font-display text-[13px] font-black uppercase leading-tight tracking-tight text-black">{mark ?? name}</span>
      )}
    </span>
  );
}

const institutions = [
  { name: "Talis", place: "Périgueux", type: "BTS Communication · alternance", href: "https://www.talis.community/campus/perigueux/", localLogo: talisLogo, status: "accepted" },
  { name: "IBSAC", place: "Brive-la-Gaillarde", type: "BTS Communication · alternance", href: "https://www.ibsac.fr/", localLogo: local("ibsac"), status: "accepted" },
  { name: "CNED", place: "À distance", type: "BTS Communication · solution de secours", href: "https://www.cned.fr/bts/bts-communication", localLogo: local("cned"), status: "fallback" },
];

export function BtsCommunicationSection() {
  const [open, setOpen] = useState(false);

  return (
    <AnimatedSection>
      <section className="section-padding bg-muted/40">
        <div className="container-tight">
          {/* Bannière discrète une seule ligne — section temporaire */}
          <div className={`overflow-hidden border border-dashed border-primary/40 bg-card shadow-sm transition-[border-radius] duration-300 ${open ? "rounded-2xl" : "rounded-full"}`}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="bts-content"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-primary/5 sm:px-5"
            >
              <Search size={15} className="shrink-0 text-primary" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 shrink-0">
                <Sparkles size={10} /> Recherche
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                BTS Communication — je cherche une entreprise d'alternance
              </span>
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <ChevronDown size={14} />
              </motion.span>
            </button>

            {/* Contenu dépliable */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="bts-content"
                  id="bts-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-dashed border-primary/30 px-4 pb-6 pt-5 sm:px-6">
                    {/* Documents PDF en premier */}
                    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                      <p className="font-semibold">Documents Talis</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a href="/bts/programme-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold">
                          <Download size={14} /> Programme PDF
                        </a>
                        <a href="/bts/calendrier-bts-com-talis.pdf" download className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold">
                          <Download size={14} /> Calendrier indicatif
                        </a>
                      </div>
                    </div>

                    <div className="mt-6 mx-auto max-w-2xl text-center">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                        <Sparkles size={12} /> Formation
                      </span>
                      <h3 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-foreground sm:text-3xl">
                        BTS Communication
                      </h3>
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground md:mt-4 md:text-base">
                        Talis Périgueux et IBSAC Brive sont deux possibilités équivalentes : le choix dépend principalement de la localisation de l'entreprise d'alternance. Le CNED reste une solution de secours.
                      </p>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">
                        <BookOpen className="text-primary" size={22} />
                        <p className="mt-4 font-semibold">BTS Communication</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">
                        <School className="text-primary" size={22} />
                        <p className="mt-4 font-semibold">Brive ou Périgueux</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md sm:p-6">
                        <BriefcaseBusiness className="text-primary" size={22} />
                        <p className="mt-4 font-semibold">Selon l'entreprise</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {institutions.map((item) => (
                        <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                          <div className="flex items-start justify-between gap-3">
                            <BrandMark name={item.name} localLogo={item.localLogo} mark={item.name} />
                            {item.status === "accepted" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                <CircleCheck size={14} /> Accepté
                              </span>
                            ) : (
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Solution de secours</span>
                            )}
                          </div>
                          <h4 className="mt-5 font-display text-lg font-semibold sm:text-xl">{item.name}</h4>
                          <p className="mt-2 text-sm text-muted-foreground">{item.place}</p>
                          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{item.type}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

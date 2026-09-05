import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, ChevronDown, MessageCircleQuestion, Send } from "lucide-react";
import { ContactChat, type Track } from "@/components/ContactChat";
import { ContactAttachment, installContactTransport } from "@/components/ContactAttachment";
import { PublicContactAssistant } from "@/components/PublicContactAssistant";
import { QuoteSimulator } from "@/components/QuoteSimulator";

const TITLE = "Contact — Angel Leclerc";
const DESCRIPTION = "Contactez Angel Leclerc pour un projet professionnel, une demande de communication ou toute autre question.";
const CONTACT_UI_VERSION = "2026-09-06-v3";

type OpenPanel = "question" | "devis" | null;

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): { parcours?: Track; sujet?: string } => {
    const raw = typeof search["parcours"] === "string" ? (search["parcours"] as string) : "";
    const sujetRaw = typeof search["sujet"] === "string" ? (search["sujet"] as string).trim().slice(0, 400) : "";
    const result: { parcours?: Track; sujet?: string } = {};
    if (raw === "projet" || raw === "autre" || raw === "alternance") result.parcours = raw;
    if (sujetRaw) result.sujet = sujetRaw;
    return result;
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function Collapsible({
  id,
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/40 sm:px-6"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold text-foreground">{title}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{subtitle}</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id={id} className="border-t border-border p-3 sm:p-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function ContactPage() {
  const { parcours, sujet } = Route.useSearch();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  useEffect(() => {
    installContactTransport();
  }, []);

  const toggle = (panel: Exclude<OpenPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <main className="bg-background" data-contact-ui={CONTACT_UI_VERSION}>
      <div className="container-tight py-12 md:py-16">
        <h1 className="text-center font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">Contact</h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
          Écrivez directement à Angel Leclerc ci-dessous. Réponse personnelle, sans engagement.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl gap-3">
          <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm">
            <div className="flex items-center gap-4 px-5 pt-5 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold text-foreground">Contacter Angel Leclerc</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Projet professionnel, communication ou autre demande</p>
              </div>
            </div>

            {sujet ? (
              <p className="mx-5 mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground sm:mx-6">
                <span className="font-semibold">Votre demande&nbsp;:</span> {sujet}
              </p>
            ) : null}

            <div className="contact-form-clean p-3 sm:p-5">
              <div className="contact-attachment-slot mb-4">
                <ContactAttachment />
              </div>
              <ContactChat initialTrack={parcours ?? "autre"} initialSubject={sujet ?? ""} />
            </div>
          </section>

          <Collapsible
            id="contact-devis-panel"
            icon={<Calculator className="h-5 w-5" />}
            title="Simuler un devis"
            subtitle="Estimation indicative assistée par intelligence artificielle"
            open={openPanel === "devis"}
            onToggle={() => toggle("devis")}
          >
            <QuoteSimulator />
          </Collapsible>

          <Collapsible
            id="contact-question-panel"
            icon={<MessageCircleQuestion className="h-5 w-5" />}
            title="Une question ?"
            subtitle="Poser une question à l’assistant du site"
            open={openPanel === "question"}
            onToggle={() => toggle("question")}
          >
            <PublicContactAssistant />
          </Collapsible>
        </div>
      </div>

      <style>{`
        .contact-form-clean [aria-label="Conversation en cours"] {
          display: none !important;
        }
        .contact-form-clean > div > div:has(> .mt-5.grid.gap-2\\.5) > p:nth-of-type(2) {
          display: none !important;
        }
        .contact-form-clean > div > div > .mt-5.grid.gap-2\\.5 + .mt-4.flex.flex-wrap.gap-2 {
          display: none !important;
        }
        .contact-form-clean > div > .mt-6.border-t.border-border.pt-4 {
          display: none !important;
        }
      `}</style>
    </main>
  );
}

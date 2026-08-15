import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, MessageCircleQuestion, Send } from "lucide-react";
import { ContactChat, type Track } from "@/components/ContactChat";
import { PublicContactAssistant } from "@/components/PublicContactAssistant";

const TITLE = "Contact — Angel Leclerc";
const DESCRIPTION = "Contactez Angel Leclerc pour une alternance, un projet professionnel ou une demande liée à Angel Leclerc Communication.";

type OpenPanel = "question" | "contact" | null;

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): { parcours?: Track } => {
    const raw = typeof search["parcours"] === "string" ? (search["parcours"] as string) : "";
    return raw === "projet" || raw === "alternance" || raw === "autre" ? { parcours: raw } : {};
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

function ContactPage() {
  const { parcours } = Route.useSearch();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(parcours ? "contact" : null);

  const toggle = (panel: Exclude<OpenPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <main className="bg-background">
      <div className="container-tight py-12 md:py-16">
        <h1 className="text-center font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">Contact</h1>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3">
          <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm">
            <button
              type="button"
              onClick={() => toggle("question")}
              aria-expanded={openPanel === "question"}
              aria-controls="contact-question-panel"
              className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/40 sm:px-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircleQuestion className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold text-foreground">Une question ?</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">Poser une question à l’assistant du site</span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${openPanel === "question" ? "rotate-180" : ""}`} />
            </button>
            {openPanel === "question" && (
              <div id="contact-question-panel" className="border-t border-border p-3 sm:p-5">
                <PublicContactAssistant />
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm">
            <button
              type="button"
              onClick={() => toggle("contact")}
              aria-expanded={openPanel === "contact"}
              aria-controls="contact-form-panel"
              className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/40 sm:px-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold text-foreground">Contacter Angel Leclerc</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">Alternance, projet professionnel ou Angel Leclerc Communication</span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${openPanel === "contact" ? "rotate-180" : ""}`} />
            </button>
            {openPanel === "contact" && (
              <div id="contact-form-panel" className="contact-form-clean border-t border-border p-3 sm:p-5">
                <ContactChat {...(parcours ? { initialTrack: parcours } : {})} />
              </div>
            )}
          </section>
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

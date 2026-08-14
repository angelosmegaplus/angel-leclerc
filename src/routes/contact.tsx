import { createFileRoute } from "@tanstack/react-router";
import { ContactChat, type Track } from "@/components/ContactChat";

const TITLE = "Contact — Angel Leclerc Communication";
const DESCRIPTION = "Contactez Angel Leclerc via le formulaire de contact conversationnel.";

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

  return (
    <main className="bg-background">
      <div className="container-tight py-12 md:py-16">
        <h1 className="text-center font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">Contact</h1>

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="contact-form-clean rounded-[2rem] border border-border bg-card p-3 shadow-sm sm:p-5">
            <ContactChat {...(parcours ? { initialTrack: parcours } : {})} />
          </div>
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

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Loader2, Package, Truck, Home, ExternalLink } from "lucide-react";
import { trackShopOrder } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/shop";

type StepKey = "preparation" | "shipped" | "delivered";

const STEPS: Array<{ key: StepKey; label: string; hint: string; icon: typeof Package }> = [
  {
    key: "preparation",
    label: "En préparation",
    hint: "Impression et contrôle qualité",
    icon: Package,
  },
  { key: "shipped", label: "Expédiée", hint: "Colis confié au transporteur", icon: Truck },
  { key: "delivered", label: "Livrée", hint: "Colis remis à destination", icon: Home },
];

function currentStep(status: string, printfulStatus: string | null): number {
  if (printfulStatus === "package_returned") return 1;
  if (status === "delivered") return 2;
  if (
    status === "shipped" ||
    printfulStatus === "fulfilled" ||
    printfulStatus === "package_shipped"
  ) {
    return 1;
  }
  return 0;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderTracker({ sessionId }: { sessionId: string }) {
  const track = useServerFn(trackShopOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["order-tracking", sessionId],
    queryFn: () => track({ data: { sessionId } }),
    // Rafraîchissement automatique : les webhooks Printful mettent la commande à jour.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={18} /> Chargement du suivi…
      </div>
    );
  }

  if (!data || "error" in data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Le suivi de cette commande n'est pas encore disponible. Il apparaît quelques instants après
        la validation du paiement.
      </div>
    );
  }

  const canceled = data.status === "canceled" || data.status === "refunded";
  const active = currentStep(data.status, data.printfulStatus);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-left sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">Statut de votre commande</h2>
        <span className="text-xs text-muted-foreground">
          Commande du {formatDateTime(data.createdAt)}
        </span>
      </div>

      {canceled ? (
        <p className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-foreground">
          Cette commande a été {data.status === "refunded" ? "remboursée" : "annulée"}. Un e-mail
          vous a été envoyé avec le détail.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {STEPS.map((step, index) => {
            const done = index < active;
            const isCurrent = index === active;
            const Icon = step.icon;
            return (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      done || isCurrent
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span className={`mt-1 h-6 w-px ${done ? "bg-primary/50" : "bg-border"}`} />
                  )}
                </div>
                <div className="pb-1">
                  <p
                    className={`text-sm font-medium ${
                      done || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        En cours
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {data.trackingNumber && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Suivi transporteur {data.carrier ? `· ${data.carrier}` : ""}
          </p>
          <p className="mt-1 font-mono text-sm text-foreground">{data.trackingNumber}</p>
          {data.trackingUrl && (
            <a
              href={data.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Suivre mon colis <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {data.items.length > 0 && (
        <dl className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
          {data.items.map((item) => (
            <div key={`${item.name}-${item.quantity}`} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {item.quantity} × {item.name}
              </dt>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-border pt-2">
            <dt className="font-medium text-foreground">Total payé</dt>
            <dd className="font-semibold text-primary">
              {formatPrice(data.amountCents, data.currency)}
            </dd>
          </div>
        </dl>
      )}

      {data.events.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Historique détaillé
          </summary>
          <ul className="mt-2 space-y-1">
            {data.events
              .slice()
              .reverse()
              .map((e, i) => (
                <li key={`${e.at}-${i}`} className="text-xs text-muted-foreground">
                  {formatDateTime(e.at)} — {e.label}
                </li>
              ))}
          </ul>
        </details>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Cette page se met à jour automatiquement. Les créations numériques (logos, visuels) ne sont
        pas expédiées : elles vous sont envoyées par e-mail.
      </p>
    </div>
  );
}

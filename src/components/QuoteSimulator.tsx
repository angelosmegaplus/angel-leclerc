import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Calculator, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateQuote, type QuoteSimulation } from "@/lib/quote-estimator.functions";

const DEADLINES = ["Dès que possible", "Sous un mois", "Dans 1 à 3 mois", "Pas encore défini"];
const STRUCTURES = ["Entreprise", "Association", "Collectivité", "Indépendant", "Particulier"];

/**
 * Simulation de devis assistée par IA. Le résultat est indicatif : il ne
 * remplace jamais un devis écrit.
 */
export function QuoteSimulator() {
  const [need, setNeed] = useState("");
  const [structure, setStructure] = useState("");
  const [deadline, setDeadline] = useState("");
  const [result, setResult] = useState<QuoteSimulation | null>(null);
  const run = useServerFn(simulateQuote);

  const simulate = useMutation({
    mutationFn: () => run({ data: { need: need.trim(), structure, deadline } }),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Décrivez votre besoin : une estimation indicative est calculée à partir des prestations et tarifs publiés sur
        le site. Ce n’est pas un devis : seul un document écrit envoyé par Angel fait foi.
      </p>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (need.trim().length >= 10) simulate.mutate();
        }}
      >
        <label className="block text-sm font-medium text-foreground" htmlFor="quote-need">
          Votre besoin
        </label>
        <textarea
          id="quote-need"
          value={need}
          onChange={(event) => setNeed(event.target.value)}
          rows={4}
          maxLength={1200}
          placeholder="Ex. : nous ouvrons un gîte en avril et nous avons besoin d’un logo, d’un flyer et d’une page web simple."
          className="w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-muted-foreground">
            Vous êtes
            <select
              value={structure}
              onChange={(event) => setStructure(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Non précisé</option>
              {STRUCTURES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted-foreground">
            Délai souhaité
            <select
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Non précisé</option>
              {DEADLINES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <Button type="submit" className="min-h-11 rounded-full" disabled={simulate.isPending || need.trim().length < 10}>
          {simulate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
          Estimer ma demande
        </Button>
      </form>

      {simulate.isError ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          L’estimation n’a pas pu être calculée. Vous pouvez décrire votre demande dans le formulaire ci-dessus.
        </p>
      ) : null}

      {result ? (
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-4 w-4" /> Estimation indicative
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-foreground">{result.summary}</p>

          {result.steps.length > 0 ? (
            <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {result.steps.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-semibold text-primary">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Prix simulé</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{result.range}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.recurring ? "Formule mensuelle, sans engagement de durée." : "Montant total estimé pour l’ensemble décrit."}
            </p>
            <ul className="mt-3 space-y-1.5 border-t border-primary/15 pt-3 text-sm text-muted-foreground">
              {result.lines.map((line) => (
                <li key={line.label} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>{line.label}{line.note ? <span className="block text-xs opacity-80">{line.note}</span> : null}</span>
                  <span className="font-semibold text-foreground">{line.low} € – {line.high} €</span>
                </li>
              ))}
            </ul>
          </div>

          {result.assumptions.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {result.assumptions.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          ) : null}

          <p className="mt-3 text-xs text-muted-foreground">
            Simulation automatique et approximative : ce n’est pas un devis. Le prix réel est confirmé par écrit par Angel après un échange, et peut être différent.
          </p>

          <Button asChild className="mt-4 min-h-11 rounded-full">
            <Link
              to="/contact"
              search={{ parcours: "projet" as const, sujet: need.trim().slice(0, 400) }}
            >
              Envoyer cette demande à Angel <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

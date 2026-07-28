import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitProjectRequest } from "@/lib/contact.functions";

type FormState = {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
  website: string;
};

const initial: FormState = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  consent: false,
  website: "",
};

function inputClass(error?: string): string {
  return [
    "mt-1.5 w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors",
    "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30",
    error ? "border-destructive" : "border-border focus:border-primary",
  ].join(" ");
}

export function AlternanceForm() {
  const submit = useServerFn(submitProjectRequest);
  const [state, setState] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setState((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!state.fullName.trim()) e.fullName = "Nom requis.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email.trim())) e.email = "E-mail invalide.";
    if (!state.subject.trim()) e.subject = "Objet requis.";
    if (state.message.trim().length < 10) e.message = "Message trop court.";
    if (!state.consent) e.consent = "Merci de cocher cette case.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await submit({
        data: {
          fullName: state.fullName.trim(),
          email: state.email.trim(),
          phone: state.phone.trim(),
          structure: state.company.trim(),
          projectType: "Autre demande" as const,
          budget: "",
          deadline: "",
          description: `Objet : ${state.subject.trim()}\n\n${state.message.trim()}`,
          consent: true,
          website: state.website,
          file: null,
        },
      });
      setSuccess(true);
      setState(initial);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
        <div className="mx-auto inline-flex rounded-full bg-primary/10 p-3">
          <CheckCircle2 size={28} className="text-primary" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
          Message envoyé
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Merci pour votre message. Je reviendrai vers vous rapidement.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSuccess(false)}>
          Nouveau message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-foreground">Nom <span className="text-destructive">*</span></label>
          <input value={state.fullName} onChange={(e) => setField("fullName", e.target.value)} className={inputClass(errors.fullName)} autoComplete="name" />
          {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Entreprise</label>
          <input value={state.company} onChange={(e) => setField("company", e.target.value)} className={inputClass()} autoComplete="organization" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">E-mail <span className="text-destructive">*</span></label>
          <input type="email" value={state.email} onChange={(e) => setField("email", e.target.value)} className={inputClass(errors.email)} autoComplete="email" />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Téléphone <span className="font-normal text-muted-foreground">(facultatif)</span></label>
          <input type="tel" value={state.phone} onChange={(e) => setField("phone", e.target.value)} className={inputClass()} autoComplete="tel" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-foreground">Objet <span className="text-destructive">*</span></label>
          <input value={state.subject} onChange={(e) => setField("subject", e.target.value)} className={inputClass(errors.subject)} placeholder="Ex. Proposition d'alternance BTS Communication" />
          {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-foreground">Message <span className="text-destructive">*</span></label>
          <textarea rows={5} value={state.message} onChange={(e) => setField("message", e.target.value)} className={inputClass(errors.message)} placeholder="Présentation de la structure, missions envisagées, rythme…" />
          {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" checked={state.consent} onChange={(e) => setField("consent", e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border text-primary" />
            <span>J'accepte que mes informations soient utilisées pour répondre à ma demande.</span>
          </label>
          {errors.consent && <p className="mt-1 text-xs text-destructive">{errors.consent}</p>}
        </div>
        <div className="hidden" aria-hidden>
          <input type="text" tabIndex={-1} autoComplete="off" value={state.website} onChange={(e) => setField("website", e.target.value)} />
        </div>
      </div>

      {globalError && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Champs marqués d'un <span className="text-destructive">*</span> obligatoires.</p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/cv-angel-leclerc.pdf"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Télécharger mon CV
          </a>
          <a
            href="https://www.linkedin.com/in/angel-leclerc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Me contacter sur LinkedIn
          </a>
          <Button type="submit" size="lg" disabled={loading} className="bg-primary text-primary-foreground hover:bg-accent">
            {loading ? (<><Loader2 size={18} className="mr-2 animate-spin" /> Envoi…</>) : (<><Send size={18} className="mr-2" /> Envoyer un message</>)}
          </Button>
        </div>
      </div>
    </form>
  );
}
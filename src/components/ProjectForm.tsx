import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Paperclip, Send, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitProjectRequest } from "@/lib/contact.functions";

const PROJECT_TYPES = [
  "Gestion de projet",
  "Conseil en communication",
  "Rédaction ou contenu éditorial",
  "Affiche ou flyer",
  "Identité visuelle",
  "Recherche de prestataires",
  "Production audio, vidéo ou numérique",
  "Autre demande",
] as const;

const ACCEPT_ATTR =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  structure: string;
  projectType: string;
  budget: string;
  deadline: string;
  description: string;
  consent: boolean;
  website: string; // honeypot
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  structure: "",
  projectType: "",
  budget: "",
  deadline: "",
  description: "",
  consent: false,
  website: "",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lecture du fichier impossible."));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

export function ProjectForm() {
  const submit = useServerFn(submitProjectRequest);
  const [state, setState] = useState<FormState>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleFile = (f: File | null) => {
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("Fichier trop volumineux (10 Mo maximum).");
      return;
    }
    setFile(f);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!state.fullName.trim()) e.fullName = "Merci d'indiquer votre nom.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email.trim()))
      e.email = "Adresse e-mail invalide.";
    if (!state.projectType) e.projectType = "Veuillez choisir un type de projet.";
    if (state.description.trim().length < 10)
      e.description = "Merci de détailler un peu plus votre besoin (10 caractères minimum).";
    if (!state.consent) e.consent = "Merci de valider ce point avant l'envoi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      let filePayload: {
        name: string;
        type: string;
        size: number;
        dataBase64: string;
      } | null = null;
      if (file) {
        const dataBase64 = await fileToBase64(file);
        filePayload = {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataBase64,
        };
      }

      await submit({
        data: {
          fullName: state.fullName.trim(),
          email: state.email.trim(),
          phone: state.phone.trim(),
          structure: state.structure.trim(),
          projectType: state.projectType as (typeof PROJECT_TYPES)[number],
          budget: state.budget.trim(),
          deadline: state.deadline.trim(),
          description: state.description.trim(),
          consent: true,
          website: state.website,
          file: filePayload,
        },
      });

      setSuccess(true);
      setState(initialState);
      setFile(null);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue. Merci de réessayer.";
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
        <div className="mx-auto inline-flex rounded-full bg-primary/10 p-3">
          <CheckCircle2 size={28} className="text-primary" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
          Demande envoyée
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Je reviendrai vers vous rapidement. Un e-mail de confirmation vient de vous être envoyé.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setSuccess(false)}
        >
          Nouvelle demande
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Nom"
          required
          error={errors.fullName}
          input={
            <input
              type="text"
              autoComplete="name"
              value={state.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              className={inputClass(errors.fullName)}
            />
          }
        />
        <Field
          label="E-mail"
          required
          error={errors.email}
          input={
            <input
              type="email"
              autoComplete="email"
              value={state.email}
              onChange={(e) => setField("email", e.target.value)}
              className={inputClass(errors.email)}
            />
          }
        />
        <Field
          label="Téléphone"
          hint="facultatif"
          input={
            <input
              type="tel"
              autoComplete="tel"
              value={state.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass()}
            />
          }
        />
        <Field
          label="Structure"
          hint="facultatif"
          input={
            <input
              type="text"
              autoComplete="organization"
              value={state.structure}
              onChange={(e) => setField("structure", e.target.value)}
              className={inputClass()}
            />
          }
        />
        <Field
          label="Projet"
          required
          error={errors.projectType}
          className="md:col-span-2"
          input={
            <select
              value={state.projectType}
              onChange={(e) => setField("projectType", e.target.value)}
              className={inputClass(errors.projectType)}
            >
              <option value="">— Choisir —</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Budget"
          hint="facultatif"
          input={
            <input
              type="text"
              placeholder="Ex. 300 €"
              value={state.budget}
              onChange={(e) => setField("budget", e.target.value)}
              className={inputClass()}
            />
          }
        />
        <Field
          label="Délai"
          hint="facultatif"
          input={
            <input
              type="text"
              placeholder="Ex. fin mars"
              value={state.deadline}
              onChange={(e) => setField("deadline", e.target.value)}
              className={inputClass()}
            />
          }
        />
        <Field
          label="Description"
          required
          error={errors.description}
          className="md:col-span-2"
          input={
            <textarea
              rows={5}
              value={state.description}
              onChange={(e) => setField("description", e.target.value)}
              className={inputClass(errors.description)}
              placeholder="Objectifs, contexte, publics visés…"
            />
          }
        />

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-foreground">
            Fichier <span className="font-normal text-muted-foreground">(facultatif)</span>
          </label>
          {file ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-2.5">
              <div className="flex items-center gap-2 truncate">
                <Paperclip size={16} className="text-primary shrink-0" />
                <span className="truncate text-sm text-foreground">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFile(null)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Retirer le fichier"
              >
                <X size={14} /> Supprimer
              </button>
            </div>
          ) : (
            <label
              htmlFor="project-file"
              className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <Paperclip size={16} className="text-primary" />
              Ajouter un fichier
              <input
                id="project-file"
                type="file"
                accept={ACCEPT_ATTR}
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            10 Mo max. PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, WEBP.
          </p>
          {fileError && <p className="mt-1 text-xs text-destructive">{fileError}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={state.consent}
              onChange={(e) => setField("consent", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            />
            <span className="text-muted-foreground">
              J'accepte que mes informations soient utilisées pour répondre à ma demande.
            </span>
          </label>
          {errors.consent && (
            <p className="mt-1 text-xs text-destructive">{errors.consent}</p>
          )}
        </div>

        {/* Honeypot: hidden from real users */}
        <div className="hidden" aria-hidden>
          <label>
            Site internet
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={state.website}
              onChange={(e) => setField("website", e.target.value)}
            />
          </label>
        </div>
      </div>

      {globalError && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Les champs marqués d'un <span className="text-destructive">*</span> sont obligatoires.
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-accent"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" /> Envoi en cours…
            </>
          ) : (
            <>
              <Send size={18} className="mr-2" /> Présenter mon projet
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function inputClass(error?: string | null): string {
  return [
    "mt-1.5 w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors",
    "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30",
    error ? "border-destructive" : "border-border focus:border-primary",
  ].join(" ");
}

function Field({
  label,
  required,
  hint,
  error,
  input,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  input: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
        {hint && !required && (
          <span className="ml-1 font-normal text-muted-foreground">({hint})</span>
        )}
      </label>
      {input}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

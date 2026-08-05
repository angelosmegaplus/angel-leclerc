import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitConversationalContact } from "@/lib/contact-chat.functions";

export type Track = "projet" | "alternance" | "autre";

type Step = {
  id: string;
  question: string;
  help?: string;
  kind: "choice" | "multi" | "text" | "textarea" | "contact";
  options?: readonly string[];
  optional?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "tel";
};

const PROJET_STEPS: Step[] = [
  {
    id: "structure",
    question: "Vous représentez plutôt…",
    kind: "choice",
    options: [
      "Une entreprise",
      "Une association",
      "Une collectivité ou un service public",
      "Un porteur de projet ou indépendant",
      "Un particulier",
      "Autre",
    ],
  },
  {
    id: "nature",
    question: "En quelques mots, de quoi s'agit-il ?",
    help: "Un événement, une refonte, un lancement, un besoin ponctuel…",
    kind: "textarea",
    placeholder: "Ex. : nous organisons un festival en juin et tout est à créer.",
  },
  {
    id: "objectif",
    question: "Quel est l'objectif principal ?",
    kind: "choice",
    options: [
      "Me faire connaître",
      "Communiquer sur un événement",
      "Structurer ma communication",
      "Créer ou refondre un support",
      "Gagner du temps sur un projet",
      "Autre objectif",
    ],
  },
  {
    id: "prestations",
    question: "Quelles prestations vous intéressent ?",
    help: "Plusieurs choix possibles.",
    kind: "multi",
    options: [
      "Gestion de projet",
      "Conseil en communication",
      "Rédaction",
      "Affiche ou flyer",
      "Identité visuelle simple",
      "Site web",
      "Réseaux sociaux",
      "Audio / vidéo",
      "Autre",
      "Je ne sais pas encore",
    ],
  },
  {
    id: "delai",
    question: "Quel délai souhaitez-vous ?",
    kind: "choice",
    options: [
      "Dès que possible",
      "Sous un mois",
      "Dans 1 à 3 mois",
      "Plus tard ou pas encore défini",
    ],
  },
  {
    id: "budget",
    question: "Avez-vous un budget indicatif ?",
    help: "Facultatif — cela aide simplement à calibrer la proposition.",
    kind: "choice",
    optional: true,
    options: [
      "Moins de 300 €",
      "300 à 800 €",
      "800 à 2 000 €",
      "Plus de 2 000 €",
      "Je préfère en parler",
    ],
  },
  {
    id: "details",
    question: "Un détail complémentaire à ajouter ?",
    kind: "textarea",
    optional: true,
    placeholder: "Contraintes, existant, personnes impliquées…",
  },
  { id: "contact", question: "Comment puis-je vous répondre ?", kind: "contact" },
];

const ALTERNANCE_STEPS: Step[] = [
  {
    id: "organisation",
    question: "Quel est le nom de votre organisation ?",
    kind: "text",
    placeholder: "Entreprise, association, collectivité…",
  },
  {
    id: "interlocuteur",
    question: "Qui vous êtes, et quelle est votre fonction ?",
    kind: "text",
    placeholder: "Ex. : Camille Martin, responsable communication",
  },
  {
    id: "opportunite",
    question: "De quel type d'opportunité s'agit-il ?",
    kind: "choice",
    options: [
      "Alternance BTS Communication (rentrée 2026)",
      "Stage",
      "Mission ponctuelle",
      "Simple échange ou information",
    ],
  },
  {
    id: "missions",
    question: "Quelles missions envisagez-vous ?",
    kind: "textarea",
    placeholder: "Communication interne, réseaux sociaux, événementiel, vente…",
  },
  {
    id: "localisation",
    question: "Où se situerait le poste ?",
    kind: "text",
    placeholder: "Ville ou secteur",
  },
  {
    id: "rythme",
    question: "Un rythme d'alternance ou des contraintes particulières ?",
    kind: "text",
    optional: true,
    placeholder: "Ex. : 3 semaines entreprise / 1 semaine école",
  },
  {
    id: "echange",
    question: "Quand souhaiteriez-vous échanger ?",
    kind: "choice",
    options: ["Cette semaine", "Dans les 15 jours", "Ce mois-ci", "À définir ensemble"],
  },
  {
    id: "message",
    question: "Un message complémentaire ?",
    kind: "textarea",
    optional: true,
  },
  {
    id: "contact",
    question: "Vos coordonnées professionnelles",
    kind: "contact",
  },
];

const AUTRE_STEPS: Step[] = [
  {
    id: "message",
    question: "Je vous écoute : que souhaitez-vous me dire ou me demander ?",
    kind: "textarea",
    placeholder: "Écrivez librement…",
  },
  { id: "contact", question: "Comment puis-je vous répondre ?", kind: "contact" },
];

const TRACKS: Record<Track, { label: string; steps: Step[]; intro: string }> = {
  projet: {
    label: "Parler d'un projet de communication",
    steps: PROJET_STEPS,
    intro:
      "Avec plaisir. Quelques questions rapides pour bien cerner votre besoin — vous pouvez revenir en arrière à tout moment.",
  },
  alternance: {
    label: "Me contacter pour une alternance",
    steps: ALTERNANCE_STEPS,
    intro:
      "Merci beaucoup. Je recherche une alternance en BTS Communication pour la rentrée 2026, autour de Sarlat-la-Canéda pour la partie alternance uniquement. Quelques questions pour préparer notre échange.",
  },
  autre: {
    label: "Poser une autre question",
    steps: AUTRE_STEPS,
    intro: "Bien sûr. Dites-moi tout, je reviens vers vous rapidement.",
  },
};

const STORAGE_KEY = "alc-contact-chat";

type Saved = {
  track: Track | null;
  index: number;
  answers: Record<string, string>;
  contact: ContactState;
};

type ContactState = {
  name: string;
  email: string;
  phone: string;
  preference: string;
};

const EMPTY_CONTACT: ContactState = { name: "", email: "", phone: "", preference: "" };

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function ContactChat({ initialTrack }: { initialTrack?: Track }) {
  const [track, setTrack] = useState<Track | null>(initialTrack ?? null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactState>(EMPTY_CONTACT);
  const [consent, setConsent] = useState(false);
  const [honey, setHoney] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLParagraphElement>(null);

  const submit = useServerFn(submitConversationalContact);

  // Restauration de session (uniquement côté navigateur).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Saved;
        if (parsed.track && TRACKS[parsed.track]) {
          setTrack(initialTrack ?? parsed.track);
          setIndex(initialTrack && initialTrack !== parsed.track ? 0 : parsed.index);
          setAnswers(parsed.answers ?? {});
          setContact({ ...EMPTY_CONTACT, ...(parsed.contact ?? {}) });
        }
      }
    } catch {
      /* stockage indisponible */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ track, index, answers, contact } satisfies Saved),
      );
    } catch {
      /* stockage indisponible */
    }
  }, [hydrated, track, index, answers, contact]);

  const steps = track ? TRACKS[track].steps : [];
  const total = steps.length + 1; // + résumé
  const onSummary = track !== null && index >= steps.length;
  const current = onSummary ? null : (steps[index] ?? null);

  useEffect(() => {
    if (track) headingRef.current?.focus();
  }, [index, track]);

  const progress = track ? Math.min(100, Math.round((index / total) * 100)) : 0;

  const summaryRows = useMemo(() => {
    if (!track) return [];
    return steps
      .filter((s) => s.kind !== "contact")
      .map((s, i) => ({ step: s, i, value: answers[s.id] ?? "—" }));
  }, [track, steps, answers]);

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function next() {
    setError(null);
    setIndex((i) => i + 1);
  }

  function back() {
    setError(null);
    if (index === 0) {
      setTrack(null);
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
  }

  function validateAndNext() {
    if (!current) return;
    if (current.kind === "contact") {
      if (!contact.name.trim()) return setError("Merci d'indiquer votre nom.");
      if (!emailOk(contact.email)) return setError("Merci d'indiquer un e-mail valide.");
      return next();
    }
    const value = (answers[current.id] ?? "").trim();
    if (!current.optional && value.length < (current.kind === "textarea" ? 10 : 2)) {
      return setError(
        current.kind === "textarea"
          ? "Quelques mots de plus m'aideraient à bien comprendre."
          : "Merci de compléter cette réponse.",
      );
    }
    next();
  }

  async function handleSubmit() {
    if (!track || sending) return;
    setError(null);
    if (!consent) return setError("Merci d'accepter d'être recontacté·e.");
    if (!contact.name.trim() || !emailOk(contact.email)) {
      setError("Vos coordonnées sont incomplètes.");
      setIndex(steps.length - 1);
      return;
    }
    const payload = steps
      .filter((s) => s.kind !== "contact")
      .map((s) => ({ question: s.question, answer: (answers[s.id] ?? "").trim() }))
      .filter((a) => a.answer.length > 0);
    if (payload.length === 0) {
      setError("Merci de compléter au moins une réponse.");
      return;
    }
    setSending(true);
    try {
      await submit({
        data: {
          track,
          answers: payload,
          name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
          preference: contact.preference,
          structure: (answers["structure"] ?? answers["organisation"] ?? "").slice(0, 200),
          budget: (answers["budget"] ?? "").slice(0, 120),
          deadline: (answers["delai"] ?? answers["echange"] ?? "").slice(0, 120),
          consent: true,
          website: honey,
        },
      });
      setSent(true);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "L'envoi n'a pas abouti. Réessayez ou écrivez à contact@angel-leclerc.fr.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 size={32} className="mx-auto text-primary" aria-hidden />
        <h2 className="mt-4 font-display text-xl font-bold text-foreground">
          Message bien reçu, merci&nbsp;!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Un accusé de réception vient de partir vers {contact.email}. Je lis
          personnellement chaque demande et je réponds en général sous 48&nbsp;h ouvrées
          — parfois un peu plus en période chargée.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link to="/entreprise">Voir les services</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/parcours">Voir mon CV</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-7">
      {/* Progression */}
      {track && (
        <div className="mb-5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${Math.max(6, progress)}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{TRACKS[track].label}</span>
            <span>
              Étape {Math.min(index + 1, total)} / {total}
            </span>
          </div>
        </div>
      )}

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute h-0 w-0 opacity-0"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={track ? `${track}-${index}` : "start"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {!track && (
            <>
              <p
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-lg font-bold text-foreground outline-none md:text-xl"
              >
                Que souhaitez-vous faire&nbsp;?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Choisissez une entrée : je vous pose ensuite quelques questions, une par
                une.
              </p>
              <div className="mt-5 grid gap-2.5">
                {(Object.keys(TRACKS) as Track[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTrack(t);
                      setIndex(0);
                      setError(null);
                    }}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    {TRACKS[t].label}
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-primary transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            </>
          )}

          {track && index === 0 && (
            <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {TRACKS[track].intro}
            </p>
          )}

          {track && current && (
            <>
              <p
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-lg font-bold text-foreground outline-none md:text-xl"
              >
                {current.question}
              </p>
              {current.help && (
                <p className="mt-1.5 text-xs text-muted-foreground">{current.help}</p>
              )}

              <div className="mt-4">
                {current.kind === "choice" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {current.options?.map((opt) => {
                      const active = answers[current.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setAnswer(current.id, opt);
                            setError(null);
                            setTimeout(() => setIndex((i) => i + 1), 120);
                          }}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {current.kind === "multi" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {current.options?.map((opt) => {
                      const selected = (answers[current.id] ?? "")
                        .split(", ")
                        .filter(Boolean);
                      const active = selected.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            const next = active
                              ? selected.filter((s) => s !== opt)
                              : [...selected, opt];
                            setAnswer(current.id, next.join(", "));
                            setError(null);
                          }}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {current.kind === "text" && (
                  <input
                    type="text"
                    autoFocus
                    value={answers[current.id] ?? ""}
                    placeholder={current.placeholder}
                    onChange={(e) => setAnswer(current.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        validateAndNext();
                      }
                    }}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                )}

                {current.kind === "textarea" && (
                  <textarea
                    autoFocus
                    rows={4}
                    value={answers[current.id] ?? ""}
                    placeholder={current.placeholder}
                    onChange={(e) => setAnswer(current.id, e.target.value)}
                    className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none focus:border-primary"
                  />
                )}

                {current.kind === "contact" && (
                  <div className="grid gap-3">
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Nom et prénom *
                      </span>
                      <input
                        type="text"
                        autoFocus
                        value={contact.name}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, name: e.target.value }))
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        E-mail *
                      </span>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, email: e.target.value }))
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Téléphone (facultatif)
                      </span>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, phone: e.target.value }))
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </label>
                    <fieldset>
                      <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Vous préférez être recontacté·e par…
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {["E-mail", "Téléphone", "Peu importe"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={contact.preference === opt}
                            onClick={() =>
                              setContact((c) => ({ ...c, preference: opt }))
                            }
                            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                              contact.preference === opt
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-background text-muted-foreground hover:border-primary"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}
              </div>

              {track === "alternance" && index === 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/parcours">
                      <FileText size={15} aria-hidden />
                      Voir son CV
                    </Link>
                  </Button>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={back}>
                  <ArrowLeft size={15} aria-hidden />
                  Retour
                </Button>
                {current.kind !== "choice" && (
                  <Button size="sm" onClick={validateAndNext}>
                    {current.optional && !(answers[current.id] ?? "").trim()
                      ? "Passer"
                      : "Continuer"}
                    <ArrowRight size={15} aria-hidden />
                  </Button>
                )}
                {current.kind === "choice" && current.optional && (
                  <Button variant="outline" size="sm" onClick={next}>
                    Passer
                  </Button>
                )}
              </div>
            </>
          )}

          {track && onSummary && (
            <>
              <p
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-lg font-bold text-foreground outline-none md:text-xl"
              >
                Un dernier regard avant d'envoyer
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Cliquez sur une ligne pour la modifier.
              </p>

              <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {summaryRows.map((row) => (
                  <li key={row.step.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(row.i)}
                      className="flex w-full items-start justify-between gap-3 bg-background px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">
                          {row.step.question}
                        </span>
                        <span className="mt-0.5 block whitespace-pre-wrap text-sm text-foreground">
                          {row.value}
                        </span>
                      </span>
                      <Pencil size={14} className="mt-1 shrink-0 text-primary" aria-hidden />
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setIndex(steps.length - 1)}
                    className="flex w-full items-start justify-between gap-3 bg-background px-4 py-3 text-left transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">
                        Vos coordonnées
                      </span>
                      <span className="mt-0.5 block text-sm text-foreground">
                        {contact.name} — {contact.email}
                        {contact.phone ? ` — ${contact.phone}` : ""}
                        {contact.preference ? ` (${contact.preference})` : ""}
                      </span>
                    </span>
                    <Pencil size={14} className="mt-1 shrink-0 text-primary" aria-hidden />
                  </button>
                </li>
              </ul>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                />
                <span>
                  J'accepte qu'Angel Leclerc utilise ces informations pour me répondre.
                  Aucune donnée n'est cédée à des tiers (
                  <Link
                    to="/politique-confidentialite"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    politique de confidentialité
                  </Link>
                  ).
                </span>
              </label>

              {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={back}>
                  <ArrowLeft size={15} aria-hidden />
                  Retour
                </Button>
                <Button onClick={handleSubmit} disabled={sending}>
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                  ) : (
                    <Send size={16} aria-hidden />
                  )}
                  {sending ? "Envoi…" : "Envoyer ma demande"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

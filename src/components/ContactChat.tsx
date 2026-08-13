import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  MessageCircleQuestion,
  Pencil,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealContact } from "@/components/RevealContact";
import { Captcha, type CaptchaValue } from "@/components/Captcha";
import { submitConversationalContact } from "@/lib/contact-chat.functions";
import { askAssistant } from "@/lib/assistant.functions";
import { answer as localAnswer } from "@/lib/assistant-engine";

export type Track = "projet" | "alternance" | "autre";

type Step = {
  id: string;
  question: string;
  help?: string;
  kind: "choice" | "multi" | "text" | "textarea" | "contact";
  options?: readonly string[];
  optional?: boolean;
  placeholder?: string;
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
  { id: "contact", question: "Comment Angel peut-il vous répondre ?", kind: "contact" },
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
    question: "Qui êtes-vous, et quelle est votre fonction ?",
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
    help: "Pour l'alternance uniquement, Angel recherche autour de Sarlat-la-Canéda.",
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
  { id: "contact", question: "Vos coordonnées professionnelles", kind: "contact" },
];

const AUTRE_STEPS: Step[] = [
  {
    id: "message",
    question: "Je vous écoute : que souhaitez-vous dire ou demander à Angel ?",
    kind: "textarea",
    placeholder: "Écrivez librement…",
  },
  { id: "contact", question: "Comment Angel peut-il vous répondre ?", kind: "contact" },
];

const TRACKS: Record<Track, { label: string; steps: Step[]; intro: string }> = {
  projet: {
    label: "Parler d'un projet de communication",
    steps: PROJET_STEPS,
    intro:
      "Très bien. Je vais préparer un récapitulatif clair pour Angel. Quelques questions, une par une — et vous pouvez m'interrompre pour poser une question à tout moment.",
  },
  alternance: {
    label: "Me contacter pour une alternance",
    steps: ALTERNANCE_STEPS,
    intro:
      "Merci beaucoup. Angel recherche une alternance en BTS Communication pour la rentrée 2026, autour de Sarlat-la-Canéda pour cette alternance uniquement. Préparons votre message.",
  },
  autre: {
    label: "Poser une autre question",
    steps: AUTRE_STEPS,
    intro:
      "Bien sûr. Posez votre question : j'y réponds à partir des informations publiques du site, et je peux transmettre le nécessaire à Angel.",
  },
};

const NEXT_STEPS: Record<Track, string> = {
  projet:
    "Premier échange pour cadrer le besoin, puis proposition écrite et chiffrée si le projet se confirme.",
  alternance:
    "Échange téléphonique ou visio, envoi du CV détaillé et point sur le rythme d'alternance.",
  autre: "Réponse directe au visiteur, puis orientation vers la bonne ressource du site.",
};

const STORAGE_KEY = "alc-contact-chat";

const START_SUGGESTIONS = [
  "Que propose Angel exactement ?",
  "Combien coûte une affiche ?",
  "Comment se passe une mission ?",
  "Quel est son parcours ?",
];

type Msg = {
  id: string;
  role: "bot" | "user";
  text: string;
  /** Index d'étape auquel la réponse a été donnée (pour le retour arrière). */
  stepIndex?: number;
  /** Message hors parcours (question libre / réponse de l'assistant). */
  aside?: boolean;
  recap?: boolean;
};

type ContactState = {
  name: string;
  email: string;
  phone: string;
  preference: string;
  callback: boolean;
  callbackDate: string;
  callbackSlot: string;
};

const EMPTY_CONTACT: ContactState = {
  name: "",
  email: "",
  phone: "",
  preference: "",
  callback: false,
  callbackDate: "",
  callbackSlot: "",
};

type Saved = {
  track: Track | null;
  index: number;
  answers: Record<string, string>;
  contact: ContactState;
  messages: Msg[];
};

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const uid = () => Math.random().toString(36).slice(2, 10);

function detectTrack(text: string): Track | null {
  const t = text.toLowerCase();
  if (/(alternance|apprenti|stage|bts|recrut|poste|cv)/.test(t)) return "alternance";
  if (/(projet|devis|affiche|flyer|logo|site|communication|rédaction|réseaux)/.test(t))
    return "projet";
  return null;
}

export function ContactChat({ initialTrack }: { initialTrack?: Track }) {
  const [track, setTrack] = useState<Track | null>(initialTrack ?? null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [contact, setContact] = useState<ContactState>(EMPTY_CONTACT);
  const [consent, setConsent] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "" });
  const [honey, setHoney] = useState("");
  const [ask, setAsk] = useState("");
  const [thinking, setThinking] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [urgentConfirmed, setUrgentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const submit = useServerFn(submitConversationalContact);
  const askServer = useServerFn(askAssistant);

  const steps = track ? TRACKS[track].steps : [];
  const total = steps.length + 1; // + résumé
  const onSummary = track !== null && index >= steps.length;
  const current = onSummary ? null : (steps[index] ?? null);

  // Restauration de session (navigateur uniquement).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Saved;
        const sameTrack = !initialTrack || initialTrack === parsed.track;
        if (parsed.track && TRACKS[parsed.track]) setTrack(initialTrack ?? parsed.track);
        setIndex(sameTrack ? (parsed.index ?? 0) : 0);
        setAnswers(sameTrack ? (parsed.answers ?? {}) : {});
        setContact({ ...EMPTY_CONTACT, ...(parsed.contact ?? {}) });
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages.slice(-30));
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
        JSON.stringify({
          track,
          index,
          answers,
          contact,
          messages: messages.slice(-30),
        } satisfies Saved),
      );
    } catch {
      /* stockage indisponible */
    }
  }, [hydrated, track, index, answers, contact, messages]);

  useEffect(() => {
    if (track) headingRef.current?.focus({ preventScroll: true });
  }, [index, track]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length, thinking]);

  const progress = track ? Math.min(100, Math.round((index / total) * 100)) : 0;

  const summaryRows = useMemo(() => {
    if (!track) return [];
    return steps
      .filter((s) => s.kind !== "contact")
      .map((s, i) => ({ step: s, i, value: answers[s.id] ?? "—" }));
  }, [track, steps, answers]);

  const push = useCallback((msg: Omit<Msg, "id">) => {
    setMessages((prev) => [...prev, { id: uid(), ...msg }]);
  }, []);

  /** Répond à une question libre du visiteur, sans perdre l'étape en cours. */
  const handleAsk = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (question.length < 2 || thinking) return;
      setAsk("");
      setError(null);
      push({ role: "user", text: question, aside: true });
      setThinking(true);

      const history = messages.slice(-6).map((m) => ({
        role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
        content: m.text.slice(0, 1500),
      }));

      let text: string | null = null;
      try {
        const res = await askServer({
          data: { question: question.slice(0, 500), mode: "contact" as const, history },
        });
        text = res.text;
      } catch {
        text = null;
      }
      if (!text) text = localAnswer(question).text;
      setThinking(false);
      push({ role: "bot", text, aside: true });

      if (!track) {
        const guessed = detectTrack(question);
        if (guessed) {
          push({
            role: "bot",
            aside: true,
            text: `Si vous le souhaitez, je peux préparer un récapitulatif pour Angel sur ce sujet : « ${TRACKS[guessed].label} ».`,
          });
        }
      }
    },
    [askServer, messages, push, thinking, track],
  );

  function startTrack(t: Track) {
    setTrack(t);
    setIndex(0);
    setError(null);
    push({ role: "user", text: TRACKS[t].label });
    push({ role: "bot", text: TRACKS[t].intro });
  }

  function recordAnswer(step: Step, value: string, stepIndex: number) {
    setMessages((prev) => [
      ...prev.filter((m) => m.stepIndex !== stepIndex),
      { id: uid(), role: "user", text: value, stepIndex },
    ]);
    // Récapitulatif régulier, tous les trois éléments collectés.
    const collected = Object.entries({ ...answers, [step.id]: value }).filter(
      ([, v]) => v.trim().length > 0,
    );
    if (collected.length > 0 && collected.length % 3 === 0) {
      const recap = collected
        .slice(-3)
        .map(([id, v]) => {
          const s = steps.find((x) => x.id === id);
          return `• ${s ? s.question.replace(/\s*[:?]\s*$/, "") : id} : ${v}`;
        })
        .join("\n");
      push({
        role: "bot",
        recap: true,
        text: `Ce que j'ai compris jusqu'ici :\n${recap}`,
      });
    }
  }

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function back() {
    setError(null);
    if (index === 0) {
      setTrack(null);
      setMessages((prev) => prev.filter((m) => m.aside));
      return;
    }
    const target = index - 1;
    setMessages((prev) => prev.filter((m) => m.stepIndex === undefined || m.stepIndex < target));
    setIndex(target);
  }

  function validateAndNext() {
    if (!current) return;
    if (current.kind === "contact") {
      if (!contact.name.trim()) return setError("Merci d'indiquer votre nom.");
      if (!emailOk(contact.email)) return setError("Merci d'indiquer un e-mail valide.");
      recordAnswer(
        current,
        `${contact.name} — ${contact.email}${contact.phone ? ` — ${contact.phone}` : ""}`,
        index,
      );
      setError(null);
      setIndex((i) => i + 1);
      return;
    }
    const value = (answers[current.id] ?? "").trim();
    if (!current.optional && value.length < (current.kind === "textarea" ? 10 : 2)) {
      return setError(
        current.kind === "textarea"
          ? "Quelques mots de plus m'aideraient à bien comprendre."
          : "Merci de compléter cette réponse.",
      );
    }
    if (value) recordAnswer(current, value, index);
    setError(null);
    setIndex((i) => i + 1);
  }

  async function handleSubmit() {
    if (!track || sending) return;
    setError(null);
    if (!consent) return setError("Merci d'accepter d'être recontacté·e.");
    if (!captcha.token || !captcha.answer.trim()) {
      return setError("Merci de compléter la vérification anti-robot.");
    }
    if (!contact.name.trim() || !emailOk(contact.email)) {
      setError("Vos coordonnées sont incomplètes.");
      setIndex(steps.length - 1);
      return;
    }
    const payload = steps
      .filter((s) => s.kind !== "contact")
      .map((s) => ({ question: s.question, answer: (answers[s.id] ?? "").trim() }))
      .filter((a) => a.answer.length > 0);
    if (contact.callback) {
      const when = [contact.callbackDate.trim(), contact.callbackSlot.trim()]
        .filter(Boolean)
        .join(" — ");
      payload.push({
        question: "Souhaite être rappelé·e",
        answer: when || "Oui, sans préférence de créneau",
      });
    }
    if (urgent && urgentConfirmed) {
      payload.push({ question: "Demande signalée comme urgente", answer: "Oui" });
    }
    if (payload.length === 0) {
      setError("Merci de compléter au moins une réponse.");
      return;
    }
    const transcript = messages
      .filter((m) => m.aside && !m.recap)
      .slice(-12)
      .map((m) => `${m.role === "user" ? "Visiteur" : "Assistant"} : ${m.text}`)
      .join("\n\n")
      .slice(0, 5900);

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
          transcript,
          nextSteps: NEXT_STEPS[track],
          consent: true,
          captchaToken: captcha.token,
          captchaAnswer: captcha.answer.trim(),
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
          : "L'envoi n'a pas abouti. Réessayez dans quelques instants.",
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
          Récapitulatif transmis à Angel
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Il vient de partir avec vos coordonnées, et un accusé de réception a été envoyé à{" "}
          {contact.email}. Angel lit personnellement chaque message et vous répondra dès qu'il aura
          pu en prendre connaissance.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link to="/entreprise">Voir les services</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/parcours">Voir le CV</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-7">
      {/* Progression discrète */}
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

      {/* Transcription */}
      {messages.length > 0 && (
        <div className="mb-5 space-y-2.5" aria-live="polite" aria-label="Conversation en cours">
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={13} className="animate-spin" aria-hidden />
              L'assistant cherche dans le contenu du site…
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      )}

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
                Posez d'abord votre question si vous en avez une : j'y réponds à partir du contenu
                du site. Sinon, choisissez une entrée.
              </p>
              <div className="mt-5 grid gap-2.5">
                {(Object.keys(TRACKS) as Track[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => startTrack(t)}
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
              {messages.length === 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {START_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void handleAsk(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
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
                            recordAnswer(current, opt, index);
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
                      const selected = (answers[current.id] ?? "").split(", ").filter(Boolean);
                      const active = selected.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            const nextValues = active
                              ? selected.filter((s) => s !== opt)
                              : [...selected, opt];
                            setAnswer(current.id, nextValues.join(", "));
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
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Uniquement ce qui est nécessaire pour vous répondre.
                    </p>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Nom et prénom *
                      </span>
                      <input
                        type="text"
                        autoFocus
                        value={contact.name}
                        onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
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
                        onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
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
                        onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
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
                            onClick={() => setContact((c) => ({ ...c, preference: opt }))}
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

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={contact.callback}
                        onChange={(e) => setContact((c) => ({ ...c, callback: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="block text-foreground">Je souhaite être rappelé·e</span>
                        <span className="block text-xs text-muted-foreground">
                          Facultatif — vous pouvez indiquer un moment qui vous arrange.
                        </span>
                      </span>
                    </label>

                    {contact.callback && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm">
                          <span className="mb-1 block text-xs font-medium text-muted-foreground">
                            Date souhaitée (facultatif)
                          </span>
                          <input
                            type="date"
                            value={contact.callbackDate}
                            onChange={(e) =>
                              setContact((c) => ({ ...c, callbackDate: e.target.value }))
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                          />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-xs font-medium text-muted-foreground">
                            Heure ou créneau (facultatif)
                          </span>
                          <input
                            type="text"
                            value={contact.callbackSlot}
                            placeholder="Ex. : matin, ou 14 h - 16 h"
                            onChange={(e) =>
                              setContact((c) => ({ ...c, callbackSlot: e.target.value }))
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                          />
                        </label>
                      </div>
                    )}

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={urgent}
                        onChange={(e) => {
                          setUrgent(e.target.checked);
                          if (!e.target.checked) setUrgentConfirmed(false);
                        }}
                        className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="block text-foreground">C'est urgent</span>
                        <span className="block text-xs text-muted-foreground">
                          Réservé aux demandes réellement urgentes.
                        </span>
                      </span>
                    </label>

                    {urgent && !urgentConfirmed && (
                      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                        <p className="flex items-start gap-2 text-sm font-medium text-foreground">
                          <AlertTriangle size={15} className="mt-0.5 text-primary" aria-hidden />
                          Confirmez-vous qu'il s'agit d'une demande urgente&nbsp;?
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Après confirmation, les moyens de contact directs s'afficheront ici, avec
                          des boutons pour les copier.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setUrgentConfirmed(true)}>
                            Oui, c'est urgent
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setUrgent(false)}>
                            Non, annuler
                          </Button>
                        </div>
                      </div>
                    )}

                    {urgent && urgentConfirmed && <RevealContact compact />}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setIndex((i) => i + 1);
                    }}
                  >
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
                Voici ce que je vais transmettre à Angel
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
                      <span className="block text-xs text-muted-foreground">Vos coordonnées</span>
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
                  J'accepte qu'Angel Leclerc utilise ces informations pour me répondre. Aucune
                  donnée n'est cédée à des tiers (
                  <Link
                    to="/politique-confidentialite"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    politique de confidentialité
                  </Link>
                  ).
                </span>
              </label>

              <div className="mt-4">
                <Captcha value={captcha} onChange={setCaptcha} />
              </div>

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
                  {sending ? "Envoi…" : "Envoyer le récapitulatif"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Question libre, toujours disponible */}
      <div className="mt-6 border-t border-border pt-4">
        <label
          htmlFor="alc-ask"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
        >
          <MessageCircleQuestion size={14} className="text-primary" aria-hidden />
          Une question&nbsp;? Posez-la, j'y réponds puis nous reprenons.
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="alc-ask"
            type="text"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleAsk(ask);
              }
            }}
            placeholder="Ex. : quel est le tarif d'une affiche ?"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleAsk(ask)}
            disabled={thinking || ask.trim().length < 2}
          >
            {thinking ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : (
              <Sparkles size={15} aria-hidden />
            )}
            <span className="sr-only sm:not-sr-only">Demander</span>
          </Button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
          Les réponses sont générées à partir des informations publiques du site et peuvent contenir
          des erreurs ou des interprétations.
        </p>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-primary/10 text-foreground"
            : msg.recap
              ? "rounded-bl-sm border border-dashed border-border bg-background text-muted-foreground"
              : "rounded-bl-sm bg-muted text-foreground"
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  );
}

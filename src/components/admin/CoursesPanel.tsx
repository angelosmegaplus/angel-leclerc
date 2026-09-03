import { useEffect, useMemo, useState } from "react";
import { BookOpen, BrainCircuit, FileText, NotebookPen, Plus, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "flamme-os-private-courses-v1";

type CourseKind = "Cours" | "Note" | "Carte mentale" | "Fiche de révision" | "Autre";

type CourseDocument = {
  id: string;
  title: string;
  subject: string;
  kind: CourseKind;
  summary: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

type CourseDraft = Omit<CourseDocument, "id" | "createdAt" | "updatedAt"> & { id?: string };

const kinds: CourseKind[] = ["Cours", "Note", "Carte mentale", "Fiche de révision", "Autre"];

const emptyDraft: CourseDraft = {
  title: "",
  subject: "",
  kind: "Cours",
  summary: "",
  content: "",
  tags: [],
  favorite: false,
};

function readStoredCourses(): CourseDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function kindIcon(kind: CourseKind) {
  if (kind === "Carte mentale") return BrainCircuit;
  if (kind === "Note") return NotebookPen;
  if (kind === "Fiche de révision") return FileText;
  return BookOpen;
}

export function CoursesPanel() {
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"Tous" | CourseKind>("Tous");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDocuments(readStoredCourses());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents, ready]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents
      .filter((item) => kindFilter === "Tous" || item.kind === kindFilter)
      .filter((item) => {
        if (!q) return true;
        const haystack = [item.title, item.subject, item.summary, item.kind, ...item.tags].join(" ").toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
  }, [documents, kindFilter, search]);

  const openDocument = (item: CourseDocument) => {
    setDraft({
      id: item.id,
      title: item.title,
      subject: item.subject,
      kind: item.kind,
      summary: item.summary,
      content: item.content,
      tags: item.tags,
      favorite: item.favorite,
    });
  };

  const saveDocument = () => {
    if (!draft?.title.trim()) return toast.error("Ajoute un titre à ton document.");
    const now = new Date().toISOString();
    const next: CourseDocument = {
      id: draft.id ?? crypto.randomUUID(),
      title: draft.title.trim(),
      subject: draft.subject.trim(),
      kind: draft.kind,
      summary: draft.summary.trim(),
      content: draft.content,
      tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
      favorite: draft.favorite,
      createdAt: draft.id ? documents.find((item) => item.id === draft.id)?.createdAt ?? now : now,
      updatedAt: now,
    };
    setDocuments((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setDraft(null);
    toast.success("Document enregistré dans Mes Cours");
  };

  const removeDocument = (id: string) => {
    if (!window.confirm("Supprimer définitivement ce document ?")) return;
    setDocuments((current) => current.filter((item) => item.id !== id));
    if (draft?.id === id) setDraft(null);
    toast.success("Document supprimé");
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpen className="h-4 w-4" /> MES COURS
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Bibliothèque de cours privée</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Notes, cours, fiches de révision, cartes mentales et documents personnels. Rien ici n’est publié sur le site public.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft, tags: [] })} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau document
        </Button>
      </div>

      {draft ? (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Éditeur privé</p>
              <h3 className="text-xl font-bold">{draft.id ? "Modifier le document" : "Nouveau document"}</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDraft(null)} aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course-title">Titre *</Label>
                <Input id="course-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex. Chapitre 2 — Stratégie de communication" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-subject">Matière / thème</Label>
                <Input id="course-subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Ex. Culture de la communication" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course-kind">Type</Label>
                <select id="course-kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as CourseKind })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {kinds.map((kind) => <option key={kind}>{kind}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-tags">Tags</Label>
                <Input id="course-tags" value={draft.tags.join(", ")} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(",") })} placeholder="BTS, communication, chapitre 2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-summary">Résumé / mémo</Label>
              <Textarea id="course-summary" rows={2} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Les points essentiels à retenir…" />
            </div>

            <div className="space-y-2">
              <Label>Contenu</Label>
              <RichTextEditor value={draft.content} onChange={(content) => setDraft((current) => current ? { ...current, content } : current)} />
              <p className="text-xs text-muted-foreground">L’éditeur accepte la mise en forme, les tableaux, listes, images et liens — comme l’éditeur du Blog.</p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={draft.favorite} onChange={(e) => setDraft({ ...draft, favorite: e.target.checked })} />
              <Star className="h-4 w-4" /> Épingler dans Mes Cours
            </label>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setDraft(null)}>Annuler</Button>
              <Button onClick={saveDocument}>Enregistrer</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un cours, une matière, un tag…" className="pl-9" />
        </div>
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "Tous" | CourseKind)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option>Tous</option>
          {kinds.map((kind) => <option key={kind}>{kind}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => {
            const Icon = kindIcon(item.kind);
            return (
              <article key={item.id} className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/30">
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground"><Icon className="h-5 w-5" /></div>
                  <button type="button" onClick={() => openDocument(item)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold">{item.title}</h3>
                      {item.favorite ? <Star className="h-4 w-4 shrink-0 fill-current text-primary" /> : null}
                    </div>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{item.kind}{item.subject ? ` · ${item.subject}` : ""}</p>
                    {item.summary ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p> : null}
                    <p className="mt-3 text-xs text-muted-foreground">Modifié le {new Date(item.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => removeDocument(item.id)} aria-label={`Supprimer ${item.title}`} className="opacity-70 hover:text-destructive group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-bold">Aucun document</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crée ton premier cours, ta première note ou ta première carte mentale.</p>
        </div>
      )}
    </section>
  );
}

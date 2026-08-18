import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ADMIN_NAVIGATE_EVENT } from "@/lib/admin-navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Eye,
  Pencil,
  ArrowLeft,
  Paperclip,
  Lock,
  Star,
  X,
  Bell,
  Mail,
  Users,
  FileEdit,
  CalendarClock,
  AlertCircle,
  BarChart3,
  Inbox,
  LayoutList,
  ShoppingBag,
  FileText,
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  CalendarDays,
  FolderOpen,
  Gauge,
  Plug,
  Sparkles,
  Mic2,
  Activity,
  Search,
  Settings,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { ShopAdmin } from "@/components/ShopAdmin";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_TOPICS,
  getTopics,
  fetchStudioArticles,
  formatDate,
  formatDateTime,
  getArticleStatus,
  getAttachments,
  slugify,
  type Article,
  type ArticleAttachment,
  type ArticleStatus,
} from "@/lib/articles";
import {
  getSources,
  getAiDisclosure,
  emptyAiDisclosure,
  type ArticleSource,
  type AiDisclosure,
} from "@/lib/articles";
import { MailboxAdmin } from "@/components/MailboxAdmin";
import { describeDbError } from "@/lib/db-error";
import {
  saveArticleViaApi,
  deleteArticleViaApi,
  restoreArticleViaApi,
  purgeArticleViaApi,
} from "@/lib/article-api";
import { fetchTrashedArticles } from "@/lib/articles-trash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { sendNewsletterNow } from "@/lib/subscribers.functions";
import { AdminStats } from "@/components/AdminStats";
import { ContentAdmin } from "@/components/ContentAdmin";
import { FeedbackAdmin } from "@/components/FeedbackAdmin";
import {
  AdminShell,
  AdminCard,
  type AdminNavItem,
} from "@/components/admin/AdminShell";
import { AiActionsPanel } from "@/components/admin/AiActionsPanel";
import { AiSuggestions } from "@/components/admin/AiSuggestions";
import { ConnectionsPanel } from "@/components/admin/ConnectionsPanel";
import { NotificationsPanel } from "@/components/admin/NotificationsPanel";
import { AutomationPanel } from "@/components/admin/AutomationPanel";
import { InstallPrompt } from "@/components/admin/InstallPrompt";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { ProjectsPanel } from "@/components/admin/ProjectsPanel";
import { StudioPanel } from "@/components/admin/StudioPanel";
import { AgendaPanel } from "@/components/admin/AgendaPanel";
import { FilesPanel } from "@/components/admin/FilesPanel";
import { ActivityPanel } from "@/components/admin/ActivityPanel";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { AngelCommandCenter } from "@/components/admin/AngelCommandCenter";
import { ApplicationsPanel } from "@/components/admin/ApplicationsPanel";
import { AdminAutomationSummary } from "@/components/admin/AdminAutomationSummary";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Angel OS | Centre de contrôle" },
      {
        name: "description",
        content:
          "Centre de contrôle privé Angel OS : commandes IA, candidatures, contenus, projets et connexions.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Angel OS | Centre de contrôle" },
      {
        property: "og:description",
        content: "Centre de contrôle privé Angel OS.",
      },
      { name: "twitter:title", content: "Angel OS | Centre de contrôle" },
      {
        name: "twitter:description",
        content: "Centre de contrôle privé Angel OS.",
      },
    ],
  }),
  component: AdminPage,
});

type Draft = {
  id: string | null;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  cover_url: string;
  status: ArticleStatus;
  scheduled_at: string;
  is_private: boolean;
  featured: boolean;
  attachments: ArticleAttachment[];
  sources: ArticleSource[];
  topics: string[];
  ai: AiDisclosure;
};


const emptyDraft: Draft = {
  id: null,
  title: "",
  slug: "",
  category: "Article",
  excerpt: "",
  content: "",
  cover_url: "",
  status: "publie",
  scheduled_at: "",
  is_private: false,
  featured: false,
  attachments: [],
  sources: [],
  topics: [],
  ai: emptyAiDisclosure,
};

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

type AdminTab =
  | "dashboard"
  | "articles"
  | "messages"
  | "boite-mail"
  | "abonnes"
  | "stats"
  | "contenus"
  | "avis"
  | "boutique"
  | "projets"
  | "candidatures"
  | "agenda"
  | "fichiers"
  | "studio"
  | "activite"
  | "connexions"
  | "notifications"
  | "automatisation"
  | "parametres"
  | "angel-ai";

/** ISO -> valeur d'un <input type="datetime-local"> en heure locale. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSchedule(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d.toISOString());
}

async function uploadAttachment(file: File): Promise<ArticleAttachment> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from("article-files")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("article-files")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("URL indisponible");
  return { name: file.name, url: data.signedUrl, size: file.size };
}

/** Import d'une image de couverture dans le stockage Supabase. */
async function uploadCover(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `covers/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("article-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("article-images")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("URL indisponible");
  return data.signedUrl;
}

function AdminPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading, user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [tab, setTab] = useState<AdminTab>("dashboard");

  // Raccourcis d'application installée et retours OAuth : /admin?tab=studio
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested) setTab(requested as AdminTab);
  }, []);

  // Navigation interne demandée par un panneau (ex. « Ouvrir les connexions »).
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (typeof next === "string" && next) setTab(next as AdminTab);
    };
    window.addEventListener(ADMIN_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(ADMIN_NAVIGATE_EVENT, onNavigate);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === tab) return;
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  }, [tab]);
  const [searchOpen, setSearchOpen] = useState(false);
  const sendNewsletter = useServerFn(sendNewsletterNow);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: fetchStudioArticles,
    enabled: Boolean(session) && isAdmin,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-contact-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(session) && isAdmin,
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(session) && isAdmin,
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const slug = d.slug ? slugify(d.slug) : slugify(d.title);
      const scheduledIso =
        d.status === "programme" && d.scheduled_at
          ? new Date(d.scheduled_at).toISOString()
          : null;
      const isPublished = d.status !== "brouillon";
      const payload = {
        ...(d.id ? { id: d.id } : {}),
        title: d.title.trim(),
        slug,
        category: d.category,
        excerpt: d.excerpt.trim() || null,
        content: d.content,
        cover_url: d.cover_url.trim() || null,
        published: isPublished,
        scheduled_at: scheduledIso,
        is_private: d.is_private,
        featured: d.featured,
        attachments: d.attachments,
        sources: d.sources.filter((s) => s.label.trim() && s.url.trim()),
        topics: d.topics,
        ai_disclosure: d.ai,
        published_at: isPublished ? (scheduledIso ?? new Date().toISOString()) : null,
        author_id: user?.id ?? null,
      };
      // Source unique : route API stable, partagée avec l'éditeur Lovable.
      await saveArticleViaApi(payload);
      return slug;
    },
    onSuccess: () => {
      toast.success("Article enregistré");
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDraft(null);
    },
    onError: (err: unknown) => {
      const detail = describeDbError(err);
      setSaveError(detail);
      toast.error("Enregistrement impossible", {
        description: detail,
        duration: 12000,
      });
      console.error("[admin] échec d'enregistrement de l'article", err);
    },
  });

  const remove = useMutation({
    mutationFn: async (slug: string) => {
      await deleteArticleViaApi(slug);
    },
    onSuccess: () => {
      toast.success("Article placé dans la corbeille");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles-trash"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (err: unknown) => {
      toast.error("Suppression impossible", {
        description: describeDbError(err),
        duration: 12000,
      });
    },
  });

  const { data: trashed = [] } = useQuery({
    queryKey: ["admin-articles-trash"],
    queryFn: fetchTrashedArticles,
    enabled: Boolean(session) && isAdmin,
  });

  const restore = useMutation({
    mutationFn: (slug: string) => restoreArticleViaApi(slug),
    onSuccess: () => {
      toast.success("Article restauré en brouillon privé");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles-trash"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (err: unknown) =>
      toast.error("Restauration impossible", { description: describeDbError(err), duration: 12000 }),
  });

  const purge = useMutation({
    mutationFn: (slug: string) => purgeArticleViaApi(slug),
    onSuccess: () => {
      toast.success("Article supprimé définitivement");
      queryClient.invalidateQueries({ queryKey: ["admin-articles-trash"] });
    },
    onError: (err: unknown) =>
      toast.error("Suppression définitive impossible", { description: describeDbError(err), duration: 12000 }),
  });

  const previewSlug = useMemo(
    () => (draft ? slugify(draft.slug || draft.title) : ""),
    [draft],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session && !isAdmin) {
    return (
      <section className="bg-background py-20">
        <div className="mx-auto max-w-md px-5 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Accès non autorisé
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ce compte n'a pas les droits de publication.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </section>
    );
  }

  const navItems: AdminNavItem[] = [
    { key: "dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, group: "Essentiel", primary: true },
    { key: "angel-ai", label: "Demander à l'IA", icon: Sparkles, group: "Essentiel", primary: true },
    { key: "candidatures", label: "Candidatures", icon: Briefcase, group: "Essentiel", primary: true },
    { key: "messages", label: "Messages", icon: Mail, badge: unreadCount, group: "Essentiel", primary: true },
    { key: "articles", label: "Articles", icon: FileText, badge: articles.length, group: "Essentiel", primary: true },
    { key: "agenda", label: "Agenda", icon: CalendarDays, group: "Essentiel", primary: true },
    { key: "connexions", label: "Connexions", icon: Plug, group: "Essentiel", primary: true },
    { key: "contenus", label: "Parcours & services", icon: LayoutList, group: "Publication" },
    { key: "avis", label: "Avis et soutiens", icon: Star, group: "Publication" },
    { key: "boite-mail", label: "Boîte mail", icon: Inbox, group: "Relations" },
    { key: "abonnes", label: "Abonnés", icon: Users, badge: subscribers.length, group: "Relations" },
    { key: "boutique", label: "Boutique", icon: ShoppingBag, group: "Activité" },
    { key: "stats", label: "Statistiques", icon: BarChart3, group: "Activité" },
    { key: "projets", label: "Projets", icon: FolderKanban, group: "Modules" },
    { key: "studio", label: "Studio / Journalisme", icon: Mic2, group: "Modules" },
    { key: "fichiers", label: "Fichiers", icon: FolderOpen, group: "Modules" },
    { key: "activite", label: "Activité", icon: Activity, group: "Système" },
    { key: "notifications", label: "Notifications", icon: Bell, group: "Système" },
    { key: "automatisation", label: "Automatisation", icon: Gauge, group: "Système" },
    { key: "parametres", label: "Paramètres", icon: Settings, group: "Système" },
  ];

  const currentLabel =
    navItems.find((i) => i.key === tab)?.label ?? "Angel OS";

  return (
    <AdminShell
      items={navItems}
      active={tab}
      onSelect={(key) => {
        setTab(key as AdminTab);
        setDraft(null);
      }}
      title={draft ? (draft.id ? "Modifier l'article" : "Nouvel article") : currentLabel}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            className="min-h-10"
            aria-label="Recherche globale"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Rechercher</span>
          </Button>
          <Button
            size="sm"
            className="min-h-10"
            onClick={() => {
              setTab("articles");
              setDraft({ ...emptyDraft });
            }}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nouvel article</span>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden min-h-10 sm:inline-flex">
            <Link to="/articles">
              <Eye className="mr-2 h-4 w-4" /> Voir le site
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-10"
            aria-label="Déconnexion"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </>
      }
    >
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(key) => {
          setTab(key as AdminTab);
          setDraft(null);
        }}
      />
      <div>
        <InstallPrompt />
        {tab === "dashboard" && !draft && (
          <div className="space-y-5">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ["Nouvel article", () => { setTab("articles"); setDraft({ ...emptyDraft }); }],
                ["Nouveau projet", () => setTab("projets")],
                ["Nouvelle candidature", () => setTab("candidatures")],
                ["Studio", () => setTab("studio")],
                ["Agenda", () => setTab("agenda")],
              ] as const
            ).map(([label, action]) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="min-h-10 shrink-0"
                onClick={action}
              >
                {label}
              </Button>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["Articles", articles.length, FileText],
                ["Messages non lus", unreadCount, Mail],
                ["Abonnés", subscribers.length, Users],
                ["Publiés", articles.filter((a) => getArticleStatus(a) === "publie").length, Eye],
              ] as const
            ).map(([label, value, Icon]) => (
              <div
                key={label}
                className="rounded-xl border border-border/70 bg-background px-3 py-2.5"
              >
                <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </dt>
                <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <AdminAutomationSummary />

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Derniers articles" description="Vos publications les plus récemment modifiées.">
              {articles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun article pour l'instant.</p>
              ) : (
                <ul className="space-y-2">
                  {articles.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
                      <span className="min-w-0 truncate text-sm text-foreground">{a.title}</span>
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                        {getArticleStatus(a)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-4 min-h-10"
                onClick={() => setTab("articles")}
              >
                Ouvrir les articles
              </Button>
            </AdminCard>

            <AdminCard title="Derniers messages" description="Demandes reçues via le site.">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun message reçu.</p>
              ) : (
                <ul className="space-y-2">
                  {messages.slice(0, 5).map((m) => (
                    <li key={m.id} className="rounded-lg border border-border/70 bg-background px-3 py-2">
                      <p className="truncate text-sm font-medium text-foreground">{m.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.project_type}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-4 min-h-10"
                onClick={() => setTab("messages")}
              >
                Ouvrir la messagerie
              </Button>
            </AdminCard>
          </div>

          <AdminCard title="Connexions réelles" description="Aucun service n'est déclaré connecté sans preuve serveur.">
            <Button variant="outline" className="min-h-11" onClick={() => setTab("connexions")}>
              <Plug className="mr-2 h-4 w-4" /> Vérifier les connexions
            </Button>
          </AdminCard>
          </div>
        )}

        {draft ? (
          <form
            className="mt-4 space-y-5 rounded-[1.5rem] border border-[#E6DED2] bg-[#FFFDF9] p-4 text-[#181716] shadow-[0_20px_70px_rgba(0,0,0,.22)] sm:p-6 [&_.text-muted-foreground]:!text-[#6F6B65] [&_.text-foreground]:!text-[#181716] [&_.bg-background]:!bg-[#FFFDF9] [&_.bg-card]:!bg-[#FFFDF9] [&_.border-border]:!border-[#E6DED2] [&_input]:!border-[#D9D0C4] [&_input]:!bg-white [&_input]:!text-[#181716] [&_textarea]:!border-[#D9D0C4] [&_textarea]:!bg-white [&_textarea]:!text-[#181716] [&_select]:!border-[#D9D0C4] [&_select]:!bg-white [&_select]:!text-[#181716]"
            onSubmit={(e) => {
              e.preventDefault();
              setSaveError(null);
              const text = draft.content.replace(/<[^>]*>/g, "").trim();
              if (!text && !draft.content.includes("<img")) {
                toast.error("Le contenu de l'article est vide.");
                return;
              }
              if (draft.status === "programme") {
                if (!draft.scheduled_at) {
                  toast.error("Choisissez une date de publication différée.");
                  return;
                }
                if (new Date(draft.scheduled_at) <= new Date()) {
                  toast.error("La date de publication doit être dans le futur.");
                  return;
                }
              }
              save.mutate(draft);
            }}
          >
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Retour à la liste
            </button>

            {saveError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">
                    L'article n'a pas pu être enregistré
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/80 break-words">
                    {saveError}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ARTICLE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Lien de la page (optionnel)</Label>
                <Input
                  id="slug"
                  placeholder="généré à partir du titre"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  /articles/{previewSlug || "…"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Chapô / résumé</Label>
              <Textarea
                id="excerpt"
                rows={2}
                value={draft.excerpt}
                onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Image de couverture (URL, optionnel)</Label>
              <Input
                id="cover"
                type="url"
                placeholder="https://…"
                value={draft.cover_url}
                onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-upload">
                …ou importer une image de couverture
              </Label>
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                disabled={uploadingCover}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploadingCover(true);
                  try {
                    const url = await uploadCover(file);
                    setDraft((d) => (d ? { ...d, cover_url: url } : d));
                    toast.success("Couverture importée");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Échec de l'import",
                    );
                  } finally {
                    setUploadingCover(false);
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              {uploadingCover && (
                <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Import en cours…
                </p>
              )}
              {draft.cover_url && (
                <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                  <img
                    src={draft.cover_url}
                    alt="Aperçu de la couverture"
                    className="max-h-48 w-full rounded-md object-cover"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("cover-upload")?.click()
                      }
                    >
                      Remplacer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDraft({ ...draft, cover_url: "" })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Retirer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenu *</Label>
              <RichTextEditor
                value={draft.content}
                onChange={(html) => setDraft({ ...draft, content: html })}
              />
              <p className="text-[11px] text-muted-foreground">
                Gras, italique, titres, listes, liens et images : utilisez la barre
                d'outils ci-dessus.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fichiers joints (PDF, images, documents…)</Label>
              <div className="space-y-2">
                {draft.attachments.map((f, i) => (
                  <div
                    key={f.url}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          attachments: draft.attachments.filter((_, j) => j !== i),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Retirer ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                id="attachments"
                type="file"
                multiple
                disabled={uploadingFile}
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (files.length === 0) return;
                  setUploadingFile(true);
                  try {
                    const uploaded = await Promise.all(files.map(uploadAttachment));
                    setDraft((d) =>
                      d ? { ...d, attachments: [...d.attachments, ...uploaded] } : d,
                    );
                    toast.success("Fichier(s) ajouté(s)");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Échec de l'import",
                    );
                  } finally {
                    setUploadingFile(false);
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              {uploadingFile && (
                <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Import en cours…
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sources / crédits</Label>
              <p className="text-[11px] text-muted-foreground">
                Affichés en bas de l'article public dans « Sources et crédits ».
              </p>
              <div className="space-y-2">
                {draft.sources.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      className="min-w-[9rem] flex-1"
                      placeholder="Libellé (ex. Le Monde)"
                      value={s.label}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          sources: draft.sources.map((x, j) =>
                            j === i ? { ...x, label: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <Input
                      className="min-w-[9rem] flex-1"
                      type="url"
                      placeholder="https://…"
                      value={s.url}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          sources: draft.sources.map((x, j) =>
                            j === i ? { ...x, url: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Retirer la source ${i + 1}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          sources: draft.sources.filter((_, j) => j !== i),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    ...draft,
                    sources: [...draft.sources, { label: "", url: "" }],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter une source
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-background p-4">
              <Label>Catégories thématiques</Label>
              <p className="text-[11px] text-muted-foreground">
                Optionnel — une ou plusieurs. Affichées en badges sur le blog.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ARTICLE_TOPICS.map((t) => {
                  const active = draft.topics.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          topics: active
                            ? draft.topics.filter((x) => x !== t)
                            : [...draft.topics, t],
                        })
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "border-input text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">Transparence IA</p>
              <p className="text-[11px] text-muted-foreground">
                Rien n'est affiché publiquement si aucune case n'est cochée.
              </p>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.ai.personal}
                  onChange={(e) =>
                    setDraft({ ...draft, ai: { ...draft.ai, personal: e.target.checked } })
                  }
                />
                Texte personnel / réflexion personnelle
              </label>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.ai.chatgpt}
                  onChange={(e) =>
                    setDraft({ ...draft, ai: { ...draft.ai, chatgpt: e.target.checked } })
                  }
                />
                ChatGPT utilisé pour reformuler certains passages et améliorer la
                lisibilité
              </label>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.ai.otherAi}
                  onChange={(e) =>
                    setDraft({ ...draft, ai: { ...draft.ai, otherAi: e.target.checked } })
                  }
                />
                Autre IA utilisée pour le texte
              </label>
              {draft.ai.otherAi && (
                <Input
                  placeholder="Nom de l'IA (ex. Gemini, Claude…) — facultatif"
                  value={draft.ai.otherAiName}
                  onChange={(e) =>
                    setDraft({ ...draft, ai: { ...draft.ai, otherAiName: e.target.value } })
                  }
                />
              )}
              <label className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.ai.images}
                  onChange={(e) =>
                    setDraft({ ...draft, ai: { ...draft.ai, images: e.target.checked } })
                  }
                />
                Images générées ou retouchées avec une IA
              </label>
              {draft.ai.images && (
                <Input
                  placeholder="Outil utilisé (facultatif)"
                  value={draft.ai.imagesTool}
                  onChange={(e) =>
                    setDraft({ ...draft, ai: { ...draft.ai, imagesTool: e.target.value } })
                  }
                />
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">Statut de publication</p>
              <div className="space-y-2">
                {(
                  [
                    ["brouillon", "Brouillon — non visible sur le site"],
                    ["publie", "Publier immédiatement"],
                    ["programme", "Publication différée (à une date et heure)"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={draft.status === value}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          status: value,
                          scheduled_at:
                            value === "programme"
                              ? draft.scheduled_at || defaultSchedule()
                              : "",
                        })
                      }
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    {value === "brouillon" && (
                      <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {value === "programme" && (
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {label}
                  </label>
                ))}
              </div>
              {draft.status === "programme" && (
                <div className="space-y-1 pl-6">
                  <Label htmlFor="scheduled_at" className="text-xs">
                    Date et heure de mise en ligne
                  </Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    required
                    value={draft.scheduled_at}
                    min={toLocalInput(new Date().toISOString())}
                    onChange={(e) =>
                      setDraft({ ...draft, scheduled_at: e.target.value })
                    }
                    className="max-w-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    L'article apparaîtra automatiquement sur le site à cette date.
                  </p>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.is_private}
                  onChange={(e) =>
                    setDraft({ ...draft, is_private: e.target.checked })
                  }
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Masquer du site public (conserver uniquement dans Angel OS)
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
                Mettre en avant en première page
              </label>
            </div>

            <AiSuggestions
              draft={{
                title: draft.title,
                excerpt: draft.excerpt,
                content: draft.content,
                topics: draft.topics,
                category: draft.category,
              }}
              onApply={(patch) => setDraft({ ...draft, ...patch })}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={save.isPending} className="min-h-11">
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Valider et enregistrer
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setDraft(null)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <>
            {tab === "angel-ai" && (
              <div className="space-y-5">
                <AngelCommandCenter />
                <AiActionsPanel />
              </div>
            )}

            {tab === "connexions" && <ConnectionsPanel />}

            {tab === "notifications" && <NotificationsPanel />}

            {tab === "automatisation" && <AutomationPanel />}

            {tab === "parametres" && <SettingsPanel />}

            {tab === "projets" && (
              <div className="mt-6">
                <ProjectsPanel />
              </div>
            )}

            {tab === "studio" && (
              <div className="mt-6">
                <StudioPanel />
              </div>
            )}

            {tab === "activite" && (
              <div className="mt-6">
                <ActivityPanel />
              </div>
            )}

            {tab === "candidatures" && (
              <div className="mt-6">
                <ApplicationsPanel />
              </div>
            )}

            {tab === "agenda" && (
              <div className="mt-6">
                <AgendaPanel />
              </div>
            )}

            {tab === "fichiers" && (
              <div className="mt-6">
                <FilesPanel />
              </div>
            )}

            {tab === "stats" && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
                <AdminAutomationSummary mode="stats" />
                <AdminStats />
              </div>
            )}

            {tab === "contenus" && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
                <ContentAdmin />
              </div>
            )}

            {tab === "avis" && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
                <FeedbackAdmin />
              </div>
            )}

            {tab === "boutique" && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
                <ShopAdmin />
              </div>
            )}

            {tab === "boite-mail" && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
                <AdminAutomationSummary mode="mail" />
                <MailboxAdmin />
              </div>
            )}

            {tab === "messages" && (
              <div className="mt-8 space-y-3">
                <AdminAutomationSummary mode="messages" />
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun message reçu pour le moment.
                  </p>
                )}
                {messages.map((m) => (
                  <details
                    key={m.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <summary className="cursor-pointer list-none">
                      <span className="flex flex-wrap items-center gap-2">
                        {!m.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <span className="font-medium text-foreground">
                          {m.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.project_type} · {formatDate(m.created_at)}
                        </span>
                      </span>
                    </summary>
                    <div className="mt-3 space-y-2 text-sm text-foreground">
                      <p className="text-muted-foreground">
                        {m.email}
                        {m.phone ? ` · ${m.phone}` : ""}
                        {m.structure ? ` · ${m.structure}` : ""}
                      </p>
                      {(m.budget || m.deadline) && (
                        <p className="text-xs text-muted-foreground">
                          Budget : {m.budget || "—"} · Délai : {m.deadline || "—"}
                        </p>
                      )}
                      <p className="whitespace-pre-line">{m.description}</p>
                      {m.attachment_name && (
                        <p className="text-xs text-muted-foreground">
                          Fichier joint : {m.attachment_name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`mailto:${m.email}`}>Répondre</a>
                        </Button>
                        {!m.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await supabase
                                .from("contact_requests")
                                .update({ is_read: true })
                                .eq("id", m.id);
                              queryClient.invalidateQueries({
                                queryKey: ["admin-contact-requests"],
                              });
                            }}
                          >
                            Marquer comme lu
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!confirm("Supprimer ce message ?")) return;
                            await supabase
                              .from("contact_requests")
                              .delete()
                              .eq("id", m.id);
                            queryClient.invalidateQueries({
                              queryKey: ["admin-contact-requests"],
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}

            {tab === "abonnes" && (
              <div className="mt-8 space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Lettre hebdomadaire
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Envoi automatique chaque dimanche soir aux abonnés confirmés,
                    uniquement s'il y a de nouveaux articles depuis le dernier envoi.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={sendingNewsletter}
                    onClick={async () => {
                      if (!confirm("Envoyer la lettre maintenant aux abonnés confirmés ?"))
                        return;
                      setSendingNewsletter(true);
                      try {
                        const res = await sendNewsletter({ data: undefined });
                        toast.success(
                          res.skipped
                            ? res.skipped
                            : `Lettre envoyée à ${res.sent} abonné(s) — ${res.articles} article(s).`,
                        );
                        queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Envoi impossible",
                        );
                      } finally {
                        setSendingNewsletter(false);
                      }
                    }}
                  >
                    {sendingNewsletter ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bell className="mr-2 h-4 w-4" />
                    )}
                    Envoyer maintenant
                  </Button>
                </div>

                {subscribers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun abonné pour le moment.
                  </p>
                )}
                {subscribers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {s.first_name ? `${s.first_name} · ` : ""}
                      {s.email}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${
                          !s.active
                            ? "bg-muted text-muted-foreground"
                            : s.confirmed_at
                              ? "bg-primary/10 text-primary"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {!s.active
                          ? "désabonné"
                          : s.confirmed_at
                            ? "confirmé"
                            : "en attente"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(s.created_at)}
                      </span>
                      {s.active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await supabase
                              .from("blog_subscribers")
                              .update({ active: false })
                              .eq("id", s.id);
                            queryClient.invalidateQueries({
                              queryKey: ["admin-subscribers"],
                            });
                            toast.success("Abonné désinscrit.");
                          }}
                        >
                          Désinscrire
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm(`Supprimer ${s.email} ?`)) return;
                          await supabase
                            .from("blog_subscribers")
                            .delete()
                            .eq("id", s.id);
                          queryClient.invalidateQueries({
                            queryKey: ["admin-subscribers"],
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === "articles" && (
            <>
            <div className="mt-8"><AdminAutomationSummary mode="publications" /></div>
            <Button className="mt-8" onClick={() => setDraft({ ...emptyDraft })}>
              <Plus className="mr-2 h-4 w-4" /> Nouvel article
            </Button>

            <div className="mt-8 space-y-3">
              {isLoading && (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              )}
              {!isLoading && articles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun article pour le moment. Cliquez sur « Nouvel article ».
                </p>
              )}
              {articles.map((a: Article) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{a.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.category} ·{" "}
                      {getArticleStatus(a) === "brouillon" && "brouillon"}
                      {getArticleStatus(a) === "programme" &&
                        `programmé pour le ${formatDateTime(a.scheduled_at)}`}
                      {getArticleStatus(a) === "publie" &&
                        `publié ${formatDate(a.published_at ?? a.created_at)}`}
                      {a.is_private && " · masqué du public"}
                      {a.featured && " · à la une"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getArticleStatus(a) === "publie" && !a.is_private && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={`/articles/${a.slug}`} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDraft({
                          id: a.id,
                          title: a.title,
                          slug: a.slug,
                          category: a.category,
                          excerpt: a.excerpt ?? "",
                          content: a.content,
                          cover_url: a.cover_url ?? "",
                          status: getArticleStatus(a),
                          scheduled_at: toLocalInput(a.scheduled_at),
                          is_private: a.is_private,
                          featured: a.featured,
                          attachments: getAttachments(a),
                          sources: getSources(a),
                          topics: getTopics(a),
                          ai: getAiDisclosure(a),
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Supprimer « ${a.title} » ?`)) remove.mutate(a.slug);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h3 className="text-sm font-semibold text-foreground">
                Corbeille {trashed.length > 0 && `(${trashed.length})`}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Les articles supprimés sont conservés ici. Une restauration les remet en brouillon privé.
              </p>
              <div className="mt-3 space-y-2">
                {trashed.length === 0 && (
                  <p className="text-sm text-muted-foreground">Corbeille vide.</p>
                )}
                {trashed.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.slug}
                        {a.deletedAt && ` · supprimé le ${formatDateTime(a.deletedAt)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={restore.isPending}
                        onClick={() => restore.mutate(a.slug)}
                      >
                        Restaurer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={purge.isPending}
                        onClick={() => {
                          if (confirm(`Supprimer définitivement « ${a.title} » ? Cette action est irréversible.`))
                            purge.mutate(a.slug);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

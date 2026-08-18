import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Loader2,
  Music,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";
import { listGoogleDriveFiles } from "@/lib/google-workspace.functions";
import { ConnectionEmptyState } from "./ConnectionEmptyState";

type Item = {
  id: string;
  name: string;
  url: string;
  origin: string;
  type: string;
  size?: number | null;
};

const anyDb = supabase as unknown as { from: (t: string) => any };
const FILE_BUCKET = "article-files";
const LIBRARY_PREFIX = "library";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

function kindOf(value: string) {
  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(value)) return "image";
  if (/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/i.test(value)) return "audio";
  if (/\.(zip|rar|7z|tar|gz)(\?|$)/i.test(value)) return "archive";
  return "fichier";
}

function kindOfMime(mime: string, name: string) {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("zip") || mime.includes("compressed") || mime.includes("archive")) return "archive";
  return kindOf(name);
}

function formatSize(bytes?: number | null) {
  if (!bytes || bytes < 1) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

function safeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "fichier";
}

async function loadLibraryFiles(): Promise<Item[]> {
  const { data, error } = await supabase.storage
    .from(FILE_BUCKET)
    .list(LIBRARY_PREFIX, {
      limit: 500,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    console.warn("[files] bibliothèque indisponible", error);
    return [];
  }

  const files = (data ?? []).filter((entry) => entry.name && entry.id);
  return Promise.all(
    files.map(async (entry) => {
      const path = `${LIBRARY_PREFIX}/${entry.name}`;
      const { data: signed } = await supabase.storage
        .from(FILE_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);

      return {
        id: `lib-${entry.id}`,
        name: entry.name.replace(/^[0-9a-f-]{36}-/i, ""),
        url: signed?.signedUrl ?? "",
        origin: "Bibliothèque Angel OS",
        type: kindOf(entry.name),
        size:
          typeof entry.metadata?.size === "number"
            ? entry.metadata.size
            : Number(entry.metadata?.size) || null,
      } satisfies Item;
    }),
  ).then((items) => items.filter((item) => item.url));
}

async function loadFiles(): Promise<Item[]> {
  const [articles, reportages, interviews, library] = await Promise.all([
    supabase.from("articles").select("id,title,cover_url,attachments"),
    anyDb.from("reportages").select("id,title,media_url").not("media_url", "is", null),
    anyDb.from("interviews").select("id,title,media_url").not("media_url", "is", null),
    loadLibraryFiles(),
  ]);

  const out: Item[] = [...library];
  for (const a of articles.data ?? []) {
    if (a.cover_url)
      out.push({
        id: `cov-${a.id}`,
        name: `Couverture — ${a.title}`,
        url: a.cover_url,
        origin: "Article",
        type: "image",
      });
    const atts = Array.isArray(a.attachments) ? a.attachments : [];
    atts.forEach((raw, i) => {
      const att = raw as { name?: string; url?: string; size?: number };
      if (!att?.url) return;
      out.push({
        id: `att-${a.id}-${i}`,
        name: att.name ?? "Pièce jointe",
        url: att.url,
        origin: `Article — ${a.title}`,
        type: kindOf(att.url),
        size: att.size ?? null,
      });
    });
  }
  for (const r of (reportages.data ?? []) as any[])
    out.push({
      id: `rep-${r.id}`,
      name: r.title,
      url: r.media_url,
      origin: "Reportage",
      type: kindOf(r.media_url),
    });
  for (const i of (interviews.data ?? []) as any[])
    out.push({
      id: `itw-${i.id}`,
      name: i.title,
      url: i.media_url,
      origin: "Interview",
      type: kindOf(i.media_url),
    });
  return out;
}

async function uploadLibraryFile(file: File) {
  const path = `${LIBRARY_PREFIX}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(FILE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data, error: urlError } = await supabase.storage
    .from(FILE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (urlError || !data?.signedUrl)
    throw urlError ?? new Error("Lien du fichier indisponible");

  return data.signedUrl;
}

export function FilesPanel() {
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const loadDrive = useServerFn(listGoogleDriveFiles);
  const { data, isLoading } = useQuery({
    queryKey: ["angel", "files", "google-drive"],
    queryFn: async () => {
      let driveConnected = true;
      const [local, drive] = await Promise.all([
        loadFiles(),
        loadDrive().catch(() => {
          driveConnected = false;
          return [];
        }),
      ]);
      const driveItems: Item[] = drive
        .filter((file) => Boolean(file.webViewLink))
        .map((file) => ({
          id: `drive-${file.id}`,
          name: file.name,
          url: file.webViewLink!,
          origin: "Google Drive",
          type: kindOfMime(file.mimeType, file.name),
          size: file.size,
        }));
      return { items: [...local, ...driveItems], driveConnected };
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const items = data?.items ?? [];
  const driveConnected = data?.driveConnected ?? true;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.origin.toLowerCase().includes(q),
    );
  }, [items, query]);

  const onUpload = async (files: File[]) => {
    if (!files.length || uploading) return;
    setUploading(true);
    try {
      let latestUrl = "";
      for (const file of files) latestUrl = await uploadLibraryFile(file);
      await queryClient.invalidateQueries({ queryKey: ["angel", "files"] });
      await queryClient.invalidateQueries({ queryKey: ["angel", "files", "google-drive"] });
      toast.success(
        files.length === 1 ? "Fichier ajouté à la bibliothèque." : `${files.length} fichiers ajoutés.`,
      );
      if (files.length === 1 && latestUrl) {
        try {
          await navigator.clipboard?.writeText(latestUrl);
          toast.success("Lien du fichier copié.");
        } catch {
          // L'import reste réussi même si le navigateur bloque le presse-papiers.
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard
        title="Fichiers"
        description="Bibliothèque Angel OS et fichiers Google Drive accessibles : importez un document localement ou ouvrez les fichiers autorisés via Google Workspace."
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un fichier…"
              className="h-11 pl-9"
              aria-label="Rechercher un fichier"
            />
          </div>

          <div>
            <input
              id="angel-os-file-upload"
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void onUpload(files);
              }}
            />
            <Button
              type="button"
              className="min-h-11 w-full md:w-auto"
              disabled={uploading}
              onClick={() => document.getElementById("angel-os-file-upload")?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Import en cours…" : "Ajouter un fichier"}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Les fichiers importés restent dans la bibliothèque Angel OS. Google Drive est lu côté serveur via OAuth et aucun jeton Google n'est exposé au navigateur.
        </p>
      </AdminCard>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun fichier trouvé.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((f) => {
            const Icon =
              f.type === "image"
                ? ImageIcon
                : f.type === "audio"
                  ? Music
                  : f.type === "archive"
                    ? FileArchive
                    : FileText;
            return (
              <li
                key={f.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{f.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {f.origin}{f.size ? ` · ${formatSize(f.size)}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="min-h-10">
                      <a href={f.url} target="_blank" rel="noreferrer">
                        Ouvrir
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-10"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(f.url);
                          toast.success("Lien copié.");
                        } catch {
                          toast.error("Le navigateur bloque la copie automatique.");
                        }
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copier le lien
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && !driveConnected ? (
        <ConnectionEmptyState
          title="Aucun stockage externe connecté"
          description="Seule la bibliothèque interne d’Angel OS est affichée. Connecte Google Drive (ou OneDrive lorsqu’il sera disponible) pour y accéder ici."
        />
      ) : null}
    </div>
  );
}

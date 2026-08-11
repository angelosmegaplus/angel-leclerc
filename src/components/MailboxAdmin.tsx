import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Archive,
  ArchiveRestore,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  PenSquare,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  mailboxAct,
  mailboxList,
  mailboxRead,
  mailboxSend,
  mailboxStatus,
  type MailAction,
  type MailFolder,
} from "@/lib/mailbox.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FOLDERS: Array<{ key: MailFolder; label: string; icon: typeof Inbox }> = [
  { key: "inbox", label: "Réception", icon: Inbox },
  { key: "unread", label: "Non lus", icon: Mail },
  { key: "sent", label: "Envoyés", icon: Send },
  { key: "archive", label: "Archives", icon: Archive },
  { key: "spam", label: "Indésirables", icon: ShieldAlert },
  { key: "trash", label: "Corbeille", icon: Trash2 },
];

export function MailboxAdmin() {
  const queryClient = useQueryClient();
  const status = useServerFn(mailboxStatus);
  const list = useServerFn(mailboxList);
  const read = useServerFn(mailboxRead);
  const act = useServerFn(mailboxAct);
  const send = useServerFn(mailboxSend);

  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compose, setCompose] = useState<null | {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }>(null);

  const statusQuery = useQuery({ queryKey: ["mailbox-status"], queryFn: () => status({}) });
  const connected = statusQuery.data?.connected === true;

  const mails = useQuery({
    queryKey: ["mailbox", folder, search],
    queryFn: () => list({ data: { folder, search } }),
    enabled: connected,
  });

  const detail = useQuery({
    queryKey: ["mailbox-detail", openId],
    queryFn: () => read({ data: { id: openId as string } }),
    enabled: connected && Boolean(openId),
  });

  const action = useMutation({
    mutationFn: (vars: { id: string; action: MailAction }) => act({ data: vars }),
    onSuccess: () => {
      toast.success("Message mis à jour");
      setOpenId(null);
      void queryClient.invalidateQueries({ queryKey: ["mailbox"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action impossible"),
  });

  const sending = useMutation({
    mutationFn: (vars: { to: string; subject: string; body: string; threadId?: string }) =>
      send({ data: vars }),
    onSuccess: () => {
      toast.success("Message envoyé");
      setCompose(null);
      void queryClient.invalidateQueries({ queryKey: ["mailbox"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Envoi impossible"),
  });

  if (statusQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Vérification de la boîte mail…
      </p>
    );
  }

  if (!connected) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Mail className="h-5 w-5 text-primary" /> Boîte mail — connexion requise
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          L'interface et la couche d'intégration Gmail sont opérationnelles, mais la
          connexion « Angel's Gmail » n'est pas reliée à ce projet. Aucun message
          n'est affiché et rien n'est simulé.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Ce qui bloque aujourd'hui
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            La connexion Gmail existe dans l'espace de travail, mais le propriétaire
            du projet n'y a pas accès : elle ne peut donc pas être reliée ici.
          </p>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Étapes pour l'activer
          </p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Dans les réglages des connecteurs, partager la connexion « Angel's Gmail »
              avec le propriétaire du projet.
            </li>
            <li>
              Vérifier que le compte autorisé est bien contact@angel-leclerc.fr.
            </li>
            <li>
              Autoriser les portées : lecture (gmail.readonly), envoi (gmail.send) et
              modification/classement (gmail.modify).
            </li>
            <li>Relier ensuite la connexion à ce projet.</li>
          </ol>
        </div>
        {(statusQuery.data?.missing ?? []).length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Éléments manquants côté serveur : {(statusQuery.data?.missing ?? []).join(", ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Boîte connectée :{" "}
          <span className="font-medium text-foreground">{statusQuery.data?.address}</span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void queryClient.invalidateQueries({ queryKey: ["mailbox"] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
          <Button size="sm" onClick={() => setCompose({ to: "", subject: "", body: "" })}>
            <PenSquare className="mr-2 h-4 w-4" /> Nouveau message
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FOLDERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFolder(f.key);
              setOpenId(null);
            }}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
              folder === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <f.icon className="h-3.5 w-3.5" /> {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher (expéditeur, objet, mot-clé…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {mails.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : mails.isError ? (
        <p className="text-sm text-destructive">
          {mails.error instanceof Error ? mails.error.message : "Erreur de chargement"}
        </p>
      ) : (mails.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun message dans ce dossier.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {(mails.data ?? []).map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setOpenId(openId === m.id ? null : m.id)}
                className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex items-center justify-between gap-3">
                  <span
                    className={`truncate text-sm ${m.unread ? "font-semibold text-foreground" : "text-foreground"}`}
                  >
                    {folder === "sent" ? m.to : m.from}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{m.date}</span>
                </span>
                <span className="truncate text-sm text-foreground">{m.subject}</span>
                <span className="truncate text-xs text-muted-foreground">{m.snippet}</span>
              </button>

              {openId === m.id && (
                <div className="border-t border-border bg-muted/20 px-4 py-4">
                  {detail.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : detail.data ? (
                    <>
                      <div
                        className="article-content max-w-none overflow-x-auto text-sm text-foreground"
                        dangerouslySetInnerHTML={{ __html: detail.data.body }}
                      />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            setCompose({
                              to: (detail.data?.from ?? "").replace(/.*<(.+)>.*/, "$1"),
                              subject: `Re: ${detail.data?.subject ?? ""}`,
                              body: "",
                              threadId: detail.data?.threadId,
                            })
                          }
                        >
                          <Reply className="mr-2 h-4 w-4" /> Répondre
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => action.mutate({ id: m.id, action: "unread" })}
                        >
                          <MailOpen className="mr-2 h-4 w-4" /> Marquer non lu
                        </Button>
                        {folder !== "archive" && folder !== "sent" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => action.mutate({ id: m.id, action: "archive" })}
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archiver
                          </Button>
                        )}
                        {folder === "trash" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => action.mutate({ id: m.id, action: "untrash" })}
                          >
                            <Undo2 className="mr-2 h-4 w-4" /> Restaurer
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => action.mutate({ id: m.id, action: "trash" })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </Button>
                        )}
                        {folder === "spam" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => action.mutate({ id: m.id, action: "unspam" })}
                          >
                            <ArchiveRestore className="mr-2 h-4 w-4" /> Non indésirable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => action.mutate({ id: m.id, action: "spam" })}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" /> Indésirable
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-destructive">
                      {detail.error instanceof Error ? detail.error.message : "Lecture impossible"}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {compose && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-foreground">
                Nouveau message
              </h3>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setCompose(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mail-to">Destinataire</Label>
                <Input
                  id="mail-to"
                  type="email"
                  value={compose.to}
                  onChange={(e) => setCompose({ ...compose, to: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mail-subject">Objet</Label>
                <Input
                  id="mail-subject"
                  value={compose.subject}
                  onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mail-body">Message</Label>
                <Textarea
                  id="mail-body"
                  rows={8}
                  value={compose.body}
                  onChange={(e) => setCompose({ ...compose, body: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                disabled={sending.isPending}
                onClick={() => sending.mutate(compose)}
              >
                {sending.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

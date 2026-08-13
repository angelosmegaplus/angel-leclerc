import { useState } from "react";
import { toast } from "sonner";
import { CrudModule } from "./CrudModule";
import { StudioRecorder, uploadMedia } from "./StudioRecorder";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import {
  interviewFields,
  investigationFields,
  pressReviewFields,
  reportageFields,
  contactFields,
  str,
  tagsOf,
  type Row,
} from "@/lib/angelos";

const VIEWS = [
  { key: "studio", label: "Studio" },
  { key: "reportages", label: "Reportages" },
  { key: "interviews", label: "Interviews" },
  { key: "investigations", label: "Enquêtes" },
  { key: "press_review", label: "Revue de presse" },
  { key: "contacts_sources", label: "Contacts & sources" },
] as const;

type View = (typeof VIEWS)[number]["key"];

function tagList(row: Row) {
  const tags = tagsOf(row);
  if (tags.length === 0) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          {t}
        </span>
      ))}
    </p>
  );
}

function StudioCapture({ onGo }: { onGo: (view: View) => void }) {
  const [last, setLast] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-4">
      <AdminCard
        title="Studio de terrain"
        description="Enregistrez un son ou une vidéo directement depuis le navigateur, puis reliez le fichier à un reportage ou une interview."
      >
        <div className="space-y-4">
          <StudioRecorder mode="audio" onSaved={(url, name) => setLast({ url, name })} />
          <StudioRecorder mode="video" onSaved={(url, name) => setLast({ url, name })} />

          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-medium text-foreground">Kit terrain</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Importer photo, vidéo, audio ou document, prendre une note de terrain, ajouter une
              source et préparer une interview.
            </p>
            <label
              className="mt-3 block text-sm font-medium text-foreground"
              htmlFor="studio-import"
            >
              Importer des fichiers
            </label>
            <input
              id="studio-import"
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              disabled={uploading}
              className="mt-2 block w-full text-sm"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length === 0) return;
                setUploading(true);
                try {
                  for (const file of files) {
                    const url = await uploadMedia(file, file.name);
                    setLast({ url, name: file.name });
                  }
                  toast.success(
                    files.length > 1 ? `${files.length} fichiers importés.` : "Fichier importé.",
                  );
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Import impossible");
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="min-h-11"
                onClick={() => onGo("reportages")}
              >
                Nouvelle note terrain
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="min-h-11"
                onClick={() => onGo("contacts_sources")}
              >
                Nouvelle source / contact
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="min-h-11"
                onClick={() => onGo("interviews")}
              >
                Préparer une interview
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Les fichiers restent dans le stockage du site : rien n'est envoyé automatiquement à un
              service externe. L'envoi vers Drive sera proposé lorsque le compte Google sera
              connecté.
            </p>
          </div>

          {last && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">Dernier média : {last.name}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{last.url}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    navigator.clipboard?.writeText(last.url);
                    toast.success("Lien copié — collez-le dans le champ « Média ».");
                  }}
                >
                  Copier le lien
                </Button>
                <Button asChild size="sm" variant="outline" className="min-h-11">
                  <a href={last.url} target="_blank" rel="noreferrer">
                    Ouvrir
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

export function StudioPanel() {
  const [view, setView] = useState<View>("studio");

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            aria-pressed={view === v.key}
            className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-medium ${
              view === v.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "studio" && <StudioCapture onGo={setView} />}

      {view === "reportages" && (
        <CrudModule
          table="reportages"
          entityLabel="Reportage"
          title="Reportages"
          description="Sujets de terrain, du repérage à la publication."
          fields={reportageFields}
          titleField="title"
          subtitleFields={["location", "event_date"]}
          statusField="status"
          duplicateKeys={["title"]}
          renderExtra={tagList}
          filters={[
            { label: "En cours", test: (r) => str(r, "status") === "en_cours" },
            { label: "À rédiger", test: (r) => str(r, "status") === "a_rediger" },
          ]}
        />
      )}

      {view === "interviews" && (
        <CrudModule
          table="interviews"
          entityLabel="Interview"
          title="Interviews"
          description="Préparation des questions, enregistrement et transcription."
          fields={interviewFields}
          titleField="title"
          subtitleFields={["person", "scheduled_at"]}
          statusField="status"
          duplicateKeys={["title"]}
        />
      )}

      {view === "investigations" && (
        <CrudModule
          table="investigations"
          entityLabel="Enquête"
          title="Enquêtes"
          description="Faits vérifiés et hypothèses restent strictement séparés."
          fields={investigationFields}
          titleField="title"
          subtitleFields={["summary"]}
          statusField="status"
          duplicateKeys={["title"]}
        />
      )}

      {view === "press_review" && (
        <CrudModule
          table="press_review"
          entityLabel="Élément"
          title="Revue de presse"
          description="Articles et sources à conserver pour vos sujets."
          fields={pressReviewFields}
          titleField="title"
          subtitleFields={["source"]}
          duplicateKeys={["url", "title"]}
          renderExtra={tagList}
        />
      )}

      {view === "contacts_sources" && (
        <CrudModule
          table="contacts_sources"
          entityLabel="Contact"
          title="Contacts et sources"
          description="Carnet privé : jamais affiché sur le site public."
          fields={contactFields}
          titleField="last_name"
          subtitleFields={["first_name", "organization", "role"]}
          statusField="kind"
          duplicateKeys={["email", "phone"]}
          renderExtra={tagList}
        />
      )}
    </div>
  );
}

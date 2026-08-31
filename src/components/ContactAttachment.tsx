import { useEffect, useRef, useState } from "react";
import { FileCheck2, Paperclip, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
  ".txt",
]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

let selectedContactFile: File | null = null;
let transportInstalled = false;

function extensionOf(name: string) {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function validateFile(file: File): string | null {
  if (file.size <= 0) return "Ce fichier est vide.";
  if (file.size > MAX_FILE_SIZE) return "La pièce jointe ne doit pas dépasser 5 Mo.";
  if (!ALLOWED_EXTENSIONS.has(extensionOf(file.name))) {
    return "Format non autorisé. Utilisez PDF, JPG, PNG, WebP, DOC, DOCX ou TXT.";
  }
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return "Type de fichier non autorisé.";
  }
  return null;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function serializeFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    dataBase64: toBase64(bytes),
  };
}

export function installContactTransport() {
  if (typeof window === "undefined" || transportInstalled) return;
  transportInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (!/\/api\/public\/contact(?:\?|$)/.test(url)) {
      return originalFetch(input, init);
    }

    let nextInit = init ? { ...init } : undefined;
    if (selectedContactFile && nextInit && typeof nextInit.body === "string") {
      try {
        const body = JSON.parse(nextInit.body) as Record<string, unknown>;
        body.attachment = await serializeFile(selectedContactFile);
        nextInit = { ...nextInit, body: JSON.stringify(body) };
      } catch {
        throw new Error("La pièce jointe n'a pas pu être préparée. Merci de la sélectionner à nouveau.");
      }
    }

    try {
      const response = await originalFetch("/api/public/contact", nextInit);
      if (response.ok) {
        selectedContactFile = null;
        window.dispatchEvent(new Event("alc-contact-attachment-sent"));
      }
      return response;
    } catch {
      throw new Error("L’envoi a rencontré un problème. Merci de réessayer dans quelques instants.");
    }
  }) as typeof window.fetch;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function ContactAttachment() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(selectedContactFile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    installContactTransport();
    const clear = () => {
      selectedContactFile = null;
      setFile(null);
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    };
    window.addEventListener("alc-contact-attachment-sent", clear);
    return () => window.removeEventListener("alc-contact-attachment-sent", clear);
  }, []);

  function selectFile(next: File | null) {
    if (!next) return;
    const issue = validateFile(next);
    if (issue) {
      selectedContactFile = null;
      setFile(null);
      setError(issue);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    selectedContactFile = next;
    setFile(next);
    setError(null);
  }

  function removeFile() {
    selectedContactFile = null;
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mb-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Paperclip className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Pièce jointe <span className="font-normal text-muted-foreground">(facultatif)</span></p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            PDF, JPG, PNG, WebP, DOC, DOCX ou TXT — 5 Mo maximum.
          </p>

          {!file ? (
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
              <Paperclip className="h-3.5 w-3.5" aria-hidden />
              Ajouter un fichier
              <input
                ref={inputRef}
                type="file"
                className="sr-only"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt,application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
              <FileCheck2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Retirer la pièce jointe"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
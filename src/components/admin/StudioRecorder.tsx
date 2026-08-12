import { useEffect, useRef, useState } from "react";
import { Camera, Download, Mic, Pause, Play, Square, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Envoie un média dans le stockage existant et renvoie une URL signée longue durée. */
export async function uploadMedia(file: Blob, filename: string): Promise<string> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `studio/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from("article-files")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("article-files")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("URL indisponible");
  return data.signedUrl;
}

function useTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return [seconds, setSeconds] as const;
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function StudioRecorder({
  mode,
  onSaved,
}: {
  mode: "audio" | "video";
  onSaved: (url: string, name: string) => void;
}) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [seconds, setSeconds] = useTimer(recording && !paused);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia),
    );
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        mode === "audio"
          ? { audio: true }
          : { audio: true, video: { facingMode: facing } },
      );
      streamRef.current = stream;
      if (mode === "video" && previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play().catch(() => undefined);
      }
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mode === "audio" ? "audio/webm" : "video/webm",
        });
        blobRef.current = blob;
        setUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (previewRef.current) previewRef.current.srcObject = null;
      };
      rec.start();
      recorderRef.current = rec;
      setSeconds(0);
      setRecording(true);
      setPaused(false);
    } catch {
      toast.error("Accès au micro ou à la caméra refusé.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
  };

  const togglePause = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === "recording") {
      rec.pause();
      setPaused(true);
    } else if (rec.state === "paused") {
      rec.resume();
      setPaused(false);
    }
  };

  if (!supported) {
    return (
      <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
        L'enregistrement {mode === "audio" ? "audio" : "vidéo"} n'est pas pris en
        charge par ce navigateur. Utilisez l'import de fichier ci-dessous.
      </p>
    );
  }

  const ext = mode === "audio" ? "webm" : "webm";
  const filename = `${name.trim() || (mode === "audio" ? "audio" : "video")}.${ext}`;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      {mode === "video" && (
        <video
          ref={previewRef}
          muted
          playsInline
          className="aspect-video w-full rounded-lg bg-black object-cover"
        />
      )}

      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          {mode === "audio" ? <Mic className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {mode === "audio" ? "Enregistrer un son" : "Filmer une séquence"}
        </p>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {fmt(seconds)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <Button className="min-h-11 flex-1 sm:flex-none" onClick={start}>
            <Play className="mr-2 h-4 w-4" /> Démarrer
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={togglePause}
            >
              <Pause className="mr-2 h-4 w-4" /> {paused ? "Reprendre" : "Pause"}
            </Button>
            <Button
              variant="outline"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={stop}
            >
              <Square className="mr-2 h-4 w-4" /> Arrêter
            </Button>
          </>
        )}
        {mode === "video" && !recording && (
          <Button
            variant="outline"
            className="min-h-11 flex-1 sm:flex-none"
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          >
            Caméra : {facing === "user" ? "avant" : "arrière"}
          </Button>
        )}
      </div>

      {url && (
        <div className="space-y-3">
          {mode === "audio" ? (
            <audio controls src={url} className="w-full" />
          ) : (
            <video controls src={url} playsInline className="w-full rounded-lg" />
          )}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du fichier"
            className="h-11"
            aria-label="Nom du fichier"
          />
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="min-h-11 flex-1 sm:flex-none">
              <a href={url} download={filename}>
                <Download className="mr-2 h-4 w-4" /> Télécharger
              </a>
            </Button>
            <Button
              className="min-h-11 flex-1 sm:flex-none"
              disabled={uploading}
              onClick={async () => {
                if (!blobRef.current) return;
                setUploading(true);
                try {
                  const link = await uploadMedia(blobRef.current, filename);
                  onSaved(link, filename);
                  toast.success("Média enregistré dans le stockage du site.");
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Envoi impossible",
                  );
                } finally {
                  setUploading(false);
                }
              }}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              Enregistrer et lier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
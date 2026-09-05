import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Linkedin, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { linkedinProfile, linkedinPublish } from "@/lib/linkedin.functions";

/**
 * Publication LinkedIn réelle, jamais automatique : Angel écrit le texte puis
 * confirme explicitement avant l'envoi.
 */
export function LinkedInPublishCard() {
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const profileFn = useServerFn(linkedinProfile);
  const publishFn = useServerFn(linkedinPublish);

  const profile = useQuery({
    queryKey: ["linkedin", "profile"],
    queryFn: () => profileFn({}),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const publish = useMutation({
    mutationFn: () => publishFn({ data: { text: text.trim(), confirm: true } }),
    onSuccess: () => {
      toast.success("Publication envoyée sur LinkedIn.");
      setText("");
      setConfirming(false);
    },
    onError: (error) => {
      setConfirming(false);
      toast.error(error instanceof Error ? error.message : "Publication impossible");
    },
  });

  const connected = profile.data?.connected === true;

  return (
    <AdminCard
      title="Publier sur LinkedIn"
      description="Écrivez un message et publiez-le sur votre profil après confirmation. Rien n’est publié automatiquement."
    >
      <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Linkedin className="h-4 w-4" />
        {profile.isLoading
          ? "Vérification du compte…"
          : connected
            ? `Compte relié${profile.data?.name ? ` : ${profile.data.name}` : ""}.`
            : (profile.data?.detail ?? "Compte LinkedIn non relié.")}
      </p>

      <Textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setConfirming(false);
        }}
        rows={5}
        maxLength={2800}
        placeholder="Votre message LinkedIn…"
        disabled={!connected}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{text.trim().length} / 2800 caractères</span>
        {confirming ? (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="min-h-10" onClick={() => setConfirming(false)}>
              Annuler
            </Button>
            <Button size="sm" className="min-h-10" disabled={publish.isPending} onClick={() => publish.mutate()}>
              {publish.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Confirmer la publication
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="min-h-10"
            disabled={!connected || text.trim().length < 5}
            onClick={() => setConfirming(true)}
          >
            Publier sur LinkedIn
          </Button>
        )}
      </div>
    </AdminCard>
  );
}

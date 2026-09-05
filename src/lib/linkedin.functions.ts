import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LinkedInProfile = {
  connected: boolean;
  name: string | null;
  email: string | null;
  picture: string | null;
  detail: string;
};

export const linkedinProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<LinkedInProfile> => {
    const { gatewayConfigured, gatewayRequest } = await import("./connectors/lovable-gateway.server");
    if (!gatewayConfigured("linkedin")) {
      return { connected: false, name: null, email: null, picture: null, detail: "Connecteur LinkedIn non relié." };
    }
    try {
      const me = await gatewayRequest("linkedin", "/v2/userinfo");
      return {
        connected: true,
        name: me?.name ?? null,
        email: me?.email ?? null,
        picture: me?.picture ?? null,
        detail: "Profil LinkedIn relié.",
      };
    } catch (error) {
      return {
        connected: false,
        name: null,
        email: null,
        picture: null,
        detail: error instanceof Error ? error.message.slice(0, 200) : "Profil LinkedIn illisible.",
      };
    }
  });

/**
 * Publication réelle sur LinkedIn. Jamais automatique : appelée uniquement
 * après confirmation explicite d'Angel dans l'interface.
 */
export const linkedinPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; confirm: boolean }) => {
    const text = (input.text ?? "").trim();
    if (!text) throw new Error("Le texte de la publication est vide.");
    if (text.length > 2800) throw new Error("Le texte dépasse la limite LinkedIn (2800 caractères).");
    if (!input.confirm) throw new Error("Publication non confirmée.");
    return { text };
  })
  .handler(async ({ data }): Promise<{ ok: true; id: string }> => {
    const { gatewayConfigured, gatewayRequest } = await import("./connectors/lovable-gateway.server");
    if (!gatewayConfigured("linkedin")) throw new Error("Connecteur LinkedIn non relié à ce projet.");

    const me = await gatewayRequest("linkedin", "/v2/userinfo");
    const sub = me?.sub as string | undefined;
    if (!sub) throw new Error("Identifiant LinkedIn introuvable.");

    const result = await gatewayRequest("linkedin", "/v2/ugcPosts", {
      method: "POST",
      headers: { "X-Restli-Protocol-Version": "2.0.0" },
      body: {
        author: `urn:li:person:${sub}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: data.text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      },
    });

    return { ok: true, id: String(result?.id ?? "") };
  });

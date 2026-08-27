import { createServerFn } from "@tanstack/react-start";

export const askSiteAi = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const question = typeof (data as { question?: unknown })?.question === "string"
      ? ((data as { question: string }).question).trim().slice(0, 500)
      : "";
    if (!question) throw new Error("Question vide");
    return { question };
  })
  .handler(async ({ data }) => {
    const { lovableChat, FAST_AI_MODEL } = await import("@/lib/lovable-ai.server");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const result = await lovableChat({
        model: FAST_AI_MODEL,
        maxTokens: 400,
        temperature: 0.4,
        signal: controller.signal,
        messages: [
          {
            role: "system",
            content: [
              "Tu es l'assistant du site d'Angel Leclerc Communication (auto-entreprise de conseil et rédaction en communication, basée à Broût-Vernet, courrier à Sarlat-la-Canéda).",
              "Pages du site : / (accueil), /entreprise (services et tarifs, conseil dès 70 €), /parcours (CV, formations, engagements), /articles (blog), /contact, /mes-objectifs, /flamme (moteur de recherche bêta), /mentions-legales, /politique-confidentialite.",
              "Réponds en français, en 3 phrases maximum, avec un ton clair et chaleureux.",
              "Si la question concerne le site, oriente vers la page utile. Si tu ne sais pas, dis-le et invite à passer par la page /contact.",
              "N'invente jamais de tarif, de coordonnée personnelle ou d'information non listée ici.",
            ].join("\n"),
          },
          { role: "user", content: data.question },
        ],
      });
      if (!result.ok || !result.text) {
        return { ok: false as const, text: null as string | null };
      }
      return { ok: true as const, text: result.text };
    } finally {
      clearTimeout(timeout);
    }
  });

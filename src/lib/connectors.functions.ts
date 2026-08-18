import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Écran « Connexions » d'Angel OS.
 *
 * Un connecteur n'est listé que s'il alimente une fonction réelle de l'admin.
 * Aucun faux vert : « Connecté » signifie qu'un appel réel a réussi.
 */

export type ConnectorState = "connected" | "configured" | "missing" | "error";

export type ConnectorCard = {
  key: string;
  name: string;
  category: string;
  /** Ce que la connexion débloque concrètement dans Angel OS. */
  features: string[];
  /** Permissions / accès réellement utilisés. */
  permissions: string[];
  /** Comment la connexion est établie. */
  via: string;
  state: ConnectorState;
  detail: string;
  checkedAt: string | null;
  /** true si un bouton « Tester » a un sens pour ce service. */
  testable: boolean;
  /** true si la connexion demande une action externe hors Lovable. */
  needsManualSetup: boolean;
};

const CATALOG = [
  {
    key: "gmail",
    name: "Gmail",
    category: "Google",
    features: ["Boîte mail Angel OS", "Candidatures", "Résumés Angel OS IA"],
    permissions: ["Lecture, classement et envoi des messages"],
    via: "Connecteur Lovable (passerelle)",
  },
  {
    key: "calendar",
    name: "Google Agenda",
    category: "Google",
    features: ["Agenda", "Prochains rendez-vous", "Aperçu du jour"],
    permissions: ["Lecture des agendas et événements"],
    via: "Connecteur Lovable (passerelle)",
  },
  {
    key: "drive",
    name: "Google Drive",
    category: "Google",
    features: ["Fichiers", "Documents de travail"],
    permissions: ["Lecture des fichiers"],
    via: "Connecteur Lovable (passerelle)",
  },
  {
    key: "database",
    name: "Base Angel OS",
    category: "Cœur du site",
    features: ["Articles", "Statistiques", "Formulaires", "Comptes admin"],
    permissions: ["Lecture / écriture serveur"],
    via: "Lovable Cloud (natif)",
  },
  {
    key: "ai",
    name: "Angel OS IA",
    category: "Cœur du site",
    features: ["Assistance rédaction", "Résumés", "Assistant contact"],
    permissions: ["Passerelle IA Lovable (Gemini)"],
    via: "Lovable AI (natif)",
  },
  {
    key: "tmdb",
    name: "TMDB",
    category: "Contenus",
    features: ["Films & séries", "Affiches", "Synopsis"],
    permissions: ["Lecture du catalogue public"],
    via: "Clé serveur",
  },
  {
    key: "stripe",
    name: "Stripe",
    category: "Boutique",
    features: ["Paiements boutique", "Suivi des commandes"],
    permissions: ["Clé secrète serveur"],
    via: "Clé serveur",
  },
  {
    key: "printful",
    name: "Printful",
    category: "Boutique",
    features: ["Catalogue produits", "Impression et expédition"],
    permissions: ["Clé API boutique"],
    via: "Clé serveur",
  },
  {
    key: "github",
    name: "GitHub",
    category: "Sauvegarde",
    features: ["Sauvegarde facultative des articles"],
    permissions: ["Jeton contenu de dépôt"],
    via: "Jeton serveur (facultatif)",
  },
] as const;

type ConnectorKey = (typeof CATALOG)[number]["key"];

async function probe(key: ConnectorKey): Promise<{ state: ConnectorState; detail: string }> {
  const now = () => new Date().toISOString();
  void now;

  if (key === "gmail" || key === "calendar" || key === "drive") {
    const { probeGatewayConnector, gatewayConfigured, gatewayMissingEnv } = await import(
      "./connectors/lovable-gateway.server"
    );
    const connector = key === "gmail" ? "google_mail" : key === "calendar" ? "google_calendar" : "google_drive";
    if (!gatewayConfigured(connector)) {
      return {
        state: "missing",
        detail: `Connecteur non relié à ce projet (${gatewayMissingEnv(connector).join(", ")}).`,
      };
    }
    const result = await probeGatewayConnector(connector);
    return { state: result.ok ? "connected" : "error", detail: result.detail };
  }

  if (key === "database") {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { count, error } = await supabaseAdmin
        .from("articles")
        .select("id", { count: "exact", head: true });
      if (error) return { state: "error", detail: error.message.slice(0, 200) };
      return { state: "connected", detail: `Base joignable — ${count ?? 0} articles enregistrés.` };
    } catch (error) {
      return { state: "error", detail: error instanceof Error ? error.message.slice(0, 200) : "Base injoignable." };
    }
  }

  if (key === "ai") {
    const apiKey = process.env["LOVABLE_API_KEY"]?.trim();
    if (!apiKey) return { state: "missing", detail: "Clé de passerelle IA absente." };
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });
      if (!response.ok) {
        return { state: "error", detail: `Passerelle IA indisponible (${response.status}).` };
      }
      return { state: "connected", detail: "Passerelle IA opérationnelle (Gemini 2.5 Flash)." };
    } catch {
      return { state: "configured", detail: "Clé présente, passerelle non joignable depuis ce serveur." };
    }
  }

  if (key === "tmdb") {
    const { resolveTmdbCredential } = await import("./vercel-connect-credentials.server");
    const credential = resolveTmdbCredential();
    if (!credential) {
      return {
        state: "missing",
        detail: "Aucun identifiant TMDB configuré : la page Films & séries reste sans données distantes.",
      };
    }
    const token = credential.kind === "bearer" ? credential.value : null;
    const apiKey = credential.kind === "bearer" ? null : credential.value;
    const url = token
      ? "https://api.themoviedb.org/3/configuration"
      : `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`;
    const response = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    if (!response.ok) return { state: "error", detail: `TMDB a refusé la requête (${response.status}).` };
    return { state: "connected", detail: "Catalogue TMDB accessible." };
  }

  if (key === "stripe") {
    const secret = process.env["STRIPE_SECRET_KEY"]?.trim();
    if (!secret) return { state: "missing", detail: "Clé Stripe absente : la boutique reste en lecture seule." };
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok) return { state: "error", detail: `Stripe a refusé la requête (${response.status}).` };
    return { state: "connected", detail: "Compte Stripe joignable." };
  }

  if (key === "printful") {
    const apiKey = process.env["PRINTFUL_API_KEY"]?.trim();
    if (!apiKey) return { state: "missing", detail: "Clé Printful absente : pas de synchronisation produits." };
    const response = await fetch("https://api.printful.com/store", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return { state: "error", detail: `Printful a refusé la requête (${response.status}).` };
    const json = (await response.json()) as { result?: { name?: string } };
    return { state: "connected", detail: `Boutique « ${json.result?.name ?? "Printful"} » accessible.` };
  }

  const token = process.env["GITHUB_CONTENT_TOKEN"]?.trim();
  if (!token) return { state: "missing", detail: "Sauvegarde GitHub désactivée (facultative)." };
  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!response.ok) return { state: "error", detail: `GitHub a refusé la requête (${response.status}).` };
  const json = (await response.json()) as { login?: string };
  return { state: "connected", detail: `Jeton valide pour ${json.login ?? "le compte lié"}.` };
}

function baseCard(entry: (typeof CATALOG)[number]): ConnectorCard {
  return {
    key: entry.key,
    name: entry.name,
    category: entry.category,
    features: [...entry.features],
    permissions: [...entry.permissions],
    via: entry.via,
    state: "configured",
    detail: "",
    checkedAt: null,
    testable: true,
    needsManualSetup: false,
  };
}

export const listConnectors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<ConnectorCard[]> => {
    const results = await Promise.all(
      CATALOG.map(async (entry) => {
        const card = baseCard(entry);
        try {
          const { state, detail } = await probe(entry.key);
          card.state = state;
          card.detail = detail;
        } catch (error) {
          card.state = "error";
          card.detail = error instanceof Error ? error.message.slice(0, 200) : "Test impossible.";
        }
        card.checkedAt = new Date().toISOString();
        card.needsManualSetup = card.state === "missing";
        return card;
      }),
    );
    return results;
  });

export const testConnector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => {
    const found = CATALOG.find((entry) => entry.key === input.key);
    if (!found) throw new Error("Connecteur inconnu.");
    return { key: found.key as ConnectorKey };
  })
  .handler(async ({ data }): Promise<ConnectorCard> => {
    const entry = CATALOG.find((item) => item.key === data.key)!;
    const card = baseCard(entry);
    try {
      const { state, detail } = await probe(data.key);
      card.state = state;
      card.detail = detail;
    } catch (error) {
      card.state = "error";
      card.detail = error instanceof Error ? error.message.slice(0, 200) : "Test impossible.";
    }
    card.checkedAt = new Date().toISOString();
    card.needsManualSetup = card.state === "missing";
    return card;
  });

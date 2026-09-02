import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConnectorState = "connected" | "configured" | "missing" | "error";

export type ConnectorCard = {
  key: string;
  name: string;
  category: string;
  features: string[];
  permissions: string[];
  via: string;
  state: ConnectorState;
  detail: string;
  checkedAt: string | null;
  testable: boolean;
  needsManualSetup: boolean;
};

const CATALOG = [
  {
    key: "gmail",
    name: "Gmail",
    category: "Google Workspace",
    features: ["Boîte mail", "Suivi des échanges", "Messages importants"],
    permissions: ["Lecture, classement et envoi des messages"],
    via: "Connecteur Lovable",
  },
  {
    key: "calendar",
    name: "Google Calendar",
    category: "Google Workspace",
    features: ["Agenda", "Planning", "Rendez-vous", "Échéances"],
    permissions: ["Lecture des agendas et événements"],
    via: "Connecteur Lovable",
  },
  {
    key: "drive",
    name: "Google Drive",
    category: "Google Workspace",
    features: ["Fichiers", "Documents", "Stockage"],
    permissions: ["Lecture des fichiers"],
    via: "Connecteur Lovable",
  },
  {
    key: "database",
    name: "Base Flamme OS",
    category: "Flamme OS",
    features: ["Articles", "Projets", "Tâches", "Statistiques", "Administration"],
    permissions: ["Lecture / écriture serveur"],
    via: "Lovable Cloud / Supabase",
  },
  {
    key: "tmdb",
    name: "TMDB",
    category: "Modules complémentaires",
    features: ["Films & séries", "Affiches", "Synopsis"],
    permissions: ["Lecture du catalogue public"],
    via: "Clé serveur",
  },
  {
    key: "stripe",
    name: "Stripe",
    category: "Boutique",
    features: ["Paiements", "Suivi des commandes"],
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
    category: "Développement",
    features: ["Code source", "Historique", "Sauvegarde facultative des articles"],
    permissions: ["Jeton contenu de dépôt"],
    via: "Jeton serveur (facultatif)",
  },
] as const;

type ConnectorKey = (typeof CATALOG)[number]["key"];

async function probe(key: ConnectorKey): Promise<{ state: ConnectorState; detail: string }> {
  if (key === "gmail" || key === "calendar" || key === "drive") {
    const { probeGatewayConnector, gatewayConfigured, gatewayMissingEnv } = await import("./connectors/lovable-gateway.server");
    const connector = key === "gmail" ? "google_mail" : key === "calendar" ? "google_calendar" : "google_drive";
    if (!gatewayConfigured(connector)) {
      return {
        state: "missing",
        detail: `Connecteur Lovable absent pour ce projet (${gatewayMissingEnv(connector).join(", ")}).`,
      };
    }
    const result = await probeGatewayConnector(connector);
    return { state: result.ok ? "connected" : "error", detail: result.detail };
  }

  if (key === "database") {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { count, error } = await supabaseAdmin.from("articles").select("id", { count: "exact", head: true });
      if (error) return { state: "error", detail: error.message.slice(0, 200) };
      return { state: "connected", detail: `Base Flamme OS joignable — ${count ?? 0} articles enregistrés.` };
    } catch (error) {
      return { state: "error", detail: error instanceof Error ? error.message.slice(0, 200) : "Base injoignable." };
    }
  }

  if (key === "tmdb") {
    const { resolveTmdbCredential } = await import("./vercel-connect-credentials.server");
    const credential = resolveTmdbCredential();
    if (!credential) return { state: "missing", detail: "Aucun identifiant TMDB configuré." };
    const token = credential.kind === "bearer" ? credential.value : null;
    const apiKey = credential.kind === "bearer" ? null : credential.value;
    const url = token ? "https://api.themoviedb.org/3/configuration" : `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`;
    const response = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    if (!response.ok) return { state: "error", detail: `TMDB a refusé la requête (${response.status}).` };
    return { state: "connected", detail: "Catalogue TMDB accessible." };
  }

  if (key === "stripe") {
    const secret = process.env["STRIPE_SECRET_KEY"]?.trim();
    if (!secret) return { state: "missing", detail: "Clé Stripe absente." };
    const response = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${secret}` } });
    if (!response.ok) return { state: "error", detail: `Stripe a refusé la requête (${response.status}).` };
    return { state: "connected", detail: "Compte Stripe joignable." };
  }

  if (key === "printful") {
    const apiKey = process.env["PRINTFUL_API_KEY"]?.trim();
    if (!apiKey) return { state: "missing", detail: "Clé Printful absente." };
    const response = await fetch("https://api.printful.com/store", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!response.ok) return { state: "error", detail: `Printful a refusé la requête (${response.status}).` };
    const json = (await response.json()) as { result?: { name?: string } };
    return { state: "connected", detail: `Boutique « ${json.result?.name ?? "Printful"} » accessible.` };
  }

  const token = process.env["GITHUB_CONTENT_TOKEN"]?.trim();
  if (!token) return { state: "missing", detail: "Jeton GitHub facultatif non configuré." };
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
    return Promise.all(CATALOG.map(async (entry) => {
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
    }));
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

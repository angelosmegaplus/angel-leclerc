import type { ProviderId } from "./oauth/providers";

export type IntegrationStatus = "ready" | "server_setup";
export type ConnectionState = "connected" | "reconnect_required" | "not_connected";

export type IntegrationReadiness = {
  key: string;
  name: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  missing: string[];
  connectPath?: string;
  reconnectPath?: string;
  provider?: ProviderId;
  connection?: ConnectionState;
  accountLabel?: string | null;
  lastSyncAt?: string | null;
  scopes?: string[];
  note?: string;
};

type Definition = Omit<IntegrationReadiness, "status" | "missing"> & { env: string[] };

const DEFINITIONS: Definition[] = [
  {
    key: "google", name: "Google Workspace", category: "Bureautique & mail",
    description: "Gmail, Google Agenda et Google Drive reliés à Angel OS.",
    env: ["LOVABLE_API_KEY", "GOOGLE_MAIL_API_KEY", "GOOGLE_CALENDAR_API_KEY", "GOOGLE_DRIVE_API_KEY"],
    note: "Les accès Google passent par les connecteurs reliés au projet : aucun jeton n’est stocké côté site.",
  },
  { key: "github", name: "GitHub", category: "Développement", description: "Sauvegarde facultative des articles.", env: ["GITHUB_CONTENT_TOKEN"], note: "Facultatif : la source de vérité des articles reste la base du site." },
  { key: "angel-ai", name: "Passerelle IA Lovable · Angel OS IA", category: "Intelligence artificielle", description: "Moteur d’intelligence artificielle (modèles Google Gemini) utilisé par Angel OS IA.", env: ["LOVABLE_API_KEY"], note: "Une seule clé IA est utilisée : LOVABLE_API_KEY (passerelle IA Lovable)." },
  { key: "site", name: "Base Angel OS", category: "Site & contenus", description: "Base de données, authentification, stockage et traitements serveur du site.", env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] },
  { key: "tmdb", name: "TMDB", category: "Films & séries", description: "Métadonnées, affiches, recherche et informations Films & séries.", env: ["TMDB_READ_TOKEN"], note: "TMDB utilise un identifiant unique : variable serveur si disponible, sinon la clé v3 intégrée au build." },
  { key: "stripe", name: "Stripe", category: "Site & contenus", description: "Paiements de la boutique.", env: ["STRIPE_LIVE_API_KEY", "LOVABLE_API_KEY"] },
  { key: "printful", name: "Printful", category: "Site & contenus", description: "Catalogue, impression et expédition des produits.", env: ["PRINTFUL_API_KEY"] },
];

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function hasTmdbCredential() {
  return Boolean(
    process.env.TMDB_READ_TOKEN?.trim()
    || process.env.TMDB_READ_ACCESS_TOKEN?.trim()
    || process.env.TMDB_API_KEY?.trim()
    || import.meta.env.VITE_TMDB_API_KEY?.trim(),
  );
}

export function readIntegrations(): IntegrationReadiness[] {
  return DEFINITIONS.map(({ env, ...rest }) => {
    let missing = env.filter((name) => !hasEnv(name));
    if (rest.key === "tmdb" && hasTmdbCredential()) missing = [];
    return { ...rest, missing, status: missing.length === 0 ? "ready" : "server_setup" } satisfies IntegrationReadiness;
  });
}

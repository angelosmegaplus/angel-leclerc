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
    key: "google", provider: "google", name: "Google Workspace", category: "Bureautique & mail",
    description: "Connexion OAuth Google pour Gmail, Google Calendar et Drive.",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], connectPath: "/oauth/google/start", reconnectPath: "/oauth/google/start?prompt=consent",
    note: "Un seul client OAuth Google est utilisé, directement depuis les variables d’environnement Vercel.",
  },
  {
    key: "microsoft", name: "Microsoft 365", category: "Bureautique & mail",
    description: "Outlook, Calendrier et OneDrive.", env: ["MS_CLIENT_ID", "MS_CLIENT_SECRET"],
  },
  { key: "meta", provider: "meta", name: "Facebook / Instagram", category: "Réseaux sociaux", description: "Publication et statistiques des pages via Meta.", env: ["META_APP_ID", "META_APP_SECRET"] },
  { key: "linkedin", provider: "linkedin", name: "LinkedIn", category: "Réseaux sociaux", description: "Publication sur la page entreprise et suivi des posts.", env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"] },
  { key: "x", provider: "x", name: "X", category: "Réseaux sociaux", description: "Diffusion des brèves et fils d'actualité.", env: ["X_CLIENT_ID", "X_CLIENT_SECRET"] },
  { key: "youtube", provider: "youtube", name: "YouTube", category: "Réseaux sociaux", description: "Mise en ligne des reportages vidéo via le client OAuth Google.", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { key: "github", provider: "github", name: "GitHub", category: "Développement", description: "Synchronisation du code du site et suivi des évolutions.", env: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"] },
  { key: "angel-ai", name: "OpenAI · Angel OS IA", category: "Intelligence artificielle", description: "Moteur d’intelligence artificielle externe utilisé par Angel OS IA.", env: ["OPENAI_API_KEY"], note: "Une seule clé OpenAI est utilisée : OPENAI_API_KEY." },
  { key: "site", name: "Supabase · angel-leclerc.fr", category: "Site & contenus", description: "Base de données, authentification, stockage et traitements serveur du site.", env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"], note: "Une seule clé serveur Supabase est utilisée." },
  { key: "tmdb", name: "TMDB", category: "Films & séries", description: "Métadonnées, affiches, recherche et informations Films & séries.", env: ["TMDB_READ_TOKEN"], note: "Un seul jeton TMDB est utilisé. TMDB_API_KEY reste un secours de configuration simple si le read token n’est pas présent." },
  { key: "stripe", name: "Stripe", category: "Site & contenus", description: "Paiements de la boutique.", env: ["STRIPE_SECRET_KEY"] },
  { key: "printful", name: "Printful", category: "Site & contenus", description: "Catalogue, impression et expédition des produits.", env: ["PRINTFUL_API_KEY"] },
  { key: "canva", provider: "canva", name: "Canva", category: "Création visuelle", description: "Visuels et gabarits de la marque.", env: ["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET"] },
  { key: "adobe", provider: "adobe", name: "Adobe Express / Creative Cloud", category: "Création visuelle", description: "Retouches et exports haute qualité.", env: ["ADOBE_CLIENT_ID", "ADOBE_CLIENT_SECRET"] },
];

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function readIntegrations(): IntegrationReadiness[] {
  return DEFINITIONS.map(({ env, ...rest }) => {
    let missing = env.filter((name) => !hasEnv(name));
    if (rest.key === "tmdb" && !hasEnv("TMDB_READ_TOKEN") && hasEnv("TMDB_API_KEY")) missing = [];
    return { ...rest, missing, status: missing.length === 0 ? "ready" : "server_setup" } satisfies IntegrationReadiness;
  });
}

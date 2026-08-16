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
  /** OAuth provider handled directly by the Angel OS web app, when applicable. */
  provider?: ProviderId;
  /** Real account state, filled by the server function for direct OAuth providers. */
  connection?: ConnectionState;
  accountLabel?: string | null;
  lastSyncAt?: string | null;
  scopes?: string[];
  note?: string;
};

type Definition = Omit<IntegrationReadiness, "status" | "missing"> & { env: string[] };

const DEFINITIONS: Definition[] = [
  {
    key: "google",
    provider: "google",
    name: "Google Workspace",
    category: "Bureautique & mail",
    description: "Connexion OAuth Google pour Gmail et, lorsque les scopes correspondants sont activés, Agenda et Drive.",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "OAUTH_TOKEN_SECRET", "OAUTH_STATE_SECRET"],
    connectPath: "/oauth/google/start",
    reconnectPath: "/oauth/google/start?prompt=consent",
    note: "GOOGLE_API_KEY et GOOGLE_CLOUD_PROJECT_ID peuvent être ajoutés pour les API qui les utilisent, mais ne remplacent pas le client OAuth. Les secrets de chiffrement OAuth doivent rester exclusivement côté serveur.",
  },
  {
    key: "microsoft",
    name: "Microsoft 365",
    category: "Bureautique & mail",
    description: "Outlook, Calendrier et OneDrive restent disponibles via un connecteur géré tant que Microsoft OAuth n’est pas configuré.",
    env: [],
    note: "Aucun secret Microsoft n’est requis pour le moment.",
  },
  {
    key: "meta", provider: "meta", name: "Facebook / Instagram", category: "Réseaux sociaux",
    description: "Publication et statistiques des pages via Meta.", env: ["META_APP_ID", "META_APP_SECRET"],
    connectPath: "/api/oauth/meta/start", reconnectPath: "/api/oauth/meta/start?auth_type=rerequest",
  },
  {
    key: "linkedin", provider: "linkedin", name: "LinkedIn", category: "Réseaux sociaux",
    description: "Publication sur la page entreprise et suivi des posts.", env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    connectPath: "/api/oauth/linkedin/start",
  },
  {
    key: "x", provider: "x", name: "X", category: "Réseaux sociaux",
    description: "Diffusion des brèves et fils d'actualité.", env: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
    connectPath: "/api/oauth/x/start",
  },
  {
    key: "youtube", provider: "youtube", name: "YouTube", category: "Réseaux sociaux",
    description: "Mise en ligne des reportages vidéo via le compte Google.",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "OAUTH_TOKEN_SECRET", "OAUTH_STATE_SECRET"],
    connectPath: "/oauth/youtube/start",
  },
  {
    key: "github", provider: "github", name: "GitHub", category: "Développement",
    description: "Synchronisation du code du site et suivi des évolutions.", env: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    connectPath: "/api/oauth/github/start",
  },
  {
    key: "angel-ai", name: "OpenAI · Angel OS IA", category: "Intelligence artificielle",
    description: "Moteur d’intelligence artificielle externe utilisé par Angel OS IA.", env: ["OPENAI_API_KEY"],
    note: "Les éventuelles clés secondaires ou administrateur ne sont pas nécessaires au fonctionnement normal du site et ne doivent pas être exposées au navigateur.",
  },
  {
    key: "site", name: "Supabase · angel-leclerc.fr", category: "Site & contenus",
    description: "Base de données, authentification, stockage et traitements serveur du site.",
    env: ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    note: "La clé publishable peut être utilisée côté client lorsque prévu. SUPABASE_SERVICE_ROLE_KEY est strictement serveur et ne doit jamais être incluse dans le bundle public.",
  },
  {
    key: "tmdb", name: "TMDB", category: "Films & séries",
    description: "Métadonnées, affiches, recherche et informations Films & séries.",
    env: ["TMDB_READ_TOKEN"],
    note: "TMDB_API_KEY peut aussi être configurée comme solution de repli. Le jeton Read Access est prioritaire.",
  },
  {
    key: "stripe", name: "Stripe", category: "Site & contenus", description: "Paiements de la boutique.", env: ["STRIPE_SECRET_KEY"],
  },
  {
    key: "printful", name: "Printful", category: "Site & contenus",
    description: "Catalogue, impression et expédition des produits.", env: ["PRINTFUL_API_KEY"],
  },
  {
    key: "canva", provider: "canva", name: "Canva", category: "Création visuelle",
    description: "Visuels et gabarits de la marque.", env: ["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET"],
    connectPath: "/api/oauth/canva/start",
  },
  {
    key: "adobe", provider: "adobe", name: "Adobe Express / Creative Cloud", category: "Création visuelle",
    description: "Retouches et exports haute qualité.", env: ["ADOBE_CLIENT_ID", "ADOBE_CLIENT_SECRET"],
    connectPath: "/api/oauth/adobe/start",
  },
];

export function readIntegrations(): IntegrationReadiness[] {
  return DEFINITIONS.map(({ env, ...rest }) => {
    const missing = env.filter((name) => !process.env[name]);
    return { ...rest, missing, status: missing.length === 0 ? "ready" : "server_setup" } satisfies IntegrationReadiness;
  });
}

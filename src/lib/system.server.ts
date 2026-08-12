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
  /** OAuth provider handled by Angel OS, when applicable. */
  provider?: ProviderId;
  /** Real account state, filled by the server function. */
  connection?: ConnectionState;
  accountLabel?: string | null;
  lastSyncAt?: string | null;
  scopes?: string[];
  note?: string;
};

type Definition = Omit<IntegrationReadiness, "status" | "missing"> & {
  env: string[];
};

const DEFINITIONS: Definition[] = [
  {
    key: "google",
    provider: "google",
    name: "Google Workspace",
    category: "Bureautique & mail",
    description:
      "Gmail contact@angel-leclerc.fr, Agenda et Drive directement dans Angel OS.",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    connectPath: "/api/oauth/google/start",
    reconnectPath: "/api/oauth/google/start?prompt=consent",
  },
  {
    key: "microsoft",
    provider: "microsoft",
    name: "Microsoft 365",
    category: "Bureautique & mail",
    description: "Outlook, Calendrier et OneDrive comme alternative à Google.",
    env: ["MS_CLIENT_ID", "MS_CLIENT_SECRET", "MS_TENANT_ID"],
    connectPath: "/api/oauth/microsoft/start",
    reconnectPath: "/api/oauth/microsoft/start?prompt=consent",
  },
  {
    key: "meta",
    provider: "meta",
    name: "Facebook / Instagram",
    category: "Réseaux sociaux",
    description: "Publication et statistiques des pages via Meta.",
    env: ["META_APP_ID", "META_APP_SECRET"],
    connectPath: "/api/oauth/meta/start",
    reconnectPath: "/api/oauth/meta/start?auth_type=rerequest",
  },
  {
    key: "linkedin",
    provider: "linkedin",
    name: "LinkedIn",
    category: "Réseaux sociaux",
    description: "Publication sur la page entreprise et suivi des posts.",
    env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    connectPath: "/api/oauth/linkedin/start",
  },
  {
    key: "x",
    provider: "x",
    name: "X",
    category: "Réseaux sociaux",
    description: "Diffusion des brèves et fils d'actualité.",
    env: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
    connectPath: "/api/oauth/x/start",
  },
  {
    key: "youtube",
    provider: "youtube",
    name: "YouTube",
    category: "Réseaux sociaux",
    description: "Mise en ligne des reportages vidéo (via le compte Google).",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    connectPath: "/api/oauth/google/start?scope=youtube",
  },
  {
    key: "github",
    provider: "github",
    name: "GitHub",
    category: "Développement",
    description: "Synchronisation du code du site et suivi des évolutions.",
    env: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    connectPath: "/api/oauth/github/start",
  },
  {
    key: "angel-ai",
    name: "ChatGPT / Angel AI",
    category: "Intelligence artificielle",
    description:
      "File d'actions, messages et automatisations locales d'Angel OS. Fonctionne sans fournisseur IA externe.",
    env: [],
    note: "Les analyses ChatGPT externes nécessitent OPENAI_API_KEY, mais Angel OS reste pleinement utilisable sans.",
  },
  {
    key: "site",
    name: "angel-leclerc.fr",
    category: "Site & contenus",
    description: "Base de données, articles, boutique et statistiques du site.",
    env: ["SUPABASE_URL"],
  },
  {
    key: "stripe",
    name: "Stripe",
    category: "Site & contenus",
    description: "Paiements de la boutique.",
    env: ["STRIPE_SECRET_KEY"],
  },
  {
    key: "printful",
    name: "Printful",
    category: "Site & contenus",
    description: "Catalogue, impression et expédition des produits.",
    env: ["PRINTFUL_API_KEY"],
  },
  {
    key: "canva",
    provider: "canva",
    name: "Canva",
    category: "Création visuelle",
    description: "Visuels et gabarits de la marque.",
    env: ["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET"],
    connectPath: "/api/oauth/canva/start",
  },
  {
    key: "adobe",
    provider: "adobe",
    name: "Adobe Express / Creative Cloud",
    category: "Création visuelle",
    description: "Retouches et exports haute qualité.",
    env: ["ADOBE_CLIENT_ID", "ADOBE_CLIENT_SECRET"],
    connectPath: "/api/oauth/adobe/start",
  },
];

export function readIntegrations(): IntegrationReadiness[] {
  return DEFINITIONS.map(({ env, ...rest }) => {
    const missing = env.filter((name) => !process.env[name]);
    return {
      ...rest,
      missing,
      status: missing.length === 0 ? "ready" : "server_setup",
    } satisfies IntegrationReadiness;
  });
}

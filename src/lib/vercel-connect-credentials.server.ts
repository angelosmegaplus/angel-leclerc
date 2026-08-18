// Compatibilité temporaire avec les anciens imports.
// L’infrastructure active est Lovable ; les secrets sont lus par le runtime neutre.
export {
  getAiGatewayCredential,
  getOpenAiCredential,
  getOpenAiCredentials,
  getOpenAiCredentialHealthSnapshot,
  getTmdbCredential,
  getTmdbCredentials,
  getTmdbCredentialHealthSnapshot,
  markApiCredentialFailure,
  markApiCredentialHealthy,
  resolveTmdbCredential,
} from "./runtime-credentials.server";

export type { OpenAiCredential, TmdbCredential } from "./runtime-credentials.server";

export const TMDB_READ_TOKEN_COOKIE = "disabled";
export const TMDB_API_KEY_COOKIE = "disabled";
export const OPENAI_API_KEY_COOKIE = "disabled";
export const VERCEL_CONNECTOR_IDS = { tmdb: "disabled", openai: "disabled" } as const;

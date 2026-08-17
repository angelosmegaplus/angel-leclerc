import { createServerFn } from "@tanstack/react-start";
import { getTmdbCredentials } from "./vercel-connect-credentials.server";

export type FilmProviderHealth = {
  configuredCredentials: number;
  workingCredential: boolean;
  tmdbReachable: boolean;
  status: "ok" | "missing-credentials" | "all-credentials-failed";
};

/**
 * Safe health probe used by the private Films & séries UI.
 * It never exposes credential values or their source names.
 */
export const getFilmProviderHealth = createServerFn({ method: "GET" }).handler(async (): Promise<FilmProviderHealth> => {
  const credentials = await getTmdbCredentials();
  if (!credentials.length) {
    return {
      configuredCredentials: 0,
      workingCredential: false,
      tmdbReachable: false,
      status: "missing-credentials",
    };
  }

  try {
    const { tmdb } = await import("./tmdb.server");
    await tmdb<{ id?: number }>("/configuration");
    return {
      configuredCredentials: credentials.length,
      workingCredential: true,
      tmdbReachable: true,
      status: "ok",
    };
  } catch {
    return {
      configuredCredentials: credentials.length,
      workingCredential: false,
      tmdbReachable: false,
      status: "all-credentials-failed",
    };
  }
});

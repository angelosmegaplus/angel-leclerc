import { createServerFn } from "@tanstack/react-start";
import { filmContent } from "./film-content.server";
import { getTmdbCredentials } from "./runtime-credentials.server";

export type FilmProviderHealth = {
  configuredCredentials: number;
  workingCredential: boolean;
  tmdbReachable: boolean;
  status: "ok" | "missing-credentials" | "all-credentials-failed";
};

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
    await filmContent.health();
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

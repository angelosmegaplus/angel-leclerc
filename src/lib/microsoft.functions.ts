import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MicrosoftFile = {
  id: string;
  name: string;
  url: string;
  origin: "OneDrive" | "Word" | "Excel";
  size: number | null;
  updatedAt: string | null;
};

export type MicrosoftFilesResult = {
  files: MicrosoftFile[];
  sources: Array<{ origin: MicrosoftFile["origin"]; connected: boolean; detail: string }>;
};

/** Chaque connecteur Microsoft a son propre préfixe Graph derrière la passerelle. */
const PREFIX = {
  microsoft_onedrive: "/v1.0",
  microsoft_word: "",
  microsoft_excel: "",
} as const;

type Connector = keyof typeof PREFIX;

async function graph(connector: Connector, path: string, query?: Record<string, string>) {
  const { gatewayRequest } = await import("./connectors/lovable-gateway.server");
  return gatewayRequest(connector, `${PREFIX[connector]}${path}`, query ? { query } : {});
}

function mapItems(raw: any, origin: MicrosoftFile["origin"]): MicrosoftFile[] {
  const items = (raw?.value ?? []) as any[];
  return items
    .filter((item) => item?.name && !item.folder)
    .map((item) => ({
      id: `ms-${origin}-${item.id}`,
      name: String(item.name),
      url: String(item.webUrl ?? ""),
      origin,
      size: typeof item.size === "number" ? item.size : null,
      updatedAt: item.lastModifiedDateTime ?? null,
    }))
    .filter((item) => item.url);
}

export const listMicrosoftFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<MicrosoftFilesResult> => {
    const { gatewayConfigured } = await import("./connectors/lovable-gateway.server");

    const jobs: Array<{
      connector: Connector;
      origin: MicrosoftFile["origin"];
      run: () => Promise<any>;
    }> = [
      {
        connector: "microsoft_onedrive",
        origin: "OneDrive",
        run: () => graph("microsoft_onedrive", "/me/drive/root/children", { $top: "50" }),
      },
      {
        connector: "microsoft_word",
        origin: "Word",
        run: () => graph("microsoft_word", "/me/drive/root/search(q='.docx')", { $top: "25" }),
      },
      {
        connector: "microsoft_excel",
        origin: "Excel",
        run: () => graph("microsoft_excel", "/me/drive/root/search(q='.xlsx')", { $top: "25" }),
      },
    ];

    const results = await Promise.all(
      jobs.map(async (job) => {
        if (!gatewayConfigured(job.connector)) {
          return { origin: job.origin, files: [] as MicrosoftFile[], connected: false, detail: "Connecteur non relié." };
        }
        try {
          const raw = await job.run();
          const files = mapItems(raw, job.origin);
          return {
            origin: job.origin,
            files,
            connected: true,
            detail: files.length ? `${files.length} fichier(s) accessible(s).` : "Aucun fichier trouvé.",
          };
        } catch (error) {
          return {
            origin: job.origin,
            files: [] as MicrosoftFile[],
            connected: false,
            detail: error instanceof Error ? error.message.slice(0, 180) : "Lecture impossible.",
          };
        }
      }),
    );

    const seen = new Set<string>();
    const files: MicrosoftFile[] = [];
    for (const result of results) {
      for (const file of result.files) {
        if (seen.has(file.url)) continue;
        seen.add(file.url);
        files.push(file);
      }
    }

    return {
      files,
      sources: results.map((result) => ({
        origin: result.origin,
        connected: result.connected,
        detail: result.detail,
      })),
    };
  });

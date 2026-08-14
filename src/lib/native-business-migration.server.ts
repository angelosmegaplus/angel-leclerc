import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import { angelDataServerAdapter, type AngelDataClient } from "../../angel-os/adapters/data.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);

async function dataClient(): Promise<AngelDataClient> {
  return adapters.connect<AngelDataClient>("angel.data.native");
}

export type NativeBusinessMigrationReport = {
  applications: number;
  articles: number;
  migratedAt: string;
};

export async function migrateApplicationsAndArticlesToAngelData(): Promise<NativeBusinessMigrationReport> {
  const data = await dataClient();
  const db = supabaseAdmin();

  const [applicationsResult, articlesResult] = await Promise.all([
    db.from("applications").select("*"),
    db.from("articles").select("*"),
  ]);

  if (applicationsResult.error) throw applicationsResult.error;
  if (articlesResult.error) throw articlesResult.error;

  const applications = applicationsResult.data ?? [];
  const articles = articlesResult.data ?? [];

  await Promise.all(
    applications.map((application) =>
      data.set("business.applications", String(application.id), {
        ...application,
        migratedAt: new Date().toISOString(),
        sourceProvider: "supabase",
      }),
    ),
  );

  await Promise.all(
    articles.map((article) =>
      data.set("content.articles", String(article.id), {
        ...article,
        migratedAt: new Date().toISOString(),
        sourceProvider: "supabase",
      }),
    ),
  );

  const report: NativeBusinessMigrationReport = {
    applications: applications.length,
    articles: articles.length,
    migratedAt: new Date().toISOString(),
  };

  await data.set("migration.status", "business-core", report);
  return report;
}

export async function listNativeApplications() {
  const data = await dataClient();
  return data.list<Record<string, unknown>>("business.applications");
}

export async function listNativeArticles() {
  const data = await dataClient();
  return data.list<Record<string, unknown>>("content.articles");
}

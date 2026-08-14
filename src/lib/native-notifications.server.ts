import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import { angelDataServerAdapter, type AngelDataClient } from "../../angel-os/adapters/data.server";
import type { SyncReport } from "./notifications.server";

const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);

function valueOf<T>(entry: { value: T }) { return entry.value; }

export async function syncNativeBusinessNotifications(): Promise<SyncReport> {
  const data = await adapters.connect<AngelDataClient>("angel.data.native");
  const [applicationsRows, articleRows, existingRows] = await Promise.all([
    data.list<Record<string, any>>("business.applications"),
    data.list<Record<string, any>>("content.articles"),
    data.list<Record<string, any>>("notifications.native"),
  ]);

  const applications = applicationsRows.map(valueOf);
  const articles = articleRows.map(valueOf);
  const existing = new Set(existingRows.map((row) => row.key));
  const now = Date.now();
  const candidates: Array<{ key: string; value: Record<string, unknown>; kind: string }> = [];

  for (const application of applications) {
    const followUp = application.follow_up_at;
    const status = String(application.status ?? "");
    if (!followUp || ["accepted", "accepted", "refused", "refusee"].includes(status)) continue;
    const due = new Date(String(followUp).length <= 10 ? `${followUp}T12:00:00` : followUp).getTime();
    if (Number.isNaN(due) || due > now) continue;
    const key = `application-followup:${application.id}:${followUp}`;
    candidates.push({
      key,
      kind: "application",
      value: {
        kind: "application",
        title: `Candidature à relancer : ${application.company ?? "Entreprise"}`,
        content: application.position ? `Poste : ${application.position}` : null,
        link: "/admin?tab=candidatures",
        createdAt: new Date().toISOString(),
        source: "angel-data",
      },
    });
  }

  for (const article of articles) {
    if (!article.published || !article.published_at) continue;
    const publishedAt = new Date(article.published_at).getTime();
    if (Number.isNaN(publishedAt) || publishedAt < now - 3 * 24 * 60 * 60 * 1000) continue;
    const key = `article-published:${article.id}:${article.published_at}`;
    candidates.push({
      key,
      kind: "publication",
      value: {
        kind: "publication",
        title: `Publication en ligne : ${article.title ?? "Article"}`,
        content: null,
        link: article.slug ? `/articles/${article.slug}` : "/admin?tab=articles",
        createdAt: new Date().toISOString(),
        source: "angel-data",
      },
    });
  }

  const fresh = candidates.filter((candidate) => !existing.has(candidate.key));
  await Promise.all(fresh.map((candidate) => data.set("notifications.native", candidate.key, candidate.value)));

  return { created: fresh.length, kinds: [...new Set(fresh.map((candidate) => candidate.kind))] };
}

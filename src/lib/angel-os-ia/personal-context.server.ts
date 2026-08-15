import { angelMemoryIndex, recordAngelOperation } from "@/lib/angel-runtime.server";

export type PersonalDomain = "applications" | "mail" | "agenda" | "news" | "media" | "preferences";

export type PersonalContextItem = {
  id: string;
  domain: PersonalDomain;
  title: string;
  text: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Angel OS IA personal layer.
 * Angel OS provides the memory/event primitives; this module decides which
 * personal information is useful to index for the private IA distribution.
 */
export async function rememberPersonalContext(item: PersonalContextItem) {
  angelMemoryIndex.upsert({
    id: `angel-os-ia:${item.domain}:${item.id}`,
    source: `angel-os-ia:${item.domain}`,
    title: item.title,
    text: item.text,
    tags: ["angel-os-ia", "personal", item.domain, ...(item.tags ?? [])],
    updatedAt: Date.now(),
    metadata: item.metadata ?? {},
  });

  await recordAngelOperation({
    type: "angel-os-ia.personal-context.indexed",
    source: `angel-os-ia:${item.domain}`,
    ok: true,
    payload: { id: item.id, domain: item.domain },
  });
}

export function searchPersonalContext(query: string, limit = 8) {
  return angelMemoryIndex
    .search(query, Math.max(limit * 2, 12))
    .filter((hit) => hit.source.startsWith("angel-os-ia:"))
    .slice(0, limit);
}

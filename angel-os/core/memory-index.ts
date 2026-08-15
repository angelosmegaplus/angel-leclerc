// SPDX-License-Identifier: GPL-2.0-only

export type MemoryDocument = {
  id: string;
  source: string;
  title: string;
  text: string;
  tags?: string[];
  updatedAt: number;
  metadata?: Record<string, unknown>;
};

export type MemoryHit = MemoryDocument & { score: number };

function tokens(input: string) {
  return input.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/\p{Diacritic}/gu, '').split(/[^a-z0-9]+/).filter((token) => token.length > 1);
}

export class AngelMemoryIndex {
  private docs = new Map<string, MemoryDocument>();

  upsert(document: MemoryDocument) {
    this.docs.set(document.id, document);
  }

  remove(id: string) {
    this.docs.delete(id);
  }

  get(id: string) {
    return this.docs.get(id) ?? null;
  }

  search(query: string, limit = 20): MemoryHit[] {
    const queryTokens = new Set(tokens(query));
    if (!queryTokens.size) return [];
    const now = Date.now();
    return [...this.docs.values()].map((doc) => {
      const titleTokens = tokens(doc.title);
      const bodyTokens = tokens(doc.text);
      const tagTokens = tokens((doc.tags ?? []).join(' '));
      let score = 0;
      for (const token of queryTokens) {
        if (titleTokens.includes(token)) score += 8;
        score += bodyTokens.filter((value) => value === token).length * 2;
        if (tagTokens.includes(token)) score += 5;
      }
      const ageDays = Math.max(0, (now - doc.updatedAt) / 86_400_000);
      score += Math.max(0, 3 - ageDays / 30);
      return { ...doc, score };
    }).filter((hit) => hit.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  stats() {
    const bySource: Record<string, number> = {};
    for (const doc of this.docs.values()) bySource[doc.source] = (bySource[doc.source] ?? 0) + 1;
    return { total: this.docs.size, bySource };
  }
}

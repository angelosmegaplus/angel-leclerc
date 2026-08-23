export type FlammeRegion = {
  id: string;
  label: string;
  /** Slug du flux France 3 Régions (france3-regions.franceinfo.fr/<slug>/actu/rss). */
  slug: string;
  /** Nom affiché comme source pour les articles régionaux. */
  source: string;
};

export const FLAMME_REGIONS: FlammeRegion[] = [
  { id: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes", slug: "auvergne-rhone-alpes", source: "France 3 Auvergne-Rhône-Alpes" },
  { id: "bourgogne-franche-comte", label: "Bourgogne-Franche-Comté", slug: "bourgogne-franche-comte", source: "France 3 Bourgogne-Franche-Comté" },
  { id: "bretagne", label: "Bretagne", slug: "bretagne", source: "France 3 Bretagne" },
  { id: "centre-val-de-loire", label: "Centre-Val de Loire", slug: "centre-val-de-loire", source: "France 3 Centre-Val de Loire" },
  { id: "corse", label: "Corse", slug: "corse", source: "France 3 Corse" },
  { id: "grand-est", label: "Grand Est", slug: "grand-est", source: "France 3 Grand Est" },
  { id: "hauts-de-france", label: "Hauts-de-France", slug: "hauts-de-france", source: "France 3 Hauts-de-France" },
  { id: "ile-de-france", label: "Île-de-France", slug: "paris-ile-de-france", source: "France 3 Paris Île-de-France" },
  { id: "normandie", label: "Normandie", slug: "normandie", source: "France 3 Normandie" },
  { id: "nouvelle-aquitaine", label: "Nouvelle-Aquitaine", slug: "nouvelle-aquitaine", source: "France 3 Nouvelle-Aquitaine" },
  { id: "occitanie", label: "Occitanie", slug: "occitanie", source: "France 3 Occitanie" },
  { id: "pays-de-la-loire", label: "Pays de la Loire", slug: "pays-de-la-loire", source: "France 3 Pays de la Loire" },
  { id: "provence-alpes-cote-d-azur", label: "Provence-Alpes-Côte d’Azur", slug: "provence-alpes-cote-d-azur", source: "France 3 Provence-Alpes-Côte d’Azur" },
];

export function findRegion(id: string | null | undefined): FlammeRegion | null {
  if (!id) return null;
  return FLAMME_REGIONS.find((region) => region.id === id) ?? null;
}

const REGION_KEY = "flamme-news-region";

export function readNewsRegion(): string | null {
  try {
    const raw = localStorage.getItem(REGION_KEY);
    return findRegion(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeNewsRegion(id: string | null) {
  try {
    if (id) localStorage.setItem(REGION_KEY, id);
    else localStorage.removeItem(REGION_KEY);
  } catch {
    // Stockage local indisponible : le réglage reste actif pour la session.
  }
}

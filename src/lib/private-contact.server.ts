/**
 * Coordonnées directes — serveur uniquement.
 * Ces valeurs ne doivent jamais être importées depuis un composant client :
 * elles ne sont renvoyées qu'après vérification anti-robot (voir contact-reveal.functions.ts).
 */
export type DirectContact = {
  email: string;
  phone: string;
  phoneHref: string;
};

export function getDirectContact(): DirectContact {
  const email = process.env["CONTACT_NOTIFY_ADDRESS"] || "contact@angel-leclerc.fr";
  return {
    email,
    phone: "06 01 76 69 78",
    phoneHref: "tel:+33601766978",
  };
}

/** Limite mémoire par IP : révélations de coordonnées. */
const buckets = new Map<string, number[]>();

export function allowReveal(ip: string | null, limit = 5, windowMs = 60 * 60 * 1000): boolean {
  if (!ip) return true;
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(ip, hits);
    return false;
  }
  hits.push(now);
  buckets.set(ip, hits);
  return true;
}

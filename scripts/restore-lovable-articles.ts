import { createClient } from "@supabase/supabase-js";
import batch01 from "../src/content/lovable-archive/articles-01.json";
import batch02 from "../src/content/lovable-archive/articles-02.json";
import batch03 from "../src/content/lovable-archive/articles-03.json";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error(
    "Restauration bloquée : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY sont requis côté serveur.",
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const archive = [...batch01, ...batch02, ...batch03] as Array<Record<string, unknown> & {
  id: string;
  slug: string;
  title: string;
  updated_at?: string | null;
}>;

const { data: deletedRows, error: deletedError } = await supabase
  .from("git_article_state")
  .select("slug")
  .eq("deleted", true);

if (deletedError) {
  throw new Error(`Impossible de lire le registre des suppressions volontaires : ${deletedError.message}`);
}

const deleted = new Set((deletedRows ?? []).map((row) => String(row.slug)));
const report = {
  archive: archive.length,
  alreadyPresent: 0,
  skippedDeleted: 0,
  restored: 0,
  failed: [] as Array<{ slug: string; reason: string }>,
};

for (const article of archive) {
  if (deleted.has(article.slug)) {
    report.skippedDeleted += 1;
    continue;
  }

  const { data: existing, error: existingError } = await supabase
    .from("articles")
    .select("id,slug,updated_at")
    .eq("slug", article.slug)
    .maybeSingle();

  if (existingError) {
    report.failed.push({ slug: article.slug, reason: existingError.message });
    continue;
  }

  // Ne jamais écraser une version native actuelle, même si l'archive paraît plus récente.
  // Toute fusion éventuelle doit être examinée séparément : ici on restaure seulement les absents.
  if (existing) {
    report.alreadyPresent += 1;
    continue;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("articles")
    .insert(article)
    .select("id,slug")
    .single();

  if (insertError || !inserted) {
    report.failed.push({
      slug: article.slug,
      reason: insertError?.message ?? "Insertion non confirmée",
    });
    continue;
  }

  // Relecture obligatoire : aucun article n'est compté restauré sur le seul retour d'INSERT.
  const { data: verified, error: verifyError } = await supabase
    .from("articles")
    .select("id,slug")
    .eq("slug", article.slug)
    .maybeSingle();

  if (verifyError || !verified || verified.id !== inserted.id) {
    report.failed.push({
      slug: article.slug,
      reason: verifyError?.message ?? "Relecture de validation impossible",
    });
    continue;
  }

  report.restored += 1;
}

console.log(JSON.stringify(report, null, 2));

if (report.failed.length > 0) {
  process.exitCode = 1;
}

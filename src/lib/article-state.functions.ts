import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

export const getDeletedRecoveredArticleSlugs = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const { data, error } = await supabaseAdmin
      .from("git_article_state")
      .select("slug")
      .eq("deleted", true);
    if (error) throw error;
    return (data ?? []).map((row) => row.slug);
  },
);

export const deleteRecoveredArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ slug: string; deleted: true }> => {
    await assertAdmin(context);
    const payload = data as { slug?: string } | undefined;
    const slug = payload?.slug?.trim();
    if (!slug) throw new Error("Slug d'article manquant.");

    const { error } = await supabaseAdmin
      .from("git_article_state")
      .upsert(
        { slug, deleted: true, deleted_at: new Date().toISOString() },
        { onConflict: "slug" },
      );
    if (error) throw error;

    const { data: verified, error: verifyError } = await supabaseAdmin
      .from("git_article_state")
      .select("slug,deleted")
      .eq("slug", slug)
      .eq("deleted", true)
      .maybeSingle();
    if (verifyError) throw verifyError;
    if (!verified) throw new Error("La suppression n'a pas pu être confirmée.");

    return { slug, deleted: true };
  });

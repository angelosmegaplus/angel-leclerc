import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";
import type { Article } from "@/lib/articles-types";

export const listPublicNativeArticles = createServerFn({ method: "GET" }).handler(async (): Promise<Article[] | null> => {
  const { listPublicArticlesNative } = await import("./articles-native.server");
  return listPublicArticlesNative();
});

export const getPublicNativeArticle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data: input }): Promise<Article | null> => {
    const { getPublicArticleNative } = await import("./articles-native.server");
    return getPublicArticleNative(input.slug);
  });

export const listAdminNativeArticles = createServerFn({ method: "GET" })
  .middleware([requireAngelAuth])
  .handler(async ({ context }): Promise<Article[]> => {
    await assertAngelAdmin(context);
    const { listAdminArticlesNative } = await import("./articles-native.server");
    return listAdminArticlesNative();
  });

export const saveAdminNativeArticle = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ article: z.record(z.string(), z.unknown()), id: z.string().nullable().optional() }).parse(input))
  .handler(async ({ context, data: input }): Promise<Article> => {
    await assertAngelAdmin(context);
    const { saveAdminArticleNative } = await import("./articles-native.server");
    return saveAdminArticleNative({ article: input.article, id: input.id, userId: context.userId });
  });

export const deleteAdminNativeArticle = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data: input }) => {
    await assertAngelAdmin(context);
    const { deleteAdminArticleNative } = await import("./articles-native.server");
    await deleteAdminArticleNative(input.id);
    return { ok: true };
  });

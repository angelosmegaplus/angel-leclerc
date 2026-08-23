import { createServerFn } from "@tanstack/react-start";
import { loadFlammeNews } from "./flamme-news.server";
import { curateFlammeNewsWithMistral } from "./flamme-news-curation.server";

export const getFlammeNews = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const region = (data as { region?: unknown } | undefined)?.region;
    return { region: typeof region === "string" ? region : null };
  })
  .handler(async ({ data }) => {
    const payload = await loadFlammeNews(data.region);
    return curateFlammeNewsWithMistral(payload);
  });

import { createServerFn } from "@tanstack/react-start";
import { loadFlammeNews } from "./flamme-news.server";

export const getFlammeNews = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const region = (data as { region?: unknown } | undefined)?.region;
    return { region: typeof region === "string" ? region : null };
  })
  .handler(async ({ data }) => {
    return loadFlammeNews(data.region);
  });

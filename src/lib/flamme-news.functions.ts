import { createServerFn } from "@tanstack/react-start";
import { loadFlammeNews } from "./flamme-news.server";

export const getFlammeNews = createServerFn({ method: "GET" }).handler(async () => {
  return loadFlammeNews();
});

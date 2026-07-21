import { createServerFn } from "@tanstack/react-start";

export type BlogPost = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  image: string | null;
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripCdata(s: string): string {
  return s.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
}

export const getBlogPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogPost[]> => {
    try {
      const res = await fetch("https://blog.angel-leclerc.fr/feed", {
        headers: { "user-agent": "angel-leclerc.fr blog preview" },
        redirect: "follow",
      });
      if (!res.ok) return [];
      const xml = await res.text();
      const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
      const posts: BlogPost[] = [];
      for (const block of blocks.slice(0, 3)) {
        const pick = (tag: string): string => {
          const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
          return m ? decodeEntities(stripCdata(m[1])) : "";
        };
        const title = pick("title");
        const link = pick("link");
        const pubDate = pick("pubDate");
        const rawDesc = pick("description");
        const enclosure = block.match(/<enclosure[^>]*url="([^"]+)"/);
        const media = block.match(/<media:content[^>]*url="([^"]+)"/);
        const contentEncoded = block.match(
          /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/
        );
        const inlineImg = (contentEncoded?.[1] ?? rawDesc).match(
          /<img[^>]+src="([^"]+)"/
        );
        const image =
          enclosure?.[1] ?? media?.[1] ?? inlineImg?.[1] ?? null;
        const description = rawDesc
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);
        if (title && link) {
          posts.push({ title, link, pubDate, description, image });
        }
      }
      return posts;
    } catch {
      return [];
    }
  }
);
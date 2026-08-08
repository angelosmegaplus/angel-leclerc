import { useState } from "react";

// Domains that have a known-good high-resolution logo source, overriding the
// automatic fallback chain. Used to make sure important brand marks are always
// sharp on the site rather than blurry favicons.
// All sources below are full-color, current brand marks (Iconify "logos"
// collection, SVGL, or the brand's own high-res icon) — never monochrome.
// Every brand mark is stored locally in /public/logos so a logo NEVER falls
// back to a grey placeholder globe or an empty circle. Remote favicon
// services are only a last resort for domains not listed here.
const LOCAL_LOGOS: Record<string, string> = {
  "google.com": "/logos/google.com.svg",
  "workspace.google.com": "/logos/workspace.google.com.svg",
  "sites.google.com": "/logos/sites.google.com.svg",
  "play.google.com": "/logos/play.google.com.svg",
  "gemini.google.com": "/logos/gemini.google.com.svg",
  "notebooklm.google.com": "/logos/notebooklm.google.com.svg",
  "chatgpt.com": "/logos/chatgpt.com.svg",
  "openai.com": "/logos/chatgpt.com.svg",
  "claude.ai": "/logos/claude.ai.svg",
  "canva.com": "/logos/canva.com.svg",
  "figma.com": "/logos/figma.com.svg",
  "adobe.com": "/logos/adobe.com.svg",
  "microsoft.com": "/logos/microsoft.com.svg",
  "office.com": "/logos/microsoft.com.svg",
  "facebook.com": "/logos/facebook.com.svg",
  "business.facebook.com": "/logos/business.facebook.com.svg",
  "meta.com": "/logos/business.facebook.com.svg",
  "instagram.com": "/logos/instagram.com.svg",
  "threads.com": "/logos/threads.com.svg",
  "threads.net": "/logos/threads.com.svg",
  "linkedin.com": "/logos/linkedin.com.svg",
  "youtube.com": "/logos/youtube.com.svg",
  "tiktok.com": "/logos/tiktok.com.svg",
  "substack.com": "/logos/substack.com.svg",
  "squarespace.com": "/logos/squarespace.com.svg",
  "wordpress.com": "/logos/wordpress.com.svg",
  "wix.com": "/logos/wix.com.svg",
  "webnode.com": "/logos/webnode.com.png",
  "lovable.dev": "/logos/lovable.dev.svg",
  "capcut.com": "/logos/capcut.com.png",
  "brevo.com": "/logos/brevo.com.png",
  "helloasso.com": "/logos/helloasso.com.png",
  "avizi.fr": "/logos/avizi.fr.png",
  "koesio.com": "/logos/koesio.com.png",
  "revolut.com": "/logos/revolut.com.svg",
  "sarlat.fr": "/logos/sarlat.fr.png",
  "valdesioule.com": "/logos/valdesioule.com.png",
  "laligue.org": "/logos/laligue.org.png",
  "mfr.asso.fr": "/logos/mfr.asso.fr.svg",
  "nch.com.au": "/logos/nch.com.au.png",
  "mokatourisme.fr": "/logos/mokatourisme.fr.svg",
  "apidae-tourisme.com": "/logos/apidae-tourisme.com.svg",
};

// Minimum acceptable rendered resolution. Anything below is considered a
// blurry favicon and we advance to the next source in the fallback chain.
const MIN_ACCEPTABLE_PX = 48;

function sources(domain: string): string[] {
  const list: string[] = [];
  const local = LOCAL_LOGOS[domain];
  if (local) list.push(local);
  // High-res favicon services with graceful degradation (largest first).
  list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  list.push(`https://www.google.com/s2/favicons?sz=256&domain=${domain}`);
  return list;
}

/**
 * Logo displays a brand logo from a domain with an automatic high-res fallback
 * chain. All logos render in a fixed-size square container so the visual
 * rhythm stays homogeneous across the whole site (no more mixed favicon
 * sizes). If every source fails, the container shows the first letter of
 * the alt text.
 */
export function Logo({
  domain,
  alt,
  size = 40,
  rounded = true,
  bare = false,
  href,
  link = true,
}: {
  domain: string;
  alt: string;
  size?: number;
  rounded?: boolean;
  bare?: boolean;
  /** Explicit destination. Defaults to the brand's own site. */
  href?: string;
  /** Set to false when the logo is already inside a link. */
  link?: boolean;
}) {
  const chain = sources(domain);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const src = chain[idx];
  const inner = Math.round(size * 0.7);

  const boxCls = bare
    ? "inline-flex shrink-0 items-center justify-center"
    : `inline-flex shrink-0 items-center justify-center border border-border bg-background ${rounded ? "rounded-xl" : ""}`;

  const box = (
    <span
      className={boxCls}
      style={{ width: size, height: size }}
      aria-hidden={true}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          width={inner}
          height={inner}
          loading="lazy"
          style={{
            width: inner,
            height: inner,
            objectFit: "contain",
            imageRendering: "auto",
          }}
          onLoad={(e) => {
            // Auto-QA: if the loaded image is a tiny favicon, skip to next
            // source. Applies only to non-SVG raster fallbacks.
            const img = e.currentTarget;
            const isLocal = src.startsWith("/logos/");
            const isSvg = /\.svg($|\?)/i.test(src) || src.includes("simpleicons.org");
            if (!isLocal && !isSvg && img.naturalWidth > 0 && img.naturalWidth < MIN_ACCEPTABLE_PX) {
              if (idx < chain.length - 1) setIdx(idx + 1);
            }
          }}
          onError={() => {
            if (idx < chain.length - 1) setIdx(idx + 1);
            else setFailed(true);
          }}
        />
      ) : (
        <span className="text-[10px] font-semibold text-foreground">
          {alt.replace(/^Logo\s+/i, "").charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );

  if (!link) return box;

  return (
    <a
      href={href ?? `https://${domain}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${alt} — ouvrir le site`}
      title={alt}
      className="inline-flex shrink-0 rounded-xl transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {box}
    </a>
  );
}
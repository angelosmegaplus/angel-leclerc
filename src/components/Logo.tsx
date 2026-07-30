import { useState } from "react";

// Domains that have a known-good high-resolution logo source, overriding the
// automatic fallback chain. Used to make sure important brand marks are always
// sharp on the site rather than blurry favicons.
const HIGH_RES_OVERRIDES: Record<string, string> = {
  "google.com": "https://cdn.simpleicons.org/google",
  "chatgpt.com": "https://cdn.simpleicons.org/openai/10a37f",
  "openai.com": "https://cdn.simpleicons.org/openai/10a37f",
  "canva.com": "https://cdn.simpleicons.org/canva/00c4cc",
  "figma.com": "https://cdn.simpleicons.org/figma",
  "adobe.com": "https://cdn.simpleicons.org/adobe/ff0000",
  "office.com": "https://cdn.simpleicons.org/microsoft",
  "microsoft.com": "https://cdn.simpleicons.org/microsoft",
  "workspace.google.com": "https://cdn.simpleicons.org/google",
  "facebook.com": "https://cdn.simpleicons.org/facebook/1877f2",
  "business.facebook.com": "https://cdn.simpleicons.org/meta/0866ff",
  "instagram.com": "https://cdn.simpleicons.org/instagram/e4405f",
  "linkedin.com": "https://cdn.simpleicons.org/linkedin/0a66c2",
  "tiktok.com": "https://cdn.simpleicons.org/tiktok",
  "lovable.dev": "https://cdn.simpleicons.org/lovable",
  "squarespace.com": "https://cdn.simpleicons.org/squarespace",
  "webnode.com": "https://cdn.simpleicons.org/webflow",
  "capcut.com": "https://cdn.simpleicons.org/capcut",
  "sigma.com": "https://cdn.simpleicons.org/sigma",
  "nch.com.au": "https://cdn.simpleicons.org/nchsoftware",
};

// Minimum acceptable rendered resolution. Anything below is considered a
// blurry favicon and we advance to the next source in the fallback chain.
const MIN_ACCEPTABLE_PX = 48;

function sources(domain: string): string[] {
  const list: string[] = [];
  const override = HIGH_RES_OVERRIDES[domain];
  if (override) list.push(override);
  // High-res favicon services with graceful degradation.
  list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  list.push(`https://www.google.com/s2/favicons?sz=256&domain=${domain}`);
  list.push(`https://www.google.com/s2/favicons?sz=128&domain=${domain}`);
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
}: {
  domain: string;
  alt: string;
  size?: number;
  rounded?: boolean;
  bare?: boolean;
}) {
  const chain = sources(domain);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const src = chain[idx];
  const inner = Math.round(size * 0.7);

  const boxCls = bare
    ? "inline-flex shrink-0 items-center justify-center"
    : `inline-flex shrink-0 items-center justify-center border border-border bg-background ${rounded ? "rounded-xl" : ""}`;

  return (
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
            const isSvg = /\.svg($|\?)/i.test(src) || src.includes("simpleicons.org");
            if (!isSvg && img.naturalWidth > 0 && img.naturalWidth < MIN_ACCEPTABLE_PX) {
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
}
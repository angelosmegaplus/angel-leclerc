import { useState } from "react";

// Domains that have a known-good high-resolution logo source, overriding the
// automatic fallback chain. Used to make sure important brand marks are always
// sharp on the site rather than blurry favicons.
const HIGH_RES_OVERRIDES: Record<string, string> = {
  "google.com": "https://api.iconify.design/simple-icons/google.svg",
  "chatgpt.com": "https://api.iconify.design/simple-icons/openai.svg",
  "openai.com": "https://api.iconify.design/simple-icons/openai.svg",
  "canva.com": "https://api.iconify.design/simple-icons/canva.svg",
  "figma.com": "https://api.iconify.design/simple-icons/figma.svg",
  "adobe.com": "https://api.iconify.design/simple-icons/adobe.svg",
  "office.com": "https://api.iconify.design/simple-icons/microsoft.svg",
  "microsoft.com": "https://api.iconify.design/simple-icons/microsoft.svg",
  "workspace.google.com": "https://api.iconify.design/simple-icons/google.svg",
  "facebook.com": "https://api.iconify.design/simple-icons/facebook.svg",
  "business.facebook.com": "https://api.iconify.design/simple-icons/meta.svg",
  "meta.com": "https://api.iconify.design/simple-icons/meta.svg",
  "instagram.com": "https://api.iconify.design/simple-icons/instagram.svg",
  "threads.com": "https://api.iconify.design/simple-icons/threads.svg",
  "threads.net": "https://api.iconify.design/simple-icons/threads.svg",
  "linkedin.com": "https://api.iconify.design/simple-icons/linkedin.svg",
  "tiktok.com": "https://api.iconify.design/simple-icons/tiktok.svg",
  "squarespace.com": "https://api.iconify.design/simple-icons/squarespace.svg",
  "capcut.com": "https://www.google.com/s2/favicons?sz=256&domain=capcut.com",
  "nch.com.au": "https://www.google.com/s2/favicons?sz=256&domain=nch.com.au",
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
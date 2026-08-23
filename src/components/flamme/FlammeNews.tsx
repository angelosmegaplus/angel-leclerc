import { RefreshCw } from "lucide-react";
import type { FlammeNewsItem } from "@/lib/flamme-news.server";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const value = Date.parse(iso);
  if (Number.isNaN(value)) return "";
  const diff = Date.now() - value;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days <= 7) return `il y a ${days} j`;
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "";
  const value = Date.parse(iso);
  if (Number.isNaN(value)) return "";
  return new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function FlammeNewsSkeleton({ surface, darkMode }: { surface: string; darkMode: boolean }) {
  const block = darkMode ? "bg-white/10" : "bg-[#f1f3f4]";
  return (
    <div className="grid gap-4" aria-hidden="true">
      <div className={`overflow-hidden rounded-2xl border ${surface}`}>
        <div className={`aspect-[16/9] w-full animate-pulse ${block}`} />
        <div className="space-y-2 p-4">
          <div className={`h-3 w-1/3 animate-pulse rounded ${block}`} />
          <div className={`h-4 w-full animate-pulse rounded ${block}`} />
          <div className={`h-4 w-2/3 animate-pulse rounded ${block}`} />
        </div>
      </div>
      <div className={`overflow-hidden rounded-2xl border ${surface}`}>
        {[0, 1, 2].map((index) => (
          <div key={index} className="grid grid-cols-[1fr_104px] gap-3 p-3.5">
            <div className="space-y-2 py-1">
              <div className={`h-3 w-1/4 animate-pulse rounded ${block}`} />
              <div className={`h-4 w-full animate-pulse rounded ${block}`} />
              <div className={`h-3 w-3/4 animate-pulse rounded ${block}`} />
            </div>
            <div className={`h-[82px] w-[104px] animate-pulse rounded-xl ${block}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  items: FlammeNewsItem[];
  fallbackImage: string;
  surface: string;
  muted: string;
  darkMode: string | boolean;
};

export function FlammeNewsList({ items, fallbackImage, surface, muted, darkMode }: Props) {
  const [first, ...rest] = items;
  if (!first) return null;
  const isDark = Boolean(darkMode);
  return (
    <div className="grid gap-4">
      <a
        href={first.url}
        target="_blank"
        rel="noreferrer"
        className={`group overflow-hidden rounded-2xl border ${surface}`}
      >
        <img
          src={first.imageUrl || fallbackImage}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
        <div className="p-4">
          <div className={`mb-2 flex items-center gap-2 text-[12px] ${muted}`}>
            <span className="font-medium text-[#1a73e8]">{first.source}</span>
            {first.publishedAt && (
              <>
                <span>•</span>
                <span>{relativeTime(first.publishedAt)}</span>
              </>
            )}
          </div>
          <h2 className="text-[20px] font-normal leading-7 group-hover:underline">{first.title}</h2>
          {first.description && <p className={`mt-2 line-clamp-3 text-[14px] leading-5 ${muted}`}>{first.description}</p>}
        </div>
      </a>

      {rest.length > 0 && (
        <div className={`overflow-hidden rounded-2xl border ${surface}`}>
          {rest.map((item, index) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className={`group grid min-h-[112px] grid-cols-[1fr_104px] gap-3 p-3.5 ${isDark ? "hover:bg-white/10" : "hover:bg-[#f8f9fa]"} ${index > 0 ? (isDark ? "border-t border-[#5f6368]" : "border-t border-[#e8eaed]") : ""}`}
            >
              <div className="min-w-0 py-1">
                <div className={`mb-1 flex items-center gap-2 text-[12px] font-medium ${muted}`}>
                  <span>{item.source}</span>
                  {item.publishedAt && <span className="font-normal">• {relativeTime(item.publishedAt)}</span>}
                </div>
                <h3 className="line-clamp-3 text-[15px] leading-5 group-hover:underline">{item.title}</h3>
              </div>
              <img
                src={item.imageUrl || fallbackImage}
                alt=""
                loading="lazy"
                className="h-[82px] w-[104px] rounded-xl object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlammeNewsRefresh({
  onRefresh,
  loading,
  label,
  darkMode,
}: {
  onRefresh: () => void;
  loading: boolean;
  label: string;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] disabled:opacity-60 ${darkMode ? "border-[#5f6368] hover:bg-white/10" : "border-[#dfe1e5] hover:bg-[#f1f3f4]"}`}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}

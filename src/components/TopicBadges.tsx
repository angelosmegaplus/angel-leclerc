import { Link } from "@tanstack/react-router";

export function TopicBadges({
  topics,
  className = "",
  linkToFilter = false,
}: {
  topics: string[];
  className?: string;
  linkToFilter?: boolean;
}) {
  if (!topics.length) return null;
  const base =
    "inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground";
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {topics.map((t) =>
        linkToFilter ? (
          <Link
            key={t}
            to="/articles"
            search={{ topic: t }}
            className={`${base} transition-colors hover:border-primary/50 hover:text-primary`}
          >
            {t}
          </Link>
        ) : (
          <span key={t} className={base}>
            {t}
          </span>
        ),
      )}
    </div>
  );
}

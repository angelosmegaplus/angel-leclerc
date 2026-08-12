import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Menu, X, type LucideIcon } from "lucide-react";

export type AdminNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  group: string;
  primary?: boolean;
};

export function AdminShell({
  items,
  active,
  onSelect,
  title,
  subtitle,
  actions,
  children,
}: {
  items: AdminNavItem[];
  active: string;
  onSelect: (key: string) => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const visibleItems = expanded
    ? items
    : items.filter((item) => item.primary || item.key === active);
  const groups = visibleItems.reduce<Record<string, AdminNavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const nav = (
    <>
      <nav aria-label="Navigation Angel OS" className="space-y-5">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              {group}
            </p>
            <ul className="space-y-0.5">
              {list.map(({ key, label, icon: Icon, badge }) => {
                const isActive = active === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        onSelect(key);
                        setOpen(false);
                      }}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white/12 text-white"
                          : "text-white/60 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {badge ? (
                        <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-medium text-white/60 hover:bg-white/8 hover:text-white"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? "Masquer les modules" : "Tous les modules"}
      </button>
    </>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <img src="/angel-os/logo.png" alt="" className="h-11 w-11 shrink-0 object-contain" />
      <div className="min-w-0">
        <p className="font-display text-xl font-bold tracking-tight text-white">Angel OS</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[#181716] px-3 py-5 lg:flex">
        <div className="px-3 pb-5">{brand}</div>
        {nav}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto bg-[#181716] px-3 py-5">
            <div className="flex items-start justify-between px-3 pb-5">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-bold text-foreground sm:text-xl">
                {title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </div>
        </header>
        <main className="px-4 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  );
}

export function AdminCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 sm:p-6 ${className}`}>
      {title && <h2 className="font-display text-base font-bold text-foreground">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function ModulePlaceholder({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <AdminCard title={title} description={description}>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-4 inline-flex rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
        Module en préparation — aucune donnée fictive affichée
      </p>
    </AdminCard>
  );
}

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

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function AdminShell({
  items,
  active,
  onSelect,
  title,
  actions,
  children,
}: {
  items: AdminNavItem[];
  active: string;
  onSelect: (key: string) => void;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(detectStandalone());
  }, []);

  useEffect(() => {
    if (!standalone) return;
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    root.dataset.angelOsApp = "standalone";
    return () => {
      delete root.dataset.angelOsApp;
      if (!hadDark) root.classList.remove("dark");
    };
  }, [standalone]);

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
            <p className="px-3 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
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
                      className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? standalone
                            ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-50 shadow-[inset_0_0_24px_rgba(34,211,238,.05)]"
                            : "bg-white/12 text-white"
                          : standalone
                            ? "border border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.045] hover:text-white"
                            : "text-white/60 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${standalone && isActive ? "text-cyan-300" : ""}`} />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {badge ? (
                        <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${standalone ? "bg-cyan-400/10 text-cyan-200" : "bg-white/15 text-white"}`}>
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
        className={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors ${
          standalone
            ? "border-cyan-400/10 bg-cyan-400/[0.025] font-mono text-cyan-100/60 hover:border-cyan-400/25 hover:bg-cyan-400/[0.06] hover:text-cyan-100"
            : "border-white/10 text-white/60 hover:bg-white/8 hover:text-white"
        }`}
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? "Masquer les modules" : "Tous les modules"}
      </button>
    </>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-1.5 ${standalone ? "border border-cyan-300/15 bg-black shadow-[0_0_34px_rgba(34,211,238,.10)]" : "bg-white shadow-sm ring-1 ring-black/10"}`}>
        <img src="/angel-os/logo.png" alt="" className="h-full w-full object-contain" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-xl font-bold tracking-tight text-white">Angel OS</p>
        {standalone && (
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/45">
            system.console // online
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden lg:flex ${
        standalone ? "bg-[#030405] text-white" : "bg-background"
      }`}
    >
      {standalone && (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.035) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,.7) 65%, transparent 100%)",
            }}
          />
          <div aria-hidden className="pointer-events-none fixed left-1/2 top-[-12rem] z-0 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-cyan-400/[0.055] blur-[110px]" />
        </>
      )}

      {/* Sidebar desktop */}
      <aside className={`sticky top-0 z-10 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto px-3 py-5 lg:flex ${standalone ? "border-r border-cyan-300/10 bg-black/85 backdrop-blur-xl" : "bg-[#181716]"}`}>
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className={`absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto px-3 py-5 ${standalone ? "border-r border-cyan-300/10 bg-[#050607]" : "bg-[#181716]"}`}>
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

      <div className="relative z-[1] min-w-0 flex-1">
        <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${standalone ? "border-cyan-300/10 bg-black/70" : "border-border bg-background/90"}`}>
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border lg:hidden ${standalone ? "border-cyan-300/15 bg-cyan-300/[0.03] text-cyan-100" : "border-border text-foreground"}`}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              {standalone && (
                <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-300/40">
                  angel.os / module.active
                </p>
              )}
              <h1 className={`truncate font-display text-lg font-bold sm:text-xl ${standalone ? "text-white" : "text-foreground"}`}>
                {title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </div>
          {standalone && (
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
          )}
        </header>
        <main className={`px-4 py-5 sm:px-6 sm:py-7 ${standalone ? "[&_.bg-card]:bg-[#080a0c]/90 [&_.border-border]:border-white/10 [&_.bg-background]:bg-black/40 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/50 [&_.bg-muted]:bg-white/[0.05]" : ""}`}>
          {children}
        </main>
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

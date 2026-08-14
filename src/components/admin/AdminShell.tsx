import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Command,
  Menu,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

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
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.innerWidth < 1024) setOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 40);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const visibleItems = normalizedQuery
    ? items.filter((item) => `${item.label} ${item.group}`.toLocaleLowerCase("fr").includes(normalizedQuery))
    : expanded
      ? items
      : items.filter((item) => item.primary || item.key === active);

  const groups = visibleItems.reduce<Record<string, AdminNavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const searchBox = (
    <div className="relative mb-5 px-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input
        ref={searchRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher un module…"
        aria-label="Rechercher dans Angel OS"
        className={`h-10 w-full rounded-xl border pl-10 pr-12 text-[13px] outline-none transition-all placeholder:text-white/30 focus:ring-2 ${
          standalone
            ? "border-white/10 bg-white/[0.045] text-white focus:border-cyan-300/35 focus:ring-cyan-300/10"
            : "border-white/10 bg-white/[0.06] text-white focus:border-white/25 focus:ring-white/10"
        }`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 font-mono text-[9px] text-white/35">
        <Command className="h-2.5 w-2.5" />K
      </span>
    </div>
  );

  const nav = (
    <>
      {searchBox}
      <nav aria-label="Navigation Angel OS" className="space-y-5">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <p className="px-3 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              {group}
            </p>
            <ul className="space-y-1">
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
                        setQuery("");
                      }}
                      className={`group relative flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-3 text-left text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 active:scale-[0.985] ${
                        isActive
                          ? standalone
                            ? "border border-cyan-300/20 bg-cyan-300/[0.085] text-white shadow-[inset_0_0_24px_rgba(34,211,238,.04),0_8px_28px_rgba(0,0,0,.16)]"
                            : "border border-white/10 bg-white/12 text-white shadow-sm"
                          : standalone
                            ? "border border-transparent text-white/58 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                            : "border border-transparent text-white/62 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {standalone && isActive ? (
                        <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.75)]" />
                      ) : null}
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${isActive ? standalone ? "bg-cyan-300/10 text-cyan-200" : "bg-white/10 text-white" : "text-white/45 group-hover:text-white/80"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
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
        {normalizedQuery && visibleItems.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center text-xs text-white/45">
            Aucun module trouvé.
          </div>
        ) : null}
      </nav>
      {!normalizedQuery ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all active:scale-[0.985] ${
            standalone
              ? "border-cyan-400/10 bg-cyan-400/[0.025] font-mono text-cyan-100/60 hover:border-cyan-400/25 hover:bg-cyan-400/[0.06] hover:text-cyan-100"
              : "border-white/10 text-white/60 hover:bg-white/8 hover:text-white"
          }`}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? "Modules essentiels" : "Tous les modules"}
        </button>
      ) : null}
    </>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-1.5 ${standalone ? "border border-cyan-300/15 bg-black shadow-[0_0_30px_rgba(34,211,238,.09)]" : "bg-white shadow-sm ring-1 ring-black/10"}`}>
        <img src="/angel-os/logo.png" alt="" className="h-full w-full object-contain" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold tracking-tight text-white">Angel OS</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${standalone ? "bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,.8)]" : "bg-emerald-400"}`} />
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/38">system online</p>
        </div>
      </div>
    </div>
  );

  const statusFooter = (
    <div className="mt-auto pt-5">
      <div className={`rounded-xl border px-3 py-3 ${standalone ? "border-white/[0.07] bg-white/[0.025]" : "border-white/10 bg-white/[0.035]"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-white/50">
            <Activity className={`h-3.5 w-3.5 ${standalone ? "text-cyan-300/65" : "text-white/50"}`} />
            <span className="truncate">Angel OS Runtime</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300/70">ready</span>
        </div>
      </div>
    </div>
  );

  const sidebarContents = (
    <>
      <div className="px-2 pb-5">{brand}</div>
      {nav}
      {statusFooter}
    </>
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
            className="pointer-events-none fixed inset-0 z-0 opacity-35"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.03) 1px,transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,.75) 65%, transparent 100%)",
            }}
          />
          <div aria-hidden className="pointer-events-none fixed left-1/2 top-[-14rem] z-0 h-[30rem] w-[54rem] -translate-x-1/2 rounded-full bg-cyan-400/[0.05] blur-[120px]" />
        </>
      )}

      <aside className={`sticky top-0 z-10 hidden h-screen w-[17rem] shrink-0 flex-col overflow-y-auto px-3 py-4 lg:flex ${standalone ? "border-r border-cyan-300/10 bg-black/82 backdrop-blur-2xl" : "bg-[#181716]"}`}>
        {sidebarContents}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto px-3 py-4 shadow-2xl ${standalone ? "border-r border-cyan-300/10 bg-[#050607]/98" : "bg-[#181716]"}`}>
            <div className="flex items-start justify-between px-2 pb-5">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {statusFooter}
          </div>
        </div>
      )}

      <div className="relative z-[1] min-w-0 flex-1">
        <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${standalone ? "border-cyan-300/10 bg-black/68" : "border-border bg-background/88"}`}>
          <div className="flex min-h-[64px] items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition active:scale-95 lg:hidden ${standalone ? "border-cyan-300/15 bg-cyan-300/[0.03] text-cyan-100 hover:bg-cyan-300/[0.07]" : "border-border text-foreground hover:bg-muted"}`}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              {standalone && (
                <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-300/38">
                  angel.os / workspace
                </p>
              )}
              <h1 className={`truncate font-display text-lg font-bold sm:text-xl ${standalone ? "text-white" : "text-foreground"}`}>
                {title}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) setOpen(true);
                window.setTimeout(() => searchRef.current?.focus(), 40);
              }}
              className={`hidden min-h-9 items-center gap-2 rounded-lg border px-3 text-xs transition sm:inline-flex lg:hidden ${standalone ? "border-white/10 bg-white/[0.035] text-white/45 hover:bg-white/[0.07] hover:text-white/70" : "border-border text-muted-foreground hover:bg-muted"}`}
              aria-label="Rechercher un module"
            >
              <Search className="h-3.5 w-3.5" /> Rechercher
            </button>
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </div>
          {standalone && <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />}
        </header>

        <main className={`mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 ${standalone ? "[&_.bg-card]:bg-[#080a0c]/92 [&_.border-border]:border-white/10 [&_.bg-background]:bg-black/40 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/52 [&_.bg-muted]:bg-white/[0.05] [&_.rounded-2xl]:shadow-[0_16px_50px_rgba(0,0,0,.16)]" : ""}`}>
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
    <section className={`rounded-2xl border border-border bg-card p-4 transition-shadow duration-200 sm:p-6 ${className}`}>
      {title && <h2 className="font-display text-base font-bold text-foreground">{title}</h2>}
      {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
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

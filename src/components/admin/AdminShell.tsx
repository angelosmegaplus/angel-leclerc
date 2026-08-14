import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
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

const ACCENT = "#0078d7";

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
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    root.dataset.angelOsUi = "metro";
    return () => {
      delete root.dataset.angelOsUi;
      if (!hadDark) root.classList.remove("dark");
    };
  }, []);

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
        setOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const visibleItems = useMemo(() => {
    if (normalizedQuery) {
      return items.filter((item) =>
        `${item.label} ${item.group}`.toLocaleLowerCase("fr").includes(normalizedQuery),
      );
    }
    if (expanded) return items;
    return items.filter((item) => item.primary || item.key === active);
  }, [active, expanded, items, normalizedQuery]);

  const groups = useMemo(
    () =>
      visibleItems.reduce<Record<string, AdminNavItem[]>>((acc, item) => {
        (acc[item.group] ??= []).push(item);
        return acc;
      }, {}),
    [visibleItems],
  );

  const select = (key: string) => {
    onSelect(key);
    setOpen(false);
    setQuery("");
  };

  const searchBox = (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
      <input
        ref={searchRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="rechercher"
        aria-label="Rechercher dans Angel OS"
        className="h-11 w-full border border-white/35 bg-black pl-10 pr-3 text-sm font-light text-white outline-none transition-colors placeholder:text-white/45 focus:border-white"
      />
    </label>
  );

  const appList = (
    <div className="space-y-7">
      {Object.entries(groups).map(([group, list]) => (
        <section key={group}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {group}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {list.map(({ key, label, icon: Icon, badge }) => {
              const isActive = active === key;
              return (
                <button
                  type="button"
                  key={key}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => select(key)}
                  className="group relative min-h-24 overflow-hidden p-3 text-left text-white transition-transform duration-150 active:scale-[0.97]"
                  style={{ backgroundColor: isActive ? ACCENT : "#191919" }}
                >
                  <Icon className="h-7 w-7 stroke-[1.45]" />
                  <span className="absolute inset-x-3 bottom-2.5 truncate text-[13px] font-normal leading-none">
                    {label}
                  </span>
                  {badge ? (
                    <span className="absolute right-2.5 top-2 text-xs font-semibold tabular-nums">
                      {badge}
                    </span>
                  ) : null}
                  <span className="pointer-events-none absolute inset-0 border border-transparent transition-colors group-hover:border-white/25" />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {normalizedQuery && visibleItems.length === 0 ? (
        <p className="border-l-4 border-white/30 py-2 pl-3 text-sm font-light text-white/60">
          aucun résultat
        </p>
      ) : null}
    </div>
  );

  const menuContents = (
    <>
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Angel OS</p>
          <p className="mt-1 text-2xl font-light text-white">applications</p>
        </div>
        <span className="h-3 w-3" style={{ backgroundColor: ACCENT }} aria-hidden />
      </div>
      {searchBox}
      <div className="mt-7">{appList}</div>
      {!normalizedQuery ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-white/35 bg-black px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? "essentiels" : "toutes les apps"}
        </button>
      ) : null}
      <div className="mt-8 border-t border-white/15 pt-4 text-[11px] uppercase tracking-[0.16em] text-white/35">
        <span className="mr-2 inline-block h-2 w-2 bg-emerald-400" />online
      </div>
    </>
  );

  const currentItem = items.find((item) => item.key === active);
  const CurrentIcon = currentItem?.icon;

  return (
    <div
      className="min-h-screen bg-black text-white lg:flex"
      style={{ fontFamily: '"Segoe UI", "Segoe WP", system-ui, sans-serif' }}
    >
      <aside className="sticky top-0 hidden h-screen w-[19rem] shrink-0 overflow-y-auto border-r border-white/10 bg-black px-5 py-7 lg:block">
        {menuContents}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black lg:hidden">
          <div className="flex min-h-screen flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]">
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="grid h-12 w-12 place-items-center text-white"
              >
                <X className="h-7 w-7 stroke-[1.4]" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{menuContents}</div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1 bg-black">
        <header className="sticky top-0 z-30 bg-black/95 px-5 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir les applications"
              className="grid h-12 w-12 shrink-0 place-items-center text-white lg:hidden"
            >
              <Menu className="h-7 w-7 stroke-[1.35]" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Angel OS</p>
              <div className="mt-0.5 flex items-center gap-3">
                {CurrentIcon ? <CurrentIcon className="hidden h-7 w-7 shrink-0 stroke-[1.35] text-white/70 sm:block" /> : null}
                <h1 className="truncate text-[2rem] font-light leading-none tracking-[-0.025em] text-white sm:text-[2.7rem]">
                  {title.toLocaleLowerCase("fr")}
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                window.setTimeout(() => searchRef.current?.focus(), 50);
              }}
              aria-label="Rechercher"
              className="grid h-12 w-12 shrink-0 place-items-center text-white lg:hidden"
            >
              <Search className="h-6 w-6 stroke-[1.35]" />
            </button>
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </div>
          <div className="mt-4 h-1 w-16" style={{ backgroundColor: ACCENT }} />
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-5 pb-10 pt-4 sm:px-7 lg:px-10">
          <div
            key={active}
            className="animate-in fade-in slide-in-from-right-3 duration-200 [&_.bg-card]:bg-[#111] [&_.bg-background]:bg-black [&_.bg-muted]:bg-[#1b1b1b] [&_.border-border]:border-white/15 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/55 [&_.rounded-xl]:rounded-none [&_.rounded-2xl]:rounded-none [&_.rounded-lg]:rounded-none [&_.shadow-sm]:shadow-none"
          >
            {children}
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-20 flex h-[calc(3.4rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-white/15 bg-black px-4 pt-2 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-14 place-items-center text-white" aria-label="Applications">
            <Menu className="h-6 w-6 stroke-[1.3]" />
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              window.setTimeout(() => searchRef.current?.focus(), 50);
            }}
            className="grid h-10 w-14 place-items-center text-white"
            aria-label="Rechercher"
          >
            <Search className="h-6 w-6 stroke-[1.3]" />
          </button>
          <span className="mt-4 h-2 w-2" style={{ backgroundColor: ACCENT }} aria-label="Système en ligne" />
        </div>
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
    <section className={`border border-white/15 bg-[#111] p-4 sm:p-6 ${className}`}>
      {title ? <h2 className="text-xl font-light tracking-[-0.01em] text-white">{title.toLocaleLowerCase("fr")}</h2> : null}
      {description ? <p className="mt-1 max-w-3xl text-sm font-light leading-relaxed text-white/55">{description}</p> : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
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
      <ul className="space-y-3 text-sm font-light text-white/60">
        {points.map((point) => (
          <li key={point} className="flex gap-3">
            <span aria-hidden className="mt-1.5 h-3 w-1 shrink-0" style={{ backgroundColor: ACCENT }} />
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-5 border-l-4 border-white/20 py-1 pl-3 text-xs font-light text-white/45">
        module en préparation — aucune donnée fictive affichée
      </p>
    </AdminCard>
  );
}

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Grid2X2,
  Menu,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { NewsPanel } from "@/components/admin/NewsPanel";
import { PixelWidgets } from "@/components/admin/PixelWidgets";

export type AdminNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  group: string;
  primary?: boolean;
};

const INK = "#1f1f1f";
const PRIMARY = "#0b57d0";

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
    root.classList.remove("dark");
    root.dataset.angelOsUi = "pixel";
    return () => {
      delete root.dataset.angelOsUi;
      if (hadDark) root.classList.add("dark");
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
        window.setTimeout(() => searchRef.current?.focus(), 80);
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
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5f6368]" />
      <input
        ref={searchRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher dans Angel OS"
        aria-label="Rechercher dans Angel OS"
        className="h-14 w-full min-w-0 rounded-full border-0 bg-[#e9eef6] pl-12 pr-4 text-[15px] font-medium text-[#202124] outline-none ring-0 transition-shadow placeholder:text-[#6f7479] focus:shadow-[0_1px_2px_rgba(60,64,67,.2),0_2px_6px_rgba(60,64,67,.12)]"
      />
    </label>
  );

  const appList = (
    <div className="space-y-7">
      {Object.entries(groups).map(([group, list]) => (
        <section key={group}>
          <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-[#5f6368]">{group}</p>
          <div className="grid grid-cols-2 gap-2">
            {list.map(({ key, label, icon: Icon, badge }) => {
              const isActive = active === key;
              return (
                <button
                  type="button"
                  key={key}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => select(key)}
                  className={`group relative min-h-24 min-w-0 overflow-hidden rounded-[1.65rem] p-4 text-left transition-all duration-200 active:scale-[0.97] ${
                    isActive ? "bg-[#d3e3fd] text-[#0b3d91]" : "bg-white text-[#303134] hover:bg-[#f0f4f9]"
                  }`}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${isActive ? "bg-[#a8c7fa]" : "bg-[#edf2fa]"}`}>
                    <Icon className="h-5 w-5 stroke-[1.8]" />
                  </span>
                  <span className="absolute inset-x-4 bottom-3 truncate text-[13px] font-semibold">{label}</span>
                  {badge ? (
                    <span className="absolute right-3 top-3 grid min-h-6 min-w-6 place-items-center rounded-full bg-[#b3261e] px-1.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {normalizedQuery && visibleItems.length === 0 ? (
        <p className="rounded-[1.5rem] bg-white px-4 py-5 text-sm text-[#5f6368]">Aucun résultat.</p>
      ) : null}
    </div>
  );

  const menuContents = (
    <>
      <div className="mb-6 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#5f6368]">Angel OS</p>
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-[-0.04em] text-[#202124]">Applications</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d3e3fd] text-[#0b57d0]">
          <Grid2X2 className="h-5 w-5" />
        </span>
      </div>
      {searchBox}
      <div className="mt-6">{appList}</div>
      {!normalizedQuery ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#d3e3fd] px-4 text-sm font-semibold text-[#0b57d0] transition-transform active:scale-[0.98]"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? "Afficher les essentiels" : "Afficher toutes les apps"}
        </button>
      ) : null}
      <div className="mt-6 flex items-center gap-2 px-1 text-xs font-medium text-[#5f6368]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#34a853]" />
        Angel OS en ligne
      </div>
    </>
  );

  const currentItem = items.find((item) => item.key === active);
  const CurrentIcon = currentItem?.icon;
  const primaryItems = items.filter((item) => item.primary).slice(0, 4);
  const isDashboard = active === "dashboard";

  return (
    <div
      className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f8fafd] text-[#202124] lg:flex"
      style={{ fontFamily: '"Google Sans", "Roboto", "Inter", system-ui, sans-serif' }}
    >
      <aside className="sticky top-0 hidden h-[100dvh] w-[20rem] shrink-0 overflow-y-auto bg-[#f1f5f9] px-5 py-6 lg:block">
        {menuContents}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 h-[100dvh] bg-[#f8fafd]/80 backdrop-blur-md lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-md flex-col rounded-l-[2rem] bg-[#f1f5f9] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl sm:px-5">
            <div className="mb-3 flex shrink-0 justify-end">
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#303134]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">{menuContents}</div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 bg-[#f8fafd]/92 px-3 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="mx-auto flex min-w-0 max-w-[1500px] items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir les applications"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e9eef6] text-[#3c4043] lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#5f6368]">Angel OS</p>
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                {CurrentIcon ? (
                  <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d3e3fd] text-[#0b57d0] sm:grid">
                    <CurrentIcon className="h-5 w-5" />
                  </span>
                ) : null}
                <h1 className="min-w-0 truncate text-[1.65rem] font-semibold leading-none tracking-[-0.05em] text-[#202124] sm:text-[2.2rem]">
                  {title}
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                window.setTimeout(() => searchRef.current?.focus(), 80);
              }}
              aria-label="Rechercher"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e9eef6] text-[#3c4043] lg:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="hidden shrink-0 items-center gap-2 sm:flex [&_button]:rounded-full [&_a]:rounded-full">{actions}</div>
          </div>

          {actions ? (
            <div className="mx-auto mt-3 flex max-w-[1500px] gap-2 overflow-x-auto pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&_button]:rounded-full [&_a]:rounded-full">
              {actions}
            </div>
          ) : null}
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-10 lg:px-10">
          {isDashboard ? (
            <div className="mb-5 space-y-5" data-admin-dashboard-glance>
              <PixelWidgets />
              <NewsPanel />
            </div>
          ) : null}
          <div
            key={active}
            className="min-w-0 max-w-full animate-in fade-in zoom-in-[.985] duration-300 [&_.bg-card]:bg-white [&_.bg-background]:bg-white [&_.bg-muted]:bg-[#f0f4f9] [&_.border-border]:border-[#dfe3e7] [&_.text-foreground]:text-[#202124] [&_.text-muted-foreground]:text-[#5f6368] [&_.rounded-xl]:rounded-[1.5rem] [&_.rounded-2xl]:rounded-[2rem] [&_.rounded-lg]:rounded-[1.25rem] [&_.shadow-sm]:shadow-sm [&_img]:max-w-full [&_input]:max-w-full [&_textarea]:max-w-full [&_select]:max-w-full"
          >
            {children}
          </div>
        </main>

        <nav className="fixed inset-x-3 bottom-[calc(.6rem+env(safe-area-inset-bottom))] z-20 grid h-[4.8rem] grid-cols-5 items-center rounded-[2rem] bg-[#eef3fb]/95 px-2 shadow-[0_4px_24px_rgba(60,64,67,.18)] backdrop-blur-xl lg:hidden">
          {primaryItems.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button key={key} type="button" onClick={() => select(key)} className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[#5f6368]">
                <span className={`grid h-8 min-w-14 place-items-center rounded-full px-3 transition-colors ${isActive ? "bg-[#d3e3fd] text-[#0b57d0]" : "text-[#5f6368]"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="max-w-full truncate">{label}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[#5f6368]">
            <span className="grid h-8 min-w-14 place-items-center rounded-full px-3"><Grid2X2 className="h-5 w-5" /></span>
            <span>Apps</span>
          </button>
        </nav>
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
    <section className={`min-w-0 max-w-full overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {title ? <h2 className="break-words text-xl font-semibold tracking-[-0.03em] text-[#202124]">{title}</h2> : null}
      {description ? <p className="mt-1 max-w-3xl break-words text-sm leading-relaxed text-[#5f6368]">{description}</p> : null}
      <div className={`min-w-0 max-w-full ${title || description ? "mt-5" : ""}`}>{children}</div>
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
      <ul className="space-y-3 text-sm text-[#5f6368]">
        {points.map((point) => (
          <li key={point} className="flex min-w-0 gap-3 rounded-[1.25rem] bg-[#f6f8fc] p-3">
            <span aria-hidden className="mt-1.5 h-3 w-1 shrink-0 rounded-full bg-[#0b57d0]" />
            <span className="min-w-0 break-words">{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-[1.25rem] bg-[#f0f4f9] px-4 py-3 text-xs text-[#5f6368]">
        Module en préparation — aucune donnée fictive affichée.
      </p>
    </AdminCard>
  );
}

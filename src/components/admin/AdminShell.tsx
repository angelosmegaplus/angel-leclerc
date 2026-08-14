import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Grid2X2, Menu, Search, X, type LucideIcon } from "lucide-react";
import { NewsPanel } from "@/components/admin/NewsPanel";
import { PixelWidgets } from "@/components/admin/PixelWidgets";
import { AdminAutomationSummary } from "@/components/admin/AdminAutomationSummary";

export type AdminNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  group: string;
  primary?: boolean;
};

type CompactDefinition = {
  key: string;
  label: string;
  source: string;
  children: string[];
};

const COMPACT_NAV: CompactDefinition[] = [
  { key: "dashboard", label: "Accueil", source: "dashboard", children: ["dashboard"] },
  { key: "mail", label: "Mail", source: "boite-mail", children: ["boite-mail", "messages"] },
  { key: "agenda", label: "Agenda", source: "agenda", children: ["agenda"] },
  { key: "fichiers", label: "Fichiers", source: "fichiers", children: ["fichiers"] },
  { key: "blog", label: "Blog", source: "articles", children: ["articles", "contenus"] },
  { key: "studio", label: "Studio", source: "studio", children: ["studio", "projets"] },
  { key: "candidatures", label: "Candidatures", source: "candidatures", children: ["candidatures"] },
  { key: "communaute", label: "Communauté", source: "abonnes", children: ["abonnes", "avis"] },
  { key: "parametres", label: "Paramètres", source: "connexions", children: ["connexions", "activite", "notifications", "automatisation", "stats", "boutique"] },
];

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
  const [filter, setFilter] = useState("");

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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const compactItems = useMemo(() => {
    return COMPACT_NAV.map((definition) => {
      const source = items.find((item) => item.key === definition.source) ?? items[0];
      const badges = definition.children.map((key) => items.find((item) => item.key === key)?.badge ?? 0);
      return {
        ...definition,
        icon: source?.icon,
        badge: badges.reduce((sum, value) => sum + value, 0),
      };
    }).filter((item) => item.icon);
  }, [items]);

  const activeGroup = compactItems.find((item) => item.children.includes(active))?.key ?? "dashboard";
  const normalizedFilter = filter.trim().toLocaleLowerCase("fr");
  const shownItems = compactItems.filter((item) => !normalizedFilter || item.label.toLocaleLowerCase("fr").includes(normalizedFilter));

  const selectCompact = (source: string) => {
    onSelect(source);
    setOpen(false);
    setFilter("");
  };

  const openUniversalSearch = () => {
    const button = document.querySelector<HTMLButtonElement>('[aria-label="Recherche globale"]');
    if (button) button.click();
  };

  const appGrid = (
    <div className="space-y-4">
      <button type="button" onClick={openUniversalSearch} className="flex h-14 w-full items-center gap-3 rounded-full bg-[#e9eef6] px-4 text-left text-[#5f6368] transition-shadow hover:shadow-sm">
        <Search className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">Rechercher ou demander à Angel AI…</span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        {shownItems.map(({ key, label, source, icon: Icon, badge }) => {
          const isActive = activeGroup === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => selectCompact(source)}
              className={`group relative min-h-24 overflow-hidden rounded-[1.65rem] p-4 text-left transition-all active:scale-[0.98] ${isActive ? "bg-[#d3e3fd] text-[#0b3d91]" : "bg-white text-[#303134] hover:bg-[#f0f4f9]"}`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-full ${isActive ? "bg-[#a8c7fa]" : "bg-[#edf2fa]"}`}>
                <Icon className="h-5 w-5 stroke-[1.8]" />
              </span>
              <span className="absolute inset-x-4 bottom-3 truncate text-[13px] font-semibold">{label}</span>
              {badge > 0 ? <span className="absolute right-3 top-3 grid min-h-6 min-w-6 place-items-center rounded-full bg-[#b3261e] px-1.5 text-[10px] font-bold text-white">{badge}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.4rem] bg-white px-4 py-3 text-xs leading-relaxed text-[#5f6368]">
        Les anciennes sous-sections restent accessibles depuis la barre universelle. Exemple : « notifications », « avis », « statistiques » ou « automatisations ».
      </div>
    </div>
  );

  const menuContents = (
    <>
      <div className="mb-5 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#5f6368]">Angel OS</p>
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-[-0.04em] text-[#202124]">Applications</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d3e3fd] text-[#0b57d0]"><Grid2X2 className="h-5 w-5" /></span>
      </div>
      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6368]" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer les apps" className="h-11 w-full rounded-full border-0 bg-white pl-11 pr-4 text-sm outline-none" />
      </label>
      {appGrid}
      <div className="mt-5 flex items-center gap-2 px-1 text-xs font-medium text-[#5f6368]"><span className="h-2.5 w-2.5 rounded-full bg-[#34a853]" /> Angel OS en ligne</div>
    </>
  );

  const currentItem = items.find((item) => item.key === active);
  const CurrentIcon = currentItem?.icon;
  const isDashboard = active === "dashboard";
  const mobileItems = compactItems.slice(0, 4);

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f8fafd] text-[#202124] lg:flex" style={{ fontFamily: '"Google Sans", "Roboto", "Inter", system-ui, sans-serif' }}>
      <aside className="sticky top-0 hidden h-[100dvh] w-[19rem] shrink-0 overflow-y-auto bg-[#f1f5f9] px-4 py-6 lg:block">{menuContents}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 h-[100dvh] bg-[#f8fafd]/80 backdrop-blur-md lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-md flex-col rounded-l-[2rem] bg-[#f1f5f9] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl">
            <div className="mb-3 flex justify-end"><button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="grid h-12 w-12 place-items-center rounded-full bg-white"><X className="h-6 w-6" /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">{menuContents}</div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 bg-[#f8fafd]/92 px-3 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="mx-auto flex min-w-0 max-w-[1500px] items-center gap-2">
            <button type="button" onClick={() => setOpen(true)} aria-label="Ouvrir les applications" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e9eef6] text-[#3c4043] lg:hidden"><Menu className="h-6 w-6" /></button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#5f6368]">Angel OS</p>
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                {CurrentIcon ? <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d3e3fd] text-[#0b57d0] sm:grid"><CurrentIcon className="h-5 w-5" /></span> : null}
                <h1 className="min-w-0 truncate text-[1.65rem] font-semibold leading-none tracking-[-0.05em] text-[#202124] sm:text-[2.2rem]">{title}</h1>
              </div>
            </div>
            <button type="button" onClick={openUniversalSearch} aria-label="Ouvrir la recherche universelle" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e9eef6] text-[#3c4043] lg:hidden"><Search className="h-5 w-5" /></button>
            <div className="hidden shrink-0 items-center gap-2 sm:flex [&_button]:rounded-full [&_a]:rounded-full">{actions}</div>
          </div>
          {actions ? <div className="mx-auto mt-3 flex max-w-[1500px] gap-2 overflow-x-auto pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&_button]:rounded-full [&_a]:rounded-full">{actions}</div> : null}
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-28 lg:px-10">
          <AdminAutomationSummary mode="dashboard" />
          {isDashboard ? <div className="mb-5 space-y-5" data-admin-dashboard-glance><PixelWidgets /><NewsPanel /></div> : null}
          <div key={active} className="min-w-0 max-w-full animate-in fade-in zoom-in-[.985] duration-300 [&_.bg-card]:bg-white [&_.bg-background]:bg-white [&_.bg-muted]:bg-[#f0f4f9] [&_.border-border]:border-[#dfe3e7] [&_.text-foreground]:text-[#202124] [&_.text-muted-foreground]:text-[#5f6368] [&_.rounded-xl]:rounded-[1.5rem] [&_.rounded-2xl]:rounded-[2rem] [&_.rounded-lg]:rounded-[1.25rem] [&_.shadow-sm]:shadow-sm [&_img]:max-w-full [&_input]:max-w-full [&_textarea]:max-w-full [&_select]:max-w-full">{children}</div>
        </main>

        <button type="button" onClick={openUniversalSearch} className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-14 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 rounded-full bg-white px-5 text-left text-[#5f6368] shadow-[0_5px_24px_rgba(60,64,67,.22)] ring-1 ring-black/5 lg:bottom-6 lg:w-[min(46rem,calc(100vw-22rem))]">
          <Search className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">Rechercher ou demander à Angel AI…</span>
          <span className="hidden rounded-lg bg-[#f0f4f9] px-2 py-1 text-[11px] font-semibold sm:inline">Ctrl K</span>
        </button>

        <nav className="fixed inset-x-3 bottom-[calc(.6rem+env(safe-area-inset-bottom))] z-20 grid h-[4.8rem] grid-cols-5 items-center rounded-[2rem] bg-[#eef3fb]/95 px-2 shadow-[0_4px_24px_rgba(60,64,67,.18)] backdrop-blur-xl lg:hidden">
          {mobileItems.map(({ key, label, source, icon: Icon }) => {
            const isActive = activeGroup === key;
            return <button key={key} type="button" onClick={() => selectCompact(source)} className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[#5f6368]"><span className={`grid h-8 min-w-14 place-items-center rounded-full px-3 ${isActive ? "bg-[#d3e3fd] text-[#0b57d0]" : "text-[#5f6368]"}`}><Icon className="h-5 w-5" /></span><span className="max-w-full truncate">{label}</span></button>;
          })}
          <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[#5f6368]"><span className="grid h-8 min-w-14 place-items-center rounded-full px-3"><Grid2X2 className="h-5 w-5" /></span><span>Apps</span></button>
        </nav>
      </div>
    </div>
  );
}

export function AdminCard({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 max-w-full overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {title ? <h2 className="break-words text-xl font-semibold tracking-[-0.03em] text-[#202124]">{title}</h2> : null}
      {description ? <p className="mt-1 max-w-3xl break-words text-sm leading-relaxed text-[#5f6368]">{description}</p> : null}
      <div className={`min-w-0 max-w-full ${title || description ? "mt-5" : ""}`}>{children}</div>
    </section>
  );
}

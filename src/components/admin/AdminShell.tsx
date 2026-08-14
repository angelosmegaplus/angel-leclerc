import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, Grid2X2, X, type LucideIcon } from "lucide-react";
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
  { key: "studio", label: "Studio", source: "studio", children: ["studio", "projets", "articles", "contenus", "boutique"] },
  { key: "candidatures", label: "Candidatures", source: "candidatures", children: ["candidatures"] },
  { key: "communaute", label: "Communauté", source: "abonnes", children: ["abonnes", "avis", "stats"] },
  { key: "parametres", label: "Paramètres", source: "connexions", children: ["connexions", "notifications", "automatisation", "activite"] },
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
  const notificationBadge = items.find((item) => item.key === "notifications")?.badge ?? 0;

  const selectCompact = (source: string) => {
    onSelect(source);
    setOpen(false);
  };

  const openUniversalSearch = () => {
    const button = document.querySelector<HTMLButtonElement>('[aria-label="Recherche globale"]');
    if (button) button.click();
  };

  const appGrid = (
    <div className="grid grid-cols-2 gap-2">
      {compactItems.map(({ key, label, source, icon: Icon, badge }) => {
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
  );

  const menuContents = (
    <>
      <div className="mb-5 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-7 w-7 rounded-lg object-contain" />
            <p className="text-xs font-semibold text-[#5f6368]">Angel OS</p>
          </div>
          <p className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em] text-[#202124]">Applications</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d3e3fd] text-[#0b57d0]"><Grid2X2 className="h-5 w-5" /></span>
      </div>
      {appGrid}
      <div className="mt-5 flex items-center gap-2 px-1 text-xs font-medium text-[#5f6368]"><span className="h-2.5 w-2.5 rounded-full bg-[#34a853]" /> Angel OS en ligne</div>
    </>
  );

  const currentItem = items.find((item) => item.key === active);
  const CurrentIcon = currentItem?.icon;
  const isDashboard = active === "dashboard";

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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-7 w-7 rounded-lg object-contain" />
                <p className="text-xs font-semibold text-[#5f6368]">Angel OS</p>
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                {CurrentIcon ? <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d3e3fd] text-[#0b57d0] sm:grid"><CurrentIcon className="h-5 w-5" /></span> : null}
                <h1 className="min-w-0 truncate text-[1.65rem] font-semibold leading-none tracking-[-0.05em] text-[#202124] sm:text-[2.2rem]">{title}</h1>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex [&_button]:rounded-full [&_a]:rounded-full [&_[aria-label='Recherche_globale']]:hidden">{actions}</div>
          </div>
          {actions ? <div className="mx-auto mt-3 flex max-w-[1500px] gap-2 overflow-x-auto pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&_button]:rounded-full [&_a]:rounded-full [&_[aria-label='Recherche_globale']]:hidden">{actions}</div> : null}
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-24 lg:px-10">
          {isDashboard ? <div className="mb-5 space-y-5" data-admin-dashboard-glance><PixelWidgets /><NewsPanel /></div> : null}
          <div key={active} className="min-w-0 max-w-full animate-in fade-in zoom-in-[.985] duration-300 [&_.bg-card]:bg-white [&_.bg-background]:bg-white [&_.bg-muted]:bg-[#f0f4f9] [&_.border-border]:border-[#dfe3e7] [&_.text-foreground]:text-[#202124] [&_.text-muted-foreground]:text-[#5f6368] [&_.rounded-xl]:rounded-[1.5rem] [&_.rounded-2xl]:rounded-[2rem] [&_.rounded-lg]:rounded-[1.25rem] [&_.shadow-sm]:shadow-sm [&_img]:max-w-full [&_input]:max-w-full [&_textarea]:max-w-full [&_select]:max-w-full">{children}</div>
        </main>

        <div className="fixed bottom-[calc(.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-16 w-[min(44rem,calc(100vw-1.5rem))] -translate-x-1/2 items-center rounded-full bg-white shadow-[0_6px_28px_rgba(60,64,67,.24)] ring-1 ring-black/5 lg:w-[min(46rem,calc(100vw-22rem))]">
          <button type="button" onClick={openUniversalSearch} className="flex h-full min-w-0 flex-1 items-center px-5 text-left text-[#5f6368]">
            <span className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">Rechercher ou demander à Angel AI…</span>
            <span className="hidden rounded-lg bg-[#f0f4f9] px-2 py-1 text-[11px] font-semibold sm:inline">Ctrl K</span>
          </button>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => onSelect("notifications")}
            className="relative mr-2 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eef3fb] text-[#0b57d0]"
          >
            <Bell className="h-5 w-5" />
            {notificationBadge > 0 ? <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#b3261e] px-1 text-[9px] font-bold text-white">{notificationBadge}</span> : null}
          </button>
          <button
            type="button"
            aria-label="Ouvrir les applications"
            onClick={() => setOpen(true)}
            className="mr-2 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eef3fb] text-[#0b57d0] lg:hidden"
          >
            <Grid2X2 className="h-5 w-5" />
          </button>
        </div>
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

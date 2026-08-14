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
    root.classList.add("dark");
    root.dataset.angelOsUi = "core";
    return () => {
      delete root.dataset.angelOsUi;
      if (!hadDark) root.classList.remove("dark");
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
            className={`group relative min-h-24 overflow-hidden rounded-[1.65rem] border p-4 text-left transition-all active:scale-[0.98] ${isActive ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-white/10 bg-white/[.035] text-white/70 hover:border-red-500/20 hover:bg-red-500/[.05]"}`}
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl border ${isActive ? "border-red-500/25 bg-red-500/15 text-red-300" : "border-white/10 bg-black/30 text-white/55"}`}>
              <Icon className="h-5 w-5 stroke-[1.8]" />
            </span>
            <span className="absolute inset-x-4 bottom-3 truncate text-[13px] font-semibold">{label}</span>
            {badge > 0 ? <span className="absolute right-3 top-3 grid min-h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{badge}</span> : null}
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
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-8 w-8 rounded-lg object-contain" />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-red-300">Angel OS</p>
          </div>
          <p className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-white">Applications</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><Grid2X2 className="h-5 w-5" /></span>
      </div>
      {appGrid}
      <div className="mt-5 flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[.16em] text-white/35"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> system.online</div>
    </>
  );

  const currentItem = items.find((item) => item.key === active);
  const CurrentIcon = currentItem?.icon;
  const isDashboard = active === "dashboard";

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#050607] text-white lg:flex" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[.06] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:36px_36px]" />
      <aside className="sticky top-0 z-10 hidden h-[100dvh] w-[19rem] shrink-0 overflow-y-auto border-r border-white/10 bg-[#090b0d]/95 px-4 py-6 backdrop-blur-xl lg:block">{menuContents}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 h-[100dvh] bg-black/70 backdrop-blur-md lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-md flex-col rounded-l-[2rem] border-l border-white/10 bg-[#090b0d] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl">
            <div className="mb-3 flex justify-end"><button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><X className="h-6 w-6" /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">{menuContents}</div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050607]/90 px-3 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="mx-auto flex min-w-0 max-w-[1500px] items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-8 w-8 rounded-lg object-contain" />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-red-300">Angel OS</p>
              </div>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                {CurrentIcon ? <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 sm:grid"><CurrentIcon className="h-5 w-5" /></span> : null}
                <h1 className="min-w-0 truncate text-[1.65rem] font-semibold leading-none tracking-[-0.05em] text-white sm:text-[2.2rem]">{title}</h1>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex [&_button]:rounded-xl [&_a]:rounded-xl [&_button]:border-white/10 [&_a]:border-white/10 [&_button]:bg-white/[.04] [&_a]:bg-white/[.04] [&_button]:text-white [&_a]:text-white [&_[aria-label='Recherche_globale']]:hidden">{actions}</div>
          </div>
          {actions ? <div className="mx-auto mt-3 flex max-w-[1500px] gap-2 overflow-x-auto pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&_button]:rounded-xl [&_a]:rounded-xl [&_button]:border-white/10 [&_a]:border-white/10 [&_button]:bg-white/[.04] [&_a]:bg-white/[.04] [&_button]:text-white [&_a]:text-white [&_[aria-label='Recherche_globale']]:hidden">{actions}</div> : null}
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:pb-24 lg:px-10">
          {isDashboard ? <div className="mb-5 space-y-5" data-admin-dashboard-glance><PixelWidgets /><NewsPanel /></div> : null}
          <div key={active} className="min-w-0 max-w-full animate-in fade-in zoom-in-[.985] duration-300 [&_.bg-card]:bg-[#090b0d] [&_.bg-background]:bg-[#050607] [&_.bg-muted]:bg-white/[.04] [&_.border-border]:border-white/10 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/45 [&_.rounded-xl]:rounded-[1.25rem] [&_.rounded-2xl]:rounded-[1.75rem] [&_.rounded-lg]:rounded-xl [&_.shadow-sm]:shadow-[0_18px_60px_rgba(0,0,0,.28)] [&_img]:max-w-full [&_input]:max-w-full [&_textarea]:max-w-full [&_select]:max-w-full [&_input]:border-white/10 [&_textarea]:border-white/10 [&_select]:border-white/10 [&_input]:bg-black/30 [&_textarea]:bg-black/30 [&_select]:bg-black/30 [&_input]:text-white [&_textarea]:text-white [&_select]:text-white">{children}</div>
        </main>

        <div className="fixed bottom-[calc(.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-16 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 items-center rounded-full border border-white/10 bg-[#090b0d]/95 shadow-[0_12px_40px_rgba(0,0,0,.55)] backdrop-blur-xl lg:w-[min(38rem,calc(100vw-24rem))]">
          <button type="button" onClick={openUniversalSearch} className="flex h-full min-w-0 flex-1 items-center px-5 text-left text-white/55">
            <span className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">Rechercher ou demander à Angel AI…</span>
            <span className="hidden rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 font-mono text-[10px] text-white/35 sm:inline">Ctrl K</span>
          </button>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => onSelect("notifications")}
            className="relative mr-2 grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"
          >
            <Bell className="h-5 w-5" />
            {notificationBadge > 0 ? <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{notificationBadge}</span> : null}
          </button>
          <button
            type="button"
            aria-label="Ouvrir les applications"
            onClick={() => setOpen(true)}
            className="mr-2 grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/60 lg:hidden"
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
    <section className={`min-w-0 max-w-full overflow-x-clip rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 shadow-[0_18px_60px_rgba(0,0,0,.28)] sm:p-6 ${className}`}>
      {title ? <h2 className="break-words text-xl font-semibold tracking-[-0.03em] text-white">{title}</h2> : null}
      {description ? <p className="mt-1 max-w-3xl break-words text-sm leading-relaxed text-white/45">{description}</p> : null}
      <div className={`min-w-0 max-w-full ${title || description ? "mt-5" : ""}`}>{children}</div>
    </section>
  );
}

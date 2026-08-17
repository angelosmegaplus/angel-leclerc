import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, Grid2X2, X, type LucideIcon } from "lucide-react";
import { PixelWidgets } from "@/components/admin/PixelWidgets";
import { AngelCommandCenter } from "@/components/admin/AngelCommandCenter";
import { AINotificationMonitor } from "@/components/admin/AINotificationMonitor";

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
  description: string;
  source: string;
  children: string[];
};

const COMPACT_NAV: CompactDefinition[] = [
  { key: "dashboard", label: "Accueil", description: "Vue d'ensemble et priorités", source: "dashboard", children: ["dashboard"] },
  { key: "travail", label: "Travail", description: "Candidatures, projets, agenda et statistiques", source: "candidatures", children: ["candidatures", "projets", "agenda", "messages", "boite-mail", "stats"] },
  { key: "studio", label: "Studio", description: "Articles, médias, fichiers et services", source: "articles", children: ["articles", "studio", "contenus", "fichiers", "boutique"] },
  { key: "pilotage", label: "Pilotage IA", description: "ChatGPT, automatisations et activité", source: "angel-ai", children: ["angel-ai", "automatisation", "activite"] },
  { key: "systeme", label: "Système", description: "Connexions, alertes et communauté", source: "connexions", children: ["connexions", "notifications", "abonnes", "avis"] },
];

const lightActionScope = "[&_button]:rounded-xl [&_a]:rounded-xl [&_button]:border-[#dedbd4] [&_a]:border-[#dedbd4] [&_button]:bg-white [&_a]:bg-white [&_button]:text-[#202124] [&_a]:text-[#202124] [&_button]:shadow-sm [&_a]:shadow-sm [&_[aria-label='Recherche_globale']]:hidden";

export function AdminShell({ items, active, onSelect, title, actions, children }: {
  items: AdminNavItem[];
  active: string;
  onSelect: (key: string) => void;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.dataset.angelOsUi = "light";
    return () => {
      delete root.dataset.angelOsUi;
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const isEditable = (node: EventTarget | null) => {
      const el = node instanceof HTMLElement ? node : null;
      return Boolean(el?.matches('input, textarea, select, [contenteditable="true"]'));
    };
    const onFocusIn = (event: FocusEvent) => setEditing(isEditable(event.target));
    const onFocusOut = () => window.setTimeout(() => setEditing(isEditable(document.activeElement)), 0);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setAiOpen(true);
      }
      if (event.key === "Escape" && aiOpen) setAiOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aiOpen]);

  const compactItems = useMemo(() => COMPACT_NAV.map((definition) => {
    const source = items.find((item) => item.key === definition.source) ?? items[0];
    const badges = definition.children.map((key) => items.find((item) => item.key === key)?.badge ?? 0);
    return { ...definition, icon: source?.icon, badge: badges.reduce((sum, value) => sum + value, 0) };
  }).filter((item) => item.icon), [items]);

  const activeGroup = compactItems.find((item) => item.children.includes(active))?.key ?? "dashboard";
  const activeDefinition = COMPACT_NAV.find((definition) => definition.children.includes(active));
  const sectionItems = useMemo(() => {
    if (!activeDefinition || activeDefinition.children.length <= 1 || activeDefinition.key === "dashboard") return [];
    return activeDefinition.children.map((key) => items.find((item) => item.key === key)).filter((item): item is AdminNavItem => Boolean(item));
  }, [activeDefinition, items]);
  const notificationBadge = items.find((item) => item.key === "notifications")?.badge ?? 0;

  const selectCompact = (source: string) => {
    onSelect(source);
    setOpen(false);
    setAiOpen(false);
  };

  const appGrid = (
    <div className="grid gap-2">
      {compactItems.map(({ key, label, description, source, icon: Icon, badge }) => {
        const isActive = activeGroup === key;
        return (
          <button type="button" key={key} onClick={() => selectCompact(source)}
            className={`group relative min-h-[4.9rem] overflow-hidden rounded-[1.25rem] border p-3.5 text-left transition-all duration-200 active:scale-[0.985] ${isActive ? "border-red-200 bg-red-50 text-[#201b1b] shadow-[0_10px_28px_rgba(180,55,55,.08)]" : "border-[#e4e1da] bg-white text-[#3c4043] hover:border-red-200 hover:bg-[#fffafa] hover:shadow-sm"}`}>
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${isActive ? "border-red-200 bg-white text-red-600" : "border-[#e4e1da] bg-[#f7f7f5] text-[#5f6368] group-hover:text-red-600"}`}>
                <Icon className="h-5 w-5 stroke-[1.8]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{label}</span>
                <span className="mt-0.5 block truncate text-[11px] text-[#7a7d80]">{description}</span>
              </span>
              {badge > 0 ? <span className="grid min-h-6 min-w-6 shrink-0 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{badge}</span> : null}
            </div>
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
            <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-red-600">Angel OS</p>
          </div>
          <p className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-[#202124]">Centre de contrôle</p>
          <p className="mt-1 text-xs text-[#777b80]">Simple, lisible, pensé mobile</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600">
          <Grid2X2 className="h-5 w-5" />
        </span>
      </div>
      {appGrid}
      <div className="mt-5 flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[.16em] text-[#8a8d91]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> angel.os.online
      </div>
    </>
  );

  const currentItem = items.find((item) => item.key === active);
  const CurrentIcon = currentItem?.icon;
  const isDashboard = active === "dashboard";

  return (
    <div className="relative isolate min-h-[100dvh] w-full overflow-x-hidden bg-[#f5f6f7] text-[#202124] lg:flex" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <AINotificationMonitor />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_12%_8%,rgba(220,38,38,.055),transparent_32%),linear-gradient(180deg,#fafafa_0%,#f4f5f6_72%)]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-[.38] [background-image:linear-gradient(rgba(30,35,40,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(30,35,40,.025)_1px,transparent_1px)] [background-size:44px_44px]" />

      <aside className="sticky top-0 z-10 hidden h-[100dvh] w-[19rem] shrink-0 overflow-y-auto border-r border-[#e4e1da] bg-[#fbfbfa]/95 px-4 py-6 backdrop-blur-xl lg:block">{menuContents}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 h-[100dvh] bg-[#202124]/25 backdrop-blur-sm lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-md flex-col border-l border-[#e4e1da] bg-[#fbfbfa]/98 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl sm:rounded-l-[2rem] sm:px-4">
            <div className="mb-3 flex justify-end">
              <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="grid h-12 w-12 place-items-center rounded-xl border border-[#e4e1da] bg-white text-[#5f6368] transition hover:border-red-200 hover:text-red-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">{menuContents}</div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-[#e4e1da] bg-[#fbfbfa]/92 px-3 pb-2 pt-[calc(.55rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-7 sm:pb-3 sm:pt-[calc(.75rem+env(safe-area-inset-top))] lg:px-10">
          <div className="mx-auto flex min-w-0 max-w-[1500px] items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <img src="/angel-os/logo.png" alt="Logo Angel OS" className="h-7 w-7 rounded-lg object-cover shadow-sm sm:h-8 sm:w-8" />
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[.18em] text-red-600 sm:text-[10px]">Angel OS</p>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              </div>
              <div className="mt-1.5 flex min-w-0 items-center gap-2 sm:mt-2">
                {CurrentIcon ? <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 sm:grid"><CurrentIcon className="h-5 w-5" /></span> : null}
                <h1 className="min-w-0 truncate text-[1.35rem] font-semibold leading-none tracking-[-0.04em] text-[#202124] sm:text-[2.2rem]">{title}</h1>
              </div>
            </div>
            <div className={`hidden shrink-0 items-center gap-2 sm:flex ${lightActionScope}`}>{actions}</div>
          </div>
          {actions ? <div className={`mx-auto mt-2 flex max-w-[1500px] gap-2 overflow-x-auto pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&_button]:min-h-10 [&_button]:min-w-10 ${lightActionScope}`}>{actions}</div> : null}
        </header>

        {sectionItems.length > 0 ? (
          <nav aria-label={`Sections ${activeDefinition?.label ?? ""}`} className="sticky top-[calc(4.65rem+env(safe-area-inset-top))] z-20 border-b border-[#e4e1da] bg-[#fbfbfa]/94 px-3 py-2 backdrop-blur-xl sm:top-[calc(6.2rem+env(safe-area-inset-top))] sm:px-7 lg:px-10">
            <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === active;
                return (
                  <button key={item.key} type="button" onClick={() => onSelect(item.key)} aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ${isActive ? "border-red-200 bg-red-50 text-red-700" : "border-[#e4e1da] bg-white text-[#5f6368] hover:border-red-200 hover:text-[#202124]"}`}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {(item.badge ?? 0) > 0 ? <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">{item.badge}</span> : null}
                  </button>
                );
              })}
            </div>
          </nav>
        ) : null}

        <main className="mx-auto w-full min-w-0 max-w-[1500px] px-2.5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-24 sm:pt-4 lg:px-10">
          {isDashboard ? <div className="mb-5 space-y-4 sm:space-y-5" data-admin-dashboard-glance><PixelWidgets /></div> : null}
          <div key={active} className="min-w-0 max-w-full animate-in fade-in zoom-in-[.985] duration-300 [&_.bg-card]:bg-white [&_.bg-background]:bg-[#f8f9fa] [&_.bg-muted]:bg-[#f1f3f4] [&_.border-border]:border-[#dedbd4] [&_.text-foreground]:text-[#202124] [&_.text-muted-foreground]:text-[#6f7377] [&_.rounded-xl]:rounded-[1.25rem] [&_.rounded-2xl]:rounded-[1.75rem] [&_.rounded-lg]:rounded-xl [&_.shadow-sm]:shadow-[0_12px_36px_rgba(35,38,41,.07)] [&_img]:max-w-full [&_input]:max-w-full [&_textarea]:max-w-full [&_select]:max-w-full [&_input]:border-[#d9d7d1] [&_textarea]:border-[#d9d7d1] [&_select]:border-[#d9d7d1] [&_input]:bg-white [&_textarea]:bg-white [&_select]:bg-white [&_input]:text-[#202124] [&_textarea]:text-[#202124] [&_select]:text-[#202124] [&_input]:shadow-sm [&_textarea]:shadow-sm [&_select]:shadow-sm max-sm:[&_form]:!mt-2 max-sm:[&_form]:!space-y-4 max-sm:[&_form]:!rounded-2xl max-sm:[&_form]:!p-3 max-sm:[&_input]:min-h-11 max-sm:[&_select]:min-h-11 max-sm:[&_input]:text-base max-sm:[&_textarea]:text-base max-sm:[&_select]:text-base max-sm:[&_table]:text-xs max-sm:[&_label]:leading-snug">
            {children}
          </div>
        </main>

        {aiOpen ? (
          <div className="fixed inset-x-2 bottom-[calc(.5rem+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-[1.5rem] border border-[#dedbd4] bg-white/98 shadow-[0_20px_70px_rgba(35,38,41,.18)] backdrop-blur-xl sm:left-1/2 sm:right-auto sm:w-[min(34rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-[1.75rem] lg:w-[min(38rem,calc(100vw-24rem))]">
            <div className="flex items-center justify-between border-b border-[#e4e1da] px-3 py-2.5 sm:px-4">
              <p className="truncate font-mono text-[9px] font-semibold uppercase tracking-[.14em] text-red-600 sm:text-[10px] sm:tracking-[.16em]">Recherche universelle · Angel AI</p>
              <button type="button" aria-label="Fermer Angel AI" onClick={() => setAiOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#e4e1da] bg-[#f7f7f5] text-[#6f7377] hover:text-[#202124]"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[min(72dvh,42rem)] overflow-y-auto p-2 sm:p-3 [&_.bg-card]:bg-white [&_.bg-background]:bg-[#f8f9fa] [&_.text-foreground]:text-[#202124] [&_.text-muted-foreground]:text-[#6f7377]"><AngelCommandCenter compact /></div>
          </div>
        ) : !editing ? (
          <div className="fixed inset-x-2 bottom-[calc(.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center rounded-[1.35rem] border border-[#dedbd4] bg-white/96 shadow-[0_12px_40px_rgba(35,38,41,.14)] backdrop-blur-xl sm:left-1/2 sm:right-auto sm:h-16 sm:w-[min(34rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-full lg:w-[min(38rem,calc(100vw-24rem))]">
            <button type="button" onClick={() => setAiOpen(true)} className="flex h-full min-w-0 flex-1 items-center px-3 text-left text-[#666b70] sm:px-5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">Rechercher ou demander…</span>
              <span className="hidden rounded-lg border border-[#e4e1da] bg-[#f7f7f5] px-2 py-1 font-mono text-[10px] text-[#8a8d91] sm:inline">Ctrl K</span>
            </button>
            <button type="button" aria-label="Notifications" onClick={() => onSelect("notifications")} className="relative mr-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 sm:mr-2 sm:h-12 sm:w-12">
              <Bell className="h-5 w-5" />
              {notificationBadge > 0 ? <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{notificationBadge}</span> : null}
            </button>
            <button type="button" aria-label="Ouvrir les applications" onClick={() => setOpen(true)} className="mr-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e4e1da] bg-[#f7f7f5] text-[#5f6368] sm:mr-2 sm:h-12 sm:w-12 lg:hidden">
              <Grid2X2 className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminCard({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 max-w-full overflow-x-clip rounded-[1.35rem] border border-[#e1ded8] bg-white p-3 shadow-[0_12px_36px_rgba(35,38,41,.07)] sm:rounded-[1.75rem] sm:p-6 ${className}`}>
      {title ? <h2 className="break-words text-lg font-semibold tracking-[-0.03em] text-[#202124] sm:text-xl">{title}</h2> : null}
      {description ? <p className="mt-1 max-w-3xl break-words text-sm leading-relaxed text-[#6f7377]">{description}</p> : null}
      <div className={`min-w-0 max-w-full ${title || description ? "mt-4 sm:mt-5" : ""}`}>{children}</div>
    </section>
  );
}

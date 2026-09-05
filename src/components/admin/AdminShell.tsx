import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, MoreHorizontal, Sun, X, type LucideIcon } from "lucide-react";
import { useThemePreference } from "@/components/ThemeController";
import { resolveTheme, type ThemePreference } from "@/lib/theme";
import { AdminHomeDashboard } from "@/components/admin/AdminHomeDashboard";

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
  { key: "dashboard", label: "Accueil", description: "Aujourd’hui, priorités et activité", source: "dashboard", children: ["dashboard"] },
  { key: "planning", label: "Planning", description: "Agenda, projets, tâches et commandes", source: "agenda", children: ["agenda", "projets"] },
  { key: "messages", label: "Messages", description: "Demandes, boîte mail, contacts et avis", source: "messages", children: ["messages", "boite-mail", "signature", "abonnes", "avis"] },
  { key: "contenus", label: "Contenus", description: "Articles, pages, fichiers, studio", source: "articles", children: ["articles", "contenus", "fichiers", "studio", "boutique"] },
  { key: "pilotage", label: "Pilotage", description: "Statistiques, automatisations, connexions", source: "stats", children: ["stats", "activite", "automatisation", "notifications", "connexions"] },
  { key: "parametres", label: "Paramètres", description: "Réglages de l’espace", source: "parametres", children: ["parametres"] },
];

const FlammeLogo = ({ className = "" }: { className?: string }) => (
  <img src="/flamme-os/logo.svg" alt="Flamme OS" className={`w-auto object-contain object-left ${className}`} />
);

export function AdminShell({ items, active, onSelect, title, actions, children }: {
  items: AdminNavItem[];
  active: string;
  onSelect: (key: string) => void;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { preference, setPreference } = useThemePreference();
  const resolvedTheme = typeof window === "undefined" ? "light" : resolveTheme(preference);
  const isDark = resolvedTheme === "dark";
  const legacyDashboard = active === "angel-ai" || active === "candidatures" || active === "etudes-travail";
  const effectiveActive = legacyDashboard ? "dashboard" : active;

  const shellItems = items;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (legacyDashboard) onSelect("dashboard");
  }, [legacyDashboard, onSelect]);

  const compactItems = useMemo(() => COMPACT_NAV.map((definition) => {
    const source = shellItems.find((item) => item.key === definition.source);
    const badges = definition.children.map((key) => shellItems.find((item) => item.key === key)?.badge ?? 0);
    return source ? { ...definition, icon: source.icon, badge: badges.reduce((sum, value) => sum + value, 0) } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item)), [shellItems]);

  const activeGroup = compactItems.find((item) => item.children.includes(effectiveActive))?.key ?? "dashboard";
  const activeDefinition = COMPACT_NAV.find((definition) => definition.children.includes(effectiveActive));
  const sectionItems = useMemo(() => {
    if (!activeDefinition || activeDefinition.children.length <= 1) return [];
    return activeDefinition.children
      .map((key) => shellItems.find((item) => item.key === key))
      .filter((item): item is AdminNavItem => Boolean(item));
  }, [activeDefinition, shellItems]);

  const toggleTheme = () => setPreference((isDark ? "light" : "dark") as ThemePreference);
  const currentItem = shellItems.find((item) => item.key === effectiveActive);
  const CurrentIcon = currentItem?.icon;
  const groupLabel = activeDefinition?.label ?? "Accueil";

  const themeButton = (
    <button type="button" onClick={toggleTheme} aria-label={isDark ? "Mode clair" : "Mode sombre"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/70 bg-card text-foreground transition hover:bg-muted">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );

  const navList = (
    <nav className="space-y-1">
      {compactItems.map(({ key, label, description, source, icon: Icon, badge }) => {
        const isActive = activeGroup === key;
        return (
          <button type="button" key={key} onClick={() => { onSelect(source); setOpen(false); }}
            className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"}`}>
            <span aria-hidden className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${isActive ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground group-hover:text-primary"}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{label}</span>
              <span className={`mt-0.5 block truncate text-[10px] ${isActive ? "text-primary/70" : "text-muted-foreground"}`}>{description}</span>
            </span>
            {badge > 0 ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>{badge}</span> : null}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-[#F3EFE8] text-foreground dark:bg-background lg:flex">
      <aside className="sticky top-0 hidden h-[100dvh] w-[17.5rem] shrink-0 flex-col overflow-y-auto border-r border-border/70 bg-[#FFFDF9] px-4 py-6 dark:bg-card lg:flex">
        <div className="mb-8 px-1">
          <FlammeLogo className="h-8 max-w-[10.5rem]" />
          <p className="mt-2 text-[11px] font-medium text-muted-foreground">Espace de travail personnel</p>
        </div>
        {navList}
        <div className="mt-auto rounded-2xl border border-border/70 bg-muted/40 px-3 py-2.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Tous les services répondent</span>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <FlammeLogo className="h-6 max-w-[7.5rem]" />
              <div className="flex gap-2">{themeButton}<button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background"><X className="h-4 w-4" /></button></div>
            </div>
            {navList}
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-[#F3EFE8]/90 px-3 py-3 backdrop-blur-xl dark:bg-background/90 sm:px-7 lg:px-9">
          <div className="mx-auto flex max-w-[1520px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <FlammeLogo className="h-3.5 max-w-[4.5rem] lg:hidden" />
                <span className="hidden lg:inline">Flamme OS</span>
                <span aria-hidden>·</span>
                <span className="truncate">{groupLabel}</span>
              </p>
              <div className="mt-1 flex items-center gap-2.5">
                {CurrentIcon ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CurrentIcon className="h-4 w-4" /></span> : null}
                <h1 className="truncate font-display text-xl font-bold tracking-[-.035em] sm:text-2xl">{effectiveActive === "dashboard" ? "Aujourd’hui" : effectiveActive === "agenda" ? "Agenda" : title}</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">{themeButton}{actions}</div>
            <div className="flex items-center gap-2 sm:hidden">{themeButton}</div>
          </div>
          {actions ? <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">{actions}</div> : null}
        </header>

        {sectionItems.length > 0 ? (
          <nav className="sticky top-[4.6rem] z-20 border-b border-border/70 bg-[#F3EFE8]/90 px-3 py-2 backdrop-blur-xl dark:bg-background/90 sm:px-7 lg:px-9">
            <div className="mx-auto flex max-w-[1520px] gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === effectiveActive;
                return <button key={item.key} onClick={() => onSelect(item.key)} className={`flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition ${isActive ? "bg-foreground text-background" : "border border-border/70 bg-card text-muted-foreground hover:text-foreground"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>;
              })}
            </div>
          </nav>
        ) : null}

        <main className="mx-auto w-full max-w-[1520px] px-3 pb-28 pt-4 sm:px-7 sm:pt-6 lg:px-9 lg:pb-24">
          <div key={effectiveActive} className="animate-in fade-in duration-200">
            {effectiveActive === "dashboard" ? <AdminHomeDashboard onNavigate={onSelect} /> : children}
          </div>
        </main>

        <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-[#FFFDF9]/95 px-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:bg-card/95 lg:hidden">
          <div className="flex items-stretch">
            {compactItems.slice(0, 4).map(({ key, label, source, icon: Icon, badge }) => {
              const isActive = activeGroup === key;
              return (
                <button type="button" key={key} onClick={() => onSelect(source)}
                  className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                  {label}
                  {badge > 0 ? <span className="absolute right-[22%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{badge}</span> : null}
                </button>
              );
            })}
            <button type="button" onClick={() => setOpen(true)} aria-label="Plus d’espaces"
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${["pilotage", "parametres"].includes(activeGroup) ? "text-primary" : "text-muted-foreground"}`}>
              <MoreHorizontal className="h-5 w-5" />
              Plus
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export function AdminCard({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border/70 bg-[#FFFDF9] p-4 shadow-[0_1px_2px_rgba(24,23,22,.04)] dark:bg-card sm:p-6 ${className}`}>
      {title ? <h2 className="break-words font-display text-lg font-bold tracking-[-.03em] text-foreground sm:text-xl">{title}</h2> : null}
      {description ? <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

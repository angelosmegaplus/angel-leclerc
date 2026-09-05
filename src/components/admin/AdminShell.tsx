import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Grid2X2, Moon, Sun, X, type LucideIcon } from "lucide-react";
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
  { key: "agenda", label: "Agenda", description: "Planning et rendez-vous", source: "agenda", children: ["agenda"] },
  { key: "projets", label: "Projets", description: "Suivi des missions et tâches", source: "projets", children: ["projets"] },
  { key: "messages", label: "Messages", description: "Demandes, contacts et abonnés", source: "messages", children: ["messages", "abonnes", "avis"] },
  { key: "boite-mail", label: "Mail", description: "Boîte mail et signature", source: "boite-mail", children: ["boite-mail", "signature"] },
  { key: "fichiers", label: "Fichiers", description: "Documents et médias", source: "fichiers", children: ["fichiers"] },
  { key: "contenus", label: "Contenus", description: "Articles, pages du site et boutique", source: "articles", children: ["articles", "contenus", "boutique"] },
  { key: "studio", label: "Studio", description: "Productions audio et vidéo", source: "studio", children: ["studio"] },
  { key: "automatisation", label: "Automatisations", description: "Tâches automatiques et notifications", source: "automatisation", children: ["automatisation", "notifications"] },
  { key: "connexions", label: "Connexions", description: "Comptes et services reliés", source: "connexions", children: ["connexions"] },
  { key: "stats", label: "Statistiques", description: "Audience et activité du site", source: "stats", children: ["stats", "activite"] },
  { key: "parametres", label: "Paramètres", description: "Réglages de l’espace", source: "parametres", children: ["parametres"] },
];

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

  const themeButton = (
    <button type="button" onClick={toggleTheme} aria-label={isDark ? "Mode clair" : "Mode sombre"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );

  const menuContents = (
    <>
      <div className="mb-7 px-1">
        <img src="/flamme-os/logo.svg" alt="Flamme OS" className="h-9 w-auto max-w-[10.5rem] object-contain object-left" />
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">Espace administrateur personnel</p>
      </div>

      <nav className="space-y-1.5">
        {compactItems.map(({ key, label, description, source, icon: Icon, badge }) => {
          const isActive = activeGroup === key;
          return (
            <button type="button" key={key} onClick={() => { onSelect(source); setOpen(false); }}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isActive ? "bg-primary-foreground/15" : "bg-muted text-muted-foreground group-hover:text-primary"}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{label}</span>
                <span className={`mt-0.5 block truncate text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{description}</span>
              </span>
              {badge > 0 ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>{badge}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-7 border-t border-border pt-5 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Flamme OS opérationnel</div>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-[#F3EFE8] text-foreground dark:bg-background lg:flex">
      <aside className="sticky top-0 hidden h-[100dvh] w-[17.5rem] shrink-0 overflow-y-auto border-r border-border bg-[#FFFDF9] px-4 py-6 dark:bg-card lg:block">{menuContents}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm lg:hidden">
          <div className="ml-auto flex h-full w-[min(92vw,24rem)] flex-col border-l border-border bg-card p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-sm font-bold">Navigation</span>
              <div className="flex gap-2">{themeButton}<button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background"><X className="h-4 w-4" /></button></div>
            </div>
            <div className="overflow-y-auto">{menuContents}</div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-[#F3EFE8]/95 px-3 py-3 backdrop-blur-xl dark:bg-background/90 sm:px-7 lg:px-9">
          <div className="mx-auto flex max-w-[1520px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><img src="/flamme-os/logo.svg" alt="" aria-hidden className="h-4 w-auto max-w-[5.5rem] object-contain" /></div>
              <div className="mt-1 flex items-center gap-2.5">
                {CurrentIcon ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CurrentIcon className="h-4 w-4" /></span> : null}
                <h1 className="truncate font-display text-xl font-bold tracking-[-.035em] sm:text-2xl">{effectiveActive === "dashboard" ? "Aujourd’hui" : effectiveActive === "agenda" ? "Agenda" : title}</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">{themeButton}{actions}</div>
            <div className="flex items-center gap-2 sm:hidden">{themeButton}<button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card"><Grid2X2 className="h-4 w-4" /></button></div>
          </div>
          {actions ? <div className="mt-2 flex gap-2 overflow-x-auto sm:hidden">{actions}</div> : null}
        </header>

        {sectionItems.length > 0 ? (
          <nav className="sticky top-[4.2rem] z-20 border-b border-border bg-[#F3EFE8]/95 px-3 py-2 backdrop-blur-xl dark:bg-background/90 sm:px-7 lg:px-9">
            <div className="mx-auto flex max-w-[1520px] gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === effectiveActive;
                return <button key={item.key} onClick={() => onSelect(item.key)} className={`flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-semibold transition ${isActive ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>;
              })}
            </div>
          </nav>
        ) : null}

        <main className="mx-auto w-full max-w-[1520px] px-3 pb-24 pt-4 sm:px-7 sm:pt-6 lg:px-9">
          <div key={effectiveActive} className="animate-in fade-in duration-200">
            {effectiveActive === "dashboard" ? <AdminHomeDashboard onNavigate={onSelect} /> : children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AdminCard({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-[#FFFDF9] p-4 shadow-sm dark:bg-card sm:p-6 ${className}`}>
      {title ? <h2 className="break-words font-display text-lg font-bold tracking-[-.03em] text-foreground sm:text-xl">{title}</h2> : null}
      {description ? <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

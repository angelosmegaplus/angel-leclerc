import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, Grid2X2, Moon, Sun, X, type LucideIcon } from "lucide-react";
import { PixelWidgets } from "@/components/admin/PixelWidgets";
import { AngelCommandCenter } from "@/components/admin/AngelCommandCenter";
import { useThemePreference } from "@/components/ThemeController";
import { resolveTheme, type ThemePreference } from "@/lib/theme";

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
  { key: "travail", label: "Travail", description: "Études, emploi, projets, agenda et statistiques", source: "etudes-travail", children: ["etudes-travail", "projets", "agenda", "messages", "boite-mail", "stats"] },
  { key: "studio", label: "Studio", description: "Articles, médias, fichiers et services", source: "articles", children: ["articles", "studio", "contenus", "fichiers", "boutique"] },
  { key: "pilotage", label: "Pilotage IA", description: "ChatGPT, automatisations et activité", source: "angel-ai", children: ["angel-ai", "automatisation", "activite"] },
  { key: "systeme", label: "Système", description: "Connexions, alertes et communauté", source: "connexions", children: ["connexions", "notifications", "abonnes", "avis", "parametres"] },
];

function adminDisplayLabel(key: string, label: string) {
  return key === "candidatures" || key === "etudes-travail" ? "Études & Travail" : label;
}

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
  const { preference, setPreference } = useThemePreference();
  const resolvedTheme = typeof window === "undefined" ? "light" : resolveTheme(preference);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const isEditable = (node: EventTarget | null) => {
      const el = node instanceof HTMLElement ? node : null;
      return Boolean(el?.closest('input, textarea, select, [contenteditable="true"], form'));
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

  const toggleTheme = () => setPreference((isDark ? "light" : "dark") as ThemePreference);

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-background/75 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );

  const appGrid = (
    <div className="grid gap-2.5">
      {compactItems.map(({ key, label, description, source, icon: Icon, badge }) => {
        const isActive = activeGroup === key;
        return (
          <button
            type="button"
            key={key}
            onClick={() => selectCompact(source)}
            className={`group relative min-h-[4.6rem] overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 active:scale-[0.985] ${isActive ? "border-primary/45 bg-primary/10 text-foreground shadow-sm" : "border-border bg-background/40 text-foreground hover:border-primary/35 hover:bg-muted/65"}`}
          >
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition ${isActive ? "border-primary/35 bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground group-hover:text-primary"}`}>
                <Icon className="h-5 w-5 stroke-[1.8]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[13px] font-bold">{label}</span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{description}</span>
              </span>
              {badge > 0 ? <span className="grid min-h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{badge}</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );

  const menuContents = (
    <>
      <div className="mb-6 px-1">
        <div className="flex items-center gap-3">
          <img src="/angel-os/logo.png" alt="Logo Angel OS" className="dark-logo-surface h-9 w-9 rounded-md object-cover" />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold tracking-tight text-foreground">Angel Leclerc</p>
            <p className="text-[11px] font-medium text-primary">Administration</p>
          </div>
        </div>
        <p className="mt-4 font-display text-2xl font-bold tracking-[-0.04em] text-foreground">Centre de contrôle</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">La même identité que le site public, avec tes outils de gestion.</p>
      </div>
      {appGrid}
      <div className="mt-6 flex items-center gap-2 border-t border-border px-1 pt-5 text-[10px] font-medium text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Système opérationnel
      </div>
    </>
  );

  const currentItem = items.find((item) => item.key === active);
  const CurrentIcon = currentItem?.icon;
  const isDashboard = active === "dashboard";
  const displayTitle = adminDisplayLabel(active, title);

  return (
    <div className="relative isolate min-h-[100dvh] w-full overflow-x-hidden bg-background font-body text-foreground transition-colors lg:flex">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_10%_5%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_32%)]" />

      <aside className="sticky top-0 z-10 hidden h-[100dvh] w-[18.5rem] shrink-0 overflow-y-auto border-r border-border bg-card/80 px-4 py-6 backdrop-blur-xl lg:block">{menuContents}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 h-[100dvh] bg-black/30 backdrop-blur-sm lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-md flex-col border-l border-border bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl sm:rounded-l-3xl sm:px-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-foreground">Menu</span>
              <div className="flex items-center gap-2">
                {themeButton}
                <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">{menuContents}</div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/82 px-3 pb-3 pt-[calc(.65rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-7 sm:py-4 lg:px-10">
          <div className="mx-auto flex min-w-0 max-w-[1500px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <span>Administration</span>
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                <span className="truncate text-muted-foreground">Angel Leclerc Communication</span>
              </div>
              <div className="mt-1.5 flex min-w-0 items-center gap-2.5">
                {CurrentIcon ? <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary sm:grid"><CurrentIcon className="h-4.5 w-4.5" /></span> : null}
                <h1 className="min-w-0 truncate font-display text-[1.45rem] font-bold leading-none tracking-[-0.04em] text-foreground sm:text-[2rem]">{displayTitle}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 sm:flex [&_button]:border-border [&_a]:border-border [&_button]:text-foreground [&_a]:text-foreground [&_[aria-label='Recherche_globale']]:hidden">
                {themeButton}
                {actions}
              </div>
              <div className="sm:hidden">{themeButton}</div>
              <button type="button" aria-label="Ouvrir les applications" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm lg:hidden">
                <Grid2X2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
          {actions ? <div className="mx-auto mt-2 flex max-w-[1500px] gap-2 overflow-x-auto pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&_button]:min-h-10 [&_button]:border-border [&_button]:bg-card [&_button]:text-foreground">{actions}</div> : null}
        </header>

        {sectionItems.length > 0 ? (
          <nav aria-label={`Sections ${activeDefinition?.label ?? ""}`} className="sticky top-[calc(4.8rem+env(safe-area-inset-top))] z-20 border-b border-border bg-background/88 px-3 py-2.5 backdrop-blur-xl sm:top-[calc(5.35rem+env(safe-area-inset-top))] sm:px-7 lg:px-10">
            <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === active;
                const displayLabel = adminDisplayLabel(item.key, item.label);
                return (
                  <button key={item.key} type="button" onClick={() => onSelect(item.key)} aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors ${isActive ? "border-primary/40 bg-primary text-primary-foreground" : "border-border bg-card/70 text-muted-foreground hover:border-primary/35 hover:text-foreground"}`}>
                    <Icon className="h-4 w-4" />
                    <span>{displayLabel}</span>
                    {(item.badge ?? 0) > 0 ? <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"}`}>{item.badge}</span> : null}
                  </button>
                );
              })}
            </div>
          </nav>
        ) : null}

        <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:pb-24 sm:pt-6 lg:px-10">
          {isDashboard ? <div className="mb-6 space-y-4 sm:space-y-5" data-admin-dashboard-glance><PixelWidgets /></div> : null}
          <div key={active} className="min-w-0 max-w-full animate-in fade-in duration-300 [&_.bg-card]:bg-card [&_.bg-background]:bg-background [&_.bg-muted]:bg-muted [&_.border-border]:border-border [&_.text-foreground]:text-foreground [&_.text-muted-foreground]:text-muted-foreground [&_input]:border-border [&_textarea]:border-border [&_select]:border-border [&_input]:bg-background [&_textarea]:bg-background [&_select]:bg-background [&_input]:text-foreground [&_textarea]:text-foreground [&_select]:text-foreground [&_img]:max-w-full [&_input]:max-w-full [&_textarea]:max-w-full [&_select]:max-w-full max-sm:[&_form]:!mt-2 max-sm:[&_form]:!space-y-4 max-sm:[&_form]:!rounded-xl max-sm:[&_form]:!p-3 max-sm:[&_input]:min-h-11 max-sm:[&_select]:min-h-11 max-sm:[&_input]:text-base max-sm:[&_textarea]:text-base max-sm:[&_select]:text-base max-sm:[&_table]:text-xs max-sm:[&_label]:leading-snug">
            {children}
          </div>
        </main>

        {aiOpen ? (
          <div className="fixed inset-x-2 bottom-[calc(.5rem+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl sm:left-1/2 sm:right-auto sm:w-[min(34rem,calc(100vw-2rem))] sm:-translate-x-1/2 lg:w-[min(38rem,calc(100vw-24rem))]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="truncate font-display text-xs font-bold text-foreground">Angel AI</p>
              <button type="button" aria-label="Fermer Angel AI" onClick={() => setAiOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[min(72dvh,42rem)] overflow-y-auto p-2 sm:p-3"><AngelCommandCenter compact /></div>
          </div>
        ) : !editing ? (
          <div className="fixed bottom-[calc(.5rem+env(safe-area-inset-bottom))] right-2 z-30 flex h-14 w-auto items-center rounded-full border border-border bg-card/92 shadow-xl backdrop-blur-xl sm:left-1/2 sm:right-auto sm:h-14 sm:w-[min(34rem,calc(100vw-2rem))] sm:-translate-x-1/2 lg:w-[min(38rem,calc(100vw-24rem))]">
            <button type="button" onClick={() => setAiOpen(true)} className="flex h-full min-w-12 items-center justify-center px-3 text-left text-muted-foreground sm:min-w-0 sm:flex-1 sm:justify-start sm:px-5">
              <span className="text-xs font-semibold sm:hidden">AI</span>
              <span className="hidden min-w-0 flex-1 truncate text-sm font-medium sm:block">Rechercher ou demander…</span>
              <span className="hidden rounded-lg border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground sm:inline">Ctrl K</span>
            </button>
            <button type="button" aria-label="Notifications" onClick={() => onSelect("notifications")} className="relative mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary sm:mr-2">
              <Bell className="h-4.5 w-4.5" />
              {notificationBadge > 0 ? <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{notificationBadge}</span> : null}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminCard({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 max-w-full overflow-x-clip rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:rounded-2xl sm:p-6 ${className}`}>
      {title ? <h2 className="break-words font-display text-lg font-bold tracking-[-0.03em] text-foreground sm:text-xl">{title}</h2> : null}
      {description ? <p className="mt-1 max-w-3xl break-words text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      <div className={`min-w-0 max-w-full ${title || description ? "mt-4 sm:mt-5" : ""}`}>{children}</div>
    </section>
  );
}

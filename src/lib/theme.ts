export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "alc-theme";

/** Script inline : applique le thème avant le premier rendu (pas de flash). */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.dataset.angelOsUi=d?'dark':'light';}catch(e){}})();`;

const ADMIN_DARK_STYLE_ID = "angel-os-admin-dark-overrides";
const ADMIN_THEME_GUARD_KEY = "__angelOsThemeGuard";
const ADMIN_DARK_CSS = `
html[data-angel-os-ui="dark"] body { background:#111315; color:#f5f7f8; }
html[data-angel-os-ui="dark"] .bg-white { background-color:#181b1f !important; }
html[data-angel-os-ui="dark"] .bg-\[\#fbfbfa\]\/95,
html[data-angel-os-ui="dark"] .bg-\[\#fbfbfa\]\/98,
html[data-angel-os-ui="dark"] .bg-\[\#fbfbfa\]\/94,
html[data-angel-os-ui="dark"] .bg-\[\#fbfbfa\]\/92,
html[data-angel-os-ui="dark"] .bg-white\/98,
html[data-angel-os-ui="dark"] .bg-white\/96 { background-color:rgba(24,27,31,.96) !important; }
html[data-angel-os-ui="dark"] .bg-\[\#f5f6f7\],
html[data-angel-os-ui="dark"] .bg-\[\#f8f9fa\],
html[data-angel-os-ui="dark"] .bg-\[\#f7f7f5\],
html[data-angel-os-ui="dark"] .bg-\[\#f1f3f4\] { background-color:#111315 !important; }
html[data-angel-os-ui="dark"] .text-\[\#202124\],
html[data-angel-os-ui="dark"] .text-\[\#201b1b\],
html[data-angel-os-ui="dark"] .text-\[\#3c4043\] { color:#f5f7f8 !important; }
html[data-angel-os-ui="dark"] .text-\[\#5f6368\],
html[data-angel-os-ui="dark"] .text-\[\#666b70\],
html[data-angel-os-ui="dark"] .text-\[\#6f7377\],
html[data-angel-os-ui="dark"] .text-\[\#777b80\],
html[data-angel-os-ui="dark"] .text-\[\#7a7d80\],
html[data-angel-os-ui="dark"] .text-\[\#8a8d91\] { color:#aeb4ba !important; }
html[data-angel-os-ui="dark"] .border-\[\#e4e1da\],
html[data-angel-os-ui="dark"] .border-\[\#dedbd4\],
html[data-angel-os-ui="dark"] .border-\[\#e1ded8\],
html[data-angel-os-ui="dark"] .border-\[\#d9d7d1\] { border-color:#343940 !important; }
html[data-angel-os-ui="dark"] input,
html[data-angel-os-ui="dark"] textarea,
html[data-angel-os-ui="dark"] select { background-color:#181b1f !important; color:#f5f7f8 !important; border-color:#343940 !important; }
html[data-angel-os-ui="dark"] [class*="linear-gradient(180deg,#fafafa_0%,#f4f5f6_72%)"] { background:#111315 !important; }
html[data-angel-os-ui="dark"] .shadow-sm { --tw-shadow-color:rgba(0,0,0,.35); }
`;

function ensureAdminThemeOverrides() {
  if (typeof document === "undefined") return;
  let style = document.getElementById(ADMIN_DARK_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = ADMIN_DARK_STYLE_ID;
    style.textContent = ADMIN_DARK_CSS;
    document.head.appendChild(style);
  }
}

export function readPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "system";
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ensureThemeGuard() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const state = window as Window & { [ADMIN_THEME_GUARD_KEY]?: MutationObserver };
  if (state[ADMIN_THEME_GUARD_KEY]) return;

  const root = document.documentElement;
  const observer = new MutationObserver(() => {
    const expected = resolveTheme(readPreference());
    const isDark = root.classList.contains("dark");
    const ui = root.dataset.angelOsUi;
    if ((expected === "dark" && (!isDark || ui !== "dark")) || (expected === "light" && (isDark || ui !== "light"))) {
      queueMicrotask(() => applyTheme(readPreference()));
    }
  });
  observer.observe(root, { attributes: true, attributeFilter: ["class", "data-angel-os-ui"] });
  state[ADMIN_THEME_GUARD_KEY] = observer;
}

export function applyTheme(pref: ThemePreference) {
  const dark = resolveTheme(pref) === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.dataset.angelOsUi = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";
  ensureAdminThemeOverrides();
  ensureThemeGuard();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#111315" : "#F6F1E8");
}

export function setPreference(pref: ThemePreference) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* stockage indisponible : le thème reste appliqué pour la session */
  }
  applyTheme(pref);
  window.dispatchEvent(new CustomEvent("alc-theme-change", { detail: pref }));
}

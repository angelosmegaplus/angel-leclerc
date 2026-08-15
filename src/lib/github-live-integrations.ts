type LiveIntegrationType = "html" | "css" | "json";

type LiveIntegration = {
  id: string;
  enabled?: boolean;
  type: LiveIntegrationType;
  file: string;
  target?: string;
};

type LiveIntegrationManifest = {
  version: number;
  revision?: string;
  refreshMs?: number;
  integrations?: LiveIntegration[];
};

const RAW_BASE =
  "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/integrations";
const MANIFEST_URL = `${RAW_BASE}/manifest.json`;
const DEFAULT_REFRESH_MS = 30_000;
const MIN_REFRESH_MS = 10_000;

let timer: ReturnType<typeof setInterval> | null = null;
let lastRevision = "";
let started = false;

function cacheBust(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}angel_os_live=${Date.now()}`;
}

async function fetchText(path: string) {
  const response = await fetch(cacheBust(`${RAW_BASE}/${path.replace(/^\//, "")}`), {
    cache: "no-store",
    headers: { Accept: "text/plain, text/html, text/css, application/json" },
  });
  if (!response.ok) throw new Error(`GitHub live integration ${path}: HTTP ${response.status}`);
  return response.text();
}

function getMountTarget(target?: string): Element {
  if (!target || target === "body-end" || target === "body-start") return document.body;
  if (target === "head") return document.head;
  return document.querySelector(target) ?? document.body;
}

function removeIntegrationNode(id: string) {
  document.querySelectorAll(`[data-angel-live-integration="${CSS.escape(id)}"]`).forEach((node) => node.remove());
}

async function applyIntegration(integration: LiveIntegration) {
  removeIntegrationNode(integration.id);
  if (integration.enabled === false) return;

  const content = await fetchText(integration.file);

  if (integration.type === "css") {
    const style = document.createElement("style");
    style.dataset.angelLiveIntegration = integration.id;
    style.textContent = content;
    document.head.appendChild(style);
    return;
  }

  if (integration.type === "html") {
    const container = document.createElement("div");
    container.dataset.angelLiveIntegration = integration.id;
    container.innerHTML = content;
    const target = getMountTarget(integration.target);
    if (integration.target === "body-start" && target === document.body) {
      document.body.prepend(container);
    } else {
      target.appendChild(container);
    }
    return;
  }

  if (integration.type === "json") {
    const payload = JSON.parse(content) as unknown;
    window.dispatchEvent(
      new CustomEvent("angel-os:integration-data", {
        detail: { id: integration.id, payload },
      }),
    );
  }
}

async function readManifest(): Promise<LiveIntegrationManifest> {
  const response = await fetch(cacheBust(MANIFEST_URL), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`GitHub live manifest: HTTP ${response.status}`);
  return response.json() as Promise<LiveIntegrationManifest>;
}

export async function reloadGitHubLiveIntegrations() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const manifest = await readManifest();
  const revision = manifest.revision || String(manifest.version || 1);
  const integrations = (manifest.integrations || []).filter((item) => item?.id && item?.file && item?.type);

  const activeIds = new Set(integrations.filter((item) => item.enabled !== false).map((item) => item.id));
  document.querySelectorAll<HTMLElement>("[data-angel-live-integration]").forEach((node) => {
    const id = node.dataset.angelLiveIntegration;
    if (id && !activeIds.has(id)) node.remove();
  });

  await Promise.allSettled(integrations.map((integration) => applyIntegration(integration)));
  lastRevision = revision;

  window.dispatchEvent(
    new CustomEvent("angel-os:integrations-updated", {
      detail: {
        revision,
        count: activeIds.size,
        source: "github-runtime",
      },
    }),
  );

  return manifest;
}

export async function bootGitHubLiveIntegrations() {
  if (typeof window === "undefined" || started) return;
  started = true;

  try {
    const manifest = await reloadGitHubLiveIntegrations();
    const refreshMs = Math.max(MIN_REFRESH_MS, manifest?.refreshMs || DEFAULT_REFRESH_MS);
    timer = setInterval(() => {
      void reloadGitHubLiveIntegrations().catch((error) => {
        console.warn("Angel OS GitHub live sync unavailable", error);
      });
    }, refreshMs);
  } catch (error) {
    console.warn("Angel OS GitHub live integrations unavailable", error);
    timer = setInterval(() => {
      void reloadGitHubLiveIntegrations().catch(() => undefined);
    }, DEFAULT_REFRESH_MS);
  }
}

export function stopGitHubLiveIntegrations() {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}

export function getGitHubLiveIntegrationsStatus() {
  return {
    started,
    revision: lastRevision || null,
    source: MANIFEST_URL,
    refreshFallbackMs: DEFAULT_REFRESH_MS,
  };
}

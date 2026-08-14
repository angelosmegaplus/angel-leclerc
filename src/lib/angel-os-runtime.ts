import { AngelOSEventBus } from "../../angel-os/core/event-bus";
import { createConfig } from "../../angel-os/core/config";
import { AngelOSModuleRegistry } from "../../angel-os/core/module-registry";
import type { AngelOSContext } from "../../angel-os/core/types";
import { angelOSIA } from "../../angel-os/distributions/angel-os-ia";
import { angelLeclercWebAdapter } from "../../angel-os/adapters/angel-leclerc-web";

const events = new AngelOSEventBus();
const modules = new AngelOSModuleRegistry();
const context: AngelOSContext = {
  version: "0.1.0",
  platform: "web",
  capabilities: new Set([
    "events",
    "configuration",
    "network",
    "ai",
    "automation",
  ]),
  config: createConfig({
    product: "angel-leclerc.fr",
    integration: "distribution-consumer",
    distribution: angelOSIA.id,
    distributionVersion: angelOSIA.version,
  }),
};

let started = false;
let webConnection: Awaited<ReturnType<typeof angelLeclercWebAdapter.connect>> | null = null;

for (const module of angelOSIA.modules) modules.register(module);

export async function bootAngelOS() {
  if (started) return;
  started = true;

  webConnection = await angelLeclercWebAdapter.connect();
  await modules.startAll(context);
  await events.emit("angel-os:boot", {
    core: "Angel OS Core",
    coreVersion: context.version,
    distribution: angelOSIA.name,
    distributionVersion: angelOSIA.version,
    application: webConnection.product,
    platform: context.platform,
    capabilities: [...context.capabilities],
  });

  if (typeof document !== "undefined") {
    document.documentElement.dataset.angelOsCore = context.version;
    document.documentElement.dataset.angelOsDistribution = angelOSIA.id;
    document.documentElement.dataset.angelOsApplication = webConnection.product;
    window.dispatchEvent(
      new CustomEvent("angel-os:ready", {
        detail: getAngelOSStatus(),
      }),
    );
  }
}

export function getAngelOSStatus() {
  return {
    started,
    architecture: ["Angel OS Core", angelOSIA.name, "angel-leclerc.fr"],
    core: {
      version: context.version,
      platform: context.platform,
    },
    distribution: {
      id: angelOSIA.id,
      name: angelOSIA.name,
      version: angelOSIA.version,
      modules: angelOSIA.modules.map((module) => ({
        id: module.id,
        version: module.version,
        provides: [...(module.provides ?? [])],
      })),
    },
    application: webConnection ?? {
      product: "angel-leclerc.fr" as const,
      platform: "web" as const,
      publicBaseUrl: "https://www.angel-leclerc.fr" as const,
      adminPath: "/admin" as const,
    },
    capabilities: [...context.capabilities],
  };
}

export const angelOS = {
  events,
  modules,
  context,
  distribution: angelOSIA,
  adapter: angelLeclercWebAdapter,
  getStatus: getAngelOSStatus,
} as const;

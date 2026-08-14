import { AngelOSEventBus } from "../../angel-os/core/event-bus";
import { createConfig } from "../../angel-os/core/config";
import { AngelOSModuleRegistry } from "../../angel-os/core/module-registry";
import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import type { AngelOSContext } from "../../angel-os/core/types";
import { webRuntimeAdapter } from "../../angel-os/adapters/web";
import { angelSiteAdapter } from "../../angel-os/adapters/site";
import { browserStorageAdapter } from "../../angel-os/adapters/browser-storage";

const events = new AngelOSEventBus();
const modules = new AngelOSModuleRegistry();
const adapters = new AngelOSAdapterRegistry();

adapters.register(webRuntimeAdapter);
adapters.register(angelSiteAdapter);
adapters.register(browserStorageAdapter);

const context: AngelOSContext = {
  version: "0.1.0",
  platform: "web",
  capabilities: new Set(["events", "configuration", "network", "storage"]),
  config: createConfig({
    product: "angel-leclerc.fr",
    integration: "active",
    adapterMode: "angel-os",
  }),
};

let started = false;

export async function bootAngelOS() {
  if (started) return;
  started = true;

  await adapters.connect("angel.web.runtime");
  await adapters.connect("angel.site.http");
  await adapters.connect("angel.storage.local");
  await modules.startAll(context);

  await events.emit("angel-os:boot", {
    version: context.version,
    platform: context.platform,
    adapters: adapters.list().map((adapter) => adapter.id),
  });
}

export async function shutdownAngelOS() {
  if (!started) return;
  await modules.stopAll(context);
  await adapters.disconnectAll();
  started = false;
  await events.emit("angel-os:shutdown", { version: context.version });
}

export const angelOS = { events, modules, adapters, context } as const;

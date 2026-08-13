import { AngelOSEventBus } from "../../angel-os/core/event-bus";
import { createConfig } from "../../angel-os/core/config";
import { AngelOSModuleRegistry } from "../../angel-os/core/module-registry";
import type { AngelOSContext } from "../../angel-os/core/types";

const events = new AngelOSEventBus();
const modules = new AngelOSModuleRegistry();
const context: AngelOSContext = {
  version: "0.1.0",
  platform: "web",
  capabilities: new Set(["events", "configuration", "network"]),
  config: createConfig({ product: "angel-leclerc.fr", integration: "passive" }),
};

let started = false;

export async function bootAngelOS() {
  if (started) return;
  started = true;
  await modules.startAll(context);
  await events.emit("angel-os:boot", { version: context.version, platform: context.platform });
}

export const angelOS = { events, modules, context } as const;

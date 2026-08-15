// SPDX-License-Identifier: GPL-2.0-only

export type CapabilityState = "active" | "available" | "deferred" | "unavailable";

export type AngelCapability = {
  id: "react" | "typescript" | "tailwind" | "vite" | "framer-motion" | "express" | "mysql" | "redis" | "python" | "rust" | "ztp";
  label: string;
  state: CapabilityState;
  role: string;
  fallback?: string;
  manualSetupRequired: boolean;
};

/**
 * Source of truth for the target Angel OS stack.
 * A capability must never be reported as active unless it is really wired into
 * the running application. Optional services stay deferred until Angel OS can
 * provision them automatically with infrastructure that is already available.
 */
export const ANGEL_OS_CAPABILITIES: AngelCapability[] = [
  { id: "react", label: "React", state: "active", role: "Interface web", manualSetupRequired: false },
  { id: "typescript", label: "TypeScript", state: "active", role: "Application and core typing", manualSetupRequired: false },
  { id: "tailwind", label: "Tailwind CSS", state: "active", role: "Design system and responsive UI", manualSetupRequired: false },
  { id: "vite", label: "Vite", state: "active", role: "Build and development pipeline", manualSetupRequired: false },
  { id: "framer-motion", label: "Framer Motion", state: "active", role: "UI motion and transitions", manualSetupRequired: false },
  { id: "express", label: "Express", state: "deferred", role: "Standalone Angel OS API when a managed server is available", fallback: "TanStack Start server routes", manualSetupRequired: true },
  { id: "mysql", label: "MySQL", state: "deferred", role: "Portable relational storage", fallback: "Current production data layer", manualSetupRequired: true },
  { id: "redis", label: "Redis", state: "deferred", role: "Cache, queue and ephemeral state", fallback: "In-process/server cache and existing queues", manualSetupRequired: true },
  { id: "python", label: "Python", state: "available", role: "Automation, data processing and AI workers when locally executable", fallback: "TypeScript workers", manualSetupRequired: false },
  { id: "rust", label: "Rust", state: "deferred", role: "Performance-critical or system-level tooling only", fallback: "TypeScript/Node utilities", manualSetupRequired: true },
  { id: "ztp", label: "Zero-touch provisioning", state: "deferred", role: "Automatic server bootstrap", fallback: "Existing managed deployment pipeline", manualSetupRequired: true },
];

export function getActiveCapabilities() {
  return ANGEL_OS_CAPABILITIES.filter((capability) => capability.state === "active" || capability.state === "available");
}

export function getDeferredCapabilities() {
  return ANGEL_OS_CAPABILITIES.filter((capability) => capability.state === "deferred" || capability.state === "unavailable");
}

export function canEnableWithoutUserAction(id: AngelCapability["id"]) {
  const capability = ANGEL_OS_CAPABILITIES.find((item) => item.id === id);
  return Boolean(capability && !capability.manualSetupRequired && capability.state !== "unavailable");
}

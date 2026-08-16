// SPDX-License-Identifier: GPL-2.0-only

import { AngelAgentRuntime, type AngelAgent } from './agent-runtime';
import { AngelControlPlane, type HealthProbe } from './control-plane';
import { AngelMemoryIndex, type MemoryDocument } from './memory-index';
import { AngelMissionEngine, type MissionPlanner, type MissionPriority, type MissionStep } from './mission-engine';

export type AngelCoreOptions = {
  planner?: MissionPlanner;
};

/**
 * AngelAutonomousCore is the single coordination point for goal-driven work.
 * It intentionally keeps execution, health and memory separate internally,
 * while exposing one API to the rest of Angel OS.
 */
export class AngelAutonomousCore {
  readonly agents = new AngelAgentRuntime();
  readonly health = new AngelControlPlane();
  readonly memory = new AngelMemoryIndex();
  readonly missions: AngelMissionEngine;

  constructor(options: AngelCoreOptions = {}) {
    this.missions = new AngelMissionEngine(options.planner);
  }

  registerAgent(agent: AngelAgent) {
    this.agents.register(agent);
    return this;
  }

  registerHealthProbe(probe: HealthProbe) {
    this.health.register(probe);
    return this;
  }

  remember(document: MemoryDocument) {
    this.memory.upsert(document);
    return this;
  }

  async pursue(input: {
    goal: string;
    priority?: MissionPriority;
    metadata?: Record<string, unknown>;
    steps?: MissionStep[];
    autoRun?: boolean;
  }) {
    const mission = await this.missions.create(input);
    if (input.autoRun === false) return mission;
    return this.missions.run(mission.id);
  }

  async inspect(options: { autoRecover?: boolean } = { autoRecover: true }) {
    return this.health.inspect(options);
  }

  status() {
    return {
      health: this.health.snapshot(),
      missions: this.missions.list(),
      memory: this.memory.stats(),
      agentRoles: this.agents.roles(),
    };
  }
}

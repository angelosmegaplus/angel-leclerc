// SPDX-License-Identifier: GPL-2.0-only

export type GuardSeverity = 'info' | 'warning' | 'critical';
export type GuardAction = 'allow' | 'observe' | 'rate-limit' | 'isolate' | 'recover' | 'rollback' | 'block';

export type GuardSignal = {
  id: string;
  source: string;
  type: string;
  severity: GuardSeverity;
  at: number;
  message: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type GuardDecision = {
  signalId: string;
  action: GuardAction;
  reason: string;
  automatic: boolean;
  decidedAt: number;
};

export type GuardExecution = {
  signalId: string;
  action: GuardAction;
  status: 'executed' | 'unavailable' | 'failed';
  executorId?: string;
  detail?: string;
  executedAt: number;
};

export type GuardPolicy = {
  id: string;
  priority: number;
  matches: (signal: GuardSignal) => boolean;
  decide: (signal: GuardSignal) => GuardDecision;
};

export type GuardExecutor = {
  id: string;
  action: GuardAction;
  canExecute?: (signal: GuardSignal, decision: GuardDecision) => Promise<boolean> | boolean;
  execute: (signal: GuardSignal, decision: GuardDecision) => Promise<{ ok: boolean; detail?: string }>;
};

/** Angel Guard OS is the autonomous security layer of Angel OS. */
export class AngelGuardOS {
  private policies: GuardPolicy[] = [];
  private executors: GuardExecutor[] = [];
  private signals: GuardSignal[] = [];
  private decisions: GuardDecision[] = [];
  private executions: GuardExecution[] = [];

  register(policy: GuardPolicy) {
    this.policies.push(policy);
    this.policies.sort((a, b) => b.priority - a.priority);
    return this;
  }

  registerExecutor(executor: GuardExecutor) {
    this.executors = this.executors.filter((candidate) => candidate.id !== executor.id);
    this.executors.push(executor);
    return this;
  }

  evaluate(signal: GuardSignal): GuardDecision {
    this.signals.unshift(signal);
    this.signals = this.signals.slice(0, 1000);
    const policy = this.policies.find((candidate) => candidate.matches(signal));
    const decision = policy
      ? policy.decide(signal)
      : { signalId: signal.id, action: signal.severity === 'critical' ? 'isolate' : 'observe', reason: 'Default Angel Guard policy', automatic: true, decidedAt: Date.now() } satisfies GuardDecision;
    this.decisions.unshift(decision);
    this.decisions = this.decisions.slice(0, 1000);
    return decision;
  }

  async enforce(signal: GuardSignal, decision: GuardDecision): Promise<GuardExecution> {
    const candidates = this.executors.filter((executor) => executor.action === decision.action);
    let selected: GuardExecutor | undefined;
    for (const executor of candidates) {
      try {
        if (!executor.canExecute || await executor.canExecute(signal, decision)) {
          selected = executor;
          break;
        }
      } catch {
        // A failing capability check must never be interpreted as permission to execute.
      }
    }

    if (!selected) {
      const execution: GuardExecution = {
        signalId: signal.id,
        action: decision.action,
        status: 'unavailable',
        detail: 'No verified executor is available for this action',
        executedAt: Date.now(),
      };
      this.rememberExecution(execution);
      return execution;
    }

    try {
      const result = await selected.execute(signal, decision);
      const execution: GuardExecution = {
        signalId: signal.id,
        action: decision.action,
        status: result.ok ? 'executed' : 'failed',
        executorId: selected.id,
        detail: result.detail,
        executedAt: Date.now(),
      };
      this.rememberExecution(execution);
      return execution;
    } catch (error) {
      const execution: GuardExecution = {
        signalId: signal.id,
        action: decision.action,
        status: 'failed',
        executorId: selected.id,
        detail: error instanceof Error ? error.message : 'Executor failed',
        executedAt: Date.now(),
      };
      this.rememberExecution(execution);
      return execution;
    }
  }

  private rememberExecution(execution: GuardExecution) {
    this.executions.unshift(execution);
    this.executions = this.executions.slice(0, 1000);
  }

  snapshot() {
    return {
      generatedAt: Date.now(),
      policies: this.policies.map(({ id, priority }) => ({ id, priority })),
      executors: this.executors.map(({ id, action }) => ({ id, action })),
      recentSignals: this.signals.slice(0, 20),
      recentDecisions: this.decisions.slice(0, 20),
      recentExecutions: this.executions.slice(0, 20),
      automation: true,
    };
  }
}

export function createDefaultAngelGuard() {
  return new AngelGuardOS()
    .register({
      id: 'critical-auth-block', priority: 100,
      matches: (signal) => signal.severity === 'critical' && /auth|access|session|credential/i.test(`${signal.type} ${signal.source}`),
      decide: (signal) => ({ signalId: signal.id, action: 'block', reason: 'Critical authentication anomaly', automatic: true, decidedAt: Date.now() }),
    })
    .register({
      id: 'provider-recovery', priority: 80,
      matches: (signal) => /provider|api|upstream|timeout/i.test(`${signal.type} ${signal.message}`),
      decide: (signal) => ({ signalId: signal.id, action: 'recover', reason: 'Provider failure: retry or fallback', automatic: true, decidedAt: Date.now() }),
    })
    .register({
      id: 'deployment-rollback', priority: 70,
      matches: (signal) => signal.severity === 'critical' && /deploy|production|release/i.test(`${signal.type} ${signal.source}`),
      decide: (signal) => ({ signalId: signal.id, action: 'rollback', reason: 'Critical production regression', automatic: true, decidedAt: Date.now() }),
    });
}

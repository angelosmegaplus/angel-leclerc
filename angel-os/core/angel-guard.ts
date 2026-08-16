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

export type GuardPolicy = {
  id: string;
  priority: number;
  matches: (signal: GuardSignal) => boolean;
  decide: (signal: GuardSignal) => GuardDecision;
};

/** Angel Guard OS is the autonomous security layer of Angel OS. */
export class AngelGuardOS {
  private policies: GuardPolicy[] = [];
  private signals: GuardSignal[] = [];
  private decisions: GuardDecision[] = [];

  register(policy: GuardPolicy) {
    this.policies.push(policy);
    this.policies.sort((a, b) => b.priority - a.priority);
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

  snapshot() {
    return {
      generatedAt: Date.now(),
      policies: this.policies.map(({ id, priority }) => ({ id, priority })),
      recentSignals: this.signals.slice(0, 20),
      recentDecisions: this.decisions.slice(0, 20),
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

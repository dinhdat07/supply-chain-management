const LABEL_MAP: Record<string, string> = {
  normal: 'Stable operations',
  crisis: 'Disruption response',
  supplier_delay: 'Supplier delay',
  demand_spike: 'Demand spike',
  route_blockage: 'Route blockage',
  compound_disruption: 'Compound disruption',
  cost_first: 'Cost-first',
  balanced: 'Balanced',
  resilience_first: 'Resilience-first',
  auto_applied: 'Auto-applied',
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Awaiting approval',
  not_required: 'No approval needed',
  approval_pending: 'Awaiting approval',
  pending_approval: 'Awaiting approval',
  approved_and_applied: 'Approved and executed',
  safer_plan_pending: 'Safer alternative awaiting approval',
  safer_plan_auto_applied: 'Safer alternative auto-applied',
  refresh_network: 'Refresh network state',
  daily_plan: 'Generate recommendations',
  ai_assisted_reasoning: 'AI-assisted reasoning',
  deterministic_or_fallback: 'Deterministic or fallback reasoning',
  deterministic_execution_guard: 'Deterministic execution guard',
  deterministic_policy_guardrail: 'Deterministic policy guardrail',
  human_approval_action: 'Operator approval action',
  risk: 'Risk agent',
  demand: 'Demand agent',
  inventory: 'Inventory agent',
  supplier: 'Supplier agent',
  logistics: 'Logistics agent',
  planner: 'Planner agent',
  critic: 'Critic agent',
  approval: 'Approval gate',
  execution: 'Execution',
  approval_resolution: 'Approval resolution',
  reflection: 'Reflection and memory',
  completed: 'Completed',
  running: 'Running',
  executed: 'Executed',
  requires_approval: 'Awaiting approval',
  in_stock: 'In stock',
  low: 'Low stock',
  at_risk: 'At risk',
  out_of_stock: 'Out of stock',
  active: 'Active',
  degraded: 'Degraded',
  reroute: 'Reroute',
  reorder: 'Reorder',
  switch_supplier: 'Switch supplier',
  rebalance: 'Rebalance',
  no_op: 'No action',
};

function titleCase(raw: string): string {
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function humanizeLabel(raw: string | null | undefined): string {
  if (!raw) return 'Not available';
  return LABEL_MAP[raw] ?? titleCase(raw);
}

export function humanizeNode(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function humanizeStatus(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function humanizeStrategy(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function humanizeEvent(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function humanizeAction(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function humanizeReasoningSource(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMetricDelta(before: number, after: number, kind: 'percent' | 'currency' | 'number' = 'number'): string {
  const delta = after - before;
  if (kind === 'percent') {
    return `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`;
  }
  if (kind === 'currency') {
    return `${delta >= 0 ? '+' : ''}${formatCurrency(delta)}`;
  }
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;
}

export function severityTone(level: string | null | undefined): string {
  if (level === 'critical' || level === 'crisis') return 'critical';
  if (level === 'warning' || level === 'approval') return 'warning';
  return 'normal';
}

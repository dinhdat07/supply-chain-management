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
  safer_alternative: 'Safer alternative',
  operator_safer_request: 'Safer alternative',
  operator_selected_alternative: 'Operator-selected alternative',
  auto_applied: 'Auto-applied',
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Awaiting approval',
  not_required: 'No approval needed',
  approval_pending: 'Awaiting approval',
  pending_approval: 'Awaiting approval',
  approved_and_applied: 'Approved and executed',
  daily_cycle: 'Planning cycle',
  event_response: 'Disruption response',
  scenario_step: 'Scenario simulation',
  approval_resolution: 'Approval resolution',
  simulation: 'Simulation',
  completed: 'Completed',
  failed: 'Failed',
  safer_plan_pending: 'Safer alternative awaiting approval',
  safer_plan_auto_applied: 'Safer alternative auto-applied',
  refresh_network: 'Refresh network state',
  daily_plan: 'Generate recommendations',
  ai_assisted_reasoning: 'AI-assisted reasoning',
  deterministic_or_fallback: 'Deterministic reasoning',
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
  reflection: 'Reflection and memory',
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
  SKU_1: 'Cold-Chain Sensor Kit',
  SKU_2: 'Thermal Pallet Liner',
  SKU_3: 'Infusion Pump Cartridge',
  SUP_A: 'NorthStar Components',
  SUP_B: 'BlueWave Express Supply',
  SUP_C: 'Mekong Packaging Co.',
  SUP_D: 'Delta Rapid Fulfillment',
  SUP_E: 'Atlas Medical Parts',
  SUP_F: 'Pacific Resilience Supply',
  WH_HN: 'Hanoi Hub',
  WH_DN: 'Da Nang Hub',
  WH_HCM: 'Ho Chi Minh Hub',
  SUP_BN: 'Bac Ninh Electronics Co.',
  SUP_HP: 'Hai Phong Industrial Supply',
  SUP_QN: 'Quang Nam Precision Parts',
  SUP_BD: 'Binh Duong Manufacturing',
  SUP_DNAI: 'Dong Nai Tech Components',
  R_BN_HN_MAIN: 'Bac Ninh - Hanoi Main',
  R_BN_HN_ALT: 'Bac Ninh - Hanoi Alternate',
  R_HP_HN_MAIN: 'Hai Phong - Hanoi Main',
  R_HP_HN_ALT: 'Hai Phong - Hanoi Alternate',
  R_QN_DN_MAIN: 'Quang Nam - Da Nang Main',
  R_QN_DN_ALT: 'Quang Nam - Da Nang Alternate',
  R_BD_HCM_MAIN: 'Binh Duong - HCMC Main',
  R_BD_HCM_ALT: 'Binh Duong - HCMC Alternate',
  R_DNAI_HCM_MAIN: 'Dong Nai - HCMC Main',
  R_DNAI_HCM_ALT: 'Dong Nai - HCMC Alternate',
  R1: 'North Port Corridor',
  R2: 'Mekong Inland Route',
  R3: 'Central Express Route',
  R4: 'Priority Air Corridor',
  R5: 'Canal Consolidation Route',
  WH_NORTH: 'Hanoi Regional DC',
  WH_SOUTH: 'Ho Chi Minh City Regional DC',
};

function titleCase(raw: string): string {
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => {
      if (/^[A-Z0-9]+$/.test(part) && part.length <= 6) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
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

export function humanizeEntityId(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function entityReference(raw: string | null | undefined): string {
  if (!raw) return '';
  const friendly = humanizeEntityId(raw);
  return friendly === raw ? raw : `${friendly} (${raw})`;
}

export function describeActionTitle(actionType: string | null | undefined, targetId: string | null | undefined): string {
  const target = humanizeEntityId(targetId);
  switch (actionType) {
    case 'reroute':
      return `Reroute through ${target}`;
    case 'reorder':
      return `Replenish ${target}`;
    case 'switch_supplier':
    case 'supplier':
      return `Shift supply to ${target}`;
    case 'rebalance':
      return `Rebalance inventory for ${target}`;
    case 'no_op':
      return 'Hold current operating plan';
    default:
      return `${humanizeAction(actionType)} ${target}`.trim();
  }
}

export function describeActionTarget(actionType: string | null | undefined, targetId: string | null | undefined): string {
  const target = humanizeEntityId(targetId);
  switch (actionType) {
    case 'reroute':
      return `Transportation path: ${target}`;
    case 'reorder':
      return `Inventory item: ${target}`;
    case 'switch_supplier':
    case 'supplier':
      return `Supplier move: ${target}`;
    case 'rebalance':
      return `Inventory move: ${target}`;
    default:
      return `Operational focus: ${target}`;
  }
}

export function humanizeReasoningSource(raw: string | null | undefined): string {
  return humanizeLabel(raw);
}

export function describeDecisionMethod(step: {
  llm_used?: boolean;
  llm_error?: string | null;
  fallback_used?: boolean;
  reasoning_source?: string | null;
} | null | undefined): string {
  if (!step) return 'Not available';
  if (step.fallback_used || step.llm_error) return 'Fallback';
  if (step.llm_used) return 'AI-assisted';
  if (step.reasoning_source === 'deterministic_policy_guardrail') return 'Policy guardrail';
  if (step.reasoning_source === 'deterministic_execution_guard') return 'Execution guard';
  return 'Deterministic';
}

export function severitySummary(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Severity not available';
  if (value >= 0.8) return 'High severity';
  if (value >= 0.5) return 'Moderate severity';
  return 'Low severity';
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

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function formatDurationMs(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }
  return `${Math.round(value)} ms`;
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

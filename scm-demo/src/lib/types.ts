export interface KPIView {
  service_level: number;
  total_cost: number;
  disruption_risk: number;
  recovery_speed: number;
  stockout_risk: number;
  decision_latency_ms: number;
}

export interface AlertView {
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  source: string;
  event_type?: string | null;
  entity_ids: string[];
}

export interface EventView {
  event_id: string;
  type: string;
  severity: number;
  source: string;
  entity_ids: string[];
  occurred_at: string;
  detected_at: string;
  payload: Record<string, unknown>;
}

export interface ActionView {
  action_id: string;
  action_type: string;
  target_id: string;
  reason: string;
  priority: number;
  estimated_cost_delta: number;
  estimated_service_delta: number;
  estimated_risk_delta: number;
  estimated_recovery_hours: number;
  parameters: Record<string, unknown>;
}

export interface CandidateEvaluationView {
  strategy_label: string;
  action_ids: string[];
  score: number;
  score_breakdown: Record<string, number>;
  projected_kpis: KPIView;
  approval_required: boolean;
  approval_reason: string;
  rationale: string;
  llm_used: boolean;
}

export interface PlanView {
  plan_id: string;
  decision_id?: string | null;
  mode: string;
  status: string;
  score: number;
  score_breakdown: Record<string, number>;
  strategy_label?: string | null;
  generated_by?: string | null;
  approval_required: boolean;
  approval_reason: string;
  approval_status: string;
  planner_reasoning: string;
  llm_planner_narrative?: string | null;
  critic_summary?: string | null;
  trigger_event_ids: string[];
  actions: ActionView[];
}

export interface PendingApprovalView {
  decision_id: string;
  approval_status: string;
  approval_reason: string;
  allowed_actions: string[];
  blocking_operations: string[];
  selection_reason: string;
  selected_actions: string[];
  before_kpis: KPIView;
  projected_kpis: KPIView;
  candidate_count: number;
  plan: PlanView;
}

export interface ApprovalDetailView {
  decision_id: string;
  plan_id: string;
  approval_required: boolean;
  approval_status: string;
  approval_reason: string;
  is_pending: boolean;
  allowed_actions: string[];
  selection_reason: string;
  selected_actions: string[];
  event_ids: string[];
  before_kpis: KPIView;
  after_kpis: KPIView;
  candidate_count: number;
  plan: PlanView;
}

export interface AgentStepView {
  agent: string;
  node_type: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  mode_snapshot: string;
  summary: string;
  reasoning_source: string;
  input_snapshot: Record<string, unknown>;
  output_snapshot: Record<string, unknown>;
  observations: string[];
  risks: string[];
  downstream_impacts: string[];
  recommended_action_ids: string[];
  tradeoffs: string[];
  llm_used: boolean;
  llm_error?: string | null;
}

export interface RouteDecisionView {
  from_node: string;
  outcome: string;
  to_node: string;
  reason: string;
}

export interface TraceView {
  trace_id?: string | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  mode_before?: string | null;
  mode_after?: string | null;
  mode: string;
  current_branch: string;
  terminal_stage?: string | null;
  event?: EventView | null;
  route_decisions: RouteDecisionView[];
  steps: AgentStepView[];
  latest_plan?: PlanView | null;
  decision_id?: string | null;
  selected_strategy?: string | null;
  candidate_count: number;
  selection_reason?: string | null;
  candidate_evaluations: CandidateEvaluationView[];
  approval_pending: boolean;
  approval_reason: string;
  execution_status?: string | null;
  critic_summary?: string | null;
}

export interface ReflectionView {
  note_id: string;
  run_id: string;
  scenario_id: string;
  plan_id?: string | null;
  mode: string;
  approval_status: string;
  summary: string;
  lessons: string[];
  pattern_tags: string[];
  follow_up_checks: string[];
  llm_used: boolean;
  llm_error?: string | null;
}

export interface InventoryRowView {
  sku: string;
  warehouse_id: string;
  on_hand: number;
  incoming_qty: number;
  forecast_qty: number;
  reorder_point: number;
  safety_stock: number;
  unit_cost: number;
  status: string;
  preferred_supplier_id: string;
  preferred_route_id: string;
}

export interface SupplierRowView {
  supplier_id: string;
  sku: string;
  unit_cost: number;
  lead_time_days: number;
  reliability: number;
  is_primary: boolean;
  status: string;
  tradeoff: string;
}

export interface ControlTowerSummaryResponse {
  mode: string;
  kpis: KPIView;
  alerts: AlertView[];
  active_events: EventView[];
  latest_plan?: PlanView | null;
  pending_approval?: PendingApprovalView | null;
  decision_count: number;
  scenario_history_count: number;
}

export interface InventoryListResponse {
  items: InventoryRowView[];
  total: number;
}

export interface SupplierListResponse {
  items: SupplierRowView[];
  total: number;
}

export interface TraceResponse {
  item: TraceView;
}

export interface PendingApprovalResponse {
  item?: PendingApprovalView | null;
}

export interface ApprovalDetailResponse {
  item: ApprovalDetailView;
}

export interface ApprovalCommandResultResponse {
  decision_id: string;
  action: string;
  approval_status: string;
  message: string;
  latest_plan?: PlanView | null;
  pending_approval?: PendingApprovalView | null;
  latest_trace?: TraceView | null;
  summary?: ControlTowerSummaryResponse | null;
}

export type ApprovalAction = 'approve' | 'reject' | 'safer_plan';
export type ScenarioName = 'supplier_delay' | 'demand_spike' | 'route_blockage' | 'compound_disruption';

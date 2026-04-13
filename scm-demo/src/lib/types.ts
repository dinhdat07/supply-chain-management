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

export interface EventEnvelopeView {
  event_id: string;
  event_class: string;
  event_type: string;
  source: string;
  occurred_at: string;
  ingested_at: string;
  correlation_id: string;
  causation_id?: string | null;
  idempotency_key: string;
  severity: number;
  entity_ids: string[];
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
  feasible?: boolean;
  violations?: Array<{ code: string; message: string; action_id?: string | null; severity: string }>;
  mode_rationale?: string;
  approval_required: boolean;
  approval_reason: string;
  rationale: string;
  llm_used: boolean;
}

export interface HistoricalCase {
  case_id: string;
  event_type: string;
  event_severity: number;
  actions_taken: string[];
  outcome_kpis: Record<string, number>;
  reflection_notes: string;
  similarity_score: number;
}

export interface PlanView {
  plan_id: string;
  decision_id?: string | null;
  mode: string;
  status: string;
  score: number;
  score_breakdown: Record<string, number>;
  feasible?: boolean;
  violations: Array<{
    code: string;
    message: string;
    action_id?: string | null;
    severity: 'hard' | 'soft' | string;
  }>;
  mode_rationale?: string;
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
  metadata?: {
    referenced_cases: HistoricalCase[];
    memory_influence_score: number;
    strategy_rationale: string;
    strategic_prompt?: string | null;
  };
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
  step_id?: string | null;
  sequence?: number;
  agent: string;
  node_type: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  duration_ms?: number | null;
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
  fallback_used?: boolean;
  fallback_reason?: string | null;
}

export interface RouteDecisionView {
  from_node: string;
  outcome: string;
  to_node: string;
  reason: string;
}

export interface TraceView {
  run_id?: string | null;
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
  name?: string;
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
  inventory_items: number;
  suppliers: number;
  routes: number;
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
  execution?: ExecutionRecordView | null;
  latest_trace?: TraceView | null;
  summary?: ControlTowerSummaryResponse | null;
}

export interface SelectedPlanSummaryView {
  plan_id: string;
  strategy_label?: string | null;
  generated_by?: string | null;
  approval_required: boolean;
  approval_reason: string;
  score: number;
  action_ids: string[];
}

export interface ExecutionSummaryView {
  status: string;
  dispatch_mode: string;
  action_ids: string[];
}

export interface RunView {
  run_id: string;
  run_type: string;
  parent_run_id?: string | null;
  correlation_id: string;
  trigger_event_id?: string | null;
  input_event_ids: string[];
  mode_before: string;
  mode_after: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  duration_ms: number;
  decision_id?: string | null;
  selected_plan_id?: string | null;
  execution_id?: string | null;
  approval_status?: string | null;
  llm_fallback_used: boolean;
  llm_fallback_reason?: string | null;
  selected_plan_summary?: SelectedPlanSummaryView | null;
  execution_summary?: ExecutionSummaryView | null;
}

export interface RunListResponse {
  items: RunView[];
  total: number;
}

export interface RunDetailResponse {
  item: RunView;
}

export interface ControlTowerStateView {
  summary: ControlTowerSummaryResponse;
  inventory: InventoryRowView[];
  suppliers: SupplierRowView[];
  reflections: ReflectionView[];
  latest_trace?: TraceView | null;
}

export interface RunStateResponse {
  run: RunView;
  state: ControlTowerStateView;
}

export interface ExecutionReceiptView {
  receipt_id: string;
  action_id: string;
  status: string;
  detail: string;
}

export interface ExecutionTransitionView {
  status: string;
  timestamp: string;
  reason: string;
}

export interface ExecutionRecordView {
  execution_id: string;
  run_id: string;
  decision_id?: string | null;
  plan_id?: string | null;
  status: string;
  dispatch_mode: string;
  dry_run: boolean;
  target_system: string;
  action_ids: string[];
  receipts: ExecutionReceiptView[];
  status_history: ExecutionTransitionView[];
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExecutionDetailResponse {
  item: ExecutionRecordView;
}

export interface ActionExecutionRecordView {
  execution_id: string;
  plan_id: string;
  action_id: string;
  action_type: string;
  target_system: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  status: string;
  receipt: Record<string, unknown>;
  failure_reason?: string | null;
  is_retryable: boolean;
  created_at: string;
  dispatched_at?: string | null;
  applied_at?: string | null;
  estimated_completion_at?: string | null;
  progress_percentage: number;
}

export interface ExecutionListResponse {
  items: ActionExecutionRecordView[];
  total: number;
}

export interface PlanDispatchResponse {
  plan_id: string;
  dispatch_mode: string;
  plan_execution_status: string;
  overall_progress: number;
  records: ActionExecutionRecordView[];
  compensation_hints: string[];
}

export interface ActionExecutionDetailResponse {
  item: ActionExecutionRecordView;
}

export interface DecisionLogDetailView {
  decision_id: string;
  plan_id: string;
  approval_status: string;
  approval_required: boolean;
  approval_reason: string;
  rationale: string;
  selection_reason: string;
  mode_rationale: string;
  winning_factors: string[];
  score_breakdown: Record<string, number>;
  selected_actions: string[];
  rejected_actions: Array<Record<string, string>>;
  candidate_evaluations: CandidateEvaluationView[];
  critic_summary?: string | null;
  critic_findings: string[];
  llm_used: boolean;
  llm_provider?: string | null;
  llm_model?: string | null;
  llm_error?: string | null;
  before_kpis: KPIView;
  after_kpis: KPIView;
}

export interface DecisionLogDetailResponse {
  item: DecisionLogDetailView;
}

export interface EventListResponse {
  items: EventView[];
  total: number;
}

export interface WhatIfSummary {
  mode: string;
  active_events: string[];
  inventory_items: number;
  suppliers: number;
  routes: number;
  kpis: KPIView;
  latest_plan_id?: string | null;
  pending_plan_id?: string | null;
}

export interface WhatIfResponse {
  scenario_name: string;
  summary: WhatIfSummary;
  latest_plan?: PlanView | null;
}

export interface ScenarioOutcomeView {
  scenario_id: string;
  runs: number;
  latest_run_id?: string | null;
  latest_plan_id?: string | null;
  latest_approval_status?: string | null;
  latest_reflection_status?: string | null;
  latest_kpis: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
}

export interface ReflectionListResponse {
  items: ReflectionView[];
  scenarios: ScenarioOutcomeView[];
  pattern_tag_counts: Record<string, number>;
}

export interface ServiceFlagsView {
  llm_enabled: boolean;
  llm_provider: string;
  llm_model: string;
  llm_timeout_s: number;
  llm_retry_attempts: number;
  planner_mode: string;
  dispatch_mode: string;
  degraded_mode: string;
}

export interface ServiceMetricsView {
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  total_events: number;
  total_executions: number;
  avg_run_duration_ms: number;
  avg_agent_step_duration_ms: number;
  llm_fallback_rate: number;
  approval_rate: number;
  execution_failure_rate: number;
  latest_run_id?: string | null;
}

export interface ServiceRuntimeView {
  flags: ServiceFlagsView;
  metrics: ServiceMetricsView;
}

export interface ServiceRuntimeResponse {
  item: ServiceRuntimeView;
}

export type ApprovalAction = 'approve' | 'reject' | 'safer_plan';
export type ScenarioName = 'supplier_delay' | 'demand_spike' | 'route_blockage' | 'compound_disruption';

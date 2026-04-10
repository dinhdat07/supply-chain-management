import { useState } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  GitBranch,
  Play,
  RefreshCcw,
  ShieldAlert,
  Truck,
} from 'lucide-react';

import { SCENARIO_OPTIONS } from '../hooks/useControlTower';
import type {
  ApprovalAction,
  ControlTowerSummaryResponse,
  PendingApprovalView,
  ScenarioName,
  TraceView,
} from '../lib/types';

interface AgentProps {
  summary: ControlTowerSummaryResponse | null;
  trace: TraceView | null;
  pendingApproval: PendingApprovalView | null;
  loading: boolean;
  refreshing: boolean;
  actionLoading: string | null;
  error: string | null;
  onRefresh: () => Promise<void>;
  onRunDailyPlan: () => Promise<void>;
  onRunScenario: (scenario: ScenarioName) => Promise<void>;
  onApprovalAction: (action: ApprovalAction, decisionId: string) => Promise<void>;
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function toneClasses(mode: string) {
  if (mode === 'approval') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (mode === 'crisis') return 'bg-errorRed/10 text-errorRed border-errorRed/20';
  return 'bg-green-50 text-green-700 border-green-200';
}

export function Agent({
  summary,
  trace,
  pendingApproval,
  loading,
  refreshing,
  actionLoading,
  error,
  onRefresh,
  onRunDailyPlan,
  onRunScenario,
  onApprovalAction,
}: AgentProps) {
  const [scenario, setScenario] = useState<ScenarioName>('supplier_delay');

  const currentPlan = pendingApproval?.plan ?? trace?.latest_plan ?? summary?.latest_plan ?? null;
  const candidatePlans = trace?.candidate_evaluations ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      <div className="bg-pureWhite p-6 rounded-[24px] shadow-card border border-borderGray">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rausch/10 rounded-full">
              <BrainCircuit className="text-rausch w-6 h-6" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-nearBlack tracking-[-0.18px]">AI Supply Chain Agent</h1>
              <p className="text-[14px] text-secondaryGray font-medium mt-1">
                Live control tower orchestration: sense, analyze, plan, approve, act, and learn.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] ${toneClasses(summary?.mode ?? 'normal')}`}>
              {summary?.mode ?? 'loading'}
            </div>
            <button
              onClick={() => void onRefresh()}
              className="flex items-center gap-2 rounded-card border border-borderGray bg-pureWhite px-4 py-2 text-[14px] font-semibold text-nearBlack transition-all hover:bg-lightSurface"
            >
              <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-3">
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Service level</div>
              <div className="mt-1 text-[22px] font-bold text-nearBlack">
                {summary ? percent(summary.kpis.service_level) : '--'}
              </div>
            </div>
            <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-3">
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Recovery speed</div>
              <div className="mt-1 text-[22px] font-bold text-nearBlack">
                {summary ? percent(summary.kpis.recovery_speed) : '--'}
              </div>
            </div>
            <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-3">
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Disruption risk</div>
              <div className="mt-1 text-[22px] font-bold text-nearBlack">
                {summary ? percent(summary.kpis.disruption_risk) : '--'}
              </div>
            </div>
            <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-3">
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Decision latency</div>
              <div className="mt-1 text-[22px] font-bold text-nearBlack">
                {summary ? `${summary.kpis.decision_latency_ms.toFixed(0)} ms` : '--'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              onClick={() => void onRunDailyPlan()}
              disabled={loading || actionLoading !== null}
              className="flex items-center justify-center gap-2 rounded-card bg-nearBlack px-5 py-3 text-[14px] font-bold text-pureWhite transition-all hover:bg-nearBlack/90 disabled:cursor-not-allowed disabled:bg-nearBlack/20 disabled:text-nearBlack/40"
            >
              <Play size={16} />
              Run Daily Plan
            </button>
            <select
              value={scenario}
              onChange={(event) => setScenario(event.target.value as ScenarioName)}
              className="rounded-card border border-borderGray bg-lightSurface px-4 py-3 text-[14px] font-medium text-nearBlack"
            >
              {SCENARIO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => void onRunScenario(scenario)}
              disabled={loading || actionLoading !== null}
              className="flex items-center justify-center gap-2 rounded-card bg-rausch px-5 py-3 text-[14px] font-bold text-pureWhite transition-all hover:bg-rausch/90 disabled:cursor-not-allowed disabled:bg-rausch/30"
            >
              <Truck size={16} />
              Trigger Scenario
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-5 py-4 text-[14px] text-errorRed">
          {error}
        </div>
      ) : null}

      {pendingApproval ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 text-amber-700" size={22} />
              <div>
                <h2 className="text-[22px] font-semibold text-nearBlack">Approval Required</h2>
                <p className="mt-1 text-[14px] text-secondaryGray">{pendingApproval.approval_reason}</p>
                <p className="mt-2 text-[13px] text-secondaryGray">
                  Decision {pendingApproval.decision_id} is blocking: {pendingApproval.blocking_operations.join(', ')}.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void onApprovalAction('approve', pendingApproval.decision_id)}
                disabled={actionLoading !== null}
                className="rounded-card bg-nearBlack px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-nearBlack/20 disabled:text-nearBlack/40"
              >
                Approve
              </button>
              <button
                onClick={() => void onApprovalAction('reject', pendingApproval.decision_id)}
                disabled={actionLoading !== null}
                className="rounded-card border border-borderGray bg-pureWhite px-4 py-3 text-[14px] font-bold text-nearBlack disabled:bg-lightSurface"
              >
                Reject
              </button>
              <button
                onClick={() => void onApprovalAction('safer_plan', pendingApproval.decision_id)}
                disabled={actionLoading !== null}
                className="rounded-card bg-rausch px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-rausch/30"
              >
                Request Safer Plan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
            <div className="flex items-center gap-3">
              <GitBranch className="text-rausch" size={20} />
              <div>
                <h2 className="text-[22px] font-semibold text-nearBlack">Agent Execution Trace</h2>
                <p className="text-[14px] text-secondaryGray">
                  Actual LangGraph node flow for the latest run.
                </p>
              </div>
            </div>

            {loading || !trace ? (
              <div className="mt-6 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                Waiting for the first control tower run...
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Branch</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{trace.current_branch}</div>
                  </div>
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Terminal stage</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{trace.terminal_stage ?? 'pending'}</div>
                  </div>
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Selected strategy</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{trace.selected_strategy ?? 'n/a'}</div>
                  </div>
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Execution status</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{trace.execution_status ?? 'n/a'}</div>
                  </div>
                </div>

                {trace.route_decisions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {trace.route_decisions.map((route) => (
                      <span
                        key={`${route.from_node}-${route.to_node}-${route.outcome}`}
                        className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[12px] font-semibold text-secondaryGray"
                        title={route.reason}
                      >
                        {route.from_node} → {route.to_node}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {trace.steps.map((step) => (
                    <div key={`${step.agent}-${step.started_at}`} className="rounded-card border border-borderGray p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[16px] font-bold text-nearBlack">{step.agent}</h3>
                            <span className="rounded-full bg-lightSurface px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                              {step.node_type}
                            </span>
                            {step.llm_used ? (
                              <span className="rounded-full bg-rausch/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-rausch">
                                ai-assisted
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-[14px] text-secondaryGray">{step.summary}</p>
                        </div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                          {step.status}
                        </div>
                      </div>

                      {step.recommended_action_ids.length > 0 ? (
                        <div className="mt-3 text-[13px] text-secondaryGray">
                          Actions: <span className="font-semibold text-nearBlack">{step.recommended_action_ids.join(', ')}</span>
                        </div>
                      ) : null}

                      {step.tradeoffs.length > 0 ? (
                        <ul className="mt-3 space-y-1 text-[13px] text-secondaryGray">
                          {step.tradeoffs.slice(0, 2).map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      ) : null}

                      {step.llm_error ? (
                        <div className="mt-3 text-[12px] text-errorRed">LLM fallback: {step.llm_error}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
            <h2 className="text-[22px] font-semibold text-nearBlack">Candidate Plans</h2>
            <p className="mt-1 text-[14px] text-secondaryGray">
              Planner options scored by the deterministic policy engine.
            </p>

            {candidatePlans.length === 0 ? (
              <div className="mt-6 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                Candidate plans will appear after the first plan or scenario run.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {candidatePlans.map((plan) => {
                  const isSelected = plan.strategy_label === trace?.selected_strategy;
                  return (
                    <div
                      key={plan.strategy_label}
                      className={`rounded-card border p-4 ${isSelected ? 'border-rausch bg-rausch/5' : 'border-borderGray bg-pureWhite'}`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-nearBlack">{plan.strategy_label}</h3>
                        {isSelected ? (
                          <span className="rounded-full bg-rausch px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-pureWhite">
                            selected
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 space-y-2 text-[14px] text-secondaryGray">
                        <div>Score <span className="font-semibold text-nearBlack">{plan.score.toFixed(4)}</span></div>
                        <div>Service <span className="font-semibold text-nearBlack">{percent(plan.projected_kpis.service_level)}</span></div>
                        <div>Risk <span className="font-semibold text-nearBlack">{percent(plan.projected_kpis.disruption_risk)}</span></div>
                        <div>Recovery <span className="font-semibold text-nearBlack">{percent(plan.projected_kpis.recovery_speed)}</span></div>
                        <div>Cost <span className="font-semibold text-nearBlack">{plan.projected_kpis.total_cost.toFixed(2)}</span></div>
                      </div>
                      <p className="mt-4 text-[13px] text-secondaryGray">{plan.rationale}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
            <h2 className="text-[22px] font-semibold text-nearBlack">Selected Plan</h2>
            {currentPlan ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-card bg-nearBlack px-5 py-5 text-pureWhite">
                  <div className="text-[12px] uppercase tracking-wider text-pureWhite/60">Strategy</div>
                  <div className="mt-1 text-[22px] font-bold">{currentPlan.strategy_label ?? 'n/a'}</div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-[13px] text-pureWhite/80">
                    <div>Score {currentPlan.score.toFixed(4)}</div>
                    <div>Status {currentPlan.approval_status}</div>
                    <div>Plan ID {currentPlan.plan_id}</div>
                    <div>Generated by {currentPlan.generated_by ?? 'unknown'}</div>
                  </div>
                </div>

                <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Why this plan won</div>
                  <p className="mt-2 text-[14px] text-nearBlack">
                    {trace?.selection_reason ?? pendingApproval?.selection_reason ?? currentPlan.planner_reasoning}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentPlan.actions.map((action) => (
                    <div key={action.action_id} className="rounded-card border border-borderGray px-4 py-4">
                      <div className="flex items-center gap-2 text-[15px] font-bold text-nearBlack">
                        <CheckCircle2 size={16} className="text-rausch" />
                        {action.action_type}
                      </div>
                      <p className="mt-2 text-[14px] text-secondaryGray">{action.reason}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] uppercase tracking-wider text-secondaryGray">
                        <div>Target {action.target_id}</div>
                        <div>Recovery {action.estimated_recovery_hours.toFixed(1)}h</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                Run the daily plan or trigger a scenario to generate a plan.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
            <h2 className="text-[22px] font-semibold text-nearBlack">Live Event</h2>
            {trace?.event ? (
              <div className="mt-5 rounded-card border border-errorRed/15 bg-errorRed/5 px-4 py-4">
                <div className="flex items-center gap-2 text-[15px] font-bold text-nearBlack">
                  <AlertCircle size={16} className="text-errorRed" />
                  {trace.event.type}
                </div>
                <p className="mt-2 text-[14px] text-secondaryGray">
                  Source {trace.event.source} • Severity {trace.event.severity.toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                No disruption event is active. Use Run Daily Plan for normal mode or trigger a scenario for crisis mode.
              </div>
            )}

            <div className="mt-5 rounded-card border border-borderGray bg-lightSurface px-4 py-4 text-[14px] text-secondaryGray">
              {loading ? 'Loading backend state...' : 'This page is backed by live FastAPI endpoints and the LangGraph orchestration trace.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

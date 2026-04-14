import { LoaderCircle } from 'lucide-react';
import type { 
  ControlTowerStateView, 
  DecisionLogDetailView, 
  ExecutionRecordView, 
  RunView, 
  TraceView 
} from '../../lib/types';
import { 
  formatCurrency, 
  formatDateTime, 
  formatDurationMs, 
  formatMetricDelta, 
  formatPercent, 
  humanizeAction, 
  humanizeEvent, 
  humanizeLabel, 
  humanizeNode, 
  humanizeReasoningSource, 
  humanizeStatus, 
  humanizeStrategy, 
  severitySummary 
} from '../../lib/presenters';
import { causalTone, eventSummary, kpiRow } from './AgentShared';
import { ReflectionMemoryPanel } from './ReflectionMemoryPanel';

interface RunLedgerProps {
  runHistory: RunView[];
  selectedRun: RunView | null;
  selectedRunTrace: TraceView | null;
  selectedRunState: ControlTowerStateView | null;
  selectedRunDecision: DecisionLogDetailView | null;
  selectedRunExecution: ExecutionRecordView | null;
  historyLoading: boolean;
  onSelectRun: (runId: string) => Promise<void>;
}

function runCardTone(selected: boolean): string {
  return selected
    ? 'border-nearBlack bg-nearBlack text-pureWhite shadow-card'
    : 'border-borderGray bg-pureWhite text-nearBlack hover:border-nearBlack/30 hover:bg-lightSurface';
}

function historyEventTitle(run: RunView, trace: TraceView | null): string {
  if (trace?.event) {
    return humanizeEvent(trace.event.type);
  }
  if (run.run_type === 'daily_cycle') {
    return 'Planning cycle request';
  }
  if (run.run_type === 'approval_resolution') {
    return 'Approval decision received';
  }
  return humanizeLabel(run.run_type);
}

export function RunLedger({
  runHistory,
  selectedRun,
  selectedRunTrace,
  selectedRunState,
  selectedRunDecision,
  selectedRunExecution,
  historyLoading,
  onSelectRun,
}: RunLedgerProps) {
  const selectedRunEvent = selectedRunTrace?.event ?? null;
  const selectedRunSummary = selectedRunState?.summary ?? null;
  const replaySteps = selectedRunTrace?.steps ?? [];
  const selectedRunExecutionStatus = selectedRunExecution?.status ?? selectedRun?.execution_summary?.status ?? null;
  const selectedRunReflections = selectedRunState?.reflections.filter(
    (item) => item.run_id === selectedRun?.run_id,
  ) ?? [];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[24px] font-bold text-nearBlack">Run Ledger</h2>
        <p className="mt-1 text-[14px] text-secondaryGray">
          Inspect completed orchestration runs, replay their traces, compare before and after KPI state, and follow the causal chain from signal to execution.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Past runs</div>
              <div className="mt-1 text-[20px] font-bold text-nearBlack">{runHistory.length} recorded runs</div>
            </div>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-rausch">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading
              </div>
            ) : null}
          </div>

          {runHistory.length === 0 ? (
            <div className="mt-5 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
              Run a planning cycle or simulated disruption to populate the historical ledger.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {runHistory.map((run) => {
                const isSelected = selectedRun?.run_id === run.run_id;
                return (
                  <button
                    key={run.run_id}
                    type="button"
                    onClick={() => void onSelectRun(run.run_id)}
                    className={`w-full rounded-[20px] border p-4 text-left transition-all ${runCardTone(isSelected)}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'bg-pureWhite/15 text-pureWhite' : 'bg-lightSurface text-secondaryGray'}`}>
                        {humanizeLabel(run.run_type)}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'bg-pureWhite/15 text-pureWhite' : 'bg-lightSurface text-secondaryGray'}`}>
                        {humanizeStatus(run.status)}
                      </span>
                      {run.approval_status ? (
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'bg-pureWhite/15 text-pureWhite' : 'bg-lightSurface text-secondaryGray'}`}>
                          {humanizeStatus(run.approval_status)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-[16px] font-bold">{historyEventTitle(run, isSelected ? selectedRunTrace : null)}</div>
                    <p className={`mt-2 text-[13px] ${isSelected ? 'text-pureWhite/80' : 'text-secondaryGray'}`}>
                      {formatDateTime(run.started_at)} · {formatDurationMs(run.duration_ms)} · Mode {humanizeStatus(run.mode_before)} to {humanizeStatus(run.mode_after)}
                    </p>
                    <div className={`mt-3 flex flex-wrap gap-2 text-[12px] ${isSelected ? 'text-pureWhite/75' : 'text-secondaryGray'}`}>
                      {run.selected_plan_summary?.strategy_label ? (
                        <span>{humanizeStrategy(run.selected_plan_summary.strategy_label)}</span>
                      ) : null}
                      {run.execution_summary?.status ? (
                        <span>• {humanizeStatus(run.execution_summary.status)}</span>
                      ) : null}
                      {run.llm_fallback_used ? (
                        <span>• Deterministic fallback</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
          {selectedRun ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Selected run</div>
                  <h3 className="mt-2 text-[22px] font-bold text-nearBlack">{historyEventTitle(selectedRun, selectedRunTrace)}</h3>
                  <p className="mt-2 text-[14px] text-secondaryGray">
                    Run {selectedRun.run_id} started {formatDateTime(selectedRun.started_at)} and completed in {formatDurationMs(selectedRun.duration_ms)}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                    {humanizeLabel(selectedRun.run_type)}
                  </span>
                  <span className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                    {humanizeStatus(selectedRun.status)}
                  </span>
                  {selectedRunExecutionStatus ? (
                    <span className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                      {humanizeStatus(selectedRunExecutionStatus)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Causal chain</div>
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
                  <div className={`rounded-card border px-4 py-4 ${causalTone('event')}`}>
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">1. Signal entered</div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {selectedRunEvent ? humanizeEvent(selectedRunEvent.type) : historyEventTitle(selectedRun, selectedRunTrace)}
                    </div>
                    <p className="mt-2 text-[13px] text-secondaryGray">
                      {selectedRunEvent
                        ? `${eventSummary(selectedRunEvent)}. ${severitySummary(selectedRunEvent.severity)}.`
                        : selectedRun.trigger_event_id
                          ? `Triggered from event ${selectedRun.trigger_event_id}.`
                          : 'This run started from an operator command rather than an external disruption.'}
                    </p>
                  </div>

                  <div className={`rounded-card border px-4 py-4 ${causalTone('plan')}`}>
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">2. Plan selected</div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {selectedRun.selected_plan_summary?.strategy_label
                        ? humanizeStrategy(selectedRun.selected_plan_summary.strategy_label)
                        : 'No plan selected'}
                    </div>
                    <p className="mt-2 text-[13px] text-secondaryGray">
                      {selectedRunDecision?.selection_reason
                        ?? selectedRunDecision?.rationale
                        ?? 'No decision narrative was recorded for this run.'}
                    </p>
                  </div>

                  <div className={`rounded-card border px-4 py-4 ${causalTone('approval')}`}>
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">3. Approval state</div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {selectedRun.approval_status ? humanizeStatus(selectedRun.approval_status) : 'No approval gate'}
                    </div>
                    <p className="mt-2 text-[13px] text-secondaryGray">
                      {selectedRunDecision?.approval_reason
                        ?? selectedRun.selected_plan_summary?.approval_reason
                        ?? 'This run did not require an operator approval checkpoint.'}
                    </p>
                  </div>

                  <div className={`rounded-card border px-4 py-4 ${causalTone('execution')}`}>
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">4. Execution update</div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {selectedRunExecutionStatus ? humanizeStatus(selectedRunExecutionStatus) : 'No execution recorded'}
                    </div>
                    <p className="mt-2 text-[13px] text-secondaryGray">
                      {selectedRunExecution?.status_history[ selectedRunExecution.status_history.length - 1 ]?.reason
                        ?? selectedRun.execution_summary?.dispatch_mode
                        ?? 'Execution details were not recorded for this run.'}
                    </p>
                  </div>

                  <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">5. Learning captured</div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {selectedRunReflections.length ? 'Reflection recorded' : 'No reflection note'}
                    </div>
                    <p className="mt-2 text-[13px] text-secondaryGray">
                      {selectedRunReflections[0]?.summary
                        ?? 'This run did not result in a stored learning note.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="space-y-4">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Before and after KPIs</div>
                  {selectedRunDecision ? (
                    <div className="space-y-3">
                      {kpiRow(
                        'Service level',
                        formatPercent(selectedRunDecision.before_kpis.service_level),
                        formatPercent(selectedRunDecision.after_kpis.service_level),
                        formatMetricDelta(selectedRunDecision.before_kpis.service_level, selectedRunDecision.after_kpis.service_level, 'percent'),
                      )}
                      {kpiRow(
                        'Disruption risk',
                        formatPercent(selectedRunDecision.before_kpis.disruption_risk),
                        formatPercent(selectedRunDecision.after_kpis.disruption_risk),
                        formatMetricDelta(selectedRunDecision.before_kpis.disruption_risk, selectedRunDecision.after_kpis.disruption_risk, 'percent'),
                      )}
                      {kpiRow(
                        'Recovery speed',
                        formatPercent(selectedRunDecision.before_kpis.recovery_speed),
                        formatPercent(selectedRunDecision.after_kpis.recovery_speed),
                        formatMetricDelta(selectedRunDecision.before_kpis.recovery_speed, selectedRunDecision.after_kpis.recovery_speed, 'percent'),
                      )}
                      {kpiRow(
                        'Total cost',
                        formatCurrency(selectedRunDecision.before_kpis.total_cost),
                        formatCurrency(selectedRunDecision.after_kpis.total_cost),
                        formatMetricDelta(selectedRunDecision.before_kpis.total_cost, selectedRunDecision.after_kpis.total_cost, 'currency'),
                      )}
                    </div>
                  ) : (
                    <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                      This run does not have a decision record with before and after KPI projections.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">State replay snapshot</div>
                  {selectedRunSummary ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Mode after run</div>
                        <div className="mt-2 text-[18px] font-bold text-nearBlack">{humanizeStatus(selectedRun.mode_after)}</div>
                      </div>
                      <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Active disruptions</div>
                        <div className="mt-2 text-[18px] font-bold text-nearBlack">{selectedRunSummary.active_events.length}</div>
                      </div>
                      <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Inventory tracked</div>
                        <div className="mt-2 text-[18px] font-bold text-nearBlack">{selectedRunState?.inventory.length ?? 0} items</div>
                      </div>
                      <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Suppliers tracked</div>
                        <div className="mt-2 text-[18px] font-bold text-nearBlack">{selectedRunState?.suppliers.length ?? 0} suppliers</div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                      Historical state snapshot is not available for this run.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Replay trace</div>
                    <div className="text-[12px] font-semibold uppercase tracking-wider text-secondaryGray">
                      {replaySteps.length} steps
                    </div>
                  </div>
                  {replaySteps.length ? (
                    <div className="space-y-3">
                      {replaySteps.map((step, index) => (
                        <div key={`${step.agent}-${step.started_at}-${index}`} className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-pureWhite px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                              Step {index + 1}
                            </span>
                            <span className="rounded-full bg-pureWhite px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                              {humanizeNode(step.agent)}
                            </span>
                            {(() => {
                              if (step.fallback_used) {
                                return (
                                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                                    Fallback
                                  </span>
                                );
                              }
                              if (step.llm_used) {
                                return (
                                  <span className="rounded-full bg-rausch/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-rausch">
                                    AI-assisted
                                  </span>
                                );
                              }
                              return (
                                <span className="rounded-full bg-pureWhite px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                                  Deterministic
                                </span>
                              );
                            })()}
                          </div>
                          <div className="mt-3 text-[15px] font-semibold text-nearBlack">{step.summary}</div>
                          <p className="mt-2 text-[13px] text-secondaryGray">
                            {humanizeReasoningSource(step.reasoning_source)} · {formatDurationMs(step.duration_ms ?? 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                      No replay trace was recorded for this run.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Execution log</div>
                  {selectedRunExecution ? (
                    <div className="space-y-3">
                      {selectedRunExecution.status_history.map((entry) => (
                        <div key={`${entry.status}-${entry.timestamp}`} className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-[15px] font-semibold text-nearBlack">{humanizeStatus(entry.status)}</div>
                            <div className="text-[12px] uppercase tracking-wider text-secondaryGray">{formatDateTime(entry.timestamp)}</div>
                          </div>
                          <p className="mt-2 text-[13px] text-secondaryGray">{entry.reason}</p>
                        </div>
                      ))}

                      {selectedRunExecution.receipts.length ? (
                        <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                          <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Execution receipts</div>
                          <div className="mt-3 space-y-2">
                            {selectedRunExecution.receipts.map((receipt) => (
                              <div key={receipt.receipt_id} className="flex flex-col gap-1 rounded-card border border-borderGray bg-lightSurface px-3 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-medium text-nearBlack">{humanizeAction(receipt.action_id)}</span>
                                <span className="text-secondaryGray">{receipt.detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                      No execution record is attached to this run.
                    </div>
                  )}
                </div>
              </div>

              <ReflectionMemoryPanel
                reflections={selectedRunReflections}
                title="Learning record"
                description="Reflection notes and follow-up checks linked specifically to the selected run."
                emptyMessage="No reflection note was stored for this run."
              />
            </div>
          ) : (
            <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
              Select a run from the ledger to inspect its detail, replay trace, KPI impact, and execution history.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

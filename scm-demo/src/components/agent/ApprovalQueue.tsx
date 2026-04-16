import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import type {
  ApprovalAction,
  CandidateEvaluationView,
  ApprovalDetailView,
  EventView,
  PendingApprovalView,
} from "../../lib/types";
import {
  describeActionTarget,
  describeActionTitle,
  formatCurrency,
  formatMetricDelta,
  formatPercent,
  humanizeAction,
  humanizeEvent,
  humanizeStrategy,
  severitySummary,
} from "../../lib/presenters";
import {
  ProjectedStateSummaryCard,
  eventSummary,
} from "./AgentShared";

interface ApprovalQueueProps {
  pendingApproval: PendingApprovalView | null;
  approvalDetail: ApprovalDetailView | null;
  actionLoading: string | null;
  currentEvent: EventView | null;
  selectedEvaluation: CandidateEvaluationView | null;
  alternativePlans: CandidateEvaluationView[];
  onApprovalAction: (
    action: ApprovalAction,
    decisionId: string,
  ) => Promise<void>;
  onSelectAlternative: (
    decisionId: string,
    strategyLabel: string,
  ) => Promise<void>;
}

function actionTypeCounts(
  approvalDetail: ApprovalDetailView,
): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  for (const action of approvalDetail.plan.actions) {
    counts.set(action.action_type, (counts.get(action.action_type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => right.count - left.count);
}

function deltaTone(delta: string): string {
  if (delta.startsWith("+")) return "text-rausch";
  if (delta.startsWith("-")) return "text-green-700";
  return "text-nearBlack";
}

function CompactKpiCard({
  label,
  before,
  after,
  delta,
}: {
  label: string;
  before: string;
  after: string;
  delta: string;
}) {
  return (
    <div className="rounded-[18px] border border-borderGray bg-pureWhite px-4 py-3 shadow-sm">
      <div className="border-b border-borderGray/30 pb-2 text-[10px] font-black uppercase tracking-widest text-secondaryGray">
        {label}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
            Before
          </div>
          <div className="mt-1 text-[14px] font-bold text-nearBlack">{before}</div>
        </div>
        <div className={`text-[12px] font-black ${deltaTone(delta)}`}>{delta}</div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
            After
          </div>
          <div className="mt-1 text-[14px] font-bold text-nearBlack">{after}</div>
        </div>
      </div>
    </div>
  );
}

function CompactTimeline({
  evaluation,
}: {
  evaluation: CandidateEvaluationView;
}) {
  if (!evaluation.projection_steps.length) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
        3-day outlook
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {evaluation.projection_steps.slice(0, 3).map((step) => (
          <div
            key={step.label}
            className="rounded-[16px] border border-borderGray bg-pureWhite px-3 py-2 text-[11px] text-secondaryGray"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-nearBlack">{step.label}</span>
              <span>{formatPercent(step.kpis.service_level)}</span>
            </div>
            <div className="mt-1 space-y-0.5">
              <div>Risk {formatPercent(step.kpis.disruption_risk)}</div>
              <div>At risk {step.inventory_at_risk}</div>
              <div>Backlog {step.backlog_units}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactAlternativeCard({
  item,
  decisionId,
  actionLoading,
  expanded,
  onToggle,
  onSelectAlternative,
}: {
  item: CandidateEvaluationView;
  decisionId: string;
  actionLoading: string | null;
  expanded: boolean;
  onToggle: () => void;
  onSelectAlternative: (
    decisionId: string,
    strategyLabel: string,
  ) => Promise<void>;
}) {
  return (
    <div className="rounded-[20px] border border-borderGray bg-pureWhite p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold text-nearBlack">
            {humanizeStrategy(item.strategy_label)}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-secondaryGray">
            Score {item.score.toFixed(3)}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1.5 rounded-xl border border-borderGray px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Hide details" : "View details"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-secondaryGray lg:grid-cols-4">
        <div className="rounded-[14px] border border-borderGray bg-lightSurface/50 px-3 py-2">
          Service <span className="font-semibold text-nearBlack">{formatPercent(item.projected_kpis.service_level)}</span>
        </div>
        <div className="rounded-[14px] border border-borderGray bg-lightSurface/50 px-3 py-2">
          Risk <span className="font-semibold text-nearBlack">{formatPercent(item.projected_kpis.disruption_risk)}</span>
        </div>
        <div className="rounded-[14px] border border-borderGray bg-lightSurface/50 px-3 py-2">
          Recovery <span className="font-semibold text-nearBlack">{formatPercent(item.projected_kpis.recovery_speed)}</span>
        </div>
        <div className="rounded-[14px] border border-borderGray bg-lightSurface/50 px-3 py-2">
          Cost <span className="font-semibold text-nearBlack">{formatCurrency(item.projected_kpis.total_cost)}</span>
        </div>
      </div>

      <div className="mt-3">
        <CompactTimeline evaluation={item} />
      </div>

      <div className="mt-3 text-[12px] text-secondaryGray line-clamp-1">
        {item.projection_summary || item.rationale}
      </div>

      {expanded ? (
        <div className="mt-3 rounded-[16px] border border-borderGray bg-lightSurface/50 px-3 py-3 text-[12px] leading-5 text-secondaryGray">
          <div>{item.rationale}</div>
          {item.projected_state_summary ? (
            <div className="mt-2 text-[11px] font-semibold text-nearBlack">
              End-state: {item.projected_state_summary.summary}
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        onClick={() =>
          void onSelectAlternative(
            decisionId,
            item.strategy_label,
          )
        }
        disabled={actionLoading !== null}
        className="mt-3 w-full rounded-card border border-borderGray bg-pureWhite px-3 py-2 text-[13px] font-semibold text-nearBlack transition hover:bg-lightSurface disabled:bg-lightSurface disabled:text-secondaryGray"
      >
        {actionLoading === `approval:select:${item.strategy_label}`
          ? "Switching..."
          : `Use ${humanizeStrategy(item.strategy_label)}`}
      </button>
    </div>
  );
}

export function ApprovalQueue({
  pendingApproval,
  approvalDetail,
  actionLoading,
  currentEvent,
  selectedEvaluation,
  alternativePlans,
  onApprovalAction,
  onSelectAlternative,
}: ApprovalQueueProps) {
  const saferPlanAllowed = approvalDetail
    ? approvalDetail.allowed_actions.includes("safer_plan")
    : false;
  const [showAllActions, setShowAllActions] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedAlternative, setExpandedAlternative] = useState<string | null>(null);

  const actionMix = useMemo(
    () => (approvalDetail ? actionTypeCounts(approvalDetail) : []),
    [approvalDetail],
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[24px] font-bold text-nearBlack">Approval Queue</h2>
        <p className="mt-1 text-[14px] text-secondaryGray">
          Review blocked recommendations, compare projected impact, and decide whether to approve, reject, or switch to a safer option.
        </p>
      </div>

      <div className="rounded-[24px] border border-borderGray bg-pureWhite p-5 shadow-card">
        {pendingApproval && approvalDetail ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 text-amber-700" size={22} />
                <div>
                  <h3 className="text-[22px] font-bold text-nearBlack">
                    Approval required
                  </h3>
                  <p className="mt-1 text-[14px] text-secondaryGray">
                    {approvalDetail.approval_reason}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  onClick={() =>
                    void onApprovalAction("approve", approvalDetail.decision_id)
                  }
                  disabled={actionLoading !== null}
                  className="rounded-card bg-nearBlack px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-nearBlack/20 disabled:text-nearBlack/40"
                >
                  {actionLoading === "approval:approve"
                    ? "Applying..."
                    : "Approve and execute"}
                </button>
                <button
                  onClick={() =>
                    void onApprovalAction(
                      "safer_plan",
                      approvalDetail.decision_id,
                    )
                  }
                  disabled={actionLoading !== null || !saferPlanAllowed}
                  className="rounded-card bg-rausch px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-rausch/30"
                >
                  {actionLoading === "approval:safer_plan"
                    ? "Rebuilding..."
                    : saferPlanAllowed
                      ? "Request safer alternative"
                      : "Safer alternative requested"}
                </button>
                <button
                  onClick={() =>
                    void onApprovalAction("reject", approvalDetail.decision_id)
                  }
                  disabled={actionLoading !== null}
                  className="rounded-card border border-borderGray bg-pureWhite px-4 py-3 text-[14px] font-bold text-nearBlack disabled:bg-lightSurface"
                >
                  {actionLoading === "approval:reject"
                    ? "Rejecting..."
                    : "Reject"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.92fr]">
              <div className="space-y-4">
                <div className="rounded-[20px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                        Selected plan summary
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <div className="text-[20px] font-bold text-nearBlack">
                          {humanizeStrategy(approvalDetail.plan.strategy_label)}
                        </div>
                        <span className="rounded-badge bg-rausch/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rausch">
                          Score {approvalDetail.plan.score.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedSummary((current) => !current)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-borderGray bg-pureWhite px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
                    >
                      {expandedSummary ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {expandedSummary ? "Hide details" : "View details"}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] text-secondaryGray">
                    <div className="rounded-[14px] border border-borderGray bg-pureWhite px-3 py-2.5">
                      <div className="uppercase tracking-wider text-secondaryGray">Worst service</div>
                      <div className="mt-1 font-bold text-nearBlack">
                        {formatPercent(
                          selectedEvaluation?.worst_case_kpis?.service_level ??
                            approvalDetail.after_kpis.service_level,
                        )}
                      </div>
                    </div>
                    <div className="rounded-[14px] border border-borderGray bg-pureWhite px-3 py-2.5">
                      <div className="uppercase tracking-wider text-secondaryGray">Peak risk</div>
                      <div className="mt-1 font-bold text-nearBlack">
                        {formatPercent(
                          selectedEvaluation?.worst_case_kpis?.disruption_risk ??
                            approvalDetail.after_kpis.disruption_risk,
                        )}
                      </div>
                    </div>
                    <div className="rounded-[14px] border border-borderGray bg-pureWhite px-3 py-2.5">
                      <div className="uppercase tracking-wider text-secondaryGray">Recovery</div>
                      <div className="mt-1 font-bold text-nearBlack">
                        {formatPercent(approvalDetail.after_kpis.recovery_speed)}
                      </div>
                    </div>
                  </div>

                  <p
                    className={`mt-3 text-[13px] leading-6 text-secondaryGray ${
                      expandedSummary ? "" : "line-clamp-4"
                    }`}
                  >
                    {approvalDetail.selection_reason ||
                      approvalDetail.plan.planner_reasoning}
                  </p>
                  {expandedSummary && selectedEvaluation?.projection_summary ? (
                    <p className="mt-2 text-[12px] leading-5 text-secondaryGray">
                      {selectedEvaluation.projection_summary}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[20px] border border-borderGray bg-pureWhite shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderGray/30 bg-lightSurface/40 px-4 py-3">
                    <div>
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                        Actions to be executed
                      </div>
                      <div className="mt-1 text-[14px] font-bold text-nearBlack">
                        {approvalDetail.plan.actions.length} actions in package
                      </div>
                    </div>
                    {approvalDetail.plan.actions.length > 6 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllActions((current) => !current)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-borderGray bg-pureWhite px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
                      >
                        {showAllActions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {showAllActions ? "Collapse" : `Show all ${approvalDetail.plan.actions.length}`}
                      </button>
                    ) : null}
                  </div>

                  <div className="border-b border-borderGray/30 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {actionMix.map((item) => (
                        <span
                          key={item.type}
                          className="rounded-full border border-borderGray bg-lightSurface px-3 py-1 text-[11px] font-bold text-secondaryGray"
                        >
                          {humanizeAction(item.type)} x{item.count}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-[330px] divide-y divide-borderGray/30 overflow-y-auto custom-scrollbar">
                    {(showAllActions
                      ? approvalDetail.plan.actions
                      : approvalDetail.plan.actions.slice(0, 6)
                    ).map((action) => (
                      <div
                        key={action.action_id}
                        className="flex items-start gap-3 px-4 py-3"
                      >
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-rausch" />
                        <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-[13px] font-bold text-nearBlack">
                          {describeActionTitle(action.action_type, action.target_id)}
                        </div>
                          <div className="mt-1 text-[11px] text-secondaryGray">
                            {describeActionTarget(action.action_type, action.target_id)}
                          </div>
                          <div className="mt-1 text-[12px] line-clamp-1 text-secondaryGray">
                            {action.reason}
                          </div>
                          <div className="mt-1 text-[11px] text-secondaryGray/90">
                            Recovery {action.estimated_recovery_hours.toFixed(1)}h
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[11px] text-secondaryGray">
                          <div className="font-bold text-nearBlack">
                            {action.estimated_cost_delta > 0
                              ? `+$${action.estimated_cost_delta.toLocaleString()}`
                              : "Minimal cost"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-borderGray bg-pureWhite px-4 py-4 shadow-sm">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Disruption trigger
                  </div>
                  <div className="mt-2 text-[15px] font-bold text-nearBlack">
                    {currentEvent
                      ? humanizeEvent(currentEvent.type)
                      : `${approvalDetail.event_ids.length} linked disruption signals`}
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-secondaryGray">
                    {currentEvent
                      ? `${eventSummary(currentEvent)}. ${severitySummary(currentEvent.severity)}.`
                      : "This recommendation package is linked to a previously recorded disruption."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[20px] border border-borderGray bg-pureWhite px-4 py-4 shadow-sm">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Projected KPI impact
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CompactKpiCard
                      label="Service level"
                      before={formatPercent(approvalDetail.before_kpis.service_level)}
                      after={formatPercent(approvalDetail.after_kpis.service_level)}
                      delta={formatMetricDelta(
                        approvalDetail.before_kpis.service_level,
                        approvalDetail.after_kpis.service_level,
                        "percent",
                      )}
                    />
                    <CompactKpiCard
                      label="Disruption risk"
                      before={formatPercent(approvalDetail.before_kpis.disruption_risk)}
                      after={formatPercent(approvalDetail.after_kpis.disruption_risk)}
                      delta={formatMetricDelta(
                        approvalDetail.before_kpis.disruption_risk,
                        approvalDetail.after_kpis.disruption_risk,
                        "percent",
                      )}
                    />
                    <CompactKpiCard
                      label="Recovery speed"
                      before={formatPercent(approvalDetail.before_kpis.recovery_speed)}
                      after={formatPercent(approvalDetail.after_kpis.recovery_speed)}
                      delta={formatMetricDelta(
                        approvalDetail.before_kpis.recovery_speed,
                        approvalDetail.after_kpis.recovery_speed,
                        "percent",
                      )}
                    />
                    <CompactKpiCard
                      label="Total cost"
                      before={formatCurrency(approvalDetail.before_kpis.total_cost)}
                      after={formatCurrency(approvalDetail.after_kpis.total_cost)}
                      delta={formatMetricDelta(
                        approvalDetail.before_kpis.total_cost,
                        approvalDetail.after_kpis.total_cost,
                        "currency",
                      )}
                    />
                  </div>
                </div>

                {selectedEvaluation ? (
                  <div className="space-y-4">
                    <div className="rounded-[20px] border border-borderGray bg-pureWhite px-4 py-4 shadow-sm">
                      <CompactTimeline evaluation={selectedEvaluation} />
                    </div>
                    {selectedEvaluation.projected_state_summary ? (
                      <ProjectedStateSummaryCard
                        summary={selectedEvaluation.projected_state_summary}
                      />
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-4">
                  <div className="text-[12px] uppercase tracking-wider text-amber-800">
                    Risk explanation
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-amber-900">
                    {approvalDetail.approval_reason}
                  </p>
                  {selectedEvaluation?.projection_summary ? (
                    <p className="mt-2 text-[12px] leading-5 text-amber-900">
                      {selectedEvaluation.projection_summary}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {alternativePlans.length > 0 ? (
              <div>
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                  Alternative plans
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {alternativePlans.slice(0, 2).map((item) => (
                    <CompactAlternativeCard
                      key={item.strategy_label}
                      item={item}
                      decisionId={approvalDetail.decision_id}
                      actionLoading={actionLoading}
                      expanded={expandedAlternative === item.strategy_label}
                      onToggle={() =>
                        setExpandedAlternative((current) =>
                          current === item.strategy_label ? null : item.strategy_label,
                        )
                      }
                      onSelectAlternative={onSelectAlternative}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
            No plans are awaiting approval. High-risk recommendations will appear here with KPI impact, selected actions, and alternatives for review.
          </div>
        )}
      </div>
    </section>
  );
}

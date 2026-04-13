import { CheckCircle2, ShieldAlert } from "lucide-react";
import type {
  ApprovalAction,
  CandidateEvaluationView,
  ApprovalDetailView,
  EventView,
  PendingApprovalView,
  TraceView,
} from "../../lib/types";
import {
  describeActionTarget,
  describeActionTitle,
  formatCurrency,
  formatMetricDelta,
  formatPercent,
  humanizeEvent,
  humanizeStrategy,
  severitySummary,
} from "../../lib/presenters";
import { CandidatePlanCard, eventSummary, kpiRow } from "./AgentShared";

interface ApprovalQueueProps {
  pendingApproval: PendingApprovalView | null;
  approvalDetail: ApprovalDetailView | null;
  actionLoading: string | null;
  currentEvent: EventView | null;
  alternativePlans: CandidateEvaluationView[];
  onApprovalAction: (
    action: ApprovalAction,
    decisionId: string,
  ) => Promise<void>;
}

export function ApprovalQueue({
  pendingApproval,
  approvalDetail,
  actionLoading,
  currentEvent,
  alternativePlans,
  onApprovalAction,
}: ApprovalQueueProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[24px] font-bold text-nearBlack">Approval Queue</h2>
        <p className="mt-1 text-[14px] text-secondaryGray">
          Review blocked recommendations, understand KPI impact, and decide
          whether to approve, reject, or request a safer alternative.
        </p>
      </div>

      <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
        {pendingApproval && approvalDetail ? (
          <div className="space-y-6">
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
                  <p className="mt-2 text-[13px] text-secondaryGray">
                    {humanizeStrategy(approvalDetail.plan.strategy_label)}{" "}
                    action package prepared for operator review.
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  onClick={() =>
                    void onApprovalAction("approve", approvalDetail.decision_id)
                  }
                  disabled={actionLoading !== null}
                  className="rounded-card bg-nearBlack px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-nearBlack/20 disabled:text-nearBlack/40">
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
                  disabled={actionLoading !== null}
                  className="rounded-card bg-rausch px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-rausch/30">
                  {actionLoading === "approval:safer_plan"
                    ? "Rebuilding..."
                    : "Request safer alternative"}
                </button>
                <button
                  onClick={() =>
                    void onApprovalAction("reject", approvalDetail.decision_id)
                  }
                  disabled={actionLoading !== null}
                  className="rounded-card border border-borderGray bg-pureWhite px-4 py-3 text-[14px] font-bold text-nearBlack disabled:bg-lightSurface">
                  {actionLoading === "approval:reject"
                    ? "Rejecting..."
                    : "Reject"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-5">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Selected plan summary
                  </div>
                  <div className="mt-2 text-[20px] font-bold text-nearBlack">
                    {humanizeStrategy(approvalDetail.plan.strategy_label)}
                  </div>
                  <p className="mt-2 text-[14px] text-secondaryGray">
                    {approvalDetail.selection_reason ||
                      approvalDetail.plan.planner_reasoning}
                  </p>
                </div>

                <div className="rounded-card border border-borderGray bg-pureWhite px-5 py-5">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Disruption trigger
                  </div>
                  <div className="mt-2 text-[16px] font-bold text-nearBlack">
                    {currentEvent
                      ? humanizeEvent(currentEvent.type)
                      : `${approvalDetail.event_ids.length} linked disruption signals`}
                  </div>
                  <p className="mt-2 text-[14px] text-secondaryGray">
                    {currentEvent
                      ? `${eventSummary(currentEvent)}. ${severitySummary(currentEvent.severity)}.`
                      : "This recommendation package is linked to a previously recorded disruption."}
                  </p>
                </div>

                <div>
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Actions to be executed
                  </div>
                  <div className="mt-3 space-y-3">
                    {approvalDetail.plan.actions.map((action) => (
                      <div
                        key={action.action_id}
                        className="rounded-card border border-borderGray px-4 py-4">
                        <div className="flex items-center gap-2 text-[15px] font-bold text-nearBlack">
                          <CheckCircle2 size={16} className="text-rausch" />
                          {describeActionTitle(
                            action.action_type,
                            action.target_id,
                          )}
                        </div>
                        <p className="mt-2 text-[14px] text-secondaryGray">
                          {action.reason}
                        </p>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] uppercase tracking-wider text-secondaryGray sm:grid-cols-2">
                          <div>
                            {describeActionTarget(
                              action.action_type,
                              action.target_id,
                            )}
                          </div>
                          <div>
                            Recovery window{" "}
                            {action.estimated_recovery_hours.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Projected KPI impact
                  </div>
                  <div className="mt-3 space-y-3">
                    {kpiRow(
                      "Service level",
                      formatPercent(approvalDetail.before_kpis.service_level),
                      formatPercent(approvalDetail.after_kpis.service_level),
                      formatMetricDelta(
                        approvalDetail.before_kpis.service_level,
                        approvalDetail.after_kpis.service_level,
                        "percent",
                      ),
                    )}
                    {kpiRow(
                      "Disruption risk",
                      formatPercent(approvalDetail.before_kpis.disruption_risk),
                      formatPercent(approvalDetail.after_kpis.disruption_risk),
                      formatMetricDelta(
                        approvalDetail.before_kpis.disruption_risk,
                        approvalDetail.after_kpis.disruption_risk,
                        "percent",
                      ),
                    )}
                    {kpiRow(
                      "Recovery speed",
                      formatPercent(approvalDetail.before_kpis.recovery_speed),
                      formatPercent(approvalDetail.after_kpis.recovery_speed),
                      formatMetricDelta(
                        approvalDetail.before_kpis.recovery_speed,
                        approvalDetail.after_kpis.recovery_speed,
                        "percent",
                      ),
                    )}
                    {kpiRow(
                      "Total cost",
                      formatCurrency(approvalDetail.before_kpis.total_cost),
                      formatCurrency(approvalDetail.after_kpis.total_cost),
                      formatMetricDelta(
                        approvalDetail.before_kpis.total_cost,
                        approvalDetail.after_kpis.total_cost,
                        "currency",
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-4">
                  <div className="text-[12px] uppercase tracking-wider text-amber-800">
                    Risk explanation
                  </div>
                  <p className="mt-2 text-[14px] text-amber-900">
                    {approvalDetail.approval_reason}
                  </p>
                </div>
              </div>
            </div>

            {alternativePlans.length > 0 ? (
              <div>
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                  Alternative plans
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {alternativePlans.slice(0, 2).map((item) => (
                    <CandidatePlanCard
                      key={item.strategy_label}
                      evaluation={item}
                      selected={false}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
            No plans are awaiting approval. High-risk recommendations will
            appear here with KPI impact, selected actions, and alternatives for
            review.
          </div>
        )}
      </div>
    </section>
  );
}

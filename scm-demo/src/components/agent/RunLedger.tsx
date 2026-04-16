import { useMemo, useState } from "react";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import type {
  ControlTowerStateView,
  DecisionLogDetailView,
  ExecutionRecordView,
  RunView,
  TraceView,
} from "../../lib/types";
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
  severitySummary,
} from "../../lib/presenters";
import {
  causalTone,
  eventSummary,
} from "./AgentShared";

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

type StoryStepKey = "signal" | "plan" | "approval" | "execution" | "learning";

type TimelineItem = {
  key: string;
  timestamp: string;
  title: string;
  detail: string;
  kind: "trace" | "execution" | "summary";
};

function runCardTone(selected: boolean): string {
  return selected
    ? "border-nearBlack bg-nearBlack text-pureWhite shadow-card"
    : "border-borderGray bg-pureWhite text-nearBlack hover:border-nearBlack/30 hover:bg-lightSurface";
}

function historyEventTitle(run: RunView, trace: TraceView | null): string {
  if (trace?.event) {
    return humanizeEvent(trace.event.type);
  }
  if (run.run_type === "daily_cycle") {
    return "Planning cycle request";
  }
  if (run.run_type === "approval_resolution") {
    return "Approval decision received";
  }
  return humanizeLabel(run.run_type);
}

function timelineItems(
  run: RunView,
  trace: TraceView | null,
  execution: ExecutionRecordView | null,
): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      key: `run-start-${run.run_id}`,
      timestamp: run.started_at,
      title: historyEventTitle(run, trace),
      detail:
        trace?.event
          ? `${eventSummary(trace.event)}. ${severitySummary(trace.event.severity)}.`
          : `Run started as ${humanizeLabel(run.run_type)}.`,
      kind: "summary",
    },
  ];

  for (const [index, step] of (trace?.steps ?? []).entries()) {
    items.push({
      key: `${step.agent}-${step.started_at}-${index}`,
      timestamp: step.started_at,
      title: `${humanizeNode(step.agent)} · ${step.summary}`,
      detail: `${humanizeReasoningSource(step.reasoning_source)} · ${formatDurationMs(step.duration_ms ?? 0)}`,
      kind: "trace",
    });
  }

  if (trace?.selected_strategy) {
    items.push({
      key: `plan-${run.run_id}`,
      timestamp: trace.completed_at ?? run.completed_at ?? run.started_at,
      title: `Plan selected · ${humanizeStrategy(trace.selected_strategy)}`,
      detail:
        trace.selection_reason ??
        "The planner selected the final execution package for this run.",
      kind: "summary",
    });
  }

  for (const entry of execution?.status_history ?? []) {
    items.push({
      key: `${entry.status}-${entry.timestamp}`,
      timestamp: entry.timestamp,
      title: `Execution · ${humanizeStatus(entry.status)}`,
      detail: entry.reason,
      kind: "execution",
    });
  }

  return items.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

function storyStepSummary(
  key: StoryStepKey,
  run: RunView,
  trace: TraceView | null,
  decision: DecisionLogDetailView | null,
  execution: ExecutionRecordView | null,
  reflectionsCount: number,
) {
  switch (key) {
    case "signal":
      return {
        title: "Signal",
        value: trace?.event ? humanizeEvent(trace.event.type) : historyEventTitle(run, trace),
        detail: trace?.event
          ? `${severitySummary(trace.event.severity)} · ${humanizeLabel(trace.event.source)}`
          : "Started from operator or scheduled trigger",
      };
    case "plan":
      return {
        title: "Plan",
        value: run.selected_plan_summary?.strategy_label
          ? humanizeStrategy(run.selected_plan_summary.strategy_label)
          : "No plan selected",
        detail:
          decision?.selection_reason ??
          decision?.rationale ??
          "No explicit plan narrative recorded.",
      };
    case "approval":
      return {
        title: "Approval",
        value: run.approval_status ? humanizeStatus(run.approval_status) : "No approval gate",
        detail:
          decision?.approval_reason ??
          run.selected_plan_summary?.approval_reason ??
          "No operator checkpoint was required.",
      };
    case "execution":
      return {
        title: "Execution",
        value: execution?.status
          ? humanizeStatus(execution.status)
          : run.execution_summary?.status
            ? humanizeStatus(run.execution_summary.status)
            : "No execution log",
        detail:
          execution?.status_history[execution.status_history.length - 1]?.reason ??
          run.execution_summary?.dispatch_mode ??
          "Execution details were not recorded.",
      };
    case "learning":
      return {
        title: "Learning",
        value: reflectionsCount ? "Recorded" : "None",
        detail: reflectionsCount
          ? "Reflection notes were captured for this run."
          : "No learning note was stored for this run.",
      };
  }
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
  const selectedRunExecutionStatus =
    selectedRunExecution?.status ?? selectedRun?.execution_summary?.status ?? null;
  const selectedRunReflections =
    selectedRunState?.reflections.filter((item) => item.run_id === selectedRun?.run_id) ?? [];
  const [activeStoryStep, setActiveStoryStep] = useState<StoryStepKey>("signal");

  const lifecycleSteps: StoryStepKey[] = [
    "signal",
    "plan",
    "approval",
    "execution",
    "learning",
  ];

  const timeline = useMemo(
    () =>
      selectedRun
        ? timelineItems(selectedRun, selectedRunTrace, selectedRunExecution)
        : [],
    [selectedRun, selectedRunExecution, selectedRunTrace],
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[24px] font-bold text-nearBlack">Run Ledger</h2>
        <p className="mt-1 text-[14px] text-secondaryGray">
          Review completed runs as a single execution story: what triggered the run, what plan was chosen, what changed, and what the system learned.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                Past runs
              </div>
              <div className="mt-1 text-[20px] font-bold text-nearBlack">
                {runHistory.length} recorded runs
              </div>
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
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          isSelected
                            ? "bg-pureWhite/15 text-pureWhite"
                            : "bg-lightSurface text-secondaryGray"
                        }`}
                      >
                        {humanizeLabel(run.run_type)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          isSelected
                            ? "bg-pureWhite/15 text-pureWhite"
                            : "bg-lightSurface text-secondaryGray"
                        }`}
                      >
                        {humanizeStatus(run.status)}
                      </span>
                      {run.approval_status ? (
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                            isSelected
                              ? "bg-pureWhite/15 text-pureWhite"
                              : "bg-lightSurface text-secondaryGray"
                          }`}
                        >
                          {humanizeStatus(run.approval_status)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-[16px] font-bold">
                      {historyEventTitle(run, isSelected ? selectedRunTrace : null)}
                    </div>
                    <p
                      className={`mt-2 text-[13px] ${
                        isSelected ? "text-pureWhite/80" : "text-secondaryGray"
                      }`}
                    >
                      {formatDateTime(run.started_at)} · {formatDurationMs(run.duration_ms)} · {humanizeStatus(run.mode_before)} to {humanizeStatus(run.mode_after)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
          {selectedRun ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Selected run
                  </div>
                  <h3 className="mt-2 text-[22px] font-bold text-nearBlack">
                    {historyEventTitle(selectedRun, selectedRunTrace)}
                  </h3>
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

              <div className="rounded-[20px] border border-borderGray bg-pureWhite shadow-sm">
                <div className="grid grid-cols-2 gap-px bg-borderGray/30 md:grid-cols-6">
                  <div className="bg-lightSurface/40 px-4 py-4 md:col-span-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                      Run summary
                    </div>
                    <div className="mt-1 text-[17px] font-bold text-nearBlack">
                      {humanizeLabel(selectedRun.run_type)}
                    </div>
                  </div>
                  <div className="bg-lightSurface/40 px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                      Final status
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {humanizeStatus(selectedRun.approval_status ?? selectedRun.status)}
                    </div>
                  </div>
                  <div className="bg-lightSurface/40 px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                      Mode
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {humanizeStatus(selectedRun.mode_after)}
                    </div>
                  </div>
                  <div className="bg-lightSurface/40 px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                      Service
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {selectedRunDecision
                        ? formatMetricDelta(
                            selectedRunDecision.before_kpis.service_level,
                            selectedRunDecision.after_kpis.service_level,
                            "percent",
                          )
                        : "--"}
                    </div>
                  </div>
                  <div className="bg-lightSurface/40 px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                      Risk
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {selectedRunDecision
                        ? formatMetricDelta(
                            selectedRunDecision.before_kpis.disruption_risk,
                            selectedRunDecision.after_kpis.disruption_risk,
                            "percent",
                          )
                        : "--"}
                    </div>
                  </div>
                  <div className="bg-lightSurface/40 px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                      Cost
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {selectedRunDecision
                        ? formatMetricDelta(
                            selectedRunDecision.before_kpis.total_cost,
                            selectedRunDecision.after_kpis.total_cost,
                            "currency",
                          )
                        : "--"}
                    </div>
                  </div>
                  <div className="bg-lightSurface/40 px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                      Recovery
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {selectedRunDecision
                        ? formatMetricDelta(
                            selectedRunDecision.before_kpis.recovery_speed,
                            selectedRunDecision.after_kpis.recovery_speed,
                            "percent",
                          )
                        : "--"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                  Run lifecycle
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-5">
                  {lifecycleSteps.map((step) => {
                    const summary = storyStepSummary(
                      step,
                      selectedRun,
                      selectedRunTrace,
                      selectedRunDecision,
                      selectedRunExecution,
                      selectedRunReflections.length,
                    );
                    const isActive = activeStoryStep === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setActiveStoryStep(step)}
                        className={`rounded-full border px-4 py-3 text-left transition-all ${
                          isActive
                            ? "border-nearBlack bg-nearBlack text-pureWhite shadow-card"
                            : "border-borderGray bg-pureWhite hover:bg-lightSurface"
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-widest">
                          {summary.title}
                        </div>
                        <div className="mt-1 text-[13px] font-bold">{summary.value}</div>
                      </button>
                    );
                  })}
                </div>
                <div className={`rounded-card border px-4 py-4 ${causalTone("plan")}`}>
                  <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                    {storyStepSummary(
                      activeStoryStep,
                      selectedRun,
                      selectedRunTrace,
                      selectedRunDecision,
                      selectedRunExecution,
                      selectedRunReflections.length,
                    ).title}
                  </div>
                  <div className="mt-2 text-[15px] font-bold text-nearBlack">
                    {storyStepSummary(
                      activeStoryStep,
                      selectedRun,
                      selectedRunTrace,
                      selectedRunDecision,
                      selectedRunExecution,
                      selectedRunReflections.length,
                    ).value}
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-secondaryGray">
                    {storyStepSummary(
                      activeStoryStep,
                      selectedRun,
                      selectedRunTrace,
                      selectedRunDecision,
                      selectedRunExecution,
                      selectedRunReflections.length,
                    ).detail}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                  Impact & State
                </div>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {selectedRunDecision ? (
                      <>
                        <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                            Service level
                          </div>
                          <div className="mt-2 text-[18px] font-bold text-nearBlack">
                            {formatPercent(selectedRunDecision.after_kpis.service_level)}
                          </div>
                          <div className="mt-1 text-[12px] text-secondaryGray">
                            {formatMetricDelta(
                              selectedRunDecision.before_kpis.service_level,
                              selectedRunDecision.after_kpis.service_level,
                              "percent",
                            )}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                            Disruption risk
                          </div>
                          <div className="mt-2 text-[18px] font-bold text-nearBlack">
                            {formatPercent(selectedRunDecision.after_kpis.disruption_risk)}
                          </div>
                          <div className="mt-1 text-[12px] text-secondaryGray">
                            {formatMetricDelta(
                              selectedRunDecision.before_kpis.disruption_risk,
                              selectedRunDecision.after_kpis.disruption_risk,
                              "percent",
                            )}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                            Recovery speed
                          </div>
                          <div className="mt-2 text-[18px] font-bold text-nearBlack">
                            {formatPercent(selectedRunDecision.after_kpis.recovery_speed)}
                          </div>
                          <div className="mt-1 text-[12px] text-secondaryGray">
                            {formatMetricDelta(
                              selectedRunDecision.before_kpis.recovery_speed,
                              selectedRunDecision.after_kpis.recovery_speed,
                              "percent",
                            )}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                            Total cost
                          </div>
                          <div className="mt-2 text-[18px] font-bold text-nearBlack">
                            {formatCurrency(selectedRunDecision.after_kpis.total_cost)}
                          </div>
                          <div className="mt-1 text-[12px] text-secondaryGray">
                            {formatMetricDelta(
                              selectedRunDecision.before_kpis.total_cost,
                              selectedRunDecision.after_kpis.total_cost,
                              "currency",
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray sm:col-span-2">
                        This run does not have a decision record with before and after KPI projections.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                        Mode
                      </div>
                      <div className="mt-2 text-[18px] font-bold text-nearBlack">
                        {humanizeStatus(selectedRun.mode_after)}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                        Disruptions
                      </div>
                      <div className="mt-2 text-[18px] font-bold text-nearBlack">
                        {selectedRunSummary?.active_events.length ?? 0}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                        Inventory
                      </div>
                      <div className="mt-2 text-[18px] font-bold text-nearBlack">
                        {selectedRunState?.inventory.length ?? 0}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 px-4 py-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                        Suppliers
                      </div>
                      <div className="mt-2 text-[18px] font-bold text-nearBlack">
                        {selectedRunState?.suppliers.length ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                  Execution Timeline
                </div>
                {timeline.length ? (
                  <div className="space-y-3">
                    {timeline.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-[18px] border border-borderGray bg-lightSurface/50 px-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {item.kind === "execution" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-700" />
                            ) : (
                              <Circle className="h-4 w-4 text-secondaryGray" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-[14px] font-bold text-nearBlack">
                                {item.title}
                              </div>
                              <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                                {formatDateTime(item.timestamp)}
                              </div>
                            </div>
                            <p className="mt-1 text-[13px] leading-6 text-secondaryGray">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedRunExecution?.receipts.length ? (
                      <div className="rounded-[18px] border border-borderGray bg-pureWhite px-4 py-4">
                        <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                          Execution receipts
                        </div>
                        <div className="mt-3 space-y-2">
                          {selectedRunExecution.receipts.map((receipt) => (
                            <div
                              key={receipt.receipt_id}
                              className="flex flex-col gap-1 rounded-card border border-borderGray bg-lightSurface px-3 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between"
                            >
                              <span className="font-medium text-nearBlack">
                                {humanizeAction(receipt.action_id)}
                              </span>
                              <span className="text-secondaryGray">{receipt.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                    No execution timeline was recorded for this run.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                  Learning Record
                </div>
                {selectedRunReflections.length ? (
                  <div className="rounded-[18px] border border-borderGray bg-pureWhite px-4 py-4">
                    <div className="text-[15px] font-bold text-nearBlack">
                      {selectedRunReflections[0]?.summary}
                    </div>
                    {selectedRunReflections[0]?.lessons.length ? (
                      <div className="mt-3 space-y-2">
                        {selectedRunReflections[0].lessons.map((lesson) => (
                          <div
                            key={lesson}
                            className="rounded-card border border-borderGray bg-lightSurface px-3 py-3 text-[13px] text-secondaryGray"
                          >
                            {lesson}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4 text-[13px] text-secondaryGray">
                    No learning note was stored for this run.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
              Select a run from the ledger to inspect its summary, impact, execution timeline, and learning record.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

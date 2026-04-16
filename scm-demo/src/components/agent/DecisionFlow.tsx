import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import type {
  CandidateEvaluationView,
  ControlTowerSummaryResponse,
  KPIView,
  PlanView,
  ReflectionView,
  TraceView,
} from "../../lib/types";
import {
  formatCurrency,
  formatPercent,
  humanizeStrategy,
} from "../../lib/presenters";
import {
  CandidatePlanCard,
  ProjectionTimelineStrip,
  ProjectedStateSummaryCard,
} from "./AgentShared";

interface DecisionFlowProps {
  plan: PlanView;
  selectedEvaluation: CandidateEvaluationView;
  candidatePlans: CandidateEvaluationView[];
  trace: TraceView | null;
  baselineKpis: KPIView | null;
  reflections: ReflectionView[];
  summary: ControlTowerSummaryResponse | null;
}

function splitSentences(value: string | null | undefined, limit: number): string[] {
  if (!value) return [];
  return value
    .split(". ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((item) => (item.endsWith(".") ? item : `${item}.`));
}

function metricDelta(
  current: number,
  baseline: number | undefined,
  formatter: (value: number) => string,
  invertGood = false,
) {
  if (baseline === undefined) {
    return <span className="text-secondaryGray">--</span>;
  }

  const delta = current - baseline;
  if (Math.abs(delta) < 0.001) {
    return <span className="text-secondaryGray">No change</span>;
  }

  const isGood = invertGood ? delta < 0 : delta > 0;
  const color = isGood ? "text-green-700 bg-green-50" : "text-rausch bg-rausch/10";
  const sign = delta > 0 ? "+" : "";

  return (
    <span
      className={`inline-flex items-center rounded-badge px-2 py-0.5 text-[11px] font-bold ${color}`}
    >
      {isGood ? (
        invertGood ? (
          <TrendingDown size={12} className="mr-1" />
        ) : (
          <TrendingUp size={12} className="mr-1" />
        )
      ) : (
        <TrendingDown size={12} className="mr-1" />
      )}
      {sign}
      {formatter(delta)}
    </span>
  );
}

function AlternativeSummaryCard({
  evaluation,
  expanded,
  onToggle,
}: {
  evaluation: CandidateEvaluationView;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-card border border-borderGray bg-pureWhite shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <div className="text-[15px] font-bold text-nearBlack">
            {humanizeStrategy(evaluation.strategy_label)}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-secondaryGray">
            Score {evaluation.score.toFixed(3)} • {evaluation.action_ids.length} actions
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1.5 rounded-xl border border-borderGray px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Hide details" : "Details"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-borderGray/40 px-4 py-3 text-[12px] text-secondaryGray sm:grid-cols-4">
        <div>
          Service <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.service_level)}</span>
        </div>
        <div>
          Risk <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.disruption_risk)}</span>
        </div>
        <div>
          Backlog <span className="font-semibold text-nearBlack">{evaluation.projected_state_summary?.backlog_units ?? "--"}</span>
        </div>
        <div>
          Cost <span className="font-semibold text-nearBlack">{formatCurrency(evaluation.projected_kpis.total_cost)}</span>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-borderGray/40 p-4">
          <CandidatePlanCard evaluation={evaluation} selected={false} />
        </div>
      ) : null}
    </div>
  );
}

export function DecisionFlow({
  plan,
  selectedEvaluation,
  candidatePlans,
  trace,
  baselineKpis,
  reflections,
  summary,
}: DecisionFlowProps) {
  const alternatives = useMemo(
    () =>
      candidatePlans.filter(
        (item) => item.strategy_label !== selectedEvaluation.strategy_label,
      ),
    [candidatePlans, selectedEvaluation.strategy_label],
  );

  const [expandedReasoning, setExpandedReasoning] = useState(false);
  const [expandedAlternative, setExpandedAlternative] = useState<string | null>(
    null,
  );
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({
    critical: true,
    warning: true,
    info: true,
  });

  const toggleAlertGroup = (group: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const alerts = summary?.alerts ?? [];
  const constraints = plan.violations ?? [];
  const combinedRisks = [
    ...constraints.map((violation) => ({
      id: violation.code,
      type: "Constraint",
      severity: violation.severity === "hard" ? "Critical" : "Warning",
      category: violation.code.includes("CAPACITY")
        ? "Capacity"
        : violation.code.includes("ROUTING")
          ? "Routing"
          : "Supply",
      message: violation.message,
    })),
    ...alerts.map((alert, index) => ({
      id: `alert-${index}`,
      type: "System Alert",
      severity:
        alert.level === "critical"
          ? "Critical"
          : alert.level === "warning"
            ? "Warning"
            : "Info",
      category: alert.source,
      message: alert.message,
    })),
  ];

  const groupedRisks = {
    Critical: combinedRisks.filter((risk) => risk.severity === "Critical"),
    Warning: combinedRisks.filter((risk) => risk.severity === "Warning"),
    Info: combinedRisks.filter((risk) => risk.severity === "Info"),
  };

  const winBullets = [
    ...splitSentences(selectedEvaluation.rationale, 2),
    ...splitSentences(selectedEvaluation.projection_summary, 1),
  ].slice(0, 3);

  const plannerDetail =
    trace?.selection_reason ?? plan.llm_planner_narrative ?? plan.planner_reasoning;

  return (
    <div className="space-y-8 pb-12">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nearBlack text-[14px] font-black text-pureWhite">
            1
          </div>
          <h2 className="text-[20px] font-black tracking-tight text-nearBlack">
            Decision Comparison
          </h2>
        </div>

        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-card border-[2px] border-nearBlack bg-pureWhite p-6 shadow-card">
            <div className="absolute right-0 top-0 rounded-bl-xl bg-nearBlack px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-pureWhite">
              Recommended plan
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[28px] font-black leading-tight text-nearBlack">
                    {humanizeStrategy(selectedEvaluation.strategy_label)}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-badge border border-borderGray bg-lightSurface px-2.5 py-1 text-[11px] font-bold uppercase text-secondaryGray">
                      {plan.actions.length} actions
                    </span>
                    <span
                      className={`rounded-badge px-2.5 py-1 text-[11px] font-bold uppercase ${
                        plan.feasible
                          ? "bg-green-50 text-green-700"
                          : "bg-errorRed/10 text-errorRed"
                      }`}
                    >
                      {plan.feasible ? "Feasible" : "Infeasible"}
                    </span>
                    <span className="rounded-badge bg-rausch/10 px-2.5 py-1 text-[11px] font-bold uppercase text-rausch">
                      Score {selectedEvaluation.score.toFixed(3)}
                    </span>
                  </div>
                </div>

                <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                    Why this plan won in simulation
                  </div>
                  <p className="mt-2 text-[14px] leading-6 text-nearBlack">
                    {selectedEvaluation.projection_summary || selectedEvaluation.rationale}
                  </p>
                </div>

                <button className="flex w-full items-center justify-center gap-2 rounded bg-rausch px-6 py-3 text-[14px] font-bold text-pureWhite shadow-md transition-all hover:bg-rausch/90">
                  <Zap size={16} /> Execute Recommended Plan
                </button>
              </div>

              <div className="space-y-5 border-t border-borderGray/30 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <div>
                  <h4 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-secondaryGray">
                    <Zap size={14} className="text-rausch" /> Decision rationale
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {(winBullets.length ? winBullets : ["Optimizes the current cost, service, and risk trade-off for this operating mode."]).map(
                      (bullet, index) => (
                        <li
                          key={`${bullet}-${index}`}
                          className="flex items-start gap-3 text-[14px] text-nearBlack"
                        >
                          <span className="mt-1 font-bold text-rausch">•</span>
                          <span>{bullet}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px] text-secondaryGray">
                  <div className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
                    <div className="uppercase tracking-wider text-secondaryGray">
                      Service outlook
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {formatPercent(selectedEvaluation.projected_kpis.service_level)}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
                    <div className="uppercase tracking-wider text-secondaryGray">
                      Worst-case risk
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {formatPercent(
                        selectedEvaluation.worst_case_kpis?.disruption_risk ??
                          selectedEvaluation.projected_kpis.disruption_risk,
                      )}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
                    <div className="uppercase tracking-wider text-secondaryGray">
                      Critical covered
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {selectedEvaluation.critical_covered}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
                    <div className="uppercase tracking-wider text-secondaryGray">
                      Still at risk
                    </div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">
                      {selectedEvaluation.unresolved_critical}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-lightSurface/50 p-1">
                  <button
                    onClick={() => setExpandedReasoning(!expandedReasoning)}
                    className="flex w-full items-center justify-between rounded-md p-3 text-[12px] font-bold text-secondaryGray transition-colors hover:bg-lightSurface hover:text-nearBlack"
                  >
                    <span>
                      {expandedReasoning
                        ? "Hide planner details"
                        : "View detailed planner reasoning"}
                    </span>
                    {expandedReasoning ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {expandedReasoning ? (
                    <div className="mt-1 border-t border-borderGray/30 px-4 pb-4 pt-3 text-[13px] leading-relaxed text-secondaryGray">
                      {plannerDetail}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {alternatives.length > 0 ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[12px] font-black uppercase tracking-widest text-secondaryGray">
                  Alternative options
                </h4>
                <span className="text-[11px] uppercase tracking-wider text-secondaryGray">
                  Compressed by default
                </span>
              </div>
              <div className="space-y-3">
                {alternatives.map((alternative) => (
                  <AlternativeSummaryCard
                    key={alternative.strategy_label}
                    evaluation={alternative}
                    expanded={expandedAlternative === alternative.strategy_label}
                    onToggle={() =>
                      setExpandedAlternative((current) =>
                        current === alternative.strategy_label
                          ? null
                          : alternative.strategy_label,
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
            2
          </div>
          <h2 className="text-[20px] font-black tracking-tight text-nearBlack">
            Projected Impact
          </h2>
        </div>

        <div className="overflow-hidden rounded-card border border-borderGray bg-pureWhite shadow-sm">
          <div className="border-b border-borderGray/30 bg-lightSurface/50 px-6 py-4">
            <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
              Forward simulation
            </div>
            <div className="mt-1 text-[20px] font-black text-nearBlack">
              3-Day Outlook for the selected plan
            </div>
            <p className="mt-2 max-w-3xl text-[13px] text-secondaryGray">
              {selectedEvaluation.projection_summary ||
                "The control tower is comparing future service, cost, and risk across the rollout horizon before dispatch."}
            </p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-borderGray/30 border-b border-borderGray/30 bg-lightSurface/30 md:grid-cols-4">
            {[
              {
                label: "Service Level",
                current: selectedEvaluation.projected_kpis.service_level,
                base: baselineKpis?.service_level,
                fmt: formatPercent,
                invert: false,
              },
              {
                label: "Recovery Speed",
                current: selectedEvaluation.projected_kpis.recovery_speed,
                base: baselineKpis?.recovery_speed,
                fmt: formatPercent,
                invert: false,
              },
              {
                label: "Disruption Risk",
                current: selectedEvaluation.projected_kpis.disruption_risk,
                base: baselineKpis?.disruption_risk,
                fmt: formatPercent,
                invert: true,
              },
              {
                label: "Total Cost",
                current: selectedEvaluation.projected_kpis.total_cost,
                base: baselineKpis?.total_cost,
                fmt: (value: number) => formatCurrency(value),
                invert: true,
              },
            ].map((metric) => (
              <div key={metric.label} className="p-5">
                <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                  {metric.label}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[24px] font-black text-nearBlack">
                    {metric.label === "Total Cost"
                      ? formatCurrency(metric.current)
                      : formatPercent(metric.current)}
                  </div>
                  {metricDelta(metric.current, metric.base, metric.fmt, metric.invert)}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <ProjectionTimelineStrip
                steps={selectedEvaluation.projection_steps}
                title="Forward simulation timeline"
              />
              <div className="rounded-card border border-borderGray bg-lightSurface/50 px-4 py-4">
                <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                  Why this plan won
                </div>
                <p className="mt-2 text-[13px] leading-6 text-nearBlack">
                  {selectedEvaluation.rationale}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedEvaluation.projected_state_summary ? (
                <ProjectedStateSummaryCard
                  summary={selectedEvaluation.projected_state_summary}
                />
              ) : null}
              {trace?.critic_summary || plan.critic_summary ? (
                <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                  <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                    Critic review
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-secondaryGray">
                    {trace?.critic_summary ?? plan.critic_summary}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div
        className={`grid grid-cols-1 gap-8 ${
          combinedRisks.length > 0 ? "lg:grid-cols-[1.4fr_1fr]" : ""
        }`}
      >
        <section className="flex flex-col space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
              3
            </div>
            <h2 className="text-[20px] font-black tracking-tight text-nearBlack">
              Planned Roadmap
            </h2>
            <span className="rounded-badge bg-nearBlack px-2.5 py-0.5 text-[11px] font-bold text-pureWhite">
              {plan.actions.length} actions
            </span>
          </div>

          <div className="flex max-h-[380px] flex-col overflow-hidden rounded-card border border-borderGray bg-pureWhite shadow-sm">
            <div className="divide-y divide-borderGray/30 overflow-y-auto custom-scrollbar">
              {[...plan.actions]
                .sort((left, right) => right.priority - left.priority)
                .map((action, index) => (
                  <div
                    key={action.action_id}
                    className="flex flex-wrap items-center gap-6 p-5 transition-colors hover:bg-lightSurface/20 lg:flex-nowrap"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-borderGray bg-lightSurface text-[14px] font-black text-nearBlack">
                      {index + 1}
                    </div>

                    <div className="min-w-[250px] flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-rausch/10 px-2 py-0.5 text-[10px] font-black uppercase text-rausch">
                          {action.action_type}
                        </span>
                        <h5 className="text-[16px] font-bold text-nearBlack">
                          {action.target_id}
                        </h5>
                      </div>
                      <p className="text-[13px] text-secondaryGray">
                        {action.reason}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                          Impact
                        </div>
                        <div
                          className={`text-[14px] font-bold ${
                            action.estimated_service_delta > 0
                              ? "text-green-700"
                              : "text-nearBlack"
                          }`}
                        >
                          {action.estimated_service_delta > 0
                            ? `+${(action.estimated_service_delta * 100).toFixed(1)}%`
                            : "Moderate"}
                        </div>
                      </div>
                      <div className="w-[80px] text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                          Cost
                        </div>
                        <div
                          className={`text-[14px] font-bold ${
                            action.estimated_cost_delta > 0
                              ? "text-rausch"
                              : "text-nearBlack"
                          }`}
                        >
                          {action.estimated_cost_delta > 0
                            ? `+$${action.estimated_cost_delta.toLocaleString()}`
                            : "Minimal"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {combinedRisks.length > 0 ? (
          <section className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
                4
              </div>
              <h2 className="text-[20px] font-black tracking-tight text-nearBlack">
                Risks & Constraints
              </h2>
            </div>

            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {(["Critical", "Warning", "Info"] as const).map((severity) => {
                const items = groupedRisks[severity];
                if (items.length === 0) return null;

                const isCritical = severity === "Critical";
                const isWarning = severity === "Warning";
                const headerColor = isCritical
                  ? "text-errorRed bg-errorRed/10 border-errorRed/20"
                  : isWarning
                    ? "text-amber-800 bg-amber-100 border-amber-200"
                    : "text-blue-800 bg-blue-50 border-blue-200";
                const icon = isCritical ? (
                  <AlertTriangle size={16} />
                ) : isWarning ? (
                  <AlertTriangle size={16} />
                ) : (
                  <Info size={16} />
                );

                return (
                  <div
                    key={severity}
                    className="shrink-0 overflow-hidden rounded-card border border-borderGray bg-pureWhite shadow-sm"
                  >
                    <button
                      onClick={() => toggleAlertGroup(severity.toLowerCase())}
                      className={`flex w-full items-center justify-between border-b p-4 transition-colors hover:opacity-90 ${headerColor}`}
                    >
                      <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-wide">
                        {icon} {severity} ({items.length})
                      </div>
                      {expandedAlerts[severity.toLowerCase()] ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>

                    {expandedAlerts[severity.toLowerCase()] ? (
                      <div className="divide-y divide-borderGray/30">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 p-4"
                          >
                            <span className="shrink-0 rounded bg-lightSurface px-2 py-1 text-[10px] font-bold uppercase text-secondaryGray">
                              {item.category}
                            </span>
                            <div>
                              <div className="text-[14px] font-bold text-nearBlack">
                                {item.type}
                              </div>
                              <div className="mt-0.5 text-[13px] text-secondaryGray">
                                {item.message}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-8 pt-4 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
              5
            </div>
            <h2 className="text-[18px] font-black tracking-tight text-nearBlack">
              Historical Context
            </h2>
          </div>

          <div className="space-y-4 rounded-card border border-borderGray bg-pureWhite p-5 shadow-sm">
            {plan.metadata?.referenced_cases &&
            plan.metadata.referenced_cases.length > 0 ? (
              plan.metadata.referenced_cases.map((reference) => (
                <div
                  key={reference.case_id}
                  className="rounded-lg border border-borderGray/60 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-nearBlack">
                      {reference.case_id}
                    </span>
                    <span className="rounded-badge bg-nearBlack px-2 py-0.5 text-[10px] font-bold text-pureWhite">
                      {(reference.similarity_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="border-l-2 border-borderGray pl-2 py-1 text-[12px] italic text-secondaryGray">
                    "{reference.reflection_notes}"
                  </p>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-[13px] italic text-secondaryGray">
                No historical cases referenced.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
              6
            </div>
            <h2 className="text-[18px] font-black tracking-tight text-nearBlack">
              Reflection Memory
            </h2>
          </div>

          <div className="space-y-3 rounded-card border border-borderGray bg-pureWhite p-5 shadow-sm">
            <div className="mb-2 text-[12px] text-secondaryGray">
              Lessons applied to the current plan:
            </div>
            {reflections.slice(0, 3).map((reflection, index) => (
              <div
                key={`${reflection.note_id}-${index}`}
                className="flex items-start gap-3 border-b border-borderGray/30 pb-3 last:border-0 last:pb-0"
              >
                <History size={14} className="mt-0.5 shrink-0 text-rausch" />
                <div>
                  <div className="text-[13px] font-bold text-nearBlack">
                    {reflection.summary}
                  </div>
                  <div className="mt-0.5 text-[12px] text-secondaryGray">
                    {reflection.lessons.join(" • ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

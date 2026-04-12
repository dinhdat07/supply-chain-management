import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import type { ControlTowerSummaryResponse, TraceView } from "../../lib/types";
import {
  formatPercent,
  humanizeStrategy,
  severityTone,
} from "../../lib/presenters";
import { modeTone } from "./AgentShared";

interface OperationsConsoleProps {
  summary: ControlTowerSummaryResponse | null;
  trace: TraceView | null;
  workQueue: Array<{ title: string; value: string; detail: string }>;
  loading: boolean;
  refreshing: boolean;
  actionLoading: string | null;
  onRefresh: () => Promise<void>;
  onGenerateRecommendations: () => Promise<void>;
}

export function OperationsConsole({
  summary,
  trace,
  workQueue,
  loading,
  refreshing,
  actionLoading,
  onRefresh,
  onGenerateRecommendations,
}: OperationsConsoleProps) {
  const selectedPlan = trace?.latest_plan ?? summary?.latest_plan ?? null;

  return (
    <section className="space-y-5">
      {/* ── Row 1: Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-nearBlack">
            Operations Console
          </h2>
          <p className="text-[13px] text-secondaryGray">
            Real-time network governance and AI-assisted decision making.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void onRefresh()}
            disabled={loading || actionLoading !== null}
            className="flex items-center gap-2 rounded-card border border-borderGray bg-pureWhite px-4 py-2 text-[13px] font-bold text-nearBlack shadow-sm transition-all hover:bg-lightSurface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCcw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Sync Data"}
          </button>
          <button
            onClick={() => void onGenerateRecommendations()}
            disabled={loading || actionLoading !== null}
            className="flex items-center gap-2 rounded-card bg-nearBlack px-4 py-2 text-[13px] font-bold text-pureWhite shadow-card transition-all hover:bg-nearBlack/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {actionLoading === "daily_plan" ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {actionLoading === "daily_plan" ? "Planning..." : "Generate Plan"}
          </button>
        </div>
      </div>

      {/* ── Row 2: KPI Strip ── */}
      <div className="rounded-[20px] border border-borderGray bg-pureWhite p-1 shadow-card">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[19px] bg-borderGray/30 sm:grid-cols-6">
          {[
            {
              label: "Service level",
              value: summary ? formatPercent(summary.kpis.service_level) : "--",
            },
            {
              label: "Total cost",
              value: summary
                ? `$${summary.kpis.total_cost.toLocaleString()}`
                : "--",
            },
            {
              label: "Recovery speed",
              value: summary
                ? formatPercent(summary.kpis.recovery_speed)
                : "--",
            },
            {
              label: "Disruption risk",
              value: summary
                ? formatPercent(summary.kpis.disruption_risk)
                : "--",
            },
            {
              label: "Stockout risk",
              value: summary ? formatPercent(summary.kpis.stockout_risk) : "--",
            },
            {
              label: "Latency",
              value: summary
                ? `${summary.kpis.decision_latency_ms.toFixed(2)}ms`
                : "--",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-pureWhite px-5 py-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                {kpi.label}
              </div>
              <div className="mt-1 text-[20px] font-bold leading-none text-nearBlack">
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 3: Metrics + Exceptions ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        {workQueue.map((item) => (
          <div
            key={item.title}
            className="rounded-[18px] border border-borderGray bg-pureWhite px-5 py-4 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
              {item.title}
            </div>
            <div className="mt-1 text-[17px] font-bold text-nearBlack">
              {item.value}
            </div>
            <p className="mt-0.5 text-[12px] leading-snug text-secondaryGray">
              {item.detail}
            </p>
          </div>
        ))}
        <div className="min-w-[220px] rounded-[18px] border border-borderGray bg-pureWhite px-5 py-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
            Exception Queue
          </div>
          <div className="mt-2 space-y-2">
            {summary?.alerts.length ? (
              summary.alerts.slice(0, 2).map((alert) => (
                <div
                  key={`${alert.source}-${alert.title}`}
                  className={`rounded-[10px] border px-3 py-2 ${severityTone(alert.level) === "critical" ? "border-errorRed/20 bg-errorRed/5" : "border-borderGray bg-lightSurface"}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={`mt-0.5 shrink-0 ${severityTone(alert.level) === "critical" ? "text-errorRed" : "text-secondaryGray"}`}
                      size={12}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-bold text-nearBlack leading-tight">
                        {alert.title}
                      </div>
                      <p className="truncate text-[11px] text-secondaryGray">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 rounded-[10px] border border-green-200 bg-green-50 px-3 py-2.5 text-[12px] font-medium text-green-700">
                <CheckCircle2 size={13} /> No exceptions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Plan Main Panel ── */}
      {selectedPlan ? (
        <div className="overflow-hidden rounded-[20px] border border-borderGray bg-pureWhite shadow-card">
          {/* Plan Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderGray/50 bg-lightSurface/50 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                  Current Strategy
                </span>
                <h3 className="text-[20px] font-black text-nearBlack">
                  {humanizeStrategy(selectedPlan.strategy_label)}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 sm:pt-0">
                <span className="rounded-full border border-borderGray bg-pureWhite px-2.5 py-1 font-mono text-[10px] font-bold text-secondaryGray">
                  {selectedPlan.plan_id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${modeTone(selectedPlan.mode)}`}
                >
                  {selectedPlan.mode}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${selectedPlan.feasible ? "bg-green-50 text-green-700" : "bg-errorRed/10 text-errorRed"}`}
                >
                  {selectedPlan.feasible ? "Feasible" : "Infeasible"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                  Plan Score
                </div>
                <div className="text-[24px] font-black text-nearBlack leading-none">
                  {selectedPlan.score.toFixed(4)}
                </div>
              </div>
              <div
                className={`rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-widest ${modeTone(selectedPlan.status)}`}
              >
                {selectedPlan.status}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] divide-x divide-borderGray/40">
            {/* COLUMN LEFT: MAIN CONTENT */}
            <div className="divide-y divide-borderGray/30 overflow-hidden">
              {/* AI Reasoning Section */}
              <div className="bg-lightSurface/20 p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                        Planner Reasoning
                      </div>
                      <p className="mt-2 text-[14px] leading-relaxed text-nearBlack italic">
                        "
                        {trace?.selection_reason ??
                          selectedPlan.planner_reasoning}
                        "
                      </p>
                    </div>
                    {selectedPlan.mode_rationale && (
                      <div className="rounded-[12px] border border-borderGray/50 bg-pureWhite p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                          Mode Snapshot
                        </div>
                        <p className="mt-1 text-[12px] text-secondaryGray">
                          {selectedPlan.mode_rationale}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedPlan.metadata?.strategy_rationale && (
                    <div className="rounded-[16px] border-l-[4px] border-rausch bg-rausch/5 p-4">
                      <div className="text-[11px] font-black uppercase tracking-widest text-rausch">
                        Strategy Attribution
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-nearBlack">
                        {selectedPlan.metadata.strategy_rationale}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Section - Full Width in this Column */}
              <div className="p-0">
                <div className="flex items-center justify-between border-b border-borderGray/30 bg-pureWhite px-6 py-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-black uppercase tracking-widest text-nearBlack">
                      Planned Roadmap
                    </h4>
                    <span className="rounded-full bg-nearBlack px-2 py-0.5 text-[10px] font-bold text-pureWhite">
                      {selectedPlan.actions.length} ACTIONS
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-borderGray/20">
                  {selectedPlan.actions.map((action, idx) => (
                    <div
                      key={action.action_id}
                      className="p-6 transition-colors hover:bg-lightSurface/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nearBlack text-[12px] font-black text-white">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-rausch/10 px-2 py-0.5 text-[10px] font-black uppercase text-rausch">
                                {action.action_type}
                              </span>
                              <h5 className="text-[16px] font-bold text-nearBlack">
                                {action.target_id}
                              </h5>
                            </div>
                            <p className="mt-1 text-[13px] text-secondaryGray">
                              {action.reason}
                            </p>

                            {/* Params */}
                            {Object.keys(action.parameters).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(action.parameters).map(
                                  ([pk, pv]) => (
                                    <div
                                      key={pk}
                                      className="rounded-md border border-borderGray/50 bg-lightSurface px-2 py-1 flex items-center gap-1.5"
                                    >
                                      <span className="text-[10px] font-bold uppercase text-secondaryGray">
                                        {pk}:
                                      </span>
                                      <span className="font-mono text-[11px] font-bold text-nearBlack">
                                        {String(pv)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-8 rounded-xl border border-borderGray/30 bg-pureWhite p-3 shadow-sm">
                          {[
                            {
                              label: "Priority",
                              value: `${(action.priority * 10).toFixed(0)}/10`,
                              color: "text-nearBlack",
                            },
                            {
                              label: "Cost Δ",
                              raw: action.estimated_cost_delta,
                              value:
                                action.estimated_cost_delta !== 0
                                  ? `${action.estimated_cost_delta > 0 ? "+" : ""}${Math.round(action.estimated_cost_delta).toLocaleString()}`
                                  : "—",
                              positive: action.estimated_cost_delta <= 0,
                            },
                            {
                              label: "Service Δ",
                              raw: action.estimated_service_delta,
                              value:
                                action.estimated_service_delta !== 0
                                  ? `${action.estimated_service_delta > 0 ? "+" : ""}${(action.estimated_service_delta * 100).toFixed(1)}%`
                                  : "—",
                              positive: action.estimated_service_delta >= 0,
                            },
                            {
                              label: "Recovery",
                              raw: action.estimated_recovery_hours,
                              value:
                                action.estimated_recovery_hours > 0
                                  ? `${action.estimated_recovery_hours}h`
                                  : "—",
                              positive: true,
                            },
                          ].map((stat) => (
                            <div key={stat.label} className="text-right">
                              <div className="text-[9px] font-bold uppercase tracking-widest text-secondaryGray">
                                {stat.label}
                              </div>
                              <div
                                className={`text-[14px] font-bold ${stat.raw === undefined || stat.raw === 0 ? "text-nearBlack" : stat.positive ? "text-green-700" : "text-rausch"}`}
                              >
                                {stat.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN RIGHT: SIDEBAR ANALYSIS */}
            <div className="bg-lightSurface/10 p-5 space-y-6 overflow-hidden">
              {/* Score Breakdown */}
              <div className="rounded-2xl border border-borderGray/60 bg-pureWhite p-4 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray mb-3">
                  Score Breakdown
                </div>
                <div className="space-y-2.5">
                  {Object.entries(selectedPlan.score_breakdown).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[12px] capitalize text-secondaryGray">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[13px] font-bold ${value >= 0 ? "text-green-700" : "text-rausch"}`}
                        >
                          {value >= 0 ? "+" : ""}
                          {value.toFixed(4)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Constraint Analysis */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                    Constraints
                  </div>
                  {(selectedPlan.violations?.length ?? 0) === 0 && (
                    <CheckCircle2 size={12} className="text-green-600" />
                  )}
                </div>
                {(selectedPlan.violations?.length ?? 0) > 0 ? (
                  <div className="space-y-2 px-1">
                    {selectedPlan.violations?.map((v, i) => (
                      <div
                        key={`${v.code}-${i}`}
                        className={`rounded-xl border p-3 text-[12px] ${v.severity === "hard" ? "border-errorRed/20 bg-errorRed/5 text-errorRed" : "border-amber-200 bg-amber-50 text-amber-800"}`}
                      >
                        <div className="font-bold flex items-center justify-between uppercase text-[10px]">
                          {v.code} <span>{v.severity}</span>
                        </div>
                        <p className="mt-1 leading-tight text-[11px]">
                          {v.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-[11px] italic text-green-700">
                    Operation boundaries are secure.
                  </div>
                )}
              </div>

              {/* Historical Context */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                    Historical Context
                  </div>
                  <span className="text-[10px] font-bold text-secondaryGray">
                    {selectedPlan.metadata?.referenced_cases.length ?? 0}{" "}
                    MATCHED
                  </span>
                </div>
                <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {selectedPlan.metadata?.referenced_cases.map((c) => (
                    <div
                      key={c.case_id}
                      className="rounded-xl border border-borderGray/60 bg-pureWhite p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold text-nearBlack">
                          {c.case_id}
                        </span>
                        <span className="bg-nearBlack px-1 font-bold text-[8px] text-white rounded">
                          {(c.similarity_score * 100).toFixed(0)}% MATCH
                        </span>
                      </div>
                      <p className="mt-1.5 text-[10px] italic leading-tight text-secondaryGray">
                        {c.reflection_notes}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] uppercase font-bold text-secondaryGray">
                        {Object.entries(c.outcome_kpis)
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <div key={k} className="truncate">
                              {k.substring(0, 3)}: {v.toFixed(2)}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                  {(selectedPlan.metadata?.referenced_cases.length ?? 0) ===
                    0 && (
                    <div className="text-[11px] italic text-secondaryGray p-2">
                      Zero-shot reasoning.
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Table */}
              <div className="pt-4 border-t border-borderGray/30 space-y-2">
                {[
                  {
                    label: "Memory influence",
                    value: `${((selectedPlan.metadata?.memory_influence_score ?? 0) * 100).toFixed(0)}%`,
                  },
                  {
                    label: "Approval Status",
                    value: selectedPlan.approval_status,
                  },
                  {
                    label: "Generated By",
                    value:
                      selectedPlan.generated_by?.replace(/_/g, " ") || "llm",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="text-secondaryGray">{row.label}</span>
                    <span className="font-bold text-nearBlack uppercase">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-borderGray bg-pureWhite p-20 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lightSurface">
            <Sparkles className="text-secondaryGray" size={32} />
          </div>
          <h3 className="mt-6 text-[20px] font-bold text-nearBlack">
            Awaiting Operator Command
          </h3>
          <p className="mt-2 text-secondaryGray">
            Sync network state or generate a new logistics plan.
          </p>
        </div>
      )}
    </section>
  );
}

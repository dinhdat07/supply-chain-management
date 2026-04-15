import { useState } from "react";
import {
  AlertTriangle,
  Info,
  Zap,
  TrendingDown,
  TrendingUp,
  History,
  ChevronDown,
  ChevronUp,
  } from "lucide-react";
import type {
  CandidateEvaluationView,
  TraceView,
  KPIView,
  ReflectionView,
  ControlTowerSummaryResponse,
  PlanView,
} from "../../lib/types";
import {
  formatPercent,
  humanizeStrategy,
} from "../../lib/presenters";
import {
  ProjectionTimelineStrip,
  CandidatePlanCard,
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

export function DecisionFlow({
  plan,
  selectedEvaluation,
  candidatePlans,
  trace,
  baselineKpis,
    reflections,
  summary,
}: DecisionFlowProps) {
  
  const alternatives = candidatePlans.filter(
    (item) => item.strategy_label !== selectedEvaluation.strategy_label
  );

  const [expandedReasoning, setExpandedReasoning] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({
    critical: true,
    warning: true,
    info: true,
  });

  const toggleAlertGroup = (group: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // Compute Delta
  const renderDelta = (current: number, baseline: number | undefined, formatter: (val: number) => string, invertGood = false) => {
    if (baseline === undefined) return <span className="text-secondaryGray">--</span>;
    const delta = current - baseline;
    if (Math.abs(delta) < 0.001 && delta !== 0) return <span className="text-secondaryGray">~0</span>;
    if (delta === 0) return <span className="text-secondaryGray">No change</span>;

    const isGood = invertGood ? delta < 0 : delta > 0;
    const color = isGood ? "text-green-700 bg-green-50" : "text-rausch bg-rausch/10";
    const sign = delta > 0 ? "+" : "";
    return (
      <span className={`inline-flex items-center rounded-badge px-2 py-0.5 text-[11px] font-bold ${color}`}>
        {isGood ? (invertGood ? <TrendingDown size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1" />) : <TrendingDown size={12} className="mr-1" />}
        {sign}{formatter(delta)}
      </span>
    );
  };

  // Group Alerts
  const alerts = summary?.alerts ?? [];
  const constraints = plan.violations ?? [];
  
  // Create unified risks list
  const combinedRisks = [
    ...constraints.map(c => ({
      id: c.code,
      type: "Constraint",
      severity: c.severity === "hard" ? "Critical" : "Warning",
      category: c.code.includes("CAPACITY") ? "Capacity" : c.code.includes("ROUTING") ? "Routing" : "Supply",
      message: c.message,
    })),
    ...alerts.map((a, i) => ({
      id: `alert-${i}`,
      type: "System Alert",
      severity: a.level === "critical" ? "Critical" : a.level === "warning" ? "Warning" : "Info",
      category: a.source,
      message: a.message,
    }))
  ];

  const groupedRisks = {
    Critical: combinedRisks.filter(r => r.severity === "Critical"),
    Warning: combinedRisks.filter(r => r.severity === "Warning"),
    Info: combinedRisks.filter(r => r.severity === "Info"),
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. DECISION (Candidate Comparison + Strategy) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nearBlack text-[14px] font-black text-pureWhite">
            1
          </div>
          <h2 className="text-[20px] font-black tracking-tight text-nearBlack">Decision Comparison</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selected Plan */}
          <div className="lg:col-span-2 rounded-card border-[2px] border-nearBlack bg-pureWhite p-6 shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 rounded-bl-xl bg-nearBlack px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-pureWhite">
              Recommended Plan
            </div>
            
            <div className="flex items-start justify-between pr-32">
              <div>
                <h3 className="text-[24px] font-black text-nearBlack">
                  {humanizeStrategy(selectedEvaluation.strategy_label)}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-badge border border-borderGray bg-lightSurface px-2.5 py-1 text-[11px] font-bold text-secondaryGray uppercase">
                    ID: {plan.plan_id}
                  </span>
                  <span className={`rounded-badge px-2.5 py-1 text-[11px] font-bold uppercase ${plan.feasible ? "bg-green-50 text-green-700" : "bg-errorRed/10 text-errorRed"}`}>
                    {plan.feasible ? "Feasible" : "Infeasible"}
                  </span>
                  <span className="rounded-badge bg-rausch/10 px-2.5 py-1 text-[11px] font-bold uppercase text-rausch">
                    Score: {plan.score.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy Attribution / Why */}
            <div className="mt-6 border-t border-borderGray/30 pt-5">
              <h4 className="text-[12px] font-black uppercase tracking-widest text-secondaryGray mb-3 flex items-center gap-2">
                <Zap size={14} className="text-rausch" /> Why this plan wins
              </h4>
              
              <ul className="space-y-2 mb-4">
                {plan.metadata?.strategy_rationale?.split(". ").filter(s => s.trim().length > 0).slice(0, 3).map((bullet, i) => (
                  <li key={i} className="text-[14px] text-nearBlack flex items-start gap-2">
                    <span className="text-rausch mt-1">•</span> {bullet}.
                  </li>
                ))}
                {!plan.metadata?.strategy_rationale && (
                  <li className="text-[14px] text-nearBlack flex items-start gap-2">
                    <span className="text-rausch mt-1">•</span> Optimizes cost and service trade-offs effectively.
                  </li>
                )}
              </ul>

              {/* Collapsible Reasoning */}
              <div className="mt-4">
                <button
                  onClick={() => setExpandedReasoning(!expandedReasoning)}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-secondaryGray hover:text-nearBlack transition-colors"
                >
                  {expandedReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expandedReasoning ? "Hide Planner Details" : "View Detailed Planner Reasoning"}
                </button>
                
                {expandedReasoning && (
                  <div className="mt-3 rounded-lg bg-lightSurface p-4 text-[13px] leading-relaxed text-secondaryGray italic">
                    "{trace?.selection_reason ?? plan.planner_reasoning}"
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="rounded bg-rausch px-6 py-2.5 text-[14px] font-bold text-pureWhite shadow-md hover:bg-rausch/90 transition-all">
                Execute Plan
              </button>
            </div>
          </div>

          {/* Alternatives */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-secondaryGray">
              Alternative Options
            </h4>
            {alternatives.length > 0 ? alternatives.slice(0, 2).map((alt) => (
              <CandidatePlanCard key={alt.strategy_label} evaluation={alt} selected={false} />
            )) : (
              <div className="rounded-card border border-borderGray bg-lightSurface p-5 text-center text-[13px] text-secondaryGray">
                No viable alternatives found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. IMPACT */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
            2
          </div>
          <h2 className="text-[20px] font-black tracking-tight text-nearBlack">Projected Impact</h2>
        </div>

        <div className="rounded-card border border-borderGray bg-pureWhite shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-borderGray/30 border-b border-borderGray/30 bg-lightSurface/50">
            {[
              { label: "Service Level", current: selectedEvaluation.projected_kpis.service_level, base: baselineKpis?.service_level, fmt: formatPercent, invert: false },
              { label: "Recovery Speed", current: selectedEvaluation.projected_kpis.recovery_speed, base: baselineKpis?.recovery_speed, fmt: formatPercent, invert: false },
              { label: "Disruption Risk", current: selectedEvaluation.projected_kpis.disruption_risk, base: baselineKpis?.disruption_risk, fmt: formatPercent, invert: true },
              { label: "Total Cost", current: selectedEvaluation.projected_kpis.total_cost, base: baselineKpis?.total_cost, fmt: (v: number) => `$${Math.round(v).toLocaleString()}`, invert: true },
            ].map(metric => (
              <div key={metric.label} className="p-5">
                <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray mb-1">
                  {metric.label}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[24px] font-black text-nearBlack">
                    {metric.label === "Total Cost" ? `$${Math.round(metric.current).toLocaleString()}` : formatPercent(metric.current)}
                  </div>
                  {renderDelta(metric.current, metric.base, metric.fmt, metric.invert)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-secondaryGray mb-4">Simulation Timeline</h4>
            <ProjectionTimelineStrip
              steps={selectedEvaluation.projection_steps}
              
            />
          </div>
        </div>
      </section>

      {/* 3. EXECUTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
            3
          </div>
          <h2 className="text-[20px] font-black tracking-tight text-nearBlack">Planned Roadmap</h2>
          <span className="rounded-badge bg-nearBlack px-2.5 py-0.5 text-[11px] font-bold text-pureWhite">
            {plan.actions.length} ACTIONS
          </span>
        </div>

        <div className="rounded-card border border-borderGray bg-pureWhite shadow-sm divide-y divide-borderGray/30">
          {plan.actions.sort((a, b) => b.priority - a.priority).map((action, idx) => (
            <div key={action.action_id} className="p-5 flex flex-wrap lg:flex-nowrap gap-6 items-center hover:bg-lightSurface/20 transition-colors">
              <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-lightSurface border border-borderGray text-[14px] font-black text-nearBlack">
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-[250px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-rausch/10 px-2 py-0.5 text-[10px] font-black uppercase text-rausch">
                    {action.action_type}
                  </span>
                  <h5 className="text-[16px] font-bold text-nearBlack">
                    {action.target_id}
                  </h5>
                </div>
                <p className="text-[13px] text-secondaryGray">{action.reason}</p>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-secondaryGray">Impact</div>
                  <div className={`text-[14px] font-bold ${action.estimated_service_delta > 0 ? "text-green-700" : "text-nearBlack"}`}>
                    {action.estimated_service_delta > 0 ? `+${(action.estimated_service_delta * 100).toFixed(1)}%` : "Moderate"}
                  </div>
                </div>
                <div className="text-right w-[80px]">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-secondaryGray">Cost</div>
                  <div className={`text-[14px] font-bold ${action.estimated_cost_delta > 0 ? "text-rausch" : "text-nearBlack"}`}>
                    {action.estimated_cost_delta > 0 ? `+$${action.estimated_cost_delta.toLocaleString()}` : "Minimal"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. RISKS & CONSTRAINTS */}
      {combinedRisks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
              4
            </div>
            <h2 className="text-[20px] font-black tracking-tight text-nearBlack">Risks & Constraints</h2>
          </div>

          <div className="space-y-3">
            {["Critical", "Warning", "Info"].map((severity) => {
              const items = groupedRisks[severity as keyof typeof groupedRisks];
              if (items.length === 0) return null;

              const isCritical = severity === "Critical";
              const isWarning = severity === "Warning";
              const headerColor = isCritical ? "text-errorRed bg-errorRed/10 border-errorRed/20" : isWarning ? "text-amber-800 bg-amber-100 border-amber-200" : "text-blue-800 bg-blue-50 border-blue-200";
              const icon = isCritical ? <AlertTriangle size={16} /> : isWarning ? <AlertTriangle size={16} /> : <Info size={16} />;

              return (
                <div key={severity} className="rounded-card border border-borderGray bg-pureWhite shadow-sm overflow-hidden">
                  <button 
                    onClick={() => toggleAlertGroup(severity.toLowerCase())}
                    className={`w-full flex items-center justify-between p-4 border-b transition-colors hover:opacity-90 ${headerColor}`}
                  >
                    <div className="flex items-center gap-2 font-bold text-[14px] uppercase tracking-wide">
                      {icon} {severity} ({items.length})
                    </div>
                    {expandedAlerts[severity.toLowerCase()] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {expandedAlerts[severity.toLowerCase()] && (
                    <div className="divide-y divide-borderGray/30">
                      {items.map(item => (
                        <div key={item.id} className="p-4 flex gap-4 items-start">
                          <span className="rounded bg-lightSurface px-2 py-1 text-[10px] font-bold text-secondaryGray uppercase shrink-0">
                            {item.category}
                          </span>
                          <div>
                            <div className="text-[14px] font-bold text-nearBlack">{item.type}</div>
                            <div className="text-[13px] text-secondaryGray mt-0.5">{item.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. CONTEXT & LEARNING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Context */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
              5
            </div>
            <h2 className="text-[18px] font-black tracking-tight text-nearBlack">Historical Context</h2>
          </div>
          
          <div className="rounded-card border border-borderGray bg-pureWhite p-5 shadow-sm space-y-4">
            {plan.metadata?.referenced_cases && plan.metadata.referenced_cases.length > 0 ? (
              plan.metadata.referenced_cases.map(c => (
                <div key={c.case_id} className="rounded-lg border border-borderGray/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-nearBlack">{c.case_id}</span>
                    <span className="rounded-badge bg-nearBlack px-2 py-0.5 text-[10px] font-bold text-pureWhite">
                      {(c.similarity_score * 100).toFixed(0)}% MATCH
                    </span>
                  </div>
                  <p className="text-[12px] text-secondaryGray italic border-l-2 border-borderGray pl-2 py-1">
                    "{c.reflection_notes}"
                  </p>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-secondaryGray italic text-center py-4">No historical cases referenced.</div>
            )}
          </div>
        </section>

        {/* Learning */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-nearBlack text-[14px] font-black text-nearBlack">
              6
            </div>
            <h2 className="text-[18px] font-black tracking-tight text-nearBlack">Reflection Memory</h2>
          </div>
          
          <div className="rounded-card border border-borderGray bg-pureWhite p-5 shadow-sm space-y-3">
            <div className="text-[12px] text-secondaryGray mb-2">Lessons applied to current plan:</div>
            {reflections.slice(0, 3).map((r, i) => (
              <div key={i} className="flex gap-3 items-start border-b border-borderGray/30 pb-3 last:border-0 last:pb-0">
                <History size={14} className="text-rausch mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-bold text-nearBlack">{r.summary}</div>
                  <div className="text-[12px] text-secondaryGray mt-0.5">{r.lessons.join(" • ")}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

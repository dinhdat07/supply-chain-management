import { Eye, LoaderCircle, Truck } from 'lucide-react';
import type { ControlTowerSummaryResponse, ScenarioName, WhatIfResponse } from '../../lib/types';
import { formatCurrency, formatMetricDelta, formatPercent, humanizeStatus, humanizeStrategy } from '../../lib/presenters';
import { SCENARIO_OPTIONS } from '../../hooks/useControlTower';
import { kpiRow, modeTone } from './AgentShared';

interface ScenarioLabProps {
  summary: ControlTowerSummaryResponse | null;
  scenarioPreview: WhatIfResponse | null;
  scenario: ScenarioName;
  loading: boolean;
  actionLoading: string | null;
  onScenarioChange: (scenario: ScenarioName) => void;
  onPreviewScenario: (scenario: ScenarioName) => Promise<void>;
  onRunScenario: (scenario: ScenarioName) => Promise<void>;
}

export function ScenarioLab({
  summary,
  scenarioPreview,
  scenario,
  loading,
  actionLoading,
  onScenarioChange,
  onPreviewScenario,
  onRunScenario,
}: ScenarioLabProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[24px] font-bold text-nearBlack">Scenario Lab</h2>
        <p className="mt-1 text-[14px] text-secondaryGray">
          Use simulation separately from daily operations to preview disruption impact and rehearse recovery responses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
          <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Select a disruption scenario</div>
          <select
            value={scenario}
            onChange={(event) => onScenarioChange(event.target.value as ScenarioName)}
            className="mt-4 w-full rounded-card border border-borderGray bg-lightSurface px-4 py-3 text-[14px] font-medium text-nearBlack"
          >
            {SCENARIO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <div className="mt-5 flex flex-col gap-3">
            <button
              onClick={() => void onPreviewScenario(scenario)}
              disabled={loading || actionLoading !== null}
              className="flex items-center justify-center gap-2 rounded-card border border-borderGray bg-pureWhite px-4 py-3 text-[14px] font-semibold text-nearBlack transition-all hover:bg-lightSurface disabled:cursor-not-allowed disabled:bg-lightSurface disabled:text-nearBlack/40"
            >
              {actionLoading?.startsWith('preview:') ? <LoaderCircle size={16} className="animate-spin" /> : <Eye size={16} />}
              {actionLoading?.startsWith('preview:') ? 'Previewing...' : 'Preview simulated impact'}
            </button>
            <button
              onClick={() => void onRunScenario(scenario)}
              disabled={loading || actionLoading !== null}
              className="flex items-center justify-center gap-2 rounded-card bg-rausch px-4 py-3 text-[14px] font-bold text-pureWhite transition-all hover:bg-rausch/90 disabled:cursor-not-allowed disabled:bg-rausch/30"
            >
              {actionLoading?.startsWith('scenario:') ? <LoaderCircle size={16} className="animate-spin" /> : <Truck size={16} />}
              {actionLoading?.startsWith('scenario:') ? 'Simulating...' : 'Run simulated disruption'}
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
          <h3 className="text-[20px] font-bold text-nearBlack">Scenario preview</h3>
          {scenarioPreview && summary ? (
            <div className="mt-5 space-y-4">
              <div className={`inline-flex rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] ${modeTone(scenarioPreview.summary.mode)}`}>
                {humanizeStatus(scenarioPreview.summary.mode)}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {kpiRow(
                  'Service level',
                  formatPercent(summary.kpis.service_level),
                  formatPercent(scenarioPreview.summary.kpis.service_level),
                  formatMetricDelta(summary.kpis.service_level, scenarioPreview.summary.kpis.service_level, 'percent'),
                )}
                {kpiRow(
                  'Disruption risk',
                  formatPercent(summary.kpis.disruption_risk),
                  formatPercent(scenarioPreview.summary.kpis.disruption_risk),
                  formatMetricDelta(summary.kpis.disruption_risk, scenarioPreview.summary.kpis.disruption_risk, 'percent'),
                )}
                {kpiRow(
                  'Recovery speed',
                  formatPercent(summary.kpis.recovery_speed),
                  formatPercent(scenarioPreview.summary.kpis.recovery_speed),
                  formatMetricDelta(summary.kpis.recovery_speed, scenarioPreview.summary.kpis.recovery_speed, 'percent'),
                )}
                {kpiRow(
                  'Total cost',
                  formatCurrency(summary.kpis.total_cost),
                  formatCurrency(scenarioPreview.summary.kpis.total_cost),
                  formatMetricDelta(summary.kpis.total_cost, scenarioPreview.summary.kpis.total_cost, 'currency'),
                )}
              </div>

              <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4">
                <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Projected recommendation</div>
                <div className="mt-2 text-[16px] font-bold text-nearBlack">
                  {scenarioPreview.latest_plan ? humanizeStrategy(scenarioPreview.latest_plan.strategy_label) : 'No projected plan'}
                </div>
                <p className="mt-2 text-[13px] text-secondaryGray">
                  {scenarioPreview.latest_plan?.planner_reasoning ?? 'The simulation preview did not generate a recommendation package.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
              Preview a disruption here before running the simulation. This keeps what-if analysis separate from the live operations workflow.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

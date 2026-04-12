import { Activity, BrainCircuit, ShieldCheck } from 'lucide-react';

import type { ServiceRuntimeView } from '../../lib/types';
import {
  formatDurationMs,
  formatPercent,
  humanizeLabel,
} from '../../lib/presenters';

interface ServiceHealthPanelProps {
  serviceRuntime: ServiceRuntimeView | null;
}

function healthSummary(runtime: ServiceRuntimeView | null): {
  title: string;
  detail: string;
  tone: string;
} {
  if (!runtime) {
    return {
      title: 'Runtime unavailable',
      detail: 'Service health data has not been loaded yet.',
      tone: 'border-borderGray bg-lightSurface text-secondaryGray',
    };
  }

  const { flags, metrics } = runtime;
  if (!flags.llm_enabled) {
    return {
      title: 'Deterministic fallback mode',
      detail: 'AI reasoning is disabled, so the control tower is running only its policy and fallback paths.',
      tone: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  if (metrics.execution_failure_rate >= 0.2 || metrics.llm_fallback_rate >= 0.4) {
    return {
      title: 'Degraded service posture',
      detail: 'The backend is healthy enough to operate, but fallback or execution failure rates are elevated.',
      tone: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  return {
    title: 'Service operating normally',
    detail: 'AI reasoning, policy evaluation, and execution tracking are all available for operators.',
    tone: 'border-green-200 bg-green-50 text-green-700',
  };
}

export function ServiceHealthPanel({
  serviceRuntime,
}: ServiceHealthPanelProps) {
  const summary = healthSummary(serviceRuntime);

  return (
    <section className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[20px] font-bold text-nearBlack">
            System Health
          </h3>
          <p className="mt-1 text-[13px] text-secondaryGray">
            Runtime reliability, AI availability, and execution stability for the control tower service.
          </p>
        </div>
        <div className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ${summary.tone}`}>
          {summary.title}
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-borderGray bg-lightSurface p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-pureWhite p-3 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-rausch" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-nearBlack">
              {summary.title}
            </div>
            <p className="mt-1 text-[13px] text-secondaryGray">
              {summary.detail}
            </p>
          </div>
        </div>

        {serviceRuntime ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Average run time',
                  value: formatDurationMs(serviceRuntime.metrics.avg_run_duration_ms),
                },
                {
                  label: 'Agent step time',
                  value: formatDurationMs(serviceRuntime.metrics.avg_agent_step_duration_ms),
                },
                {
                  label: 'Fallback rate',
                  value: formatPercent(serviceRuntime.metrics.llm_fallback_rate),
                },
                {
                  label: 'Execution failure rate',
                  value: formatPercent(serviceRuntime.metrics.execution_failure_rate),
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-card border border-borderGray bg-pureWhite px-4 py-4"
                >
                  <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                    {metric.label}
                  </div>
                  <div className="mt-2 text-[18px] font-bold text-nearBlack">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-secondaryGray">
                  <BrainCircuit className="h-4 w-4" />
                  AI reasoning
                </div>
                <div className="mt-2 text-[16px] font-bold text-nearBlack">
                  {serviceRuntime.flags.llm_enabled ? 'Available' : 'Disabled'}
                </div>
                <p className="mt-2 text-[13px] text-secondaryGray">
                  Provider {humanizeLabel(serviceRuntime.flags.llm_provider)} · Model {serviceRuntime.flags.llm_model}
                </p>
              </div>

              <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-secondaryGray">
                  <Activity className="h-4 w-4" />
                  Runtime policy
                </div>
                <div className="mt-2 text-[16px] font-bold text-nearBlack">
                  {humanizeLabel(serviceRuntime.flags.degraded_mode)}
                </div>
                <p className="mt-2 text-[13px] text-secondaryGray">
                  Planner mode {humanizeLabel(serviceRuntime.flags.planner_mode)} · Dispatch mode {humanizeLabel(serviceRuntime.flags.dispatch_mode)}
                </p>
              </div>

              <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                  Service volume
                </div>
                <div className="mt-2 text-[16px] font-bold text-nearBlack">
                  {serviceRuntime.metrics.total_runs} runs tracked
                </div>
                <p className="mt-2 text-[13px] text-secondaryGray">
                  {serviceRuntime.metrics.total_events} events · {serviceRuntime.metrics.total_executions} execution records · latest run {serviceRuntime.metrics.latest_run_id ?? 'not available'}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

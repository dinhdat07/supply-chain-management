import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Eye,
  LoaderCircle,
  PackageSearch,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';

import type {
  ApprovalAction,
  ApprovalDetailView,
  CandidateEvaluationView,
  ControlTowerSummaryResponse,
  EventView,
  PendingApprovalView,
  ScenarioName,
  TraceView,
  WhatIfResponse,
} from '../lib/types';
import {
  describeActionTarget,
  describeActionTitle,
  formatCurrency,
  formatMetricDelta,
  formatPercent,
  humanizeAction,
  humanizeEntityId,
  humanizeEvent,
  humanizeLabel,
  humanizeNode,
  humanizeReasoningSource,
  humanizeStatus,
  humanizeStrategy,
  severitySummary,
  severityTone,
} from '../lib/presenters';
import { SCENARIO_OPTIONS } from '../hooks/useControlTower';

interface AgentProps {
  summary: ControlTowerSummaryResponse | null;
  trace: TraceView | null;
  pendingApproval: PendingApprovalView | null;
  approvalDetail: ApprovalDetailView | null;
  scenarioPreview: WhatIfResponse | null;
  loading: boolean;
  refreshing: boolean;
  actionLoading: string | null;
  error: string | null;
  onRefresh: () => Promise<void>;
  onPreviewScenario: (scenario: ScenarioName) => Promise<void>;
  onGenerateRecommendations: () => Promise<void>;
  onRunScenario: (scenario: ScenarioName) => Promise<void>;
  onApprovalAction: (action: ApprovalAction, decisionId: string) => Promise<void>;
}

type WorkspaceView = 'operations' | 'scenario' | 'approval';
type StageStatus = 'active' | 'complete' | 'pending';

function modeTone(mode: string | null | undefined): string {
  const tone = severityTone(mode);
  if (tone === 'critical') return 'border-errorRed/20 bg-errorRed/10 text-errorRed';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-green-200 bg-green-50 text-green-700';
}

function stageTone(status: StageStatus): string {
  if (status === 'active') return 'border-rausch bg-rausch/5 text-nearBlack shadow-card';
  if (status === 'complete') return 'border-green-200 bg-green-50 text-nearBlack';
  return 'border-borderGray bg-pureWhite text-secondaryGray';
}

function tracePhase(agent: string | null | undefined): string {
  if (agent === 'risk' || agent === 'demand' || agent === 'inventory' || agent === 'supplier' || agent === 'logistics') {
    return 'Assess';
  }
  if (agent === 'planner' || agent === 'critic') {
    return 'Plan';
  }
  if (agent === 'approval' || agent === 'approval_resolution') {
    return 'Approve';
  }
  if (agent === 'execution') {
    return 'Execute';
  }
  if (agent === 'reflection') {
    return 'Learn';
  }
  return 'Monitor';
}

function eventSummary(event: EventView | null | undefined): string {
  if (!event) return 'No disruption signal is active.';
  const affectedScope = event.entity_ids.length
    ? event.entity_ids.map((item) => humanizeEntityId(item)).join(', ')
    : 'the network';
  return `${humanizeEvent(event.type)} reported by ${humanizeLabel(event.source)} affecting ${affectedScope}`;
}

function snapshotEntries(snapshot: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(snapshot)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      if (typeof value === 'number') {
        return [humanizeLabel(key), Number.isInteger(value) ? value.toString() : value.toFixed(2)];
      }
      if (Array.isArray(value)) {
        return [humanizeLabel(key), value.join(', ')];
      }
      return [humanizeLabel(key), String(value)];
    });
}

function kpiRow(label: string, before: string, after: string, delta: string) {
  return (
    <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-4 text-[13px] text-secondaryGray">
      <div className="font-semibold text-nearBlack">{label}</div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-secondaryGray">Before</div>
          <div className="mt-1 font-semibold text-nearBlack">{before}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-secondaryGray">Projected</div>
          <div className="mt-1 font-semibold text-nearBlack">{after}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-secondaryGray">Change</div>
          <div className="mt-1 font-semibold text-nearBlack">{delta}</div>
        </div>
      </div>
    </div>
  );
}

function CandidatePlanCard({
  evaluation,
  selected,
}: {
  evaluation: CandidateEvaluationView;
  selected: boolean;
}) {
  return (
    <div className={`rounded-card border p-4 ${selected ? 'border-rausch bg-rausch/5' : 'border-borderGray bg-pureWhite'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-[16px] font-bold text-nearBlack">{humanizeStrategy(evaluation.strategy_label)}</h4>
          <p className="mt-1 text-[12px] uppercase tracking-wider text-secondaryGray">
            {selected ? 'Selected recommendation' : 'Alternative'}
          </p>
        </div>
        {selected ? (
          <span className="rounded-full bg-rausch px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-pureWhite">
            selected
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-secondaryGray">
        <div>Service <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.service_level)}</span></div>
        <div>Risk <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.disruption_risk)}</span></div>
        <div>Recovery <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.recovery_speed)}</span></div>
        <div>Cost <span className="font-semibold text-nearBlack">{formatCurrency(evaluation.projected_kpis.total_cost)}</span></div>
      </div>
      <p className="mt-3 text-[13px] text-secondaryGray">{evaluation.rationale}</p>
    </div>
  );
}

function workingState(refreshing: boolean, actionLoading: string | null): { title: string; detail: string } | null {
  if (refreshing) {
    return {
      title: 'Refreshing the network picture',
      detail: 'The control tower is pulling the latest state before the next recommendation cycle.',
    };
  }
  if (!actionLoading) return null;
  if (actionLoading === 'daily_plan') {
    return {
      title: 'Agents are building an action package',
      detail: 'Risk, demand, inventory, supplier, and logistics agents are coordinating before the planner selects the best package.',
    };
  }
  if (actionLoading.startsWith('preview:')) {
    return {
      title: 'Agents are previewing disruption impact',
      detail: 'The control tower is estimating KPI shifts before the scenario is applied to the live state.',
    };
  }
  if (actionLoading.startsWith('scenario:')) {
    return {
      title: 'Agents are simulating a live disruption',
      detail: 'The network state is being re-evaluated and the control tower is preparing a recovery package.',
    };
  }
  if (actionLoading.startsWith('approval:')) {
    return {
      title: 'Processing operator decision',
      detail: 'The approval gate is resolving the selected action and updating execution state.',
    };
  }
  return {
    title: 'Agents are working',
    detail: 'The control tower is processing the latest operator command.',
  };
}

function agentVisual(agent: string | null | undefined): {
  Icon: typeof BrainCircuit;
  bubbleClass: string;
  accentClass: string;
  selectedClass: string;
} {
  switch (agent) {
    case 'demand':
      return {
        Icon: TrendingUp,
        bubbleClass: 'bg-blue-100 text-blue-600',
        accentClass: 'border-l-blue-500',
        selectedClass: 'border-blue-500 bg-blue-50',
      };
    case 'inventory':
      return {
        Icon: PackageSearch,
        bubbleClass: 'bg-orange-100 text-orange-600',
        accentClass: 'border-l-orange-500',
        selectedClass: 'border-orange-500 bg-orange-50',
      };
    case 'supplier':
      return {
        Icon: Users,
        bubbleClass: 'bg-purple-100 text-purple-600',
        accentClass: 'border-l-purple-500',
        selectedClass: 'border-purple-500 bg-purple-50',
      };
    case 'logistics':
      return {
        Icon: Truck,
        bubbleClass: 'bg-green-100 text-green-600',
        accentClass: 'border-l-green-500',
        selectedClass: 'border-green-500 bg-green-50',
      };
    case 'risk':
      return {
        Icon: AlertCircle,
        bubbleClass: 'bg-errorRed/10 text-errorRed',
        accentClass: 'border-l-errorRed',
        selectedClass: 'border-errorRed/40 bg-errorRed/5',
      };
    case 'approval':
    case 'approval_resolution':
      return {
        Icon: ShieldAlert,
        bubbleClass: 'bg-amber-100 text-amber-700',
        accentClass: 'border-l-amber-500',
        selectedClass: 'border-amber-400 bg-amber-50',
      };
    case 'execution':
      return {
        Icon: CheckCircle2,
        bubbleClass: 'bg-green-100 text-green-700',
        accentClass: 'border-l-green-500',
        selectedClass: 'border-green-400 bg-green-50',
      };
    case 'reflection':
      return {
        Icon: RefreshCcw,
        bubbleClass: 'bg-slate-100 text-slate-600',
        accentClass: 'border-l-slate-500',
        selectedClass: 'border-slate-400 bg-slate-50',
      };
    case 'planner':
    case 'critic':
    default:
      return {
        Icon: BrainCircuit,
        bubbleClass: 'bg-rausch/10 text-rausch',
        accentClass: 'border-l-rausch',
        selectedClass: 'border-rausch bg-rausch/5',
      };
  }
}

export function Agent({
  summary,
  trace,
  pendingApproval,
  approvalDetail,
  scenarioPreview,
  loading,
  refreshing,
  actionLoading,
  error,
  onRefresh,
  onPreviewScenario,
  onGenerateRecommendations,
  onRunScenario,
  onApprovalAction,
}: AgentProps) {
  const [scenario, setScenario] = useState<ScenarioName>('supplier_delay');
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [workspace, setWorkspace] = useState<WorkspaceView>('operations');

  const steps = trace?.steps ?? [];
  const displayedSteps = steps.slice(0, visibleStepCount);
  const selectedStep = displayedSteps[selectedStepIndex] ?? displayedSteps[displayedSteps.length - 1] ?? null;
  const selectedPlan = approvalDetail?.plan ?? pendingApproval?.plan ?? trace?.latest_plan ?? summary?.latest_plan ?? null;
  const candidatePlans = trace?.candidate_evaluations ?? [];
  const alternativePlans = candidatePlans.filter((item) => item.strategy_label !== trace?.selected_strategy);
  const currentEvent = trace?.event ?? summary?.active_events[0] ?? null;
  const hasReflection = steps.some((step) => step.agent === 'reflection');
  const executionComplete = trace?.execution_status === 'executed' || trace?.execution_status === 'completed';
  const latestVisibleStepIndex = displayedSteps.length - 1;
  const activeWork = workingState(refreshing, actionLoading);

  useEffect(() => {
    if (!trace?.trace_id || steps.length === 0) {
      setVisibleStepCount(0);
      setSelectedStepIndex(0);
      return;
    }

    setVisibleStepCount(1);
    setSelectedStepIndex(0);

    const interval = window.setInterval(() => {
      setVisibleStepCount((current) => {
        if (current >= steps.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 320);

    return () => window.clearInterval(interval);
  }, [trace?.trace_id, steps.length]);

  useEffect(() => {
    if (selectedStepIndex >= displayedSteps.length) {
      setSelectedStepIndex(Math.max(displayedSteps.length - 1, 0));
    }
  }, [displayedSteps.length, selectedStepIndex]);

  const exceptionCount = summary?.alerts.length ?? 0;
  const recommendationState = pendingApproval
    ? 'Approval required'
    : selectedPlan
      ? 'Recommendation ready'
      : 'No recommendations generated yet';

  const workflowStages = useMemo(() => {
    const monitorComplete = Boolean(summary);
    const assessComplete = Boolean(currentEvent || exceptionCount > 0 || steps.length > 0);
    const planComplete = Boolean(selectedPlan);
    const approvalComplete = executionComplete;
    const learnComplete = hasReflection;

    return [
      {
        key: 'monitor',
        title: 'Monitor network',
        status: monitorComplete ? 'complete' : 'active',
        detail: summary ? `Mode: ${humanizeStatus(summary.mode)}` : 'Load the latest network picture.',
        action: 'Refresh signals',
        workspaceTarget: 'operations' as WorkspaceView,
      },
      {
        key: 'assess',
        title: 'Assess disruption',
        status: assessComplete ? 'complete' : monitorComplete ? 'active' : 'pending',
        detail: currentEvent ? eventSummary(currentEvent) : `${exceptionCount} exception signals in queue`,
        action: 'Review trace',
        workspaceTarget: 'operations' as WorkspaceView,
      },
      {
        key: 'plan',
        title: 'Prepare action package',
        status: planComplete ? 'complete' : assessComplete ? 'active' : 'pending',
        detail: selectedPlan
          ? `${humanizeStrategy(selectedPlan.strategy_label)} package prepared`
          : 'Generate recommendations when the operator is ready.',
        action: 'Build package',
        workspaceTarget: 'operations' as WorkspaceView,
      },
      {
        key: 'approve_execute',
        title: 'Approve or execute',
        status: pendingApproval ? 'active' : approvalComplete ? 'complete' : planComplete ? 'active' : 'pending',
        detail: pendingApproval
          ? approvalDetail?.approval_reason ?? pendingApproval.approval_reason
          : approvalComplete
            ? 'Recommended actions were executed successfully.'
            : 'Execution will proceed automatically only when no approval gate is triggered.',
        action: pendingApproval ? 'Open approval queue' : 'Review execution',
        workspaceTarget: pendingApproval ? 'approval' as WorkspaceView : 'operations' as WorkspaceView,
      },
      {
        key: 'learn',
        title: 'Capture learning',
        status: learnComplete ? 'complete' : approvalComplete ? 'active' : 'pending',
        detail: learnComplete
          ? 'Reflection memory was recorded for future runs.'
          : 'Learning is recorded after execution completes.',
        action: 'Review trace record',
        workspaceTarget: 'operations' as WorkspaceView,
      },
    ] as const;
  }, [approvalDetail?.approval_reason, currentEvent, exceptionCount, executionComplete, hasReflection, pendingApproval, selectedPlan, steps.length, summary]);

  const workQueue = useMemo(() => {
    if (!summary) return [];
    return [
      {
        title: 'Network state',
        value: humanizeStatus(summary.mode),
        detail: `${summary.active_events.length} active disruption signals`,
      },
      {
        title: 'Exceptions',
        value: `${exceptionCount}`,
        detail: exceptionCount > 0 ? 'Review high-priority exceptions first' : 'No urgent exceptions right now',
      },
      {
        title: 'Recommendation status',
        value: recommendationState,
        detail: selectedPlan
          ? `${humanizeStrategy(selectedPlan.strategy_label)} recommendation prepared`
          : 'Generate recommendations when exceptions require action',
      },
    ];
  }, [exceptionCount, recommendationState, selectedPlan, summary]);

  const workspaceOptions = [
    {
      key: 'operations' as WorkspaceView,
      label: 'Operations console',
      detail: currentEvent ? 'Live network management' : 'Daily operations review',
    },
    {
      key: 'scenario' as WorkspaceView,
      label: 'Scenario lab',
      detail: 'Simulation only',
    },
    {
      key: 'approval' as WorkspaceView,
      label: 'Approval queue',
      detail: pendingApproval ? '1 decision awaiting review' : 'No pending approvals',
    },
  ];

  const showOperations = workspace === 'operations';
  const showScenario = workspace === 'scenario';
  const showApproval = workspace === 'approval';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <header className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-rausch/10 p-3">
              <BrainCircuit className="h-6 w-6 text-rausch" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.18px] text-nearBlack">Control Tower</h1>
              <p className="mt-2 max-w-3xl text-[15px] text-secondaryGray">
                Review the current network state, generate recovery recommendations, simulate disruptions, and resolve approvals from one operating workspace.
              </p>
            </div>
          </div>

          <div className={`rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] ${modeTone(summary?.mode)}`}>
            {humanizeStatus(summary?.mode)}
          </div>
        </div>
      </header>

      {activeWork ? (
        <section className="rounded-[24px] border border-rausch/20 bg-rausch/5 p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-pureWhite p-2 shadow-card">
                <LoaderCircle className="h-5 w-5 animate-spin text-rausch" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-nearBlack">{activeWork.title}</h2>
                <p className="mt-1 text-[14px] text-secondaryGray">{activeWork.detail}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Risk agent', 'Inventory agent', 'Planner agent'].map((item) => (
                <span key={item} className="rounded-full border border-rausch/20 bg-pureWhite px-3 py-2 text-[12px] font-semibold text-rausch animate-pulse">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div>
          <h2 className="text-[24px] font-bold text-nearBlack">Operator Workflow</h2>
          <p className="mt-1 text-[14px] text-secondaryGray">
            The control tower runs through a fixed operating cadence: monitor, assess, plan, approve or execute, then learn.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {workflowStages.map((stage, index) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => setWorkspace(stage.workspaceTarget)}
              className={`rounded-[20px] border p-4 text-left transition-all ${stageTone(stage.status)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-pureWhite/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">
                  Stage {index + 1}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {humanizeStatus(stage.status)}
                </span>
              </div>
              <div className="mt-3 text-[17px] font-bold">{stage.title}</div>
              <p className="mt-2 text-[13px] leading-5">{stage.detail}</p>
              <div className="mt-3 text-[12px] font-semibold uppercase tracking-wider text-secondaryGray">
                {stage.action}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-borderGray bg-pureWhite p-4 shadow-card">
          <div className="flex flex-wrap gap-3">
            {workspaceOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setWorkspace(option.key)}
                className={`rounded-full border px-4 py-3 text-left transition-all ${
                  workspace === option.key
                    ? 'border-nearBlack bg-nearBlack text-pureWhite'
                    : 'border-borderGray bg-lightSurface text-nearBlack hover:bg-pureWhite'
                }`}
              >
                <div className="text-[13px] font-bold uppercase tracking-wider">{option.label}</div>
                <div className={`mt-1 text-[12px] ${workspace === option.key ? 'text-pureWhite/80' : 'text-secondaryGray'}`}>
                  {option.detail}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-5 py-4 text-[14px] text-errorRed">
          {error}
        </div>
      ) : null}

      {showOperations ? (
        <>
          <section className="space-y-5">
            <div>
              <h2 className="text-[24px] font-bold text-nearBlack">Operations Console</h2>
              <p className="mt-1 text-[14px] text-secondaryGray">
                Daily operator workflow: review network health, triage exceptions, and generate actionable recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(300px,0.75fr)]">
              <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
                <div className="rounded-[20px] border border-borderGray bg-lightSurface px-5 py-5">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-secondaryGray">System Health</div>
                  <div className="mt-2 text-[20px] font-bold text-nearBlack">Operational network snapshot</div>
                  <p className="mt-1 text-[14px] text-secondaryGray">
                    Review the latest service, recovery, risk, and latency signals before issuing the next command.
                  </p>

                  <div className="mt-5 grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                    <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4 shadow-sm">
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray leading-tight">Service level</div>
                      <div className="mt-2 whitespace-nowrap text-[26px] font-bold leading-none text-nearBlack">
                        {summary ? formatPercent(summary.kpis.service_level) : '--'}
                      </div>
                    </div>
                    <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4 shadow-sm">
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray leading-tight">Recovery speed</div>
                      <div className="mt-2 whitespace-nowrap text-[26px] font-bold leading-none text-nearBlack">
                        {summary ? formatPercent(summary.kpis.recovery_speed) : '--'}
                      </div>
                    </div>
                    <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4 shadow-sm">
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray leading-tight">Disruption risk</div>
                      <div className="mt-2 whitespace-nowrap text-[26px] font-bold leading-none text-nearBlack">
                        {summary ? formatPercent(summary.kpis.disruption_risk) : '--'}
                      </div>
                    </div>
                    <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4 shadow-sm">
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray leading-tight">Decision latency</div>
                      <div className="mt-2 whitespace-nowrap text-[26px] font-bold leading-none text-nearBlack">
                        {summary ? `${summary.kpis.decision_latency_ms.toFixed(0)} ms` : '--'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {workQueue.map((item) => (
                      <div key={item.title} className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">{item.title}</div>
                        <div className="mt-2 text-[18px] font-bold text-nearBlack">{item.value}</div>
                        <p className="mt-2 text-[13px] text-secondaryGray">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-card border border-borderGray bg-pureWhite px-5 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Action package ready</div>
                        <div className="mt-2 text-[20px] font-bold text-nearBlack">
                          {selectedPlan ? humanizeStrategy(selectedPlan.strategy_label) : 'No recommendation generated yet'}
                        </div>
                        <p className="mt-2 text-[14px] text-secondaryGray">
                          {trace?.selection_reason ?? selectedPlan?.planner_reasoning ?? 'Refresh the network and generate recommendations to prepare an action package.'}
                        </p>
                      </div>
                      {selectedPlan ? (
                        <div className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ${modeTone(selectedPlan.approval_status)}`}>
                          {humanizeStatus(selectedPlan.approval_status)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-borderGray bg-lightSurface p-5 shadow-card">
                <div className="rounded-[18px] border border-borderGray bg-pureWhite px-4 py-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-secondaryGray">Command Layer</div>
                  <div className="mt-2 text-[18px] font-bold text-nearBlack">Next operator action</div>
                  <p className="mt-1 text-[14px] text-secondaryGray">
                    Review system health first, then refresh the network or ask the control tower for a new recommendation package.
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      onClick={() => void onRefresh()}
                      disabled={loading || actionLoading !== null}
                      className="flex items-center justify-center gap-2 rounded-card border border-borderGray bg-lightSurface px-4 py-3 text-[14px] font-semibold text-nearBlack transition-all hover:bg-pureWhite disabled:cursor-not-allowed disabled:bg-lightSurface disabled:text-nearBlack/40"
                    >
                      <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                      {refreshing ? 'Refreshing...' : 'Refresh Network State'}
                    </button>
                    <button
                      onClick={() => void onGenerateRecommendations()}
                      disabled={loading || actionLoading !== null}
                      className="flex items-center justify-center gap-2 rounded-card bg-nearBlack px-5 py-3 text-[14px] font-bold text-pureWhite transition-all hover:bg-nearBlack/90 disabled:cursor-not-allowed disabled:bg-nearBlack/20 disabled:text-nearBlack/40"
                    >
                      {actionLoading === 'daily_plan' ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {actionLoading === 'daily_plan' ? 'Agents Planning...' : 'Generate Recommendations'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-borderGray bg-pureWhite px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-rausch" />
                    <div>
                      <h3 className="text-[18px] font-bold text-nearBlack">Exception Queue</h3>
                      <p className="text-[13px] text-secondaryGray">Review the most important operational exceptions first.</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {summary?.alerts.length ? (
                      summary.alerts.map((alert) => (
                        <div
                          key={`${alert.source}-${alert.title}`}
                          className={`rounded-card border px-4 py-4 ${
                            severityTone(alert.level) === 'critical'
                              ? 'border-errorRed/15 bg-errorRed/5'
                              : 'border-borderGray bg-lightSurface'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className={severityTone(alert.level) === 'critical' ? 'mt-0.5 text-errorRed' : 'mt-0.5 text-nearBlack'} size={18} />
                            <div>
                              <div className="text-[15px] font-semibold text-nearBlack">{alert.title}</div>
                              <p className="mt-1 text-[13px] text-secondaryGray">{alert.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-card border border-borderGray bg-lightSurface px-4 py-5 text-[14px] text-secondaryGray">
                        No urgent exceptions are active.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-[24px] font-bold text-nearBlack">Agent Timeline</h2>
              <p className="mt-1 text-[14px] text-secondaryGray">
                The control tower now reveals each agent stage progressively. Click any stage to inspect the reasoning behind that step.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Workflow path</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{humanizeLabel(trace?.current_branch)}</div>
                  </div>
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Latest stage</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{humanizeLabel(trace?.terminal_stage)}</div>
                  </div>
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Selected package</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{humanizeStrategy(trace?.selected_strategy)}</div>
                  </div>
                  <div className="rounded-card bg-lightSurface px-4 py-3">
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Action status</div>
                    <div className="mt-1 text-[16px] font-bold text-nearBlack">{humanizeStatus(trace?.execution_status)}</div>
                  </div>
                </div>

                {trace?.route_decisions.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {trace.route_decisions.map((route) => (
                      <span
                        key={`${route.from_node}-${route.to_node}-${route.outcome}`}
                        className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[12px] font-semibold text-secondaryGray"
                        title={route.reason}
                      >
                        {humanizeNode(route.from_node)} <ChevronRight className="inline h-3 w-3" /> {humanizeNode(route.to_node)}
                      </span>
                    ))}
                  </div>
                ) : null}

                {steps.length === 0 ? (
                  <div className="mt-6 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                    Generate recommendations or run a simulation to populate the staged agent timeline.
                  </div>
                ) : (
                  <div className="relative mt-6 space-y-4 before:absolute before:bottom-0 before:left-[23px] before:top-0 before:w-[2px] before:bg-gradient-to-b before:from-borderGray before:via-borderGray/50 before:to-transparent md:before:left-1/2 md:before:-translate-x-1/2">
                    {displayedSteps.map((step, index) => {
                      const visual = agentVisual(step.agent);
                      const isSelected = index === selectedStepIndex;
                      const isActive = index === latestVisibleStepIndex && (Boolean(actionLoading) || refreshing || !executionComplete);
                      const Icon = visual.Icon;

                      return (
                        <div
                          key={`${step.agent}-${step.started_at}`}
                          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedStepIndex(index)}
                            className={`flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-pureWhite shadow-card shrink-0 z-10 transition-transform hover:scale-110 md:order-1 md:odd:-translate-x-1/2 md:even:translate-x-1/2 ${visual.bubbleClass}`}
                          >
                            <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedStepIndex(index)}
                            className={`w-[calc(100%-4rem)] rounded-card border bg-pureWhite p-4 text-left shadow-card transition-all hover:shadow-hover md:w-[calc(50%-2.5rem)] ${
                              isSelected ? `${visual.selectedClass} border-[2px]` : 'border-borderGray'
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-lightSurface px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                                Step {index + 1}
                              </span>
                              <span className="rounded-full border border-borderGray bg-pureWhite px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                                {tracePhase(step.agent)}
                              </span>
                              {step.llm_used ? (
                                <span className="rounded-full bg-rausch/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-rausch">
                                  AI-assisted
                                </span>
                              ) : null}
                              {isActive ? (
                                <span className="rounded-full bg-nearBlack px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-pureWhite">
                                  Active
                                </span>
                              ) : null}
                            </div>
                            <h3 className="mt-3 text-[16px] font-bold text-nearBlack">{humanizeNode(step.agent)}</h3>
                            <div className={`mt-3 rounded-card border border-borderGray/60 bg-lightSurface p-3 border-l-[3px] ${visual.accentClass}`}>
                              <p className="text-[14px] font-medium text-nearBlack">{step.summary}</p>
                              <p className="mt-1 text-[12px] text-secondaryGray">
                                {step.completed_at ? 'Step completed and handed to the next agent.' : 'Step is currently in progress.'}
                              </p>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
                <h3 className="text-[20px] font-bold text-nearBlack">Stage Detail</h3>
                {selectedStep ? (
                  <div className="mt-5 space-y-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[18px] font-bold text-nearBlack">{humanizeNode(selectedStep.agent)}</span>
                        <span className="rounded-full bg-lightSurface px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                          {humanizeLabel(selectedStep.node_type)}
                        </span>
                        <span className="rounded-full border border-borderGray bg-pureWhite px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
                          {tracePhase(selectedStep.agent)}
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] text-secondaryGray">{selectedStep.summary}</p>
                      <p className="mt-2 text-[12px] uppercase tracking-wider text-secondaryGray">
                        Decision method: {humanizeReasoningSource(selectedStep.reasoning_source)}
                      </p>
                    </div>

                    {snapshotEntries(selectedStep.input_snapshot).length ? (
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">What the agent reviewed</div>
                        <div className="mt-3 space-y-2">
                          {snapshotEntries(selectedStep.input_snapshot).map(([label, value]) => (
                            <div key={`${label}-${value}`} className="flex flex-col gap-1 rounded-card border border-borderGray bg-lightSurface px-4 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-medium text-secondaryGray">{label}</span>
                              <span className="font-semibold text-nearBlack">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedStep.observations.length ? (
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">What the agent noticed</div>
                        <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                          {selectedStep.observations.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    ) : null}

                    {selectedStep.risks.length ? (
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Risks flagged</div>
                        <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                          {selectedStep.risks.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    ) : null}

                    {selectedStep.downstream_impacts.length ? (
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Downstream impact</div>
                        <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                          {selectedStep.downstream_impacts.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    ) : null}

                    {selectedStep.recommended_action_ids.length ? (
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Recommended actions</div>
                        <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                          {selectedStep.recommended_action_ids.map((item) => <li key={item}>• {humanizeAction(item)}</li>)}
                        </ul>
                      </div>
                    ) : null}

                    {selectedStep.tradeoffs.length ? (
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Operational tradeoffs</div>
                        <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                          {selectedStep.tradeoffs.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    ) : null}

                    {selectedStep.llm_error ? (
                      <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-4 py-3 text-[13px] text-errorRed">
                        AI assistance was unavailable for this step, so the system used its fallback path: {selectedStep.llm_error}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 rounded-card border border-borderGray bg-lightSurface px-5 py-6 text-[14px] text-secondaryGray">
                    Click a trace stage to inspect the detailed reasoning for that step.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}

      {showScenario ? (
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
                onChange={(event) => setScenario(event.target.value as ScenarioName)}
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
      ) : null}

      {showApproval ? (
        <section className="space-y-5">
          <div>
            <h2 className="text-[24px] font-bold text-nearBlack">Approval Queue</h2>
            <p className="mt-1 text-[14px] text-secondaryGray">
              Review blocked recommendations, understand KPI impact, and decide whether to approve, reject, or request a safer alternative.
            </p>
          </div>

          <div className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
            {pendingApproval && approvalDetail ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-1 text-amber-700" size={22} />
                    <div>
                      <h3 className="text-[22px] font-bold text-nearBlack">Approval required</h3>
                      <p className="mt-1 text-[14px] text-secondaryGray">{approvalDetail.approval_reason}</p>
                      <p className="mt-2 text-[13px] text-secondaryGray">
                        {humanizeStrategy(approvalDetail.plan.strategy_label)} action package prepared for operator review.
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                      onClick={() => void onApprovalAction('approve', approvalDetail.decision_id)}
                      disabled={actionLoading !== null}
                      className="rounded-card bg-nearBlack px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-nearBlack/20 disabled:text-nearBlack/40"
                    >
                      {actionLoading === 'approval:approve' ? 'Applying...' : 'Approve and execute'}
                    </button>
                    <button
                      onClick={() => void onApprovalAction('safer_plan', approvalDetail.decision_id)}
                      disabled={actionLoading !== null}
                      className="rounded-card bg-rausch px-4 py-3 text-[14px] font-bold text-pureWhite disabled:bg-rausch/30"
                    >
                      {actionLoading === 'approval:safer_plan' ? 'Rebuilding...' : 'Request safer alternative'}
                    </button>
                    <button
                      onClick={() => void onApprovalAction('reject', approvalDetail.decision_id)}
                      disabled={actionLoading !== null}
                      className="rounded-card border border-borderGray bg-pureWhite px-4 py-3 text-[14px] font-bold text-nearBlack disabled:bg-lightSurface"
                    >
                      {actionLoading === 'approval:reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
                  <div className="space-y-4">
                    <div className="rounded-card border border-borderGray bg-lightSurface px-5 py-5">
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Selected plan summary</div>
                      <div className="mt-2 text-[20px] font-bold text-nearBlack">{humanizeStrategy(approvalDetail.plan.strategy_label)}</div>
                      <p className="mt-2 text-[14px] text-secondaryGray">
                        {approvalDetail.selection_reason || approvalDetail.plan.planner_reasoning}
                      </p>
                    </div>

                    <div className="rounded-card border border-borderGray bg-pureWhite px-5 py-5">
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Disruption trigger</div>
                      <div className="mt-2 text-[16px] font-bold text-nearBlack">
                        {currentEvent ? humanizeEvent(currentEvent.type) : `${approvalDetail.event_ids.length} linked disruption signals`}
                      </div>
                      <p className="mt-2 text-[14px] text-secondaryGray">
                        {currentEvent
                          ? `${eventSummary(currentEvent)}. ${severitySummary(currentEvent.severity)}.`
                          : 'This recommendation package is linked to a previously recorded disruption.'}
                      </p>
                    </div>

                    <div>
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Actions to be executed</div>
                      <div className="mt-3 space-y-3">
                        {approvalDetail.plan.actions.map((action) => (
                          <div key={action.action_id} className="rounded-card border border-borderGray px-4 py-4">
                            <div className="flex items-center gap-2 text-[15px] font-bold text-nearBlack">
                              <CheckCircle2 size={16} className="text-rausch" />
                              {describeActionTitle(action.action_type, action.target_id)}
                            </div>
                            <p className="mt-2 text-[14px] text-secondaryGray">{action.reason}</p>
                            <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] uppercase tracking-wider text-secondaryGray sm:grid-cols-2">
                              <div>{describeActionTarget(action.action_type, action.target_id)}</div>
                              <div>Recovery window {action.estimated_recovery_hours.toFixed(1)}h</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Projected KPI impact</div>
                      <div className="mt-3 space-y-3">
                        {kpiRow(
                          'Service level',
                          formatPercent(approvalDetail.before_kpis.service_level),
                          formatPercent(approvalDetail.after_kpis.service_level),
                          formatMetricDelta(approvalDetail.before_kpis.service_level, approvalDetail.after_kpis.service_level, 'percent'),
                        )}
                        {kpiRow(
                          'Disruption risk',
                          formatPercent(approvalDetail.before_kpis.disruption_risk),
                          formatPercent(approvalDetail.after_kpis.disruption_risk),
                          formatMetricDelta(approvalDetail.before_kpis.disruption_risk, approvalDetail.after_kpis.disruption_risk, 'percent'),
                        )}
                        {kpiRow(
                          'Recovery speed',
                          formatPercent(approvalDetail.before_kpis.recovery_speed),
                          formatPercent(approvalDetail.after_kpis.recovery_speed),
                          formatMetricDelta(approvalDetail.before_kpis.recovery_speed, approvalDetail.after_kpis.recovery_speed, 'percent'),
                        )}
                        {kpiRow(
                          'Total cost',
                          formatCurrency(approvalDetail.before_kpis.total_cost),
                          formatCurrency(approvalDetail.after_kpis.total_cost),
                          formatMetricDelta(approvalDetail.before_kpis.total_cost, approvalDetail.after_kpis.total_cost, 'currency'),
                        )}
                      </div>
                    </div>

                    <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-4">
                      <div className="text-[12px] uppercase tracking-wider text-amber-800">Risk explanation</div>
                      <p className="mt-2 text-[14px] text-amber-900">{approvalDetail.approval_reason}</p>
                    </div>
                  </div>
                </div>

                {alternativePlans.length > 0 ? (
                  <div>
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Alternative plans</div>
                    <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {alternativePlans.slice(0, 2).map((item) => (
                        <CandidatePlanCard key={item.strategy_label} evaluation={item} selected={false} />
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
      ) : null}
    </div>
  );
}

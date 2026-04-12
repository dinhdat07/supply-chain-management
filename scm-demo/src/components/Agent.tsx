import { useEffect, useState } from "react";
import type {
  ApprovalAction,
  ApprovalDetailView,
  ControlTowerSummaryResponse,
  ControlTowerStateView,
  DecisionLogDetailView,
  ExecutionRecordView,
  PendingApprovalView,
  RunView,
  ScenarioName,
  TraceView,
  WhatIfResponse,
} from "../lib/types";
import { humanizeStatus, humanizeStrategy } from "../lib/presenters";

// Sub-components
import { ControlTowerHeader } from "./agent/ControlTowerHeader";
import { ActiveWorkSection } from "./agent/ActiveWorkSection";
import { WorkflowSection, type WorkspaceView } from "./agent/WorkflowSection";
import { OperationsConsole } from "./agent/OperationsConsole";
import { AgentTimeline } from "./agent/AgentTimeline";
import { ExecutionDashboard } from "./agent/ExecutionDashboard";
import { RunLedger } from "./agent/RunLedger";
import { ScenarioLab } from "./agent/ScenarioLab";
import { ApprovalQueue } from "./agent/ApprovalQueue";

// Shared Utils
import { eventSummary, type StageStatus } from "./agent/AgentShared";

interface AgentProps {
  summary: ControlTowerSummaryResponse | null;
  trace: TraceView | null;
  pendingApproval: PendingApprovalView | null;
  approvalDetail: ApprovalDetailView | null;
  scenarioPreview: WhatIfResponse | null;
  runHistory: RunView[];
  selectedRun: RunView | null;
  selectedRunTrace: TraceView | null;
  selectedRunState: ControlTowerStateView | null;
  selectedRunDecision: DecisionLogDetailView | null;
  selectedRunExecution: ExecutionRecordView | null;
  scenario: ScenarioName;
  loading: boolean;
  refreshing: boolean;
  actionLoading: string | null;
  historyLoading: boolean;
  error: string | null;
  onScenarioChange: (scenario: ScenarioName) => void;
  onRefresh: () => Promise<void>;
  onPreviewScenario: (scenario: ScenarioName) => Promise<void>;
  onGenerateRecommendations: () => Promise<void>;
  onRunScenario: (scenario: ScenarioName) => Promise<void>;
  onApprovalAction: (
    action: ApprovalAction,
    decisionId: string,
  ) => Promise<void>;
  onSelectRun: (runId: string) => Promise<void>;
}

function workingState(
  refreshing: boolean,
  actionLoading: string | null,
): { title: string; detail: string } | null {
  if (refreshing) {
    return {
      title: "Refreshing the network picture",
      detail:
        "The control tower is pulling the latest state before the next recommendation cycle.",
    };
  }
  if (!actionLoading) return null;
  if (actionLoading === "daily_plan") {
    return {
      title: "Agents are building an action package",
      detail:
        "Risk, demand, inventory, supplier, and logistics agents are coordinating before the planner selects the best package.",
    };
  }
  if (actionLoading.startsWith("preview:")) {
    return {
      title: "Agents are previewing disruption impact",
      detail:
        "The control tower is estimating KPI shifts before the scenario is applied to the live state.",
    };
  }
  if (actionLoading.startsWith("scenario:")) {
    return {
      title: "Agents are simulating a live disruption",
      detail:
        "The network state is being re-evaluated and the control tower is preparing a recovery package.",
    };
  }
  if (actionLoading.startsWith("approval:")) {
    return {
      title: "Processing operator decision",
      detail:
        "The approval gate is resolving the selected action and updating execution state.",
    };
  }
  return {
    title: "Agents are working",
    detail: "The control tower is processing the latest operator command.",
  };
}

export function Agent({
  summary,
  trace,
  pendingApproval,
  approvalDetail,
  scenarioPreview,
  runHistory,
  selectedRun,
  selectedRunTrace,
  selectedRunState,
  selectedRunDecision,
  selectedRunExecution,
  scenario,
  loading,
  refreshing,
  actionLoading,
  historyLoading,
  error,
  onScenarioChange,
  onRefresh,
  onPreviewScenario,
  onGenerateRecommendations,
  onRunScenario,
  onApprovalAction,
  onSelectRun,
}: AgentProps) {
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [workspace, setWorkspace] = useState<WorkspaceView>("operations");

  const steps = trace?.steps ?? [];
  const displayedSteps = steps.slice(0, visibleStepCount);
  const selectedPlan =
    approvalDetail?.plan ??
    pendingApproval?.plan ??
    trace?.latest_plan ??
    summary?.latest_plan ??
    null;
  const candidatePlans = trace?.candidate_evaluations ?? [];
  const alternativePlans = candidatePlans.filter(
    (item) => item.strategy_label !== trace?.selected_strategy,
  );
  const currentEvent = trace?.event ?? summary?.active_events[0] ?? null;
  const hasReflection = steps.some((step) => step.agent === "reflection");
  const executionComplete =
    trace?.execution_status === "executed" ||
    trace?.execution_status === "completed";
  const latestVisibleStepIndex = displayedSteps.length - 1;
  const activeWork = workingState(refreshing, actionLoading);

  useEffect(() => {
    if (!trace?.trace_id || steps.length === 0) {
      const resetTimer = window.setTimeout(() => {
        setVisibleStepCount(0);
        setSelectedStepIndex(0);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const startTimer = window.setTimeout(() => {
      setVisibleStepCount(1);
      setSelectedStepIndex(0);
    }, 0);
    let interval = 0;

    const intervalStarter = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setVisibleStepCount((current) => {
          if (current >= steps.length) {
            window.clearInterval(interval);
            return current;
          }
          return current + 1;
        });
      }, 320);
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(intervalStarter);
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [trace?.trace_id, steps.length]);

  const exceptionCount = summary?.alerts.length ?? 0;
  const recommendationState = pendingApproval
    ? "Approval required"
    : selectedPlan
      ? "Recommendation ready"
      : "No recommendations generated yet";

  const workflowStages = [
    {
      key: "monitor",
      title: "Monitor network",
      status: (summary ? "complete" : "active") as StageStatus,
      detail: summary
        ? `Mode: ${humanizeStatus(summary.mode)}`
        : "Load the latest network picture.",
      action: "Refresh signals",
      workspaceTarget: "operations" as WorkspaceView,
    },
    {
      key: "assess",
      title: "Assess disruption",
      status: (currentEvent || exceptionCount > 0 || steps.length > 0
        ? "complete"
        : summary
          ? "active"
          : "pending") as StageStatus,
      detail: currentEvent
        ? eventSummary(currentEvent)
        : `${exceptionCount} exception signals in queue`,
      action: "Review trace",
      workspaceTarget: "operations" as WorkspaceView,
    },
    {
      key: "plan",
      title: "Prepare action package",
      status: (selectedPlan
        ? "complete"
        : currentEvent || exceptionCount > 0 || steps.length > 0
          ? "active"
          : "pending") as StageStatus,
      detail: selectedPlan
        ? `${humanizeStrategy(selectedPlan.strategy_label)} package prepared`
        : "Generate recommendations when the operator is ready.",
      action: "Build package",
      workspaceTarget: "operations" as WorkspaceView,
    },
    {
      key: "approve_execute",
      title: "Approve or execute",
      status: (pendingApproval
        ? "active"
        : executionComplete
          ? "complete"
          : selectedPlan
            ? "active"
            : "pending") as StageStatus,
      detail: pendingApproval
        ? (approvalDetail?.approval_reason ?? pendingApproval.approval_reason)
        : executionComplete
          ? "Recommended actions were executed successfully."
          : "Execution will proceed automatically only when no approval gate is triggered.",
      action: pendingApproval ? "Open approval queue" : "Review execution",
      workspaceTarget: pendingApproval
        ? ("approval" as WorkspaceView)
        : ("operations" as WorkspaceView),
    },
    {
      key: "learn",
      title: "Capture learning",
      status: (hasReflection
        ? "complete"
        : executionComplete
          ? "active"
          : "pending") as StageStatus,
      detail: hasReflection
        ? "Reflection memory was recorded for future runs."
        : "Learning is recorded after execution completes.",
      action: "Review trace record",
      workspaceTarget: "operations" as WorkspaceView,
    },
  ] as const;

  const workQueue = !summary
    ? []
    : [
        {
          title: "Network state",
          value: humanizeStatus(summary.mode),
          detail: `${summary.inventory_items} SKUs, ${summary.suppliers} suppliers, ${summary.routes} routes tracked.`,
        },
        {
          title: "Exceptions",
          value: `${exceptionCount}`,
          detail:
            exceptionCount > 0
              ? "Review high-priority exceptions first"
              : "No urgent exceptions right now",
        },
        {
          title: "Recommendation status",
          value: recommendationState,
          detail: selectedPlan
            ? `${humanizeStrategy(selectedPlan.strategy_label)} recommendation prepared`
            : "Generate recommendations when exceptions require action",
        },
      ];

  const workspaceOptions = [
    {
      key: "operations" as WorkspaceView,
      label: "Operations console",
      detail: currentEvent
        ? "Live network management"
        : "Daily operations review",
    },
    {
      key: "execution" as WorkspaceView,
      label: "Execution pipeline",
      detail: executionComplete ? "Last run complete" : selectedPlan ? "Ready to dispatch" : "No plan",
    },
    {
      key: "scenario" as WorkspaceView,
      label: "Scenario lab",
      detail: "Simulation only",
    },
    {
      key: "approval" as WorkspaceView,
      label: "Approval queue",
      detail: pendingApproval
        ? "1 decision awaiting review"
        : "No pending approvals",
    },
  ];

  const showOperations = workspace === "operations";
  const showScenario = workspace === "scenario";
  const showApproval = workspace === "approval";
  const showExecution = workspace === "execution";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <ControlTowerHeader mode={summary?.mode} />

      <ActiveWorkSection activeWork={activeWork} />

      <WorkflowSection
        workflowStages={workflowStages}
        workspaceOptions={workspaceOptions}
        currentWorkspace={workspace}
        onWorkspaceChange={setWorkspace}
      />

      {error ? (
        <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-5 py-4 text-[14px] text-errorRed">
          {error}
        </div>
      ) : null}

      {showOperations ? (
        <>
          <OperationsConsole
            summary={summary}
            trace={trace}
            workQueue={workQueue}
            loading={loading}
            refreshing={refreshing}
            actionLoading={actionLoading}
            onRefresh={onRefresh}
            onGenerateRecommendations={onGenerateRecommendations}
          />

          <div className="mt-8">
            <AgentTimeline
              trace={trace}
              displayedSteps={displayedSteps}
              selectedStepIndex={selectedStepIndex}
              latestVisibleStepIndex={latestVisibleStepIndex}
              actionLoading={actionLoading}
              refreshing={refreshing}
              executionComplete={executionComplete}
              onSelectStep={setSelectedStepIndex}
            />
          </div>

          <RunLedger
            runHistory={runHistory}
            selectedRun={selectedRun}
            selectedRunTrace={selectedRunTrace}
            selectedRunState={selectedRunState}
            selectedRunDecision={selectedRunDecision}
            selectedRunExecution={selectedRunExecution}
            historyLoading={historyLoading}
            onSelectRun={onSelectRun}
          />
        </>
      ) : null}

      {showScenario ? (
        <ScenarioLab
          summary={summary}
          scenarioPreview={scenarioPreview}
          scenario={scenario}
          loading={loading}
          actionLoading={actionLoading}
          onScenarioChange={onScenarioChange}
          onPreviewScenario={onPreviewScenario}
          onRunScenario={onRunScenario}
        />
      ) : null}

      {showExecution ? (
        <ExecutionDashboard
          plan={selectedPlan}
          decisionId={trace?.decision_id ?? approvalDetail?.decision_id ?? pendingApproval?.decision_id ?? null}
        />
      ) : null}

      {showApproval ? (
        <ApprovalQueue
          pendingApproval={pendingApproval}
          approvalDetail={approvalDetail}
          actionLoading={actionLoading}
          currentEvent={currentEvent}
          alternativePlans={alternativePlans}
          onApprovalAction={onApprovalAction}
        />
      ) : null}
    </div>
  );
}

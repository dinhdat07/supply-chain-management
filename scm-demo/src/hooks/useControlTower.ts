import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchApproval,
  fetchDecisionDetail,
  fetchEvents,
  fetchExecution,
  fetchExecutionList,
  fetchInventory,
  fetchPendingApproval,
  fetchReflections,
  fetchRun,
  fetchRuns,
  fetchRunState,
  fetchRunTrace,
  fetchServiceRuntime,
  fetchSummary,
  fetchSuppliers,
  fetchTrace,
  previewScenario,
  runDailyPlan,
  runScenario,
  submitApproval,
} from '../lib/api';
import type {
  ActionExecutionRecordView,
  ApprovalAction,
  ApprovalDetailView,
  ControlTowerStateView,
  ControlTowerSummaryResponse,
  DecisionLogDetailView,
  EventView,
  ExecutionRecordView,
  InventoryRowView,
  PendingApprovalView,
  ReflectionView,
  RunView,
  ScenarioName,
  ServiceRuntimeView,
  SupplierRowView,
  TraceView,
  WhatIfResponse,
} from '../lib/types';

export const SCENARIO_OPTIONS: Array<{ label: string; value: ScenarioName }> = [
  { label: 'Supplier Delay', value: 'supplier_delay' },
  { label: 'Demand Spike', value: 'demand_spike' },
  { label: 'Route Blockage', value: 'route_blockage' },
  { label: 'Compound Disruption', value: 'compound_disruption' },
];

interface ControlTowerData {
  summary: ControlTowerSummaryResponse | null;
  inventory: InventoryRowView[];
  suppliers: SupplierRowView[];
  events: EventView[];
  reflections: ReflectionView[];
  executionHistory: ActionExecutionRecordView[];
  serviceRuntime: ServiceRuntimeView | null;
  trace: TraceView | null;
  pendingApproval: PendingApprovalView | null;
  approvalDetail: ApprovalDetailView | null;
  scenarioPreview: WhatIfResponse | null;
  runHistory: RunView[];
  selectedRunId: string | null;
  selectedRun: RunView | null;
  selectedRunTrace: TraceView | null;
  selectedRunState: ControlTowerStateView | null;
  selectedRunDecision: DecisionLogDetailView | null;
  selectedRunExecution: ExecutionRecordView | null;
}

function isNotFoundError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('not found') || message.includes('404');
}

const INITIAL_DATA: ControlTowerData = {
  summary: null,
  inventory: [],
  suppliers: [],
  events: [],
  reflections: [],
  executionHistory: [],
  serviceRuntime: null,
  trace: null,
  pendingApproval: null,
  approvalDetail: null,
  scenarioPreview: null,
  runHistory: [],
  selectedRunId: null,
  selectedRun: null,
  selectedRunTrace: null,
  selectedRunState: null,
  selectedRunDecision: null,
  selectedRunExecution: null,
};

export function useControlTower() {
  const [data, setData] = useState<ControlTowerData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedRunIdRef = useRef<string | null>(null);

  const loadRunArtifacts = useCallback(async (runId: string) => {
    const [runResponse, traceResponse, stateResponse] = await Promise.all([
      fetchRun(runId),
      fetchRunTrace(runId),
      fetchRunState(runId),
    ]);
    const run = runResponse.item;
    const [decisionResponse, executionResponse] = await Promise.all([
      run.decision_id
        ? fetchDecisionDetail(run.decision_id).catch((error: unknown) => {
            if (isNotFoundError(error)) return null;
            throw error;
          })
        : Promise.resolve(null),
      run.execution_id ? fetchExecution(run.execution_id) : Promise.resolve(null),
    ]);
    return {
      selectedRunId: run.run_id,
      selectedRun: run,
      selectedRunTrace: traceResponse.item,
      selectedRunState: stateResponse.state,
      selectedRunDecision: decisionResponse?.item ?? null,
      selectedRunExecution: executionResponse?.item ?? null,
    };
  }, []);

  const loadAll = useCallback(async (preferredRunId?: string | null) => {
    const [summary, inventory, suppliers, events, reflections, serviceRuntime, trace, pendingApproval, runs, executionHistory] = await Promise.all([
      fetchSummary(),
      fetchInventory(),
      fetchSuppliers(),
      fetchEvents(),
      fetchReflections(),
      fetchServiceRuntime(),
      fetchTrace(),
      fetchPendingApproval(),
      fetchRuns(),
      fetchExecutionList(),
    ]);
    const approvalDetail = pendingApproval.item
      ? await fetchApproval(pendingApproval.item.decision_id)
      : null;
    const availableRuns = runs.items;
    const nextRunId = preferredRunId && availableRuns.some((item) => item.run_id === preferredRunId)
      ? preferredRunId
      : availableRuns[0]?.run_id ?? null;
    const runArtifacts = nextRunId
      ? await loadRunArtifacts(nextRunId)
      : {
          selectedRunId: null,
          selectedRun: null,
          selectedRunTrace: null,
          selectedRunState: null,
          selectedRunDecision: null,
          selectedRunExecution: null,
        };
    selectedRunIdRef.current = runArtifacts.selectedRunId;

    setData({
      summary,
      inventory: inventory.items,
      suppliers: suppliers.items,
      events: events.items,
      reflections: reflections.items,
      executionHistory: executionHistory.items,
      serviceRuntime: serviceRuntime.item,
      trace: trace.item,
      pendingApproval: pendingApproval.item ?? null,
      approvalDetail: approvalDetail?.item ?? null,
      scenarioPreview: null,
      runHistory: availableRuns,
      ...runArtifacts,
    });
  }, [loadRunArtifacts]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadAll(selectedRunIdRef.current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to refresh control tower state.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [loadAll]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleRunDailyPlan() {
    setActionLoading('daily_plan');
    try {
      await runDailyPlan();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to run daily plan.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRunScenario(scenario: ScenarioName) {
    setActionLoading(`scenario:${scenario}`);
    try {
      await runScenario(scenario);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to run scenario.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePreviewScenario(scenario: ScenarioName) {
    setActionLoading(`preview:${scenario}`);
    try {
      const preview = await previewScenario(scenario);
      setData((current) => ({ ...current, scenarioPreview: preview }));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to preview scenario.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproval(action: ApprovalAction, decisionId: string) {
    setActionLoading(`approval:${action}`);
    try {
      await submitApproval(decisionId, action);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to apply approval action.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSelectRun(runId: string) {
    setHistoryLoading(true);
    setError(null);
    try {
      const artifacts = await loadRunArtifacts(runId);
      selectedRunIdRef.current = runId;
      setData((current) => ({
        ...current,
        ...artifacts,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load run details.');
    } finally {
      setHistoryLoading(false);
    }
  }

  return {
    ...data,
    loading,
    refreshing,
    actionLoading,
    historyLoading,
    error,
    refresh,
    previewScenario: handlePreviewScenario,
    runDailyPlan: handleRunDailyPlan,
    runScenario: handleRunScenario,
    applyApproval: handleApproval,
    selectRun: handleSelectRun,
  };
}

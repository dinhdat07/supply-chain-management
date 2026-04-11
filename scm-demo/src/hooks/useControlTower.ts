import { useEffect, useState } from 'react';

import {
  fetchApproval,
  fetchInventory,
  fetchPendingApproval,
  fetchSummary,
  fetchSuppliers,
  fetchTrace,
  previewScenario,
  runDailyPlan,
  runScenario,
  submitApproval,
} from '../lib/api';
import type {
  ApprovalAction,
  ApprovalDetailView,
  ControlTowerSummaryResponse,
  InventoryRowView,
  PendingApprovalView,
  ScenarioName,
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
  trace: TraceView | null;
  pendingApproval: PendingApprovalView | null;
  approvalDetail: ApprovalDetailView | null;
  scenarioPreview: WhatIfResponse | null;
}

const INITIAL_DATA: ControlTowerData = {
  summary: null,
  inventory: [],
  suppliers: [],
  trace: null,
  pendingApproval: null,
  approvalDetail: null,
  scenarioPreview: null,
};

export function useControlTower() {
  const [data, setData] = useState<ControlTowerData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [summary, inventory, suppliers, trace, pendingApproval] = await Promise.all([
      fetchSummary(),
      fetchInventory(),
      fetchSuppliers(),
      fetchTrace(),
      fetchPendingApproval(),
    ]);
    const approvalDetail = pendingApproval.item
      ? await fetchApproval(pendingApproval.item.decision_id)
      : null;

    setData({
      summary,
      inventory: inventory.items,
      suppliers: suppliers.items,
      trace: trace.item,
      pendingApproval: pendingApproval.item ?? null,
      approvalDetail: approvalDetail?.item ?? null,
      scenarioPreview: null,
    });
  }

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      await loadAll();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to refresh control tower state.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

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

  return {
    ...data,
    loading,
    refreshing,
    actionLoading,
    error,
    refresh,
    previewScenario: handlePreviewScenario,
    runDailyPlan: handleRunDailyPlan,
    runScenario: handleRunScenario,
    applyApproval: handleApproval,
  };
}

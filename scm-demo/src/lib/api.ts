import type {
  ApprovalAction,
  ApprovalCommandResultResponse,
  ApprovalDetailResponse,
  ControlTowerSummaryResponse,
  InventoryListResponse,
  PendingApprovalResponse,
  ScenarioName,
  SupplierListResponse,
  TraceResponse,
  WhatIfResponse,
} from './types';

const API_BASE = '/api/v1';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = typeof payload.detail === 'string'
        ? payload.detail
        : payload.detail?.message ?? payload.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchSummary() {
  return requestJson<ControlTowerSummaryResponse>('/control-tower/summary');
}

export function fetchInventory() {
  return requestJson<InventoryListResponse>('/inventory');
}

export function fetchSuppliers() {
  return requestJson<SupplierListResponse>('/suppliers');
}

export function fetchTrace() {
  return requestJson<TraceResponse>('/trace/latest');
}

export function fetchPendingApproval() {
  return requestJson<PendingApprovalResponse>('/approvals/pending');
}

export function fetchApproval(decisionId: string) {
  return requestJson<ApprovalDetailResponse>(`/approvals/${decisionId}`);
}

export function runDailyPlan() {
  return requestJson('/plan/daily', { method: 'POST' });
}

export function runScenario(scenarioName: ScenarioName) {
  return requestJson('/scenarios/run', {
    method: 'POST',
    body: JSON.stringify({ scenario_name: scenarioName }),
  });
}

export function previewScenario(scenarioName: ScenarioName) {
  return requestJson<WhatIfResponse>('/what-if', {
    method: 'POST',
    body: JSON.stringify({ scenario_name: scenarioName }),
  });
}

export function submitApproval(decisionId: string, action: ApprovalAction) {
  return requestJson<ApprovalCommandResultResponse>(`/approvals/${decisionId}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

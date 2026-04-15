import type {
  ActionExecutionRecordView,
  ApprovalAction,
  ApprovalCommandResultResponse,
  ApprovalDetailResponse,
  ControlTowerSummaryResponse,
  DecisionLogDetailResponse,
  EventListResponse,
  ExecutionDetailResponse,
  ExecutionListResponse,
  InventoryListResponse,
  PendingApprovalResponse,
  PlanDispatchResponse,
  ReflectionListResponse,
  RunDetailResponse,
  RunListResponse,
  RunStateResponse,
  ScenarioName,
  ServiceRuntimeResponse,
  StreamTriggerResponse,
  SupplierListResponse,
  TraceResponse,
  WhatIfResponse,
} from "./types";

const API_BASE = "/api/v1";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message =
        typeof payload.detail === "string"
          ? payload.detail
          : (payload.detail?.message ?? payload.message ?? message);
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchSummary() {
  return requestJson<ControlTowerSummaryResponse>("/control-tower/summary");
}

export function fetchInventory() {
  return requestJson<InventoryListResponse>("/inventory");
}

export function fetchSuppliers() {
  return requestJson<SupplierListResponse>("/suppliers");
}

export function fetchEvents(limit = 8) {
  return requestJson<EventListResponse>(`/events?limit=${limit}`);
}

export function fetchTrace() {
  return requestJson<TraceResponse>("/trace/latest");
}

export function fetchRuns() {
  return requestJson<RunListResponse>("/runs?limit=12");
}

export function fetchRun(runId: string) {
  return requestJson<RunDetailResponse>(`/runs/${runId}`);
}

export function fetchRunTrace(runId: string) {
  return requestJson<TraceResponse>(`/runs/${runId}/trace`);
}

export function fetchRunState(runId: string) {
  return requestJson<RunStateResponse>(`/runs/${runId}/state`);
}

export function fetchExecution(executionId: string) {
  return requestJson<ExecutionDetailResponse>(`/execution/${executionId}`);
}

export function fetchExecutionList(limit = 25) {
  return requestJson<ExecutionListResponse>(`/execution?limit=${limit}`);
}

export function fetchDecisionDetail(decisionId: string) {
  return requestJson<DecisionLogDetailResponse>(`/decision-logs/${decisionId}`);
}

export function fetchReflections() {
  return requestJson<ReflectionListResponse>("/reflections");
}

export function fetchServiceRuntime() {
  return requestJson<ServiceRuntimeResponse>("/service/runtime");
}

export function fetchPendingApproval() {
  return requestJson<PendingApprovalResponse>("/approvals/pending");
}

export function fetchApproval(decisionId: string) {
  return requestJson<ApprovalDetailResponse>(`/approvals/${decisionId}`);
}

export function runDailyPlan() {
  return requestJson("/plan/daily", { method: "POST" });
}

export function runScenario(scenarioName: ScenarioName) {
  return requestJson("/scenarios/run", {
    method: "POST",
    body: JSON.stringify({ scenario_name: scenarioName }),
  });
}

export function previewScenario(scenarioName: ScenarioName) {
  return requestJson<WhatIfResponse>("/what-if", {
    method: "POST",
    body: JSON.stringify({ scenario_name: scenarioName }),
  });
}

export function submitApproval(decisionId: string, action: ApprovalAction) {
  return requestJson<ApprovalCommandResultResponse>(
    `/approvals/${decisionId}`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    },
  );
}

export function selectApprovalAlternative(
  decisionId: string,
  strategyLabel: string,
) {
  return requestJson<ApprovalCommandResultResponse>(
    `/approvals/${decisionId}/select-alternative`,
    {
      method: "POST",
      body: JSON.stringify({ strategy_label: strategyLabel }),
    },
  );
}

export function resetSystem() {
  return requestJson("/reset", { method: "POST" });
}

export function dispatchPlan(planId: string, mode: "dry_run" | "commit") {
  return requestJson<PlanDispatchResponse>(`/execution/${planId}/dispatch`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export function updateExecutionProgress(
  executionId: string,
  percentage: number,
) {
  return requestJson<ActionExecutionRecordView>(
    `/execution/${executionId}/progress`,
    {
      method: "POST",
      body: JSON.stringify({ percentage }),
    },
  );
}

export function completeExecution(executionId: string) {
  return requestJson<ActionExecutionRecordView>(
    `/execution/${executionId}/complete`,
    {
      method: "POST",
    },
  );
}

/* ── Real-time thinking stream ───────────────────────────── */

export function triggerStreamingPlan() {
  return requestJson<StreamTriggerResponse>("/plan/daily/stream", {
    method: "POST",
  });
}

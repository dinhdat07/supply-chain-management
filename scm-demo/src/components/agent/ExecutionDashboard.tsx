import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  FileCheck,
  Activity,
  Shield,
  RefreshCcw,
  Package,
  List,
  PlusCircle,
} from 'lucide-react';
import type { PlanView } from '../../lib/types';

// ── Types matching backend schemas ─────────────────────────────────────────

interface ActionExecutionRecord {
  execution_id: string;
  plan_id: string;
  action_id: string;
  action_type: string;
  target_system: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  status: string;
  receipt: Record<string, unknown>;
  failure_reason?: string | null;
  is_retryable: boolean;
  created_at: string;
  dispatched_at?: string | null;
  applied_at?: string | null;
  estimated_completion_at?: string | null;
  progress_percentage: number;
}

interface DispatchResponse {
  plan_id: string;
  dispatch_mode: string;
  plan_execution_status: string;
  overall_progress: number;
  records: ActionExecutionRecord[];
  compensation_hints: string[];
}

/** ExecutionRecordView from GET /execution or GET /execution/{id} */
interface ExecutionRecord {
  execution_id: string;
  run_id: string;
  decision_id?: string | null;
  plan_id?: string | null;
  status: string;
  dispatch_mode: string;
  dry_run: boolean;
  target_system: string;
  action_ids: string[];
  receipts: Array<{ receipt_id: string; action_id: string; status: string; detail: string }>;
  status_history: Array<{ status: string; timestamp: string; reason: string }>;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
}

// ── API helpers ─────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8000/api/v1';

async function apiApprove(decisionId: string): Promise<void> {
  const res = await fetch(`${BASE}/decisions/${decisionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approve: true }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function apiDispatch(planId: string, mode: 'commit' | 'dry_run'): Promise<DispatchResponse> {
  const res = await fetch(`${BASE}/execution/${planId}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<DispatchResponse>;
}

async function apiProgress(executionId: string, percentage: number): Promise<ActionExecutionRecord> {
  const res = await fetch(`${BASE}/execution/${executionId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ percentage }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<ActionExecutionRecord>;
}

async function apiComplete(executionId: string): Promise<ActionExecutionRecord> {
  const res = await fetch(`${BASE}/execution/${executionId}/complete`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<ActionExecutionRecord>;
}

/** GET /execution — list all, returns ActionExecutionRecord items */
async function apiListExecutions(): Promise<ActionExecutionRecord[]> {
  const res = await fetch(`${BASE}/execution`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json() as { items?: ActionExecutionRecord[] } | ActionExecutionRecord[];
  return Array.isArray(data) ? data : (data.items ?? []);
}

/** GET /execution/{id} — single action record detail */
async function apiGetExecution(id: string): Promise<ActionExecutionRecord> {
  const res = await fetch(`${BASE}/execution/${id}`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json() as { item: ActionExecutionRecord } | ActionExecutionRecord;
  return ('item' in data && data.item) ? data.item : data as ActionExecutionRecord;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending:          { label: 'Pending',          cls: 'bg-lightSurface border-borderGray text-secondaryGray' },
    applied:          { label: 'Applied',           cls: 'bg-blue-50 border-blue-200 text-blue-700' },
    in_progress:      { label: 'In Progress',       cls: 'bg-amber-50 border-amber-200 text-amber-700' },
    partially_applied:{ label: 'Partial',           cls: 'bg-orange-50 border-orange-200 text-orange-700' },
    completed:        { label: 'Completed',         cls: 'bg-green-50 border-green-200 text-green-700' },
    failed:           { label: 'Failed',            cls: 'bg-errorRed/10 border-errorRed/20 text-errorRed' },
    rolled_back:      { label: 'Rolled Back',       cls: 'bg-purple-50 border-purple-200 text-purple-700' },
    dry_run:          { label: 'Dry Run',           cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    approved:         { label: 'Approved',          cls: 'bg-green-50 border-green-200 text-green-700' },
    commit:           { label: 'Commit',            cls: 'bg-green-50 border-green-200 text-green-700' },
    auto_applied:     { label: 'Auto Applied',      cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  };
  const s = cfg[status.toLowerCase()] ?? { label: status, cls: 'bg-lightSurface border-borderGray text-secondaryGray' };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${s.cls}`}>
      {s.label}
    </span>
  );
}

function MiniProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-lightSurface border border-borderGray/30">
      <div
        className="h-full rounded-full bg-nearBlack transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Execution History Card ──────────────────────────────────────────────────
// Works with ActionExecutionRecord (what GET /execution returns)

function ExecutionHistoryCard({ record, onRefresh }: { record: ActionExecutionRecord; onRefresh: () => void }) {
  const [collapsed, setCollapsed] = useState(true);

  const isDone = record.status === 'completed';
  const isFailed = record.status === 'failed';
  const borderCls = isDone ? 'border-green-200'
    : isFailed ? 'border-errorRed/30'
    : record.status === 'in_progress' ? 'border-amber-200'
    : 'border-borderGray';

  const receiptStatus = (record.receipt?.status as string | undefined) ?? '';
  const receiptRef = (record.receipt?.ref_id as string | undefined) ?? '';
  const isDryRun = receiptStatus.includes('DRY');

  return (
    <div className={`rounded-[16px] border bg-pureWhite shadow-sm transition-all ${borderCls}`}>
      {/* Summary Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          isDone ? 'bg-green-500' : isFailed ? 'bg-errorRed' : 'bg-amber-400 animate-pulse'
        }`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-bold text-nearBlack">{record.execution_id}</span>
            <StatusBadge status={record.status} />
            {isDryRun
              ? <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-600">Dry Run</span>
              : <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-black uppercase text-green-700">Commit</span>
            }
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[10px] text-secondaryGray flex-wrap">
            <span>Action: <span className="font-mono">{record.action_id}</span></span>
            <span>→ {record.target_system}</span>
            {record.plan_id && <span>Plan: <span className="font-mono">{record.plan_id}</span></span>}
            <span>{new Date(record.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Progress & controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[18px] font-black text-nearBlack leading-none">{record.progress_percentage.toFixed(0)}%</div>
            <div className="text-[9px] text-secondaryGray">progress</div>
          </div>
          <button onClick={onRefresh} className="rounded-lg border border-borderGray p-1.5 text-secondaryGray hover:bg-lightSurface" title="Refresh">
            <RefreshCcw size={12} />
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center gap-1.5 rounded-lg border border-borderGray px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
          >
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {collapsed ? 'Detail' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="px-4 pb-2">
        <MiniProgressBar value={record.progress_percentage} />
      </div>

      {/* Detail Panel */}
      {!collapsed && (
        <div className="border-t border-borderGray/50 px-4 py-4 space-y-4">
          {/* Receipt */}
          {record.receipt && Object.keys(record.receipt).length > 0 && (
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondaryGray">Receipt</div>
              <div className={`rounded-lg border p-3 ${
                isDryRun ? 'border-indigo-200 bg-indigo-50' : 'border-green-200 bg-green-50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={12} className={isDryRun ? 'text-indigo-500' : 'text-green-600'} />
                  <span className="font-mono text-[11px] font-bold text-nearBlack">{receiptRef || '—'}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                    isDryRun ? 'border-indigo-200 text-indigo-600' : 'border-green-200 text-green-700'
                  }`}>{receiptStatus}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-secondaryGray mt-2">
                  {Object.entries(record.receipt).filter(([k]) => k !== 'ref_id' && k !== 'status').map(([k, v]) => (
                    <div key={k}><span className="font-bold">{k}:</span> {String(v)}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payload summary */}
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondaryGray">Action Details</div>
            <div className="rounded-xl border border-borderGray/40 bg-lightSurface/50 p-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-secondaryGray">Type</span><span className="font-bold text-nearBlack uppercase">{record.action_type}</span></div>
              <div className="flex justify-between"><span className="text-secondaryGray">Target System</span><span className="font-bold text-nearBlack">{record.target_system}</span></div>
              <div className="flex justify-between"><span className="text-secondaryGray">Idempotency Key</span><span className="font-mono text-[10px] text-nearBlack">{record.idempotency_key}</span></div>
              {record.dispatched_at && <div className="flex justify-between"><span className="text-secondaryGray">Dispatched</span><span>{new Date(record.dispatched_at).toLocaleString()}</span></div>}
              {record.applied_at && <div className="flex justify-between"><span className="text-secondaryGray">Applied</span><span>{new Date(record.applied_at).toLocaleString()}</span></div>}
              {record.estimated_completion_at && <div className="flex justify-between"><span className="text-secondaryGray">ETA</span><span>{new Date(record.estimated_completion_at).toLocaleString()}</span></div>}
            </div>
          </div>

          {record.failure_reason && (
            <div className="rounded-xl border border-errorRed/20 bg-errorRed/5 p-3 text-[12px] text-errorRed">
              <div className="font-black uppercase text-[10px] mb-1">Failure Reason</div>
              {record.failure_reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface ExecutionDashboardProps {
  plan: PlanView | null;
  decisionId?: string | null;
  onClose?: () => void;
}

export function ExecutionDashboard({ plan, decisionId, onClose }: ExecutionDashboardProps) {
  // ── View: 'history' | 'dispatch'
  const [activeView, setActiveView] = useState<'history' | 'dispatch'>('history');

  // ── History state
  const [executions, setExecutions] = useState<ActionExecutionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // ── Dispatch state
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveOk, setApproveOk] = useState(false);

  const [dispatchMode, setDispatchMode] = useState<'commit' | 'dry_run'>('dry_run');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchResponse | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [progressInput, setProgressInput] = useState<number>(50);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Load execution history
  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await apiListExecutions();
      setExecutions(data);
    } catch (e: unknown) {
      setHistoryError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { void loadHistory(); }, []);

  // After a successful dispatch, refresh the history list and switch to it
  const afterDispatch = (res: DispatchResponse) => {
    setDispatchResult(res);
    void loadHistory(); // auto-refresh list
  };

  // ── Handlers
  const handleApprove = async () => {
    if (!decisionId) return;
    setApproving(true); setApproveError(null);
    try {
      await apiApprove(decisionId);
      setApproveOk(true);
    } catch (e: unknown) {
      setApproveError(e instanceof Error ? e.message : String(e));
    } finally {
      setApproving(false);
    }
  };

  const handleDispatch = async () => {
    if (!plan) return;
    if (dispatchResult?.dispatch_mode === 'dry_run' && dispatchMode === 'commit') {
      setDispatchResult(null);
    }
    setDispatching(true); setDispatchError(null);
    try {
      const res = await apiDispatch(plan.plan_id, dispatchMode);
      afterDispatch(res);
    } catch (e: unknown) {
      setDispatchError(e instanceof Error ? e.message : String(e));
    } finally {
      setDispatching(false);
    }
  };

  const handleProgress = async (actionExecId: string) => {
    setUpdatingProgress(true); setActionError(null);
    try {
      const updatedRecord = await apiProgress(actionExecId, progressInput);
      if (dispatchResult) {
        setDispatchResult({
          ...dispatchResult,
          records: dispatchResult.records.map(r => r.execution_id === actionExecId ? updatedRecord : r),
        });
      }
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleComplete = async (actionExecId: string) => {
    setCompleting(true); setActionError(null);
    try {
      const updatedRecord = await apiComplete(actionExecId);
      if (dispatchResult) {
        setDispatchResult({
          ...dispatchResult,
          records: dispatchResult.records.map(r => r.execution_id === actionExecId ? updatedRecord : r),
        });
      }
      void loadHistory();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setCompleting(false);
    }
  };

  const needsApproval = plan ? (plan.approval_required && plan.approval_status !== 'approved' && !approveOk) : false;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-nearBlack">Execution Manager</h2>
          <p className="mt-0.5 text-[12px] text-secondaryGray">Manage and track all dispatched logistics plans</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[12px] font-bold transition-all ${
              activeView === 'history'
                ? 'border-nearBlack bg-nearBlack text-pureWhite'
                : 'border-borderGray text-secondaryGray hover:bg-lightSurface'
            }`}
          >
            <List size={13} /> Execution List
          </button>
          <button
            onClick={() => setActiveView('dispatch')}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[12px] font-bold transition-all ${
              activeView === 'dispatch'
                ? 'border-rausch bg-rausch text-pureWhite'
                : 'border-borderGray text-secondaryGray hover:bg-lightSurface'
            }`}
          >
            <PlusCircle size={13} /> New Dispatch
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded-xl border border-borderGray px-3 py-2 text-[12px] font-bold text-secondaryGray hover:bg-lightSurface">
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* ── VIEW: EXECUTION HISTORY ── */}
      {activeView === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-secondaryGray">
              {loadingHistory ? 'Loading...' : `${executions.length} execution record${executions.length !== 1 ? 's' : ''} found`}
            </div>
            <button
              onClick={() => void loadHistory()}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 rounded-lg border border-borderGray px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface disabled:opacity-50"
            >
              <RefreshCcw size={12} className={loadingHistory ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {historyError && (
            <div className="rounded-xl border border-errorRed/20 bg-errorRed/5 px-4 py-3 text-[12px] text-errorRed flex items-center gap-2">
              <AlertCircle size={14} />
              {historyError}
            </div>
          )}

          {!loadingHistory && executions.length === 0 && !historyError && (
            <div className="rounded-[20px] border border-borderGray bg-pureWhite p-12 text-center shadow-card">
              <FileCheck className="mx-auto text-secondaryGray/30" size={36} />
              <h3 className="mt-4 text-[18px] font-bold text-nearBlack">No Executions Yet</h3>
              <p className="mt-2 text-[13px] text-secondaryGray">Switch to "New Dispatch" to execute a plan.</p>
              <button
                onClick={() => setActiveView('dispatch')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-nearBlack px-6 py-2.5 text-[13px] font-bold text-pureWhite hover:bg-nearBlack/90"
              >
                <PlusCircle size={14} /> New Dispatch
              </button>
            </div>
          )}

          <div className="space-y-3">
            {executions.map((exec) => (
              <ExecutionHistoryCard
                key={exec.execution_id}
                record={exec}
                onRefresh={() => void loadHistory()}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW: NEW DISPATCH ── */}
      {activeView === 'dispatch' && (
        <div className="space-y-5">
          {!plan ? (
            <div className="rounded-[20px] border border-borderGray bg-pureWhite p-12 text-center shadow-card">
              <FileCheck className="mx-auto text-secondaryGray/30" size={36} />
              <h3 className="mt-4 text-[18px] font-bold text-nearBlack">No Active Plan</h3>
              <p className="mt-2 text-[13px] text-secondaryGray">Generate a recommendation first before dispatching.</p>
            </div>
          ) : (
            <>
              {/* Plan Identity Strip */}
              <div className="rounded-[16px] border border-borderGray bg-pureWhite p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <Shield size={18} className="text-secondaryGray shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">Target Plan</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[13px] font-bold text-nearBlack">{plan.plan_id}</span>
                      <StatusBadge status={plan.approval_status} />
                      <StatusBadge status={plan.status} />
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-secondaryGray">Actions</div>
                    <div className="text-[20px] font-black text-nearBlack">{plan.actions.length}</div>
                  </div>
                </div>
              </div>

              {/* 4-Stage Grid */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                {/* STAGE 1 */}
                <div className={`rounded-[18px] border bg-pureWhite p-5 shadow-sm ${approveOk ? 'border-green-300' : needsApproval ? 'border-amber-300' : 'border-borderGray'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black text-pureWhite ${approveOk ? 'bg-green-600' : 'bg-nearBlack'}`}>1</div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">Stage 1</div>
                      <h3 className="text-[16px] font-bold text-nearBlack">Trigger & Approval</h3>
                    </div>
                    {approveOk && <CheckCircle2 size={20} className="ml-auto text-green-600" />}
                  </div>

                  {decisionId ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-borderGray/50 bg-lightSurface/50 px-3 py-2.5">
                        <div className="text-[10px] font-bold uppercase text-secondaryGray">Decision ID</div>
                        <div className="mt-0.5 font-mono text-[12px] font-bold text-nearBlack">{decisionId}</div>
                      </div>
                      <div className="text-[12px] text-secondaryGray italic">{plan.approval_reason || 'No approval note.'}</div>
                      {approveOk ? (
                        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
                          <CheckCircle2 size={15} /> Plan approved — dispatch is now unlocked.
                        </div>
                      ) : (
                        <button
                          onClick={() => void handleApprove()}
                          disabled={approving || !needsApproval}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-nearBlack py-3 text-[13px] font-black text-pureWhite transition-all hover:bg-nearBlack/90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {approving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          {approving ? 'Approving...' : needsApproval ? 'Approve Plan' : 'Already Approved'}
                        </button>
                      )}
                      {approveError && <div className="rounded-xl border border-errorRed/20 bg-errorRed/5 px-3 py-2 text-[12px] text-errorRed">{approveError}</div>}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-borderGray bg-lightSurface px-4 py-6 text-center text-[12px] italic text-secondaryGray">
                      No decision ID linked — plan was auto-applied or this mode skips approval.
                    </div>
                  )}
                </div>

                {/* STAGE 2 */}
                <div className={`rounded-[18px] border bg-pureWhite p-5 shadow-sm ${dispatchResult?.dispatch_mode === 'commit' ? 'border-green-300' : dispatchResult ? 'border-blue-200' : 'border-borderGray'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black text-pureWhite ${dispatchResult?.dispatch_mode === 'commit' ? 'bg-green-600' : 'bg-nearBlack'}`}>2</div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">Stage 2</div>
                      <h3 className="text-[16px] font-bold text-nearBlack">Digital Dispatch</h3>
                    </div>
                    {dispatchResult?.dispatch_mode === 'commit' && <CheckCircle2 size={20} className="ml-auto text-green-600" />}
                  </div>

                  <div className="space-y-3">
                    {/* Mode Selector */}
                    <div className="flex gap-2">
                      {(['dry_run', 'commit'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setDispatchMode(m)}
                          disabled={dispatchResult?.dispatch_mode === 'commit'}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-[12px] font-bold transition-all disabled:opacity-50 ${
                            dispatchMode === m
                              ? m === 'commit' ? 'border-rausch bg-rausch/10 text-rausch' : 'border-nearBlack bg-nearBlack text-pureWhite'
                              : 'border-borderGray text-secondaryGray hover:bg-lightSurface'
                          }`}
                        >
                          {m === 'dry_run' ? <FlaskConical size={14} /> : <Play size={14} />}
                          {m === 'dry_run' ? 'Dry Run' : 'Commit'}
                        </button>
                      ))}
                    </div>

                    {dispatchMode === 'commit' && !dispatchResult && (
                      <div className="flex items-center gap-2 rounded-xl border border-rausch/20 bg-rausch/5 px-3 py-2 text-[11px] text-rausch font-medium">
                        <AlertCircle size={13} /> This will send live commands to ERP/WMS/TMS systems.
                      </div>
                    )}

                    <button
                      onClick={() => void handleDispatch()}
                      disabled={dispatching || (dispatchResult?.dispatch_mode === 'commit') || (needsApproval && !approveOk)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-black text-pureWhite transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        dispatchMode === 'commit' ? 'bg-rausch hover:bg-rausch/90' : 'bg-nearBlack hover:bg-nearBlack/90'
                      }`}
                    >
                      {dispatching ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                      {dispatching
                        ? 'Dispatching...'
                        : dispatchResult?.dispatch_mode === 'commit'
                        ? 'Committed ✓'
                        : dispatchResult?.dispatch_mode === 'dry_run' && dispatchMode === 'dry_run'
                        ? 'Dry Run OK ✓ — Switch to Commit'
                        : `Dispatch ${dispatchMode === 'dry_run' ? '(Dry Run)' : '(Live Commit)'}`}
                    </button>

                    {/* Reset button */}
                    {dispatchResult && dispatchResult.dispatch_mode !== 'commit' && (
                      <button
                        onClick={() => { setDispatchResult(null); setDispatchError(null); }}
                        className="w-full text-[11px] font-bold text-secondaryGray hover:text-nearBlack underline py-1"
                      >
                        Reset & Start Over
                      </button>
                    )}

                    {needsApproval && !approveOk && (
                      <p className="text-[11px] text-center text-amber-600 italic">Complete Stage 1 approval first.</p>
                    )}

                    {dispatchError && (
                      <div className="rounded-xl border border-errorRed/20 bg-errorRed/5 px-3 py-2 text-[12px] text-errorRed flex items-center gap-2">
                        <AlertCircle size={13} />{dispatchError}
                      </div>
                    )}

                    {/* Dispatch Result */}
                    {dispatchResult && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg border border-borderGray/40 bg-lightSurface px-2 py-1.5">
                            <div className="text-[9px] font-bold uppercase text-secondaryGray">Status</div>
                            <StatusBadge status={dispatchResult.plan_execution_status} />
                          </div>
                          <div className="rounded-lg border border-borderGray/40 bg-lightSurface px-2 py-1.5">
                            <div className="text-[9px] font-bold uppercase text-secondaryGray">Progress</div>
                            <div className="text-[14px] font-black text-nearBlack">{dispatchResult.overall_progress.toFixed(0)}%</div>
                          </div>
                          <div className="rounded-lg border border-borderGray/40 bg-lightSurface px-2 py-1.5">
                            <div className="text-[9px] font-bold uppercase text-secondaryGray">Actions</div>
                            <div className="text-[14px] font-black text-nearBlack">{dispatchResult.records.length}</div>
                          </div>
                        </div>

                        <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray mt-2">Action Receipts</div>
                        {dispatchResult.records.map((r) => (
                          <div key={r.idempotency_key} className={`flex items-start gap-3 rounded-xl border p-3 ${
                            r.status === 'applied' || r.status === 'accepted' ? 'border-green-200 bg-green-50' :
                            r.status === 'failed' ? 'border-errorRed/20 bg-errorRed/5' : 'border-borderGray bg-lightSurface'
                          }`}>
                            {r.status === 'applied' || r.status === 'accepted'
                              ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-600" />
                              : r.status === 'failed'
                              ? <XCircle size={13} className="mt-0.5 shrink-0 text-errorRed" />
                              : <Clock size={13} className="mt-0.5 shrink-0 text-amber-500" />
                            }
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] font-bold text-nearBlack truncate">{r.action_id}</span>
                                <span className="rounded bg-lightSurface border border-borderGray px-1.5 py-0.5 text-[9px] font-bold uppercase text-secondaryGray">{r.action_type}</span>
                                <StatusBadge status={r.status} />
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-[10px] text-secondaryGray">
                                <span>→ {r.target_system}</span>
                                <span>{r.progress_percentage.toFixed(0)}%</span>
                              </div>
                              {r.failure_reason && <p className="mt-0.5 text-[10px] text-errorRed">{r.failure_reason}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* STAGE 3: Physical Tracking */}
                <div className={`rounded-[18px] border bg-pureWhite p-5 shadow-sm ${dispatchResult?.overall_progress === 100 ? 'border-green-300' : dispatchResult ? 'border-amber-300' : 'border-borderGray'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black text-pureWhite ${dispatchResult?.overall_progress === 100 ? 'bg-green-600' : 'bg-nearBlack'}`}>3</div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">Stage 3</div>
                      <h3 className="text-[16px] font-bold text-nearBlack">Physical Tracking</h3>
                    </div>
                  </div>

                  {!dispatchResult || dispatchMode === 'dry_run' && !dispatchResult ? (
                    <div className="rounded-xl border border-borderGray bg-lightSurface px-4 py-6 text-center text-[12px] italic text-secondaryGray">
                      Dispatch (commit) a plan first to enable physical tracking.
                    </div>
                  ) : dispatchResult.dispatch_mode === 'dry_run' ? (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-6 text-center text-[12px] italic text-indigo-600">
                      Dry Run mode — no physical execution. Switch to Commit to track progress.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Global slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2 text-[11px] font-bold text-secondaryGray uppercase tracking-widest">
                          <span>Report Progress</span>
                          <span className="text-nearBlack text-[14px] font-black">{progressInput}%</span>
                        </div>
                        <input
                          type="range" min={0} max={100} step={5}
                          value={progressInput}
                          onChange={(e) => setProgressInput(Number(e.target.value))}
                          className="w-full h-2 accent-nearBlack cursor-pointer"
                        />
                      </div>

                      {dispatchResult.records.map((r) => (
                        <div key={r.execution_id} className="rounded-xl border border-borderGray/40 p-3 space-y-3 bg-lightSurface/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-[11px] font-bold text-nearBlack">{r.action_id}</span>
                              <span className="ml-2 text-[10px] text-secondaryGray">→ {r.target_system}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.status} />
                              <span className="text-[13px] font-black text-nearBlack">{r.progress_percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                          <MiniProgressBar value={r.progress_percentage} />
                          <div className="flex gap-2">
                            <button
                              onClick={() => void handleProgress(r.execution_id)}
                              disabled={updatingProgress || r.status === 'completed'}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-nearBlack py-1.5 text-[10px] font-bold hover:bg-nearBlack hover:text-pureWhite disabled:opacity-30 transition-all"
                            >
                              {updatingProgress ? <Loader2 size={11} className="animate-spin" /> : <Activity size={11} />}
                              Update {progressInput}%
                            </button>
                            <button
                              onClick={() => void handleComplete(r.execution_id)}
                              disabled={completing || r.status === 'completed'}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-600 py-1.5 text-[10px] font-bold text-pureWhite hover:bg-green-700 disabled:opacity-30 transition-all"
                            >
                              {completing ? <Loader2 size={11} className="animate-spin" /> : <Package size={11} />}
                              {r.status === 'completed' ? 'Confirmed ✓' : 'Confirm'}
                            </button>
                          </div>
                        </div>
                      ))}
                      {actionError && (
                        <div className="rounded-xl border border-errorRed/20 bg-errorRed/5 px-3 py-2 text-[12px] text-errorRed">{actionError}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* STAGE 4: Observability */}
                <div className={`rounded-[18px] border bg-pureWhite p-5 shadow-sm ${dispatchResult?.overall_progress === 100 ? 'border-green-300' : dispatchResult ? 'border-blue-300' : 'border-borderGray'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black text-pureWhite ${dispatchResult?.overall_progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}>4</div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">Stage 4</div>
                      <h3 className="text-[16px] font-bold text-nearBlack">Observability</h3>
                    </div>
                  </div>

                  {!dispatchResult ? (
                    <div className="rounded-xl border border-borderGray bg-lightSurface px-4 py-6 text-center text-[12px] italic text-secondaryGray">
                      Dispatch a plan to start observing granular action status.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-borderGray/50 bg-lightSurface/40 px-3 py-2.5">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-secondaryGray">Plan Status</div>
                          <div className="mt-1"><StatusBadge status={dispatchResult.plan_execution_status} /></div>
                        </div>
                        <div className="rounded-xl border border-borderGray/50 bg-lightSurface/40 px-3 py-2.5">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-secondaryGray">Overall Progress</div>
                          <div className="mt-1 text-[18px] font-black text-nearBlack">{dispatchResult.overall_progress.toFixed(0)}%</div>
                        </div>
                      </div>

                      <MiniProgressBar value={dispatchResult.overall_progress} />

                      <div className="space-y-2">
                        {dispatchResult.records.map((r) => (
                          <div key={r.execution_id} className="rounded-xl border border-borderGray/40 bg-pureWhite p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-black text-nearBlack">{r.action_id}</span>
                              <StatusBadge status={r.status} />
                            </div>
                            <MiniProgressBar value={r.progress_percentage} />
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-secondaryGray">
                              <span>{r.target_system}</span>
                              {r.estimated_completion_at && (
                                <span><Clock size={9} className="inline mr-1" />ETA: {new Date(r.estimated_completion_at).toLocaleTimeString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-borderGray/50 bg-lightSurface/30 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray mb-2">Metadata</div>
                        <div className="text-[11px] text-nearBlack space-y-1">
                          <div className="flex justify-between"><span>Mode</span><span className="font-bold">{dispatchResult.dispatch_mode}</span></div>
                          <div className="flex justify-between"><span>Plan ID</span><span className="font-mono text-[10px]">{dispatchResult.plan_id}</span></div>
                        </div>
                      </div>

                      {/* After successful commit, prompt to view in list */}
                      {dispatchResult.dispatch_mode === 'commit' && (
                        <button
                          onClick={() => { setActiveView('history'); void loadHistory(); }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-nearBlack py-2.5 text-[12px] font-bold text-nearBlack hover:bg-nearBlack hover:text-pureWhite transition-all"
                        >
                          <List size={13} /> View in Execution List
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

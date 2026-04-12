import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileCheck,
  FlaskConical,
  List,
  Loader2,
  Play,
  PlusCircle,
  RefreshCcw,
  Shield,
  Zap,
} from 'lucide-react';

import {
  completeExecution,
  dispatchPlan,
  fetchExecutionList,
  updateExecutionProgress,
} from '../../lib/api';
import type {
  ActionExecutionRecordView,
  PlanDispatchResponse,
  PlanView,
} from '../../lib/types';
import {
  describeActionTitle,
  describeActionTarget,
  formatDateTime,
  humanizeAction,
  humanizeEntityId,
  humanizeStatus,
  humanizeStrategy,
} from '../../lib/presenters';

interface ExecutionDashboardProps {
  plan: PlanView | null;
  decisionId?: string | null;
  onOpenApproval?: () => void;
  onClose?: () => void;
}

function statusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'completed' || normalized === 'applied') {
    return 'bg-green-50 border-green-200 text-green-700';
  }
  if (normalized === 'failed') {
    return 'bg-errorRed/10 border-errorRed/20 text-errorRed';
  }
  if (normalized === 'in_progress' || normalized === 'partially_applied') {
    return 'bg-amber-50 border-amber-200 text-amber-700';
  }
  if (normalized === 'dry_run') {
    return 'bg-indigo-50 border-indigo-200 text-indigo-700';
  }
  return 'bg-lightSurface border-borderGray text-secondaryGray';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusTone(status)}`}
    >
      {humanizeStatus(status)}
    </span>
  );
}

function MiniProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full border border-borderGray/30 bg-lightSurface">
      <div
        className="h-full rounded-full bg-nearBlack transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function executionSubtitle(record: ActionExecutionRecordView): string {
  return `${humanizeAction(record.action_type)} for ${humanizeEntityId(record.action_id)}`;
}

function ExecutionHistoryCard({
  record,
  onProgress,
  onComplete,
  onRefresh,
}: {
  record: ActionExecutionRecordView;
  onProgress?: (executionId: string) => Promise<void>;
  onComplete?: (executionId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const isDone = record.status === 'completed' || record.status === 'applied';
  const isFailed = record.status === 'failed';
  const canAdvance = Boolean(
    onProgress
      && onComplete
      && record.status !== 'completed'
      && record.status !== 'failed',
  );

  return (
    <div
      className={`rounded-[16px] border bg-pureWhite shadow-sm transition-all ${
        isDone
          ? 'border-green-200'
          : isFailed
            ? 'border-errorRed/30'
            : record.status === 'in_progress'
              ? 'border-amber-200'
              : 'border-borderGray'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            isDone
              ? 'bg-green-500'
              : isFailed
                ? 'bg-errorRed'
                : 'animate-pulse bg-amber-400'
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-nearBlack">
              {record.execution_id}
            </span>
            <StatusBadge status={record.status} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[10px] text-secondaryGray">
            <span>{executionSubtitle(record)}</span>
            <span>{record.target_system}</span>
            <span>{formatDateTime(record.created_at)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-[18px] font-black leading-none text-nearBlack">
              {record.progress_percentage.toFixed(0)}%
            </div>
            <div className="text-[9px] text-secondaryGray">progress</div>
          </div>
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="rounded-lg border border-borderGray p-1.5 text-secondaryGray hover:bg-lightSurface"
            title="Refresh execution"
          >
            <RefreshCcw size={12} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="flex items-center gap-1.5 rounded-lg border border-borderGray px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
          >
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {collapsed ? 'Details' : 'Collapse'}
          </button>
        </div>
      </div>

      <div className="px-4 pb-2">
        <MiniProgressBar value={record.progress_percentage} />
      </div>

      {!collapsed ? (
        <div className="space-y-4 border-t border-borderGray/50 px-4 py-4">
          <div className="rounded-xl border border-borderGray/40 bg-lightSurface/50 p-3 text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-secondaryGray">Action type</span>
              <span className="font-bold uppercase text-nearBlack">
                {humanizeAction(record.action_type)}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span className="text-secondaryGray">Target system</span>
              <span className="font-bold text-nearBlack">
                {record.target_system}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span className="text-secondaryGray">Idempotency key</span>
              <span className="font-mono text-[10px] text-nearBlack">
                {record.idempotency_key}
              </span>
            </div>
            {record.estimated_completion_at ? (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-secondaryGray">ETA</span>
                <span className="text-nearBlack">
                  {formatDateTime(record.estimated_completion_at)}
                </span>
              </div>
            ) : null}
          </div>

          {record.receipt && Object.keys(record.receipt).length ? (
            <div className="rounded-xl border border-borderGray/40 bg-pureWhite p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                Receipt
              </div>
              <div className="mt-3 grid gap-2 text-[11px] text-secondaryGray">
                {Object.entries(record.receipt).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 rounded-lg border border-borderGray bg-lightSurface px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-semibold text-secondaryGray">{key}</span>
                    <span className="font-medium text-nearBlack">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {record.failure_reason ? (
            <div className="rounded-xl border border-errorRed/20 bg-errorRed/5 p-3 text-[12px] text-errorRed">
              <div className="mb-1 text-[10px] font-black uppercase">
                Failure reason
              </div>
              {record.failure_reason}
            </div>
          ) : null}

          {canAdvance ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onProgress?.(record.execution_id)}
                className="rounded-xl border border-borderGray bg-pureWhite px-4 py-2 text-[12px] font-bold text-nearBlack hover:bg-lightSurface"
              >
                Advance to 50%
              </button>
              <button
                type="button"
                onClick={() => void onComplete?.(record.execution_id)}
                className="rounded-xl bg-nearBlack px-4 py-2 text-[12px] font-bold text-pureWhite hover:bg-nearBlack/90"
              >
                Mark complete
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ExecutionDashboard({
  plan,
  decisionId,
  onOpenApproval,
  onClose,
}: ExecutionDashboardProps) {
  const [activeView, setActiveView] = useState<'history' | 'dispatch'>('history');
  const [executions, setExecutions] = useState<ActionExecutionRecordView[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [dispatchMode, setDispatchMode] = useState<'commit' | 'dry_run'>('dry_run');
  const [dispatchResult, setDispatchResult] = useState<PlanDispatchResponse | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const needsApproval = Boolean(
    plan?.approval_required
      && plan.approval_status !== 'approved',
  );

  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await fetchExecutionList();
      setExecutions(response.items);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const relevantExecutions = useMemo(() => {
    const latestRecords = dispatchResult?.records ?? [];
    if (latestRecords.length) return latestRecords;
    if (!plan) return executions;
    return executions.filter((item) => item.plan_id === plan.plan_id);
  }, [dispatchResult?.records, executions, plan]);

  const handleDispatch = async () => {
    if (!plan) return;
    setDispatching(true);
    setDispatchError(null);
    try {
      const response = await dispatchPlan(plan.plan_id, dispatchMode);
      setDispatchResult(response);
      setActiveView('history');
      await loadHistory();
    } catch (error) {
      setDispatchError(error instanceof Error ? error.message : String(error));
    } finally {
      setDispatching(false);
    }
  };

  const handleProgress = async (executionId: string) => {
    setActionBusyId(executionId);
    setActionError(null);
    try {
      const updated = await updateExecutionProgress(executionId, 50);
      setExecutions((current) =>
        current.map((item) => (item.execution_id === executionId ? updated : item)),
      );
      setDispatchResult((current) =>
        current
          ? {
              ...current,
              records: current.records.map((item) =>
                item.execution_id === executionId ? updated : item,
              ),
            }
          : current,
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleComplete = async (executionId: string) => {
    setActionBusyId(executionId);
    setActionError(null);
    try {
      const updated = await completeExecution(executionId);
      setExecutions((current) =>
        current.map((item) => (item.execution_id === executionId ? updated : item)),
      );
      setDispatchResult((current) =>
        current
          ? {
              ...current,
              records: current.records.map((item) =>
                item.execution_id === executionId ? updated : item,
              ),
            }
          : current,
      );
      await loadHistory();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-nearBlack">
            Execution Manager
          </h2>
          <p className="mt-0.5 text-[12px] text-secondaryGray">
            Dispatch the selected action package and track execution updates from dry run through completion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[12px] font-bold transition-all ${
              activeView === 'history'
                ? 'border-nearBlack bg-nearBlack text-pureWhite'
                : 'border-borderGray text-secondaryGray hover:bg-lightSurface'
            }`}
          >
            <List size={13} /> Execution list
          </button>
          <button
            type="button"
            onClick={() => setActiveView('dispatch')}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[12px] font-bold transition-all ${
              activeView === 'dispatch'
                ? 'border-rausch bg-rausch text-pureWhite'
                : 'border-borderGray text-secondaryGray hover:bg-lightSurface'
            }`}
          >
            <PlusCircle size={13} /> Dispatch plan
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-borderGray px-3 py-2 text-[12px] font-bold text-secondaryGray hover:bg-lightSurface"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      {activeView === 'history' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-secondaryGray">
              {loadingHistory
                ? 'Loading execution records...'
                : `${executions.length} execution record${executions.length !== 1 ? 's' : ''}`}
            </div>
            <button
              type="button"
              onClick={() => void loadHistory()}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 rounded-lg border border-borderGray px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface disabled:opacity-50"
            >
              <RefreshCcw
                size={12}
                className={loadingHistory ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>

          {historyError ? (
            <div className="flex items-center gap-2 rounded-xl border border-errorRed/20 bg-errorRed/5 px-4 py-3 text-[12px] text-errorRed">
              <AlertCircle size={14} />
              {historyError}
            </div>
          ) : null}

          {!loadingHistory && executions.length === 0 && !historyError ? (
            <div className="rounded-[20px] border border-borderGray bg-pureWhite p-12 text-center shadow-card">
              <FileCheck className="mx-auto text-secondaryGray/30" size={36} />
              <h3 className="mt-4 text-[18px] font-bold text-nearBlack">
                No execution records yet
              </h3>
              <p className="mt-2 text-[13px] text-secondaryGray">
                Dispatch a recommendation to start the execution lifecycle.
              </p>
              <button
                type="button"
                onClick={() => setActiveView('dispatch')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-nearBlack px-6 py-2.5 text-[13px] font-bold text-pureWhite hover:bg-nearBlack/90"
              >
                <PlusCircle size={14} /> Open dispatch
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((record) => (
                <ExecutionHistoryCard
                  key={record.execution_id}
                  record={record}
                  onRefresh={loadHistory}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeView === 'dispatch' ? (
        <div className="space-y-5">
          {!plan ? (
            <div className="rounded-[20px] border border-borderGray bg-pureWhite p-12 text-center shadow-card">
              <FileCheck className="mx-auto text-secondaryGray/30" size={36} />
              <h3 className="mt-4 text-[18px] font-bold text-nearBlack">
                No active plan
              </h3>
              <p className="mt-2 text-[13px] text-secondaryGray">
                Generate a recommendation in the operations console before dispatching.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-[16px] border border-borderGray bg-pureWhite p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <Shield size={18} className="shrink-0 text-secondaryGray" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                      Selected package
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[16px] font-bold text-nearBlack">
                        {humanizeStrategy(plan.strategy_label)}
                      </span>
                      <StatusBadge status={plan.approval_status} />
                      <StatusBadge status={plan.status} />
                    </div>
                    <div className="mt-2 text-[12px] text-secondaryGray">
                      {plan.actions.length} actions in {plan.plan_id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className={`rounded-[18px] border bg-pureWhite p-5 shadow-sm ${needsApproval ? 'border-amber-300' : 'border-green-200'}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black text-pureWhite ${needsApproval ? 'bg-nearBlack' : 'bg-green-600'}`}>
                      1
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                        Stage 1
                      </div>
                      <h3 className="text-[16px] font-bold text-nearBlack">
                        Approval gate
                      </h3>
                    </div>
                    {!needsApproval ? (
                      <CheckCircle2 size={20} className="ml-auto text-green-600" />
                    ) : null}
                  </div>

                  <div className="space-y-3 text-[13px] text-secondaryGray">
                    {decisionId ? (
                      <div className="rounded-xl border border-borderGray/50 bg-lightSurface/50 px-3 py-2.5">
                        <div className="text-[10px] font-bold uppercase text-secondaryGray">
                          Decision reference
                        </div>
                        <div className="mt-0.5 font-mono text-[12px] font-bold text-nearBlack">
                          {decisionId}
                        </div>
                      </div>
                    ) : null}

                    <p>
                      {needsApproval
                        ? plan.approval_reason || 'Operator approval is required before dispatch.'
                        : 'This package is already approved or can proceed without a manual checkpoint.'}
                    </p>

                    {needsApproval ? (
                      <button
                        type="button"
                        onClick={onOpenApproval}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-nearBlack py-3 text-[13px] font-black text-pureWhite transition-all hover:bg-nearBlack/90"
                      >
                        <Shield size={15} />
                        Open approval queue
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
                        <CheckCircle2 size={15} />
                        Approval gate cleared
                      </div>
                    )}
                  </div>
                </div>

                <div className={`rounded-[18px] border bg-pureWhite p-5 shadow-sm ${dispatchResult ? 'border-blue-200' : 'border-borderGray'}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black text-pureWhite ${dispatchResult ? 'bg-green-600' : 'bg-nearBlack'}`}>
                      2
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                        Stage 2
                      </div>
                      <h3 className="text-[16px] font-bold text-nearBlack">
                        Dispatch package
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {(['dry_run', 'commit'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDispatchMode(mode)}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-[12px] font-bold transition-all ${
                            dispatchMode === mode
                              ? mode === 'commit'
                                ? 'border-rausch bg-rausch/10 text-rausch'
                                : 'border-nearBlack bg-nearBlack text-pureWhite'
                              : 'border-borderGray text-secondaryGray hover:bg-lightSurface'
                          }`}
                        >
                          {mode === 'dry_run' ? <FlaskConical size={14} /> : <Play size={14} />}
                          {mode === 'dry_run' ? 'Dry run' : 'Commit'}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDispatch()}
                      disabled={dispatching || needsApproval}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-black text-pureWhite transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                        dispatchMode === 'commit'
                          ? 'bg-rausch hover:bg-rausch/90'
                          : 'bg-nearBlack hover:bg-nearBlack/90'
                      }`}
                    >
                      {dispatching ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                      {dispatching
                        ? 'Dispatching...'
                        : `Dispatch ${dispatchMode === 'dry_run' ? 'dry run' : 'commit'}`}
                    </button>

                    {dispatchResult ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[12px] text-blue-700">
                        {dispatchResult.records.length} action records created with {humanizeStatus(dispatchResult.plan_execution_status)} status.
                      </div>
                    ) : null}

                    {dispatchError ? (
                      <div className="flex items-center gap-2 rounded-xl border border-errorRed/20 bg-errorRed/5 px-3 py-2 text-[12px] text-errorRed">
                        <AlertCircle size={13} />
                        {dispatchError}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[18px] border border-borderGray bg-pureWhite p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nearBlack text-[12px] font-black text-pureWhite">
                      3
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray">
                        Stage 3
                      </div>
                      <h3 className="text-[16px] font-bold text-nearBlack">
                        Track actions
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-borderGray bg-lightSurface px-4 py-3 text-[13px] text-secondaryGray">
                      {relevantExecutions.length
                        ? `${relevantExecutions.length} action execution records are linked to this plan.`
                        : 'Dispatch the plan to start tracking action execution.'}
                    </div>
                    <div className="rounded-xl border border-borderGray bg-pureWhite px-4 py-4">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-secondaryGray">
                        <Clock3 className="h-4 w-4" />
                        Action package
                      </div>
                      <div className="mt-3 space-y-3">
                        {plan.actions.map((action) => (
                          <div
                            key={action.action_id}
                            className="rounded-card border border-borderGray bg-lightSurface px-3 py-3"
                          >
                            <div className="text-[13px] font-bold text-nearBlack">
                              {describeActionTitle(action.action_type, action.target_id)}
                            </div>
                            <div className="mt-1 text-[12px] text-secondaryGray">
                              {describeActionTarget(action.action_type, action.target_id)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {actionError ? (
                <div className="flex items-center gap-2 rounded-xl border border-errorRed/20 bg-errorRed/5 px-4 py-3 text-[12px] text-errorRed">
                  <AlertCircle size={14} />
                  {actionError}
                </div>
              ) : null}

              {relevantExecutions.length ? (
                <div className="space-y-3">
                  <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                    Action execution records
                  </div>
                  {relevantExecutions.map((record) => (
                    <div
                      key={record.execution_id}
                      className={actionBusyId === record.execution_id ? 'opacity-70' : ''}
                    >
                      <ExecutionHistoryCard
                        record={record}
                        onRefresh={loadHistory}
                        onProgress={handleProgress}
                        onComplete={handleComplete}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

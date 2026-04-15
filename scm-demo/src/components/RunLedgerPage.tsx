import type {
  ControlTowerSummaryResponse,
  ControlTowerStateView,
  DecisionLogDetailView,
  ExecutionRecordView,
  RunView,
  TraceView,
} from '../lib/types';
import { RunLedger } from './agent/RunLedger';

interface RunLedgerPageProps {
  summary: ControlTowerSummaryResponse | null;
  runHistory: RunView[];
  selectedRun: RunView | null;
  selectedRunTrace: TraceView | null;
  selectedRunState: ControlTowerStateView | null;
  selectedRunDecision: DecisionLogDetailView | null;
  selectedRunExecution: ExecutionRecordView | null;
  historyLoading: boolean;
  error: string | null;
  onSelectRun: (runId: string) => Promise<void>;
}

export function RunLedgerPage({
  summary,
  runHistory,
  selectedRun,
  selectedRunTrace,
  selectedRunState,
  selectedRunDecision,
  selectedRunExecution,
  historyLoading,
  error,
  onSelectRun,
}: RunLedgerPageProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <section className="rounded-[24px] border border-borderGray bg-pureWhite p-6 shadow-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.18px] text-nearBlack">
              Run Ledger
            </h1>
            <p className="mt-2 max-w-3xl text-[15px] text-secondaryGray">
              Review completed orchestration runs as a concise execution story: what triggered the run, which plan was selected, what changed in the system, and what the platform learned.
            </p>
          </div>
          <div className="rounded-full border border-borderGray bg-lightSurface px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-secondaryGray">
            {runHistory.length} recorded runs · mode {summary?.mode ?? 'unknown'}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-5 py-4 text-[14px] text-errorRed">
          {error}
        </div>
      ) : null}

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
    </div>
  );
}

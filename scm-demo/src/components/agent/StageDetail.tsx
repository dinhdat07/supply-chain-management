import type { AgentStepView } from '../../lib/types';
import { humanizeAction, humanizeLabel, humanizeNode, humanizeReasoningSource } from '../../lib/presenters';
import { snapshotEntries, tracePhase } from './AgentShared';

interface StageDetailProps {
  selectedStep: AgentStepView | null;
}

export function StageDetail({ selectedStep }: StageDetailProps) {
  return (
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
                {selectedStep.observations.map((item: string) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ) : null}

          {selectedStep.risks.length ? (
            <div>
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Risks flagged</div>
              <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                {selectedStep.risks.map((item: string) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ) : null}

          {selectedStep.downstream_impacts.length ? (
            <div>
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Downstream impact</div>
              <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                {selectedStep.downstream_impacts.map((item: string) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ) : null}

          {selectedStep.recommended_action_ids.length ? (
            <div>
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Recommended actions</div>
              <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                {selectedStep.recommended_action_ids.map((item: string) => <li key={item}>• {humanizeAction(item)}</li>)}
              </ul>
            </div>
          ) : null}

          {selectedStep.tradeoffs.length ? (
            <div>
              <div className="text-[12px] uppercase tracking-wider text-secondaryGray">Operational tradeoffs</div>
              <ul className="mt-3 space-y-2 text-[13px] text-secondaryGray">
                {selectedStep.tradeoffs.map((item: string) => <li key={item}>• {item}</li>)}
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
  );
}

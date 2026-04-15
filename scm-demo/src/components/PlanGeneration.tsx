import { useEffect, useRef, useState } from 'react';
import type { TraceView, PendingApprovalView, ApprovalDetailView, ApprovalAction } from '../lib/types';
import { BrainCircuit, CheckCircle2, CircleDashed, Clock, AlertCircle, FileText, BarChart3, Loader2, Radio } from 'lucide-react';
import { describeDecisionMethod, humanizeAction } from '../lib/presenters';
import { ApprovalQueue } from './agent/ApprovalQueue';
import { ThinkingStreamPanel } from './agent/ThinkingStreamPanel';
import { useThinkingStream } from '../hooks/useThinkingStream';

interface PlanGenerationProps {
  trace?: TraceView | null;
  loading: boolean;
  pendingApproval?: PendingApprovalView | null;
  approvalDetail?: ApprovalDetailView | null;
  actionLoading?: string | null;
  onApprovalAction?: (action: ApprovalAction, decisionId: string) => Promise<void>;
  onSelectAlternative?: (decisionId: string, strategyLabel: string) => Promise<void>;
  onStreamComplete?: () => Promise<void>;
}

const STEP_ICONS: Record<string, any> = {
  risk: AlertCircle,
  supplier: Clock,
  demand: BarChart3,
  inventory: FileText,
  logistics: Clock,
  planner: BrainCircuit,
  critic: CheckCircle2,
  approval: CheckCircle2,
  execution: Clock,
};

export function PlanGeneration({ 
  trace, 
  loading,
  pendingApproval,
  approvalDetail,
  actionLoading,
  onApprovalAction,
  onSelectAlternative,
  onStreamComplete,
}: PlanGenerationProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showStream, setShowStream] = useState(false);
  const thinking = useThinkingStream();
  const prevStatusRef = useRef(thinking.status);

  const handleStartStream = async () => {
    setShowStream(true);
    await thinking.start();
  };

  const handleResetStream = () => {
    thinking.reset();
    // If stream completed, trigger parent refresh to load new trace
    if (onStreamComplete) {
      void onStreamComplete();
    }
  };

  // When the stream completes, auto-refresh the parent data
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && thinking.status === 'completed' && onStreamComplete) {
      void onStreamComplete();
    }
    prevStatusRef.current = thinking.status;
  }, [thinking.status, onStreamComplete]);

  if ((loading || !!actionLoading) && (!trace || !trace.steps)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-secondaryGray">
          <Loader2 className="animate-spin text-rausch" size={32} />
          <p>Initializing AI Agent pipeline...</p>
        </div>
      </div>
    );
  }

  if (!trace || !trace.steps || trace.steps.length === 0) {
    // Show the thinking stream panel when there's no trace yet
    if (showStream || thinking.status !== 'idle') {
      return (
        <div className="flex h-full gap-8 h-[calc(100vh-8rem)]">
          <div className="flex-1">
            <ThinkingStreamPanel
              events={thinking.events}
              status={thinking.status}
              errorMessage={thinking.errorMessage}
              onStart={handleStartStream}
              onReset={handleResetStream}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-secondaryGray">
          <p className="text-[22px] font-bold tracking-tight text-nearBlack">No AI Reasoning Trace Found</p>
          <p className="mt-2 text-[14px]">Run a daily plan to generate a trace.</p>
          <button
            onClick={handleStartStream}
            className="mt-6 flex items-center gap-2 mx-auto rounded bg-rausch px-6 py-3 text-[14px] font-bold text-pureWhite shadow-sm transition-all hover:shadow-hover hover:brightness-110 active:scale-[0.98]"
          >
            <Radio size={16} />
            Start Streaming Run
          </button>
        </div>
      </div>
    );
  }

  const steps = trace.steps;
  const defaultStep = steps.find(s => s.status === 'running') || steps[steps.length - 1];
  const activeStep = selectedStepId ? steps.find(s => s.step_id === selectedStepId) || defaultStep : defaultStep;

  const isApprovalStepActive = activeStep.node_type === 'gate' || activeStep.agent === 'approval';
  const candidatePlans = trace.candidate_evaluations ?? [];
  const alternativePlans = candidatePlans.filter(
    (item) => item.strategy_label !== trace.selected_strategy,
  );
  const selectedEvaluation = pendingApproval
    ? candidatePlans.find((p) => p.strategy_label === pendingApproval.plan?.strategy_label) ?? null
    : null;
  
  // Show full-screen thinking stream when active
  const isStreamActive = thinking.status === 'connecting' || thinking.status === 'streaming';
  if (showStream && isStreamActive) {
    return (
      <div className="flex h-full gap-8 h-[calc(100vh-8rem)]">
        <div className="flex-1">
          <ThinkingStreamPanel
            events={thinking.events}
            status={thinking.status}
            errorMessage={thinking.errorMessage}
            onStart={handleStartStream}
            onReset={handleResetStream}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-8 h-[calc(100vh-8rem)]">
      {/* Left Sidebar: Progress Stepper */}
      <div className="w-[340px] flex-shrink-0 bg-pureWhite rounded-card shadow-card p-6 border border-borderGray flex flex-col overflow-hidden">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-rausch rounded-full" />
            <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px]">Agent Pipeline</h2>
          </div>
          <button
            onClick={handleStartStream}
            className="flex items-center gap-1.5 rounded border border-rausch/20 bg-rausch/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.32px] text-rausch transition-colors hover:bg-rausch/10"
            title="Start a new streaming run"
          >
            <Radio size={13} />
            Stream
          </button>
        </div>

        {/* Show mini stream summary if there are events from a recent stream */}
        {thinking.events.length > 0 && thinking.status === 'completed' && (
          <button
            onClick={() => setShowStream(true)}
            className="mb-4 flex items-center gap-2 rounded-[12px] border border-green-200 bg-green-50 p-3 text-left transition-all hover:shadow-sm"
          >
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-green-700">
                Stream complete · {thinking.events.length} events
              </p>
              <p className="text-[11px] text-green-600 truncate">
                Click to review the thinking trace
              </p>
            </div>
          </button>
        )}

        <div className="flex-1 overflow-y-auto pr-2 relative" style={{ scrollbarWidth: 'thin' }}>
          <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-borderGray/60 rounded-full" />
          <div className="space-y-2 relative z-10">
            {steps.map((step, idx) => {
              const isSelected = activeStep.step_id === step.step_id;
              const isCompleted = step.status === 'completed';
              const isRunning = step.status === 'running';
              const Icon = STEP_ICONS[step.node_type] || BrainCircuit;

              return (
                <button
                  key={step.step_id || idx}
                  onClick={() => setSelectedStepId(step.step_id || null)}
                  className={`w-full flex items-start gap-4 text-left transition-all p-3 rounded-[12px] ${
                    isSelected ? 'bg-lightSurface shadow-sm border border-borderGray/50' : 'hover:bg-lightSurface/50 border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-[2px] z-10 transition-colors shadow-sm ${
                    isCompleted
                      ? 'bg-rausch border-rausch text-pureWhite'
                      : isRunning
                        ? 'bg-pureWhite border-rausch text-rausch'
                        : 'bg-lightSurface border-borderGray text-secondaryGray'
                  }`}>
                    {isCompleted ? <Icon size={18} /> : isRunning ? <Loader2 size={18} className="animate-spin" /> : <CircleDashed size={18} />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-[16px] font-semibold leading-tight ${
                      isSelected ? 'text-nearBlack' : isCompleted ? 'text-focusedGray' : 'text-secondaryGray'
                    }`}>
                      {step.agent.charAt(0).toUpperCase() + step.agent.slice(1)} Agent
                    </p>
                    <p className={`text-[13px] mt-1.5 truncate font-medium tracking-tight ${
                      isRunning ? 'text-rausch animate-pulse' : 'text-secondaryGray'
                    }`}>
                      {isCompleted ? `Completed in ${step.duration_ms}ms` : isRunning ? 'In Progress...' : 'Pending'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Content: Analysis Insight or Thinking Stream */}
      {showStream && thinking.events.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <ThinkingStreamPanel
            events={thinking.events}
            status={thinking.status}
            errorMessage={thinking.errorMessage}
            onStart={handleStartStream}
            onReset={() => {
              setShowStream(false);
              handleResetStream();
            }}
          />
        </div>
      ) : (
        <div className="flex-1 bg-pureWhite rounded-card shadow-card border border-borderGray flex flex-col overflow-hidden">
          <div className="p-8 border-b border-borderGray flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[28px] font-bold text-nearBlack tracking-[-0.44px]">Analysis Insight</h2>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-badge border text-[12px] font-bold uppercase tracking-[0.32px] ${
                activeStep.fallback_used || activeStep.llm_error
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : activeStep.llm_used
                    ? 'bg-luxePurple/5 text-luxePurple border-luxePurple/10'
                    : 'bg-lightSurface text-focusedGray border-borderGray'
              }`}>
                <BrainCircuit size={15} />
                {describeDecisionMethod(activeStep)}
              </div>
            </div>
            
            <div className="bg-lightSurface p-6 rounded-[16px] border border-borderGray shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rausch" />
              <p className="text-[16px] text-nearBlack font-medium leading-[1.6]">
                {activeStep.summary || 'Waiting for agent to produce insights...'}
              </p>
              {activeStep.reasoning_source && (
                <div className="mt-4 pt-4 border-t border-borderGray/50 flex items-center gap-1.5">
                  <p className="text-[12px] font-bold text-secondaryGray uppercase tracking-[0.32px]">Decision method:</p>
                  <p className="text-[13px] text-focusedGray font-medium bg-pureWhite px-2 py-0.5 rounded-sm border border-borderGray/50">
                    {describeDecisionMethod(activeStep)} · {activeStep.reasoning_source.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-pureWhite" style={{ scrollbarWidth: 'thin' }}>
            {(isApprovalStepActive && pendingApproval) ? (
              <ApprovalQueue
                pendingApproval={pendingApproval}
                approvalDetail={approvalDetail ?? null}
                actionLoading={actionLoading ?? null}
                currentEvent={trace?.event ?? null}
                selectedEvaluation={selectedEvaluation}
                alternativePlans={alternativePlans}
                onApprovalAction={async (action, decisionId) => {
                  if (onApprovalAction) await onApprovalAction(action, decisionId);
                }}
                onSelectAlternative={async (decisionId, strategyLabel) => {
                  if (onSelectAlternative) {
                    await onSelectAlternative(decisionId, strategyLabel);
                  }
                }}
              />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                
                {/* Observations Panel */}
                <div className="flex flex-col gap-5">
                  <h3 className="text-[14px] font-bold uppercase tracking-[0.32px] text-nearBlack">Evidence & Telemetry</h3>
                  {activeStep.observations && activeStep.observations.length > 0 ? (
                    <div className="space-y-4">
                      {activeStep.observations.map((obs, i) => (
                        <div key={i} className="p-5 bg-pureWhite rounded-[16px] border border-borderGray flex items-start gap-4 shadow-sm hover:shadow-hover transition-all duration-200">
                          <div className="w-2 h-2 bg-rausch rounded-full mt-2.5 flex-shrink-0 shadow-[0_0_8px_rgba(255,56,92,0.5)]" />
                          <p className="text-[14px] text-focusedGray font-medium leading-relaxed">{obs}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[14px] text-secondaryGray italic p-6 bg-lightSurface rounded-[16px] text-center border border-dashed border-borderGray">
                      No direct observations recorded.
                    </div>
                  )}

                  {activeStep.downstream_impacts && activeStep.downstream_impacts.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold uppercase tracking-[0.32px] text-nearBlack mb-5">Business Impact</h3>
                      <div className="space-y-3">
                        {activeStep.downstream_impacts.map((impact, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-lightSurface border border-borderGray rounded-[16px]">
                            <BarChart3 size={18} className="text-rausch mt-0.5 flex-shrink-0" />
                            <p className="text-[14px] text-focusedGray font-medium">{impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metrics/Tradeoffs Panel */}
                <div className="flex flex-col gap-8">
                  
                  {/* Recommended Actions */}
                  <div>
                    <h3 className="text-[14px] font-bold uppercase tracking-[0.32px] text-nearBlack mb-5">Recommended Actions</h3>
                    {activeStep.recommended_action_ids && activeStep.recommended_action_ids.length > 0 ? (
                      <div className="space-y-3">
                        {activeStep.recommended_action_ids.map((act, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 bg-rausch/5 text-deepRausch font-semibold rounded-[16px] border border-rausch/10">
                            <CheckCircle2 size={18} />
                            <span className="text-[15px]">{humanizeAction(act)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[14px] text-secondaryGray p-5 bg-lightSurface rounded-[16px] border border-dashed border-borderGray text-center">
                        None recommended by this agent.
                      </div>
                    )}
                  </div>

                  {/* Tradeoffs */}
                  <div>
                    <h3 className="text-[14px] font-bold uppercase tracking-[0.32px] text-nearBlack mb-5">Trade-offs To Watch</h3>
                    {activeStep.tradeoffs && activeStep.tradeoffs.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {activeStep.tradeoffs.map((tradeoff, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-pureWhite border border-borderGray rounded-[16px] shadow-sm">
                            <span className="text-[14px] text-focusedGray font-medium">{tradeoff}</span>
                            <span className="text-[12px] font-bold text-legalBlue bg-legalBlue/10 px-2 py-1 rounded-sm">Analyzed</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[14px] text-secondaryGray italic p-5 bg-lightSurface rounded-[16px] border border-dashed border-borderGray text-center">
                        No critical tradeoffs flagged.
                      </p>
                    )}
                  </div>
                  
                  {/* Risks */}
                  {activeStep.risks && activeStep.risks.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold uppercase tracking-[0.32px] text-errorRed mb-5">Identified Risks</h3>
                      <div className="space-y-3">
                        {activeStep.risks.map((risk, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-errorRed/5 border border-errorRed/10 rounded-[16px]">
                            <AlertCircle size={18} className="text-errorRed mt-0.5 flex-shrink-0" />
                            <p className="text-[14px] text-errorDark font-medium">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

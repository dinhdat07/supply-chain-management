import { useState } from 'react';
import type { TraceView } from '../lib/types';
import { BrainCircuit, CheckCircle2, CircleDashed, Clock, AlertCircle, FileText, BarChart3, Loader2 } from 'lucide-react';

interface PlanGenerationProps {
  trace?: TraceView | null;
  loading: boolean;
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

export function PlanGeneration({ trace, loading }: PlanGenerationProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  if (loading && (!trace || !trace.steps)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-secondaryGray">
          <Loader2 className="animate-spin text-rausch" size={32} />
          <p>Loading plan generation progress...</p>
        </div>
      </div>
    );
  }

  if (!trace || !trace.steps || trace.steps.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-secondaryGray">
          <p className="text-[22px] font-bold tracking-tight text-nearBlack">No AI Reasoning Trace Found</p>
          <p className="mt-2 text-[14px]">Run a daily plan to generate a trace.</p>
        </div>
      </div>
    );
  }

  const steps = trace.steps;
  const defaultStep = steps.find(s => s.status === 'running') || steps[steps.length - 1];
  const activeStep = selectedStepId ? steps.find(s => s.step_id === selectedStepId) || defaultStep : defaultStep;

  return (
    <div className="flex h-full gap-8 h-[calc(100vh-8rem)]">
      {/* Left Sidebar: Progress Stepper */}
      <div className="w-[340px] flex-shrink-0 bg-pureWhite rounded-card shadow-card p-6 border border-borderGray flex flex-col overflow-hidden">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-rausch rounded-full" />
          <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px]">Agent Pipeline</h2>
        </div>

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

      {/* Right Content: Analysis Insight */}
      <div className="flex-1 bg-pureWhite rounded-card shadow-card border border-borderGray flex flex-col overflow-hidden">
        <div className="p-8 border-b border-borderGray flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[28px] font-bold text-nearBlack tracking-[-0.44px]">Analysis Insight</h2>
            {activeStep.llm_used && (
              <div className="flex items-center gap-2 px-4 py-2 bg-luxePurple/5 text-luxePurple rounded-badge border border-luxePurple/10 text-[12px] font-bold uppercase tracking-[0.32px]">
                <BrainCircuit size={15} />
                AI Generated
              </div>
            )}
          </div>
          
          <div className="bg-lightSurface p-6 rounded-[16px] border border-borderGray shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rausch" />
            <p className="text-[16px] text-nearBlack font-medium leading-[1.6]">
              {activeStep.summary || 'Waiting for agent to produce insights...'}
            </p>
            {activeStep.reasoning_source && (
              <div className="mt-4 pt-4 border-t border-borderGray/50 flex items-center gap-1.5">
                <p className="text-[12px] font-bold text-secondaryGray uppercase tracking-[0.32px]">Source Engine:</p>
                <p className="text-[13px] text-focusedGray font-medium bg-pureWhite px-2 py-0.5 rounded-sm border border-borderGray/50">
                  {activeStep.reasoning_source.replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-pureWhite" style={{ scrollbarWidth: 'thin' }}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            
            {/* Observations Panel */}
            <div className="flex flex-col gap-5">
              <h3 className="text-[14px] font-bold uppercase tracking-[0.32px] text-nearBlack">Observations & Telemetry</h3>
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
                        <span className="text-[15px]">{act}</span>
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
                <h3 className="text-[14px] font-bold uppercase tracking-[0.32px] text-nearBlack mb-5">Considered Tradeoffs</h3>
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
        </div>
      </div>
    </div>
  );
}

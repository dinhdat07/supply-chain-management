import { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, AlertCircle, BarChart3, CheckCircle2, ChevronRight, ShieldAlert, PackageSearch, LineChart, Factory, Truck, Clock } from 'lucide-react';
import type { AgentStepView } from '../../lib/types';
import { humanizeAction, describeDecisionMethod } from '../../lib/presenters';

const AGENT_ICONS: Record<string, any> = {
  risk: ShieldAlert,
  supplier: Factory,
  demand: LineChart,
  inventory: PackageSearch,
  logistics: Truck,
  planner: BrainCircuit,
  critic: CheckCircle2,
  approval: CheckCircle2,
  execution: Clock,
};

interface AgentMessageBubbleProps {
  step: AgentStepView;
  isLast: boolean;
  isHighlighted?: boolean;
}

export function AgentMessageBubble({ step, isLast, isHighlighted }: AgentMessageBubbleProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const isRunning = step.status === 'running';

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const hasObservations = step.observations && step.observations.length > 0;
  const hasImpacts = step.downstream_impacts && step.downstream_impacts.length > 0;
  const hasActions = step.recommended_action_ids && step.recommended_action_ids.length > 0;
  const hasTradeoffs = step.tradeoffs && step.tradeoffs.length > 0;
  const hasRisks = step.risks && step.risks.length > 0;

  const getMethodColor = () => {
    if (step.fallback_used || step.llm_error) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (step.llm_used) return 'bg-luxePurple/5 text-luxePurple border-luxePurple/10';
    return 'bg-lightSurface text-focusedGray border-borderGray';
  };

  const agentName = step.agent.charAt(0).toUpperCase() + step.agent.slice(1);
  const Icon = AGENT_ICONS[step.node_type] || AGENT_ICONS[step.agent] || BrainCircuit;

  return (
    <div className={`flex gap-4 group transition-all duration-300 p-2 -mx-2 rounded-xl ${
      isHighlighted ? 'bg-rausch/5 shadow-[0_0_0_2px_rgba(255,56,92,0.2)]' : 'bg-transparent'
    }`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1 z-10 transition-colors duration-200 ${
        isHighlighted ? 'bg-rausch text-pureWhite shadow-[0_0_12px_rgba(255,56,92,0.4)]' 
        : isRunning ? 'bg-rausch/10 text-rausch'
        : 'bg-pureWhite text-nearBlack border border-borderGray shadow-sm'
      }`}>
        <Icon size={18} className={isRunning && !isHighlighted ? 'animate-pulse' : ''} />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 max-w-[85%]">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="font-bold text-[15px] text-nearBlack tracking-[-0.22px]">
            {agentName} Agent
          </span>
          <span className="text-[12px] font-semibold text-secondaryGray">
            {step.duration_ms ? `${(step.duration_ms / 1000).toFixed(1)}s` : ''}
          </span>
          <div className={`px-2 py-0.5 rounded-sm border text-[10px] font-bold uppercase tracking-[0.32px] flex items-center gap-1 ${getMethodColor()}`}>
            {describeDecisionMethod(step)}
          </div>
        </div>

        <div className={`bg-pureWhite border rounded-card shadow-sm p-5 relative transition-all duration-300 ${
          isHighlighted ? 'border-rausch ring-1 ring-rausch/30 shadow-md' : 'border-borderGray'
        } ${isLast && !isHighlighted ? 'shadow-hover ring-1 ring-borderGray/50' : ''}`}>
          
          {/* Main Summary */}
          {isRunning ? (
            <div className="space-y-3 py-1">
              <div className="h-2.5 bg-borderGray/60 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-2.5 bg-borderGray/60 rounded-full w-1/2 animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2.5 bg-borderGray/60 rounded-full w-5/6 animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            <div className="text-[15px] text-nearBlack font-medium leading-[1.6] whitespace-pre-wrap">
              {step.summary || 'No summary provided.'}
            </div>
          )}

          {/* Inline Buttons for Details (Progressive Disclosure) */}
          {!isRunning && (hasObservations || hasImpacts || hasActions || hasTradeoffs || hasRisks) && (
            <div className="mt-4 pt-4 border-t border-borderGray flex flex-wrap gap-2">
              {hasObservations && (
                <button
                  onClick={() => toggleSection('evidence')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-badge border text-[13px] font-semibold transition-colors ${
                    expandedSection === 'evidence' ? 'bg-nearBlack text-pureWhite border-nearBlack' : 'bg-lightSurface text-secondaryGray border-borderGray hover:bg-borderGray/20 hover:text-nearBlack'
                  }`}
                >
                  <AlertCircle size={14} />
                  {step.observations.length} Observations
                  {expandedSection === 'evidence' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>
              )}
              {hasImpacts && (
                <button
                  onClick={() => toggleSection('impacts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-badge border text-[13px] font-semibold transition-colors ${
                    expandedSection === 'impacts' ? 'bg-nearBlack text-pureWhite border-nearBlack' : 'bg-lightSurface text-secondaryGray border-borderGray hover:bg-borderGray/20 hover:text-nearBlack'
                  }`}
                >
                  <BarChart3 size={14} />
                  {step.downstream_impacts.length} Impacts
                  {expandedSection === 'impacts' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>
              )}
              {hasActions && (
                <button
                  onClick={() => toggleSection('actions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-badge border text-[13px] font-semibold transition-colors ${
                    expandedSection === 'actions' ? 'bg-nearBlack text-pureWhite border-nearBlack' : 'bg-lightSurface text-secondaryGray border-borderGray hover:bg-borderGray/20 hover:text-nearBlack'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {step.recommended_action_ids.length} Actions
                  {expandedSection === 'actions' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>
              )}
              {hasRisks && (
                <button
                  onClick={() => toggleSection('risks')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-badge border text-[13px] font-semibold transition-colors ${
                    expandedSection === 'risks' ? 'bg-errorRed text-pureWhite border-errorRed' : 'bg-errorRed/5 text-errorRed border-errorRed/20 hover:bg-errorRed/10'
                  }`}
                >
                  <AlertCircle size={14} />
                  {step.risks.length} Risks
                  {expandedSection === 'risks' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>
              )}
              {hasTradeoffs && (
                <button
                  onClick={() => toggleSection('tradeoffs')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-badge border text-[13px] font-semibold transition-colors ${
                    expandedSection === 'tradeoffs' ? 'bg-nearBlack text-pureWhite border-nearBlack' : 'bg-lightSurface text-secondaryGray border-borderGray hover:bg-borderGray/20 hover:text-nearBlack'
                  }`}
                >
                  <ChevronRight size={14} />
                  {step.tradeoffs.length} Trade-offs
                  {expandedSection === 'tradeoffs' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>
              )}
            </div>
          )}

          {/* Expanded Sections Content */}
          {!isRunning && expandedSection === 'evidence' && hasObservations && (
            <div className="mt-4 p-4 bg-lightSurface rounded-[12px] border border-borderGray/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-[12px] uppercase font-bold text-secondaryGray tracking-wider mb-3">Telemetry & Observations</h4>
              {step.observations.map((obs: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-[14px] text-focusedGray">
                  <div className="w-1.5 h-1.5 bg-nearBlack rounded-full mt-1.5 flex-shrink-0" />
                  <p>{obs}</p>
                </div>
              ))}
            </div>
          )}

          {!isRunning && expandedSection === 'impacts' && hasImpacts && (
            <div className="mt-4 p-4 bg-lightSurface rounded-[12px] border border-borderGray/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-[12px] uppercase font-bold text-secondaryGray tracking-wider mb-3">Business Impact</h4>
              {step.downstream_impacts.map((impact: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-[14px] text-focusedGray">
                  <BarChart3 size={16} className="text-secondaryGray mt-0.5 flex-shrink-0" />
                  <p>{impact}</p>
                </div>
              ))}
            </div>
          )}

          {!isRunning && expandedSection === 'actions' && hasActions && (
            <div className="mt-4 p-4 bg-lightSurface rounded-[12px] border border-borderGray/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-[12px] uppercase font-bold text-secondaryGray tracking-wider mb-3">Recommended Actions</h4>
              {step.recommended_action_ids.map((act: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-[14px] font-semibold text-deepRausch bg-pureWhite p-2.5 rounded-lg border border-borderGray">
                  <CheckCircle2 size={16} className="text-rausch mt-0.5 flex-shrink-0" />
                  <p>{humanizeAction(act)}</p>
                </div>
              ))}
            </div>
          )}

          {!isRunning && expandedSection === 'risks' && hasRisks && (
            <div className="mt-4 p-4 bg-errorRed/5 rounded-[12px] border border-errorRed/20 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-[12px] uppercase font-bold text-errorRed tracking-wider mb-3">Identified Risks</h4>
              {step.risks.map((risk: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-[14px] text-errorDark">
                  <AlertCircle size={16} className="text-errorRed mt-0.5 flex-shrink-0" />
                  <p>{risk}</p>
                </div>
              ))}
            </div>
          )}

          {!isRunning && expandedSection === 'tradeoffs' && hasTradeoffs && (
            <div className="mt-4 p-4 bg-lightSurface rounded-[12px] border border-borderGray/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-[12px] uppercase font-bold text-secondaryGray tracking-wider mb-3">Trade-offs To Watch</h4>
              {step.tradeoffs.map((tradeoff: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-[14px] text-focusedGray bg-pureWhite p-2.5 rounded-lg border border-borderGray">
                  <p>{tradeoff}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


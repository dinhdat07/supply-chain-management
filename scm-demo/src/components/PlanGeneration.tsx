import { useState, useRef, useEffect } from 'react';
import type { TraceView, PendingApprovalView } from '../lib/types';
import { BrainCircuit, CheckCircle2, Clock, ShieldAlert, PackageSearch, LineChart, Factory, Truck, Loader2, ArrowRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AgentMessageBubble } from './agent/AgentMessageBubble';

interface PlanGenerationProps {
  trace?: TraceView | null;
  loading: boolean;
  pendingApproval?: PendingApprovalView | null;
  actionLoading?: string | null;
  onNavigateToControlTower: () => void;
}

const STEP_ICONS: Record<string, any> = {
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

export function PlanGeneration({ 
  trace, 
  loading,
  pendingApproval,
  actionLoading,
  onNavigateToControlTower,
}: PlanGenerationProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Handle scrolling when user scrolls manually
  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If scrolled up from the bottom more than 50px, disable autoscroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      isProgrammaticScroll.current = true;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setTimeout(() => { isProgrammaticScroll.current = false; }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace?.steps?.length, actionLoading]);

  // Scroll to specific step when clicked in sidebar
  const scrollToStep = (stepId: string) => {
    setSelectedStepId(stepId);
    setAutoScroll(false);
    setHighlightedStepId(stepId);
    
    isProgrammaticScroll.current = true;
    
    // Use requestAnimationFrame to ensure DOM is ready before scrolling
    requestAnimationFrame(() => {
      const element = document.getElementById(`step-${stepId}`);
      if (element && scrollRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Unlock scroll listener after smooth scroll finishes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 800);
    });
    
    // Clear highlight after 1s for faster blink
    setTimeout(() => {
      setHighlightedStepId(prev => prev === stepId ? null : prev);
    }, 1000);
  };

  const baseSteps = trace?.steps || [];
  let displaySteps = [...baseSteps];
  
  if (actionLoading && !actionLoading.startsWith('approval:') && (displaySteps.length === 0 || displaySteps[displaySteps.length - 1].status === 'completed')) {
    displaySteps.push({
      step_id: 'dummy-loading',
      agent: 'system',
      node_type: 'planner',
      status: 'running',
      started_at: new Date().toISOString(),
      summary: '',
      mode_snapshot: '',
      observations: [],
      risks: [],
      downstream_impacts: [],
      recommended_action_ids: [],
      tradeoffs: [],
      llm_used: false,
    } as any);
  }


  const steps = displaySteps;
  const defaultStep = steps.find(s => s.status === 'running') || steps[steps.length - 1];
  const activeStepId = selectedStepId || defaultStep?.step_id || `idx-${steps.length - 1}`;
  
  return (
    <div className="flex h-full gap-8 h-[calc(100vh-8rem)] relative">
      {/* Left Sidebar: Progress Stepper */}
      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col ${
        isSidebarOpen ? 'w-[340px] opacity-100' : 'w-0 opacity-0 overflow-hidden'
      }`}>
        <div className="w-[340px] bg-pureWhite rounded-card shadow-card p-6 border border-borderGray flex flex-col h-full">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-nearBlack rounded-full" />
              <h2 className="text-[20px] font-bold text-nearBlack tracking-[-0.44px]">Agent Pipeline</h2>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="p-1.5 text-secondaryGray hover:text-nearBlack hover:bg-lightSurface rounded-md transition-colors border border-transparent hover:border-borderGray"
              title="Close Sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 relative" style={{ scrollbarWidth: 'thin' }}>
            <div className="absolute left-[28px] top-6 bottom-6 w-[2px] bg-borderGray/40 rounded-full" />
            <div className="space-y-3 relative z-10">
              {steps.map((step, idx) => {
                const uniqueId = step.step_id || `idx-${idx}`;
                const isSelected = activeStepId === uniqueId;
                const isCompleted = step.status === 'completed';
                const isRunning = step.status === 'running';
                const Icon = STEP_ICONS[step.node_type] || STEP_ICONS[step.agent] || BrainCircuit;

                return (
                  <button
                    key={uniqueId}
                    onClick={() => scrollToStep(uniqueId)}
                    className={`w-full flex items-start gap-4 text-left transition-all p-3.5 rounded-[16px] group ${
                      isSelected ? 'bg-lightSurface shadow-sm border border-borderGray/80 ring-1 ring-borderGray/30' : 'hover:bg-lightSurface/60 border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-pureWhite border border-borderGray text-nearBlack shadow-sm group-hover:scale-105'
                        : isRunning
                          ? 'bg-rausch/10 text-rausch group-hover:scale-105'
                          : 'bg-lightSurface border border-borderGray border-dashed text-secondaryGray group-hover:border-focusedGray group-hover:text-focusedGray'
                    }`}>
                      <Icon size={18} className={isRunning ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-[15px] font-bold leading-tight tracking-tight transition-colors ${
                        isSelected ? 'text-nearBlack' : isCompleted ? 'text-focusedGray' : 'text-secondaryGray group-hover:text-focusedGray'
                      }`}>
                        {step.agent.charAt(0).toUpperCase() + step.agent.slice(1)} Agent
                      </p>
                      <p className={`text-[13px] mt-1.5 truncate font-medium tracking-tight ${
                        isRunning ? 'text-rausch animate-pulse font-semibold' : 'text-secondaryGray'
                      }`}>
                        {isCompleted ? `Completed in ${(step.duration_ms! / 1000).toFixed(1)}s` : isRunning ? 'In Progress...' : 'Pending execution'}
                      </p>
                    </div>
                    {isCompleted && (
                      <div className="mt-1">
                        <CheckCircle2 size={16} className="text-borderGray" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Content: Analysis Insight Chat Feed */}
      <div className="flex-1 bg-lightSurface rounded-card shadow-card border border-borderGray flex flex-col overflow-hidden relative transition-all duration-300">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-borderGray bg-pureWhite flex flex-col gap-1 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="p-1.5 text-secondaryGray hover:text-nearBlack hover:bg-lightSurface rounded-md transition-colors mr-2"
                  title="Open Sidebar"
                >
                  <PanelLeftOpen size={20} />
                </button>
              )}
              <h2 className="text-[20px] font-bold text-nearBlack tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rausch/10 text-rausch flex items-center justify-center border border-rausch/20">
                  <BrainCircuit size={18} />
                </div>
                ChainCopilot
              </h2>
            </div>
            {actionLoading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-badge bg-lightSurface border border-borderGray text-[12px] font-bold uppercase tracking-[0.32px] text-focusedGray">
                <Loader2 size={14} className="animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Message Feed */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 space-y-8" 
          style={{ scrollbarWidth: 'thin' }}
        >
          {steps.map((step, idx) => {
            const uniqueId = step.step_id || `idx-${idx}`;
            return (
              <div id={`step-${uniqueId}`} key={uniqueId} className="scroll-mt-6">
                <AgentMessageBubble 
                  step={step} 
                  isLast={idx === steps.length - 1} 
                  isHighlighted={highlightedStepId === uniqueId}
                />
              </div>
            );
          })}

          {/* Pending Approval Card as Final Message */}
          {!!pendingApproval && (
            <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8 border-t border-borderGray/50 pt-8">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rausch text-pureWhite flex items-center justify-center shadow-card border-2 border-pureWhite mt-1 z-10">
                <CheckCircle2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-bold text-[15px] text-nearBlack tracking-[-0.22px]">
                    ChainCopilot System
                  </span>
                  <div className="px-2 py-0.5 rounded-sm border text-[10px] font-bold uppercase tracking-[0.32px] bg-amber-100 text-amber-700 border-amber-200">
                    Awaiting Approval
                  </div>
                </div>
                <div className="bg-pureWhite border border-borderGray rounded-card shadow-sm p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 bg-rausch/10 text-rausch rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-nearBlack">Plan Ready for Approval</h3>
                    <p className="text-[14px] text-secondaryGray mt-1 max-w-[400px] leading-relaxed">
                      The AI agents have successfully formulated a recovery plan. Please proceed to the Control Tower to review alternatives, analyze tradeoffs, and authorize execution.
                    </p>
                  </div>
                  <button
                    onClick={onNavigateToControlTower}
                    className="flex items-center gap-2 px-6 py-2.5 bg-nearBlack text-pureWhite rounded-card text-[14px] font-bold shadow-sm hover:shadow-hover hover:bg-nearBlack/90 transition-all mt-2"
                  >
                    Go to Control Tower
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

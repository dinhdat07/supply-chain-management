import {
  Activity,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Eye,
  Lightbulb,
  Loader2,
  Play,
  ShieldAlert,
  PackageSearch,
  LineChart,
  Factory,
  Truck,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import type { ThinkingEvent, ThinkingEventType } from '../../lib/types';

/* ── Icon per event type ────────────────────────────────── */

const EVENT_TYPE_ICONS: Record<ThinkingEventType, typeof BrainCircuit> = {
  start: Play,
  analysis: Activity,
  thinking: BrainCircuit,
  observation: Eye,
  reflection: Lightbulb,
  decision: Sparkles,
  action: Zap,
  final: CheckCircle2,
  error: AlertCircle,
};

const EVENT_TYPE_COLORS: Record<ThinkingEventType, string> = {
  start: 'bg-rausch text-pureWhite',
  analysis: 'bg-blue-500 text-pureWhite',
  thinking: 'bg-purple-500 text-pureWhite',
  observation: 'bg-emerald-500 text-pureWhite',
  reflection: 'bg-amber-500 text-pureWhite',
  decision: 'bg-indigo-500 text-pureWhite',
  action: 'bg-cyan-500 text-pureWhite',
  final: 'bg-green-600 text-pureWhite',
  error: 'bg-errorRed text-pureWhite',
};

const EVENT_TYPE_LABELS: Record<ThinkingEventType, string> = {
  start: 'Starting',
  analysis: 'Analyzing',
  thinking: 'Reasoning',
  observation: 'Observation',
  reflection: 'Reflecting',
  decision: 'Decision',
  action: 'Action',
  final: 'Complete',
  error: 'Error',
};

/* ── Icon per agent ─────────────────────────────────────── */

const AGENT_COLORS: Record<string, string> = {
  risk: 'bg-rose-500 text-pureWhite',
  supplier: 'bg-indigo-500 text-pureWhite',
  demand: 'bg-purple-500 text-pureWhite',
  inventory: 'bg-amber-500 text-nearBlack',
  logistics: 'bg-teal-500 text-pureWhite',
  planner: 'bg-nearBlack text-pureWhite',
  critic: 'bg-emerald-600 text-pureWhite',
  approval: 'bg-blue-600 text-pureWhite',
  execution: 'bg-slate-600 text-pureWhite',
  system: 'bg-secondaryGray text-pureWhite',
};

const AGENT_ICONS: Record<string, typeof BrainCircuit> = {
  risk: ShieldAlert,
  supplier: Factory,
  demand: LineChart,
  inventory: PackageSearch,
  logistics: Truck,
  planner: BrainCircuit,
  critic: CheckCircle2,
  approval: CheckCircle2,
  execution: Clock,
  system: Loader2,
};


/* ── Component ──────────────────────────────────────────── */

interface ThinkingEventBubbleProps {
  event: ThinkingEvent;
  isLast: boolean;
  isStreaming: boolean;
}

export function ThinkingEventBubble({ event, isLast, isStreaming }: ThinkingEventBubbleProps) {
  const AgentIcon = AGENT_ICONS[event.agent] || BrainCircuit;
  const TypeIcon = EVENT_TYPE_ICONS[event.type] || Activity;
  const typeLabel = EVENT_TYPE_LABELS[event.type] || event.type;
  const agentName = event.agent.charAt(0).toUpperCase() + event.agent.slice(1);
  const agentColorClass = AGENT_COLORS[event.agent] || AGENT_COLORS.system;
  const isTerminal = event.type === 'final' || event.type === 'error';

  // Safely parse timestamp
  const formattedTime = event.timestamp ? (() => {
    const dateStr = event.timestamp.endsWith('Z') ? event.timestamp : `${event.timestamp}Z`;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      fractionalSecondDigits: 3 
    });
  })() : null;
  
  return (
    <div className={`flex gap-4 transition-all duration-300 ${
      isLast && isStreaming ? 'animate-slide-in' : ''
    }`}>
      {/* Avatar - Now colored by Agent */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1 z-10 transition-all duration-200 shadow-sm border-2 border-pureWhite ${agentColorClass}`}>
        {isLast && isStreaming && !isTerminal ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <AgentIcon size={18} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-[85%]">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[15px] text-nearBlack tracking-[-0.22px]">
              {agentName} Agent
            </span>
          </div>
          <span className={`rounded-badge border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.32px] ${EVENT_TYPE_COLORS[event.type]}`}>
            <span className="flex items-center gap-1">
              <TypeIcon size={10} />
              {typeLabel}
            </span>
          </span>
          {event.data?.llm_used === true && (
            <span className="flex items-center gap-1 rounded bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em]">
              <Sparkles size={10} /> AI
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {formattedTime && (
              <span className="text-[11px] font-medium text-secondaryGray/60 tabular-nums">
                {formattedTime}
              </span>
            )}
            <span className="text-[11px] tabular-nums font-semibold text-secondaryGray/50 bg-lightSurface px-1.5 py-0.5 rounded-sm border border-borderGray">
              #{event.sequence}
            </span>
          </div>
        </div>

        {/* Message bubble */}
        <div className={`bg-pureWhite border rounded-card shadow-sm px-5 py-4 transition-all duration-300 ${
          isTerminal
            ? event.type === 'error'
              ? 'border-errorRed/30 bg-errorRed/5'
              : 'border-green-300 bg-green-50'
            : isLast && isStreaming
              ? 'border-rausch/20 shadow-hover ring-1 ring-rausch/10'
              : 'border-borderGray'
        }`}>
          <p className="text-[14px] text-nearBlack font-medium leading-[1.65]">
            {event.message}
          </p>

          {/* Data tags */}
          {event.data && Object.keys(event.data).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(event.data)
                .filter(([key]) => !['llm_used', 'llm_error'].includes(key))
                .filter(([, value]) => value !== null && value !== '')
                .map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-sm bg-lightSurface border border-borderGray/50 px-2 py-0.5 text-[11px] font-medium text-secondaryGray"
                >
                  <span className="font-semibold text-nearBlack mr-1">{key}:</span>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

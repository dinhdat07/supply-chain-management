import { useEffect, useRef } from "react";
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Eye,
  Lightbulb,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ThinkingEvent, ThinkingEventType } from "../../lib/types";
import type { StreamStatus } from "../../hooks/useThinkingStream";

/* ── Visual config per event type ───────────────────────── */

interface EventVisual {
  Icon: typeof BrainCircuit;
  dotClass: string;
  borderClass: string;
  label: string;
}

const EVENT_VISUALS: Record<ThinkingEventType, EventVisual> = {
  start: {
    Icon: Play,
    dotClass: "bg-rausch text-pureWhite",
    borderClass: "border-l-rausch",
    label: "Start",
  },
  analysis: {
    Icon: Activity,
    dotClass: "bg-blue-500 text-pureWhite",
    borderClass: "border-l-blue-500",
    label: "Analysis",
  },
  thinking: {
    Icon: BrainCircuit,
    dotClass: "bg-purple-500 text-pureWhite",
    borderClass: "border-l-purple-500",
    label: "Thinking",
  },
  observation: {
    Icon: Eye,
    dotClass: "bg-emerald-500 text-pureWhite",
    borderClass: "border-l-emerald-500",
    label: "Observation",
  },
  reflection: {
    Icon: Lightbulb,
    dotClass: "bg-amber-500 text-pureWhite",
    borderClass: "border-l-amber-500",
    label: "Reflection",
  },
  decision: {
    Icon: Sparkles,
    dotClass: "bg-indigo-500 text-pureWhite",
    borderClass: "border-l-indigo-500",
    label: "Decision",
  },
  action: {
    Icon: Zap,
    dotClass: "bg-cyan-500 text-pureWhite",
    borderClass: "border-l-cyan-500",
    label: "Action",
  },
  final: {
    Icon: CheckCircle2,
    dotClass: "bg-green-600 text-pureWhite",
    borderClass: "border-l-green-600",
    label: "Complete",
  },
  error: {
    Icon: AlertCircle,
    dotClass: "bg-errorRed text-pureWhite",
    borderClass: "border-l-errorRed",
    label: "Error",
  },
};

/* ── Agent color mapping ────────────────────────────────── */

function agentBadgeClass(agent: string): string {
  switch (agent) {
    case "risk":
      return "bg-errorRed/10 text-errorRed border-errorRed/20";
    case "demand":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "inventory":
      return "bg-orange-50 text-orange-600 border-orange-200";
    case "supplier":
      return "bg-purple-50 text-purple-600 border-purple-200";
    case "logistics":
      return "bg-green-50 text-green-600 border-green-200";
    case "planner":
      return "bg-rausch/10 text-rausch border-rausch/20";
    case "critic":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-lightSurface text-secondaryGray border-borderGray";
  }
}

/* ── Status badge ───────────────────────────────────────── */

function StatusIndicator({ status }: { status: StreamStatus }) {
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 rounded-badge border border-rausch/20 bg-rausch/5 px-3 py-1.5">
        <Loader2 size={14} className="animate-spin text-rausch" />
        <span className="text-[12px] font-bold uppercase tracking-[0.32px] text-rausch">
          Connecting
        </span>
      </div>
    );
  }
  if (status === "streaming") {
    return (
      <div className="flex items-center gap-2 rounded-badge border border-rausch/20 bg-rausch/5 px-3 py-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rausch opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rausch" />
        </span>
        <span className="text-[12px] font-bold uppercase tracking-[0.32px] text-rausch">
          Live
        </span>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 rounded-badge border border-green-200 bg-green-50 px-3 py-1.5">
        <CheckCircle2 size={14} className="text-green-600" />
        <span className="text-[12px] font-bold uppercase tracking-[0.32px] text-green-700">
          Complete
        </span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-2 rounded-badge border border-errorRed/20 bg-errorRed/10 px-3 py-1.5">
        <AlertCircle size={14} className="text-errorRed" />
        <span className="text-[12px] font-bold uppercase tracking-[0.32px] text-errorRed">
          Error
        </span>
      </div>
    );
  }
  return null;
}

/* ── Single event row ───────────────────────────────────── */

function ThinkingEventRow({
  event,
  isLatest,
}: {
  event: ThinkingEvent;
  isLatest: boolean;
}) {
  const visual = EVENT_VISUALS[event.type] ?? EVENT_VISUALS.action;
  const { Icon } = visual;

  return (
    <div
      className={`group relative flex items-start gap-4 transition-all duration-300 ${
        isLatest ? "animate-slide-in" : ""
      }`}
    >
      {/* Timeline dot */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${visual.dotClass} ${
            isLatest ? "ring-2 ring-offset-2 ring-offset-pureWhite ring-rausch/30" : ""
          }`}
        >
          <Icon size={14} />
        </div>
      </div>

      {/* Content card */}
      <div
        className={`flex-1 rounded-[14px] border border-borderGray bg-pureWhite p-4 shadow-sm transition-all duration-200 hover:shadow-hover ${visual.borderClass} border-l-[3px] ${
          isLatest ? "border-borderGray bg-lightSurface/50" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`rounded-badge border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.32px] ${agentBadgeClass(event.agent)}`}
          >
            {event.agent}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.32px] text-secondaryGray">
            {visual.label}
          </span>
          <span className="ml-auto text-[11px] tabular-nums text-secondaryGray/60">
            #{event.sequence}
          </span>
        </div>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-nearBlack">
          {event.message}
        </p>
        {event.data && Object.keys(event.data).length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {Object.entries(event.data).map(([key, value]) => (
              <span
                key={key}
                className="rounded-sm bg-lightSurface px-2 py-0.5 text-[11px] font-medium text-secondaryGray"
              >
                {key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main panel ─────────────────────────────────────────── */

interface ThinkingStreamPanelProps {
  events: ThinkingEvent[];
  status: StreamStatus;
  errorMessage: string | null;
  onStart: () => void;
  onReset: () => void;
}

export function ThinkingStreamPanel({
  events,
  status,
  errorMessage,
  onStart,
  onReset,
}: ThinkingStreamPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const isIdle = status === "idle";
  const isRunning = status === "connecting" || status === "streaming";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-borderGray bg-pureWhite shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderGray px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rausch/10">
            <MessageSquare size={18} className="text-rausch" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold tracking-tight text-nearBlack">
              Agent Thinking Stream
            </h3>
            <p className="text-[12px] text-secondaryGray">
              {isIdle
                ? "Start a run to observe real-time reasoning"
                : `${events.length} events received`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} />
          {(status === "completed" || status === "error") && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 rounded border border-borderGray px-3 py-1.5 text-[12px] font-semibold text-secondaryGray transition-colors hover:bg-lightSurface hover:text-nearBlack"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {isIdle ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-10">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lightSurface">
              <BrainCircuit size={36} className="text-secondaryGray" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-rausch text-pureWhite shadow-sm">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold tracking-tight text-nearBlack">
              Real-Time Agent Reasoning
            </p>
            <p className="mt-1.5 max-w-sm text-[14px] text-secondaryGray">
              Watch risk, demand, inventory, and planner agents analyze signals
              and build an optimized action package live.
            </p>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-2 rounded bg-rausch px-6 py-3 text-[14px] font-bold text-pureWhite shadow-sm transition-all hover:shadow-hover hover:brightness-110 active:scale-[0.98]"
          >
            <Play size={16} />
            Start Streaming Run
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-y-auto p-6"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Timeline connector line */}
          <div className="absolute bottom-6 left-[31px] top-6 w-[2px] bg-borderGray/50" />

          <div className="relative space-y-4">
            {events.map((event, idx) => (
              <ThinkingEventRow
                key={`${event.sequence}-${idx}`}
                event={event}
                isLatest={idx === events.length - 1 && status === "streaming"}
              />
            ))}

            {/* Streaming indicator at bottom */}
            {isRunning && (
              <div className="flex items-center gap-4 pl-1">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-rausch" />
                </div>
                <span className="text-[13px] font-medium text-secondaryGray animate-pulse">
                  {status === "connecting"
                    ? "Connecting to agent pipeline..."
                    : "Waiting for next reasoning step..."}
                </span>
              </div>
            )}
          </div>

          {/* Error banner */}
          {status === "error" && errorMessage && (
            <div className="mt-4 rounded-[14px] border border-errorRed/20 bg-errorRed/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-errorRed" />
                <div>
                  <p className="text-[14px] font-semibold text-errorRed">
                    Stream interrupted
                  </p>
                  <p className="mt-1 text-[13px] text-errorRed/80">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

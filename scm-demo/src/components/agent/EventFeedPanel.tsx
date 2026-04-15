import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, RadioTower } from "lucide-react";

import type { EventView } from "../../lib/types";
import {
  formatDateTime,
  humanizeEntityId,
  humanizeEvent,
  humanizeLabel,
  severitySummary,
} from "../../lib/presenters";
import { snapshotEntries } from "./AgentShared";

interface EventFeedPanelProps {
  events: EventView[];
  currentEvent?: EventView | null;
}

function eventRank(event: EventView, currentEventId?: string | null): number {
  if (event.event_id === currentEventId) return -1;
  const tone = eventToneFromSeverity(event);
  if (tone === "critical") return 0;
  if (event.severity >= 0.8) return 1;
  if (tone === "warning") return 2;
  return 3;
}

function eventToneFromSeverity(
  event: EventView,
): "critical" | "warning" | "neutral" {
  if (event.severity >= 0.8) return "critical";
  if (event.severity >= 0.5) return "warning";
  return "neutral";
}

function eventScope(event: EventView): string {
  if (!event.entity_ids.length) return "Network-wide scope";
  const first = humanizeEntityId(event.entity_ids[0]);
  if (event.entity_ids.length === 1) return first;
  return `${first} +${event.entity_ids.length - 1}`;
}

function eventSurface(tone: string, selected: boolean): string {
  if (tone === "critical") {
    return selected
      ? "border-red-200/70 bg-red-50/70 shadow-card hover:bg-red-100/60"
      : "border-red-200/70 bg-red-50/70 hover:bg-red-100/60";
  }
  if (tone === "warning") {
    return selected
      ? "border-amber-300 bg-amber-50 shadow-card"
      : "border-amber-200/70 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-300";
  }
  return selected
    ? "border-nearBlack/20 bg-lightSurface shadow-card"
    : "border-borderGray bg-lightSurface/70 hover:bg-lightSurface hover:border-nearBlack/15";
}

function titleTone(tone: string): string {
  return tone === "critical" ? "text-gray-900" : "text-nearBlack";
}

function secondaryTone(tone: string): string {
  return tone === "critical" ? "text-gray-600" : "text-secondaryGray";
}

function timestampTone(tone: string): string {
  return tone === "critical" ? "text-gray-700" : "text-nearBlack/75";
}

export function EventFeedPanel({
  events,
  currentEvent,
}: EventFeedPanelProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    currentEvent?.event_id ?? events[0]?.event_id ?? null,
  );
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => {
    const nextSelectedId = currentEvent?.event_id ?? events[0]?.event_id ?? null;
    setSelectedEventId((previous) => {
      if (previous && events.some((item) => item.event_id === previous)) {
        return previous;
      }
      return nextSelectedId;
    });
  }, [currentEvent?.event_id, events]);

  const orderedEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        const rankDelta =
          eventRank(left, currentEvent?.event_id) -
          eventRank(right, currentEvent?.event_id);
        if (rankDelta !== 0) return rankDelta;
        return right.detected_at.localeCompare(left.detected_at);
      }),
    [currentEvent?.event_id, events],
  );

  const selectedEvent =
    orderedEvents.find((item) => item.event_id === selectedEventId) ??
    currentEvent ??
    null;

  return (
    <section className="rounded-[24px] border border-borderGray bg-pureWhite p-4 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[17px] font-bold text-nearBlack">Event Feed</h3>
          <p className="mt-1 text-[12px] text-secondaryGray">
            Compact live signal queue with detail on demand.
          </p>
        </div>
        <div className="rounded-full border border-borderGray bg-lightSurface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
          {events.length} signals
        </div>
      </div>

      {orderedEvents.length === 0 ? (
        <div className="mt-4 rounded-card border border-green-200 bg-green-50 px-4 py-4 text-[13px] text-green-700">
          No active disruptions are in the queue. The network is operating without a live escalation signal.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-[18px] border border-borderGray bg-lightSurface/60 p-2">
            <div className="mb-2 flex items-center justify-between gap-3 px-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-secondaryGray">
                Live signals
              </div>
              {selectedEvent ? (
                <button
                  type="button"
                  onClick={() => setDetailsExpanded((current) => !current)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-borderGray bg-pureWhite px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
                >
                  {detailsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {detailsExpanded ? "Hide details" : "View details"}
                </button>
              ) : null}
            </div>

            <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {orderedEvents.map((event) => {
                const tone = eventToneFromSeverity(event);
                const isSelected = event.event_id === selectedEvent?.event_id;
                const isPrimary = event.event_id === currentEvent?.event_id;

                return (
                  <button
                    key={event.event_id}
                    type="button"
                    onClick={() => {
                      setSelectedEventId(event.event_id);
                      setDetailsExpanded(true);
                    }}
                    className={`w-full rounded-[16px] border px-3 py-2.5 text-left transition-all ${eventSurface(
                      tone,
                      isSelected,
                    )}`}
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor:
                        tone === "critical"
                          ? "#f87171"
                          : tone === "warning"
                            ? "#b45309"
                            : "#d4d4d8",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            tone === "critical"
                              ? "border border-red-200 bg-red-100 text-red-700"
                              : tone === "warning"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-pureWhite text-secondaryGray"
                          }`}
                        >
                          {severitySummary(event.severity)}
                        </span>
                        {isPrimary ? (
                          <span
                            className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-700"
                          >
                            Active
                          </span>
                        ) : null}
                      </div>
                      <span className={`text-[10px] ${timestampTone(tone)}`}>
                        {formatDateTime(event.detected_at)}
                      </span>
                    </div>

                    <div className={`mt-2 text-[14px] font-semibold leading-tight ${titleTone(tone)}`}>
                      {humanizeEvent(event.type)}
                    </div>

                    <div className={`mt-1 flex flex-wrap items-center gap-2 text-[11px] ${secondaryTone(tone)}`}>
                      <span>{humanizeLabel(event.source)}</span>
                      <span>•</span>
                      <span>{eventScope(event)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {detailsExpanded && selectedEvent ? (
            <div className="rounded-[18px] border border-borderGray bg-lightSurface p-3">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-pureWhite p-2 shadow-sm">
                      <RadioTower className="h-4 w-4 text-rausch" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                        Selected signal
                      </div>
                      <h4 className="mt-1 text-[17px] font-bold text-nearBlack">
                        {humanizeEvent(selectedEvent.type)}
                      </h4>
                      <p className="mt-1 text-[13px] leading-5 text-secondaryGray">
                        {selectedEvent.entity_ids.length
                          ? `${humanizeLabel(selectedEvent.source)} reported this signal across ${selectedEvent.entity_ids.length} tracked entity${selectedEvent.entity_ids.length > 1 ? "ies" : ""}.`
                          : `${humanizeLabel(selectedEvent.source)} reported a network-wide signal.`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsExpanded(false)}
                    className="shrink-0 rounded-xl border border-borderGray bg-pureWhite px-3 py-1.5 text-[11px] font-bold text-secondaryGray hover:bg-lightSurface"
                  >
                    Collapse
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                  <div className="rounded-card border border-borderGray bg-pureWhite px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
                      Severity
                    </div>
                    <div className="mt-1 text-[14px] font-bold text-nearBlack">
                      {severitySummary(selectedEvent.severity)}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-pureWhite px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
                      Source
                    </div>
                    <div className="mt-1 text-[14px] font-bold text-nearBlack">
                      {humanizeLabel(selectedEvent.source)}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-pureWhite px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
                      Trigger time
                    </div>
                    <div className="mt-1 text-[13px] font-bold text-nearBlack">
                      {formatDateTime(selectedEvent.detected_at)}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-pureWhite px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
                      Scope
                    </div>
                    <div className="mt-1 text-[14px] font-bold text-nearBlack">
                      {eventScope(selectedEvent)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_0.95fr]">
                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
                      Affected entities
                    </div>
                    <div className="mt-2 flex max-h-[88px] flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                      {selectedEvent.entity_ids.length ? (
                        selectedEvent.entity_ids.map((entity) => (
                          <span
                            key={entity}
                            className="rounded-full border border-borderGray bg-lightSurface px-2.5 py-1 text-[11px] font-semibold text-nearBlack"
                          >
                            {humanizeEntityId(entity)}
                          </span>
                        ))
                      ) : (
                        <span className="text-[12px] text-secondaryGray">
                          Network-wide signal
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-secondaryGray">
                      Signal payload
                    </div>
                    {snapshotEntries(selectedEvent.payload).length ? (
                      <div className="mt-2 max-h-[112px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                        {snapshotEntries(selectedEvent.payload)
                          .slice(0, 4)
                          .map(([label, value]) => (
                            <div
                              key={`${label}-${value}`}
                              className="flex items-center justify-between gap-3 rounded-card border border-borderGray bg-lightSurface px-3 py-2 text-[11px]"
                            >
                              <span className="font-medium text-secondaryGray">
                                {label}
                              </span>
                              <span className="font-semibold text-nearBlack">
                                {value}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2 rounded-card border border-borderGray bg-lightSurface px-3 py-3 text-[12px] text-secondaryGray">
                        <AlertCircle className="h-4 w-4" />
                        No structured payload details recorded.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

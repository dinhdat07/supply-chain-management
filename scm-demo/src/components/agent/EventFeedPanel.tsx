import { useEffect, useState } from "react";
import { AlertCircle, RadioTower } from "lucide-react";

import type { EventView } from "../../lib/types";
import {
  formatDateTime,
  humanizeEntityId,
  humanizeEvent,
  humanizeLabel,
  severityTone,
  severitySummary,
} from "../../lib/presenters";
import { eventSummary, snapshotEntries } from "./AgentShared";

interface EventFeedPanelProps {
  events: EventView[];
  currentEvent?: EventView | null;
}

export function EventFeedPanel({
  events,
  currentEvent,
}: EventFeedPanelProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    currentEvent?.event_id ?? events[0]?.event_id ?? null,
  );

  useEffect(() => {
    const nextSelectedId = currentEvent?.event_id ?? events[0]?.event_id ?? null;
    setSelectedEventId((previous) => {
      if (previous && events.some((item) => item.event_id === previous)) {
        return previous;
      }
      return nextSelectedId;
    });
  }, [currentEvent?.event_id, events]);

  const selectedEvent =
    events.find((item) => item.event_id === selectedEventId) ??
    currentEvent ??
    null;

  return (
    <section className="rounded-[24px] border border-borderGray bg-pureWhite p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-bold text-nearBlack">Event Feed</h3>
          <p className="mt-1 text-[12px] text-secondaryGray">
            High-signal monitoring strip for the live disruptions shaping this cycle.
          </p>
        </div>
        <div className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-secondaryGray">
          {events.length} signals
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-4 rounded-card border border-green-200 bg-green-50 px-5 py-5 text-[14px] text-green-700">
          No active disruptions are in the queue. The network is operating without a live escalation signal.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {events.slice(0, 6).map((event) => {
              const tone = severityTone(event.type);
              const isSelected = event.event_id === selectedEvent?.event_id;
              const isPrimary = event.event_id === currentEvent?.event_id;

              return (
                <button
                  key={event.event_id}
                  type="button"
                  onClick={() => setSelectedEventId(event.event_id)}
                  className={`min-w-[220px] max-w-[280px] shrink-0 rounded-[18px] border p-3 text-left transition-all ${
                    isSelected
                      ? "border-nearBlack bg-nearBlack text-pureWhite shadow-card"
                      : "border-borderGray bg-lightSurface hover:border-nearBlack/30 hover:bg-pureWhite"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                        isSelected
                          ? "bg-pureWhite/15 text-pureWhite"
                          : tone === "critical"
                            ? "bg-errorRed/10 text-errorRed"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {severitySummary(event.severity)}
                    </span>
                    {isPrimary ? (
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          isSelected
                            ? "bg-pureWhite/15 text-pureWhite"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        Active trigger
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-[15px] font-bold">
                    {humanizeEvent(event.type)}
                  </div>
                  <p
                    className={`mt-1 max-h-[2.9rem] overflow-hidden text-[12px] leading-5 ${
                      isSelected ? "text-pureWhite/80" : "text-secondaryGray"
                    }`}
                  >
                    {eventSummary(event)}
                  </p>
                  <div
                    className={`mt-2 text-[11px] ${
                      isSelected ? "text-pureWhite/75" : "text-secondaryGray"
                    }`}
                  >
                    {formatDateTime(event.detected_at)} from {humanizeLabel(event.source)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[20px] border border-borderGray bg-lightSurface p-4">
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-pureWhite p-3 shadow-sm">
                    <RadioTower className="h-5 w-5 text-rausch" />
                  </div>
                  <div>
                    <div className="text-[12px] uppercase tracking-wider text-secondaryGray">
                      Active signal detail
                    </div>
                    <h4 className="mt-1 text-[18px] font-bold text-nearBlack">
                      {humanizeEvent(selectedEvent.type)}
                    </h4>
                    <p className="mt-1 text-[13px] text-secondaryGray">
                      {eventSummary(selectedEvent)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                      Severity
                    </div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {severitySummary(selectedEvent.severity)}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                      Source
                    </div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {humanizeLabel(selectedEvent.source)}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                      Trigger time
                    </div>
                    <div className="mt-2 text-[14px] font-bold text-nearBlack">
                      {formatDateTime(selectedEvent.detected_at)}
                    </div>
                  </div>
                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                      Scope
                    </div>
                    <div className="mt-2 text-[16px] font-bold text-nearBlack">
                      {selectedEvent.entity_ids.length || "Network"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                    <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                      Affected scope
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedEvent.entity_ids.length ? (
                        selectedEvent.entity_ids.map((entity) => (
                          <span
                            key={entity}
                            className="rounded-full border border-borderGray bg-lightSurface px-3 py-2 text-[12px] font-semibold text-nearBlack"
                          >
                            {humanizeEntityId(entity)}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-secondaryGray">
                          Network-wide signal
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-card border border-borderGray bg-pureWhite px-4 py-4">
                    <div className="text-[11px] uppercase tracking-wider text-secondaryGray">
                      Signal payload
                    </div>
                    {snapshotEntries(selectedEvent.payload).length ? (
                      <div className="mt-3 grid gap-2 text-[12px] text-secondaryGray">
                        {snapshotEntries(selectedEvent.payload)
                          .slice(0, 4)
                          .map(([label, value]) => (
                            <div
                              key={`${label}-${value}`}
                              className="flex items-center justify-between gap-3 rounded-card border border-borderGray bg-lightSurface px-3 py-2"
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
                      <div className="mt-3 flex items-center gap-2 rounded-card border border-borderGray bg-lightSurface px-3 py-3 text-[13px] text-secondaryGray">
                        <AlertCircle className="h-4 w-4" />
                        No structured payload details were recorded for this signal.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThinkingEvent } from "../lib/types";
import { triggerStreamingPlan, triggerStreamingScenario } from "../lib/api";

export type StreamStatus = "idle" | "connecting" | "streaming" | "completed" | "error";

export interface UseThinkingStreamReturn {
  /** All events received so far, ordered by sequence */
  events: ThinkingEvent[];
  /** Current connection state */
  status: StreamStatus;
  /** Human-readable error message if status is 'error' */
  errorMessage: string | null;
  /** The run_id returned by the trigger endpoint */
  runId: string | null;
  /** Latest full trace view from the backend */
  trace: any | null;
  /** Start a new streaming run – triggers POST then opens WebSocket */
  start: (scenarioName?: string) => Promise<void>;
  /** Clear all events and reset state to idle */
  reset: () => void;
}

export function useThinkingStream(): UseThinkingStreamReturn {
  const [events, setEvents] = useState<ThinkingEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [trace, setTrace] = useState<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Queue to pace incoming bursty events for smooth UI rendering
  const queueRef = useRef<{ event?: ThinkingEvent; trace?: any }[]>([]);
  const pendingStatusRef = useRef<StreamStatus | null>(null);

  // Drain the queue at a smooth, constant pace
  useEffect(() => {
    const timer = setInterval(() => {
      if (queueRef.current.length > 0) {
        const payload = queueRef.current.shift();
        if (payload?.event) {
          // Because event is inside payload, we know it exists here
          setEvents((prev) => [...prev, payload.event as ThinkingEvent]);
        }
        if (payload?.trace) {
          setTrace(payload.trace);
        }
      } else if (pendingStatusRef.current) {
        setStatus(pendingStatusRef.current);
        pendingStatusRef.current = null;
      }
    }, 850);

    return () => clearInterval(timer);
  }, []);

  // Close WebSocket on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const start = useCallback(async (scenarioName?: string) => {
    // Close any existing connection
    wsRef.current?.close();
    queueRef.current = [];
    pendingStatusRef.current = null;
    setEvents([]);
    setErrorMessage(null);
    setStatus("connecting");

    try {
      // Step 1: Trigger orchestration
      let run_id: string;
      if (scenarioName) {
        const res = await triggerStreamingScenario(scenarioName as any);
        run_id = res.run_id;
      } else {
        const res = await triggerStreamingPlan();
        run_id = res.run_id;
      }
      setRunId(run_id);

      // Step 2: Open WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/thinking/${run_id}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("streaming");
      };

      ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);

          // Support both wrapped { event, trace } and bare ThinkingEvent
          const event: ThinkingEvent = payload.event ?? payload;
          const traceUpdate = payload.trace;

          if (event && event.type && event.agent) {
            queueRef.current.push({ event, trace: traceUpdate });
          } else if (traceUpdate) {
            queueRef.current.push({ trace: traceUpdate });
          }

          if (event?.type === "final") {
            pendingStatusRef.current = "completed";
          }
          if (event?.type === "error") {
            pendingStatusRef.current = "error";
            setErrorMessage(event.message);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        setStatus("error");
        setErrorMessage("WebSocket connection lost.");
      };

      ws.onclose = () => {
        // Only move to 'completed' if we were still streaming
        setStatus((prev) => (prev === "streaming" ? "completed" : prev));
      };
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to start streaming plan.",
      );
    }
  }, []);

  const reset = useCallback(() => {
    wsRef.current?.close();
    queueRef.current = [];
    pendingStatusRef.current = null;
    setEvents([]);
    setStatus("idle");
    setErrorMessage(null);
    setRunId(null);
    setTrace(null);
  }, []);

  return { events, status, errorMessage, runId, trace, start, reset };
}

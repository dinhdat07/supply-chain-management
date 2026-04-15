import { useCallback, useEffect, useRef, useState } from "react";
import type { ThinkingEvent } from "../lib/types";
import { triggerStreamingPlan } from "../lib/api";

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
  /** Start a new streaming run – triggers POST then opens WebSocket */
  start: () => Promise<void>;
  /** Clear all events and reset state to idle */
  reset: () => void;
}

export function useThinkingStream(): UseThinkingStreamReturn {
  const [events, setEvents] = useState<ThinkingEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Close WebSocket on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const start = useCallback(async () => {
    // Close any existing connection
    wsRef.current?.close();
    setEvents([]);
    setErrorMessage(null);
    setStatus("connecting");

    try {
      // Step 1: Trigger orchestration
      const { run_id } = await triggerStreamingPlan();
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
          const event: ThinkingEvent = JSON.parse(msg.data);
          setEvents((prev) => [...prev, event]);

          if (event.type === "final") {
            setStatus("completed");
          }
          if (event.type === "error") {
            setStatus("error");
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
    setEvents([]);
    setStatus("idle");
    setErrorMessage(null);
    setRunId(null);
  }, []);

  return { events, status, errorMessage, runId, start, reset };
}

# Frontend Real-Time Streaming Guide

## Overview

Hướng dẫn này giúp Frontend developers integrate real-time streaming của ChainCopilot API vào ứng dụng. Hệ thống sử dụng HTTP POST + WebSocket để stream real-time thinking steps của các agents.

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend UI                                                     │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 1. Click "Run Plan" Button                               │   │
│ └──────────────────────┬───────────────────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 2. HTTP POST /api/v1/plan/daily/stream                   │   │
│ │    Response: { run_id, ws_url }                          │   │
│ └──────────────────────┬───────────────────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 3. WebSocket Connect: /api/v1/ws/thinking/{run_id}       │   │
│ │    Receive streaming ThinkingEvents in real-time        │   │
│ └──────────────────────┬───────────────────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 4. Update UI with each event                             │   │
│ │    - Show agent thinking steps                           │   │
│ │    - Display progress                                    │   │
│ │    - Update results                                      │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Trigger Daily Plan Stream

### HTTP Endpoint
```
POST /api/v1/plan/daily/stream
```

### Request
```bash
curl -X POST http://localhost:8000/api/v1/plan/daily/stream
```

### Response (200 OK)
```json
{
  "run_id": "run_99b7d5b9",
  "ws_url": "/ws/thinking/run_99b7d5b9"
}
```

### Frontend Implementation (React + TypeScript)

```typescript
// hooks/useDailyPlan.ts
import { useState, useCallback } from 'react';

interface PlanStreamResponse {
  run_id: string;
  ws_url: string;
}

export const useDailyPlan = () => {
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerPlanStream = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/plan/daily/stream',
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PlanStreamResponse = await response.json();
      setRunId(data.run_id);
      
      return data.run_id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to trigger plan stream:', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { runId, loading, error, triggerPlanStream };
};
```

---

## Step 2: Connect WebSocket & Stream Events

### WebSocket Endpoint
```
WS /api/v1/ws/thinking/{run_id}
```

### ThinkingEvent Schema
```typescript
interface ThinkingEvent {
  type: 'start' | 'analysis' | 'thinking' | 'decision' | 'action' 
        | 'observation' | 'reflection' | 'final' | 'error';
  agent: 'risk' | 'demand' | 'inventory' | 'supplier' | 'logistics' 
         | 'planner' | 'critic' | 'system';
  step: string;
  message: string;
  data: Record<string, any>;
  sequence: number;
  run_id: string;
}
```

### Frontend Implementation (React Hook)

```typescript
// hooks/useThinkingStream.ts
import { useEffect, useState, useCallback, useRef } from 'react';

interface StreamState {
  events: ThinkingEvent[];
  isConnected: boolean;
  isStreamComplete: boolean;
  error: string | null;
}

export const useThinkingStream = (runId: string | null) => {
  const [state, setState] = useState<StreamState>({
    events: [],
    isConnected: false,
    isStreamComplete: false,
    error: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);

  const connectStream = useCallback(() => {
    if (!runId) {
      setState(prev => ({ ...prev, error: 'No run_id provided' }));
      return;
    }

    const wsUrl = `ws://localhost:8000/api/v1/ws/thinking/${runId}`;
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          events: [], // Reset events on new connection
        }));
      };

      ws.onmessage = (event) => {
        try {
          const thinkingEvent: ThinkingEvent = JSON.parse(event.data);
          
          console.log(
            `[${thinkingEvent.sequence}] ${thinkingEvent.agent.toUpperCase()} > ${thinkingEvent.step}:`,
            thinkingEvent.message
          );

          setState(prev => ({
            ...prev,
            events: [...prev.events, thinkingEvent],
            isStreamComplete: thinkingEvent.type === 'final',
          }));
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        const errorMsg = err instanceof Event 
          ? 'WebSocket error occurred'
          : String(err);
        setState(prev => ({
          ...prev,
          error: errorMsg,
          isConnected: false,
        }));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        error: message,
        isConnected: false,
      }));
    }
  }, [runId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connectStream,
    disconnect,
  };
};
```

---

## Step 3: UI Component Example

### React Component

```typescript
// components/DailyPlanStream.tsx
import { useEffect } from 'react';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { useThinkingStream } from '../hooks/useThinkingStream';
import { ThinkingEvent } from '../types';

export const DailyPlanStream: React.FC = () => {
  const { runId, loading, error: triggerError, triggerPlanStream } = useDailyPlan();
  const { 
    events, 
    isConnected, 
    isStreamComplete, 
    error: streamError,
    connectStream,
  } = useThinkingStream(runId);

  useEffect(() => {
    if (runId) {
      connectStream();
    }
  }, [runId, connectStream]);

  const handleStartPlan = async () => {
    const newRunId = await triggerPlanStream();
    if (newRunId) {
      console.log('Plan triggered with run_id:', newRunId);
    }
  };

  return (
    <div className="daily-plan-stream">
      <div className="controls">
        <button 
          onClick={handleStartPlan}
          disabled={loading || isConnected}
        >
          {loading ? 'Starting...' : 'Start Daily Plan'}
        </button>
      </div>

      {(triggerError || streamError) && (
        <div className="error-banner">
          <p>❌ {triggerError || streamError}</p>
        </div>
      )}

      {runId && (
        <div className="stream-info">
          <p>Run ID: <code>{runId}</code></p>
          <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
          {isStreamComplete && <p>✅ Stream Complete</p>}
        </div>
      )}

      <div className="thinking-log">
        <h3>Thinking Steps ({events.length})</h3>
        <div className="log-container">
          {events.map((event, idx) => (
            <ThinkingEventRow 
              key={`${event.run_id}-${event.sequence}`}
              event={event}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Render individual thinking event
const ThinkingEventRow: React.FC<{ event: ThinkingEvent; index: number }> = ({
  event,
  index,
}) => {
  const agentColors: Record<string, string> = {
    risk: '#FF6B6B',
    demand: '#4ECDC4',
    inventory: '#45B7D1',
    supplier: '#FFA07A',
    logistics: '#98D8C8',
    planner: '#6C5CE7',
    critic: '#A29BFE',
    system: '#636E72',
  };

  const typeEmojis: Record<string, string> = {
    start: '▶️',
    analysis: '🔍',
    thinking: '💭',
    decision: '🎯',
    action: '⚡',
    observation: '👁️',
    reflection: '🤔',
    final: '✅',
    error: '❌',
  };

  return (
    <div className="event-row" style={{ borderLeftColor: agentColors[event.agent] }}>
      <div className="event-header">
        <span className="sequence">{event.sequence}</span>
        <span className="type">{typeEmojis[event.type]} {event.type}</span>
        <span className="agent" style={{ color: agentColors[event.agent] }}>
          {event.agent.toUpperCase()}
        </span>
        <span className="step">{event.step}</span>
      </div>
      
      <div className="event-message">
        <p>{event.message}</p>
      </div>

      {Object.keys(event.data).length > 0 && (
        <div className="event-data">
          <details>
            <summary>View Details</summary>
            <pre>{JSON.stringify(event.data, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};
```

### CSS Styling

```css
/* styles/DailyPlanStream.css */
.daily-plan-stream {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 10px 20px;
  background-color: #6C5CE7;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.controls button:hover:not(:disabled) {
  background-color: #5F3DC4;
}

.controls button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  background-color: #FFE5E5;
  color: #C92A2A;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #C92A2A;
}

.stream-info {
  background-color: #E7F5FF;
  color: #1971C2;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #1971C2;
}

.stream-info code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.thinking-log {
  margin-top: 30px;
}

.thinking-log h3 {
  margin-bottom: 15px;
  color: #2C3E50;
}

.log-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 600px;
  overflow-y: auto;
}

.event-row {
  background-color: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-left: 4px solid #6C5CE7;
  border-radius: 6px;
  padding: 12px;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.event-row:hover {
  background-color: #F1F3F5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.sequence {
  background-color: #F0F0F0;
  padding: 2px 8px;
  border-radius: 3px;
  min-width: 30px;
  text-align: center;
}

.type {
  font-size: 14px;
}

.agent {
  padding: 2px 8px;
  border-radius: 3px;
  background-color: rgba(108, 92, 231, 0.1);
  font-size: 11px;
}

.step {
  color: #495057;
  font-style: italic;
}

.event-message {
  margin: 10px 0;
  color: #2C3E50;
  line-height: 1.5;
}

.event-message p {
  margin: 0;
}

.event-data {
  margin-top: 10px;
}

.event-data details {
  cursor: pointer;
}

.event-data summary {
  color: #1971C2;
  font-size: 12px;
  font-weight: 600;
  padding: 5px;
}

.event-data pre {
  background-color: #F8F9FA;
  padding: 10px;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #DEE2E6;
  margin: 10px 0 0 0;
}
```

---

## Step 4: Error Handling & Reconnection

```typescript
// hooks/useThinkingStreamWithRetry.ts
import { useCallback, useRef } from 'react';
import { useThinkingStream } from './useThinkingStream';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

export const useThinkingStreamWithRetry = (runId: string | null) => {
  const stream = useThinkingStream(runId);
  const retriesRef = useRef(0);

  const connectWithRetry = useCallback(async () => {
    try {
      retriesRef.current = 0;
      stream.connectStream();
    } catch (err) {
      console.error('Initial connection failed:', err);
      attemptRetry();
    }
  }, [stream]);

  const attemptRetry = useCallback(() => {
    if (retriesRef.current < MAX_RETRIES) {
      retriesRef.current += 1;
      const delay = RETRY_DELAY * retriesRef.current;
      
      console.log(`Retrying connection (${retriesRef.current}/${MAX_RETRIES}) after ${delay}ms...`);
      
      setTimeout(() => {
        stream.connectStream();
      }, delay);
    } else {
      console.error('Max retries exceeded');
    }
  }, [stream]);

  return {
    ...stream,
    connectWithRetry,
  };
};
```

---

## Step 5: Event Types & Data Structures

### Agent Types
- `risk`: Risk analysis agent
- `demand`: Demand forecasting agent
- `inventory`: Inventory management agent
- `supplier`: Supplier evaluation agent
- `logistics`: Logistics optimization agent
- `planner`: Plan generation agent
- `critic`: Plan evaluation & criticism agent
- `system`: System-level events

### Event Types
- `start`: Process initialization
- `analysis`: Data analysis
- `thinking`: Reasoning process
- `decision`: Decision making
- `action`: Performing action
- `observation`: Receiving results
- `reflection`: Evaluation
- `final`: Process complete
- `error`: Error occurred

### Example Events

**Risk Analysis Event:**
```json
{
  "type": "analysis",
  "agent": "risk",
  "step": "evaluate_supplier_risk",
  "message": "Evaluating supplier SUP_A with compliance score 0.95",
  "data": {
    "supplier_id": "SUP_A",
    "compliance_score": 0.95,
    "risk_level": "low"
  },
  "sequence": 1,
  "run_id": "run_99b7d5b9"
}
```

**Planner Decision Event:**
```json
{
  "type": "decision",
  "agent": "planner",
  "step": "strategy_selection",
  "message": "Selected 'balanced' strategy prioritizing service level",
  "data": {
    "strategy": "balanced",
    "rationale": "Best trade-off between cost and service level",
    "selected_actions": 9,
    "estimated_cost_delta": 15000
  },
  "sequence": 15,
  "run_id": "run_99b7d5b9"
}
```

---

## Step 6: Testing & Debugging

### Browser DevTools WebSocket Inspector
```javascript
// Open browser console and run:
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/thinking/run_99b7d5b9');

ws.onmessage = (e) => {
  const event = JSON.parse(e.data);
  console.table({
    seq: event.sequence,
    type: event.type,
    agent: event.agent,
    step: event.step,
    message: event.message,
  });
};
```

### Network Tab
- Monitor WebSocket frames in Chrome DevTools Network tab
- Filter by "WS" to see WebSocket connections
- Inspect individual frames to see event payloads

### Console Logging
```typescript
// Add detailed logging
const connectStream = useCallback(() => {
  if (!runId) return;
  
  const wsUrl = `ws://localhost:8000/api/v1/ws/thinking/${runId}`;
  console.group('🔌 WebSocket Connection');
  console.log('URL:', wsUrl);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();

  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const thinkingEvent = JSON.parse(event.data);
    console.log(
      `%c[${thinkingEvent.sequence}] ${thinkingEvent.agent.toUpperCase()}`,
      `color: #6C5CE7; font-weight: bold;`,
      `> ${thinkingEvent.step}:`,
      thinkingEvent.message
    );
  };
}, [runId]);
```

---

## Best Practices

### 1. Cleanup & Resource Management
```typescript
// Always cleanup WebSocket on unmount
useEffect(() => {
  return () => {
    disconnect();
  };
}, [disconnect]);
```

### 2. Large Event Lists
```typescript
// For large number of events, consider windowing
const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

const handleScroll = (e) => {
  const container = e.currentTarget;
  const scrollRatio = container.scrollTop / (container.scrollHeight - container.clientHeight);
  
  if (scrollRatio > 0.8) {
    setVisibleRange(prev => ({
      ...prev,
      end: Math.min(prev.end + 20, events.length)
    }));
  }
};
```

### 3. Error Recovery
- Implement exponential backoff for reconnection attempts
- Cache events to prevent data loss on disconnect
- Show user-friendly error messages
- Provide manual retry button

### 4. Performance
- Use `React.memo` for event row components
- Debounce state updates for high-frequency events
- Use virtual scrolling for large event lists
- Avoid re-rendering entire list on each event

### 5. Accessibility
```typescript
// Add ARIA labels and roles
<div 
  role="log"
  aria-live="polite"
  aria-label="Real-time thinking steps"
>
  {/* Events */}
</div>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| HTTP 404 on WebSocket | Check WebSocket URL includes `/api/v1` prefix |
| Connection failed | Ensure uvicorn server is running on port 8000 |
| No events received | Check if run_id is valid, look for error events |
| Events stop streaming | Check browser console for errors, verify server is still running |
| Memory leak | Ensure disconnect() is called on component unmount |

---

## References

- [FastAPI WebSocket Documentation](https://fastapi.tiangolo.com/advanced/websockets/)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Hooks Best Practices](https://react.dev/reference/react)

---

**Last Updated:** April 15, 2026

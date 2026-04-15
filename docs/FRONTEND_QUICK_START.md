# Frontend Quick Start Guide

## 📋 Setup

### 1. Copy Hook Files
```bash
# Copy these to your project
src/hooks/useDailyPlan.ts
src/hooks/useThinkingStream.ts
src/hooks/useThinkingStreamWithRetry.ts
```

### 2. Copy Type Definitions
```bash
src/types/index.ts
```

### 3. Copy Component
```bash
src/components/DailyPlanStream/DailyPlanStream.tsx
src/components/DailyPlanStream/DailyPlanStream.css
```

### 4. Add to Your App
```typescript
// App.tsx
import { DailyPlanStream } from './components/DailyPlanStream';

function App() {
  return (
    <div className="app">
      <DailyPlanStream />
    </div>
  );
}
```

---

## 🚀 Configuration

### API Base URL
Update in hook or create config:

```typescript
// config/api.ts
export const API_CONFIG = {
  baseUrl: 'http://localhost:8000',
  wsProtocol: 'ws',
};

// In hooks:
const wsUrl = `${API_CONFIG.wsProtocol}://localhost:8000/api/v1/ws/thinking/${runId}`;
```

### For Production
```typescript
// config/api.ts
const isDev = process.env.NODE_ENV === 'development';

export const API_CONFIG = {
  baseUrl: isDev ? 'http://localhost:8000' : 'https://api.example.com',
  wsProtocol: isDev ? 'ws' : 'wss',
};
```

---

## 💻 Basic Usage

### Minimal Component
```typescript
import { useDailyPlan } from './hooks/useDailyPlan';
import { useThinkingStream } from './hooks/useThinkingStream';

export function BasicPlanner() {
  const { runId, triggerPlanStream } = useDailyPlan();
  const { events, isConnected } = useThinkingStream(runId);

  return (
    <div>
      <button onClick={triggerPlanStream}>Start Plan</button>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <div>
        {events.map(e => (
          <div key={e.sequence}>
            [{e.sequence}] {e.agent}: {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### With Status Tracking
```typescript
export function PlannerWithStatus() {
  const { runId, loading, error, triggerPlanStream } = useDailyPlan();
  const { events, isConnected, isStreamComplete } = useThinkingStream(runId);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div>
      <button 
        onClick={triggerPlanStream}
        disabled={loading || isStreamComplete}
      >
        {loading ? 'Loading...' : 'Start Plan'}
      </button>

      {runId && (
        <div>
          <p>Status: {isConnected ? '🟢' : '🔴'} {isStreamComplete ? '✅' : '⏳'}</p>
          <p>Events: {events.length}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Styling

### Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        agent: {
          risk: '#FF6B6B',
          demand: '#4ECDC4',
          inventory: '#45B7D1',
          supplier: '#FFA07A',
          logistics: '#98D8C8',
          planner: '#6C5CE7',
          critic: '#A29BFE',
          system: '#636E72',
        },
      },
    },
  },
};
```

### Styled Components
```typescript
import styled from 'styled-components';

const EventRow = styled.div`
  border-left: 4px solid ${props => props.color};
  padding: 12px;
  margin: 8px 0;
  background-color: #f8f9fa;
  border-radius: 6px;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;
```

---

## 📊 Advanced Features

### Real-time Filtering
```typescript
const [filter, setFilter] = useState<AgentType | 'all'>('all');

const filteredEvents = events.filter(e => 
  filter === 'all' ? true : e.agent === filter
);
```

### Event Search
```typescript
const [search, setSearch] = useState('');

const searchedEvents = events.filter(e =>
  e.message.toLowerCase().includes(search.toLowerCase()) ||
  e.step.toLowerCase().includes(search.toLowerCase())
);
```

### Export to JSON
```typescript
const exportEvents = () => {
  const data = JSON.stringify(events, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plan-${runId}.json`;
  a.click();
};
```

### Timeline View
```typescript
const timelineEvents = events.map((e, idx) => ({
  time: idx,
  label: e.agent,
  message: e.message,
}));
```

---

## 🔌 WebSocket Connection Handling

### Auto-Reconnect
```typescript
useEffect(() => {
  if (error && !isConnected) {
    const timer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      connectStream();
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [error, isConnected]);
```

### Connection Indicator
```typescript
const ConnectionStatus = () => {
  return (
    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className="indicator"></span>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
};
```

### Auto-scroll to Latest Event
```typescript
const scrollRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [events]);

return (
  <div className="events-container">
    {events.map(e => <EventRow key={e.sequence} event={e} />)}
    <div ref={scrollRef} />
  </div>
);
```

---

## 🧪 Testing

### Mock WebSocket for Tests
```typescript
// __mocks__/ws.ts
export class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.onopen?.(), 10);
  }

  send(data: string) {}
  close() {
    setTimeout(() => this.onclose?.(), 10);
  }
}

global.WebSocket = MockWebSocket as any;
```

### Test Hook
```typescript
import { renderHook, act } from '@testing-library/react';
import { useDailyPlan } from './useDailyPlan';

it('should trigger plan stream', async () => {
  const { result } = renderHook(() => useDailyPlan());

  act(() => {
    result.current.triggerPlanStream();
  });

  // Wait for async operation
  await new Promise(r => setTimeout(r, 100));

  expect(result.current.runId).toBeDefined();
});
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging
```typescript
// hooks/useThinkingStream.ts
const DEBUG = process.env.REACT_APP_DEBUG === 'true';

const log = (msg: string, data?: any) => {
  if (DEBUG) {
    console.log(`[ThinkingStream] ${msg}`, data);
  }
};
```

### Network Inspection
```typescript
// utilities/websocketDebugger.ts
export function installWebSocketDebugger() {
  const originalWebSocket = window.WebSocket;

  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, ...args: any[]) {
      console.log('[WebSocket] Connecting to:', url);
      super(url instanceof URL ? url.toString() : url, ...args);
    }
  } as any;
}
```

### State DevTools
```typescript
useEffect(() => {
  window.__THINKING_EVENTS__ = events;
  window.__STREAM_STATE__ = { isConnected, isStreamComplete, error };
}, [events, isConnected, isStreamComplete, error]);
```

---

## 📱 Mobile Responsiveness

```css
@media (max-width: 768px) {
  .daily-plan-stream {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    margin-bottom: 20px;
  }

  .event-header {
    flex-wrap: wrap;
  }

  .event-data {
    font-size: 11px;
  }
}
```

---

## 🔐 Security Considerations

1. **HTTPS/WSS in Production**
   - Use `wss://` instead of `ws://`
   - Update API base URL to HTTPS

2. **CORS Configuration**
   - Backend already allows CORS (`allow_origins=["*"]`)
   - For production, restrict to specific origins

3. **Authentication**
   - Add Bearer token to headers if needed
   - Update `fetch` calls with auth headers

---

## 🚦 Performance Optimization

### Virtual Scrolling
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={events.length}
  itemSize={100}
  width="100%"
>
  {EventRow}
</FixedSizeList>
```

### Memoization
```typescript
const ThinkingEventRow = React.memo(({ event }: { event: ThinkingEvent }) => {
  return <div>{event.message}</div>;
});
```

### Lazy Loading Events
```typescript
const [displayLimit, setDisplayLimit] = useState(50);
const displayedEvents = events.slice(0, displayLimit);

const loadMore = () => setDisplayLimit(prev => prev + 50);
```

---

## 📚 Resources

- [FastAPI WebSocket Docs](https://fastapi.tiangolo.com/advanced/websockets/)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Window (Virtual Scrolling)](https://github.com/bvaughn/react-window)

---

**Questions?** Check the main [FRONTEND_REALTIME_STREAMING_GUIDE.md](./FRONTEND_REALTIME_STREAMING_GUIDE.md)

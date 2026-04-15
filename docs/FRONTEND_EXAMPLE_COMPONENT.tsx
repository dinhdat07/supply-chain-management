// Example: Complete Frontend Implementation
// File: src/components/DailyPlanStream/DailyPlanStream.tsx

import React, { useEffect, useState } from 'react';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useThinkingStreamWithRetry } from '../../hooks/useThinkingStreamWithRetry';
import { ThinkingEvent } from '../../types';
import './DailyPlanStream.css';

interface Stats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByAgent: Record<string, number>;
}

export const DailyPlanStream: React.FC = () => {
  const { runId, loading, error: triggerError, triggerPlanStream } = useDailyPlan();
  const { 
    events, 
    isConnected, 
    isStreamComplete, 
    error: streamError,
    connectWithRetry,
  } = useThinkingStreamWithRetry(runId);

  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    eventsByType: {},
    eventsByAgent: {},
  });

  // Trigger stream on mount or when runId changes
  useEffect(() => {
    if (runId) {
      connectWithRetry();
    }
  }, [runId, connectWithRetry]);

  // Calculate stats
  useEffect(() => {
    const eventsByType: Record<string, number> = {};
    const eventsByAgent: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByAgent[event.agent] = (eventsByAgent[event.agent] || 0) + 1;
    });

    setStats({
      totalEvents: events.length,
      eventsByType,
      eventsByAgent,
    });
  }, [events]);

  const handleStartPlan = async () => {
    const newRunId = await triggerPlanStream();
    if (newRunId) {
      console.log('✅ Plan triggered with run_id:', newRunId);
    }
  };

  return (
    <div className="daily-plan-stream">
      {/* Header */}
      <div className="header">
        <h1>📊 Daily Supply Chain Plan</h1>
        <p>Real-time planning with multi-agent reasoning</p>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <button 
          className="btn btn-primary"
          onClick={handleStartPlan}
          disabled={loading || isStreamComplete}
        >
          {loading ? '⏳ Starting...' : isStreamComplete ? '✅ Complete' : '▶️ Start Plan'}
        </button>

        {runId && !isStreamComplete && (
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            🔄 Reset
          </button>
        )}
      </div>

      {/* Error Messages */}
      {(triggerError || streamError) && (
        <div className="alert alert-error">
          <span>❌</span>
          <div className="alert-content">
            <strong>Error</strong>
            <p>{triggerError || streamError}</p>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {runId && (
        <div className="status-bar">
          <div className="status-item">
            <label>Run ID</label>
            <code>{runId}</code>
          </div>
          
          <div className="status-item">
            <label>Connection</label>
            <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>

          <div className="status-item">
            <label>Events</label>
            <span className="status-number">{stats.totalEvents}</span>
          </div>

          <div className="status-item">
            <label>Stream</label>
            {isStreamComplete && <span className="status-badge complete">✅ Complete</span>}
            {!isStreamComplete && isConnected && <span className="status-badge streaming">▶️ Streaming</span>}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="content">
        {/* Left Panel: Statistics */}
        <div className="sidebar">
          <div className="card">
            <h3>📈 Statistics</h3>
            
            <div className="stat-group">
              <h4>By Type</h4>
              <div className="stat-list">
                {Object.entries(stats.eventsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="stat-row">
                      <span className="stat-label">{type}</span>
                      <span className="stat-value">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="stat-group">
              <h4>By Agent</h4>
              <div className="stat-list">
                {Object.entries(stats.eventsByAgent)
                  .sort(([, a], [, b]) => b - a)
                  .map(([agent, count]) => (
                    <div key={agent} className="stat-row">
                      <span className="stat-label">{agent}</span>
                      <span className="stat-value">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Event Stream */}
        <div className="main-panel">
          <div className="card">
            <div className="card-header">
              <h3>🧠 Thinking Steps</h3>
              <span className="count">{stats.totalEvents} events</span>
            </div>

            {events.length === 0 && runId ? (
              <div className="empty-state">
                <p>👂 Listening for thinking steps...</p>
              </div>
            ) : (
              <div className="event-stream">
                {events.map((event) => (
                  <ThinkingEventRow 
                    key={`${event.run_id}-${event.sequence}`}
                    event={event}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual event row component
 */
const ThinkingEventRow: React.FC<{ event: ThinkingEvent }> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);

  const agentColors: Record<string, { color: string; bg: string }> = {
    risk: { color: '#FF6B6B', bg: '#FFE5E5' },
    demand: { color: '#4ECDC4', bg: '#E0F7F5' },
    inventory: { color: '#45B7D1', bg: '#E0F3FB' },
    supplier: { color: '#FFA07A', bg: '#FFE6DD' },
    logistics: { color: '#98D8C8', bg: '#E8F7F3' },
    planner: { color: '#6C5CE7', bg: '#F3F0FF' },
    critic: { color: '#A29BFE', bg: '#F5F3FF' },
    system: { color: '#636E72', bg: '#F0F0F0' },
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

  const colors = agentColors[event.agent] || { color: '#000', bg: '#f0f0f0' };
  const hasData = Object.keys(event.data).length > 0;

  return (
    <div 
      className="event-row"
      style={{ borderLeftColor: colors.color }}
    >
      <div className="event-header">
        <div className="event-meta">
          <span className="sequence">{event.sequence}</span>
          <span className="type">{typeEmojis[event.type]} {event.type}</span>
          <span 
            className="agent"
            style={{ 
              color: colors.color,
              backgroundColor: colors.bg,
            }}
          >
            {event.agent.toUpperCase()}
          </span>
          <span className="step">{event.step}</span>
        </div>
        {hasData && (
          <button
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      <div className="event-message">
        <p>{event.message}</p>
      </div>

      {expanded && hasData && (
        <div className="event-data">
          <div className="data-content">
            <pre>{JSON.stringify(event.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlanStream;

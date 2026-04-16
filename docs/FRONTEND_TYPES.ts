// Frontend Type Definitions
// File: src/types/index.ts

export type ThinkingEventType = 
  | 'start'       // Starting process
  | 'analysis'    // Analyzing data
  | 'thinking'    // Reasoning / Considering
  | 'decision'    // Making interim decision
  | 'action'      // Performing action (dispatch, apply)
  | 'observation' // Receiving results from agent / tool
  | 'reflection'  // Critic evaluating the plan
  | 'final'       // Final conclusion — trace complete
  | 'error';      // Unexpected system error

export type AgentType =
  | 'risk'
  | 'demand'
  | 'inventory'
  | 'supplier'
  | 'logistics'
  | 'planner'
  | 'critic'
  | 'system';

/**
 * Real-time thinking event streamed from backend via WebSocket
 */
export interface ThinkingEvent {
  /** Event type describing the nature of the step */
  type: ThinkingEventType;

  /** Agent name emitting the event */
  agent: AgentType;

  /** Short step name in snake_case */
  step: string;

  /** Human-readable description of the current task */
  message: string;

  /** Detailed metadata, agent-specific */
  data: Record<string, any>;

  /** Sequence number (unique per run) */
  sequence: number;

  /** Run ID associated with this event */
  run_id: string;
}

/**
 * Response from POST /api/v1/plan/daily/stream
 */
export interface PlanStreamResponse {
  /** Unique run identifier */
  run_id: string;

  /** WebSocket URL path (relative to host) */
  ws_url: string;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable?: boolean;
  correlation_id?: string;
}

/**
 * Stream state management
 */
export interface StreamState {
  events: ThinkingEvent[];
  isConnected: boolean;
  isStreamComplete: boolean;
  error: string | null;
}

/**
 * Hook return type for plan triggering
 */
export interface UseDailyPlanReturn {
  runId: string | null;
  loading: boolean;
  error: string | null;
  triggerPlanStream: () => Promise<string | null>;
}

/**
 * Hook return type for stream listening
 */
export interface UseThinkingStreamReturn extends StreamState {
  connectStream: () => void;
  disconnect: () => void;
}

/**
 * Common agent data structures
 */
export namespace AgentData {
  export interface RiskAnalysis {
    supplier_id: string;
    compliance_score: number;
    risk_level: 'low' | 'medium' | 'high';
    risk_factors?: string[];
  }

  export interface DemandForecast {
    sku: string;
    forecasted_demand: number;
    confidence_level: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
  }

  export interface InventoryStatus {
    sku: string;
    current_stock: number;
    reorder_point: number;
    projected_stock: number;
    stockout_risk: number;
  }

  export interface SupplierEvaluation {
    supplier_id: string;
    score: number;
    lead_time_days: number;
    cost_index: number;
    availability_percent: number;
  }

  export interface LogisticsRoute {
    route_id: string;
    origin: string;
    destination: string;
    distance_km: number;
    estimated_time_hours: number;
    closure_probability: number;
  }

  export interface PlanStrategy {
    strategy_label: string;
    action_ids: string[];
    rationale: string;
    estimated_cost: number;
    expected_service_level: number;
  }

  export interface CriticFinding {
    blind_spot?: string;
    brittle_assumption?: string;
    operational_caution?: string;
  }
}

/**
 * Configuration interface
 */
export interface StreamConfig {
  baseUrl: string;
  wsProtocol: 'ws' | 'wss';
  maxRetries: number;
  retryDelayMs: number;
  connectTimeoutMs: number;
  messageBufferSize: number;
}

/**
 * Socket event handlers (optional typing)
 */
export type StreamEventHandler = (event: ThinkingEvent) => void;
export type StreamErrorHandler = (error: string) => void;
export type StreamCompleteHandler = () => void;

export interface StreamHandlers {
  onEvent?: StreamEventHandler;
  onError?: StreamErrorHandler;
  onComplete?: StreamCompleteHandler;
}

/**
 * UI component props
 */
export interface DailyPlanStreamProps {
  onPlanStarted?: (runId: string) => void;
  onStreamComplete?: (events: ThinkingEvent[]) => void;
  onError?: (error: string) => void;
  showStats?: boolean;
  maxEventsDisplay?: number;
}

// Execution types for the 4 API groups

export interface DispatchReceiptItem {
  receipt_id: string;
  action_id: string;
  status: 'sent' | 'accepted' | 'rejected' | 'failed';
  detail: string;
}

export interface DispatchResponse {
  execution_id: string;
  plan_id: string;
  mode: 'commit' | 'dry_run';
  status: string;
  receipts: DispatchReceiptItem[];
  dispatched_at: string;
}

export interface ExecutionProgressView {
  execution_id: string;
  plan_id?: string | null;
  status: 'pending' | 'applied' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  dispatch_mode: 'commit' | 'dry_run';
  dry_run: boolean;
  target_system: string;
  action_ids: string[];
  progress_percentage: number;
  estimated_completion_at?: string | null;
  failure_reason?: string | null;
  compensation_hints?: string[] | null;
  receipts: DispatchReceiptItem[];
  status_history: Array<{ status: string; timestamp: string; reason: string }>;
  created_at: string;
  updated_at: string;
}

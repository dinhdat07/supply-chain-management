import { 
  AlertCircle, 
  BrainCircuit, 
  CheckCircle2, 
  PackageSearch, 
  RefreshCcw, 
  ShieldAlert, 
  TrendingUp, 
  Truck, 
  Users 
} from 'lucide-react';
import type { 
  EventView, 
  CandidateEvaluationView 
} from '../../lib/types';
import { 
  formatCurrency, 
  formatPercent, 
  humanizeEntityId, 
  humanizeEvent, 
  humanizeLabel, 
  humanizeStrategy, 
  severityTone 
} from '../../lib/presenters';

export type StageStatus = 'active' | 'complete' | 'pending';

export function modeTone(mode: string | null | undefined): string {
  const tone = severityTone(mode);
  if (tone === 'critical') return 'border-errorRed/20 bg-errorRed/10 text-errorRed';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-green-200 bg-green-50 text-green-700';
}

export function stageTone(status: StageStatus): string {
  if (status === 'active') return 'border-rausch bg-rausch/5 text-nearBlack shadow-card';
  if (status === 'complete') return 'border-green-200 bg-green-50 text-nearBlack';
  return 'border-borderGray bg-pureWhite text-secondaryGray';
}

export function tracePhase(agent: string | null | undefined): string {
  if (agent === 'risk' || agent === 'demand' || agent === 'inventory' || agent === 'supplier' || agent === 'logistics') {
    return 'Assess';
  }
  if (agent === 'planner' || agent === 'critic') {
    return 'Plan';
  }
  if (agent === 'approval' || agent === 'approval_resolution') {
    return 'Approve';
  }
  if (agent === 'execution') {
    return 'Execute';
  }
  if (agent === 'reflection') {
    return 'Learn';
  }
  return 'Monitor';
}

export function eventSummary(event: EventView | null | undefined): string {
  if (!event) return 'No disruption signal is active.';
  const affectedScope = event.entity_ids.length
    ? event.entity_ids.map((item) => humanizeEntityId(item)).join(', ')
    : 'the network';
  return `${humanizeEvent(event.type)} reported by ${humanizeLabel(event.source)} affecting ${affectedScope}`;
}

export function snapshotEntries(snapshot: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(snapshot)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      if (typeof value === 'number') {
        return [humanizeLabel(key), Number.isInteger(value) ? value.toString() : value.toFixed(2)];
      }
      if (Array.isArray(value)) {
        return [humanizeLabel(key), value.join(', ')];
      }
      return [humanizeLabel(key), String(value)];
    });
}

export function kpiRow(label: string, before: string, after: string, delta: string) {
  return (
    <div key={label} className="rounded-card border border-borderGray bg-lightSurface px-4 py-4 text-[13px] text-secondaryGray">
      <div className="font-semibold text-nearBlack">{label}</div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-secondaryGray">Before</div>
          <div className="mt-1 font-semibold text-nearBlack">{before}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-secondaryGray">Projected</div>
          <div className="mt-1 font-semibold text-nearBlack">{after}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-secondaryGray">Change</div>
          <div className="mt-1 font-semibold text-nearBlack">{delta}</div>
        </div>
      </div>
    </div>
  );
}

export function CandidatePlanCard({
  evaluation,
  selected,
}: {
  evaluation: CandidateEvaluationView;
  selected: boolean;
}) {
  return (
    <div className={`rounded-card border p-4 ${selected ? 'border-rausch bg-rausch/5' : 'border-borderGray bg-pureWhite'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-[16px] font-bold text-nearBlack">{humanizeStrategy(evaluation.strategy_label)}</h4>
          <p className="mt-1 text-[12px] uppercase tracking-wider text-secondaryGray">
            {selected ? 'Selected recommendation' : 'Alternative'}
          </p>
        </div>
        {selected ? (
          <span className="rounded-full bg-rausch px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-pureWhite">
            selected
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-secondaryGray">
        <div>Service <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.service_level)}</span></div>
        <div>Risk <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.disruption_risk)}</span></div>
        <div>Recovery <span className="font-semibold text-nearBlack">{formatPercent(evaluation.projected_kpis.recovery_speed)}</span></div>
        <div>Cost <span className="font-semibold text-nearBlack">{formatCurrency(evaluation.projected_kpis.total_cost)}</span></div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] text-secondaryGray sm:grid-cols-3">
        <div className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
          <div className="uppercase tracking-wider text-secondaryGray">Risk coverage</div>
          <div className="mt-1 font-semibold text-nearBlack">{formatPercent(evaluation.coverage_fraction)}</div>
        </div>
        <div className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
          <div className="uppercase tracking-wider text-secondaryGray">Critical SKUs covered</div>
          <div className="mt-1 font-semibold text-nearBlack">{evaluation.critical_covered}</div>
        </div>
        <div className="rounded-card border border-borderGray bg-lightSurface px-3 py-3">
          <div className="uppercase tracking-wider text-secondaryGray">Still at risk</div>
          <div className="mt-1 font-semibold text-nearBlack">{evaluation.unresolved_critical}</div>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-secondaryGray">{evaluation.rationale}</p>
    </div>
  );
}

export function agentVisual(agent: string | null | undefined): {
  Icon: typeof BrainCircuit;
  bubbleClass: string;
  accentClass: string;
  selectedClass: string;
} {
  switch (agent) {
    case 'demand':
      return {
        Icon: TrendingUp,
        bubbleClass: 'bg-blue-100 text-blue-600',
        accentClass: 'border-l-blue-500',
        selectedClass: 'border-blue-500 bg-blue-50',
      };
    case 'inventory':
      return {
        Icon: PackageSearch,
        bubbleClass: 'bg-orange-100 text-orange-600',
        accentClass: 'border-l-orange-500',
        selectedClass: 'border-orange-500 bg-orange-50',
      };
    case 'supplier':
      return {
        Icon: Users,
        bubbleClass: 'bg-purple-100 text-purple-600',
        accentClass: 'border-l-purple-500',
        selectedClass: 'border-purple-500 bg-purple-50',
      };
    case 'logistics':
      return {
        Icon: Truck,
        bubbleClass: 'bg-green-100 text-green-600',
        accentClass: 'border-l-green-500',
        selectedClass: 'border-green-500 bg-green-50',
      };
    case 'risk':
      return {
        Icon: AlertCircle,
        bubbleClass: 'bg-errorRed/10 text-errorRed',
        accentClass: 'border-l-errorRed',
        selectedClass: 'border-errorRed/40 bg-errorRed/5',
      };
    case 'approval':
    case 'approval_resolution':
      return {
        Icon: ShieldAlert,
        bubbleClass: 'bg-amber-100 text-amber-700',
        accentClass: 'border-l-amber-500',
        selectedClass: 'border-amber-400 bg-amber-50',
      };
    case 'execution':
      return {
        Icon: CheckCircle2,
        bubbleClass: 'bg-green-100 text-green-700',
        accentClass: 'border-l-green-500',
        selectedClass: 'border-green-400 bg-green-50',
      };
    case 'reflection':
      return {
        Icon: RefreshCcw,
        bubbleClass: 'bg-slate-100 text-slate-600',
        accentClass: 'border-l-slate-500',
        selectedClass: 'border-slate-400 bg-slate-50',
      };
    case 'planner':
    case 'critic':
    default:
      return {
        Icon: BrainCircuit,
        bubbleClass: 'bg-rausch/10 text-rausch',
        accentClass: 'border-l-rausch',
        selectedClass: 'border-rausch bg-rausch/5',
      };
  }
}
export function causalTone(kind: 'event' | 'plan' | 'approval' | 'execution'): string {
  if (kind === 'event') return 'border-errorRed/20 bg-errorRed/5';
  if (kind === 'approval') return 'border-amber-200 bg-amber-50';
  if (kind === 'execution') return 'border-green-200 bg-green-50';
  return 'border-borderGray bg-lightSurface';
}

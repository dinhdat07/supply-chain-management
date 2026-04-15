import { useMemo } from 'react';
import { AlertCircle, ArrowUpRight, Package } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import type { ControlTowerSummaryResponse, InventoryRowView } from '../lib/types';
import { humanizeStatus } from '../lib/presenters';

interface DashboardProps {
  summary: ControlTowerSummaryResponse | null;
  inventory: InventoryRowView[];
  loading: boolean;
  error: string | null;
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function Dashboard({ summary, inventory, loading, error }: DashboardProps) {
  const lowStockItems = inventory.filter((item) => item.status === 'low' || item.status === 'out_of_stock').length;
  const prioritizedAlerts = useMemo(
    () =>
      [...(summary?.alerts ?? [])].sort((left, right) => {
        const rank = { critical: 0, warning: 1, info: 2 } as const;
        return rank[left.level] - rank[right.level];
      }),
    [summary?.alerts],
  );
  const chartData = summary
    ? [
        { name: 'Service', value: Number((summary.kpis.service_level * 100).toFixed(1)) },
        { name: 'Recovery', value: Number((summary.kpis.recovery_speed * 100).toFixed(1)) },
        { name: 'Risk', value: Number((summary.kpis.disruption_risk * 100).toFixed(1)) },
        { name: 'Stockout', value: Number((summary.kpis.stockout_risk * 100).toFixed(1)) },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-nearBlack tracking-[-0.18px] mb-2">Dashboard</h1>
          <p className="text-[16px] text-secondaryGray font-medium">
            Live overview of the control tower, disruption state, and supply performance.
          </p>
        </div>
        {summary ? (
          <div className="rounded-full border border-borderGray bg-pureWhite px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-secondaryGray">
            Mode: <span className="text-nearBlack">{humanizeStatus(summary.mode)}</span>
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-5 py-4 text-[14px] text-errorRed">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-pureWhite p-6 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-semibold text-secondaryGray">Total SKUs</h3>
            <div className="p-2 bg-lightSurface rounded-full text-nearBlack">
              <Package size={20} />
            </div>
          </div>
          <div className="text-[32px] font-bold text-nearBlack tracking-[-0.44px]">
            {loading ? '...' : inventory.length}
          </div>
        </div>

        <div className="bg-pureWhite p-6 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-semibold text-secondaryGray">Low Stock Items</h3>
            <div className="p-2 bg-errorRed/10 rounded-full text-errorRed">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="text-[32px] font-bold text-errorRed tracking-[-0.44px]">
            {loading ? '...' : lowStockItems}
          </div>
        </div>

        <div className="bg-pureWhite p-6 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-semibold text-secondaryGray">Open Decisions</h3>
            <div className="p-2 bg-nearBlack rounded-full text-pureWhite">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="text-[32px] font-bold text-nearBlack tracking-[-0.44px]">
            {loading || !summary ? '...' : summary.decision_count}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 h-full bg-pureWhite p-6 rounded-card shadow-card border border-borderGray">
          <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px] mb-6">KPI Snapshot</h2>
          <div className="h-[250px]">
            {loading || !summary ? (
              <div className="flex h-full items-center justify-center text-[15px] font-medium text-secondaryGray">
                Loading control tower metrics...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6a6a6a', fontSize: 13 }} dy={10} />
                  <Tooltip
                    formatter={(value) => [`${value ?? 0}%`, 'Value']}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: 'rgba(0,0,0,0.1) 0px 4px 8px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#ff385c" strokeWidth={3} dot={{ r: 4, fill: '#ff385c', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {summary ? (
            <div className="mt-4 grid grid-cols-2 gap-4 text-[14px] text-secondaryGray md:grid-cols-4">
              <div>Service {percent(summary.kpis.service_level)}</div>
              <div>Recovery {percent(summary.kpis.recovery_speed)}</div>
              <div>Risk {percent(summary.kpis.disruption_risk)}</div>
              <div>Latency {summary.kpis.decision_latency_ms.toFixed(0)} ms</div>
            </div>
          ) : null}
        </div>

        <div className="flex h-full max-h-[430px] flex-col bg-pureWhite p-6 rounded-card shadow-card border border-borderGray">
          <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px] mb-6">Alerts</h2>
          {loading || !summary ? (
            <div className="flex-1 rounded-card border border-borderGray bg-lightSurface/60 p-4 text-[14px] text-secondaryGray">
              Waiting for live alerts...
            </div>
          ) : prioritizedAlerts.length === 0 ? (
            <div className="flex-1 rounded-card border border-borderGray bg-lightSurface/60 p-4 text-[14px] text-secondaryGray">
              No active alerts. The network is currently stable.
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {prioritizedAlerts.map((alert) => (
                <div
                  key={`${alert.source}-${alert.title}`}
                  className={`flex items-start gap-3 rounded-card border p-3 ${
                    alert.level === 'critical'
                      ? 'border-errorRed/10 bg-errorRed/5'
                      : 'border-borderGray bg-nearBlack/5'
                  }`}
                >
                  <AlertCircle className={alert.level === 'critical' ? 'text-errorRed mt-0.5 shrink-0' : 'text-nearBlack mt-0.5 shrink-0'} size={18} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[15px] font-semibold text-nearBlack">{alert.title}</h4>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        alert.level === 'critical'
                          ? 'bg-errorRed/10 text-errorRed'
                          : 'bg-lightSurface text-secondaryGray'
                      }`}>
                        {alert.level}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-secondaryGray">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

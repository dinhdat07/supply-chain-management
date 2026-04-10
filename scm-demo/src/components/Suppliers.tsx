import { Star, ShieldCheck, Clock, DollarSign } from 'lucide-react';

import type { SupplierRowView } from '../lib/types';

interface SuppliersProps {
  items: SupplierRowView[];
  loading: boolean;
  error: string | null;
}

function costLevel(unitCost: number) {
  if (unitCost >= 8) return 'High';
  if (unitCost >= 5) return 'Medium';
  return 'Low';
}

export function Suppliers({ items, loading, error }: SuppliersProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-nearBlack tracking-[-0.18px] mb-2">Suppliers</h1>
          <p className="text-[16px] text-secondaryGray font-medium">Compare supplier reliability, lead time, cost, and tradeoffs.</p>
        </div>
      </header>

      {error ? (
        <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-5 py-4 text-[14px] text-errorRed">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((supplier) => (
          <div key={`${supplier.supplier_id}-${supplier.sku}`} className="bg-pureWhite rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all flex flex-col p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px]">{supplier.supplier_id}</h2>
                <p className="mt-1 text-[13px] font-medium uppercase tracking-wider text-secondaryGray">{supplier.sku}</p>
              </div>
              <div className="flex items-center gap-1 bg-lightSurface px-2 py-1 rounded-badge">
                <Star size={14} className="text-rausch fill-rausch" />
                <span className="text-[13px] font-bold text-nearBlack">{supplier.reliability.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-borderGray">
                <span className="text-secondaryGray font-medium text-[14px] flex items-center gap-2">
                  <Clock size={16} /> Lead Time
                </span>
                <span className="font-bold text-nearBlack text-[14px]">{supplier.lead_time_days} days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-borderGray">
                <span className="text-secondaryGray font-medium text-[14px] flex items-center gap-2">
                  <DollarSign size={16} /> Cost Level
                </span>
                <span className={`font-bold text-[14px] ${costLevel(supplier.unit_cost) === 'High' ? 'text-errorRed' : 'text-green-600'}`}>
                  {costLevel(supplier.unit_cost)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-secondaryGray font-medium text-[14px] flex items-center gap-2">
                  <ShieldCheck size={16} /> Trade-off
                </span>
                <span className="font-semibold text-nearBlack text-[14px] bg-lightSurface px-2 py-1 rounded-badge">
                  {supplier.tradeoff}
                </span>
              </div>
              <div className="pt-3 text-[13px] text-secondaryGray">
                Status: <span className="font-semibold text-nearBlack">{supplier.status}</span>
                {supplier.is_primary ? ' • Primary supplier' : ' • Alternate supplier'}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && items.length === 0 ? (
        <div className="rounded-card border border-borderGray bg-pureWhite px-5 py-6 text-[14px] text-secondaryGray">
          No supplier records were returned by the backend.
        </div>
      ) : null}
    </div>
  );
}

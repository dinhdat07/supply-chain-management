import { Search, Star } from 'lucide-react';
import { useState } from 'react';

import type { SupplierRowView } from '../lib/types';
import { entityReference, humanizeEntityId, humanizeStatus } from '../lib/presenters';

interface SuppliersProps {
  items: SupplierRowView[];
  loading: boolean;
  error: string | null;
}

export function Suppliers({ items, loading, error }: SuppliersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = items.filter((supplier) =>
    supplier.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.tradeoff.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="bg-pureWhite rounded-card shadow-card border border-borderGray overflow-hidden">
        <div className="p-6 border-b border-borderGray flex justify-between items-center bg-lightSurface">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondaryGray" size={18} />
            <input
              type="text"
              placeholder="Search supplier, SKU, or tradeoff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full border border-borderGray bg-pureWhite text-[14px] font-medium text-nearBlack placeholder-secondaryGray focus:outline-none focus:ring-2 focus:ring-rausch/50 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pureWhite border-b border-borderGray text-[13px] font-bold text-secondaryGray uppercase tracking-wider">
                <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Unit Cost</th>
                  <th className="px-6 py-4">Lead Time</th>
                  <th className="px-6 py-4">Reliability</th>
                  <th className="px-6 py-4">Primary</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-borderGray">
              {filtered.map((supplier) => (
                <tr key={`${supplier.supplier_id}-${supplier.sku}`} className="hover:bg-lightSurface/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-nearBlack text-[14px]">{humanizeEntityId(supplier.supplier_id)}</div>
                    <div className="mt-1 text-[12px] text-secondaryGray">{supplier.supplier_id}</div>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-secondaryGray">{entityReference(supplier.sku)}</td>
                  <td className="px-6 py-4">
                    <div className="text-[14px] text-nearBlack font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(supplier.unit_cost)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-secondaryGray">{supplier.lead_time_days} days</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-badge bg-lightSurface px-3 py-1 text-[12px] font-semibold text-nearBlack">
                      <Star size={14} className="text-rausch fill-rausch" />
                      {supplier.reliability.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-badge text-[12px] font-semibold tracking-[-0.18px] ${supplier.is_primary ? 'bg-rausch/10 text-rausch' : 'bg-lightSurface text-secondaryGray'}`}>
                      {supplier.is_primary ? 'Primary' : 'Alternate'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-badge text-[12px] font-semibold tracking-[-0.18px] ${supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-errorRed/10 text-errorRed'}`}>
                      {humanizeStatus(supplier.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(loading || filtered.length === 0) && (
          <div className="p-8 text-center text-secondaryGray font-medium">
            {loading ? 'Loading suppliers...' : 'No supplier records matched your search.'}
          </div>
        )}
      </div>
    </div>
  );
}

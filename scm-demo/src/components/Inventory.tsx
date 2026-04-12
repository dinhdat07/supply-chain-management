import { useState } from 'react';
import { Search } from 'lucide-react';

import type { InventoryRowView } from '../lib/types';
import { entityReference, humanizeEntityId, humanizeStatus } from '../lib/presenters';

interface InventoryProps {
  items: InventoryRowView[];
  loading: boolean;
  error: string | null;
}

export function Inventory({ items, loading, error }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = items.filter((item) =>
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.preferred_supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warehouse_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-nearBlack tracking-[-0.18px] mb-2">Inventory</h1>
          <p className="text-[16px] text-secondaryGray font-medium">Monitor stock, incoming supply, and preferred sourcing across the network.</p>
        </div>
      </header>

      {error ? (
        <div className="rounded-card border border-errorRed/20 bg-errorRed/5 px-5 py-4 text-[14px] text-errorRed">
          {error}
        </div>
      ) : null}

      <div className="bg-pureWhite rounded-card shadow-card border border-borderGray overflow-hidden">
        <div className="p-6 border-b border-borderGray flex justify-between items-center bg-lightSurface">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondaryGray" size={18} />
            <input 
              type="text" 
              placeholder="Search SKU or Product..." 
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
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Primary Supplier</th>
                <th className="px-6 py-4">On Hand</th>
                <th className="px-6 py-4">Incoming</th>
                <th className="px-6 py-4">Forecast</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderGray">
              {filtered.map((item) => (
                <tr key={item.sku} className={`hover:bg-lightSurface/50 transition-colors ${item.status === 'low' ? 'bg-errorRed/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-nearBlack text-[14px]">{item.name || humanizeEntityId(item.sku)}</div>
                    <div className="mt-1 text-[12px] text-secondaryGray">{item.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-nearBlack font-medium">{entityReference(item.warehouse_id)}</td>
                  <td className="px-6 py-4 text-[14px] text-secondaryGray">{entityReference(item.preferred_supplier_id)}</td>
                  <td className={`px-6 py-4 text-[14px] font-bold ${item.on_hand <= item.reorder_point ? 'text-errorRed' : 'text-nearBlack'}`}>
                    {item.on_hand}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-secondaryGray">{item.incoming_qty}</td>
                  <td className="px-6 py-4 text-[14px] text-secondaryGray">{item.forecast_qty}</td>
                  <td className="px-6 py-4">
                    {item.status === 'in_stock' && (
                      <span className="inline-flex px-3 py-1 rounded-badge bg-green-100 text-green-800 text-[12px] font-semibold tracking-[-0.18px]">
                        {humanizeStatus(item.status)}
                      </span>
                    )}
                    {item.status === 'low' && (
                      <span className="inline-flex px-3 py-1 rounded-badge bg-yellow-100 text-yellow-800 text-[12px] font-semibold tracking-[-0.18px]">
                        {humanizeStatus(item.status)}
                      </span>
                    )}
                    {item.status === 'at_risk' && (
                      <span className="inline-flex px-3 py-1 rounded-badge bg-orange-100 text-orange-800 text-[12px] font-semibold tracking-[-0.18px]">
                        {humanizeStatus(item.status)}
                      </span>
                    )}
                    {item.status === 'out_of_stock' && (
                      <span className="inline-flex px-3 py-1 rounded-badge bg-errorRed/10 text-errorRed text-[12px] font-semibold tracking-[-0.18px]">
                        {humanizeStatus(item.status)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(loading || filtered.length === 0) && (
          <div className="p-8 text-center text-secondaryGray font-medium">
            {loading ? 'Loading inventory...' : 'No inventory rows matched your search.'}
          </div>
        )}
      </div>
    </div>
  );
}

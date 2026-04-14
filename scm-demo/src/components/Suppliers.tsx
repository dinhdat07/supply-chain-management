import { Search, Star, Package, ShieldCheck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';

import type { SupplierRowView } from '../lib/types';
import { humanizeEntityId, humanizeStatus } from '../lib/presenters';

interface SuppliersProps {
  items: SupplierRowView[];
  loading: boolean;
  error: string | null;
}

interface GroupedSupplier {
  supplier_id: string;
  reliability: number;
  status: string;
  skus: SupplierRowView[];
}

export function Suppliers({ items, loading, error }: SuppliersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (supplierId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  const groupedSuppliers = useMemo(() => {
    const groups: Record<string, GroupedSupplier> = {};
    
    items.forEach(item => {
      const matchesSearch = 
        item.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase());

      if (matchesSearch) {
        if (!groups[item.supplier_id]) {
          groups[item.supplier_id] = {
            supplier_id: item.supplier_id,
            reliability: item.reliability,
            status: item.status,
            skus: []
          };
        }
        groups[item.supplier_id].skus.push(item);
      }
    });

    return Object.values(groups).sort((a, b) => b.reliability - a.reliability);
  }, [items, searchTerm]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-nearBlack tracking-[-0.18px] mb-2">Suppliers</h1>
          <p className="text-[16px] text-secondaryGray font-medium">Manage sourcing relationships and track supplier performance across SKUs.</p>
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
              placeholder="Search supplier or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full border border-borderGray bg-pureWhite text-[14px] font-medium text-nearBlack placeholder-secondaryGray focus:outline-none focus:ring-2 focus:ring-rausch/50 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {groupedSuppliers.map((group) => (
          <div key={group.supplier_id} className="bg-pureWhite rounded-card shadow-card border border-borderGray overflow-hidden flex flex-col transition-all hover:shadow-hover">
            {/* Card Header */}
            <div 
              className="p-6 border-b border-borderGray bg-lightSurface flex flex-wrap justify-between items-center gap-4 cursor-pointer"
              onClick={() => toggleGroup(group.supplier_id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-rausch/10 flex items-center justify-center text-rausch">
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-nearBlack tracking-[-0.44px]">
                    {humanizeEntityId(group.supplier_id)}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[13px] font-medium text-secondaryGray">{group.supplier_id}</span>
                    <span className="text-borderGray">•</span>
                    <span className={`text-[12px] font-bold uppercase tracking-wider ${group.status === 'active' ? 'text-green-600' : 'text-errorRed'}`}>
                      {humanizeStatus(group.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[12px] font-bold text-secondaryGray uppercase tracking-widest mb-1">Reliability score</div>
                  <div className="flex items-center justify-end gap-1.5">
                    <Star size={18} className="text-rausch fill-rausch" />
                    <span className="text-[20px] font-bold text-nearBlack">{(group.reliability * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-secondaryGray">
                  {collapsedGroups[group.supplier_id] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
            </div>

            {/* Card Body - Mini Table */}
            {!collapsedGroups[group.supplier_id] && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-pureWhite border-b border-borderGray text-[12px] font-bold text-secondaryGray uppercase tracking-wider">
                        <th className="px-6 py-3">SKU_ID</th>
                        <th className="px-6 py-3">Unit Cost</th>
                        <th className="px-6 py-3">Lead Time</th>
                        <th className="px-6 py-3 text-center">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderGray">
                      {group.skus.map((sku) => (
                        <tr key={sku.sku} className="hover:bg-lightSurface/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-[14px] font-semibold text-nearBlack">{sku.sku}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[14px] font-bold text-nearBlack">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sku.unit_cost)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-[13px] text-secondaryGray font-medium">
                              <Clock size={14} />
                              {sku.lead_time_days} days
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {sku.is_primary ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-rausch/10 text-rausch text-[12px] font-bold shadow-sm">
                                  <ShieldCheck size={14} />
                                  Primary
                                </span>
                              ) : (
                                <span className="inline-flex px-3 py-1 rounded-badge bg-lightSurface text-secondaryGray text-[12px] font-semibold border border-borderGray/50">
                                  Alternate
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-6 py-4 bg-lightSurface/30 border-t border-borderGray text-[13px] text-secondaryGray font-medium italic">
                  Currently managing {group.skus.length} active SKU assignments for this partner.
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {(loading || groupedSuppliers.length === 0) && (
        <div className="p-12 text-center bg-pureWhite rounded-card border border-borderGray shadow-card">
          <div className="inline-flex w-16 h-16 rounded-full bg-lightSurface items-center justify-center text-secondaryGray mb-4">
            <Search size={32} />
          </div>
          <p className="text-secondaryGray font-bold text-[16px]">
            {loading ? 'Analyzing partner network...' : 'No supplier or SKU records found.'}
          </p>
          <p className="text-secondaryGray text-[14px] mt-1">Try adjusting your search criteria to find matching results.</p>
        </div>
      )}
    </div>
  );
}

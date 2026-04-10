import { useState } from 'react';
import { Search } from 'lucide-react';

const MOCK_INVENTORY = [
  { sku: 'SKU-001', name: 'Premium Poultry Feed (50kg)', stock: 45, minThreshold: 150, status: 'low' },
  { sku: 'SKU-002', name: 'Industrial Dehydrator Heating Element', stock: 85, minThreshold: 20, status: 'in_stock' },
  { sku: 'SKU-003', name: 'Corrugated Poultry Cartons (100-pack)', stock: 0, minThreshold: 50, status: 'out_of_stock' },
  { sku: 'SKU-004', name: 'Organic Corn Blend (1 Tonne)', stock: 320, minThreshold: 100, status: 'in_stock' },
  { sku: 'SKU-005', name: 'Vaccine Syringes (Box of 1000)', stock: 12, minThreshold: 50, status: 'low' },
  { sku: 'SKU-006', name: 'Sanitizing Wash Solution (20L)', stock: 410, minThreshold: 100, status: 'in_stock' },
  { sku: 'SKU-007', name: 'Conveyor Belt Mesh (Standard)', stock: 3, minThreshold: 5, status: 'low' },
  { sku: 'SKU-008', name: 'Temperature Sensor Probes', stock: 88, minThreshold: 30, status: 'in_stock' },
  { sku: 'SKU-009', name: 'Thermal Blankets for Transport', stock: 150, minThreshold: 50, status: 'in_stock' },
  { sku: 'SKU-010', name: 'Vitamin Mix Additive (5kg)', stock: 0, minThreshold: 25, status: 'out_of_stock' },
  { sku: 'SKU-011', name: 'Chicken Processing Knives', stock: 65, minThreshold: 40, status: 'in_stock' },
  { sku: 'SKU-012', name: 'Heavy Duty Cleaning Brushes', stock: 110, minThreshold: 30, status: 'in_stock' },
  { sku: 'SKU-013', name: 'Safety Gloves (Box of 50)', stock: 25, minThreshold: 100, status: 'low' },
  { sku: 'SKU-014', name: 'Plastic Shipping Crates', stock: 540, minThreshold: 200, status: 'in_stock' },
];

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_INVENTORY.filter((item) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-nearBlack tracking-[-0.18px] mb-2">Inventory</h1>
          <p className="text-[16px] text-secondaryGray font-medium">Manage and track your products.</p>
        </div>
      </header>

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
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Min Threshold</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderGray">
              {filtered.map((item) => (
                <tr key={item.sku} className={`hover:bg-lightSurface/50 transition-colors ${item.status === 'low' ? 'bg-errorRed/5' : ''}`}>
                  <td className="px-6 py-4 font-semibold text-nearBlack text-[14px]">{item.sku}</td>
                  <td className="px-6 py-4 text-[14px] text-nearBlack font-medium">{item.name}</td>
                  <td className={`px-6 py-4 text-[14px] font-bold ${item.stock < item.minThreshold ? 'text-errorRed' : 'text-nearBlack'}`}>
                    {item.stock}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-secondaryGray">{item.minThreshold}</td>
                  <td className="px-6 py-4">
                    {item.status === 'in_stock' && (
                      <span className="inline-flex px-3 py-1 rounded-badge bg-green-100 text-green-800 text-[12px] font-semibold tracking-[-0.18px]">
                        In Stock
                      </span>
                    )}
                    {item.status === 'low' && (
                      <span className="inline-flex px-3 py-1 rounded-badge bg-yellow-100 text-yellow-800 text-[12px] font-semibold tracking-[-0.18px]">
                        Low Stock
                      </span>
                    )}
                    {item.status === 'out_of_stock' && (
                      <span className="inline-flex px-3 py-1 rounded-badge bg-errorRed/10 text-errorRed text-[12px] font-semibold tracking-[-0.18px]">
                        Out of Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-secondaryGray font-medium">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}

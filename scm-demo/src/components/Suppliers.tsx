import { Star, ShieldCheck, Clock, DollarSign } from 'lucide-react';

const MOCK_SUPPLIERS = [
  { 
    id: 1, 
    name: 'Global Freight Ltd.', 
    leadTime: 14, 
    costLevel: 'Low', 
    reliability: 4.2,
    badges: ['Eco Friendly'],
    tradeoff: 'Cheap but slow'
  },
  { 
    id: 2, 
    name: 'Express Parts Inc.', 
    leadTime: 3, 
    costLevel: 'High', 
    reliability: 4.8,
    badges: ['Premium Partner', '24/7 Support'],
    tradeoff: 'Fast but expensive'
  },
  { 
    id: 3, 
    name: 'Reliable Supply Co.', 
    leadTime: 7, 
    costLevel: 'Medium', 
    reliability: 4.5,
    badges: ['Local'],
    tradeoff: 'Balanced choice'
  },
];

export function Suppliers() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-nearBlack tracking-[-0.18px] mb-2">Suppliers</h1>
          <p className="text-[16px] text-secondaryGray font-medium">Compare and manage vendor relationships.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_SUPPLIERS.map((supplier) => (
          <div key={supplier.id} className="bg-pureWhite rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all flex flex-col p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px]">{supplier.name}</h2>
              <div className="flex items-center gap-1 bg-lightSurface px-2 py-1 rounded-badge">
                <Star size={14} className="text-rausch fill-rausch" />
                <span className="text-[13px] font-bold text-nearBlack">{supplier.reliability}</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-borderGray">
                <span className="text-secondaryGray font-medium text-[14px] flex items-center gap-2">
                  <Clock size={16} /> Lead Time
                </span>
                <span className="font-bold text-nearBlack text-[14px]">{supplier.leadTime} days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-borderGray">
                <span className="text-secondaryGray font-medium text-[14px] flex items-center gap-2">
                  <DollarSign size={16} /> Cost Level
                </span>
                <span className={`font-bold text-[14px] ${supplier.costLevel === 'High' ? 'text-errorRed' : 'text-green-600'}`}>
                  {supplier.costLevel}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Package, ArrowUpRight } from 'lucide-react';

const data = [
  { name: 'Mon', demand: 400 },
  { name: 'Tue', demand: 300 },
  { name: 'Wed', demand: 550 },
  { name: 'Thu', demand: 480 },
  { name: 'Fri', demand: 700 },
  { name: 'Sat', demand: 620 },
  { name: 'Sun', demand: 800 },
];

export function Dashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-nearBlack tracking-[-0.18px] mb-2">Dashboard</h1>
          <p className="text-[16px] text-secondaryGray font-medium">Overview of warehouse and inventory.</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-pureWhite p-6 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-semibold text-secondaryGray">Total SKUs</h3>
            <div className="p-2 bg-lightSurface rounded-full text-nearBlack">
              <Package size={20} />
            </div>
          </div>
          <div className="text-[32px] font-bold text-nearBlack tracking-[-0.44px]">2,543</div>
        </div>

        <div className="bg-pureWhite p-6 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-semibold text-secondaryGray">Low Stock Items</h3>
            <div className="p-2 bg-errorRed/10 rounded-full text-errorRed">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="text-[32px] font-bold text-errorRed tracking-[-0.44px]">14</div>
        </div>

        <div className="bg-pureWhite p-6 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-semibold text-secondaryGray">Incoming Orders</h3>
            <div className="p-2 bg-nearBlack rounded-full text-pureWhite">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="text-[32px] font-bold text-nearBlack tracking-[-0.44px]">89</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Trend */}
        <div className="col-span-2 bg-pureWhite p-6 rounded-card shadow-card border border-borderGray">
          <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px] mb-6">Demand Trend</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6a6a6a', fontSize: 13 }} dy={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: 'rgba(0,0,0,0.1) 0px 4px 8px' }}
                />
                <Line type="monotone" dataKey="demand" stroke="#ff385c" strokeWidth={3} dot={{ r: 4, fill: '#ff385c', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-pureWhite p-6 rounded-card shadow-card border border-borderGray flex flex-col">
          <h2 className="text-[22px] font-semibold text-nearBlack tracking-[-0.44px] mb-6">Alerts</h2>
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-card bg-errorRed/5 border border-errorRed/10">
              <AlertCircle className="text-errorRed mt-0.5 shrink-0" size={20} />
              <div>
                <h4 className="text-[16px] font-semibold text-nearBlack">Product A is low on stock</h4>
                <p className="text-[14px] text-secondaryGray mt-1">Expected stockout in 4 days.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-card bg-nearBlack/5 border border-borderGray">
              <ArrowUpRight className="text-nearBlack mt-0.5 shrink-0" size={20} />
              <div>
                <h4 className="text-[16px] font-semibold text-nearBlack">Demand spike detected</h4>
                <p className="text-[14px] text-secondaryGray mt-1">Product B demand up 35%.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

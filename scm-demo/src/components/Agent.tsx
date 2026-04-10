import { useState } from 'react';
import { BrainCircuit, Play, TrendingUp, PackageSearch, Users, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

export function Agent() {
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);

  const runSimulation = () => {
    setIsRunning(true);
    setStep(1);
    setTimeout(() => setStep(2), 1500);
    setTimeout(() => setStep(3), 3000);
    setTimeout(() => setStep(4), 4500);
    setTimeout(() => {
      setStep(5);
      setIsRunning(false);
    }, 6000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Section A: Control Panel */}
      <div className="bg-pureWhite p-6 rounded-[24px] shadow-card border border-borderGray mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rausch/10 rounded-full">
              <BrainCircuit className="text-rausch w-6 h-6" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-nearBlack tracking-[-0.18px]">AI Supply Chain Agent</h1>
              <p className="text-[14px] text-secondaryGray font-medium mt-1">End-to-end multi-agent optimization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select className="flex-1 md:w-48 p-2.5 rounded-card border border-borderGray bg-lightSurface text-nearBlack font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-rausch focus:border-transparent cursor-pointer transition-all">
              <option>Product A</option>
              <option>Product B</option>
              <option>Product C</option>
            </select>
            
            <button 
              onClick={runSimulation}
              disabled={isRunning || step === 5}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-card text-[15px] font-bold tracking-[-0.18px] transition-all
                ${isRunning || step === 5 
                  ? 'bg-nearBlack/5 text-nearBlack/40 cursor-not-allowed border border-borderGray' 
                  : 'bg-nearBlack text-pureWhite hover:bg-nearBlack/90 hover:shadow-hover hover:-translate-y-[1px]'
                }`}
            >
              <Play size={16} className={isRunning ? 'animate-pulse' : ''} />
              {isRunning ? 'Optimizing...' : 'Run AI Optimization'}
            </button>
          </div>
        </div>
      </div>

      {/* Section B: Multi-Agent Reasoning Flow */}
      {step > 0 && (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-borderGray before:via-borderGray/50 before:to-transparent mb-8">
          
          {/* Step 1: Demand Agent */}
          {step >= 1 && (
            <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${step === 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-80 scale-[0.98]'}`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-[3px] border-pureWhite bg-blue-100 text-blue-600 shadow-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform hover:scale-110">
                <TrendingUp size={20} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-pureWhite p-4 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[16px] font-bold text-nearBlack tracking-[-0.18px]">Demand Agent</h3>
                </div>
                <div className="p-3 bg-lightSurface rounded-card border border-borderGray/50 border-l-[3px] border-l-blue-500">
                  <p className="text-[14px] font-medium text-nearBlack">Forecast: Demand will increase by <span className="font-bold text-rausch">35%</span> next week.</p>
                  <p className="text-[12px] text-secondaryGray mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> Seasonal spike detected.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Inventory Agent */}
          {step >= 2 && (
            <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${step === 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-80 scale-[0.98]'}`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-[3px] border-pureWhite bg-orange-100 text-orange-600 shadow-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform hover:scale-110">
                <PackageSearch size={20} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-pureWhite p-4 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[16px] font-bold text-nearBlack tracking-[-0.18px]">Inventory Agent</h3>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-errorRed/5 rounded-card border border-errorRed/10 border-l-[3px] border-l-errorRed">
                    <p className="text-[14px] font-medium text-nearBlack">Projected stock: <span className="font-bold text-errorRed">Out of stock in 4 days</span>.</p>
                  </div>
                  <div className="p-3 bg-lightSurface rounded-card border border-borderGray/50 border-l-[3px] border-l-nearBlack">
                    <p className="text-[14px] font-medium text-nearBlack">Recommended reorder: <span className="font-bold">300 units</span>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Supplier Agent */}
          {step >= 3 && (
            <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${step === 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-80 scale-[0.98]'}`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-[3px] border-pureWhite bg-purple-100 text-purple-600 shadow-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform hover:scale-110">
                <Users size={20} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-pureWhite p-4 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[16px] font-bold text-nearBlack tracking-[-0.18px]">Supplier Agent</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="p-2 border border-borderGray rounded-card opacity-50 bg-lightSurface">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[13px] text-secondaryGray">Global Freight Ltd.</span>
                      <span className="text-[12px] text-secondaryGray">14 days • Low Cost</span>
                    </div>
                  </div>
                  
                  <div className="p-3 border-[2px] border-purple-500 rounded-card bg-purple-50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-purple-500 text-pureWhite text-[9px] font-bold px-2 py-0.5 rounded-bl-card uppercase tracking-wider">Selected</div>
                    <div className="flex flex-col gap-0.5 pr-5">
                      <span className="font-bold text-[14px] text-nearBlack tracking-[-0.18px]">Express Parts Inc.</span>
                      <span className="text-[13px] font-medium text-purple-800">3 days • High Cost</span>
                      <span className="text-[12px] text-purple-600/80 font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} className="fill-purple-200" />
                        Reason: Shorter lead time to prevent stockout
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Logistics Agent */}
          {step >= 4 && (
            <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${step === 4 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-80 scale-[0.98]'}`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-[3px] border-pureWhite bg-green-100 text-green-600 shadow-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform hover:scale-110">
                <Truck size={20} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-pureWhite p-4 rounded-card shadow-card border border-borderGray hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[16px] font-bold text-nearBlack tracking-[-0.18px]">Logistics Agent</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="p-2 border border-borderGray rounded-card opacity-50 bg-lightSurface flex justify-between items-center">
                    <span className="font-semibold text-[13px] text-secondaryGray">Option A (Ocean)</span>
                    <span className="text-[12px] text-secondaryGray">7 days • Low cost</span>
                  </div>
                  
                  <div className="p-3 border-[2px] border-green-500 rounded-card bg-green-50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-pureWhite text-[9px] font-bold px-2 py-0.5 rounded-bl-card uppercase tracking-wider">Selected</div>
                    <div className="flex flex-col gap-0.5 pr-5">
                      <span className="font-bold text-[14px] text-nearBlack tracking-[-0.18px]">Option B (Air Freight)</span>
                      <span className="text-[13px] font-medium text-green-800">2 days • Higher cost</span>
                      <span className="text-[12px] text-green-700/80 font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} className="fill-green-200" />
                        Reason: Prevent stockout
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section C: Final Decision Panel */}
      {step === 5 && (
        <div className="bg-nearBlack text-pureWhite p-6 rounded-[24px] shadow-card border border-nearBlack/20 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-rausch/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-luxePurple/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-[24px] font-bold mb-6 tracking-[-0.44px] flex items-center gap-3">
              <CheckCircle2 size={28} className="text-rausch fill-rausch/20" />
              Final Action Plan
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-pureWhite/5 rounded-card p-5 border border-pureWhite/10">
              <div>
                <span className="block text-[12px] text-pureWhite/60 font-medium mb-1 uppercase tracking-wider">Product</span>
                <span className="font-bold text-[16px]">Product A</span>
              </div>
              <div>
                <span className="block text-[12px] text-pureWhite/60 font-medium mb-1 uppercase tracking-wider">Quantity</span>
                <span className="font-bold text-[16px]">300 units</span>
              </div>
              <div>
                <span className="block text-[12px] text-pureWhite/60 font-medium mb-1 uppercase tracking-wider">Supplier</span>
                <span className="font-bold text-[16px]">Express Parts Inc.</span>
              </div>
              <div>
                <span className="block text-[12px] text-pureWhite/60 font-medium mb-1 uppercase tracking-wider">Shipping</span>
                <span className="font-bold text-[16px]">Air freight</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-rausch text-pureWhite font-bold text-[15px] py-3 rounded-card shadow-hover hover:-translate-y-[2px] transition-all tracking-[-0.18px] flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                Create Purchase Order
              </button>
              <button 
                onClick={() => setStep(0)}
                className="flex-1 bg-pureWhite/10 hover:bg-pureWhite/20 text-pureWhite font-bold text-[15px] py-3 rounded-card transition-all tracking-[-0.18px]"
              >
                Simulate Alternative
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

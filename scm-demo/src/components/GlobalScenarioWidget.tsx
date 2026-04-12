import { useState, useRef, useEffect } from 'react';
import { LoaderCircle, Truck, X, Settings2, ShieldCheck, Activity } from 'lucide-react';
import type { ScenarioName } from '../lib/types';
import { SCENARIO_OPTIONS } from '../hooks/useControlTower';

interface GlobalScenarioWidgetProps {
  scenario: ScenarioName;
  onScenarioChange: (scenario: ScenarioName) => void;
  onRunScenario: (scenario: ScenarioName) => Promise<void>;
  onResetSystem: () => Promise<void>;
  loading: boolean;
  actionLoading: string | null;
}

export function GlobalScenarioWidget({
  scenario,
  onScenarioChange,
  onRunScenario,
  onResetSystem,
  loading,
  actionLoading,
}: GlobalScenarioWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isRunningScenario = actionLoading?.startsWith('scenario:');
  const isResetting = actionLoading === 'reset';
  const isDisabled = loading || actionLoading !== null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const runAndClose = async () => {
    await onRunScenario(scenario);
    setIsOpen(false);
  };

  const resetAndClose = async () => {
    await onResetSystem();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" ref={dropdownRef}>
      {isOpen && (
        <div className="flex w-[280px] flex-col gap-4 rounded-card border border-borderGray bg-pureWhite p-4 shadow-card animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-bold uppercase tracking-wider text-secondaryGray flex items-center gap-2">
              <Activity size={14} /> Simulate
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-secondaryGray hover:text-nearBlack transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            <select
              value={scenario}
              onChange={(event) => onScenarioChange(event.target.value as ScenarioName)}
              className="w-full rounded border border-borderGray bg-lightSurface px-3 py-2.5 text-[14px] font-medium text-nearBlack focus:border-nearBlack focus:outline-none"
              disabled={isDisabled}
            >
              {SCENARIO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => void runAndClose()}
              disabled={isDisabled}
              className="flex w-full items-center justify-center gap-2 rounded bg-rausch px-4 py-2.5 text-[14px] font-bold text-pureWhite transition-all hover:bg-rausch/90 disabled:cursor-not-allowed disabled:bg-rausch/30"
            >
              {isRunningScenario ? <LoaderCircle size={16} className="animate-spin" /> : <Truck size={16} />}
              {isRunningScenario ? 'Simulating...' : 'Run Disruption'}
            </button>
          </div>

          <div className="border-t border-borderGray pt-3">
            <button
              onClick={() => void resetAndClose()}
              disabled={isDisabled}
              className="flex w-full items-center justify-center gap-2 rounded border border-borderGray bg-pureWhite px-4 py-2.5 text-[14px] font-bold text-nearBlack transition-all hover:bg-lightSurface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResetting ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} className="text-green-600" />}
              {isResetting ? 'Resetting...' : 'Reset to Normal State'}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-pureWhite shadow-lg transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${
          isOpen ? 'bg-nearBlack' : 'bg-rausch'
        }`}
        aria-label="Toggle simulation panel"
      >
        {(isRunningScenario || isResetting) ? (
          <LoaderCircle size={24} className="animate-spin" />
        ) : isOpen ? (
          <X size={24} />
        ) : (
          <Settings2 size={24} />
        )}
      </button>
    </div>
  );
}

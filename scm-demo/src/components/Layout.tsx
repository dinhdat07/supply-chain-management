import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { ServiceRuntimeView } from "../lib/types";
import { formatDurationMs, formatPercent, humanizeLabel } from "../lib/presenters";
import {
  LayoutDashboard,
  Package,
  Users,
  BrainCircuit,
  ScrollText,
  ActivitySquare,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface LayoutProps {
  serviceRuntime?: ServiceRuntimeView | null;
  children: ReactNode;
  currentTab: string;
  setTab: (tab: string) => void;
}

export function Layout({ children, currentTab, setTab, serviceRuntime }: LayoutProps) {

  const [showHealthModal, setShowHealthModal] = useState(false);
  const healthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (healthRef.current && !healthRef.current.contains(event.target as Node)) {
        setShowHealthModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getHealthStatus = () => {
    if (!serviceRuntime) return { color: "bg-secondaryGray", label: "Offline", ping: false };
    const { flags, metrics } = serviceRuntime;
    if (!flags.llm_enabled) return { color: "bg-amber-500", label: "Degraded", ping: false };
    if (metrics.execution_failure_rate >= 0.2 || metrics.llm_fallback_rate >= 0.4) {
      return { color: "bg-amber-500", label: "Warning", ping: true };
    }
    return { color: "bg-green-500", label: "Healthy", ping: true };
  };
  
  const status = getHealthStatus();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "suppliers", label: "Suppliers", icon: Users },
    {
      id: "plan-generation",
      label: "Plan Generation",
      icon: ActivitySquare,
      isHighlight: true,
    },
    { id: "agent", label: "Control Tower", icon: BrainCircuit },
    { id: "ledger", label: "Run Ledger", icon: ScrollText },
  ];

  return (
    <div className="flex h-screen bg-lightSurface font-sans text-nearBlack">
      {/* Sidebar */}
      <aside className="w-64 bg-pureWhite border-r border-borderGray flex flex-col">
        <div className="p-6">
          <h1 className="text-[22px] font-bold tracking-tight">
            DryChicken<span className="text-rausch">SCM</span>
          </h1>
          <p className="mt-2 text-[12px] uppercase tracking-[0.16em] text-secondaryGray">
            Control Tower
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-card text-[16px] transition-all
                  ${
                    isActive
                      ? "bg-nearBlack text-pureWhite font-semibold shadow-hover"
                      : item.isHighlight
                        ? "text-rausch font-semibold hover:bg-rausch/10"
                        : "text-secondaryGray hover:bg-lightSurface font-medium"
                  }
                `}>
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "text-pureWhite"
                      : item.isHighlight
                        ? "text-rausch"
                        : "text-secondaryGray"
                  }
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* System Health */}
        <div className="p-4 mt-auto border-t border-borderGray relative" ref={healthRef}>
          <button 
            onClick={() => setShowHealthModal(!showHealthModal)}
            className="w-full flex items-center justify-between p-3 rounded-card hover:bg-lightSurface transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                {status.ping && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.color}`}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${status.color}`}></span>
              </div>
              <div className="text-left">
                <div className="text-[14px] font-bold text-nearBlack">AI Engine Status</div>
                <div className="text-[12px] text-secondaryGray">{status.label}</div>
              </div>
            </div>
          </button>

          {/* Health Popover */}
          {showHealthModal && (
            <div className="absolute bottom-full left-4 right-[-200px] mb-2 z-50 bg-pureWhite rounded-card shadow-card border border-borderGray p-4">
              <h4 className="text-[14px] font-bold text-nearBlack mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className={status.color.replace('bg-', 'text-')} />
                AI Service Telemetry
              </h4>
              
              {!serviceRuntime ? (
                <p className="text-[12px] text-secondaryGray">Service health data has not been loaded yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondaryGray">Avg Run Time</div>
                      <div className="text-[13px] font-bold text-nearBlack">{formatDurationMs(serviceRuntime.metrics.avg_run_duration_ms)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondaryGray">Step Time</div>
                      <div className="text-[13px] font-bold text-nearBlack">{formatDurationMs(serviceRuntime.metrics.avg_agent_step_duration_ms)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondaryGray">Fallback Rate</div>
                      <div className="text-[13px] font-bold text-nearBlack">{formatPercent(serviceRuntime.metrics.llm_fallback_rate)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondaryGray">Failure Rate</div>
                      <div className="text-[13px] font-bold text-nearBlack">{formatPercent(serviceRuntime.metrics.execution_failure_rate)}</div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-borderGray/30 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondaryGray flex items-center gap-1.5"><BrainCircuit size={12}/> AI Reasoning</div>
                      <div className="text-[12px] text-nearBlack mt-0.5">
                        <span className="font-bold">{serviceRuntime.flags.llm_enabled ? 'Available' : 'Disabled'}</span>
                        <span className="text-secondaryGray ml-1">({humanizeLabel(serviceRuntime.flags.llm_provider)})</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondaryGray flex items-center gap-1.5"><Activity size={12}/> Runtime Policy</div>
                      <div className="text-[12px] text-nearBlack mt-0.5">
                        <span className="font-bold">{humanizeLabel(serviceRuntime.flags.degraded_mode)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 bg-lightSurface">
        {children}
      </main>
    </div>
  );
}

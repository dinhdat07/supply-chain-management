import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  BrainCircuit,
  ScrollText,
  ActivitySquare,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  setTab: (tab: string) => void;
}

export function Layout({ children, currentTab, setTab }: LayoutProps) {
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 bg-lightSurface">
        {children}
      </main>
    </div>
  );
}

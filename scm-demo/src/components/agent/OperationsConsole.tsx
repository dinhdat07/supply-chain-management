

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LoaderCircle, RefreshCcw, Sparkles, X } from "lucide-react";
import type { ControlTowerSummaryResponse } from "../../lib/types";
import { formatPercent, severityTone } from "../../lib/presenters";

interface OperationsConsoleProps {

  summary: ControlTowerSummaryResponse | null;
  workQueue: Array<{ title: string; value: string; detail: string }>;
  loading: boolean;
  refreshing: boolean;
  actionLoading: string | null;
  onRefresh: () => Promise<void>;
  onGenerateRecommendations: () => Promise<void>;
}

export function OperationsConsole({
  summary,
  workQueue,
  loading,
  refreshing,
  actionLoading,
  onRefresh,
  onGenerateRecommendations,
}: OperationsConsoleProps) {
  const [showExceptionsModal, setShowExceptionsModal] = useState(false);
  
  const [exceptionFilter, setExceptionFilter] = useState<"all" | "critical">(
    "all",
  );
  const [exceptionQuery, setExceptionQuery] = useState("");

    const alerts = summary?.alerts ?? [];
  const criticalAlerts = useMemo(
    () => alerts.filter((alert: any) => severityTone(alert.level) === "critical"),
    [alerts],
  );
  const filteredAlerts = useMemo(() => {
    const source = exceptionFilter === "critical" ? criticalAlerts : alerts;
    const query = exceptionQuery.trim().toLowerCase();
    if (!query) return source;
    return source.filter((alert: any) => {
      const haystack = [
        alert.title,
        alert.message,
        alert.source,
        ...(alert.entity_ids ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [alerts, criticalAlerts, exceptionFilter, exceptionQuery]);

      useEffect(() => {
    if (!showExceptionsModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowExceptionsModal(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showExceptionsModal]);

  useEffect(() => {
    if (!showExceptionsModal) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showExceptionsModal]);

  return (
    <section className="space-y-5">
      {/* ── Row 1: Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-nearBlack">
            Operations Console
          </h2>
          <p className="text-[13px] text-secondaryGray">
            Real-time network governance and AI-assisted decision making.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void onRefresh()}
            disabled={loading || actionLoading !== null}
            className="flex items-center gap-2 rounded-card border border-borderGray bg-pureWhite px-4 py-2 text-[13px] font-bold text-nearBlack shadow-sm transition-all hover:bg-lightSurface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCcw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Sync Data"}
          </button>
          <button
            onClick={() => void onGenerateRecommendations()}
            disabled={loading || actionLoading !== null}
            className="flex items-center gap-2 rounded-card bg-nearBlack px-4 py-2 text-[13px] font-bold text-pureWhite shadow-card transition-all hover:bg-nearBlack/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {actionLoading === "daily_plan" ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {actionLoading === "daily_plan" ? "Planning..." : "Generate Plan"}
          </button>
        </div>
      </div>

      {/* ── Row 2: KPI Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Performance",
            metrics: [
              { label: "Service level", value: summary ? formatPercent(summary.kpis.service_level) : "--" },
              { label: "Recovery speed", value: summary ? formatPercent(summary.kpis.recovery_speed) : "--" },
            ]
          },
          {
            title: "Risk",
            metrics: [
              { label: "Disruption risk", value: summary ? formatPercent(summary.kpis.disruption_risk) : "--" },
              { label: "Stockout risk", value: summary ? formatPercent(summary.kpis.stockout_risk) : "--" },
            ]
          },
          {
            title: "Cost & Efficiency",
            metrics: [
              { label: "Total cost", value: summary ? `$${summary.kpis.total_cost.toLocaleString()}` : "--" },
              { label: "Decision latency", value: summary ? `${summary.kpis.decision_latency_ms.toFixed(0)}ms` : "--" },
            ]
          }
        ].map((group) => (
          <div key={group.title} className="rounded-[20px] border border-borderGray bg-pureWhite p-5 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-widest text-secondaryGray mb-4 pb-2 border-b border-borderGray/30">
              {group.title}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {group.metrics.map(kpi => (
                <div key={kpi.label}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                    {kpi.label}
                  </div>
                  <div className="mt-1 text-[20px] font-bold leading-none text-nearBlack">
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 3: Metrics + Exceptions ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {workQueue.map((item) => (
          <div
            key={item.title}
            className="rounded-[18px] border border-borderGray bg-pureWhite px-5 py-4 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-secondaryGray">
                {item.title}
              </div>
              <div className="mt-1 text-[17px] font-bold text-nearBlack">
                {item.value}
              </div>
              <p className="mt-0.5 text-[12px] leading-snug text-secondaryGray">
                {item.detail}
              </p>
            </div>
            {item.title === "Exceptions" && summary && alerts.length > 0 && (
              <button
                onClick={() => setShowExceptionsModal(true)}
                className="mt-3 text-left text-[11px] font-bold text-rausch hover:underline w-fit"
              >
                View {alerts.length} exception{alerts.length > 1 ? "s" : ""} →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Exception Queue Modal ── */}
      {showExceptionsModal && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nearBlack/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-[24px] bg-pureWhite shadow-card flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-borderGray/50 px-6 py-5 shrink-0">
              <div>
                <h3 className="text-[20px] font-black text-nearBlack tracking-tight">
                  Exception Queue
                </h3>
                <p className="text-[13px] text-secondaryGray mt-1">
                  {alerts.length} active signals requiring attention.
                </p>
              </div>
              <button
                onClick={() => setShowExceptionsModal(false)}
                className="rounded-full p-2 text-secondaryGray hover:bg-lightSurface hover:text-nearBlack transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="border-b border-borderGray/50 bg-pureWhite px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-full border border-borderGray bg-lightSurface p-1 text-[11px] font-bold uppercase tracking-wider text-secondaryGray">
                  <button
                    type="button"
                    onClick={() => setExceptionFilter("all")}
                    className={`rounded-full px-3 py-1 transition-colors ${exceptionFilter === "all" ? "bg-pureWhite text-nearBlack shadow-sm" : "text-secondaryGray hover:text-nearBlack"}`}
                  >
                    All ({alerts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExceptionFilter("critical")}
                    className={`rounded-full px-3 py-1 transition-colors ${exceptionFilter === "critical" ? "bg-pureWhite text-nearBlack shadow-sm" : "text-secondaryGray hover:text-nearBlack"}`}
                  >
                    Critical ({criticalAlerts.length})
                  </button>
                </div>
                <input
                  value={exceptionQuery}
                  onChange={(event) => setExceptionQuery(event.target.value)}
                  placeholder="Search exception, source, entity..."
                  className="w-full rounded border border-borderGray bg-lightSurface px-3 py-2 text-[12px] text-nearBlack outline-none transition-colors placeholder:text-secondaryGray focus:border-rausch sm:max-w-[300px]"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 bg-lightSurface/30">
              {filteredAlerts.length ? filteredAlerts.map((alert: any, idx: number) => (
                <div
                  key={`${alert.source}-${alert.title}-${idx}`}
                  className={`rounded-[16px] border p-4 shadow-sm ${
                    severityTone(alert.level) === "critical"
                      ? "border-errorRed/20 bg-errorRed/5"
                      : "border-borderGray bg-pureWhite"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`mt-0.5 shrink-0 ${
                        severityTone(alert.level) === "critical"
                          ? "text-errorRed"
                          : "text-secondaryGray"
                      }`}
                      size={18}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-[15px] font-bold text-nearBlack leading-tight">
                          {alert.title}
                        </div>
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                          severityTone(alert.level) === "critical"
                            ? "bg-errorRed/10 text-errorRed"
                            : "bg-lightSurface text-secondaryGray"
                        }`}>
                          {alert.level}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] text-secondaryGray leading-relaxed">
                        {alert.message}
                      </p>
                      {alert.entity_ids && alert.entity_ids.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {alert.entity_ids.map((id: string) => (
                            <span key={id} className="rounded border border-borderGray bg-pureWhite px-1.5 py-0.5 text-[10px] font-bold text-secondaryGray">
                              {id}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[16px] border border-borderGray bg-pureWhite p-5 text-center">
                  <div className="text-[13px] font-bold text-nearBlack">No matching exceptions</div>
                  <p className="mt-1 text-[12px] text-secondaryGray">
                    Try another keyword or switch back to all alerts.
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t border-borderGray/50 bg-pureWhite px-6 py-4 shrink-0 flex justify-end">
              <button
                onClick={() => setShowExceptionsModal(false)}
                className="rounded-card bg-nearBlack px-6 py-2.5 text-[13px] font-bold text-pureWhite transition-all hover:bg-nearBlack/90 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

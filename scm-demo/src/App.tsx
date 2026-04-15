import { useEffect, useRef, useState } from "react";
import { Agent } from "./components/Agent";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { Layout } from "./components/Layout";
import { RunLedgerPage } from "./components/RunLedgerPage";
import { Suppliers } from "./components/Suppliers";
import { PlanGeneration } from "./components/PlanGeneration";
import { GlobalScenarioWidget } from "./components/GlobalScenarioWidget";
import { useControlTower } from "./hooks/useControlTower";
import { useThinkingStream } from "./hooks/useThinkingStream";
import type { ScenarioName } from "./lib/types";

function App() {
  const [currentTab, setCurrentTab] = useState("plan-generation");
  const [scenario, setScenario] = useState<ScenarioName>("supplier_delay");
  const {
    summary,
    events,
    reflections,
    serviceRuntime,
    inventory,
    suppliers,
    trace: polledTrace,
    pendingApproval,
    approvalDetail,
    scenarioPreview,
    runHistory,
    selectedRun,
    selectedRunTrace,
    selectedRunState,
    selectedRunDecision,
    selectedRunExecution,
    loading,
    refreshing,
    actionLoading,
    historyLoading,
    error,
    refresh,
    previewScenario,
    // runDailyPlan,
    // runScenario,
    applyApproval,
    selectApprovalAlternative,
    selectRun,
    resetSystem,
  } = useControlTower();

  const thinking = useThinkingStream();
  const [streamingAction, setStreamingAction] = useState<string | null>(null);

  // Use the real-time trace from WebSocket when streaming, fall back to polled trace
  const isStreaming = thinking.status === "connecting" || thinking.status === "streaming";
  const liveTrace = thinking.trace ?? polledTrace;

  // Derive actionLoading from the stream status so PlanGeneration
  // shows the "Thinking..." indicator while agents are working
  const effectiveActionLoading = isStreaming ? streamingAction : actionLoading;

  // Wrap thinking.start to also act as "run daily plan"
  const handleStreamingDailyPlan = async () => {
    setStreamingAction("daily_plan");
    await thinking.start();
  };

  // Wrap scenario run: trigger the scenario then start the stream
  const handleStreamingScenario = async (scenarioName: ScenarioName) => {
    setStreamingAction(`scenario:${scenarioName}`);
    // Scenarios still go through the non-streaming path then refresh
    await thinking.start(scenarioName);
  };

  // When the stream completes, refresh all data to pick up final state
  const prevStreamStatus = useRef(thinking.status);
  useEffect(() => {
    if (prevStreamStatus.current === "streaming" && thinking.status === "completed") {
      // Stream just finished — refresh polled data to pick up final state
      void refresh();
    }
    prevStreamStatus.current = thinking.status;
  }, [thinking.status, refresh]);

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <Dashboard
            summary={summary}
            inventory={inventory}
            loading={loading}
            error={error}
          />
        );
      case "inventory":
        return <Inventory items={inventory} loading={loading} error={error} />;
      case "suppliers":
        return <Suppliers items={suppliers} loading={loading} error={error} />;
      case "plan-generation":
        return (
          <PlanGeneration
            trace={liveTrace}
            loading={loading}
            pendingApproval={pendingApproval}
            actionLoading={effectiveActionLoading}
            thinkingEvents={thinking.events}
            streamStatus={thinking.status}
            onNavigateToControlTower={() => setCurrentTab("agent")}
          />
        );
      case "agent":
        return (
          <Agent
            summary={summary}
            events={events}
            reflections={reflections}
            trace={polledTrace}
            pendingApproval={pendingApproval}
            approvalDetail={approvalDetail}
            scenarioPreview={scenarioPreview}
            runHistory={runHistory}
            selectedRun={selectedRun}
            selectedRunTrace={selectedRunTrace}
            selectedRunState={selectedRunState}
            selectedRunDecision={selectedRunDecision}
            selectedRunExecution={selectedRunExecution}
            scenario={scenario}
            loading={loading}
            refreshing={refreshing}
            actionLoading={effectiveActionLoading}
            error={error}
            onScenarioChange={setScenario}
            onRefresh={refresh}
            onPreviewScenario={previewScenario}
            onGenerateRecommendations={handleStreamingDailyPlan}
            onRunScenario={handleStreamingScenario}
            onApprovalAction={applyApproval}
            onSelectAlternative={selectApprovalAlternative}
            onOpenRunLedger={() => setCurrentTab("ledger")}
          />
        );
      case "ledger":
        return (
          <RunLedgerPage
            summary={summary}
            runHistory={runHistory}
            selectedRun={selectedRun}
            selectedRunTrace={selectedRunTrace}
            selectedRunState={selectedRunState}
            selectedRunDecision={selectedRunDecision}
            selectedRunExecution={selectedRunExecution}
            historyLoading={historyLoading}
            error={error}
            onSelectRun={selectRun}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout currentTab={currentTab} setTab={setCurrentTab} serviceRuntime={serviceRuntime}>
      {renderContent()}
      <GlobalScenarioWidget
        scenario={scenario}
        onScenarioChange={setScenario}
        onRunScenario={handleStreamingScenario}
        onResetSystem={resetSystem}
        loading={loading}
        actionLoading={effectiveActionLoading}
      />
    </Layout>
  );
}

export default App;

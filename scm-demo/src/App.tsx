import { useState } from "react";
import { Agent } from "./components/Agent";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { Layout } from "./components/Layout";
import { RunLedgerPage } from "./components/RunLedgerPage";
import { Suppliers } from "./components/Suppliers";
import { PlanGeneration } from "./components/PlanGeneration";
import { GlobalScenarioWidget } from "./components/GlobalScenarioWidget";
import { useControlTower } from "./hooks/useControlTower";
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
    trace,
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
    runDailyPlan,
    runScenario,
    applyApproval,
    selectApprovalAlternative,
    selectRun,
    resetSystem,
  } = useControlTower();

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
            trace={trace}
            loading={loading}
            pendingApproval={pendingApproval}
            actionLoading={actionLoading}
            onNavigateToControlTower={() => setCurrentTab("agent")}
          />
        );
      case "agent":
        return (
          <Agent
            summary={summary}
            events={events}
            reflections={reflections}
            trace={trace}
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
            actionLoading={actionLoading}
            error={error}
            onScenarioChange={setScenario}
            onRefresh={refresh}
            onPreviewScenario={previewScenario}
            onGenerateRecommendations={runDailyPlan}
            onRunScenario={runScenario}
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
        onRunScenario={runScenario}
        onResetSystem={resetSystem}
        loading={loading}
        actionLoading={actionLoading}
      />
    </Layout>
  );
}

export default App;

import { useState } from 'react';
import { Agent } from './components/Agent';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Layout } from './components/Layout';
import { Suppliers } from './components/Suppliers';
import { useControlTower } from './hooks/useControlTower';

function App() {
  const [currentTab, setCurrentTab] = useState('agent');
  const {
    summary,
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
    selectRun,
  } = useControlTower();

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            summary={summary}
            inventory={inventory}
            loading={loading}
            error={error}
          />
        );
      case 'inventory':
        return <Inventory items={inventory} loading={loading} error={error} />;
      case 'suppliers':
        return <Suppliers items={suppliers} loading={loading} error={error} />;
      case 'agent':
        return (
          <Agent
            summary={summary}
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
            loading={loading}
            refreshing={refreshing}
            actionLoading={actionLoading}
            historyLoading={historyLoading}
            error={error}
            onRefresh={refresh}
            onPreviewScenario={previewScenario}
            onGenerateRecommendations={runDailyPlan}
            onRunScenario={runScenario}
            onApprovalAction={applyApproval}
            onSelectRun={selectRun}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout currentTab={currentTab} setTab={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;

import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Suppliers } from './components/Suppliers';
import { Agent } from './components/Agent';

function App() {
  const [currentTab, setCurrentTab] = useState('agent'); // Default to agent as requested

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'suppliers': return <Suppliers />;
      case 'agent': return <Agent />;
      default: return <Agent />;
    }
  };

  return (
    <Layout currentTab={currentTab} setTab={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;

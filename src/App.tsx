import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';
import { Sidebar, Section } from './components/layout/Sidebar';
import { ClientsPage } from './pages/ClientsPage';
import { AgentsPage } from './pages/AgentsPage';
import { ClaimsPage } from './pages/ClaimsPage';

function App() {
  const [activeSection, setActiveSection] = useState<Section>('clients');

  const renderContent = () => {
    switch (activeSection) {
      case 'clients':
        return <ClientsPage />;
      case 'agents':
        return <AgentsPage />;
      case 'claims':
        return <ClaimsPage />;
      default:
        return <ClientsPage />;
    }
  };

  return (
    <Layout>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default App;

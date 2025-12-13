/**
 * Main App component
 */

import Dashboard from './components/Dashboard/Dashboard';
import './styles/index.css';

function App() {
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <header style={{
        background: '#1e293b',
        padding: '16px 24px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          CCTP Network Explorer
        </h1>
      </header>

      {/* Content */}
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;


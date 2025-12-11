/**
 * Main App component
 */

import React, { useState, useEffect } from 'react';
import GraphView from './components/GraphView/GraphView';
import Dashboard from './components/Dashboard/Dashboard';
import { useTransfers } from './hooks/useTransfers';
import './styles/index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'graph' | 'dashboard'>('graph');
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const { transfers, loading, error, isConnected } = useTransfers();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setActiveTab('graph')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'graph' ? '#3b82f6' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'graph' ? 'bold' : 'normal'
            }}
          >
            Graph View
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'dashboard' ? '#3b82f6' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal'
            }}
          >
            Metrics
          </button>
        </nav>

        {/* Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#10b981' : '#ef4444'
          }} />
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Content */}
      <main>
        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 'calc(100vh - 64px)',
            fontSize: '18px',
            color: '#94a3b8'
          }}>
            Loading...
          </div>
        )}

        {error && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 'calc(100vh - 64px)',
            fontSize: '18px',
            color: '#ef4444'
          }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'graph' && (
              <GraphView 
                transfers={transfers} 
                width={dimensions.width}
                height={dimensions.height - 64}
              />
            )}
            
            {activeTab === 'dashboard' && (
              <Dashboard />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;


/**
 * Scheduler control button component
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api';

const SchedulerControl: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
    // Poll status every 5 seconds
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const status = await apiClient.getSchedulerStatus();
      setIsRunning(status.running);
    } catch (error) {
      console.error('Error loading scheduler status', error);
    }
  };

  const handleToggle = async () => {
    try {
      setLoading(true);
      if (isRunning) {
        await apiClient.stopScheduler();
        setIsRunning(false);
      } else {
        await apiClient.startScheduler();
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error toggling scheduler', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        background: isRunning ? '#ef4444' : '#10b981',
        color: 'white',
        fontSize: '13px',
        fontWeight: '500',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.opacity = '0.9';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.opacity = '1';
        }
      }}
    >
      {loading ? (
        <>
          <span>⏳</span>
          <span>...</span>
        </>
      ) : isRunning ? (
        <>
          <span>⏸</span>
          <span>Stop Fetching</span>
        </>
      ) : (
        <>
          <span>▶</span>
          <span>Start Fetching</span>
        </>
      )}
    </button>
  );
};

export default SchedulerControl;


/**
 * Chain row component with expandable details (Outgoing/Incoming)
 */

import React, { useEffect, useState } from 'react';
import { apiClient, Period } from '../../services/api';
import { getChainName } from '../../utils/chainNames';
import ChainVolumeChart from './ChainVolumeChart';

type BreakdownType = 'outgoing' | 'incoming';

interface ChainRowProps {
  chain: {
    domain: number;
    name: string;
    incomingUSDC: string;
    outgoingUSDC: string;
    chainTotal: number;
    percentage: number;
  };
  period: Period;
  isExpanded: boolean;
  onToggle: () => void;
}

const ChainRow: React.FC<ChainRowProps> = ({ chain, period, isExpanded, onToggle }) => {
  const [breakdownType, setBreakdownType] = useState<BreakdownType>('outgoing');
  const [outgoing, setOutgoing] = useState<Array<{ destinationDomain: number; volume: string }>>([]);
  const [incoming, setIncoming] = useState<Array<{ sourceDomain: number; volume: string }>>([]);
  const [chartData, setChartData] = useState<Array<{ time: string; total: string;[key: string]: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      if (breakdownType === 'outgoing') {
        loadOutgoing();
      } else {
        loadIncoming();
      }
      loadChartData();
    }
  }, [isExpanded, chain.domain, period, breakdownType]);

  const loadOutgoing = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getChainOutgoing(chain.domain, period);
      setOutgoing(data);
    } catch (error) {
      console.error('Error loading outgoing details', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIncoming = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getChainIncoming(chain.domain, period);
      setIncoming(data);
    } catch (error) {
      console.error('Error loading incoming details', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      setChartLoading(true);
      const data = await apiClient.getChainVolumeChart(chain.domain, period, breakdownType);
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data', error);
    } finally {
      setChartLoading(false);
    }
  };

  const totalOutgoing = outgoing.reduce((sum, item) => sum + parseFloat(item.volume), 0);
  const totalIncoming = incoming.reduce((sum, item) => sum + parseFloat(item.volume), 0);
  const currentData: Array<{ volume: string;[key: string]: number | string }> = breakdownType === 'outgoing' ? outgoing : incoming;
  const currentTotal = breakdownType === 'outgoing' ? totalOutgoing : totalIncoming;

  const periodLabel = period === '1min' ? 'Last Minute' :
    period === '5min' ? 'Last 5 Minutes' :
      period === '15min' ? 'Last 15 Minutes' :
        period === '1h' ? 'Last Hour' :
          period === '4h' ? 'Last 4 Hours' :
            'Last 24 Hours';

  return (
    <>
      <tr
        style={{
          borderBottom: isExpanded ? 'none' : '1px solid #334155',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#0f172a'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        onClick={onToggle}
      >
        <td style={{ padding: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          {chain.name}
        </td>
        <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>
          ${(parseFloat(chain.incomingUSDC) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </td>
        <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>
          ${(parseFloat(chain.outgoingUSDC) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </td>
        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
          ${(chain.chainTotal / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </td>
        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>
          {chain.percentage.toFixed(2)}%
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} style={{ padding: '0', borderBottom: '1px solid #334155' }}>
            <div style={{
              background: '#0f172a',
              padding: '20px',
              borderLeft: '3px solid #3b82f6'
            }}>
              {/* Breakdown Type Selector */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: breakdownType === 'outgoing' ? '#3b82f6' : '#10b981' }}>
                    {breakdownType === 'outgoing' ? '📤 Outgoing' : '📥 Incoming'} Volume Breakdown
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBreakdownType('outgoing');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: breakdownType === 'outgoing' ? '#3b82f6' : '#334155',
                        background: breakdownType === 'outgoing' ? '#1e3a8a' : '#1e293b',
                        color: breakdownType === 'outgoing' ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: breakdownType === 'outgoing' ? '500' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      Outgoing
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBreakdownType('incoming');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: breakdownType === 'incoming' ? '#10b981' : '#334155',
                        background: breakdownType === 'incoming' ? '#064e3b' : '#1e293b',
                        color: breakdownType === 'incoming' ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: breakdownType === 'incoming' ? '500' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      Incoming
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
                  <span>
                    <strong style={{ color: '#64748b' }}>Period:</strong> {periodLabel}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Total:</strong> <span style={{ color: breakdownType === 'outgoing' ? '#3b82f6' : '#10b981', fontWeight: '500' }}>${(currentTotal / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC</span>
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>{breakdownType === 'outgoing' ? 'Destinations' : 'Sources'}:</strong> {currentData.length} chain{currentData.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Volume Chart */}
              {chartLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading chart...
                </div>
              ) : chartData.length > 0 && currentData.length > 0 ? (
                <ChainVolumeChart data={chartData} type={breakdownType} breakdown={currentData} />
              ) : null}

              {/* Data Table */}
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading {breakdownType} details...
                </div>
              ) : currentData.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  No {breakdownType} transfers found for this period
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>
                          {breakdownType === 'outgoing' ? 'Destination' : 'Source'} Chain
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>
                          Volume (USDC)
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...currentData]
                        .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
                        .map((item, index) => {
                          const volume = parseFloat(item.volume);
                          const percentage = currentTotal > 0 ? (volume / currentTotal * 100) : 0;
                          let domain: number;
                          if (breakdownType === 'outgoing') {
                            domain = (item as { destinationDomain: number; volume: string }).destinationDomain;
                          } else {
                            domain = (item as { sourceDomain: number; volume: string }).sourceDomain;
                          }
                          const chainName = getChainName(domain);
                          return (
                            <tr key={`${breakdownType}-${domain}-${index}`} style={{ borderBottom: '1px solid #1e293b' }}>
                              <td style={{ padding: '10px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '500' }}>{chainName}</span>
                                  <span style={{ color: '#64748b', fontSize: '11px' }}>
                                    (Domain {domain})
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right', color: breakdownType === 'outgoing' ? '#3b82f6' : '#10b981', fontSize: '13px', fontWeight: '500' }}>
                                ${(volume / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8', fontSize: '13px' }}>
                                {percentage.toFixed(2)}%
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default ChainRow;

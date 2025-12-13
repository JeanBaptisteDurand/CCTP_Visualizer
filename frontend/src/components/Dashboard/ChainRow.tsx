/**
 * Chain row component with expandable details
 */

import React, { useEffect, useState } from 'react';
import { apiClient, Period } from '../../services/api';
import { getChainName } from '../../utils/chainNames';

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
  const [outgoing, setOutgoing] = useState<Array<{ destinationDomain: number; volume: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      loadOutgoing();
    }
  }, [isExpanded, chain.domain, period]);

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

  const totalOutgoing = outgoing.reduce((sum, item) => sum + parseFloat(item.volume), 0);

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
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#3b82f6' }}>
                  📤 Outgoing Volume Breakdown
                </h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
                  <span>
                    <strong style={{ color: '#64748b' }}>Period:</strong> {period === '1min' ? 'Last Minute' : period === '5min' ? 'Last 5 Minutes' : period === '15min' ? 'Last 15 Minutes' : period === '1h' ? 'Last Hour' : period === '4h' ? 'Last 4 Hours' : 'Last 24 Hours'}
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Total:</strong> <span style={{ color: '#3b82f6', fontWeight: '500' }}>${(totalOutgoing / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC</span>
                  </span>
                  <span>
                    <strong style={{ color: '#64748b' }}>Destinations:</strong> {outgoing.length} chain{outgoing.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading outgoing details...
                </div>
              ) : outgoing.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  No outgoing transfers found for this period
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>
                          Destination Chain
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
                      {outgoing
                        .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
                        .map(item => {
                          const volume = parseFloat(item.volume);
                          const percentage = totalOutgoing > 0 ? (volume / totalOutgoing * 100) : 0;
                          const chainName = getChainName(item.destinationDomain);
                          return (
                            <tr key={item.destinationDomain} style={{ borderBottom: '1px solid #1e293b' }}>
                              <td style={{ padding: '10px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '500' }}>{chainName}</span>
                                  <span style={{ color: '#64748b', fontSize: '11px' }}>
                                    (Domain {item.destinationDomain})
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right', color: '#3b82f6', fontSize: '13px', fontWeight: '500' }}>
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


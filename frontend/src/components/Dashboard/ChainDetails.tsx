/**
 * Chain details page - shows outgoing volume to other chains
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, Period } from '../../services/api';

const CHAIN_NAMES: Record<number, string> = {
    0: 'Ethereum',
    1: 'Avalanche',
    2: 'OP Mainnet',
    3: 'Arbitrum',
    6: 'Base',
    7: 'Polygon',
    10: 'Unichain',
    11: 'Linea',
    13: 'Sonic',
    14: 'World Chain',
    15: 'Monad',
    16: 'Sei',
    19: 'HyperEVM',
    21: 'Ink',
};

const ChainDetails: React.FC = () => {
    const { domain } = useParams<{ domain: string }>();
    const navigate = useNavigate();
    const [outgoing, setOutgoing] = useState<Array<{ destinationDomain: number; volume: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [period] = useState<Period>('24h');

    useEffect(() => {
        if (!domain) return;
        loadData();
    }, [domain, period]);

    const loadData = async () => {
        if (!domain) return;
        try {
            setLoading(true);
            const data = await apiClient.getChainOutgoing(parseInt(domain), period);
            setOutgoing(data);
        } catch (error) {
            console.error('Error loading chain details', error);
        } finally {
            setLoading(false);
        }
    };

    const chainDomain = domain ? parseInt(domain) : null;
    const chainName = chainDomain !== null ? CHAIN_NAMES[chainDomain] || `Chain ${chainDomain}` : 'Unknown';

    if (loading) {
        return (
            <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
                Loading chain details...
            </div>
        );
    }

    const totalVolume = outgoing.reduce((sum, item) => sum + parseFloat(item.volume), 0);

    return (
        <div style={{ padding: '20px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '8px 16px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        marginBottom: '16px'
                    }}
                >
                    ← Back to Dashboard
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {chainName} - Outgoing Volume
                </h1>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
                    Total outgoing: ${(totalVolume / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                </p>
            </div>

            <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #334155'
            }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 'bold' }}>
                    Volume sent to other chains
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: 'normal' }}>Destination Chain</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>Volume (USDC)</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>% of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outgoing.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                        No outgoing transfers found
                                    </td>
                                </tr>
                            ) : (
                                outgoing.map(item => {
                                    const volume = parseFloat(item.volume);
                                    const percentage = totalVolume > 0 ? (volume / totalVolume * 100) : 0;
                                    return (
                                        <tr key={item.destinationDomain} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '12px' }}>
                                                {CHAIN_NAMES[item.destinationDomain] || `Chain ${item.destinationDomain}`}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>
                                                ${(volume / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>
                                                {percentage.toFixed(2)}%
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChainDetails;


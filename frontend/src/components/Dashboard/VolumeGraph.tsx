/**
 * Volume graph component using ECharts
 * Displays network graph of chain volumes and transfers
 */

import React, { useEffect, useState, useRef, Component, ErrorInfo, ReactNode } from 'react';
import ReactECharts from 'echarts-for-react';
import { apiClient, Period } from '../../services/api';
import { getChainName } from '../../utils/chainNames';
import { getChainColor } from '../../utils/chainColors';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GraphErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VolumeGraph Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #334155',
          width: '100%',
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 'bold', color: '#fff' }}>
            Network Volume Graph
          </h3>
          <div style={{
            height: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ fontWeight: 'bold' }}>Error rendering graph</div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface VolumeGraphProps {
  period: Period;
}

interface GraphNode {
  id: string;
  name: string;
  symbolSize?: number;
  value: number | number[];
  rawValue?: number;
  category: number;
  label?: {
    show?: boolean;
  };
  itemStyle?: {
    color?: string;
  };
  x?: number;
  y?: number;
  fixed?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  lineStyle?: {
    color?: string;
    width?: number;
    curveness?: number;
  };
}

interface ChainVolumeData {
  domain: number;
  totalVolume: number;
  outgoing: Array<{ destinationDomain: number; volume: string }>;
}

const VolumeGraph: React.FC<VolumeGraphProps> = ({ period }) => {
  const [option, setOption] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<ReactECharts>(null);
  const linksRef = useRef<GraphLink[]>([]);

  useEffect(() => {
    loadGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      setError(null);

      const chainMetrics = await apiClient.getChainMetrics(period);
      const chainDataPromises = chainMetrics.map(async (chain) => {
        const outgoing = await apiClient.getChainOutgoing(chain.domain, period);
        const totalVolume = parseFloat(chain.incomingUSDC) + parseFloat(chain.outgoingUSDC);
        return {
          domain: chain.domain,
          totalVolume,
          outgoing,
        } as ChainVolumeData;
      });

      const chainData = await Promise.all(chainDataPromises);

      const nodesMap = new Map<number, GraphNode>();
      const links: GraphLink[] = [];
      const linkMap = new Map<string, GraphLink>();

      // Create nodes for all chains
      chainData.forEach((chain) => {
        nodesMap.set(chain.domain, {
          id: chain.domain.toString(),
          name: getChainName(chain.domain),
          value: chain.totalVolume,
          category: 0,
          label: { show: true },
          itemStyle: { color: getChainColor(chain.domain) },
        });
      });

      // Process outgoing links
      chainData.forEach((chain) => {
        chain.outgoing.forEach((outgoing) => {
          const volume = parseFloat(outgoing.volume);
          if (volume > 0) {
            const sourceId = chain.domain.toString();
            const targetId = outgoing.destinationDomain.toString();
            const linkKey = `${sourceId}-${targetId}`;

            if (!nodesMap.has(outgoing.destinationDomain)) {
              nodesMap.set(outgoing.destinationDomain, {
                id: targetId,
                name: getChainName(outgoing.destinationDomain),
                value: 0,
                category: 0,
                label: { show: true },
                itemStyle: { color: getChainColor(outgoing.destinationDomain) },
              });
            }

            if (!linkMap.has(linkKey)) {
              const link: GraphLink = {
                source: sourceId,
                target: targetId,
                value: volume,
                lineStyle: {
                  color: getChainColor(chain.domain),
                  curveness: 0.3,
                },
              };
              links.push(link);
              linkMap.set(linkKey, link);
            } else {
              const existingLink = linkMap.get(linkKey)!;
              existingLink.value += volume;
            }
          }
        });
      });

      // Update node values with incoming volumes
      const incomingVolumes = new Map<number, number>();
      links.forEach((link) => {
        const targetDomain = parseInt(link.target);
        incomingVolumes.set(targetDomain, (incomingVolumes.get(targetDomain) || 0) + link.value);
      });

      incomingVolumes.forEach((totalIncoming, domain) => {
        const node = nodesMap.get(domain);
        if (node) {
          const isManagedChain = chainData.some(cd => cd.domain === domain);
          if (!isManagedChain) {
            node.value = totalIncoming;
          } else {
            const currentValue = typeof node.value === 'number' ? node.value : node.value[0];
            node.value = Math.max(currentValue, totalIncoming);
          }
        }
      });

      const nodes = Array.from(nodesMap.values());

      if (nodes.length === 0) {
        setOption(null);
        setLoading(false);
        setError('No chain data available');
        return;
      }

      // Convert to dollars and prepare for visualMap
      const scaledNodes = nodes.map((node) => {
        const rawValue = typeof node.value === 'number' ? node.value : node.value[0];
        const valueInDollars = rawValue / 1e6;

        const { symbolSize, ...nodeWithoutSize } = node;
        return {
          ...nodeWithoutSize,
          value: [valueInDollars],
          rawValue,
        };
      });

      const maxValue = Math.max(...scaledNodes.map(n => n.value[0]), 1);

      // Calculate max link volume and scale link widths proportionally
      const maxLinkVolume = Math.max(...links.map(l => l.value), 1);
      const minLinkWidth = 1;
      const maxLinkWidth = 12;

      // Scale link widths proportionally based on volume (same scaling as nodes)
      links.forEach((link) => {
        const volumeInDollars = link.value / 1e6;
        const maxLinkVolumeInDollars = maxLinkVolume / 1e6;
        const volumeRatio = maxLinkVolumeInDollars > 0 ? volumeInDollars / maxLinkVolumeInDollars : 0;
        link.lineStyle = {
          ...link.lineStyle,
          width: minLinkWidth + (maxLinkWidth - minLinkWidth) * volumeRatio,
        };
      });

      // Position nodes (larger nodes closer to center)
      scaledNodes.forEach((node, index) => {
        const volumeRatio = node.value[0] / maxValue;
        const distanceFromCenter = (1 - volumeRatio) * 200;
        const angle = (index / scaledNodes.length) * Math.PI * 2;
        node.x = Math.cos(angle) * distanceFromCenter;
        node.y = Math.sin(angle) * distanceFromCenter;
      });

      const nodesMapForTooltip = new Map<string, any>();
      scaledNodes.forEach(node => {
        nodesMapForTooltip.set(node.id, node);
      });

      // Store links in ref for event handlers
      linksRef.current = links;

      setOption({
        visualMap: {
          type: 'continuous',
          min: 0,
          max: maxValue,
          show: false,
          dimension: 0,
          inRange: {
            symbolSize: [8, 70],
          },
        },
        title: {
          text: 'CCTP Network Volume Graph',
          subtext: `Volume flows between chains (${period})`,
          top: 'top',
          left: 'center',
          textStyle: {
            color: '#fff',
            fontSize: 18,
          },
          subtextStyle: {
            color: '#94a3b8',
            fontSize: 12,
          },
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              // value is already in dollars (from valueInDollars)
              const volume = Array.isArray(params.data.value) ? params.data.value[0] : params.data.value;
              return `
                <div style="padding: 8px;">
                  <strong>${params.data.name}</strong><br/>
                  Volume: $${volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              `;
            } else if (params.dataType === 'edge') {
              // value is in micro-USDC, convert to dollars
              const volume = params.data.value / 1e6;
              const sourceNode = nodesMapForTooltip.get(params.data.source);
              const targetNode = nodesMapForTooltip.get(params.data.target);
              const sourceName = sourceNode?.name || params.data.source;
              const targetName = targetNode?.name || params.data.target;
              return `
                <div style="padding: 8px;">
                  <strong>${sourceName} → ${targetName}</strong><br/>
                  Volume: $${volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              `;
            }
            return '';
          },
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          textStyle: {
            color: '#fff',
          },
        },
        legend: [
          {
            data: ['Chains'],
            selectedMode: false,
            textStyle: {
              color: '#94a3b8',
            },
          },
        ],
        animationDuration: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            name: 'CCTP Network',
            type: 'graph',
            layout: 'force',
            data: scaledNodes,
            links: links,
            categories: [{ name: 'Chains' }],
            roam: true,
            label: {
              show: true,
              position: 'right',
              formatter: '{b}',
              color: '#fff',
              fontSize: 12,
            },
            labelLayout: {
              hideOverlap: true,
            },
            lineStyle: {
              curveness: 0.3,
            },
            emphasis: {
              focus: 'none', // Disable default to handle manually
              lineStyle: {
                width: 10,
              },
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold',
              },
            },
            blur: {
              label: {
                show: false,
              },
              lineStyle: {
                opacity: 0.1,
              },
            },
            force: {
              repulsion: 300,
              gravity: 0.2,
              edgeLength: 150,
              layoutAnimation: true,
              initLayout: 'circular',
            },
          },
        ],
      });
    } catch (err: any) {
      console.error('VolumeGraph: Error loading graph data', err);
      setError(err?.message || 'Failed to load graph data');
      setOption(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: '#1e293b',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #334155',
        width: '100%',
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 'bold', color: '#fff' }}>
          Network Volume Graph
        </h3>
        <div style={{
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
        }}>
          Loading graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#1e293b',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #334155',
        width: '100%',
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 'bold', color: '#fff' }}>
          Network Volume Graph
        </h3>
        <div style={{
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontWeight: 'bold' }}>Error loading graph</div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!option) {
    return (
      <div style={{
        background: '#1e293b',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #334155',
        width: '100%',
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 'bold', color: '#fff' }}>
          Network Volume Graph
        </h3>
        <div style={{
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
        }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #334155',
      width: '100%',
    }}>
      <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 'bold', color: '#fff' }}>
        Network Volume Graph
      </h3>
      <div style={{ height: '600px', width: '100%' }}>
        <ReactECharts
          ref={chartRef}
          key={`${period}-${option?.series?.[0]?.data?.length || 0}-${option?.series?.[0]?.links?.length || 0}`}
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={false}
          onEvents={{
            mouseover: (params: any) => {
              // Only apply node hover effect if we're hovering a node (not an edge)
              if (params.dataType === 'node' && chartRef.current) {
                const chart = chartRef.current.getEchartsInstance();
                const nodeId = params.data.id;

                // Find all outgoing links from this node
                linksRef.current.forEach((link: GraphLink, index: number) => {
                  if (link.source === nodeId) {
                    // Highlight outgoing links
                    chart.dispatchAction({
                      type: 'highlight',
                      seriesIndex: 0,
                      dataIndex: index,
                      dataType: 'edge',
                    });
                  } else {
                    // Blur all other links (incoming and unrelated)
                    chart.dispatchAction({
                      type: 'downplay',
                      seriesIndex: 0,
                      dataIndex: index,
                      dataType: 'edge',
                    });
                  }
                });
              }
            },
            mouseout: (params: any) => {
              // When leaving a node, reset all link highlights
              if (params.dataType === 'node' && chartRef.current) {
                const chart = chartRef.current.getEchartsInstance();
                // Reset all links to normal state
                linksRef.current.forEach((_link: GraphLink, index: number) => {
                  chart.dispatchAction({
                    type: 'downplay',
                    seriesIndex: 0,
                    dataIndex: index,
                    dataType: 'edge',
                  });
                });
              }
            },
          }}
        />
      </div>
    </div>
  );
};

const VolumeGraphWithErrorBoundary: React.FC<VolumeGraphProps> = (props) => (
  <GraphErrorBoundary>
    <VolumeGraph {...props} />
  </GraphErrorBoundary>
);

export default VolumeGraphWithErrorBoundary;

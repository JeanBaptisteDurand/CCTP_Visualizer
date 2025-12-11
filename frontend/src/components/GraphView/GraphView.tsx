/**
 * Main graph visualization component using react-force-graph-2d
 */

import React, { useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Transfer, TransferMode, TokenType } from '../../types/transfer';
import { createGraphLayout, getCurrentEdge } from './GraphLayout';

interface GraphViewProps {
  transfers: Transfer[];
  width: number;
  height: number;
}

const GraphView: React.FC<GraphViewProps> = ({ transfers, width, height }) => {
  const graphRef = useRef<any>();

  // Create static graph layout
  const graphData = useMemo(() => createGraphLayout(), []);

  // Calculate particle positions based on transfers
  const particles = useMemo(() => {
    return transfers.map(transfer => {
      const edge = getCurrentEdge(
        transfer.sourceDomain,
        transfer.destinationDomain,
        transfer.status
      );

      if (!edge) return null;

      // Determine color based on token type and mode
      let color = '#3b82f6'; // Default blue for USDC
      if (transfer.tokenType === TokenType.USYC) {
        color = '#10b981'; // Green for USYC
      }

      if (transfer.mode === TransferMode.FAST) {
        color = color + 'ff'; // Full opacity for fast
      } else {
        color = color + 'aa'; // Slightly transparent for standard
      }

      // Size based on amount (log scale)
      const amount = parseFloat(transfer.amount) / 1e6; // Convert to USDC/USYC units
      const size = Math.max(3, Math.min(12, Math.log10(amount + 1) * 2));

      return {
        id: transfer.transferId,
        source: edge.source,
        target: edge.target,
        color,
        size,
        mode: transfer.mode,
        tokenType: transfer.tokenType,
        amount: transfer.amount,
        status: transfer.status
      };
    }).filter(Boolean);
  }, [transfers]);

  // Center graph on mount
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 1000);
      graphRef.current.zoom(1.5, 1000);
    }
  }, []);

  // Custom node rendering
  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D) => {
    const label = node.name;
    const fontSize = 10;
    const nodeSize = node.size || 8;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = node.color || '#64748b';
    ctx.fill();

    // Draw label
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, node.x, node.y - nodeSize - 5);
  };

  // Custom link rendering
  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;

    // Draw link line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = link.color || '#64748b';
    ctx.lineWidth = link.width || 1;
    ctx.stroke();

    // Draw particles for active transfers
    const relevantParticles = particles.filter(
      p => p && p.source === link.source.id && p.target === link.target.id
    );

    relevantParticles.forEach((particle, index) => {
      if (!particle) return;

      // Calculate position along link (animated based on time)
      const progress = ((Date.now() / 2000) + (index * 0.3)) % 1;
      const x = start.x + (end.x - start.x) * progress;
      const y = start.y + (end.y - start.y) * progress;

      // Draw particle
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, 2 * Math.PI);
      ctx.fillStyle = particle.color;
      ctx.fill();

      // Add glow for fast transfers
      if (particle.mode === TransferMode.FAST) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  };

  return (
    <div style={{ background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        linkCanvasObjectMode={() => 'replace'}
        enableNodeDrag={false}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        backgroundColor="#0f172a"
        cooldownTicks={0}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        nodeLabel={(node: any) => `
          <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; color: white;">
            <strong>${node.name}</strong><br/>
            ${node.domain !== undefined ? `Domain: ${node.domain}` : ''}
          </div>
        `}
      />
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(15, 23, 42, 0.9)',
        padding: '16px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Legend</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', marginRight: '8px' }} />
          USDC Transfer
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', marginRight: '8px' }} />
          USYC Transfer
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6', marginRight: '8px' }} />
          Fast Transfer
        </div>
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
          Particle size = transfer amount<br/>
          {transfers.length} active transfer(s)
        </div>
      </div>
    </div>
  );
};

export default GraphView;


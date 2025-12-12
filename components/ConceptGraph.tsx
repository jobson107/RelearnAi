
import React, { useEffect, useRef } from 'react';
import { ConceptMapData } from '../types';

interface ConceptGraphProps {
  data: ConceptMapData;
}

export const ConceptGraph: React.FC<ConceptGraphProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.nodes.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let nodes = data.nodes.map(n => ({
      ...n,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0
    }));

    const links: { source: number; target: number }[] = [];
    nodes.forEach((node, i) => {
      node.connections.forEach(targetId => {
        const targetIndex = nodes.findIndex(n => n.id === targetId);
        if (targetIndex !== -1) links.push({ source: i, target: targetIndex });
      });
    });

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      nodes.forEach(node => {
        // Center gravity
        const dx = canvas.width / 2 - node.x;
        const dy = canvas.height / 2 - node.y;
        node.vx += dx * 0.001;
        node.vy += dy * 0.001;
        
        // Repulsion
        nodes.forEach(other => {
          if (node !== other) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100 && dist > 0) {
              node.vx += (dx / dist) * 0.5;
              node.vy += (dy / dist) * 0.5;
            }
          }
        });

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.9;
        node.vy *= 0.9;
      });

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 2;
      links.forEach(link => {
        const source = nodes[link.source];
        const target = nodes[link.target];
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      });

      nodes.forEach(node => {
        ctx.beginPath();
        const radius = Math.max(5, node.importance * 1.5);
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.importance > 7 ? '#8b5cf6' : '#6366f1';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1e293b';
        ctx.font = '10px sans-serif';
        ctx.fillText(node.label, node.x + radius + 4, node.y + 4);
      });

      requestAnimationFrame(animate);
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [data]);

  return (
    <div className="w-full h-[300px] bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
      <canvas ref={canvasRef} width={800} height={300} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm">
        Knowledge Graph (AI Generated)
      </div>
    </div>
  );
};

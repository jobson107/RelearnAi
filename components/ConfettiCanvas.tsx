
import React, { useEffect, useRef } from 'react';

const ConfettiCanvas: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const animationFrameId = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      particles.current = [];
      cancelAnimationFrame(animationFrameId.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#fbbf24'];

    // Create particles
    for (let i = 0; i < 150; i++) {
      particles.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2 + 100, // Start slightly lower
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 1) * 20 - 5, // Upward burst
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.5,
        drag: 0.96,
        opacity: 1
      });
    }

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p, index) => {
        // Physics
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.005;

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        // Remove dead particles
        if (p.opacity <= 0 || p.y > canvas.height) {
          particles.current.splice(index, 1);
        }
      });

      if (particles.current.length > 0) {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animationFrameId.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
};

export default ConfettiCanvas;

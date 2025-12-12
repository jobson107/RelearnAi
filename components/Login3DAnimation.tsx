
import React, { useRef, useEffect } from 'react';

export const Login3DAnimation: React.FC<{ triggerBurst: boolean }> = ({ triggerBurst }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = 100;
    const radius = 60;
    
    // Init particles
    if (particlesRef.current.length === 0) {
      for(let i=0; i<count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        particlesRef.current.push({
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          vx: 0, vy: 0, vz: 0
        });
      }
    }

    let angle = 0;
    const animate = () => {
      ctx.clearRect(0, 0, 300, 300);
      const cx = 150, cy = 150;
      angle += 0.01;

      particlesRef.current.forEach(p => {
        // Burst logic
        if(triggerBurst) {
            p.x += p.x * 0.1;
            p.y += p.y * 0.1;
            p.z += p.z * 0.1;
        } else {
            // Return to sphere
            const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
            if(d > radius) {
                p.x *= 0.95; p.y *= 0.95; p.z *= 0.95;
            }
        }

        // Rotation
        const x1 = p.x * Math.cos(angle) - p.z * Math.sin(angle);
        const z1 = p.z * Math.cos(angle) + p.x * Math.sin(angle);
        const scale = 300 / (300 + z1);
        
        ctx.beginPath();
        ctx.arc(cx + x1 * scale, cy + p.y * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 100, 255, ${scale * 0.8})`;
        ctx.fill();
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(requestRef.current);
  }, [triggerBurst]);

  return <canvas ref={canvasRef} width={300} height={300} className="w-[300px] h-[300px] pointer-events-none" />;
};

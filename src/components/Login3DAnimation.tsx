
import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
}

interface Login3DAnimationProps {
  triggerBurst: boolean;
}

export const Login3DAnimation: React.FC<Login3DAnimationProps> = ({ triggerBurst }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const burstStateRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const particleCount = 120;
    const radius = 60;
    const colors = ['#7A5FFF', '#00D4FF', '#FFFFFF'];
    let rotationY = 0;
    let rotationX = 0;

    // Initialize Particles on a sphere
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < particleCount; i++) {
        // Golden Angle distribution for even sphere coverage
        const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        particlesRef.current.push({
          x, y, z,
          baseX: x, baseY: y, baseZ: z,
          vx: 0, vy: 0, vz: 0,
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Calculate normalized mouse position (-1 to 1) relative to canvas center
      mouseRef.current = {
        x: (e.clientX - rect.left - rect.width / 2) / (rect.width / 2),
        y: (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Smooth rotation logic
      // Auto rotate + Parallax based on mouse
      rotationY += 0.005;
      const targetRotX = mouseRef.current.y * 0.5;
      const targetRotY = mouseRef.current.x * 0.5;
      
      // Interpolate current parallax rotation
      rotationX += (targetRotX - rotationX) * 0.05;
      // We add auto-rotation to Y, so we add parallax offset implicitly by not overwriting rotationY completely, 
      // but simpler to just use mouse for tilt (X) and let Y spin.
      
      // Draw Core "Glass" Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, 'rgba(122, 95, 255, 0.2)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Sort particles by Z depth for correct occlusion/layering
      particlesRef.current.sort((a, b) => b.z - a.z);

      particlesRef.current.forEach(p => {
        // 1. Rotation Logic (Euler angles)
        // Rotate around Y
        let x1 = p.x * Math.cos(rotationY) - p.z * Math.sin(rotationY);
        let z1 = p.z * Math.cos(rotationY) + p.x * Math.sin(rotationY);
        
        // Rotate around X (Tilt)
        let y1 = p.y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
        let z2 = z1 * Math.cos(rotationX) + p.y * Math.sin(rotationX);

        // Apply Burst Velocity
        if (burstStateRef.current) {
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            // Dampen velocity to return/stop
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.vz *= 0.95;

            // Return force (spring back to original shape)
            const dx = p.baseX - p.x;
            const dy = p.baseY - p.y;
            const dz = p.baseZ - p.z;
            
            p.x += dx * 0.05;
            p.y += dy * 0.05;
            p.z += dz * 0.05;
        }

        // 3D Projection
        const perspective = 300;
        const scale = perspective / (perspective + z2);
        const x2d = x1 * scale + centerX;
        const y2d = y1 * scale + centerY;

        // Draw Particle
        const alpha = Math.max(0.1, Math.min(1, (z2 + radius) / (2 * radius))); // Fade back particles
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Optional: Connect lines for "mesh" look if close
        // (Skipped for performance/clean look as requested "orb particles")
      });
      ctx.globalAlpha = 1;

      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Handle Burst Trigger
  useEffect(() => {
    if (triggerBurst && !burstStateRef.current) {
        burstStateRef.current = true;
        // Explode particles outward
        particlesRef.current.forEach(p => {
            p.vx = (Math.random() - 0.5) * 15;
            p.vy = (Math.random() - 0.5) * 15;
            p.vz = (Math.random() - 0.5) * 15;
        });

        // Reset burst state after animation allows return
        setTimeout(() => {
            burstStateRef.current = false;
        }, 1000);
    }
  }, [triggerBurst]);

  return (
    <div className="w-full h-40 flex items-center justify-center pointer-events-none -mb-10 relative z-20">
        <canvas 
            ref={canvasRef} 
            width={300} 
            height={300}
            className="w-[300px] h-[300px]"
        />
        {/* Soft Bloom overlay in CSS for extra glow */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full transform scale-50 pointer-events-none"></div>
    </div>
  );
};

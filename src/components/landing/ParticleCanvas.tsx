'use client';

import { useTheme } from '@/lib/theme';
import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
}

interface Connection {
  from: number;
  to: number;
  alpha: number;
}

export default function ParticleCanvas() {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const initParticles = useCallback((width: number, height: number) => {
    const count = Math.min(Math.floor((width * height) / 12000), 120);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        alpha: 0,
        targetAlpha: Math.random() * 0.5 + 0.2,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      initParticles(canvas.offsetWidth, canvas.offsetHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let frame = 0;
    const animate = () => {
      frame++;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Fade in
        if (p.alpha < p.targetAlpha) p.alpha += 0.005;

        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }

        // Dampen velocity
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
        p.vy = Math.max(-1.5, Math.min(1.5, p.vy));

        const dark = isDarkRef.current;
        const particleColor = dark ? '99, 102, 241' : '59, 130, 246';
        const glowColor = dark ? '99, 102, 241' : '99, 102, 241';

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${p.alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        g.addColorStop(0, `rgba(${glowColor}, ${p.alpha * (dark ? 0.3 : 0.2)})`);
        g.addColorStop(1, `rgba(${glowColor}, 0)`);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Draw connections (only every 2nd frame for perf)
      if (frame % 2 === 0) {
        const conns: Connection[] = [];
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 120) {
              conns.push({ from: i, to: j, alpha: (1 - d / 120) * 0.25 });
            }
          }
        }
        connectionsRef.current = conns;
      }

      const connColor = isDarkRef.current ? '139, 92, 246' : '124, 58, 237';
      for (const c of connectionsRef.current) {
        const a = particles[c.from];
        const b = particles[c.to];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${connColor}, ${c.alpha * (isDarkRef.current ? 1 : 0.7)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Draw mouse glow ring
      const mdx = mx - 1000;
      if (Math.abs(mdx) > 10) {
        ctx.beginPath();
        ctx.arc(mx, my, 60, 0, Math.PI * 2);
        const g2 = ctx.createRadialGradient(mx, my, 0, mx, my, 60);
        const glowAlpha = isDarkRef.current ? 0.08 : 0.06;
        g2.addColorStop(0, `rgba(99, 102, 241, ${glowAlpha})`);
        g2.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = g2;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ background: 'transparent' }}
    />
  );
}

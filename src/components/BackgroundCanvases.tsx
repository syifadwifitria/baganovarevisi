/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Background Canvas & Futuristic Maritime Particles
 */

import React, { useEffect, useRef } from 'react';

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      hue: number;
    }> = [];

    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.5 - 0.15,
        alpha: Math.random() * 0.5 + 0.2,
        hue: Math.random() > 0.5 ? 175 : 195 // Aqua cyan / sea mint
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0 || p.x < 0 || p.x > width) {
          p.x = Math.random() * width;
          p.y = height + 10;
        }

        ctx.save();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 55%, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.8)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="particleCanvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.45
        }}
      />
      {/* Floating Tech Symbols */}
      <div className="tech-symbol tech-1">⚡</div>
      <div className="tech-symbol tech-2">⚓</div>
      <div className="tech-symbol tech-3">⚙️</div>
      <div className="tech-symbol tech-4">⚖️</div>
      <div className="tech-symbol tech-5">🔌</div>
      <div className="tech-symbol tech-6">📡</div>
      <div className="tech-symbol tech-7">🎛️</div>
      <div className="tech-symbol tech-8">🎯</div>
    </>
  );
};

export const HeroAquaticCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let animId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      width = canvas.width = parent?.clientWidth || window.innerWidth;
      height = canvas.height = parent?.clientHeight || 680;
    };
    window.addEventListener('resize', resize);
    resize();

    // Realistic schooling pelagic fish & anchovies swimming in underwater zone (y >= 46% height)
    interface SwimmingFish {
      x: number;
      yNorm: number; // normalized vertical band (0.47 - 0.94)
      size: number;
      speed: number;
      dir: 1 | -1;
      phase: number;
      tailSpeed: number;
      depth: number; // 0 = far, 1 = mid, 2 = near
      bobAmp: number;
      tint: 'silver' | 'aqua' | 'teal';
    }

    const fishSchool: SwimmingFish[] = [];
    const totalFish = 34;

    for (let i = 0; i < totalFish; i++) {
      const depth = i % 3; // 0, 1, 2
      const dir: 1 | -1 = i % 5 === 0 ? -1 : 1; // cohesive dominant school direction + natural counter-swimmers
      const baseSize = depth === 2 ? 15 + Math.random() * 7 : depth === 1 ? 10 + Math.random() * 5 : 6.5 + Math.random() * 3.5;
      fishSchool.push({
        x: Math.random() * (width || 1280),
        yNorm: 0.48 + Math.random() * 0.45,
        size: baseSize,
        speed: (depth === 2 ? 0.95 : depth === 1 ? 0.65 : 0.42) * (0.85 + Math.random() * 0.45),
        dir,
        phase: Math.random() * Math.PI * 2,
        tailSpeed: 0.14 + Math.random() * 0.08,
        depth,
        bobAmp: 3 + Math.random() * 6,
        tint: i % 4 === 0 ? 'aqua' : i % 3 === 0 ? 'teal' : 'silver'
      });
    }

    // Fine underwater micro-bubbles
    const bubbles: Array<{
      x: number;
      y: number;
      radius: number;
      speedY: number;
      wobble: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 36; i++) {
      bubbles.push({
        x: Math.random() * (width || 1280),
        y: (height || 680) * (0.45 + Math.random() * 0.55),
        radius: Math.random() * 2.2 + 0.7,
        speedY: Math.random() * 0.55 + 0.25,
        wobble: Math.random() * 6,
        alpha: 0.15 + Math.random() * 0.28
      });
    }

    const drawFish = (fish: SwimmingFish, step: number, isDark: boolean) => {
      const yBase = fish.yNorm * height + Math.sin(step * 0.65 + fish.phase) * fish.bobAmp;
      const tailSwing = Math.sin(step * (fish.tailSpeed * 18) + fish.phase) * 0.34;
      const len = fish.size;
      const h = len * 0.28;

      ctx.save();
      ctx.translate(fish.x, yBase);
      ctx.scale(fish.dir, 1);

      // Subtle depth opacity
      const baseAlpha = fish.depth === 2 ? 0.78 : fish.depth === 1 ? 0.58 : 0.38;
      const lightAlpha = fish.depth === 2 ? 0.62 : fish.depth === 1 ? 0.45 : 0.28;
      ctx.globalAlpha = isDark ? baseAlpha : lightAlpha;

      // Color palette harmonizing with underwater scene
      let bodyColor = isDark ? '#cbd5e1' : '#0f3b5c';
      let highlightColor = isDark ? '#67e8f9' : '#0284c7';
      if (fish.tint === 'aqua') {
        bodyColor = isDark ? '#a5f3fc' : '#0369a1';
        highlightColor = isDark ? '#00e5d0' : '#0d9488';
      } else if (fish.tint === 'teal') {
        bodyColor = isDark ? '#99f6e4' : '#0f766e';
        highlightColor = isDark ? '#e0f2fe' : '#38bdf8';
      }

      // 1. Articulated forked tail fin
      ctx.save();
      ctx.translate(-len * 0.48, 0);
      ctx.rotate(tailSwing);
      ctx.fillStyle = highlightColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-len * 0.32, -h * 0.95);
      ctx.lineTo(-len * 0.2, 0);
      ctx.lineTo(-len * 0.32, h * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Streamlined fish body
      const bodyGrad = ctx.createLinearGradient(len * 0.5, -h, -len * 0.5, h);
      bodyGrad.addColorStop(0, highlightColor);
      bodyGrad.addColorStop(0.55, bodyColor);
      bodyGrad.addColorStop(1, isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(12, 35, 64, 0.65)');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(len * 0.52, 0); // snout
      ctx.bezierCurveTo(len * 0.28, -h * 1.05, -len * 0.18, -h * 0.9, -len * 0.5, -h * 0.18);
      ctx.lineTo(-len * 0.5, h * 0.18);
      ctx.bezierCurveTo(-len * 0.18, h * 0.9, len * 0.28, h * 1.05, len * 0.52, 0);
      ctx.closePath();
      ctx.fill();

      // 3. Subtle dorsal fin
      ctx.fillStyle = highlightColor;
      ctx.beginPath();
      ctx.moveTo(len * 0.05, -h * 0.72);
      ctx.lineTo(-len * 0.16, -h * 1.28);
      ctx.lineTo(-len * 0.24, -h * 0.62);
      ctx.closePath();
      ctx.fill();

      // 4. Tiny eye glint on larger foreground fish
      if (fish.depth === 2) {
        ctx.fillStyle = isDark ? '#ffffff' : '#e0f2fe';
        ctx.beginPath();
        ctx.arc(len * 0.34, -h * 0.18, Math.max(1, len * 0.045), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    let step = 0;
    const render = () => {
      step += 0.03;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

      // Subtle underwater attractant light rays radiating down from the center bagan lamp
      ctx.save();
      const rayGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.44,
        12,
        width * 0.5,
        height * 0.76,
        width * 0.45
      );
      if (isDark) {
        rayGrad.addColorStop(0, 'rgba(0, 229, 208, 0.16)');
        rayGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.07)');
        rayGrad.addColorStop(1, 'rgba(4, 16, 34, 0)');
      } else {
        rayGrad.addColorStop(0, 'rgba(0, 229, 208, 0.14)');
        rayGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.06)');
        rayGrad.addColorStop(1, 'rgba(240, 249, 255, 0)');
      }
      ctx.fillStyle = rayGrad;
      ctx.fillRect(0, height * 0.4, width, height * 0.6);
      ctx.restore();

      // Draw & advance schooling fish
      fishSchool.forEach((f) => {
        if (!prefersReducedMotion) {
          f.x += f.speed * f.dir;
          if (f.dir === 1 && f.x > width + f.size * 2) {
            f.x = -f.size * 2;
            f.yNorm = 0.48 + Math.random() * 0.45;
          } else if (f.dir === -1 && f.x < -f.size * 2) {
            f.x = width + f.size * 2;
            f.yNorm = 0.48 + Math.random() * 0.45;
          }
        }
        drawFish(f, step, isDark);
      });

      // Draw fine rising micro-bubbles in underwater zone
      ctx.save();
      bubbles.forEach((b) => {
        if (!prefersReducedMotion) {
          b.y -= b.speedY;
          b.x += Math.sin(step + b.wobble) * 0.35;
          if (b.y < height * 0.44) {
            b.y = height + 8;
            b.x = Math.random() * width;
          }
        }
        ctx.fillStyle = isDark
          ? `rgba(165, 243, 252, ${b.alpha})`
          : `rgba(2, 132, 199, ${b.alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="video-background hero-fish-canvas" aria-hidden="true" />;
};

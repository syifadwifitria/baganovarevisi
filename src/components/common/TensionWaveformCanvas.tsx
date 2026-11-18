/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Real-Time Tension Waveform Canvas
 * Visualizes 20 Hz Load Cell Telemetry with Digital Moving Average Filter (MA-15)
 */

import React, { useEffect, useRef } from 'react';
import { useBagan } from '../../context/BaganContext';

export const TensionWaveformCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { activeBagan, marineData, isLiveMarineSync } = useBagan();
  const { loadSensor, technical } = activeBagan;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Deep oscilloscope background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#031422');
      bgGrad.addColorStop(1, '#010a12');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 208, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Mapping 0 to 140 kg
      const maxKg = 140;
      const paddingY = 36;
      const graphH = height - paddingY * 2;

      const getY = (kg: number) => {
        const clamped = Math.max(0, Math.min(maxKg, kg));
        return height - paddingY - (clamped / maxKg) * graphH;
      };

      // 1. Target Threshold Line (Electric Aqua Cyan)
      const targetY = getY(loadSensor.targetThreshold);
      ctx.save();
      ctx.strokeStyle = '#00e5d0';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 5]);
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(0, 229, 208, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(width, targetY);
      ctx.stroke();
      ctx.fillStyle = '#00e5d0';
      ctx.font = '700 11px JetBrains Mono, monospace';
      ctx.fillText(
        `AMBANG BATAS PEMICU: ${loadSensor.targetThreshold.toFixed(1)} KG`,
        20,
        targetY - 8
      );
      ctx.restore();

      // 2. Baseline Tare Line (Sea Mint)
      const baselineY = getY(loadSensor.baselineTare);
      ctx.save();
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();
      ctx.fillStyle = '#2dd4bf';
      ctx.font = '700 10px JetBrains Mono, monospace';
      ctx.fillText(
        `TARA JARING KOSONG: ${loadSensor.baselineTare.toFixed(1)} KG`,
        20,
        baselineY - 6
      );
      ctx.restore();

      // 3. Raw Signal Waveform (Wave + Ocean Current disturbance noise)
      const points = loadSensor.historyWaveform;
      if (points.length > 1) {
        const stepX = width / (points.length - 1);

        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = i * stepX;
          const y = getY(p.raw);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();

        // 4. Filtered Signal Line (Glowing Neon Aqua Cyan)
        ctx.save();
        ctx.strokeStyle = '#00e5d0';
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 16;
        ctx.shadowColor = 'rgba(0, 229, 208, 0.9)';
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = i * stepX;
          const y = getY(p.filtered);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Glowing dot on current point
        const lastX = (points.length - 1) * stepX;
        const lastY = getY(points[points.length - 1].filtered);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00e5d0';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [loadSensor]);

  return (
    <div className="camera-monitor-box">
      <canvas
        ref={canvasRef}
        width={800}
        height={480}
        className="camera-canvas"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Top HUD Overlay */}
      <div className="camera-hud-top">
        <div className="hud-tag">
          <span className="hud-pulse"></span>
          <span>
            {activeBagan.id} [ESP32 & S-BEAM INLINE LOAD CELL]
          </span>
        </div>
        <div className="hud-stats">
          <span>SAMPLING: {technical.samplingRateHz} Hz</span>
          <span>FILTER: MOVING AVERAGE ({loadSensor.filterWindow} SAMPEL)</span>
        </div>
      </div>

      {/* Bottom HUD Overlay */}
      <div className="camera-hud-bottom">
        <span>
          <i className="fas fa-water"></i>{' '}
          {isLiveMarineSync && marineData
            ? `ARUS REAL: ${marineData.currentVelocityMs.toFixed(2)} m/s (${marineData.currentDirectionDeg}°) · OMBAK ${marineData.waveHeightM.toFixed(2)} m · T ${marineData.wavePeriodSec.toFixed(1)}s`
            : 'SATUAN: KG / NEWTON | MODE SIMULASI MANUAL'}
        </span>
        <span className="hud-pill">
          {isLiveMarineSync && marineData ? 'LIVE ARUS LAUT' : activeBagan.status === 'online' ? 'LIVE TELEMETRI' : 'STANDBY'}
        </span>
      </div>
    </div>
  );
};

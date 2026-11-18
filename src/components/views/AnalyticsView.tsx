/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — System Analytics & Filter Performance View
 */

import React from 'react';
import { useBagan } from '../../context/BaganContext';

export const AnalyticsView: React.FC = () => {
  const { activeBagan, activeBaganId, bagans, selectBagan, setCurrentView } = useBagan();
  const { analytics, history, loadSensor, technical } = activeBagan;

  // SVG Chart Calculation
  const chartWidth = 540;
  const chartHeight = 220;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const graphW = chartWidth - padding.left - padding.right;
  const graphH = chartHeight - padding.top - padding.bottom;
  const maxVal = 120;

  const targetThreshold = loadSensor.targetThreshold;
  const targetY = padding.top + (graphH - (targetThreshold / maxVal) * graphH);

  const displayHistory = history.slice(0, 6);
  const barW = Math.min(graphW / (displayHistory.length || 1) * 0.5, 46);

  const linePoints: string[] = [];

  return (
    <div style={{ paddingTop: '1.5rem' }}>
      {/* Page Banner Header */}
      <div className="page-banner-header">
        <div className="page-banner-container">
          <div className="page-breadcrumbs">
            <span
              onClick={() => setCurrentView('dashboard')}
              style={{ cursor: 'pointer', color: 'var(--primary)' }}
            >
              <i className="fas fa-th-large"></i> Armada Bagan
            </span>
            <span className="crumb-separator">
              <i className="fas fa-chevron-right"></i>
            </span>
            <span className="crumb-current">Analisis Sistem & Produktivitas</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <h1 className="page-banner-title">
                Analisis Respons & Kestabilan Otomatisasi
              </h1>
              <p className="page-banner-subtitle">
                Evaluasi Algoritma Penyaringan Ombak Laut dan Akurasi Titik Pemicuan Pengangkatan Bagan Tancap.
              </p>
            </div>

            <div className="bagan-switcher-box">
              <i className="fas fa-ship"></i>
              <div>
                <small className="bagan-switcher-label">
                  BAGAN DIANALISIS:
                </small>
                <select
                  value={activeBaganId}
                  onChange={(e) => selectBagan(e.target.value)}
                  className="bagan-switcher-select"
                >
                  {bagans.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SPLIT SECTION 3: ANALISIS SISTEM */}
      <section className="split-section" id="analysis">
        {/* Left: SVG Chart Card */}
        <div className="split-image bg-ocean-night">
          <div className="chart-display-card">
            <div className="chart-card-header">
              <h4>
                <i className="fas fa-chart-line"></i> PROFIL BEBAN: TARGET ({targetThreshold} KG) VS PEMBACAAN AKTUAL
              </h4>
              <span className="chart-pill">ANALISIS UJI LAUT</span>
            </div>

            <div id="chart" className="chart-canvas-area">
              {displayHistory.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: '#cbd5e1' }}>
                  Belum ada catatan riwayat uji coba untuk bagan ini.
                </p>
              ) : (
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="svg-trend-chart"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                >
                  <defs>
                    <linearGradient id="barCyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e5d0" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="#0284c7" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#0c2340" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={chartWidth - padding.right}
                    y2={padding.top}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3,3"
                  />
                  <line
                    x1={padding.left}
                    y1={padding.top + graphH * 0.5}
                    x2={chartWidth - padding.right}
                    y2={padding.top + graphH * 0.5}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3,3"
                  />
                  <line
                    x1={padding.left}
                    y1={padding.top + graphH}
                    x2={chartWidth - padding.right}
                    y2={padding.top + graphH}
                    stroke="rgba(255,255,255,0.2)"
                  />

                  {/* Y Axis Labels */}
                  <text
                    x={padding.left - 10}
                    y={padding.top + 4}
                    textAnchor="end"
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {maxVal} kg
                  </text>
                  <text
                    x={padding.left - 10}
                    y={padding.top + graphH * 0.5 + 3}
                    textAnchor="end"
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {maxVal / 2} kg
                  </text>
                  <text
                    x={padding.left - 10}
                    y={padding.top + graphH + 3}
                    textAnchor="end"
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    0 kg
                  </text>

                  {/* Target Threshold Line */}
                  <line
                    x1={padding.left}
                    y1={targetY}
                    x2={chartWidth - padding.right}
                    y2={targetY}
                    stroke="#2dd4bf"
                    strokeWidth="1.8"
                    strokeDasharray="6,4"
                  />
                  <text
                    x={chartWidth - padding.right - 4}
                    y={targetY - 5}
                    textAnchor="end"
                    fill="#2dd4bf"
                    fontSize="9"
                    fontWeight="700"
                  >
                    TARGET: {targetThreshold} KG
                  </text>

                  {/* Bars & Points */}
                  {displayHistory.map((d, i) => {
                    const x =
                      padding.left +
                      i * (graphW / (Math.min(displayHistory.length, 6) - 1 || 1)) -
                      barW / 2;
                    const barHeight = (d.triggerLoad / maxVal) * graphH;
                    const y = padding.top + (graphH - barHeight);
                    const centerX = x + barW / 2;
                    linePoints.push(`${centerX},${y}`);

                    return (
                      <g key={d.id} className="chart-bar-group">
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barHeight}
                          rx="4"
                          fill="url(#barCyanGrad)"
                        />
                        <line
                          x1={x}
                          y1={y}
                          x2={x + barW}
                          y2={y}
                          stroke="#00e5d0"
                          strokeWidth="2"
                        />
                        <text
                          x={centerX}
                          y={y - 8}
                          textAnchor="middle"
                          fill="#00e5d0"
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="'JetBrains Mono', monospace"
                        >
                          {d.triggerLoad} kg
                        </text>
                        <text
                          x={centerX}
                          y={chartHeight - 12}
                          textAnchor="middle"
                          fill="#cbd5e1"
                          fontSize="10"
                          fontWeight="600"
                          fontFamily="'Inter', sans-serif"
                        >
                          #{d.id} ({d.time.split(' ')[0]})
                        </text>
                      </g>
                    );
                  })}

                  {/* Trend Line */}
                  {linePoints.length > 1 && (
                    <polyline
                      points={linePoints.join(' ')}
                      fill="none"
                      stroke="#16d9e8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              )}
            </div>

            <div className="chart-recommendation-box" id="chartRecBox">
              <div className="rec-icon">
                <i className="fas fa-check-double"></i>
              </div>
              <div className="rec-text">
                <strong>Kinerja Otomatisasi Terverifikasi (100% Sukses):</strong>
                <p id="recMessage">
                  Seluruh {analytics.totalCyclesTested} siklus pengangkatan pada {activeBagan.name} berhasil dipicu oleh ambang batas beban tanpa kesalahan pemicuan ombak (*zero false trigger*) dan dihentikan presisi oleh sakelar batas atas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Metrics & System Summary */}
        <div className="split-content bg-ocean-teal">
          <span className="section-tag">
            <i className="fas fa-microchip"></i> EVALUASI KINERJA SISTEM
          </span>
          <h2>Akurasi Sensor & Waktu Respons Alat</h2>
          <p>
            Data evaluasi kuantitatif dari pengujian operasional bagan tancap. Menunjukkan efektivitas algoritma filter Moving Average dalam meredam gangguan gelombang laut serta presisi waktu respons motor winch saat target tercapai.
          </p>

          <div className="metrics-card-grid" id="analysisMetrics">
            <div className="analytic-stat-card">
              <span className="stat-lbl">Durasi Pengangkatan</span>
              <h3 className="stat-val" id="metricDurationVal">
                {analytics.avgDurationSec} dtk
              </h3>
              <small style={{ color: '#c7ecee' }}>Rata-rata dari dasar ke atas</small>
            </div>

            <div className="analytic-stat-card">
              <span className="stat-lbl">Waktu Respons ESP32</span>
              <h3 className="stat-val" id="metricResponseVal">
                {analytics.responseTimeSec} dtk
              </h3>
              <small style={{ color: '#c7ecee' }}>Verifikasi kestabilan beban</small>
            </div>

            <div className="analytic-stat-card">
              <span className="stat-lbl">Tingkat Keberhasilan</span>
              <h3 className="stat-val" id="metricSuccessVal">
                {analytics.successRatePct}%
              </h3>
              <small style={{ color: '#c7ecee' }}>
                {analytics.totalCyclesTested} / {analytics.totalCyclesTested} Pengujian Sukses
              </small>
            </div>
          </div>

          <div className="recent-activities-box">
            <h4>
              <i className="fas fa-wave-square"></i> Ringkasan Hasil Pengujian Lapangan:
            </h4>
            <div className="analysis-summary-list">
              <div className="analysis-item-row">
                <i className="fas fa-filter text-accent"></i>
                <div>
                  <strong>Peredaman Derau Ombak & Angin:</strong>
                  <p>
                    {technical.waveNoiseSpikesFiltered} spike gaya sentak gelombang laut berhasil diredam oleh Moving Average Window ({loadSensor.filterWindow} sampel) tanpa memicu motor secara keliru.
                  </p>
                </div>
              </div>

              <div className="analysis-item-row">
                <i className="fas fa-stop-circle text-accent"></i>
                <div>
                  <strong>Akurasi Sakelar Batas Atas (Limit Switch):</strong>
                  <p>
                    Toleransi pengereman batas atas terjaga pada simpangan &plusmn;2.5 cm sebelum menyentuh bibir struktur kayu/bambu pondok bagan.
                  </p>
                </div>
              </div>

              <div className="analysis-item-row">
                <i className="fas fa-balance-scale text-accent"></i>
                <div>
                  <strong>Deviasi Pengukuran Beban vs Beban Pembanding:</strong>
                  <p>
                    Tingkat akurasi pembacaan S-Beam load cell setelah kalibrasi memiliki deviasi hanya {analytics.accuracyDeviationPct}% dibandingkan timbangan referensi industri.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

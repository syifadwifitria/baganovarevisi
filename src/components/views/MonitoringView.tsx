/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Live Tension Monitoring & Sensor Telemetry View
 */

import React from 'react';
import { useBagan } from '../../context/BaganContext';
import { TensionWaveformCanvas } from '../common/TensionWaveformCanvas';

export const MonitoringView: React.FC = () => {
  const {
    activeBagan,
    activeBaganId,
    bagans,
    selectBagan,
    addFishWeight,
    triggerTargetLoad,
    tareBaseline,
    setCurrentView,
    marineData,
    marineLoading,
    marineRegion,
    isLiveMarineSync,
    setIsLiveMarineSync,
    refreshMarineConditions
  } = useBagan();

  const { loadSensor, technical, winch } = activeBagan;
  const currentKg = loadSensor.currentFiltered.toFixed(1);
  const currentNewton = (loadSensor.currentFiltered * 9.80665).toFixed(1);

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
            <span className="crumb-current">Monitoring Beban Tali Derek</span>
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
                Monitoring Gaya Tarik & Kestabilan Sensor
              </h1>
              <p className="page-banner-subtitle">
                Telemetri Real-Time 20 Hz dari S-Beam Load Cell pada Jalur Tali Derek Utama dengan Filter Digital Ombak ESP32.
              </p>
            </div>

            {/* Bagan Device Switcher */}
            <div className="bagan-switcher-box">
              <i className="fas fa-ship"></i>
              <div>
                <small className="bagan-switcher-label">
                  PERANGKAT AKTIF:
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

      {/* SPLIT SECTION: MONITORING BEBAN */}
      <section className="split-section" id="monitoring">
        {/* Left: Waveform Canvas */}
        <div className="split-image">
          <TensionWaveformCanvas />
        </div>

        {/* Right: Telemetry Controls & Readings */}
        <div className="split-content">
          <span className="section-tag">
            <i className="fas fa-weight-hanging"></i> PEMANTAUAN GAYA TARIK REAL-TIME
          </span>
          <h2>Telemetri Beban & Filter Gelombang</h2>
          <p>
            Sistem membaca gaya tarik aksial pada satu tali utama yang menghubungkan winch dengan rangka jaring. Dilengkapi algoritma penyaringan Moving Average untuk memisahkan gaya tarik ikan dari sentakan ombak dan hembusan angin laut.
          </p>

          {/* Primary Tension Hero Card */}
          <div className="tension-hero-card">
            <div className="tension-main-val">
              <small>GAYA TARIK AKTUAL PADA 1 TALI DEREK UTAMA</small>
              <div className="tension-number-row">
                <h2 id="currentTensionDisplay">{currentKg} kg</h2>
                <span className="tension-unit-tag" id="currentNewtonDisplay">
                  {currentNewton} N
                </span>
              </div>
              <div className="stability-row">
                <span className="stability-pill stable" id="sensorStabilityBadge">
                  <i className="fas fa-check-circle"></i> Sinyal Stabil ({loadSensor.stabilityPct}%)
                </span>
                <span className="baseline-note" id="baselineNote">
                  Baseline Tara Jaring Kosong: {loadSensor.baselineTare.toFixed(1)} kg
                </span>
              </div>
            </div>
          </div>

          {/* Simulation Controls for Evaluation & Demonstrations */}
          <div className="control-action-group">
            <button
              type="button"
              className="action-btn action-primary"
              id="btnSimulateFish"
              onClick={() => addFishWeight(15.0)}
              disabled={winch.motorState === 'raising'}
            >
              <i className="fas fa-arrow-trend-up"></i> Tambah Akumulasi Ikan (+15 kg)
            </button>
            <button
              type="button"
              className="action-btn action-accent"
              id="btnTriggerTarget"
              onClick={triggerTargetLoad}
              disabled={winch.motorState === 'raising'}
            >
              <i className="fas fa-bolt"></i> Picu Target ({loadSensor.targetThreshold} kg)
            </button>
            <button
              type="button"
              className="action-btn action-secondary"
              id="btnTareBaseline"
              onClick={tareBaseline}
            >
              <i className="fas fa-undo"></i> Reset ke Baseline ({loadSensor.baselineTare} kg)
            </button>
          </div>

          <div className="monitoring-metrics-row">
            <div className="metric-box">
              <span className="metric-label">Target Ambang Batas</span>
              <h3 id="displayTargetThreshold" style={{ color: '#2dd4bf' }}>
                {loadSensor.targetThreshold.toFixed(1)} kg
              </h3>
              <small style={{ color: '#e2e8f0' }}>Ambang pemicu penggulung winch</small>
            </div>
            <div className="metric-box">
              <span className="metric-label">Filter Ombak Digital</span>
              <h3 id="displayNoiseSuppression" style={{ color: '#00e5d0' }}>
                &plusmn;{loadSensor.noiseAmplitude.toFixed(1)} kg
              </h3>
              <small style={{ color: '#e2e8f0' }}>
                {technical.waveNoiseSpikesFiltered} spike gelombang diredam
              </small>
            </div>
          </div>

          {/* Live Ocean Current & Wave Integration Card */}
          <div
            style={{
              marginBottom: '16px',
              padding: '14px 16px',
              background: 'var(--card-bg)',
              borderRadius: '14px',
              border: '1px solid var(--card-border)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <i className="fas fa-satellite-dish" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
                Sumber Sinyal Ombak: {isLiveMarineSync ? 'Data Arus Laut Real (Open-Meteo Marine)' : 'Simulasi Manual'}
              </strong>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select
                  value={marineRegion}
                  onChange={(e) => void refreshMarineConditions(e.target.value, false)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="karangantu">Teluk Banten · Karangantu</option>
                  <option value="anyer">Selat Sunda · Anyer</option>
                  <option value="muara_angke">Teluk Jakarta · Muara Angke</option>
                  <option value="indramayu">Laut Jawa · Indramayu</option>
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsLiveMarineSync(!isLiveMarineSync)}
                  style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                >
                  {isLiveMarineSync ? 'Mode Real: Aktif' : 'Aktifkan Mode Real'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={marineLoading}
                  onClick={() => void refreshMarineConditions(marineRegion, true)}
                  style={{ padding: '4px 9px', fontSize: '0.76rem' }}
                  title="Perbarui data arus laut sekarang"
                >
                  <i className={`fas fa-sync-alt ${marineLoading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>

            {marineData ? (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Kecepatan Arus</span>
                    <strong style={{ color: 'var(--primary)' }}>
                      {marineData.currentVelocityMs.toFixed(2)} m/s ({marineData.currentVelocityKmh.toFixed(1)} km/j)
                    </strong>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Arah Arus / Ombak</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {marineData.currentDirectionDeg}° / {marineData.waveDirectionDeg}°
                    </strong>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Tinggi &amp; Periode Ombak</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {marineData.waveHeightM.toFixed(2)} m · {marineData.wavePeriodSec.toFixed(1)} s
                    </strong>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Suhu Permukaan Laut</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {marineData.seaSurfaceTempC.toFixed(1)}°C
                    </strong>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}
                >
                  <span>
                    <i className="fas fa-database" style={{ color: 'var(--primary)', marginRight: '5px' }}></i>
                    Sumber Data: <strong>{marineData.source}</strong> (Model oseanografi tanpa olah GEE manual)
                  </span>
                  <span>Pembaruan: {marineData.observedAt.replace('T', ' ')} WIB</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {marineLoading ? 'Mengambil data arus & gelombang laut dari Open-Meteo Marine API...' : 'Menunggu data arus laut...'}
              </div>
            )}
          </div>

          {/* Explanation Callout */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 229, 208, 0.3)',
              fontSize: '0.825rem',
              color: '#f1f5f9',
              lineHeight: 1.6
            }}
          >
            <i className="fas fa-shield-alt" style={{ color: '#00e5d0', marginRight: '6px' }}></i>
            <strong>Pencegah Pemicuan Palsu (Anti-False Trigger):</strong> Sistem tidak langsung mengangkat jaring hanya karena ada lonjakan sesaat dari ayunan ombak tinggi. ESP32 memverifikasi bahwa beban telah melampaui <strong>{loadSensor.targetThreshold} kg</strong> dan nilainya bertahan stabil selama minimal <strong>{loadSensor.stabilityDwellSec} detik</strong> berturut-turut sebelum relay motor diaktifkan.
          </div>

          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCurrentView('control');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <i className="fas fa-sliders-h"></i> Buka Skematik & Kendali Jaring Bagan
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

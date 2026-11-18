/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Winch Motor Control & Mechanical Bagan Visualizer View
 */

import React from 'react';
import { useBagan } from '../../context/BaganContext';
import { BaganSchematic } from '../common/BaganSchematic';

export const ControlView: React.FC = () => {
  const {
    activeBagan,
    activeBaganId,
    bagans,
    selectBagan,
    startAutoHoist,
    startLowerNet,
    triggerEStop,
    resetEStop,
    setCurrentView
  } = useBagan();

  const { winch, loadSensor } = activeBagan;
  const isRaising = winch.motorState === 'raising';
  const isLowering = winch.motorState === 'lowering';
  const isStoppedAtTop = winch.netPosition === 'top';
  const isEStop = winch.motorState === 'estop';
  const isLimitSwitchActive = winch.limitSwitchTop;

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
            <span className="crumb-current">Kendali Motor & Jaring Bagan</span>
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
                Kendali Motor Winch & Mekanisme Bagan
              </h1>
              <p className="page-banner-subtitle">
                Pengangkatan Otomatis Ambang Batas, Penurunan Jaring Manual Terverifikasi, dan Proteksi Limit Switch Mekanis.
              </p>
            </div>

            {/* Bagan Switcher */}
            <div className="bagan-switcher-box">
              <i className="fas fa-ship"></i>
              <div>
                <small className="bagan-switcher-label">
                  BAGAN YANG DIKENDALIKAN:
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

      {/* SPLIT SECTION 2: KONTROL JARING & VISUALISASI MEKANISME ALAT */}
      <section className="split-section" id="control">
        {/* Left: Controls & Hardware Status */}
        <div className="split-content bg-purple">
          <span className="section-tag">
            <i className="fas fa-sliders-h"></i> KENDALI MOTOR & MEKANISME WINCH
          </span>
          <h2>Kontrol Pengangkatan & Penurunan Jaring</h2>
          <p>
            Pengangkatan jaring bekerja secara otomatis saat beban target (<strong>{loadSensor.targetThreshold} kg</strong>) tercapai dan stabil. Untuk penurunan jaring kembali ke perairan, dilakukan secara manual melalui tombol kendali oleh operator bagan demi keselamatan dan pencegahan tali kusut.
          </p>

          {/* Motor Winch Status Card */}
          <div className="hardware-card">
            <div className="hardware-info">
              <div
                className="hw-icon"
                id="motorIcon"
                style={{
                  color: isRaising ? '#00e5d0' : isLowering ? '#38bdf8' : isEStop ? '#ef4444' : '#a5f3fc'
                }}
              >
                <i className={`fas fa-cog ${isRaising || isLowering ? 'fa-spin' : ''}`}></i>
              </div>
              <div>
                <h3>Motor Winch Penggerak (12V DC)</h3>
                <p id="motorDescText">
                  {isRaising
                    ? 'Motor winch aktif menggulung satu tali utama jaring bagan...'
                    : isLowering
                    ? 'Motor mengulur satu tali utama, menurunkan jaring ke kedalaman optimal...'
                    : isStoppedAtTop
                    ? 'Rangka jaring menyentuh sakelar batas atas. Motor berhenti seketika.'
                    : isEStop
                    ? 'PERINGATAN: E-STOP aktif. Seluruh arus motor diputus!'
                    : 'Motor DC High-Torque 12V dalam kondisi siaga (standby).'}
                </p>
                <span
                  id="motorDetailBadge"
                  className="badge-status"
                  style={{
                    color: isEStop
                      ? '#ef4444'
                      : isRaising
                      ? '#00e5d0'
                      : isLowering
                      ? '#38bdf8'
                      : isStoppedAtTop
                      ? '#34d399'
                      : '#38bdf8',
                    borderColor: isEStop ? '#ef4444' : isRaising ? '#00e5d0' : '#38bdf8'
                  }}
                >
                  {isEStop
                    ? 'E-STOP TERTEKAN'
                    : isRaising
                    ? 'MENGGULUNG TALI (NAIK)'
                    : isLowering
                    ? 'MENGULUR TALI (TURUN)'
                    : isStoppedAtTop
                    ? 'BERHENTI (POSISI ATAS)'
                    : 'SIAGA (STANDBY)'}
                </span>
              </div>
            </div>
            <div className="motor-action-toggle">
              <span className="auto-mode-badge" id="autoModeBadge">
                <i className="fas fa-robot"></i> Otomatisasi: AKTIF
              </span>
            </div>
          </div>

          {/* Limit Switch Status Card */}
          <div className="hardware-card">
            <div className="hardware-info">
              <div
                className="hw-icon"
                id="limitSwitchIcon"
                style={{ color: isLimitSwitchActive ? '#ef4444' : '#10b981' }}
              >
                <i
                  className={`fas ${isLimitSwitchActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}
                ></i>
              </div>
              <div>
                <h3>Limit Switch Pengaman Posisi Atas (IP67)</h3>
                <p id="limitSwitchDesc">
                  {isLimitSwitchActive
                    ? 'Rangka persegi jaring menyentuh tuas limit switch di platform bibir bagan.'
                    : 'Sirkuit pemutus siap mendeteksi rangka jaring saat mencapai batas atas.'}
                </p>
                <span
                  id="limitSwitchBadge"
                  className="badge-status"
                  style={{
                    color: isLimitSwitchActive ? '#ef4444' : '#10b981',
                    borderColor: isLimitSwitchActive ? '#ef4444' : '#10b981'
                  }}
                >
                  {isLimitSwitchActive ? 'TERTEKAN (CUT-OFF MOTOR)' : 'TERBUKA (NORMAL SIAGA)'}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Control Buttons */}
          <div className="dual-btn-group-custom">
            <button
              type="button"
              className="action-btn action-primary"
              id="btnTestAutoHoist"
              onClick={() => startAutoHoist('Otomatis ESP32')}
              disabled={isRaising || isLowering || isStoppedAtTop || isEStop}
              style={{
                opacity: isRaising || isLowering || isStoppedAtTop || isEStop ? 0.6 : 1,
                cursor: isRaising || isLowering || isStoppedAtTop || isEStop ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fas fa-play"></i> Uji Otomatisasi (Beban Penuh)
            </button>

            <button
              type="button"
              className="action-btn action-secondary"
              id="btnManualHoist"
              onClick={() => startAutoHoist('Manual Nelayan')}
              disabled={isRaising || isLowering || isStoppedAtTop || isEStop}
              style={{
                opacity: isRaising || isLowering || isStoppedAtTop || isEStop ? 0.6 : 1,
                cursor: isRaising || isLowering || isStoppedAtTop || isEStop ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fas fa-arrow-up"></i> Angkat Manual
            </button>

            <button
              type="button"
              className="action-btn action-accent"
              id="btnManualLower"
              onClick={startLowerNet}
              disabled={isRaising || isLowering || !isStoppedAtTop || isEStop}
              style={{
                opacity: isRaising || isLowering || !isStoppedAtTop || isEStop ? 0.6 : 1,
                cursor: isRaising || isLowering || !isStoppedAtTop || isEStop ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fas fa-arrow-down"></i> Turunkan Jaring Manual
            </button>

            {isEStop ? (
              <button
                type="button"
                className="action-btn action-primary"
                onClick={resetEStop}
                style={{ background: '#10b981', color: '#07162c' }}
              >
                <i className="fas fa-undo"></i> Reset E-STOP
              </button>
            ) : (
              <button
                type="button"
                className="action-btn action-estop"
                id="estopActionBtn"
                onClick={triggerEStop}
                title="Hentikan Seketika Seluruh Sistem!"
              >
                <i className="fas fa-hand"></i> EMERGENCY STOP
              </button>
            )}
          </div>

          <p className="feature-note" style={{ marginTop: '16px' }}>
            <i className="fas fa-shield-alt"></i> <strong>Prosedur Keselamatan:</strong> Sakelar batas atas (limit switch) secara fisik memutus arus relay motor seketika saat rangka menyentuh platform, mencegah kelebihan tarikan tali derek dan melindungi struktur bagan bambu dari kerusakan mekanis.
          </p>
        </div>

        {/* Right: Bagan Schematic Graphic */}
        <div className="split-image bg-ocean-dark">
          <BaganSchematic interactive={true} />
        </div>
      </section>
    </div>
  );
};

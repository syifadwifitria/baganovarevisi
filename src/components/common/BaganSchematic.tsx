/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Interactive Bagan Tancap Schematic
 * Accurate Mechanical Construction:
 * 1 Motor Gearbox + 1 Winch + 1 Main Cable + Inline Load Cell + Square Spreader Bridle + 4 Corner Ropes + Net + Top Limit Switch
 */

import React from 'react';
import { useBagan } from '../../context/BaganContext';

interface BaganSchematicProps {
  interactive?: boolean;
}

export const BaganSchematic: React.FC<BaganSchematicProps> = ({ interactive = true }) => {
  const { activeBagan, startAutoHoist, startLowerNet, triggerEStop, resetEStop } = useBagan();
  const { winch, loadSensor } = activeBagan;

  const isRaising = winch.motorState === 'raising';
  const isLowering = winch.motorState === 'lowering';
  const isStoppedAtTop = winch.netPosition === 'top';
  const isEStop = winch.motorState === 'estop';
  const isLimitSwitchActive = winch.limitSwitchTop;

  // Height of single main cable in px (190px = bottom, 50px = top)
  const cableHeight = winch.cableHeightPx;

  return (
    <div className="bagan-schematic-wrapper">
      {/* Header */}
      <div className="schematic-header">
        <div>
          <h4>
            <i className="fas fa-drafting-compass"></i> MEKANISME ALAT: 1 MOTOR, 1 WINCH, 1 TALI UTAMA
          </h4>
          <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
            Konstruksi Otomatisasi Bagan Tancap Fisik — {activeBagan.name} ({activeBagan.id})
          </small>
        </div>
        <span className="schematic-pill">
          {activeBagan.isRealHardware ? 'PROTOTIPE FISIK PKM' : 'UNIT DIGITAL'}
        </span>
      </div>

      {/* Interactive Illustration Box */}
      <div className="bagan-visual-illustration" id="baganVisualBox">
        <div className="bagan-platform">
          {/* Bamboo Stilts */}
          <div className="bamboo-pole pole-left" title="Tiang Bambu Penopang Kiri"></div>
          <div className="bamboo-pole pole-right" title="Tiang Bambu Penopang Kanan"></div>
          <div className="bamboo-cross"></div>

          {/* Sea Surface Line */}
          <div className="sea-surface-line">
            <span className="sea-label">PERMUKAAN AIR LAUT (KEDALAMAN ~8-12m)</span>
          </div>

          {/* Top Platform Cabin with 1 Motor & 1 Winch Drum */}
          <div className="cabin-box-enhanced">
            <div className="cabin-title">
              <i className="fas fa-home"></i> GELADAK PONDOK BAGAN
            </div>
            <div className="motor-winch-assembly">
              <div
                className={`single-motor-graphic ${isRaising || isLowering ? 'spinning' : ''}`}
                title="1 Unit Motor DC Gearbox 12V/24V Torsi Tinggi"
                style={{
                  borderColor: isEStop ? '#ef4444' : isRaising ? '#00e5d0' : isLowering ? '#38bdf8' : '#64748b'
                }}
              >
                <i className="fas fa-cog"></i>
                <span>MOTOR 12V</span>
              </div>
              <div className="single-winch-drum" title="1 Unit Drum Winch Penggulung Tali Derek Tunggal">
                <div className="drum-groove"></div>
                <span>WINCH</span>
              </div>
            </div>
          </div>

          {/* Limit Switch (Top Position Cut-off) */}
          <div
            className={`limit-switch-graphic ${isLimitSwitchActive ? 'active' : ''}`}
            title="Sakelar Batas Atas Mekanis (Limit Switch IP67) Pemutus Arus Motor"
            style={{
              borderColor: isLimitSwitchActive ? '#ef4444' : '#64748b'
            }}
          >
            <span
              className="ls-dot"
              style={{
                backgroundColor: isLimitSwitchActive ? '#ef4444' : '#10b981',
                boxShadow: isLimitSwitchActive ? '0 0 10px #ef4444' : '0 0 6px #10b981'
              }}
            ></span>
            <span className="ls-label">
              LIMIT SWITCH: {isLimitSwitchActive ? 'TERTEKAN (CUT-OFF)' : 'SIAGA (BUKA)'}
            </span>
          </div>

          {/* 1 Single Main Cable (Tali Utama) with Animated Height */}
          <div
            className="single-main-cable"
            id="singleMainCable"
            style={{
              height: `${cableHeight}px`,
              transition: isEStop
                ? 'none'
                : isRaising
                ? 'height 8.8s cubic-bezier(0.35, 0, 0.25, 1)'
                : 'height 6.8s cubic-bezier(0.35, 0, 0.25, 1)'
            }}
          >
            {/* Inline Load Cell Sensor with Glowing Readout */}
            <div
              className="inline-load-sensor"
              title="Sensor Beban S-Beam Inline pada Tali Utama Derek Jaring"
            >
              <div className="load-sensor-body">
                <i className="fas fa-balance-scale"></i>
                <div className="load-sensor-readout">
                  <small>LOAD CELL</small>
                  <strong>{loadSensor.currentFiltered.toFixed(1)} kg</strong>
                </div>
              </div>
            </div>

            {/* Lower Cable Tail */}
            <div className="main-cable-tail"></div>

            {/* Rangka Persegi Pembagi Tarikan (Square Spreader Bridle Frame) */}
            <div
              className="spreader-frame-graphic"
              title="Rangka Persegi Stainless SUS-304 Pembagi Tarikan ke 4 Tali Sudut Jaring"
            >
              <div className="spreader-bar-h"></div>
              <div className="spreader-joint center"></div>
              <span className="spreader-label">RANGKA PERSEGI PEMBAGI TARIKAN</span>

              {/* 4 Corner Ropes descending to net */}
              <div className="four-corner-ropes">
                <div className="rope-corner rope-1" title="Tali Sudut 1"></div>
                <div className="rope-corner rope-2" title="Tali Sudut 2"></div>
                <div className="rope-corner rope-3" title="Tali Sudut 3"></div>
                <div className="rope-corner rope-4" title="Tali Sudut 4"></div>
              </div>

              {/* Lift Net Mesh Graphic */}
              <div
                className="net-graphic-bagan"
                style={{
                  borderColor: isStoppedAtTop ? '#34d399' : '#00e5d0',
                  background: isStoppedAtTop
                    ? 'rgba(52, 211, 153, 0.25)'
                    : 'rgba(0, 180, 166, 0.2)'
                }}
              >
                <div className="net-mesh-pattern"></div>
                <div className="net-fish-silhouettes">
                  <span className="fish-dot f1"></span>
                  <span className="fish-dot f2"></span>
                  <span className="fish-dot f3"></span>
                </div>
                <div className="net-caption">
                  <i className="fas fa-network-wired"></i> JARING BAGAN TANCAP{' '}
                  {isStoppedAtTop ? '(POSISI PANEN)' : '(MENAMPUNG DI LAUT)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schematic Status Indicators & Actions */}
      <div className="schematic-footer">
        <div className="status-summary-item">
          <small>STATUS MOTOR</small>
          <strong
            style={{
              color: isEStop
                ? '#ef4444'
                : isRaising
                ? '#00e5d0'
                : isLowering
                ? '#38bdf8'
                : isStoppedAtTop
                ? '#34d399'
                : '#94a3b8'
            }}
          >
            {isEStop
              ? 'E-STOP TERTEKAN!'
              : isRaising
              ? 'Menggulung Tali...'
              : isLowering
              ? 'Mengulur Tali...'
              : isStoppedAtTop
              ? 'Berhenti di Atas'
              : 'Standby (Siaga)'}
          </strong>
        </div>

        <div className="status-summary-item">
          <small>POSISI JARING</small>
          <strong style={{ color: isStoppedAtTop ? '#34d399' : '#00e5d0' }}>
            {isStoppedAtTop ? 'Atas (Siap Panen)' : winch.netPosition === 'moving_up' ? 'Sedang Naik...' : winch.netPosition === 'moving_down' ? 'Sedang Turun...' : 'Bawah (Kolom Air)'}
          </strong>
        </div>

        <div className="status-summary-item">
          <small>LIMIT SWITCH ATAS</small>
          <strong style={{ color: isLimitSwitchActive ? '#ef4444' : '#10b981' }}>
            {isLimitSwitchActive ? 'Aktif (Cut-Off Arus)' : 'Normal (Sirkuit Buka)'}
          </strong>
        </div>

        {interactive && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => startAutoHoist('Otomatis ESP32')}
              disabled={isRaising || isLowering || isStoppedAtTop || isEStop}
              style={{
                opacity: isRaising || isLowering || isStoppedAtTop || isEStop ? 0.6 : 1,
                cursor: isRaising || isLowering || isStoppedAtTop || isEStop ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fas fa-play"></i> Uji Angkat Otomatis
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={startLowerNet}
              disabled={isRaising || isLowering || !isStoppedAtTop || isEStop}
              style={{
                opacity: isRaising || isLowering || !isStoppedAtTop || isEStop ? 0.6 : 1,
                cursor: isRaising || isLowering || !isStoppedAtTop || isEStop ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fas fa-arrow-down"></i> Turunkan Jaring
            </button>
            {isEStop ? (
              <button
                type="button"
                className="btn btn-accent btn-sm"
                onClick={resetEStop}
              >
                <i className="fas fa-undo"></i> Reset E-STOP
              </button>
            ) : (
              <button
                type="button"
                className="action-btn action-estop btn-sm"
                onClick={triggerEStop}
                title="Hentikan seketika aliran motor winch"
              >
                <i className="fas fa-hand"></i> E-STOP
              </button>
            )}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div
        style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          fontSize: '0.78rem',
          color: '#cbd5e1',
          lineHeight: 1.5
        }}
      >
        <i className="fas fa-shield-alt" style={{ color: '#00e5d0', marginRight: '6px' }}></i>
        <strong>Proteksi Keselamatan Mandiri (Hardware Autonomy):</strong> Sakelar pembatas atas (*Limit Switch*) dan relai pemutus arus terhubung langsung ke pin interupsi mikrokontroler ESP32 di bagan. Jika koneksi internet atau Wi-Fi terputus di tengah laut, motor tetap akan berhenti secara otomatis saat jaring mencapai bibir platform.
      </div>
    </div>
  );
};

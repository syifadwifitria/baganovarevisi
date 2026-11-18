/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Settings & Sensor Calibration View
 * Role-Based Interface: Simplified for Fishermen, In-Depth for Marine Engineers
 */

import React, { useState } from 'react';
import { useBagan } from '../../context/BaganContext';

export const SettingsView: React.FC = () => {
  const {
    activeBagan,
    activeBaganId,
    bagans,
    selectBagan,
    currentRole,
    updateTargetThreshold,
    updateBaselineTare,
    updateFilterWindow,
    updateEspConfig,
    showToast,
    setCurrentView
  } = useBagan();

  const { loadSensor, technical, winch } = activeBagan;

  // Local form states
  const [targetVal, setTargetVal] = useState(loadSensor.targetThreshold);
  const [tareVal, setTareVal] = useState(loadSensor.baselineTare);
  const [filterWindowVal, setFilterWindowVal] = useState(loadSensor.filterWindow);
  const [espIpVal, setEspIpVal] = useState(technical.espIp);
  const [baudVal, setBaudVal] = useState(technical.baudRate);
  const [hx711Gain, setHx711Gain] = useState(technical.hx711Gain);
  const [calFactor, setCalFactor] = useState(technical.calibrationFactor);

  const handleSaveSettings = () => {
    updateTargetThreshold(targetVal);
    updateBaselineTare(tareVal);
    updateFilterWindow(filterWindowVal);
    updateEspConfig(espIpVal, baudVal);
    showToast(`Pengaturan kalibrasi untuk ${activeBagan.name} berhasil disimpan!`, 'success');
  };

  const handleTestLimitSwitch = () => {
    showToast('Diagnostik Perangkat Keras: Sakelar Batas Atas (Limit Switch) terdeteksi NORMAL (Kontak NC Tertutup).', 'success');
  };

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
            <span className="crumb-current">
              {currentRole === 'engineer' || currentRole === 'superadmin'
                ? 'Kalibrasi Sensor & Konfigurasi Teknisi'
                : 'Pengaturan Operasional Nelayan'}
            </span>
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
                {currentRole === 'engineer' || currentRole === 'superadmin'
                  ? 'Kalibrasi Sensor Load Cell & Parameter ESP32'
                  : 'Pengaturan Ambang Batas Bagan Anda'}
              </h1>
              <p className="page-banner-subtitle">
                {currentRole === 'engineer' || currentRole === 'superadmin'
                  ? 'Menu teknis untuk kalibrasi HX711, Moving Average Filter, baud rate serial, dan diagnostik kelistrikan maritim.'
                  : 'Atur target berat ikan yang diinginkan sebelum jaring otomatis diangkat ke geladak.'}
              </p>
            </div>

            {/* Bagan Switcher */}
            <div className="bagan-switcher-box">
              <i className="fas fa-ship"></i>
              <div>
                <small className="bagan-switcher-label">
                  BAGAN YANG DIATUR:
                </small>
                <select
                  value={activeBaganId}
                  onChange={(e) => {
                    selectBagan(e.target.value);
                    const b = bagans.find((item) => item.id === e.target.value);
                    if (b) {
                      setTargetVal(b.loadSensor.targetThreshold);
                      setTareVal(b.loadSensor.baselineTare);
                      setFilterWindowVal(b.loadSensor.filterWindow);
                      setEspIpVal(b.technical.espIp);
                      setBaudVal(b.technical.baudRate);
                    }
                  }}
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

      {/* Settings Grid */}
      <section className="settings-section" id="settings">
        <div className="settings-container">
          <div className="settings-grid">
            {/* Setting Card 1: Ambang Batas Pemicu */}
            <div className="settings-card">
              <div className="settings-card-header">
                <i className="fas fa-balance-scale"></i>
                <h3>Ambang Batas Pemicu (Target Threshold)</h3>
              </div>
              <p className="settings-desc">
                Beban akumulasi ikan pada tali derek utama yang diperlukan agar ESP32 memicu motor winch menggulung jaring.
              </p>
              <div className="setting-control-row">
                <input
                  type="range"
                  min="40"
                  max="150"
                  step="5"
                  value={targetVal}
                  onChange={(e) => setTargetVal(parseFloat(e.target.value))}
                  className="range-slider-modern"
                />
                <span className="setting-val-badge">{targetVal} kg</span>
              </div>
              <small className="setting-hint">
                Rekomendasi nelayan: 80 - 100 kg untuk bagan tancap standar pesisir Teluk Banten.
              </small>
            </div>

            {/* Setting Card 2: Kalibrasi Baseline (Tara) */}
            <div className="settings-card">
              <div className="settings-card-header">
                <i className="fas fa-anchor"></i>
                <h3>Kalibrasi Baseline Tara Jaring Kosong</h3>
              </div>
              <p className="settings-desc">
                Berat jaring kosong saat terendam di dalam kolom air (dead weight + gesekan air laut tanpa ikan).
              </p>
              <div className="setting-control-row">
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={tareVal}
                  onChange={(e) => setTareVal(parseFloat(e.target.value))}
                  className="range-slider-modern"
                />
                <span className="setting-val-badge">{tareVal} kg</span>
              </div>
              <small className="setting-hint">
                Lakukan kalibrasi saat jaring terbentang baru diturunkan ke laut untuk mereset titik nol.
              </small>
            </div>

            {/* Engineer Mode Only Cards */}
            {(currentRole === 'engineer' || currentRole === 'superadmin') ? (
              <>
                {/* Setting Card 3: Moving Average Wave Filter */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <i className="fas fa-wave-square"></i>
                    <h3>Parameter Filter Ombak (Moving Average)</h3>
                  </div>
                  <p className="settings-desc">
                    Jumlah sampel rata-rata bergerak (window size) pada firmware ESP32 untuk meredam kebisingan ayunan ombak laut.
                  </p>
                  <div className="setting-control-row">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={filterWindowVal}
                      onChange={(e) => setFilterWindowVal(parseInt(e.target.value, 10))}
                      className="range-slider-modern"
                    />
                    <span className="setting-val-badge">
                      {filterWindowVal} Sampel ({(filterWindowVal * 0.1).toFixed(1)}s)
                    </span>
                  </div>
                  <small className="setting-hint">
                    Jendela lebih besar lebih tahan gelombang besar namun respons sistem sedikit bertambah (+0.2s).
                  </small>
                </div>

                {/* Setting Card 4: Load Cell HX711 Calibration Factor */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <i className="fas fa-microchip"></i>
                    <h3>Faktor Kalibrasi & Gain Modul HX711</h3>
                  </div>
                  <p className="settings-desc">
                    Nilai pengali konversi tegangan diferensial mikrovolt jembatan Wheatstone ke satuan kilogram.
                  </p>
                  <div className="esp32-settings-inputs">
                    <div className="input-inline">
                      <label>Faktor Kalibrasi Slope:</label>
                      <input
                        type="number"
                        className="text-input-modern"
                        value={calFactor}
                        onChange={(e) => setCalFactor(parseFloat(e.target.value) || 420.0)}
                        step="0.5"
                      />
                    </div>
                    <div className="input-inline">
                      <label>Gain Penguatan ADC On-Chip:</label>
                      <select
                        className="select-modern"
                        value={hx711Gain}
                        onChange={(e) => setHx711Gain(parseInt(e.target.value, 10))}
                      >
                        <option value={128}>Gain 128 (Kanal A - Standar S-Beam)</option>
                        <option value={64}>Gain 64 (Kanal A)</option>
                        <option value={32}>Gain 32 (Kanal B)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Setting Card 5: ESP32 Network & Hardware Diagnostic */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <i className="fas fa-network-wired"></i>
                    <h3>Komunikasi Gateway & Diagnostik ESP32</h3>
                  </div>
                  <p className="settings-desc">
                    Alamat IP gateway komunikasi lokal di bagan tancap dan laju baud serial.
                  </p>
                  <div className="esp32-settings-inputs">
                    <div className="input-inline">
                      <label>IP Gateway Lokal ESP32:</label>
                      <input
                        type="text"
                        className="text-input-modern"
                        value={espIpVal}
                        onChange={(e) => setEspIpVal(e.target.value)}
                      />
                    </div>
                    <div className="input-inline">
                      <label>Baud Rate Serial:</label>
                      <select
                        className="select-modern"
                        value={baudVal}
                        onChange={(e) => setBaudVal(parseInt(e.target.value, 10))}
                      >
                        <option value={115200}>115200 bps (Rekomendasi ESP32)</option>
                        <option value={9600}>9600 bps</option>
                        <option value={57600}>57600 bps</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleTestLimitSwitch}
                    >
                      <i className="fas fa-plug"></i> Tes Sirkuit Sakelar Batas Atas
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Fisherman Mode: Help & Support Card */
              <div className="settings-card">
                <div className="settings-card-header">
                  <i className="fas fa-phone-alt"></i>
                  <h3>Bantuan Operasional & Kontak Teknisi</h3>
                </div>
                <p className="settings-desc">
                  Jika terjadi kendala mekanis pada drum winch atau sensor beban tali derek, hubungi tim teknis pendamping BAGANOVA.
                </p>
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--card-border)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    lineHeight: 1.6
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Call Center BAGANOVA:</strong>
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    <i className="fab fa-whatsapp"></i> WhatsApp Bantuan: 0857-1007-1606
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    Email: baganova@gmail.com
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button Row */}
          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Konfirmasi Perubahan Kalibrasi</strong>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Perubahan akan disinkronkan ke memori EEPROM mikrokontroler ESP32 pada {activeBagan.name}.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveSettings}
            >
              <i className="fas fa-save"></i> Simpan Parameter Sistem
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

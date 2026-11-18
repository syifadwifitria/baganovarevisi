/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Multi-Bagan Management Dashboard
 * Central Fleet Control Hub for Fishermen and Maritime Engineers
 */

import React, { useState } from 'react';
import { useBagan } from '../../context/BaganContext';
import { AddBaganModal } from '../modals/AuthModals';

export const MultiBaganDashboardView: React.FC = () => {
  const {
    currentUser,
    currentRole,
    bagans,
    activeBaganId,
    selectBagan,
    setCurrentView,
    startAutoHoist,
    startLowerNet,
    deleteBagan
  } = useBagan();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter bagans belonging to user unless engineer/admin
  const userBagans =
    currentRole === 'superadmin' || currentRole === 'engineer'
      ? bagans
      : bagans.filter((b) => currentUser?.registeredBaganIds.includes(b.id));

  const totalCycles = userBagans.reduce((sum, b) => sum + b.analytics.totalCyclesTested, 0);
  const onlineCount = userBagans.filter((b) => b.status === 'online').length;

  return (
    <div className="history-section" style={{ paddingTop: '2rem' }}>
      <div className="history-container">
        {/* Dashboard Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '2rem'
          }}
        >
          <div>
            <span className="section-tag">
              <i className="fas fa-th-large"></i> PUSAT PENGELOLAAN MULTI-BAGAN
            </span>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', margin: '4px 0' }}>
              Dashboard Armada Bagan — {currentUser?.fullName || 'Nelayan'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              Kelola dan pantau seluruh perangkat bagan tancap otomatis Anda dalam satu akun terpusat.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              <i className="fas fa-plus-circle"></i> Tambah Bagan Baru
            </button>
          </div>
        </div>

        {/* Fleet KPI Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '2.5rem'
          }}
        >
          <div className="stat-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Total Bagan Terdaftar</span>
              <i className="fas fa-ship" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
            </div>
            <div className="stat-number text-val" style={{ margin: '8px 0 0 0', color: 'var(--primary)' }}>
              {userBagans.length} Unit
            </div>
            <small style={{ color: 'var(--text-muted)' }}>Terhubung ke akun Anda</small>
          </div>

          <div className="stat-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Status Koneksi ESP32</span>
              <i className="fas fa-wifi" style={{ color: 'var(--status-ok-text)', fontSize: '1.2rem' }}></i>
            </div>
            <div className="stat-number text-val" style={{ margin: '8px 0 0 0', color: 'var(--status-ok-text)' }}>
              {onlineCount} Online
            </div>
            <small style={{ color: 'var(--text-muted)' }}>
              {userBagans.length - onlineCount} Standby/Offline
            </small>
          </div>

          <div className="stat-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Total Siklus Pengangkatan</span>
              <i className="fas fa-check-double" style={{ color: 'var(--status-info-text)', fontSize: '1.2rem' }}></i>
            </div>
            <div className="stat-number text-val" style={{ margin: '8px 0 0 0', color: 'var(--status-info-text)' }}>
              {totalCycles} Kali
            </div>
            <small style={{ color: 'var(--text-muted)' }}>Tingkat keberhasilan 100%</small>
          </div>

          <div className="stat-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Rata-rata Waktu Angkat</span>
              <i className="fas fa-clock" style={{ color: 'var(--status-warn-text)', fontSize: '1.2rem' }}></i>
            </div>
            <div className="stat-number text-val" style={{ margin: '8px 0 0 0', color: 'var(--status-warn-text)' }}>
              18.2 Detik
            </div>
            <small style={{ color: 'var(--text-muted)' }}>Dari dasar hingga sakelar atas</small>
          </div>
        </div>

        {/* Role Mode Banner */}
        {currentRole === 'fisherman' ? (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(0, 180, 166, 0.12)',
              border: '1.5px solid #00e5d0',
              borderRadius: '16px',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#00e5d0',
                  color: '#07162c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}
              >
                <i className="fas fa-user"></i>
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Fisherman Mode Aktif: Antarmuka Khusus Nelayan Pesisir
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Tampilan telah disederhanakan dengan tombol besar, istilah bahasa Indonesia komunikatif, dan telemetri langsung tanpa konfigurasi rumit.
                </p>
              </div>
            </div>
            <span
              style={{
                padding: '4px 12px',
                background: 'rgba(0, 229, 208, 0.2)',
                border: '1px solid #00e5d0',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: 'var(--primary)',
                fontWeight: 700
              }}
            >
              Mode Operasional Nelayan
            </span>
          </div>
        ) : (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1.5px solid #38bdf8',
              borderRadius: '16px',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#38bdf8',
                  color: '#07162c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}
              >
                <i className="fas fa-microchip"></i>
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Engineer / Admin Mode: Otoritas Kalibrasi & Diagnostik
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Anda memiliki wewenang untuk mengatur parameter Moving Average, kalibrasi load cell HX711, konfigurasi IP ESP32, dan verifikasi akun pendaftaran nelayan.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentView('settings')}
            >
              <i className="fas fa-tools"></i> Buka Kalibrasi Teknisi
            </button>
          </div>
        )}

        {/* Bagan Device Cards Grid */}
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.2rem', color: 'var(--primary)' }}>
          Daftar Perangkat Bagan Tancap ({userBagans.length} Unit)
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}
        >
          {userBagans.map((bagan) => {
            const isSelected = bagan.id === activeBaganId;
            const loadPct = Math.min(
              100,
              Math.round((bagan.loadSensor.currentFiltered / bagan.loadSensor.targetThreshold) * 100)
            );

            return (
              <div
                key={bagan.id}
                style={{
                  background: 'var(--card-bg)',
                  border: isSelected
                    ? '2px solid #00e5d0'
                    : '1px solid var(--card-border)',
                  borderRadius: '22px',
                  padding: '24px',
                  boxShadow: isSelected
                    ? '0 12px 35px rgba(0, 229, 208, 0.25)'
                    : '0 8px 25px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {/* Top Row: Identification & Badges */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'JetBrains Mono',
                          color: 'var(--status-info-text)',
                          background: 'var(--status-info-bg)',
                          border: '1px solid var(--status-info-border)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700
                        }}
                      >
                        {bagan.id}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '0.68rem',
                            color: '#07162c',
                            background: '#00e5d0',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 800
                          }}
                        >
                          SEDANG AKTIF
                        </span>
                      )}
                    </div>

                    <span
                      className="portal-badge"
                      style={{
                        background:
                          bagan.status === 'online'
                            ? 'var(--status-ok-bg)'
                            : 'var(--status-warn-bg)',
                        color: bagan.status === 'online' ? 'var(--status-ok-text)' : 'var(--status-warn-text)',
                        border: `1px solid ${bagan.status === 'online' ? 'var(--status-ok-border)' : 'var(--status-warn-border)'}`
                      }}
                    >
                      <i className="fas fa-circle" style={{ fontSize: '0.5rem', marginRight: '4px' }}></i>
                      {bagan.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.28rem', fontWeight: 800, margin: '4px 0 6px 0', color: 'var(--text-primary)' }}>
                    {bagan.name}
                  </h3>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)' }}></i> {bagan.location}
                  </div>

                  {bagan.isRealHardware && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--status-ok-text)',
                        background: 'var(--status-ok-bg)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--status-ok-border)'
                      }}
                    >
                      <i className="fas fa-microchip"></i> Unit Prototipe Perangkat Keras ESP32
                    </div>
                  )}
                </div>

                {/* Middle: Real-time Telemetry Mini-Gauge */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Beban Tarik Tali Saat Ini:
                    </span>
                    <strong
                      style={{
                        fontSize: '1.45rem',
                        fontFamily: 'JetBrains Mono',
                        color: 'var(--primary)'
                      }}
                    >
                      {bagan.loadSensor.currentFiltered.toFixed(1)} kg
                    </strong>
                  </div>

                  {/* Progress bar towards target */}
                  <div
                    style={{
                      height: '8px',
                      background: 'var(--card-border)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}
                  >
                    <div
                      style={{
                        width: `${loadPct}%`,
                        height: '100%',
                        background:
                          loadPct >= 100
                            ? 'linear-gradient(90deg, #10b981, #00e5d0)'
                            : 'linear-gradient(90deg, #0284c7, #00e5d0)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600
                    }}
                  >
                    <span>Tara: {bagan.loadSensor.baselineTare} kg</span>
                    <span>Progres: {loadPct}%</span>
                    <span>Target: {bagan.loadSensor.targetThreshold} kg</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--card-border)',
                      paddingTop: '8px',
                      marginTop: '8px',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Motor:{' '}
                      <strong style={{ color: 'var(--primary)' }}>{bagan.winch.motorState}</strong>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Jaring:{' '}
                      <strong style={{ color: 'var(--status-ok-text)' }}>
                        {bagan.winch.netPosition === 'top' ? 'Di Atas' : 'Di Bawah'}
                      </strong>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Aki: <strong style={{ color: 'var(--text-primary)' }}>{bagan.batteryVoltage}V</strong>
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      selectBagan(bagan.id);
                      setCurrentView('monitoring');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <i className="fas fa-desktop"></i> Buka Monitoring
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      selectBagan(bagan.id);
                      setCurrentView('control');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <i className="fas fa-sliders-h"></i> Kendali
                  </button>

                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => setDeleteConfirmId(bagan.id)}
                    title="Hapus Bagan"
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>

                {/* Delete Confirmation Popup */}
                {deleteConfirmId === bagan.id && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(7, 22, 44, 0.96)',
                      borderRadius: '22px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      zIndex: 10
                    }}
                  >
                    <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '12px' }}></i>
                    <h4 style={{ color: '#ffffff', marginBottom: '8px' }}>
                      Hapus {bagan.name}?
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '16px' }}>
                      Tindakan ini akan melepaskan pendaftaran perangkat {bagan.id} dari akun Anda.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm action-estop"
                        onClick={() => {
                          deleteBagan(bagan.id);
                          setDeleteConfirmId(null);
                        }}
                      >
                        Ya, Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AddBaganModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

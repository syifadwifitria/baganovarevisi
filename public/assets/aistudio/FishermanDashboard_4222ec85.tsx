/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Dashboard Khusus Nelayan (Fisherman Mode) — REVISI
 * Prinsip: satu layar, tulisan besar, bahasa sehari-hari, tombol darurat selalu terlihat.
 */

import React, { useState } from 'react';
import { useBagan } from '../../context/BaganContext';

const FONT_MONO = "'JetBrains Mono', monospace";

export const FishermanDashboard: React.FC = () => {
  const {
    currentUser,
    activeBagan,
    updateBagan,
    addFishWeight,
    triggerTargetLoad,
    startLowerNet,
    triggerEStop,
    resetEStop,
    logout
  } = useBagan();

  const [confirmLowerOpen, setConfirmLowerOpen] = useState(false);
  const [testModeOpen, setTestModeOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const { loadSensor, winch, history } = activeBagan;
  const currentKg = loadSensor.currentFiltered.toFixed(1);
  const targetKg = loadSensor.targetThreshold.toFixed(0);
  const netEmptyKg = loadSensor.baselineTare.toFixed(0);
  const loadPercentage = Math.max(
    0,
    Math.min(100, Math.round((loadSensor.currentFiltered / loadSensor.targetThreshold) * 100))
  );

  const isRaising = winch.motorState === 'raising';
  const isLowering = winch.motorState === 'lowering';
  const isMoving = isRaising || isLowering;
  const isAtTop = winch.netPosition === 'top';
  const isAtBottom = winch.netPosition === 'bottom';
  const isEStop = winch.motorState === 'estop';

  const isOnline = activeBagan.status !== 'offline';
  const lowBattery = activeBagan.batteryVoltage > 0 && activeBagan.batteryVoltage < 12.2;

  // ---- Status utama: satu kalimat pendek + warna ----
  let statusText = 'Jaring di bawah, menunggu ikan masuk';
  let statusIcon = 'fa-water';
  let statusColor = '#38bdf8';
  if (!isOnline) {
    statusText = 'Alat tidak terhubung. Angka di layar mungkin sudah lama';
    statusIcon = 'fa-wifi';
    statusColor = '#f59e0b';
  } else if (isEStop) {
    statusText = 'DARURAT! Mesin dimatikan';
    statusIcon = 'fa-exclamation-triangle';
    statusColor = '#ef4444';
  } else if (isRaising) {
    statusText = 'Mesin sedang menaikkan jaring…';
    statusIcon = 'fa-arrow-up';
    statusColor = '#00e5d0';
  } else if (isLowering) {
    statusText = 'Mesin sedang menurunkan jaring…';
    statusIcon = 'fa-arrow-down';
    statusColor = '#38bdf8';
  } else if (isAtTop) {
    statusText = 'Jaring sudah di atas. Silakan serok ikan!';
    statusIcon = 'fa-check-circle';
    statusColor = '#10b981';
  }

  // ---- Alasan tombol "Turunkan" tidak aktif (ditampilkan di layar) ----
  const lowerDisabled = isMoving || isEStop || !isAtTop;
  let lowerReason = '';
  if (isEStop) lowerReason = 'Lepas tombol darurat dulu';
  else if (isMoving) lowerReason = 'Tunggu mesin berhenti';
  else if (isAtBottom) lowerReason = 'Jaring sudah di dalam air';
  else if (!isAtTop) lowerReason = 'Tunggu jaring sampai di atas';

  const handleConfirmLower = () => {
    setConfirmLowerOpen(false);
    startLowerNet();
  };

  const toggleAuto = () => {
    updateBagan(activeBagan.id, { winch: { ...winch, autoMode: !winch.autoMode } });
  };

  const visibleHistory = showAllHistory ? history.slice(0, 10) : history.slice(0, 3);

  const card: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '20px',
    padding: '18px',
    marginBottom: '16px'
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 1rem 9rem 1rem' }}>
      {/* ===== Bar atas ringkas ===== */}
      <div
        style={{
          ...card,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>
            Halo, {currentUser?.fullName || 'Pak Nelayan'} 👋
          </h2>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)' }}></i>{' '}
            {activeBagan.name} · {activeBagan.location}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              background: isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1.5px solid ${isOnline ? '#10b981' : '#ef4444'}`,
              color: isOnline ? '#34d399' : '#fca5a5',
              fontSize: '0.95rem',
              fontWeight: 700
            }}
          >
            <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-exclamation-circle'}`}></i>
            {isOnline ? 'Alat Terhubung' : 'Alat Terputus'}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
            style={{ padding: '10px 14px', fontSize: '0.95rem', minHeight: '44px' }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      </div>

      {!isOnline && (
        <div
          role="alert"
          style={{
            ...card,
            background: 'rgba(245,158,11,0.15)',
            border: '2px solid #f59e0b',
            color: '#fde68a',
            fontSize: '1rem',
            fontWeight: 700
          }}
        >
          <i className="fas fa-exclamation-triangle"></i> Sinyal alat hilang. Jangan andalkan angka di
          layar. Periksa alat langsung di bagan.
        </div>
      )}

      {lowBattery && (
        <div
          role="alert"
          style={{
            ...card,
            background: 'rgba(245,158,11,0.15)',
            border: '2px solid #f59e0b',
            color: '#fde68a',
            fontSize: '1rem',
            fontWeight: 700
          }}
        >
          <i className="fas fa-car-battery"></i> Aki hampir lemah ({activeBagan.batteryVoltage} V).
          Segera isi atau ganti aki.
        </div>
      )}

      {/* ===== Meter beban + status ===== */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(7,22,44,0.97), rgba(10,37,64,0.97))',
          border: `2px solid ${statusColor}`,
          borderRadius: '24px',
          padding: '22px 16px',
          textAlign: 'center',
          marginBottom: '16px'
        }}
      >
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#bae6fd' }}>
          <i className="fas fa-weight-hanging"></i> BERAT TANGKAPAN SEKARANG
        </div>

        <div
          style={{
            fontSize: 'clamp(3.4rem, 12vw, 5.4rem)',
            fontWeight: 900,
            fontFamily: FONT_MONO,
            color: '#ffffff',
            lineHeight: 1.05,
            margin: '8px 0 14px 0',
            opacity: isOnline ? 1 : 0.45
          }}
        >
          {currentKg} <span style={{ fontSize: '1.8rem', color: '#00e5d0' }}>kg</span>
        </div>

        <div style={{ maxWidth: '500px', margin: '0 auto 14px auto' }}>
          <div
            style={{
              height: '20px',
              background: 'rgba(255,255,255,0.12)',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.25)'
            }}
          >
            <div
              style={{
                width: `${loadPercentage}%`,
                height: '100%',
                background:
                  loadPercentage >= 100
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : 'linear-gradient(90deg, #0284c7, #00e5d0)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.95rem',
              color: '#e2e8f0',
              marginTop: '8px',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <span>Jaring kosong: {netEmptyKg} kg</span>
            <span style={{ color: '#5eead4', fontWeight: 800 }}>{loadPercentage}% penuh</span>
            <span>
              Otomatis naik di: <strong>{targetKg} kg</strong>
            </span>
          </div>
        </div>

        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '16px',
            background: `${statusColor}33`,
            border: `2px solid ${statusColor}`,
            fontSize: '1.1rem',
            color: '#ffffff',
            fontWeight: 800,
            lineHeight: 1.35
          }}
        >
          <i className={`fas ${statusIcon} ${isMoving ? 'fa-beat' : ''}`} style={{ color: statusColor }}></i>
          <span>{statusText}</span>
        </div>
      </div>

      {/* ===== Aksi utama ===== */}
      <div style={{ ...card }}>
        {/* Sakelar Otomatis / Manual */}
        <button
          type="button"
          onClick={toggleAuto}
          disabled={isEStop}
          aria-pressed={winch.autoMode}
          style={{
            width: '100%',
            minHeight: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            marginBottom: '14px',
            borderRadius: '16px',
            border: `2px solid ${winch.autoMode ? '#10b981' : '#94a3b8'}`,
            background: winch.autoMode ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.12)',
            color: 'var(--text-primary)',
            cursor: isEStop ? 'not-allowed' : 'pointer',
            opacity: isEStop ? 0.5 : 1,
            textAlign: 'left'
          }}
        >
          <span>
            <strong style={{ fontSize: '1.1rem', display: 'block' }}>
              Naik otomatis: {winch.autoMode ? 'HIDUP' : 'MATI'}
            </strong>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              {winch.autoMode
                ? `Jaring naik sendiri saat tangkapan ${targetKg} kg`
                : 'Jaring tidak akan naik sendiri'}
            </span>
          </span>
          <i
            className={`fas ${winch.autoMode ? 'fa-toggle-on' : 'fa-toggle-off'}`}
            style={{ fontSize: '2.4rem', color: winch.autoMode ? '#10b981' : '#94a3b8' }}
          ></i>
        </button>

        {/* Turunkan jaring */}
        <button
          type="button"
          onClick={() => setConfirmLowerOpen(true)}
          disabled={lowerDisabled}
          style={{
            width: '100%',
            minHeight: '88px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            borderRadius: '18px',
            border: '2px solid #38bdf8',
            background: lowerDisabled
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #0284c7, #034078)',
            color: '#ffffff',
            fontSize: '1.3rem',
            fontWeight: 900,
            cursor: lowerDisabled ? 'not-allowed' : 'pointer',
            opacity: lowerDisabled ? 0.6 : 1
          }}
        >
          <span>
            <i className="fas fa-arrow-down"></i> TURUNKAN JARING
          </span>
          <small style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e0f2fe' }}>
            {lowerDisabled ? lowerReason : 'Tekan setelah ikan selesai diserok'}
          </small>
        </button>
      </div>

      {/* ===== Dialog konfirmasi turun ===== */}
      {confirmLowerOpen && (
        <div className="baganova-modal-backdrop" onClick={() => setConfirmLowerOpen(false)}>
          <div
            className="baganova-modal-box"
            style={{ maxWidth: '460px', textAlign: 'center', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <i
              className="fas fa-shield-alt"
              style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '12px' }}
            ></i>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '1.3rem' }}>
              Turunkan jaring ke laut?
            </h3>
            <p
              style={{
                fontSize: '1.05rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}
            >
              Pastikan:
              <br />✔ Semua ikan sudah diserok
              <br />✔ Tidak ada perahu di bawah bagan
              <br />✔ Tali tidak kusut
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmLowerOpen(false)}
                style={{ flex: 1, minHeight: '52px', fontSize: '1.05rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmLower}
                style={{ flex: 1, minHeight: '52px', fontSize: '1.05rem' }}
              >
                <i className="fas fa-check"></i> Ya, turunkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Riwayat ===== */}
      <div style={card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>
            <i className="fas fa-history" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
            Riwayat naik jaring
          </h3>
          {history.length > 3 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAllHistory(!showAllHistory)}
              style={{ padding: '8px 12px', fontSize: '0.9rem', minHeight: '40px' }}
            >
              {showAllHistory ? 'Tampilkan sedikit' : 'Lihat lebih banyak'}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontSize: '1rem' }}>
            Belum ada catatan.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visibleHistory.map((item, idx) => {
              const ok = item.status.startsWith('Sukses');
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {item.time} · {item.date}
                    </strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {item.mode === 'Otomatis ESP32' ? 'Otomatis' : item.mode === 'Manual Nelayan' ? 'Manual' : 'Uji coba'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {item.triggerLoad} kg
                    </div>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: ok ? '#34d399' : '#fca5a5',
                        background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {ok ? 'Berhasil' : item.status === 'E-STOP' ? 'Darurat' : 'Dihentikan'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Mode uji coba (disembunyikan dari operasional harian) ===== */}
      <div style={{ ...card, borderStyle: 'dashed' }}>
        <button
          type="button"
          onClick={() => setTestModeOpen(!testModeOpen)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            minHeight: '40px'
          }}
        >
          <span>
            <i className="fas fa-flask"></i> Mode uji coba (bukan untuk melaut)
          </span>
          <i className={`fas ${testModeOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </button>

        {testModeOpen && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '0.95rem', color: '#fde68a', marginBottom: '12px' }}>
              <i className="fas fa-exclamation-triangle"></i> Tombol ini hanya mensimulasikan ikan. Motor bisa menyala
              sendiri. Jangan dipakai saat ada orang di dekat jaring.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => addFishWeight(15.0)}
                disabled={isMoving || isEStop}
                style={{ minHeight: '56px', fontSize: '0.95rem' }}
              >
                <i className="fas fa-fish"></i> Tambah 15 kg (simulasi)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={triggerTargetLoad}
                disabled={isMoving || isAtTop || isEStop}
                style={{ minHeight: '56px', fontSize: '0.95rem' }}
              >
                <i className="fas fa-bolt"></i> Langsung {targetKg} kg (simulasi)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Tombol darurat: selalu menempel di bawah layar ===== */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px',
          background: 'rgba(7,22,44,0.92)',
          backdropFilter: 'blur(6px)',
          borderTop: '1px solid rgba(255,255,255,0.15)'
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {isEStop ? (
            <button
              type="button"
              onClick={resetEStop}
              style={{
                width: '100%',
                minHeight: '68px',
                borderRadius: '16px',
                border: '2px solid #34d399',
                background: '#10b981',
                color: '#06281d',
                fontSize: '1.2rem',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-undo"></i> LEPAS TOMBOL DARURAT
              <small style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700 }}>
                Pastikan aman, lalu tekan untuk siap lagi
              </small>
            </button>
          ) : (
            <button
              type="button"
              onClick={triggerEStop}
              style={{
                width: '100%',
                minHeight: '68px',
                borderRadius: '16px',
                border: '3px solid #fecaca',
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '1.3rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 0 0 3px rgba(220,38,38,0.35)'
              }}
            >
              <i className="fas fa-hand"></i> STOP DARURAT
              <small style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#fee2e2' }}>
                Tekan untuk mematikan mesin seketika
              </small>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

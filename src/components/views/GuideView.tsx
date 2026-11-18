/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Guide Page (Halaman Terpisah "Panduan Nelayan")
 * Jalur Navigasi: Beranda > Panduan
 * Berisi SOP 4 Langkah Nelayan, Checklist Keselamatan, Panduan Indikator, dan Penanganan Masalah Lapangan.
 */

import React from 'react';
import { useBagan, SAFETY_CHECKLIST_ITEMS } from '../../context/BaganContext';
import { ScrollSlide, ScrollSectionSlide } from '../common/ScrollSlide';

interface GuideViewProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ onOpenLogin, onOpenRegister }) => {
  const {
    setCurrentView,
    currentUser,
    guideTab: activeTab,
    setGuideTab: setActiveTab,
    safetyCheckedMap,
    toggleSafetyCheckItem,
    resetSafetyChecklist,
    mandatorySafetyCount,
    mandatorySafetyCompletedCount,
    isMandatorySafetyReady
  } = useBagan();

  const sopSteps = [
    {
      step: '01',
      title: 'Pemeriksaan Awal dan Kalibrasi Tare Baseline',
      badge: 'Tahap Awal',
      desc: 'Pastikan jaring dalam kondisi kosong dan siap dioperasikan. Lakukan pemeriksaan komponen pengangkatan serta kalibrasi awal agar pembacaan beban pada sensor stabil.',
      icon: 'fa-balance-scale',
      subtasks: [
        'Periksa kondisi fisik tali derek dan mekanisme pengangkatan.',
        'Pastikan load cell terpasang dengan benar dan tidak mengalami pembebanan berlebih.',
        'Lakukan kalibrasi sensor sesuai prosedur sebelum pengoperasian.',
        'Pastikan pembacaan awal stabil dan status kalibrasi menunjukkan berhasil.'
      ]
    },
    {
      step: '02',
      title: 'Uji Sakelar Batas Atas (Limit Switch) dan E-STOP',
      badge: 'Verifikasi Proteksi',
      desc: 'Lakukan pemeriksaan dan pengujian pada limit switch serta tombol Emergency Stop (E-STOP) untuk memastikan sistem penggerak berhenti sesuai batas keamanan sebelum dioperasikan.',
      icon: 'fa-shield-alt',
      subtasks: [
        'Periksa kondisi fisik limit switch dan sambungannya.',
        'Lakukan pengujian limit switch untuk memastikan motor berhenti ketika batas pergerakan tercapai.',
        'Uji tombol Emergency Stop dan pastikan sistem penggerak berhenti ketika tombol diaktifkan.',
        'Pastikan sistem dapat kembali beroperasi hanya setelah kondisi keselamatan diperiksa dan direset.'
      ]
    },
    {
      step: '03',
      title: 'Pengaktifan Otomatisasi Angkat Jaring (Target Beban)',
      badge: 'Operasi Cerdas',
      desc: 'Atur ambang batas beban melalui dashboard sesuai hasil kalibrasi dan kapasitas mekanisme. Sistem akan memproses pembacaan sensor untuk menjalankan pengangkatan otomatis.',
      icon: 'fa-bolt',
      subtasks: [
        'Atur ambang batas beban sesuai hasil kalibrasi dan kapasitas mekanisme.',
        'Aktifkan fitur pemantauan beban melalui dashboard.',
        'Sistem memproses pembacaan sensor untuk menentukan kondisi pengangkatan.',
        'Pengangkatan otomatis dijalankan berdasarkan parameter yang telah diuji dan dikonfigurasi.'
      ]
    },
    {
      step: '04',
      title: 'Penyerokan Hasil dan Penurunan Jaring',
      badge: 'Prosedur Panen',
      desc: 'Setelah pengangkatan berhenti pada posisi yang ditentukan dan hasil tangkapan selesai diambil, periksa area pengoperasian sebelum menurunkan jaring kembali ke posisi awal.',
      icon: 'fa-arrow-down',
      subtasks: [
        'Pastikan mekanisme pengangkatan berhenti pada posisi yang ditentukan.',
        'Periksa kondisi jaring dan pastikan area pengoperasian aman.',
        'Lakukan penurunan jaring menggunakan mekanisme kendali yang tersedia.',
        'Pastikan jaring kembali ke posisi awal dan sistem siap digunakan untuk siklus berikutnya.'
      ]
    }
  ];

  const safetyChecklist = SAFETY_CHECKLIST_ITEMS;

  const troubleshootList = [
    {
      problem: 'Beban Tali Terbaca Berfluktuasi Ekstrem',
      cause: 'Gelombang laut sedang tinggi, terdapat sampah atau kayu yang menyangkut di jaring, pemasangan load cell kurang stabil, gangguan sambungan kabel, atau gangguan pembacaan sensor.',
      action: 'Periksa pemasangan load cell dan sambungan kabel HX711. Pastikan tidak ada benda yang menyangkut pada jaring. Jika pembacaan masih berfluktuasi, lakukan pemeriksaan ulang dan kalibrasi sensor.'
    },
    {
      problem: 'Motor Tidak Mau Mengangkat Padahal Beban Target Sudah Tercapai',
      cause: 'Tombol Emergency Stop masih terkunci, limit switch tertekan atau macet, maupun gangguan pada sumber daya serta sambungan motor penggerak.',
      action: 'Periksa apakah tombol Emergency Stop masih aktif. Pastikan limit switch tidak tertekan atau mengalami kerusakan. Periksa juga sumber daya dan sambungan motor. Jangan memaksa motor bergerak sebelum penyebab gangguan ditemukan.'
    },
    {
      problem: 'Koneksi Dashboard Smartphone Tidak Terhubung ke Bagan',
      cause: 'Wi-Fi smartphone terputus dari jaringan Access Point lokal ESP32 BAGANOVA atau perangkat berada di luar jangkauan sinyal.',
      action: 'Buka pengaturan Wi-Fi pada smartphone dan sambungkan kembali ke jaringan BAGANOVA. Pastikan perangkat berada dalam jangkauan sinyal, kemudian buka kembali dashboard BAGANOVA.'
    }
  ];

  return (
    <div className="page-view-container" style={{ padding: '2rem 1.5rem 5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
      
      {/* Breadcrumb Navigation: Beranda > Panduan */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--card-border)',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCurrentView('welcome');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600
          }}
        >
          <i className="fas fa-home"></i> Beranda
        </button>
        <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Panduan Nelayan</span>
      </nav>

      {/* Page Header Banner */}
      <ScrollSlide y={24}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(7, 43, 74, 0.95), rgba(10, 25, 47, 0.9))',
          borderRadius: '24px',
          border: '1px solid rgba(0, 229, 208, 0.35)',
          padding: '3rem 2.5rem',
          marginBottom: '3rem',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '850px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(0, 229, 208, 0.16)',
              border: '1px solid rgba(45, 212, 191, 0.5)',
              color: '#5eead4',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: '18px'
            }}
          >
            <i className="fas fa-book"></i> STANDAR OPERASIONAL PROSEDUR (SOP) MARITIM
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: '1rem',
              textShadow: '0 0 25px rgba(0, 229, 208, 0.35)'
            }}
          >
            Panduan Operasional dan Keselamatan BAGANOVA
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#e2e8f0',
              lineHeight: 1.7,
              marginBottom: '1.8rem'
            }}
          >
            Panduan penggunaan sistem BAGANOVA yang mencakup persiapan perangkat, pengoperasian pengangkatan jaring, serta langkah keselamatan selama aktivitas penangkapan ikan.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'sop' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('sop')}
              style={{ fontSize: '0.9rem', padding: '10px 22px' }}
            >
              <i className="fas fa-list-ol"></i> 4 Langkah Operasional
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('checklist')}
              style={{ fontSize: '0.9rem', padding: '10px 22px' }}
            >
              <i className="fas fa-clipboard-check"></i> Checklist Keselamatan
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'troubleshoot' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('troubleshoot')}
              style={{ fontSize: '0.9rem', padding: '10px 22px' }}
            >
              <i className="fas fa-tools"></i> Penanganan Masalah
            </button>
          </div>
        </div>
      </div>
      </ScrollSlide>

      {/* Tab 1: 4 Langkah SOP Utama */}
      {activeTab === 'sop' && (
        <section style={{ marginBottom: '4rem' }}>
          <ScrollSectionSlide>
          <ScrollSlide style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-tag">
              <i className="fas fa-tasks"></i> ALUR OPERASIONAL
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
              4 Langkah Utama Operasi Bagan Otomatis
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Ikuti urutan ini setiap kali Anda memulai malam penangkapan ikan di bagan tancap.
            </p>
          </ScrollSlide>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {sopSteps.map((item, index) => (
              <ScrollSlide key={index} delay={index * 0.06}>
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '20px',
                  padding: '30px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: '24px',
                  alignItems: 'start'
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'rgba(0, 229, 208, 0.12)',
                    border: '2px solid rgba(0, 229, 208, 0.4)',
                    color: 'var(--primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  <i className={`fas ${item.icon}`} style={{ fontSize: '1.4rem', marginBottom: '4px' }}></i>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{item.step}</span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'var(--status-info-bg)',
                        color: 'var(--status-info-text)',
                        border: '1px solid var(--status-info-border)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {item.badge}
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {item.title}
                    </h3>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
                    {item.desc}
                  </p>

                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid var(--card-border)'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                      <i className="fas fa-check-square"></i> Poin Tindakan Nelayan:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {item.subtasks.map((task, tIdx) => (
                        <li
                          key={tIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}
                        >
                          <i className="fas fa-angle-right" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              </ScrollSlide>
            ))}
          </div>
          </ScrollSectionSlide>
        </section>
      )}

      {/* Tab 2: Checklist Keselamatan */}
      {activeTab === 'checklist' && (
        <section style={{ marginBottom: '4rem' }}>
          <ScrollSectionSlide>
          <ScrollSlide style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-tag">
              <i className="fas fa-shield-alt"></i> STANDAR KESELAMATAN
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
              Checklist Keselamatan BAGANOVA
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Pemeriksaan sebelum mengaktifkan sistem pengangkatan otomatis untuk menjaga kelancaran dan keselamatan pengoperasian.
            </p>
          </ScrollSlide>

          <ScrollSlide delay={0.06}>
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
            }}
          >
            {/* Status Progres Checklist Wajib */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px 18px',
                borderRadius: '14px',
                marginBottom: '18px',
                background: isMandatorySafetyReady ? 'var(--status-ok-bg)' : 'var(--status-warn-bg)',
                border: `1.5px solid ${isMandatorySafetyReady ? 'var(--status-ok-border)' : 'var(--status-warn-border)'}`
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: isMandatorySafetyReady ? 'var(--status-ok-text)' : 'var(--status-warn-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className={`fas ${isMandatorySafetyReady ? 'fa-check-circle' : 'fa-clipboard-check'}`}></i>
                  <span>
                    Pemeriksaan Wajib: {mandatorySafetyCompletedCount} dari {mandatorySafetyCount} selesai
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {isMandatorySafetyReady
                    ? 'Semua item berlabel Wajib sudah diperiksa. Kontrol naik & turun jaring di Dashboard Nelayan sudah terbuka.'
                    : 'Klik setiap baris item di bawah untuk mencentang. Minimal semua item berlabel Wajib harus tercentang.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {Object.values(safetyCheckedMap).some(Boolean) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={resetSafetyChecklist}
                    style={{ minHeight: '40px' }}
                  >
                    <i className="fas fa-redo"></i> Reset Checklist
                  </button>
                )}
                {currentUser && (
                  <button
                    type="button"
                    className={`btn ${isMandatorySafetyReady ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => {
                      setCurrentView('dashboard');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ minHeight: '40px' }}
                  >
                    <i className="fas fa-arrow-left"></i>{' '}
                    {isMandatorySafetyReady ? 'Kembali ke Dashboard (Siap Operasi)' : 'Kembali ke Dashboard'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {safetyChecklist.map((chk) => {
                const isChecked = Boolean(safetyCheckedMap[chk.id]);
                return (
                  <button
                    key={chk.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => toggleSafetyCheckItem(chk.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                      border: `1.5px solid ${isChecked ? 'rgba(16, 185, 129, 0.55)' : 'var(--card-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          minWidth: '38px',
                          borderRadius: '10px',
                          background: isChecked ? '#10b981' : 'var(--card-bg)',
                          border: `2px solid ${isChecked ? '#10b981' : 'var(--card-border)'}`,
                          color: isChecked ? '#052e16' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.05rem',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <i className="fas fa-check"></i>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {chk.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                          {chk.desc}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '4px 12px',
                        borderRadius: '8px',
                        background: chk.status === 'Wajib' ? 'var(--status-danger-bg)' : 'var(--status-warn-bg)',
                        color: chk.status === 'Wajib' ? 'var(--status-danger-text)' : 'var(--status-warn-text)',
                        border: `1px solid ${chk.status === 'Wajib' ? 'var(--status-danger-border)' : 'var(--status-warn-border)'}`,
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      {chk.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {currentUser && (
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '18px',
                  borderTop: '1px solid var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {isMandatorySafetyReady
                    ? 'Checklist Wajib terpenuhi. Anda sekarang dapat mengoperasikan tombol Naikkan & Turunkan Jaring.'
                    : `Tersisa ${mandatorySafetyCount - mandatorySafetyCompletedCount} item Wajib yang belum dicentang.`}
                </div>
                <button
                  type="button"
                  className={`btn ${isMandatorySafetyReady ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setCurrentView('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ minHeight: '46px', padding: '10px 22px' }}
                >
                  <i className={`fas ${isMandatorySafetyReady ? 'fa-check-circle' : 'fa-arrow-left'}`}></i>{' '}
                  {isMandatorySafetyReady ? 'Lanjut ke Dashboard Nelayan' : 'Kembali ke Dashboard'}
                </button>
              </div>
            )}
          </div>
          </ScrollSlide>
          </ScrollSectionSlide>
        </section>
      )}

      {/* Tab 3: Penanganan Masalah Lapangan */}
      {activeTab === 'troubleshoot' && (
        <section style={{ marginBottom: '4rem' }}>
          <ScrollSectionSlide>
          <ScrollSlide style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-tag">
              <i className="fas fa-tools"></i> PANDUAN LAPANGAN
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
              Penanganan Masalah (Troubleshooting)
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Solusi cepat saat Anda menemui kendala mekanis atau pembacaan sensor di bagan tancap.
            </p>
          </ScrollSlide>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {troubleshootList.map((tb, idx) => (
              <ScrollSlide key={idx} delay={idx * 0.06}>
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <i className="fas fa-question-circle" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {tb.problem}
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'var(--status-danger-bg)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--status-danger-border)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-danger-text)', marginBottom: '4px' }}>
                      KEMUNGKINAN PENYEBAB:
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {tb.cause}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 229, 208, 0.08)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(0, 229, 208, 0.25)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                      TINDAKAN PERBAIKAN:
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {tb.action}
                    </div>
                  </div>
                </div>
              </div>
              </ScrollSlide>
            ))}
          </div>
          </ScrollSectionSlide>
        </section>
      )}

      {/* CTA Box Bottom */}
      <ScrollSectionSlide>
      <ScrollSlide delay={0.08}>
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '20px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Butuh Bantuan atau Konsultasi Penggunaan BAGANOVA?
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 20px', fontSize: '0.95rem' }}>
          Kunjungi halaman TIMO AI, hubungi tim pengembang melalui menu Kontak, atau baca FAQ untuk panduan pertanyaan umum lainnya.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setCurrentView('welcome');
              setTimeout(() => {
                const el = document.getElementById('faq');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{ padding: '12px 28px' }}
          >
            <i className="fas fa-question-circle"></i> Buka FAQ & Pertanyaan Umum
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setCurrentView('welcome');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ padding: '12px 28px' }}
          >
            <i className="fas fa-arrow-left"></i> Kembali ke Beranda
          </button>
        </div>
      </div>
      </ScrollSlide>
      </ScrollSectionSlide>

    </div>
  );
};

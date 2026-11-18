/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Guide Page (Halaman Terpisah "Panduan Nelayan")
 * Jalur Navigasi: Beranda > Panduan
 * Berisi SOP 4 Langkah Nelayan, Checklist Keselamatan, Panduan Indikator, dan Penanganan Masalah Lapangan.
 */

import React, { useState } from 'react';
import { useBagan } from '../../context/BaganContext';

interface GuideViewProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { setCurrentView, currentUser } = useBagan();
  const [activeTab, setActiveTab] = useState<'sop' | 'checklist' | 'troubleshoot'>('sop');

  const sopSteps = [
    {
      step: '01',
      title: 'Pemeriksaan Awal & Kalibrasi Tare Baseline',
      badge: 'Tahap Awal',
      desc: 'Pastikan jaring terendam kosong di dalam kolom air laut. Periksa apakah beban tali utama terbaca stabil ~20 kg (berat mati jaring terendam), lalu pastikan baseline tara telah terekam di sistem.',
      icon: 'fa-balance-scale',
      subtasks: [
        'Periksa fisik tali derek utama dari lilitan rumput laut atau sampah terapung.',
        'Pastikan sensor load cell berada pada posisi tegak lurus dengan katrol jaring.',
        'Buka dashboard nelayan dan periksa nilai tara awal (harus menunjukkan status Tare OK).'
      ]
    },
    {
      step: '02',
      title: 'Uji Sakelar Batas Atas (Limit Switch) & E-STOP',
      badge: 'Verifikasi Proteksi',
      desc: 'Periksa tuas sakelar mekanis limit switch di bibir geladak bagan untuk memastikan indikator siaga aktif, dan pastikan tombol Emergency Stop darurat dalam kondisi bebas (tidak terkunci).',
      icon: 'fa-shield-alt',
      subtasks: [
        'Tekan tuas sakelar batas atas sekali secara manual untuk memastikan relai memutus arus.',
        'Periksa apakah lampu LED indikator menyala merah saat limit switch ditekan.',
        'Pastikan tombol darurat fisik (E-STOP) berada pada posisi siap tekan di dekat ruang operator.'
      ]
    },
    {
      step: '03',
      title: 'Pengaktifan Otomatisasi Angkat Jaring (Target Beban)',
      badge: 'Operasi Cerdas',
      desc: 'Atur ambang batas panen (default 85 kg). Sistem mikrokontroler ESP32 akan menyaring riak ombak dan memicu motor winch seketika saat ikan yang berkumpul mencapai bobot target secara stabil.',
      icon: 'fa-bolt',
      subtasks: [
        'Nyalakan tombol "Naik otomatis" di dashboard smartphone atau panel bagan.',
        'Lampu pemikat ikan (roller lamp) dapat dibiarkan menyala di atas jaring.',
        'ESP32 memvalidasi kestabilan beban selama minimal 2.5 detik untuk menghindari sentakan ombak semu.',
        'Motor winch 12V akan berputar otomatis mengangkat jaring hingga menyentuh limit switch.'
      ]
    },
    {
      step: '04',
      title: 'Penyerokan Hasil & Penurunan Jaring Manual',
      badge: 'Prosedur Panen',
      desc: 'Setelah motor berhenti di puncak sakelar limit switch dan seluruh tangkapan selesai diserok nelayan ke geladak, turunkan jaring kembali ke laut menggunakan tombol kendali di website.',
      icon: 'fa-arrow-down',
      subtasks: [
        'Kunci tuas pengaman mekanis katrol saat nelayan menyerok ikan ke wadah es.',
        'Pastikan area di bawah jaring bebas dari perahu nelayan pendamping atau hambatan lain.',
        'Tekan tombol "Turunkan Jaring" di website nelayan atau lepas tuas rem penurun manual.',
        'Jaring akan kembali turun ke kolom air dan sistem siap mendeteksi tangkapan berikutnya.'
      ]
    }
  ];

  const safetyChecklist = [
    { title: 'Kondisi Aki 12V', desc: 'Tegangan baterai minimal 12.2V sebelum mengaktifkan motor winch otomatis.', status: 'Wajib' },
    { title: 'Segel Kedap Air Modul HX711', desc: 'Periksa kotak pelindung sensor tidak kemasukan uap atau air laut (standar IP67).', status: 'Wajib' },
    { title: 'Ketegangan Tali Baja / Sling', desc: 'Bebas dari serat putus atau karat ekstrem yang berpotensi putus.', status: 'Wajib' },
    { title: 'Lampu Tanda Bagan (Navigasi)', desc: 'Lampu suar bagan menyala terang agar bagan terlihat oleh kapal nelayan lain di malam hari.', status: 'Penting' },
    { title: 'Cadangan Engkol Manual', desc: 'Engkol darurat tersedia di geladak jika terjadi kegagalan sistem kelistrikan bagan.', status: 'Penting' }
  ];

  const troubleshootList = [
    {
      problem: 'Beban Tali Terbaca Berfluktuasi Ekstrem (+/- 15 kg)',
      cause: 'Gelombang laut pesisir sedang tinggi atau ada sampah kayu yang menyangkut di jaring.',
      action: 'Tingkatkan jendela filter Moving Average pada pengaturan menjadi 20-25 sampel, atau periksa bagian jaring dari kotoran sampah laut.'
    },
    {
      problem: 'Motor Tidak Mau Mengangkat Padahal Beban Target Sudah Tercapai',
      cause: 'Tombol Emergency Stop masih terkunci, sakelar batas atas macet, atau tegangan aki drop di bawah 11.0V.',
      action: 'Putar tombol E-STOP searah jarum jam untuk mereset. Periksa tuas limit switch apakah tertekan kotoran garam, dan periksa voltmeter aki.'
    },
    {
      problem: 'Koneksi Dashboard Smartphone Tidak Terhubung ke Bagan',
      cause: 'Wi-Fi handphone terputus dari Access Point lokal ESP32 BAGANOVA.',
      action: 'Buka pengaturan Wi-Fi di ponsel, sambungkan kembali ke jaringan "BAGANOVA-BGN-01" tanpa perlu kuota internet, lalu buka kembali alamat dashboard.'
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
              background: 'rgba(0, 229, 208, 0.15)',
              border: '1px solid rgba(0, 229, 208, 0.4)',
              color: 'var(--primary)',
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
            Panduan Operasional & Keselamatan Nelayan
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '1.8rem'
            }}
          >
            Pedoman resmi langkah demi langkah bagi nelayan pengelola bagan tancap untuk mengoperasikan sistem otomatisasi pengangkatan jaring BAGANOVA secara aman dan andal.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'sop' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('sop')}
              style={{ fontSize: '0.9rem', padding: '10px 22px' }}
            >
              <i className="fas fa-list-ol"></i> 4 Langkah SOP Utama
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
              <i className="fas fa-tools"></i> Penanganan Masalah Lapangan
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: 4 Langkah SOP Utama */}
      {activeTab === 'sop' && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-tag">
              <i className="fas fa-tasks"></i> ALUR OPERASIONAL
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
              4 Langkah Utama Operasi Bagan Otomatis
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Ikuti urutan ini setiap kali Anda memulai malam penangkapan ikan di bagan tancap.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {sopSteps.map((item, index) => (
              <div
                key={index}
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
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
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
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
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
            ))}
          </div>
        </section>
      )}

      {/* Tab 2: Checklist Keselamatan */}
      {activeTab === 'checklist' && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-tag">
              <i className="fas fa-shield-alt"></i> STANDAR KESELAMATAN
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
              Checklist Keselamatan Operasi Maritim
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Pemeriksaan wajib sebelum menyalakan motor otomatis demi mencegah kerusakan jaring atau insiden di laut.
            </p>
          </div>

          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {safetyChecklist.map((chk, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(0, 229, 208, 0.15)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem'
                      }}
                    >
                      <i className="fas fa-check"></i>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {chk.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        {chk.desc}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: chk.status === 'Wajib' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: chk.status === 'Wajib' ? '#fca5a5' : '#fcd34d',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Penanganan Masalah Lapangan */}
      {activeTab === 'troubleshoot' && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-tag">
              <i className="fas fa-tools"></i> PANDUAN LAPANGAN
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
              Penanganan Masalah (Troubleshooting)
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Solusi cepat saat Anda menemui kendala mekanis atau pembacaan sensor di bagan tancap.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {troubleshootList.map((tb, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <i className="fas fa-question-circle" style={{ color: '#f59e0b', fontSize: '1.2rem' }}></i>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {tb.problem}
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>
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
            ))}
          </div>
        </section>
      )}

      {/* CTA Box Bottom */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 208, 0.12), rgba(56, 189, 248, 0.08))',
          border: '1px solid rgba(0, 229, 208, 0.3)',
          borderRadius: '20px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}
      >
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Butuh Pendampingan Teknis Langsung di Dermaga?
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 20px', fontSize: '0.95rem' }}>
          Hubungi posko pelabuhan Karangantu atau baca FAQ untuk panduan pertanyaan umum lainnya.
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

    </div>
  );
};

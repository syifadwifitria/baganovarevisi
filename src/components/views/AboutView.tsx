/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — About Page (Halaman Terpisah "Tentang Kami")
 * Jalur Navigasi: Beranda > Tentang Kami
 * Berisi informasi lengkap sistem, teknologi hardware & IoT, serta Tim Pengembang SIK UPI Serang.
 */

import React from 'react';
import { useBagan } from '../../context/BaganContext';
import { ScrollSlide, ScrollSectionSlide } from '../common/ScrollSlide';
import { HeroAquaticCanvas } from '../BackgroundCanvases';
import heroBaganImg from '../../assets/images/hero_bagan_underwater_1794764982373.jpg';
import malaikaHdImg from '../../assets/images/malaika_hd_1793883510488.jpg';

interface AboutViewProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { setCurrentView, currentUser } = useBagan();

  const teamMembers = [
    {
      name: 'Ahmad Rafael Gerald Yosiano',
      role: 'Project Leader & Prototype Developer',
      prodi: 'Sistem Informasi Kelautan — UPI Kampus Serang',
      bio: 'Memimpin koordinasi tim serta bertanggung jawab atas perancangan dan perakitan prototipe BAGANOVA.',
      icon: 'fa-compass',
      color: '#00e5d0',
      image: '/assets/aistudio/WhatsApp_Image_2026-11-16_at_15.06.45_c6a46f4b.jpeg',
      imagePosition: 'center 18%',
      photoNote: null
    },
    {
      name: 'Syifa Dwi Fitria',
      role: 'Web & System Developer',
      prodi: 'Sistem Informasi Kelautan — UPI Kampus Serang',
      bio: 'Mengembangkan antarmuka website BAGANOVA serta mendukung integrasi sistem pemantauan dengan perangkat keras.',
      icon: 'fa-laptop-code',
      color: '#f472b6',
      image: '/assets/aistudio/image_3ffe3d06.png',
      imagePosition: 'center 32%',
      photoNote: null
    },
    {
      name: 'Ghania Shalindra Ardjanty',
      role: 'Research & Proposal Developer',
      prodi: 'Sistem Informasi Kelautan — UPI Kampus Serang',
      bio: 'Menyusun proposal penelitian, mengolah referensi, serta mengembangkan materi penelitian dan konsep proyek BAGANOVA.',
      icon: 'fa-book-open',
      color: '#a78bfa',
      image: '/assets/aistudio/WhatsApp_Image_2026-11-05_at_19.55.42_b4d9727c.jpeg',
      imagePosition: 'center 22%',
      photoNote: null
    },
    {
      name: 'Malaika Zayda Nuha',
      role: 'Editor & Publication Designer',
      prodi: 'Sistem Informasi Kelautan — UPI Kampus Serang',
      bio: 'Mengelola penyuntingan dokumen serta menyusun manual book, panduan penggunaan, dan materi publikasi BAGANOVA.',
      icon: 'fa-palette',
      color: '#34d399',
      image: malaikaHdImg,
      imagePosition: 'center 18%',
      photoNote: null
    }
  ];

  const techFeatures = [
    {
      icon: 'fa-weight-hanging',
      title: 'Sensor Beban',
      subtitle: 'Load Cell S-Beam & HX711',
      desc: 'Membaca perubahan gaya tarik untuk memantau beban hasil tangkapan.'
    },
    {
      icon: 'fa-microchip',
      title: 'Sistem Kendali',
      subtitle: 'ESP32 & Digital Filter',
      desc: 'Mengolah data sensor dan menghubungkan perangkat dengan website.'
    },
    {
      icon: 'fa-cog',
      title: 'Penggerak Otomatis',
      subtitle: 'Motor & Limit Switch',
      desc: 'Menggerakkan jaring dan mendeteksi batas pergerakan secara otomatis.'
    }
  ];

  return (
    <div className="page-view-container" style={{ padding: '2rem 1.5rem 5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
      
      {/* Breadcrumb Navigation: Beranda > Tentang Kami */}
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
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Tentang Kami</span>
      </nav>

      {/* Page Header Banner */}
      <ScrollSlide y={24}>
        <div
          style={{
          background: '#05152b',
          borderRadius: '24px',
          border: '1px solid rgba(0, 229, 208, 0.38)',
          padding: '3.25rem 2.5rem',
          marginBottom: '3.5rem',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.36)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Bagan, Nelayan & Ikan */}
        <img
          src={heroBaganImg}
          alt="Nelayan di atas bagan tancap dengan jaring dan kawanan ikan di bawah laut"
          referrerPolicy="no-referrer"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 42%',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        <HeroAquaticCanvas />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background:
              'linear-gradient(100deg, rgba(4, 15, 32, 0.84) 0%, rgba(5, 22, 46, 0.56) 52%, rgba(5, 22, 46, 0.16) 100%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
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
            Tentang Kami
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#e2e8f0',
              lineHeight: 1.7,
              marginBottom: '1.8rem'
            }}
          >
            Platform teknologi maritim terintegrasi untuk membantu nelayan bagan tancap pesisir mengotomatiskan pengangkatan jaring secara akurat, aman, dan efisien berbasis Internet of Things (IoT).
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCurrentView('guide');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ fontSize: '0.9rem', padding: '12px 24px' }}
            >
              <i className="fas fa-book-open"></i> Buka Panduan Nelayan
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCurrentView('welcome');
                setTimeout(() => {
                  const el = document.getElementById('kontak');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              style={{ fontSize: '0.9rem', padding: '12px 24px' }}
            >
              <i className="fas fa-envelope"></i> Hubungi Tim Pengembang
            </button>
          </div>
        </div>
      </div>
      </ScrollSlide>

      {/* Latar Belakang & Visi Inovasi */}
      <section style={{ marginBottom: '4rem' }}>
        <ScrollSectionSlide>
        <ScrollSlide style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-tag">
            <i className="fas fa-compass"></i> LATAR BELAKANG RISET
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            Transformasi Dari Tenaga Manual Menuju Otomasi Cerdas
          </h2>
        </ScrollSlide>

        <ScrollSlide delay={0.08}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '26px',
              maxWidth: '920px',
              margin: '0 auto',
              alignItems: 'stretch'
            }}
          >
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                padding: '30px 28px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <div style={{ color: '#ef4444', fontSize: '1.8rem', marginBottom: '14px' }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Tantangan Bagan Tradisional
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.94rem', textAlign: 'justify', margin: 0 }}>
                Pengoperasian bagan tancap secara tradisional masih banyak menggunakan tenaga manusia, terutama dalam proses pengangkatan dan penurunan jaring melalui roller. Aktivitas ini membutuhkan tenaga fisik dan berpotensi menimbulkan risiko keselamatan bagi nelayan. Selain itu, proses pemantauan beban hasil tangkapan masih bergantung pada pengamatan secara langsung, sehingga nelayan belum memiliki informasi pengukuran beban secara real-time sebagai pendukung pengambilan keputusan.
              </p>
            </div>

            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid rgba(0, 229, 208, 0.4)',
                borderRadius: '20px',
                padding: '30px 28px',
                boxShadow: '0 8px 30px rgba(0, 229, 208, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <div style={{ color: 'var(--primary)', fontSize: '1.8rem', marginBottom: '14px' }}>
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Solusi Terobosan BAGANOVA
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.94rem', textAlign: 'justify', margin: 0 }}>
                BAGANOVA menghadirkan sistem pemantauan dan pengendalian bagan berbasis IoT yang membantu nelayan memantau hasil tangkapan serta mengoperasikan pengangkatan jaring secara otomatis. Melalui integrasi sensor dan sistem digital, aktivitas bagan dapat dipantau dengan lebih mudah, praktis, dan efisien.
              </p>
            </div>
          </div>
        </ScrollSlide>
        </ScrollSectionSlide>
      </section>

      {/* Arsitektur Teknologi 3 Pilar */}
      <section style={{ marginBottom: '4.5rem' }}>
        <ScrollSectionSlide>
        <ScrollSlide style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-tag">
            <i className="fas fa-microchip"></i> SPESIFIKASI INSTRUMENTASI
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            3 Pilar Teknologi Utama BAGANOVA
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            Integrasi sensor, sistem kendali, dan mekanisme otomatisasi bagan.
          </p>
        </ScrollSlide>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}
        >
          {techFeatures.map((feat, idx) => (
            <ScrollSlide key={idx} delay={idx * 0.08}>
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                padding: '28px 26px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(56, 189, 248, 0.14)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  marginBottom: '18px'
                }}
              >
                <i className={`fas ${feat.icon}`}></i>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {feat.title}
              </h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '18px' }}>
                {feat.subtitle}
              </div>
              <p
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.94rem',
                  lineHeight: 1.6,
                  margin: 0,
                  paddingTop: '16px',
                  borderTop: '1px solid var(--card-border)',
                  flex: 1
                }}
              >
                {feat.desc}
              </p>
            </div>
            </ScrollSlide>
          ))}
        </div>
        </ScrollSectionSlide>
      </section>

      {/* Profil Tim Pengembang SIK UPI Kampus Serang */}
      <section style={{ marginBottom: '4rem' }}>
        <ScrollSectionSlide>
        <ScrollSlide style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-tag">
            <i className="fas fa-users"></i> TIM PENGEMBANG BAGANOVA
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            Sistem Informasi Kelautan — UPI Kampus Serang
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            Tim pengembang beranggotakan 4 mahasiswa Program Studi Sistem Informasi Kelautan (SIK), Universitas Pendidikan Indonesia Kampus Serang dalam perancangan prototipe, pengembangan sistem, riset kelautan, serta publikasi BAGANOVA.
          </p>
        </ScrollSlide>

        <div className="team-four-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
          {teamMembers.map((member, index) => (
            <ScrollSlide key={index} delay={index * 0.06} style={{ height: '100%', minWidth: 0 }}>
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '18px',
                padding: '22px 15px',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                minWidth: 0
              }}
            >
              <div style={{ position: 'relative', margin: '0 auto 16px', width: '120px', height: '120px', flexShrink: 0 }}>
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: member.imagePosition || 'center 20%',
                      border: `3px solid ${member.color}`,
                      boxShadow: `0 0 22px ${member.color}44`,
                      display: 'block'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: `rgba(${index === 0 ? '0, 229, 208' : index === 1 ? '56, 189, 248' : index === 2 ? '167, 139, 250' : '52, 211, 153'}, 0.15)`,
                      border: `3px solid ${member.color}`,
                      color: member.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      boxShadow: `0 0 20px ${member.color}33`
                    }}
                  >
                    <i className={`fas ${member.icon}`}></i>
                  </div>
                )}
                {member.photoNote && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(10, 25, 47, 0.95)',
                      border: `1px solid ${member.color}`,
                      color: member.color,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                  >
                    {member.photoNote}
                  </span>
                )}
              </div>

              <h3
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 5px 0',
                  lineHeight: 1.3,
                  minHeight: '2.65em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {member.name}
              </h3>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  marginBottom: '10px',
                  lineHeight: 1.3,
                  minHeight: '2.6em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {member.role}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--card-border)',
                  padding: '4px 9px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  marginBottom: '12px',
                  lineHeight: 1.3
                }}
              >
                <i className="fas fa-university" style={{ color: 'var(--primary)', fontSize: '0.68rem', flexShrink: 0 }}></i>
                <span>{member.prodi}</span>
              </div>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                  padding: '12px 4px 0',
                  borderTop: '1px solid var(--card-border)',
                  width: '100%',
                  textAlign: 'center',
                  textWrap: 'pretty'
                }}
              >
                {member.bio}
              </p>
            </div>
            </ScrollSlide>
          ))}
        </div>
        </ScrollSectionSlide>
      </section>

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
          Ingin Menerapkan BAGANOVA Pada Bagan Tancap Anda?
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 20px', fontSize: '0.95rem' }}>
          Kami membuka pendampingan teknis pemasangan sensor dan motor untuk nelayan bagan tancap di berbagai perairan Indonesia.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (currentUser) {
                setCurrentView('dashboard');
              } else {
                onOpenRegister();
              }
            }}
            style={{ padding: '12px 28px' }}
          >
            <i className="fas fa-user-plus"></i> {currentUser ? 'Buka Dashboard Saya' : 'Daftar Akun Nelayan'}
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

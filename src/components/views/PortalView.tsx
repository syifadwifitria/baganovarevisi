/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Portal Awal Sederhana & Khas Maritim
 * Tata letak ringkas, lapang, dan langsung pada tujuan dengan ciri khas BAGANOVA.
 */

import React from 'react';
import { useBagan } from '../../context/BaganContext';
import { ScrollSlide } from '../common/ScrollSlide';

interface PortalViewProps {
  onOpenLogin: (roleHint: 'fisherman' | 'admin') => void;
  onOpenRegister: () => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { setCurrentView } = useBagan();

  const navigateTo = (view: string, scrollId?: string) => {
    setCurrentView(view);
    if (scrollId) {
      setTimeout(() => {
        const el = document.getElementById(scrollId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const portals = [
    {
      id: 'fisherman',
      iconClass: 'fas fa-ship',
      toneClass: 'tone-ocean',
      title: 'Masuk Nelayan',
      desc: 'Pantau berat tangkapan dan kendalikan pengangkatan jaring otomatis.',
      actionLabel: 'Buka Login Nelayan',
      onClick: () => onOpenLogin('fisherman')
    },
    {
      id: 'register',
      iconClass: 'fas fa-user-plus',
      toneClass: 'tone-teal',
      title: 'Daftar Bagan',
      desc: 'Daftarkan bagan dan hubungkan perangkat IoT ke sistem BAGANOVA.',
      actionLabel: 'Daftar Sekarang',
      onClick: onOpenRegister
    },
    {
      id: 'admin',
      iconClass: 'fas fa-sliders-h',
      toneClass: 'tone-amber',
      title: 'Masuk Admin',
      desc: 'Kelola perangkat IoT, kalibrasi sensor, dan pengaduan.',
      actionLabel: 'Buka Console Admin',
      onClick: () => onOpenLogin('admin')
    }
  ];

  return (
    <div className="baganova-portal-page">
      {/* Decorative Coastal Wave Horizon at Bottom */}
      <svg
        className="baganova-portal-wave-bg"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,118 C280,175 560,62 860,118 C1120,166 1300,92 1440,124 L1440,200 L0,200 Z"
          fill="currentColor"
          fillOpacity="0.09"
        />
        <path
          d="M0,148 C340,104 680,188 1020,140 C1210,114 1340,148 1440,136 L1440,200 L0,200 Z"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </svg>

      {/* Main Centered Simple Portal Container */}
      <main className="baganova-portal-simple">
        <div className="baganova-portal-emblem">
          <img
            src="/assets/aistudio/Baganova_Maritime_Tech_Logo_adc8bd3e.png"
            alt="Logo BAGANOVA"
            referrerPolicy="no-referrer"
          />
        </div>

        <h1 className="baganova-portal-title">BAGANOVA</h1>
        <p className="baganova-portal-kicker">
          Smart Automated Bagan System
        </p>
        <p className="baganova-portal-subtitle">
          Sistem pemantauan beban dan pengangkatan jaring bagan tancap otomatis. Pilih jalur masuk untuk memulai.
        </p>

        {/* 3 Clean Portal Options */}
        <div className="baganova-portal-grid">
          {portals.map((item, idx) => (
            <ScrollSlide key={item.id} delay={0.05 + idx * 0.06} y={24}>
              <button
                type="button"
                className={`baganova-portal-card ${item.toneClass}`}
                onClick={item.onClick}
                style={{ width: '100%', height: '100%' }}
              >
                <div className={`baganova-portal-card-icon ${item.toneClass}`} aria-hidden="true">
                  <i className={item.iconClass}></i>
                </div>
                <h2 className="baganova-portal-card-title">{item.title}</h2>
                <p className="baganova-portal-card-desc">{item.desc}</p>
                <span className="baganova-portal-card-cta">
                  {item.actionLabel} <i className="fas fa-arrow-right" aria-hidden="true"></i>
                </span>
              </button>
            </ScrollSlide>
          ))}
        </div>

        {/* Highlighted Centered Public Navigation */}
        <ScrollSlide delay={0.2} y={18}>
        <nav className="baganova-portal-links" aria-label="Tautan Informasi Publik">
          <button type="button" onClick={() => navigateTo('welcome')}>
            <i className="fas fa-home" aria-hidden="true"></i> Beranda Lengkap
          </button>
          <span className="baganova-portal-links-sep" aria-hidden="true"></span>
          <button type="button" onClick={() => navigateTo('fisheries')}>
            <i className="fas fa-cloud-sun-rain" aria-hidden="true"></i> Cuaca &amp; Tangkap
          </button>
          <span className="baganova-portal-links-sep" aria-hidden="true"></span>
          <button type="button" onClick={() => navigateTo('about')}>
            <i className="fas fa-users" aria-hidden="true"></i> Tentang Kami
          </button>
          <span className="baganova-portal-links-sep" aria-hidden="true"></span>
          <button type="button" onClick={() => navigateTo('guide')}>
            <i className="fas fa-book-open" aria-hidden="true"></i> Panduan Nelayan
          </button>
          <span className="baganova-portal-links-sep" aria-hidden="true"></span>
          <button type="button" onClick={() => navigateTo('sim3d')}>
            <i className="fas fa-cube" aria-hidden="true"></i> Simulasi 3D
          </button>
          <span className="baganova-portal-links-sep" aria-hidden="true"></span>
          <button type="button" onClick={() => navigateTo('welcome', 'faq')}>
            <i className="fas fa-question-circle" aria-hidden="true"></i> FAQ &amp; Kontak
          </button>
        </nav>
        </ScrollSlide>
      </main>

      {/* Quiet Footer */}
      <footer className="baganova-portal-footer">
        <p>&copy; 2026 BAGANOVA · Sistem Informasi Kelautan, UPI Kampus Serang</p>
      </footer>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Footer Component
 */

import React from 'react';
import { useBagan } from '../context/BaganContext';

export const Footer: React.FC = () => {
  const { setCurrentView, activeBagan } = useBagan();

  const handleNav = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-modern" style={{ position: 'relative', zIndex: 10 }}>
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src="/assets/aistudio/Baganova_Maritime_Tech_Logo_adc8bd3e.png"
              alt="Logo BAGANOVA"
              className="footer-logo-img"
            />
            <div className="footer-brand-title">
              <h3>BAGANOVA</h3>
              <small>Smart Automated Bagan System</small>
            </div>
          </div>
          <p>
            BAGANOVA merupakan sistem otomatisasi bagan tancap yang mengintegrasikan sensor beban, mikrokontroler ESP32, dan mekanisme pengangkatan jaring untuk membantu nelayan memantau serta mengendalikan proses penangkapan ikan.
          </p>
          <div className="system-status-indicator">
            <span className="status-dot"></span>
            <span>
              Perangkat Aktif: {activeBagan.name} ({activeBagan.id}) · Status: PROTOTIPE
            </span>
          </div>
        </div>

        <div className="footer-links">
          <h4>Navigasi Halaman</h4>
          <ul>
            <li>
              <button
                type="button"
                onClick={() => handleNav('welcome')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Beranda Publik
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('about')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Tentang Kami & Tim
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('guide')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Panduan Nelayan &amp; SOP
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('sim3d')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Simulasi 3D Prototipe
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('timo-ai')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                TIMO AI · Asisten Virtual
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('articles')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Artikel Bagan &amp; Tangkapan
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Dashboard Multi-Bagan
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('monitoring')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Monitoring Beban Tali
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('control')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Kontrol Jaring & Bagan
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('analytics')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Analisis Kinerja
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('history')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Riwayat Pengangkatan
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('settings')}
                style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0 }}
              >
                Pengaturan & Kalibrasi
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Informasi &amp; Dukungan Sistem</h4>
          <p style={{ alignItems: 'flex-start' }}>
            <i className="fas fa-anchor" style={{ marginTop: '4px' }}></i>
            <span>Pengembangan: Sistem Pemantauan dan Otomatisasi Bagan Tancap</span>
          </p>
          <p style={{ alignItems: 'flex-start' }}>
            <i className="fas fa-university" style={{ marginTop: '4px' }}></i>
            <span>
              <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                Universitas Pendidikan Indonesia
              </strong>
              Program Studi Sistem Informasi Kelautan (SIK), Kampus UPI di Serang, Jl. Ciracas No. 38, Kota Serang - Banten
            </span>
          </p>
          <p>
            <i className="fas fa-envelope"></i>
            <span>Kontak Pengembang: baganova@gmail.com</span>
          </p>
          <p>
            <i className="fas fa-headset"></i>
            <span>
              Call Center:{' '}
              <strong style={{ color: '#34d399', fontWeight: 700 }}>
                <i className="fab fa-whatsapp" style={{ color: '#34d399', marginRight: '4px' }}></i>
                0857-1007-1606
              </strong>
            </span>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 BAGANOVA — Smart Automated Bagan System. Hak cipta dilindungi undang-undang.</p>
        <div className="footer-tags">
          <span>Smart Bagan Tancap</span> · <span>Sensor Load Cell &amp; HX711</span> · <span>Otomatisasi Jaring</span> · <span>ESP32 IoT</span>
        </div>
      </div>
    </footer>
  );
};

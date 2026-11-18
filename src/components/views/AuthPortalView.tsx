/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Maritime Split Authentication Page
 * Identitas visual khas BAGANOVA: panel cerita maritim & maskot Timo di kiri,
 * serta ruang autentikasi terpadu (Nelayan / Daftar Bagan / Pengembang) di kanan.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useBagan } from '../../context/BaganContext';
import timoMascotImg from '../../assets/images/timo_baganova_transparent_v2.png';

export type AuthPageMode = 'login-user' | 'login-admin' | 'register';

interface AuthPortalViewProps {
  mode: AuthPageMode;
  onChangeMode: (nextMode: AuthPageMode) => void;
  defaultIdentifier?: string;
}

export const AuthPortalView: React.FC<AuthPortalViewProps> = ({
  mode,
  onChangeMode,
  defaultIdentifier = ''
}) => {
  const { login, registerFisherman, setCurrentView } = useBagan();

  // Login State
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register State
  const [regForm, setRegForm] = useState({
    fullName: '',
    phoneNumber: '',
    location: '',
    baganSerialCode: '',
    username: '',
    email: '',
    password: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  const pendingRegisteredUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingRegisteredUserRef.current) {
      setIdentifier(pendingRegisteredUserRef.current);
      setPassword('');
      pendingRegisteredUserRef.current = null;
      return;
    }
    if (defaultIdentifier) {
      setIdentifier(defaultIdentifier);
    } else {
      setIdentifier('');
      setPassword('');
    }
  }, [defaultIdentifier, mode]);

  const isAdmin = mode === 'login-admin';
  const isRegister = mode === 'register';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(identifier, password);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = registerFisherman(regForm);
    if (res.success) {
      pendingRegisteredUserRef.current = regForm.username.trim();
      setPassword('');
      onChangeMode('login-user');
    }
  };

  return (
    <div className="baganova-auth-page">
      <div className="baganova-auth-shell">
        {/* ================= LEFT COLUMN: BAGANOVA STORY & TIMO ================= */}
        <section className="baganova-auth-showcase" aria-label="Maskot dan Identitas BAGANOVA">
          {/* Decorative Maritime Wave Line Art */}
          <svg
            className="baganova-auth-waves"
            viewBox="0 0 600 160"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,74 C110,120 210,24 330,72 C440,115 520,48 600,68 L600,160 L0,160 Z"
              fill="currentColor"
              fillOpacity="0.14"
            />
            <path
              d="M0,104 C130,62 240,136 370,96 C470,66 540,108 600,94 L600,160 L0,160 Z"
              fill="currentColor"
              fillOpacity="0.22"
            />
          </svg>

          {/* Top Bar inside Showcase: Wordmark & Back Link */}
          <div className="baganova-auth-showcase-top">
            <div className="baganova-auth-brand">
              <div className="baganova-auth-brand-icon">
                <img
                  src="/assets/aistudio/Baganova_Maritime_Tech_Logo_adc8bd3e.png"
                  alt="Logo BAGANOVA"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <strong className="baganova-auth-brand-name">BAGANOVA</strong>
                <span className="baganova-auth-brand-sub">Smart Automated Bagan</span>
              </div>
            </div>

            <button
              type="button"
              className="baganova-auth-back-btn"
              onClick={() => {
                setCurrentView('portal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <i className="fas fa-arrow-left" aria-hidden="true"></i>
              <span>Portal Awal</span>
            </button>
          </div>

          {/* Centerpiece: Timo Porthole Frame & Speech Note */}
          <div className="baganova-auth-mascot-stage">
            <div className="baganova-auth-mascot-frame">
              <img
                src={timoMascotImg}
                alt="Timo — Maskot BAGANOVA"
                className="baganova-auth-mascot-img"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="baganova-auth-mascot-card">
              <p className="baganova-auth-mascot-greeting">Selamat datang di BAGANOVA! 👋🏻</p>
              <p className="baganova-auth-mascot-quote">
                Perkenalkan, aku TIMO, asisten virtual BAGANOVA. Aku siap membantu memberikan informasi dan
                menemanimu menjelajahi berbagai fitur yang tersedia.
              </p>
              <p className="baganova-auth-mascot-prompt">Apa yang bisa aku bantu hari ini?</p>
            </div>
          </div>

          {/* Bottom Real Institution Note */}
          <div className="baganova-auth-showcase-foot">
            <span>Sistem Informasi Kelautan</span>
            <span aria-hidden="true">·</span>
            <span>UPI Kampus Serang</span>
          </div>
        </section>

        {/* ================= RIGHT COLUMN: AUTHENTICATION FORM ================= */}
        <section className="baganova-auth-panel" aria-label="Formulir Autentikasi">
          {/* Segmented Role Switcher */}
          <div className="baganova-auth-segmented" role="tablist" aria-label="Pilih Jenis Akses">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login-user'}
              className={`baganova-auth-seg-btn ${mode === 'login-user' ? 'active' : ''}`}
              onClick={() => onChangeMode('login-user')}
            >
              Nelayan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`baganova-auth-seg-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => onChangeMode('register')}
            >
              Daftar Bagan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login-admin'}
              className={`baganova-auth-seg-btn ${mode === 'login-admin' ? 'active' : ''}`}
              onClick={() => onChangeMode('login-admin')}
            >
              Pengembang
            </button>
          </div>

          {!isRegister ? (
            <>
              <div className="baganova-auth-heading-block">
                <h1 className="baganova-auth-heading">
                  {isAdmin ? 'Masuk Console Pengembang' : 'Masuk ke Dashboard Nelayan'}
                </h1>
                <p className="baganova-auth-subheading">
                  {isAdmin
                    ? 'Akses kalibrasi sensor HX711, telemetri perangkat, dan daftar pengaduan.'
                    : 'Pantau berat tangkapan dan atur batas pengangkatan jaring.'}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="baganova-auth-form">
                <div className="baganova-auth-field">
                  <label htmlFor="authIdentifier">
                    {isAdmin ? 'Email atau Username Admin' : 'Username atau Email Nelayan'}
                  </label>
                  <div className="baganova-auth-input-wrap">
                    <input
                      id="authIdentifier"
                      type="text"
                      placeholder={isAdmin ? 'Masukkan email atau username admin' : 'Masukkan username atau email'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      autoFocus
                    />
                    <i className="fas fa-user baganova-auth-input-icon" aria-hidden="true"></i>
                  </div>
                </div>

                <div className="baganova-auth-field">
                  <label htmlFor="authPassword">Kata Sandi</label>
                  <div className="baganova-auth-input-wrap">
                    <input
                      id="authPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="baganova-auth-eye-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                      title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="baganova-auth-submit-btn">
                  {isAdmin ? 'Masuk Console Admin' : 'Masuk Dashboard Nelayan'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="baganova-auth-heading-block">
                <h1 className="baganova-auth-heading">Daftarkan Unit Bagan Baru</h1>
                <p className="baganova-auth-subheading">
                  Lengkapi identitas pemilik dan kode bagan tancap untuk mulai terhubung.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="baganova-auth-form baganova-auth-form-compact">
                <div className="baganova-auth-two-col">
                  <div className="baganova-auth-field">
                    <label htmlFor="portalRegName">Nama Lengkap</label>
                    <div className="baganova-auth-input-wrap">
                      <input
                        id="portalRegName"
                        type="text"
                        placeholder="Pak Suhendra"
                        value={regForm.fullName}
                        onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="baganova-auth-field">
                    <label htmlFor="portalRegPhone">No. WhatsApp</label>
                    <div className="baganova-auth-input-wrap">
                      <input
                        id="portalRegPhone"
                        type="tel"
                        placeholder="0812-3456-7890"
                        value={regForm.phoneNumber}
                        onChange={(e) => setRegForm({ ...regForm, phoneNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="baganova-auth-two-col">
                  <div className="baganova-auth-field">
                    <label htmlFor="portalRegLocation">Lokasi Perairan</label>
                    <div className="baganova-auth-input-wrap">
                      <input
                        id="portalRegLocation"
                        type="text"
                        placeholder="Contoh: Pesisir Teluk Banten / Nusantara"
                        value={regForm.location}
                        onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="baganova-auth-field">
                    <label htmlFor="portalRegCode">Nama / Kode Bagan</label>
                    <div className="baganova-auth-input-wrap">
                      <input
                        id="portalRegCode"
                        type="text"
                        placeholder="Bagan Barokah 01"
                        value={regForm.baganSerialCode}
                        onChange={(e) => setRegForm({ ...regForm, baganSerialCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="baganova-auth-two-col">
                  <div className="baganova-auth-field">
                    <label htmlFor="portalRegUser">Buat Username</label>
                    <div className="baganova-auth-input-wrap">
                      <input
                        id="portalRegUser"
                        type="text"
                        placeholder="hendra_bagan"
                        value={regForm.username}
                        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="baganova-auth-field">
                    <label htmlFor="portalRegPass">Buat Kata Sandi</label>
                    <div className="baganova-auth-input-wrap">
                      <input
                        id="portalRegPass"
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="baganova-auth-eye-btn"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        aria-label={showRegPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                      >
                        <i className={`fas ${showRegPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="baganova-auth-submit-btn">
                  Daftarkan Akun Nelayan
                </button>
              </form>
            </>
          )}

          {/* Subtle Public Links at Bottom */}
          <div className="baganova-auth-footer-links">
            <button type="button" onClick={() => setCurrentView('sim3d')}>
              Lihat Simulasi 3D Prototipe
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => setCurrentView('guide')}>
              Panduan Nelayan
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => setCurrentView('welcome')}>
              Beranda Lengkap
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

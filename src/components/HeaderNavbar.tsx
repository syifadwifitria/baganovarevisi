/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Header & Navigation Bar
 * 1. Tombol Masuk dan Daftar berada di sebelah paling kanan atas.
 * 2. Tulisan sederhana: "Masuk", "Daftar", dan "Keluar" saat sudah login.
 * 3. Navigasi fitur bersih tanpa dropdown demo role yang membingungkan.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useBagan } from '../context/BaganContext';

interface HeaderNavbarProps {
  onOpenLoginModal: () => void;
  onOpenRegisterModal: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenLoginModal,
  onOpenRegisterModal
}) => {
  const {
    currentUser,
    currentRole,
    currentView,
    setCurrentView,
    logout
  } = useBagan();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqDropdownOpen, setFaqDropdownOpen] = useState(false);
  const [mobileFaqOpen, setMobileFaqOpen] = useState(false);
  const faqDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        faqDropdownRef.current &&
        !faqDropdownRef.current.contains(event.target as Node)
      ) {
        setFaqDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFaqDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const navigateToView = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    setFaqDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToWelcomeSection = (id: string) => {
    setMobileMenuOpen(false);
    setFaqDropdownOpen(false);
    if (currentView !== 'welcome') {
      setCurrentView('welcome');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const isFaqMenuActive = currentView === 'timo-ai' || currentView === 'articles';

  const renderDesktopFaqDropdown = (label: string, iconClass: string) => (
    <div className="baganova-nav-dropdown" ref={faqDropdownRef}>
      <button
        type="button"
        className={`menu-link baganova-nav-dropdown-trigger ${isFaqMenuActive ? 'active' : ''}`}
        onClick={() => setFaqDropdownOpen((prev) => !prev)}
        aria-expanded={faqDropdownOpen}
        aria-haspopup="menu"
      >
        <i className={iconClass}></i>
        <span>{label}</span>
        <i
          className={`fas fa-chevron-down baganova-nav-caret ${faqDropdownOpen ? 'open' : ''}`}
          aria-hidden="true"
        ></i>
      </button>

      {faqDropdownOpen && (
        <div className="baganova-nav-dropdown-menu" role="menu" aria-label="Menu FAQ, TIMO AI, dan Artikel">
          <button
            type="button"
            role="menuitem"
            className="baganova-nav-dropdown-item"
            onClick={() => scrollToWelcomeSection('faq')}
          >
            <span className="baganova-nav-dd-icon tone-faq" aria-hidden="true">
              <i className="fas fa-question-circle"></i>
            </span>
            <span>
              <strong>Pertanyaan Umum (FAQ)</strong>
              <small>Tanya jawab teknis &amp; operasional BAGANOVA</small>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={`baganova-nav-dropdown-item ${currentView === 'timo-ai' ? 'active' : ''}`}
            onClick={() => navigateToView('timo-ai')}
          >
            <span className="baganova-nav-dd-icon tone-ai" aria-hidden="true">
              <i className="fas fa-robot"></i>
            </span>
            <span>
              <strong>TIMO AI · Asisten Virtual</strong>
              <small>Bot chat otomatis tanya jawab 24/7</small>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={`baganova-nav-dropdown-item ${currentView === 'articles' ? 'active' : ''}`}
            onClick={() => navigateToView('articles')}
          >
            <span className="baganova-nav-dd-icon tone-news" aria-hidden="true">
              <i className="fas fa-newspaper"></i>
            </span>
            <span>
              <strong>Artikel Bagan &amp; Tangkapan</strong>
              <small>Berita nyata tangkapan &amp; perikanan bagan terkini</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="header" id="header" style={{ zIndex: 1000 }}>
        {/* Brand Logo & Title di Kiri */}
        <div
          className="logo-section"
          onClick={() => {
            if (currentUser) {
              navigateToView('dashboard');
            } else {
              navigateToView('portal');
            }
          }}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-icon">
            <img
              src="/assets/aistudio/Baganova_Maritime_Tech_Logo_adc8bd3e.png"
              alt="Logo BAGANOVA"
              className="brand-logo-img"
            />
          </div>
          <div className="logo-text">
            <span className="main-title">BAGANOVA</span>
            <span className="subtitle">SMART AUTOMATED BAGAN</span>
          </div>
        </div>

        {/* Role / Access Badge */}
        <div className="user-greeting hidden-mobile" style={{ marginLeft: '12px' }}>
          <span className="greeting-text">
            {currentUser ? (
              <>
                Operator:{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  {currentUser.fullName.split(' ')[0]}
                </strong>{' '}
                👋
              </>
            ) : (
              <>
                Akses:{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  Publik
                </strong>{' '}
                🌊
              </>
            )}
          </span>
        </div>

        {/* Desktop Menu Tengah & Kanan */}
        <nav className="top-bar" id="topBar">
          {/* Menu Fitur di Navbar */}
          {!currentUser ? (
            /* Saat Belum Login (Halaman Publik) */
            <>
              <button
                type="button"
                className={`menu-link ${currentView === 'welcome' ? 'active' : ''}`}
                onClick={() => navigateToView('welcome')}
              >
                <i className="fas fa-home"></i> BERANDA
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'about' ? 'active' : ''}`}
                onClick={() => navigateToView('about')}
              >
                <i className="fas fa-info-circle"></i> TENTANG KAMI
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'guide' || currentView === 'sop' ? 'active' : ''}`}
                onClick={() => navigateToView('guide')}
              >
                <i className="fas fa-book"></i> PANDUAN
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'sim3d' ? 'active' : ''}`}
                onClick={() => navigateToView('sim3d')}
              >
                <i className="fas fa-cube"></i> SIMULASI 3D
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'fisheries' ? 'active' : ''}`}
                onClick={() => navigateToView('fisheries')}
              >
                <i className="fas fa-cloud-sun-rain"></i> CUACA &amp; TANGKAP
              </button>

              {renderDesktopFaqDropdown('FAQ', 'fas fa-question-circle')}
            </>
          ) : currentRole === 'fisherman' ? (
            /* Saat Login Sebagai Nelayan */
            <>
              <button
                type="button"
                className={`menu-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => navigateToView('dashboard')}
              >
                <i className="fas fa-ship"></i> DASHBOARD SAYA
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'fisheries' ? 'active' : ''}`}
                onClick={() => navigateToView('fisheries')}
              >
                <i className="fas fa-cloud-sun-rain"></i> CUACA &amp; TANGKAP
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'guide' || currentView === 'sop' ? 'active' : ''}`}
                onClick={() => navigateToView('guide')}
              >
                <i className="fas fa-book"></i> PANDUAN
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'about' ? 'active' : ''}`}
                onClick={() => navigateToView('about')}
              >
                <i className="fas fa-info-circle"></i> TENTANG SISTEM
              </button>

              {renderDesktopFaqDropdown('FAQ', 'fas fa-life-ring')}
            </>
          ) : (
            /* Saat Login Sebagai Pengembang / Admin */
            <>
              <button
                type="button"
                className={`menu-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => navigateToView('dashboard')}
              >
                <i className="fas fa-microchip"></i> DASHBOARD
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'about' ? 'active' : ''}`}
                onClick={() => navigateToView('about')}
              >
                <i className="fas fa-info-circle"></i> TENTANG KAMI
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'guide' || currentView === 'sop' ? 'active' : ''}`}
                onClick={() => navigateToView('guide')}
              >
                <i className="fas fa-book"></i> PANDUAN
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'sim3d' ? 'active' : ''}`}
                onClick={() => navigateToView('sim3d')}
              >
                <i className="fas fa-cube"></i> SIMULASI 3D
              </button>

              <button
                type="button"
                className={`menu-link ${currentView === 'fisheries' ? 'active' : ''}`}
                onClick={() => navigateToView('fisheries')}
              >
                <i className="fas fa-cloud-sun-rain"></i> CUACA &amp; TANGKAP
              </button>

              <button
                type="button"
                className="menu-link"
                onClick={() => navigateToView('welcome')}
              >
                <i className="fas fa-home"></i> BERANDA
              </button>

              {renderDesktopFaqDropdown('FAQ', 'fas fa-question-circle')}
            </>
          )}

          {/* SISI PALING KANAN ATAS: Tombol Masuk & Daftar / Keluar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px', flexShrink: 0 }}>
            {!currentUser ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenLoginModal}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <i className="fas fa-sign-in-alt"></i> Masuk
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onOpenRegisterModal}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <i className="fas fa-user-plus"></i> Daftar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-logout-header"
                onClick={logout}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <i className="fas fa-sign-out-alt"></i> Keluar
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="mobile-toggle-btn"
          id="mobileToggleBtn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Buka Menu"
        >
          <i className="fas fa-bars"></i>
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-overlay open"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Nav Drawer */}
      <aside className={`mobile-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-brand-wrap">
            <img
              src="/assets/aistudio/Baganova_Maritime_Tech_Logo_adc8bd3e.png"
              alt="Logo BAGANOVA"
              className="mobile-logo-img"
            />
            <div className="logo-text">
              <span className="main-title">BAGANOVA</span>
              <span className="subtitle">Smart Monitoring System</span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            &times;
          </button>
        </div>

        <div className="mobile-nav-items">
          {!currentUser ? (
            <>
              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'welcome' ? 'active' : ''}`}
                onClick={() => navigateToView('welcome')}
              >
                <i className="fas fa-home"></i> Beranda
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'about' ? 'active' : ''}`}
                onClick={() => navigateToView('about')}
              >
                <i className="fas fa-info-circle"></i> Tentang Kami & Tim
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'guide' || currentView === 'sop' ? 'active' : ''}`}
                onClick={() => navigateToView('guide')}
              >
                <i className="fas fa-book"></i> Panduan Nelayan
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'sim3d' ? 'active' : ''}`}
                onClick={() => navigateToView('sim3d')}
              >
                <i className="fas fa-cube"></i> Simulasi 3D Prototipe
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'fisheries' ? 'active' : ''}`}
                onClick={() => navigateToView('fisheries')}
              >
                <i className="fas fa-cloud-sun-rain"></i> Cuaca, Tangkap &amp; Populasi
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${isFaqMenuActive ? 'active' : ''}`}
                onClick={() => setMobileFaqOpen((prev) => !prev)}
                aria-expanded={mobileFaqOpen}
              >
                <i className="fas fa-question-circle"></i> FAQ &amp; Pusat Info
                <i
                  className={`fas fa-chevron-down`}
                  style={{
                    marginLeft: 'auto',
                    transform: mobileFaqOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease'
                  }}
                ></i>
              </button>
              {mobileFaqOpen && (
                <div className="baganova-mobile-subnav">
                  <button type="button" onClick={() => scrollToWelcomeSection('faq')}>
                    <i className="fas fa-list-ul"></i> Pertanyaan Umum (FAQ)
                  </button>
                  <button type="button" onClick={() => navigateToView('timo-ai')}>
                    <i className="fas fa-robot"></i> TIMO AI (Asisten Virtual)
                  </button>
                  <button type="button" onClick={() => navigateToView('articles')}>
                    <i className="fas fa-newspaper"></i> Artikel Bagan &amp; Tangkapan
                  </button>
                </div>
              )}

              <hr style={{ borderColor: 'var(--card-border)', margin: '12px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLoginModal();
                  }}
                >
                  <i className="fas fa-sign-in-alt"></i> Masuk
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenRegisterModal();
                  }}
                >
                  <i className="fas fa-user-plus"></i> Daftar
                </button>
              </div>
            </>
          ) : currentRole === 'fisherman' ? (
            <>
              <div style={{ padding: '8px 12px', background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: '10px', marginBottom: '8px' }}>
                <small style={{ color: 'var(--text-secondary)' }}>Login sebagai Nelayan:</small>
                <strong style={{ display: 'block', color: 'var(--primary)' }}>{currentUser.fullName}</strong>
              </div>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('dashboard')}
              >
                <i className="fas fa-ship"></i> Dashboard Saya
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'fisheries' ? 'active' : ''}`}
                onClick={() => navigateToView('fisheries')}
              >
                <i className="fas fa-cloud-sun-rain"></i> Cuaca &amp; Logbook Tangkap
              </button>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('guide')}
              >
                <i className="fas fa-book"></i> Panduan Nelayan
              </button>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('about')}
              >
                <i className="fas fa-info-circle"></i> Tentang Sistem
              </button>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => scrollToWelcomeSection('faq')}
              >
                <i className="fas fa-life-ring"></i> Bantuan &amp; FAQ
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'timo-ai' ? 'active' : ''}`}
                onClick={() => navigateToView('timo-ai')}
              >
                <i className="fas fa-robot"></i> TIMO AI (Bot Chat)
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'articles' ? 'active' : ''}`}
                onClick={() => navigateToView('articles')}
              >
                <i className="fas fa-newspaper"></i> Artikel Bagan Terkini
              </button>

              <hr style={{ borderColor: 'var(--card-border)', margin: '12px 0' }} />

              <button
                type="button"
                className="btn btn-secondary btn-logout-header"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <i className="fas fa-sign-out-alt"></i> Keluar
              </button>
            </>
          ) : (
            <>
              <div style={{ padding: '8px 12px', background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: '10px', marginBottom: '8px' }}>
                <small style={{ color: 'var(--text-secondary)' }}>Login sebagai Pengembang:</small>
                <strong style={{ display: 'block', color: 'var(--primary)' }}>{currentUser.fullName}</strong>
              </div>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('dashboard')}
              >
                <i className="fas fa-microchip"></i> Dashboard Pengembang
              </button>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('about')}
              >
                <i className="fas fa-info-circle"></i> Tentang Kami
              </button>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('guide')}
              >
                <i className="fas fa-book"></i> Panduan Nelayan
              </button>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('sim3d')}
              >
                <i className="fas fa-cube"></i> Simulasi 3D Prototipe
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'fisheries' ? 'active' : ''}`}
                onClick={() => navigateToView('fisheries')}
              >
                <i className="fas fa-cloud-sun-rain"></i> Cuaca, Tangkap &amp; Populasi
              </button>

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => navigateToView('welcome')}
              >
                <i className="fas fa-home"></i> Halaman Awal
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'timo-ai' ? 'active' : ''}`}
                onClick={() => navigateToView('timo-ai')}
              >
                <i className="fas fa-robot"></i> TIMO AI (Asisten Virtual)
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${currentView === 'articles' ? 'active' : ''}`}
                onClick={() => navigateToView('articles')}
              >
                <i className="fas fa-newspaper"></i> Artikel Bagan &amp; Tangkapan
              </button>

              <hr style={{ borderColor: 'var(--card-border)', margin: '12px 0' }} />

              <button
                type="button"
                className="btn btn-secondary btn-logout-header"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <i className="fas fa-sign-out-alt"></i> Keluar
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Smart Automated Bagan System
 * Root Application Router:
 * 1. Default for Visitors: Welcoming Initial Landing Page (As in Screenshot)
 * 2. Logged In as Fisherman: FishermanDashboard (Simple & Touch-Friendly for Mobile)
 * 3. Logged In as Developer: AdminDashboard (Connected to Fishermen, Calibration & Telemetry)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BaganProvider, useBagan } from './context/BaganContext';
import { ParticleBackground } from './components/BackgroundCanvases';
import { GlobalPageBackdrop, BackdropScene } from './components/common/GlobalPageBackdrop';
import { ScrollProgressBar } from './components/common/ScrollSlide';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Footer } from './components/Footer';
import { TimoLoader } from './components/TimoLoader';
import { PortalView } from './components/views/PortalView';
import { AuthPortalView, AuthPageMode } from './components/views/AuthPortalView';
import { WelcomeView } from './components/views/WelcomeView';
import { AboutView } from './components/views/AboutView';
import { GuideView } from './components/views/GuideView';
import { Simulation3DView } from './components/views/Simulation3DView';
import { TimoAiView } from './components/views/TimoAiView';
import { ArticlesView } from './components/views/ArticlesView';
import { FisheriesIntelView } from './components/views/FisheriesIntelView';
import { FishermanDashboard } from './components/views/FishermanDashboard';
import { AdminDashboard } from './components/views/AdminDashboard';

const MainLayout: React.FC = () => {
  const { currentUser, currentRole, currentView, setCurrentView, toast } = useBagan();
  const prefersReducedMotion = useReducedMotion();
  const [authMode, setAuthMode] = useState<AuthPageMode>('login-user');
  const [scrollUpVisible, setScrollUpVisible] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baganova_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const [splashPhase, setSplashPhase] = useState<'visible' | 'fading' | 'done'>('visible');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setSplashPhase('fading'), 750);
    const doneTimer = window.setTimeout(() => setSplashPhase('done'), 1100);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setScrollUpVisible(true);
      } else {
        setScrollUpVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('baganova_theme', next);
    setCurrentTheme(next);
  };

  const navigateToAuthPage = (mode: AuthPageMode) => {
    setAuthMode(mode);
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAuthView = currentView === 'auth';
  const isPortalView =
    currentView === 'portal' ||
    (!currentUser &&
      currentView !== 'welcome' &&
      currentView !== 'about' &&
      currentView !== 'guide' &&
      currentView !== 'sop' &&
      currentView !== 'sim3d' &&
      currentView !== 'timo-ai' &&
      currentView !== 'articles' &&
      currentView !== 'fisheries' &&
      currentView !== 'auth');
  const isStandaloneGateway = isPortalView || isAuthView;
  const isFishermanDashboardActive =
    Boolean(currentUser) &&
    currentRole === 'fisherman' &&
    !isStandaloneGateway &&
    currentView !== 'welcome' &&
    currentView !== 'about' &&
    currentView !== 'guide' &&
    currentView !== 'sop' &&
    currentView !== 'sim3d' &&
    currentView !== 'timo-ai' &&
    currentView !== 'articles' &&
    currentView !== 'fisheries';

  const activeBackdropScene: BackdropScene = (() => {
    if (currentView === 'about') return 'about';
    if (currentView === 'guide' || currentView === 'sop') return 'guide';
    if (currentView === 'sim3d') return 'sim3d';
    if (currentView === 'timo-ai') return 'timo-ai';
    if (currentView === 'articles') return 'articles';
    if (currentView === 'fisheries') return 'fisheries';
    if (isAuthView) return 'auth';
    if (isPortalView) return 'portal';
    if (!currentUser || currentView === 'welcome') return 'welcome';
    if (currentRole === 'fisherman') return 'fisherman';
    return 'admin';
  })();

  const activeViewKey = `${activeBackdropScene}-${currentView}-${currentRole || 'guest'}`;

  // Determine what view to render based on user role and current view
  const renderContent = () => {
    // A. Dedicated "Tentang Kami" Page (Beranda > Tentang Kami)
    if (currentView === 'about') {
      return (
        <AboutView
          onOpenLogin={() => navigateToAuthPage('login-user')}
          onOpenRegister={() => navigateToAuthPage('register')}
        />
      );
    }

    // B. Dedicated "Panduan" Page (Beranda > Panduan)
    if (currentView === 'guide' || currentView === 'sop') {
      return (
        <GuideView
          onOpenLogin={() => navigateToAuthPage('login-user')}
          onOpenRegister={() => navigateToAuthPage('register')}
        />
      );
    }

    // B2. Dedicated "Simulasi 3D Prototipe" Page
    if (currentView === 'sim3d') {
      return <Simulation3DView />;
    }

    // B3. Dedicated "TIMO AI Assistant" Page
    if (currentView === 'timo-ai') {
      return <TimoAiView />;
    }

    // B4. Dedicated "Artikel Bagan & Tangkapan" Page
    if (currentView === 'articles') {
      return <ArticlesView />;
    }

    // B5. Dedicated "Cuaca, Hasil Tangkap, Dinamika Populasi & Konservasi" Page
    if (currentView === 'fisheries') {
      return <FisheriesIntelView />;
    }

    // C1. Dedicated Full-Page Split Auth View with Timo Mascot
    if (isAuthView) {
      return (
        <AuthPortalView
          mode={authMode}
          onChangeMode={(nextMode) => setAuthMode(nextMode)}
        />
      );
    }

    // C2. Initial Portal Gateway (Welcome to BAGANOVA - 3 Portal Cards)
    if (isPortalView) {
      return (
        <PortalView
          onOpenLogin={(roleHint) =>
            navigateToAuthPage(roleHint === 'admin' ? 'login-admin' : 'login-user')
          }
          onOpenRegister={() => navigateToAuthPage('register')}
        />
      );
    }

    // 1. Beranda Lengkap Publik
    if (!currentUser || currentView === 'welcome') {
      return (
        <WelcomeView
          onOpenLogin={() => navigateToAuthPage('login-user')}
          onOpenRegister={() => navigateToAuthPage('register')}
        />
      );
    }

    // 2. If logged in as Fisherman: Show simple mobile-first Fisherman Dashboard
    if (currentRole === 'fisherman') {
      return <FishermanDashboard />;
    }

    // 3. If logged in as Developer / Admin: Show comprehensive Admin Dashboard
    return <AdminDashboard />;
  };

  return (
    <div
      className={isFishermanDashboardActive ? 'has-fisherman-estop' : ''}
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {splashPhase !== 'done' && (
        <TimoLoader
          variant="splash"
          isFadingOut={splashPhase === 'fading'}
          message="Timo lagi siap-siap meluncur!"
          subtext="Menyiapkan dashboard dan sistem pemantauan bagan BAGANOVA..."
        />
      )}

      {/* Global Theme-Aware Maritime Photo Backdrop across all pages */}
      <GlobalPageBackdrop scene={activeBackdropScene} />

      {/* Background Animated Particles */}
      <ParticleBackground />

      {/* Top Scroll Progress Indicator */}
      {!isStandaloneGateway && <ScrollProgressBar />}

      {/* Header & Navigation (hidden on clean initial Portal & Auth screens) */}
      {!isStandaloneGateway && (
        <HeaderNavbar
          onOpenLoginModal={() => navigateToAuthPage('login-user')}
          onOpenRegisterModal={() => navigateToAuthPage('register')}
        />
      )}

      {/* Main Content Area with Smooth Page Transition */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 2,
          paddingTop: !isStandaloneGateway && activeBackdropScene !== 'welcome' ? '68px' : undefined
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeViewKey}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer (hidden on clean initial Portal & Auth screens) */}
      {!isStandaloneGateway && <Footer />}

      {/* Floating Circular Theme Toggle */}
      <button
        type="button"
        className={`theme-toggle ${isStandaloneGateway ? 'portal-toggle' : ''}`}
        id="themeToggle"
        onClick={toggleTheme}
        aria-label="Ganti Tema Tampilan"
        title={currentTheme === 'dark' ? 'Ganti ke Mode Cerah ☀️' : 'Ganti ke Mode Gelap 🌙'}
      >
        {currentTheme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Floating Toast Notification */}
      {toast.visible && (
        <div
          className={`baganova-toast-banner feedback-${toast.type}`}
          style={{
            border:
              toast.type === 'danger'
                ? '1.5px solid #ef4444'
                : toast.type === 'info'
                ? '1.5px solid #0284c7'
                : '1.5px solid #10b981'
          }}
        >
          <i
            className={`fas ${
              toast.type === 'danger'
                ? 'fa-exclamation-triangle'
                : toast.type === 'info'
                ? 'fa-info-circle'
                : 'fa-check-circle'
            }`}
            style={{
              color:
                toast.type === 'danger'
                  ? '#ef4444'
                  : toast.type === 'info'
                  ? 'var(--primary)'
                  : '#10b981'
            }}
          ></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Floating Scroll-to-Top Button */}
      {!isStandaloneGateway && (
        <button
          type="button"
          className={`scroll-up-btn ${scrollUpVisible ? 'visible' : ''}`}
          id="scrollUpBtn"
          onClick={scrollToTop}
          aria-label="Kembali ke Atas"
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <BaganProvider>
      <MainLayout />
    </BaganProvider>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Interactive 3D Marine & Prototype Simulation View
 * Embeds the Three.js BAGANOVA 3D Marine simulation cleanly as both
 * a dedicated public page ('sim3d') and an AdminDashboard tab.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useBagan } from '../../context/BaganContext';
import { ScrollSlide } from '../common/ScrollSlide';

interface Simulation3DViewProps {
  embedded?: boolean;
}

export const Simulation3DView: React.FC<Simulation3DViewProps> = ({ embedded = false }) => {
  const { setCurrentView, currentUser, marineData } = useBagan();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncMarineToIframe = () => {
    if (marineData && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'BAGANOVA_MARINE_DATA', data: marineData },
        '*'
      );
    }
  };

  useEffect(() => {
    syncMarineToIframe();
  }, [marineData]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.().catch(() => {
        // Ignore if browser restricts fullscreen inside nested iframe
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  if (embedded) {
    return (
      <div
        ref={wrapperRef}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: isFullscreen ? '0px' : '20px',
          padding: isFullscreen ? '12px' : '20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          height: isFullscreen ? '100vh' : 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: '0 0 4px 0' }}>
              <i className="fas fa-cube"></i> Simulasi 3D Laut &amp; Prototipe Utuh BAGANOVA
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Visualisasi interaktif ESP32, HX711, Load Cell 5 kg, Driver L298N, Motor DC 12V, baterai, jaring bagan, dan gerombolan ikan bawah air.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleFullscreen}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>{' '}
            {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          </button>
        </div>

        <div
          style={{
            width: '100%',
            height: isFullscreen ? 'calc(100vh - 80px)' : '720px',
            minHeight: '560px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1.5px solid rgba(0, 229, 208, 0.35)',
            background: '#041022'
          }}
        >
          <iframe
            ref={iframeRef}
            onLoad={syncMarineToIframe}
            src="/assets/aistudio/simulasi_3d_prototipe_baganova_19e5b728.html?v=20261116"
            title="Simulasi 3D Prototipe BAGANOVA"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allow="fullscreen"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1.5rem 1.25rem 3rem',
        maxWidth: '1320px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCurrentView(currentUser ? 'dashboard' : 'welcome');
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
          <i className="fas fa-home"></i> {currentUser ? 'Dashboard' : 'Beranda'}
        </button>
        <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Simulasi 3D Prototipe</span>
      </nav>

      {/* Wrapper with Fullscreen Support */}
      <ScrollSlide y={24}>
      <div
        ref={wrapperRef}
        style={{
          background: isFullscreen ? '#041022' : 'var(--card-bg)',
          border: isFullscreen ? 'none' : '1px solid var(--card-border)',
          borderRadius: isFullscreen ? '0px' : '22px',
          padding: isFullscreen ? '10px' : '16px',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.28)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: isFullscreen ? '100vh' : 'auto'
        }}
      >
        {/* Top Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '4px 6px'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.35rem',
                margin: '0 0 2px 0',
                color: isFullscreen ? '#ffffff' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-cube" style={{ color: '#00e5d0' }}></i>
              Simulasi 3D Laut &amp; Prototipe BAGANOVA
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '0.84rem',
                color: isFullscreen ? '#cbd5e1' : 'var(--text-secondary)'
              }}
            >
              Putar model 360°, panggil ikan ke jaring, atur ombak laut, dan uji otomatisasi angkat jaring ESP32 secara interaktif.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setCurrentView(currentUser ? 'dashboard' : 'portal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <i className="fas fa-arrow-left"></i> {currentUser ? 'Kembali ke Dashboard' : 'Portal Awal'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={toggleFullscreen}
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>{' '}
              {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            </button>
          </div>
        </div>

        {/* Interactive 3D Canvas Iframe */}
        <div
          style={{
            width: '100%',
            height: isFullscreen ? 'calc(100vh - 78px)' : 'max(680px, calc(100vh - 210px))',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1.5px solid rgba(0, 229, 208, 0.35)',
            background: '#041022'
          }}
        >
          <iframe
            ref={iframeRef}
            onLoad={syncMarineToIframe}
            src="/assets/aistudio/simulasi_3d_prototipe_baganova_19e5b728.html?v=20261116"
            title="Simulasi 3D Prototipe BAGANOVA"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allow="fullscreen"
          />
        </div>
      </div>
      </ScrollSlide>
    </div>
  );
};

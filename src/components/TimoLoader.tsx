/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Timo Playful Loader Component
 * Menggantikan spinner titik-titik polos dengan animasi maskot Timo yang lucu:
 * - splash: Layar sambutan singkat saat membuka aplikasi
 * - card: Kartu loading penuh saat memuat berita/artikel bagan
 * - inline: Indikator ringkas di dalam gelembung chat TIMO AI atau tombol aksi
 */

import React, { useState, useEffect } from 'react';
import timoMascotImg from '../assets/images/timo_baganova_transparent_v2.png';

interface TimoLoaderProps {
  variant?: 'splash' | 'card' | 'inline' | 'button';
  message?: string;
  subtext?: string;
  cycleMessages?: string[];
  isFadingOut?: boolean;
}

export const TimoLoader: React.FC<TimoLoaderProps> = ({
  variant = 'card',
  message = 'Timo lagi nyiapin data bagan...',
  subtext,
  cycleMessages,
  isFadingOut = false
}) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!cycleMessages || cycleMessages.length <= 1) return;
    const timer = window.setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % cycleMessages.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [cycleMessages]);

  const activeMessage =
    cycleMessages && cycleMessages.length > 0 ? cycleMessages[msgIndex] : message;

  if (variant === 'button') {
    return (
      <span className="baganova-timo-btn-loader" aria-hidden="true">
        <span className="baganova-timo-btn-orb">
          <img src={timoMascotImg} alt="" />
        </span>
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="baganova-timo-inline-loader" role="status" aria-live="polite">
        <div className="baganova-timo-inline-orb" aria-hidden="true">
          <img src={timoMascotImg} alt="" />
        </div>
        <div className="baganova-timo-inline-text">
          <span>{activeMessage}</span>
          <div className="baganova-timo-bubbles-row" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'splash') {
    return (
      <div
        className={`baganova-timo-splash ${isFadingOut ? 'is-fading' : ''}`}
        role="status"
        aria-live="polite"
        aria-label="Memuat BAGANOVA"
      >
        <div className="baganova-timo-splash-inner">
          <div className="baganova-timo-stage">
            <span className="baganova-timo-sonar-ring" aria-hidden="true" />
            <span className="baganova-timo-sonar-ring outer" aria-hidden="true" />
            <div className="baganova-timo-loader-orb">
              <img src={timoMascotImg} alt="Timo sedang berenang memuat BAGANOVA" />
              <span className="baganova-bubble b1" aria-hidden="true" />
              <span className="baganova-bubble b2" aria-hidden="true" />
              <span className="baganova-bubble b3" aria-hidden="true" />
            </div>
          </div>

          <strong className="baganova-timo-loader-title">{activeMessage}</strong>
          {subtext && <p className="baganova-timo-loader-sub">{subtext}</p>}

          <div className="baganova-timo-wave-bar" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="baganova-timo-card-loader" role="status" aria-live="polite">
      <div className="baganova-timo-stage">
        <span className="baganova-timo-sonar-ring" aria-hidden="true" />
        <span className="baganova-timo-sonar-ring outer" aria-hidden="true" />
        <div className="baganova-timo-loader-orb">
          <img src={timoMascotImg} alt="Timo sedang menyelam mencari informasi" />
          <span className="baganova-bubble b1" aria-hidden="true" />
          <span className="baganova-bubble b2" aria-hidden="true" />
          <span className="baganova-bubble b3" aria-hidden="true" />
        </div>
      </div>

      <strong className="baganova-timo-loader-title">{activeMessage}</strong>
      {subtext && <p className="baganova-timo-loader-sub">{subtext}</p>}

      <div className="baganova-timo-wave-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
};

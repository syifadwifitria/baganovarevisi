/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Global Theme-Aware Maritime Backdrop
 * Menampilkan latar foto nyata (nelayan, bagan tancap, atau kawanan ikan)
 * di seluruh halaman dengan scrim kontras otomatis untuk Mode Terang & Gelap
 * serta efek parallax halus saat digulir ke bawah.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'motion/react';
import heroBaganImg from '../../assets/images/hero_bagan_underwater_1794764982373.jpg';
import fishermanImg from '../../assets/images/bg_fisherman_coastal_1794765583171.jpg';
import schoolingFishImg from '../../assets/images/bg_schooling_fish_ocean_1794765582299.jpg';
import baganPanoramaImg from '../../assets/images/bg_bagan_sea_panorama_1794765584137.jpg';

export type BackdropScene =
  | 'welcome'
  | 'portal'
  | 'auth'
  | 'about'
  | 'guide'
  | 'articles'
  | 'timo-ai'
  | 'sim3d'
  | 'fisheries'
  | 'fisherman'
  | 'admin';

interface SceneConfig {
  src: string;
  alt: string;
  objectPosition: string;
}

const SCENE_MAP: Record<BackdropScene, SceneConfig> = {
  welcome: {
    src: schoolingFishImg,
    alt: 'Kawanan ikan pelagis berenang di bawah cahaya permukaan laut',
    objectPosition: 'center 42%'
  },
  portal: {
    src: baganPanoramaImg,
    alt: 'Deretan bagan tancap tradisional di perairan pesisir Indonesia saat fajar',
    objectPosition: 'center 52%'
  },
  auth: {
    src: schoolingFishImg,
    alt: 'Gerombolan ikan teri dan ikan pelagis di perairan biru jernih',
    objectPosition: 'center 45%'
  },
  about: {
    src: fishermanImg,
    alt: 'Nelayan pesisir memeriksa tali jaring bagan tancap di atas laut',
    objectPosition: 'center 32%'
  },
  guide: {
    src: heroBaganImg,
    alt: 'Bagan tancap dengan jaring terangkat dan cahaya penarik ikan di bawah air',
    objectPosition: 'center 48%'
  },
  articles: {
    src: baganPanoramaImg,
    alt: 'Panorama bagan tancap pesisir Nusantara di atas perairan tenang',
    objectPosition: 'center 50%'
  },
  'timo-ai': {
    src: schoolingFishImg,
    alt: 'Kawanan ikan laut berenang di bawah bias sinar matahari laut',
    objectPosition: 'center 40%'
  },
  sim3d: {
    src: heroBaganImg,
    alt: 'Struktur bagan tancap dan ekosistem ikan bawah permukaan air',
    objectPosition: 'center 50%'
  },
  fisheries: {
    src: baganPanoramaImg,
    alt: 'Perairan bagan tancap dengan analisis cuaca, hasil tangkap, dan konservasi',
    objectPosition: 'center 46%'
  },
  fisherman: {
    src: fishermanImg,
    alt: 'Nelayan mengoperasikan peralatan jaring di geladak bagan tancap',
    objectPosition: 'center 30%'
  },
  admin: {
    src: baganPanoramaImg,
    alt: 'Gugusan bagan tancap pesisir yang terpantau sistem BAGANOVA',
    objectPosition: 'center 48%'
  }
};

interface GlobalPageBackdropProps {
  scene: BackdropScene;
}

export const GlobalPageBackdrop: React.FC<GlobalPageBackdropProps> = ({ scene }) => {
  const prefersReducedMotion = useReducedMotion();
  const [failedSrcs, setFailedSrcs] = useState<Record<string, boolean>>({});
  const { scrollYProgress } = useScroll();

  // Gentle vertical drift & subtle depth scale as the user scrolls down slides
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '-5.5%']);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.12]);

  const config = SCENE_MAP[scene] || SCENE_MAP.welcome;
  const isImageFailed = Boolean(failedSrcs[config.src]);

  return (
    <div className="baganova-global-backdrop" aria-hidden="true">
      <AnimatePresence mode="sync" initial={false}>
        {!isImageFailed && (
          <motion.div
            key={config.src}
            className="baganova-global-backdrop-media"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={
              prefersReducedMotion
                ? undefined
                : { y: parallaxY, scale: parallaxScale }
            }
          >
            <img
              src={config.src}
              alt={config.alt}
              className="baganova-global-backdrop-img"
              style={{ objectPosition: config.objectPosition }}
              referrerPolicy="no-referrer"
              onError={() =>
                setFailedSrcs((prev) =>
                  prev[config.src] ? prev : { ...prev, [config.src]: true }
                )
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme-aware atmospheric scrim so both Light and Dark themes preserve high legibility */}
      <div className="baganova-global-backdrop-scrim" />
    </div>
  );
};

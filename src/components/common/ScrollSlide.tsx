/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Reusable Scroll Slide Transitions & Progress Indicator
 * Memberikan transisi nyata dan halus per slide saat pengguna menggulir ke bawah:
 * 1. ScrollSectionSlide: transisi scrub langsung mengikuti posisi scroll (y, scale, opacity)
 * 2. ScrollSlide: transisi masuk per elemen/kartu saat memasuki viewport
 * 3. ScrollProgressBar: garis progres gulir di bagian atas layar
 */

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react';

interface ScrollSlideProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollSlide: React.FC<ScrollSlideProps> = ({
  children,
  delay = 0,
  y = 52,
  direction = 'up',
  className,
  style
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const initialOffset =
    direction === 'left'
      ? { opacity: 0, x: -36, y: 16, scale: 0.97 }
      : direction === 'right'
      ? { opacity: 0, x: 36, y: 16, scale: 0.97 }
      : { opacity: 0, x: 0, y, scale: 0.96 };

  return (
    <motion.div
      className={className}
      style={style}
      initial={initialOffset}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 'some', margin: '-55px 0px -55px 0px' }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {children}
    </motion.div>
  );
};

interface ScrollSectionSlideProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollSectionSlide: React.FC<ScrollSectionSlideProps> = ({
  children,
  className,
  style
}) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 98%', 'start 42%']
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 26,
    mass: 0.55
  });

  const y = useTransform(smoothProgress, [0, 1], [72, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [0.94, 1]);
  const opacity = useTransform(smoothProgress, [0, 0.35, 1], [0.18, 0.82, 1]);

  if (prefersReducedMotion) {
    return (
      <div ref={sectionRef} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div ref={sectionRef} style={{ position: 'relative' }}>
      <motion.div
        className={className}
        style={{
          ...style,
          y,
          scale,
          opacity,
          willChange: 'transform, opacity'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export const ScrollProgressBar: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="baganova-scroll-progress"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  );
};

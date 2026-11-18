/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Welcome Page (Halaman Utama Publik)
 * Struktur Lengkap Sesuai Permintaan Pengguna:
 * 1. Beranda (Hero Banner & Quick Actions)
 * 2. Tentang Kami (Inovasi Website, Cara Kerja Alat, dan Tim Pengembang SIK UPI Serang)
 * 3. Panduan (Standar Operasional Prosedur / SOP Nelayan 4 Langkah & Checklist Keselamatan)
 * 4. FAQ (Tanya Jawab Teknis dan Operasional Terpisah dari Panduan)
 * 5. Kontak (Informasi Posko Lapangan Karangantu, Lab SIK UPI Serang, WhatsApp & Formulir Konsultasi)
 */

import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'motion/react';
import { HeroAquaticCanvas } from '../BackgroundCanvases';
import { ScrollSlide, ScrollSectionSlide } from '../common/ScrollSlide';
import { useBagan } from '../../context/BaganContext';
import { TimoLoader } from '../TimoLoader';
import heroBaganImg from '../../assets/images/hero_bagan_underwater_1794764982373.jpg';

interface WelcomeViewProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { showToast, setCurrentView, addContactMessage } = useBagan();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const bgY = useTransform(heroProgress, [0, 1], ['0%', '22%']);
  const bgScale = useTransform(heroProgress, [0, 1], [1.02, 1.12]);
  const heroContentY = useTransform(heroProgress, [0, 1], ['0px', '42px']);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    location: '',
    message: ''
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone || !contactForm.message) {
      showToast('Mohon lengkapi nama, nomor WhatsApp, dan pesan Anda.', 'info');
      return;
    }
    setIsSubmittingContact(true);
    setTimeout(() => {
      addContactMessage(contactForm);
      setIsSubmittingContact(false);
      showToast('Pesan/pengaduan Anda berhasil masuk ke Dashboard Pengembang! Kami akan segera menghubungi nomor WhatsApp Anda.', 'success');
      setContactForm({ name: '', phone: '', location: '', message: '' });
    }, 350);
  };

  const scrollToExplore = () => {
    document.getElementById('eksplorasi')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const faqs = [
    {
      q: 'Apa itu website BAGANOVA?',
      a: 'BAGANOVA adalah sistem pemantauan dan pengendalian alat bagan tancap otomatis berbasis internet & IoT. Website ini membantu nelayan memantau beban jaring secara real-time dan mengangkat jaring secara otomatis saat ikan sudah terkumpul banyak tanpa harus memutar engkol kayu semalaman.'
    },
    {
      q: 'Apakah nelayan wajib mendaftar akun terlebih dahulu?',
      a: 'Ya, bagi nelayan yang baru ingin menggunakan alat bagan otomatis diwajibkan mendaftar akun terlebih dahulu melalui tombol "Daftar Akun Nelayan". Setelah mendaftar, akun dan perangkat bagan nelayan akan langsung tersambung ke sistem pengembang (admin).'
    },
    {
      q: 'Bagaimana alat ini bekerja mengangkat jaring secara otomatis?',
      a: 'Sensor beban (load cell) dipasang pada mekanisme tali pengangkat untuk membaca perubahan beban jaring. Data tersebut diproses oleh ESP32 sebagai dasar pengendalian. Ketika beban mencapai ambang batas yang telah dikonfigurasi dan memenuhi kondisi kestabilan, sistem dapat mengaktifkan motor penggerak untuk mengangkat jaring. Proses pengangkatan dihentikan ketika limit switch mendeteksi batas posisi yang telah ditentukan.'
    },
    {
      q: 'Bagaimana sistem membedakan beban ikan dengan ayunan ombak atau arus laut?',
      a: 'Sistem menggunakan pengolahan data sensor untuk membantu mengurangi fluktuasi pembacaan akibat gerakan ombak. Salah satu metode yang dapat digunakan adalah Moving Average, yaitu menghitung rata-rata sejumlah sampel pembacaan sensor. Dengan demikian, sistem dapat membantu mengenali perubahan beban yang lebih stabil sebelum menjalankan perintah pengangkatan sesuai parameter yang dikonfigurasi.'
    },
    {
      q: 'Mengapa penurunan jaring dilakukan secara manual melalui website, bukan otomatis?',
      a: 'Ini merupakan protokol keselamatan maritim (human-in-the-loop safety protocol). Menurunkan jaring ke laut membutuhkan kepastian visual bahwa tidak ada perahu perintis nelayan di bawah bagan, tidak ada tali yang terlilit, dan jaring telah benar-benar dikosongkan.'
    },
    {
      q: 'Bagaimana jika koneksi internet terputus di tengah laut malam hari?',
      a: 'Mikrokontroler ESP32 bertindak sebagai Access Point mandiri lokal (Local Gateway). Dashboard web dapat diakses langsung oleh operator nelayan melalui jaringan Wi-Fi lokal bagan tanpa memerlukan kuota internet. Seluruh logika proteksi sakelar batas atas dan pemicu beban berjalan mandiri di memori chip ESP32.'
    }
  ];

  return (
    <div style={{ position: 'relative', zIndex: 2 }}>
      {/* 1. HERO SECTION (BERANDA) */}
      <section className="hero hero-pro" id="hero" ref={heroRef}>
        {/* Real Bagan Tancap & Underwater Net Photo with Smooth Scroll Parallax */}
        <motion.div
          className="hero-photo-layer"
          style={prefersReducedMotion ? undefined : { y: bgY, scale: bgScale }}
        >
          <img
            src={heroBaganImg}
            alt="Bagan Tancap BAGANOVA di perairan pesisir dengan jaring dan kawanan ikan di bawah permukaan laut"
            referrerPolicy="no-referrer"
            className="hero-photo-img"
          />
        </motion.div>

        {/* Live Animated Schooling Fish & Underwater Caustics */}
        <HeroAquaticCanvas />

        {/* Measured Contrast Scrim */}
        <div className="hero-scrim" aria-hidden="true" />

        {/* Sleek Professional Hero Content */}
        <motion.div
          className="hero-content-pro"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={prefersReducedMotion ? undefined : { y: heroContentY, opacity: heroContentOpacity }}
        >
          <div className="hero-brand-emblem" style={{ marginBottom: '18px' }}>
            <img
              src="/assets/aistudio/Baganova_Maritime_Tech_Logo_adc8bd3e.png"
              alt="BAGANOVA Emblem"
              className="hero-emblem-img"
              style={{ width: '104px', height: '104px', borderRadius: '22px' }}
              referrerPolicy="no-referrer"
            />
          </div>

          <p className="hero-kicker">
            Sistem Informasi Kelautan · UPI Kampus Serang
          </p>

          <h1 style={{ textWrap: 'balance' }}>
            BAGANOVA – Smart Monitoring System
          </h1>

          <p className="hero-subtitle">
            Pusat Pemantauan dan Pengendalian Alat Bagan Tancap Otomatis untuk Membantu Nelayan dalam Proses Pengangkatan Jaring Berbasis Internet &amp; IoT.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenLogin}
              style={{ fontSize: '0.98rem', padding: '14px 32px' }}
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>MASUK</span>
            </button>

            <button
              type="button"
              className="btn btn-accent"
              onClick={onOpenRegister}
              style={{ fontSize: '0.98rem', padding: '14px 32px' }}
            >
              <i className="fas fa-user-plus"></i>
              <span>DAFTAR</span>
            </button>
          </div>
        </motion.div>

        {/* Smooth Scroll-Down Cue */}
        <button
          type="button"
          className="hero-scroll-cue"
          onClick={scrollToExplore}
          aria-label="Gulir ke bawah untuk eksplorasi platform"
        >
          <span>Gulir untuk Eksplorasi</span>
          <i className="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
      </section>

      {/* 2. PORTAL MENU TERPISAH: TENTANG KAMI & PANDUAN NELAYAN */}
      <section id="eksplorasi" className="about-section" style={{ padding: '5rem 1.5rem 2.5rem' }}>
        <ScrollSectionSlide className="about-container">
          <ScrollSlide className="about-header-wrap" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="baganova-kicker">
              Dokumentasi &amp; Panduan Sistem
            </p>
            <h2>Eksplorasi Lengkap Platform BAGANOVA</h2>
            <p className="about-lead" style={{ margin: '8px auto 0', maxWidth: '760px' }}>
              Pilih modul yang ingin Anda jelajahi: profil tim &amp; arsitektur sistem, panduan SOP nelayan, atau data terbuka cuaca laut &amp; statistik tangkapan bagan (tanpa login).
            </p>
          </ScrollSlide>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '24px',
              maxWidth: '1160px',
              margin: '0 auto',
              alignItems: 'stretch'
            }}
          >
            {/* Card 1: Halaman Tentang Kami */}
            <ScrollSlide delay={0.06} style={{ height: '100%' }}>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '22px',
                  padding: '30px 28px',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(0, 229, 208, 0.14)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}
                    >
                      <i className="fas fa-info-circle"></i>
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--primary)'
                      }}
                    >
                      01 · Profil &amp; Arsitektur
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Tentang Kami &amp; Tim Pengembang
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.93rem', lineHeight: 1.7, marginBottom: '24px', textAlign: 'justify' }}>
                    Pelajari konsep sistem otomatisasi bagan tancap pesisir, 3 pilar teknologi instrumentasi (Load Cell S-Beam HX711, Mikrokontroler ESP32, Motor Winch 12V), serta profil lengkap tim peneliti SIK UPI Kampus Serang.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setCurrentView('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ width: '100%', padding: '14px 20px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>Buka Halaman Tentang Kami</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </motion.div>
            </ScrollSlide>

            {/* Card 2: Halaman Panduan Nelayan */}
            <ScrollSlide delay={0.14} style={{ height: '100%' }}>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '22px',
                  padding: '30px 28px',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(56, 189, 248, 0.14)',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}
                    >
                      <i className="fas fa-book"></i>
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)'
                      }}
                    >
                      02 · SOP &amp; Keselamatan
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Panduan &amp; SOP Nelayan
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.93rem', lineHeight: 1.7, marginBottom: '24px', textAlign: 'justify' }}>
                    Standar Operasional Prosedur 4 langkah bagi operator nelayan di geladak bagan: kalibrasi tare beban awal jaring, uji sakelar batas atas limit switch &amp; E-STOP, pengoperasian motor cerdas, dan checklist keselamatan maritim.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setCurrentView('guide');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ width: '100%', padding: '14px 20px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderColor: 'rgba(56, 189, 248, 0.5)' }}
                >
                  <span>Buka Panduan Nelayan Lengkap</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </motion.div>
            </ScrollSlide>

            {/* Card 3: Data Terbuka Cuaca, Tangkapan & Populasi (Umum / Peneliti / Mahasiswa) */}
            <ScrollSlide delay={0.22} style={{ height: '100%' }}>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '22px',
                  padding: '30px 28px',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(16, 185, 129, 0.14)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}
                    >
                      <i className="fas fa-chart-area"></i>
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#10b981'
                      }}
                    >
                      03 · Data Cuaca &amp; Tangkapan
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Cuaca Laut, Tangkapan &amp; Populasi
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.93rem', lineHeight: 1.7, marginBottom: '24px', textAlign: 'justify' }}>
                    Pantau langsung tanpa perlu login: meteorologi perairan 14 hari, statistik tangkapan &amp; CPUE, ekspor CSV, analisis W=aL^b (Lc vs Lm), serta audit selektivitas mata jaring.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setCurrentView('fisheries');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ width: '100%', padding: '14px 20px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>Buka Data Cuaca &amp; Tangkap</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </motion.div>
            </ScrollSlide>
          </div>
        </ScrollSectionSlide>
      </section>

      {/* 3. FAQ (TANYA JAWAB UMUM) */}
      <section className="about-section" id="faq" style={{ padding: '4.5rem 1.5rem' }}>
        <ScrollSectionSlide className="about-container" style={{ maxWidth: '920px' }}>
          <ScrollSlide className="about-header-wrap">
            <p className="baganova-kicker">
              Tanya Jawab Resmi
            </p>
            <h2>Pertanyaan yang Sering Diajukan (FAQ)</h2>
            <p className="about-lead">
              Penjelasan mengenai sistem kerja cerdas, protokol keselamatan, jaringan internet di tengah laut, asisten TIMO AI, dan artikel terkini seputar bagan.
            </p>
          </ScrollSlide>

          <ScrollSlide delay={0.08}>
            <div className="baganova-faq-hub-cards">
              <button
                type="button"
                className="baganova-faq-hub-card"
                onClick={() => {
                  setCurrentView('timo-ai');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="baganova-faq-hub-icon tone-ai" aria-hidden="true">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="baganova-faq-hub-text">
                  <strong>Tanya TIMO AI</strong>
                </div>
                <i className="fas fa-arrow-right baganova-faq-hub-arrow" aria-hidden="true"></i>
              </button>

              <button
                type="button"
                className="baganova-faq-hub-card"
                onClick={() => {
                  setCurrentView('articles');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="baganova-faq-hub-icon tone-news" aria-hidden="true">
                  <i className="fas fa-newspaper"></i>
                </div>
                <div className="baganova-faq-hub-text">
                  <strong>Artikel Terkini</strong>
                </div>
                <i className="fas fa-arrow-right baganova-faq-hub-arrow" aria-hidden="true"></i>
              </button>
            </div>
          </ScrollSlide>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <ScrollSlide key={index} delay={Math.min(index * 0.05, 0.25)} y={20}>
                  <div
                    style={{
                      background: 'var(--card-bg)',
                      border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--card-border)'}`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: isOpen ? '0 8px 25px rgba(2,132,199,0.15)' : 'none',
                      transition: 'border-color 0.25s ease, box-shadow 0.25s ease'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      style={{
                        width: '100%',
                        padding: '18px 22px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'left',
                        cursor: 'pointer',
                        gap: '14px'
                      }}
                    >
                      <span>{faq.q}</span>
                      <i
                        className="fas fa-chevron-down"
                        style={{
                          color: 'var(--primary)',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.25s ease'
                        }}
                      ></i>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            padding: '0 22px 20px 22px',
                            fontSize: '0.92rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7
                          }}
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollSlide>
              );
            })}
          </div>
        </ScrollSectionSlide>
      </section>

      {/* 5. KONTAK (INFORMASI PUSAT LAYANAN & FORMULIR KONSULTASI NELAYAN) */}
      <section className="about-section about-section-alt" id="kontak" style={{ padding: '4.5rem 1.5rem' }}>
        <ScrollSectionSlide className="about-container">
          <ScrollSlide className="about-header-wrap">
            <p className="baganova-kicker">
              Pusat Layanan &amp; Pendampingan
            </p>
            <h2>Hubungi Tim Pengembang BAGANOVA</h2>
            <p className="about-lead">
              Punya pertanyaan seputar pemasangan alat bagan otomatis, kendala teknis di lapangan, atau pengaduan operasional di perairan? Kirimkan pesan Anda langsung ke tim pengembang.
            </p>
          </ScrollSlide>

          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            {/* Formulir Pesan / Konsultasi Nelayan */}
            <ScrollSlide delay={0.08}>
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1.5px solid var(--card-border)',
                  borderRadius: '22px',
                  padding: '28px',
                  boxShadow: '0 10px 35px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  <i className="fas fa-paper-plane" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                  Kirim Pesan / Pengaduan
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Tinggalkan nomor WhatsApp dan pesan/pengaduan Anda. Pesan akan langsung masuk ke Dashboard Pengembang.
                </p>

                <form onSubmit={handleContactSubmit}>
                  <div className="form-group-custom" style={{ marginBottom: '14px' }}>
                    <label htmlFor="contactName" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      <i className="fas fa-user"></i> Nama Lengkap:
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      className="text-input-modern"
                      placeholder="Contoh: Pak Suhendra"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-custom" style={{ marginBottom: '14px' }}>
                    <label htmlFor="contactPhone" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      <i className="fab fa-whatsapp"></i> Nomor WhatsApp:
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      className="text-input-modern"
                      placeholder="Contoh: 0812-3456-7890"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-custom" style={{ marginBottom: '14px' }}>
                    <label htmlFor="contactLoc" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      <i className="fas fa-map-marker-alt"></i> Lokasi Bagan / Pesisir:
                    </label>
                    <input
                      type="text"
                      id="contactLoc"
                      className="text-input-modern"
                      placeholder="Contoh: Perairan Karangantu, Kasemen"
                      value={contactForm.location}
                      onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group-custom" style={{ marginBottom: '18px' }}>
                    <label htmlFor="contactMsg" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      <i className="fas fa-comment-dots"></i> Pesan / Pengaduan:
                    </label>
                    <textarea
                      id="contactMsg"
                      rows={4}
                      className="text-input-modern"
                      placeholder="Tuliskan pesan, kendala alat di bagan, atau pengaduan Anda..."
                      style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmittingContact}
                    style={{ width: '100%', padding: '14px', fontSize: '0.95rem', justifyContent: 'center' }}
                  >
                    {isSubmittingContact ? (
                      <>
                        <TimoLoader variant="button" /> <span>Timo lagi ngirim pesan...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Kirim Pesan ke Pengembang
                      </>
                    )}
                  </button>
                </form>
              </div>
            </ScrollSlide>
          </div>

          {/* Bottom Call to Action */}
          <ScrollSlide delay={0.1}>
            <div
              style={{
                marginTop: '4rem',
                padding: '32px 24px',
                background: 'linear-gradient(135deg, rgba(7,22,44,0.95), rgba(10,37,64,0.98))',
                border: '1.5px solid var(--primary)',
                borderRadius: '24px',
                textAlign: 'center',
                boxShadow: '0 12px 35px rgba(2,132,199,0.25)'
              }}
            >
              <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
                Siap Menerapkan Otomatisasi pada Bagan Tancap Anda?
              </h3>
              <p style={{ color: '#cbd5e1', maxWidth: '640px', margin: '0 auto 20px auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Daftarkan bagan tancap Anda sekarang untuk mendapatkan pendampingan teknis dan monitoring otomatis langsung dari tim pengembang.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenLogin}
                >
                  <i className="fas fa-sign-in-alt"></i> Masuk ke Akun
                </button>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={onOpenRegister}
                >
                  <i className="fas fa-user-plus"></i> Daftar Akun Nelayan
                </button>
              </div>
            </div>
          </ScrollSlide>
        </ScrollSectionSlide>
      </section>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Standard Operating Procedure (SOP) & Maritime Safety View
 */

import React, { useState } from 'react';
import { useBagan } from '../../context/BaganContext';
import { ScrollSectionSlide } from '../common/ScrollSlide';

export const SopSafetyView: React.FC = () => {
  const { setCurrentView } = useBagan();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana sistem membedakan beban ikan dengan ayunan ombak atau arus laut?',
      a: 'Sistem menggunakan pengolahan data sensor untuk membantu mengurangi fluktuasi pembacaan akibat gerakan ombak. Salah satu metode yang dapat digunakan adalah Moving Average, yaitu menghitung rata-rata sejumlah sampel pembacaan sensor. Dengan demikian, sistem dapat membantu mengenali perubahan beban yang lebih stabil sebelum menjalankan perintah pengangkatan sesuai parameter yang dikonfigurasi.'
    },
    {
      q: 'Mengapa penurunan jaring dilakukan secara manual oleh nelayan, bukan otomatis?',
      a: 'Ini merupakan protokol keselamatan maritim mutlak (human-in-the-loop safety protocol). Menurunkan jaring kembali ke perairan membutuhkan verifikasi visual langsung oleh nelayan bahwa tidak ada perahu perintis di bawah bagan, tidak ada tali sudut yang terlilit pada tiang bambu, dan hasil tangkapan di kantong jaring telah selesai diserok ke atas geladak.'
    },
    {
      q: 'Apa yang terjadi jika jaringan internet atau sinyal seluler terputus di tengah laut malam hari?',
      a: 'Sistem kendali utama dan proteksi batas atas berjalan secara lokal dan mandiri (standalone hardware autonomy) di dalam chip firmware ESP32. Sakelar pembatas (limit switch) memutus sirkuit relay motor secara fisik tanpa tergantung pada koneksi internet, server web, atau cloud.'
    },
    {
      q: 'Bagaimana cara kerja tombol Emergency Stop (E-STOP) di website dan di instalasi bagan?',
      a: 'Tombol E-STOP pada website berfungsi sebagai antarmuka digital sekunder untuk memutus perintah relay via perangkat lunak. Sementara itu, pada instalasi fisik bagan tancap tersedia tombol jamur E-STOP merah fisik yang memutus jalur listrik aki 12V langsung ke driver motor.'
    }
  ];

  return (
    <div style={{ paddingTop: '1.5rem' }}>
      {/* Page Banner Header */}
      <div className="page-banner-header">
        <div className="page-banner-container">
          <div className="page-breadcrumbs">
            <span
              onClick={() => setCurrentView('dashboard')}
              style={{ cursor: 'pointer', color: 'var(--primary)' }}
            >
              <i className="fas fa-th-large"></i> Armada Bagan
            </span>
            <span className="crumb-separator">
              <i className="fas fa-chevron-right"></i>
            </span>
            <span className="crumb-current">SOP & Panduan Keselamatan Nelayan</span>
          </div>

          <h1 className="page-banner-title">
            Standar Operasional Prosedur (SOP) & Keselamatan Bagan
          </h1>
          <p className="page-banner-subtitle">
            Panduan pengoperasian perangkat otomatisasi pengangkatan jaring bagi operator nelayan di geladak bagan tancap pesisir Teluk Banten.
          </p>
        </div>
      </div>

      {/* SOP Content */}
      <section className="about-section" style={{ padding: '3.5rem 2rem' }}>
        <ScrollSectionSlide className="about-container">
          {/* 4 Steps Grid */}
          <div className="sop-block">
            <div className="sop-header">
              <span className="sub-badge">
                <i className="fas fa-clipboard-check"></i> 4 TAHAP PENGOPERASIAN
              </span>
              <h3>Langkah Kerja Operasional Bagan Tancap Otomatis</h3>
              <p>
                Ikuti 4 tahapan ini secara berurutan pada setiap operasi penangkapan malam hari.
              </p>
            </div>

            <div className="sop-steps-grid">
              <div className="sop-card">
                <div className="sop-step-badge">LANGKAH 1</div>
                <h4>Pemeriksaan Awal dan Kalibrasi Tare Baseline</h4>
                <p>
                  Periksa kondisi fisik tali derek serta pemasangan load cell agar tidak mengalami pembebanan berlebih, lalu lakukan kalibrasi sensor sesuai prosedur hingga pembacaan awal stabil.
                </p>
              </div>

              <div className="sop-card">
                <div className="sop-step-badge">LANGKAH 2</div>
                <h4>Uji Sakelar Batas Atas (Limit Switch) dan E-STOP</h4>
                <p>
                  Periksa kondisi fisik limit switch serta sambungannya, uji bahwa motor berhenti saat batas pergerakan tercapai, dan pastikan tombol Emergency Stop menghentikan sistem penggerak saat diaktifkan.
                </p>
              </div>

              <div className="sop-card">
                <div className="sop-step-badge">LANGKAH 3</div>
                <h4>Pengaktifan Otomatisasi Angkat Jaring (Target Beban)</h4>
                <p>
                  Atur ambang batas beban sesuai hasil kalibrasi serta kapasitas mekanisme dan aktifkan pemantauan beban melalui dashboard agar pengangkatan otomatis berjalan sesuai parameter yang telah diuji.
                </p>
              </div>

              <div className="sop-card">
                <div className="sop-step-badge">LANGKAH 4</div>
                <h4>Penyerokan Hasil dan Penurunan Jaring</h4>
                <p>
                  Pastikan mekanisme berhenti pada posisi yang ditentukan, periksa keamanan area pengoperasian dan kondisi jaring, lalu turunkan jaring menggunakan mekanisme kendali yang tersedia.
                </p>
              </div>
            </div>
          </div>

          {/* Hardware Autonomy Banner */}
          <div
            style={{
              margin: '3.5rem 0',
              padding: '28px 32px',
              background: 'linear-gradient(135deg, rgba(7, 22, 44, 0.95), rgba(10, 37, 64, 0.95))',
              border: '2px solid #00e5d0',
              borderRadius: '20px',
              boxShadow: '0 12px 35px rgba(0, 229, 208, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(0, 229, 208, 0.2)',
                color: '#00e5d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                flexShrink: 0
              }}
            >
              <i className="fas fa-shield-alt"></i>
            </div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <span className="sub-badge" style={{ marginBottom: '6px' }}>
                PRINSIP KESELAMATAN FISIK MARITIM
              </span>
              <h3 style={{ fontSize: '1.4rem', color: '#ffffff', margin: '4px 0 8px 0' }}>
                Proteksi Perangkat Keras Mandiri (Hardware-Authoritative Fail-Safe)
              </h3>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                Website BAGANOVA merupakan pusat telemetri dan pemantauan jarak jauh. Namun, <strong>sistem kendali utama, proteksi kelebihan beban, dan sakelar batas atas beroperasi secara lokal pada mikrokontroler ESP32</strong>. Jika terjadi gangguan sinyal internet atau baterai smartphone operator habis, bagan tancap tetap akan menghentikan motor secara mandiri ketika jaring mencapai posisi atas.
              </p>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="faq-block">
            <div className="faq-header">
              <span className="sub-badge">
                <i className="fas fa-question-circle"></i> TANYA JAWAB UMUM
              </span>
              <h3>Pertanyaan yang Sering Diajukan Seputar BAGANOVA</h3>
            </div>

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

            <div className="accordion-container" id="faqAccordion">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className={`accordion-item ${isOpen ? 'active' : ''}`}
                    style={{
                      borderColor: isOpen ? 'var(--primary)' : undefined
                    }}
                  >
                    <button
                      type="button"
                      className="accordion-header"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    >
                      <span>{faq.q}</span>
                      <i
                        className="fas fa-chevron-down"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.3s ease'
                        }}
                      ></i>
                    </button>
                    {isOpen && (
                      <div className="accordion-content" style={{ maxHeight: '500px', display: 'block' }}>
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollSectionSlide>
      </section>
    </div>
  );
};

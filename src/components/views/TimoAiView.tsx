/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Dedicated TIMO AI Virtual Assistant Page
 * Tata letak 2-kolom khas maritim BAGANOVA:
 * - Kiri: Profil Maskot Timo, Topik Tanya Cepat, & Pintasan Artikel/FAQ
 * - Kanan: Ruang Chat Interaktif Otomatis berbasis Gemini API
 */

import React, { useState, useRef, useEffect } from 'react';
import { useBagan } from '../../context/BaganContext';
import { ScrollSlide } from '../common/ScrollSlide';
import { TimoLoader } from '../TimoLoader';
import timoMascotImg from '../../assets/images/timo_baganova_transparent_v2.png';

interface ChatSource {
  title: string;
  url: string;
  domain: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: ChatSource[];
  isError?: boolean;
}

const TOPIC_PROMPTS = [
  {
    icon: 'fas fa-microchip',
    label: 'Cara Kerja & Sensor HX711',
    desc: 'Deteksi berat ikan & filter ayunan ombak',
    prompt: 'Jelaskan bagaimana cara kerja sensor load cell HX711 dan filter ombak di BAGANOVA!'
  },
  {
    icon: 'fas fa-shield-alt',
    label: 'Limit Switch & Keselamatan',
    desc: 'Proteksi batas atas & tombol E-STOP',
    prompt: 'Apa fungsi limit switch dan kenapa penurunan jaring tetap dilakukan manual oleh nelayan?'
  },
  {
    icon: 'fas fa-fish',
    label: 'Hasil Tangkapan Bagan',
    desc: 'Jenis hasil tangkapan utama bagan di Indonesia',
    prompt: 'Ikan apa saja hasil tangkapan utama bagan tancap dan bagaimana peran BAGANOVA membantu nelayan?'
  },
  {
    icon: 'fas fa-wifi',
    label: 'Koneksi Laut & Daftar Bagan',
    desc: 'Mode Wi-Fi lokal ESP32 & registrasi',
    prompt: 'Bagaimana jika internet terputus di tengah laut dan bagaimana cara mendaftarkan bagan baru?'
  }
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'timo-page-welcome',
  role: 'model',
  text: 'Halo, Sobat Bagan! Aku **TIMO AI**, asisten virtual resmi BAGANOVA.\n\nSilakan pilih topik di sebelah kiri atau ketik pertanyaanmu langsung di bawah — aku siap membantu menjelaskan cara kerja alat bagan otomatis, kalibrasi sensor, protokol keselamatan, hingga informasi hasil tangkapan bagan!'
};

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} style={{ height: '6px' }} />;
    }

    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={pIdx}>{part}</React.Fragment>;
    });

    const isBullet = /^[-•*]\s+/.test(trimmed);
    if (isBullet) {
      return (
        <div key={lineIdx} className="baganova-timo-bullet-line">
          <span aria-hidden="true">•</span>
          <span>{renderedParts}</span>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="baganova-timo-msg-p">
        {renderedParts}
      </p>
    );
  });
}

export const TimoAiView: React.FC = () => {
  const { setCurrentView } = useBagan();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'timo-page-welcome' && !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const res = await fetch('/api/timo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'TIMO AI tidak dapat merespons saat ini.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `timo-${Date.now()}`,
          role: 'model',
          text: data.reply,
          sources: Array.isArray(data.sources) ? data.sources : []
        }
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi gangguan saat menghubungi TIMO AI.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: errMsg,
          isError: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(inputValue);
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInputValue('');
  };

  const navigateToFaq = () => {
    setCurrentView('welcome');
    setTimeout(() => {
      const el = document.getElementById('faq');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div style={{ paddingTop: '1.5rem' }}>
      {/* Page Banner Header */}
      <div className="page-banner-header">
        <div className="page-banner-container">
          <div className="page-breadcrumbs">
            <span
              onClick={() => {
                setCurrentView('welcome');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ cursor: 'pointer', color: 'var(--primary)' }}
            >
              <i className="fas fa-home"></i> Beranda
            </span>
            <span className="crumb-separator">
              <i className="fas fa-chevron-right"></i>
            </span>
            <span
              onClick={navigateToFaq}
              style={{ cursor: 'pointer', color: 'var(--text-accent)' }}
            >
              FAQ &amp; Bantuan
            </span>
            <span className="crumb-separator">
              <i className="fas fa-chevron-right"></i>
            </span>
            <span className="crumb-current">TIMO AI Assistant</span>
          </div>

          <h1 className="page-banner-title">TIMO AI — Asisten Virtual BAGANOVA</h1>
          <p className="page-banner-subtitle">
            Tanya jawab otomatis seputar teknologi otomatisasi jaring bagan tancap, sensor beban, keselamatan melaut, hingga informasi hasil tangkapan bagan.
          </p>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <section className="about-section" style={{ padding: '2.5rem 1.5rem 4rem' }}>
        <div className="about-container baganova-timo-page-grid">
          {/* LEFT SIDEBAR: TIMO PROFILE & TOPIC CARDS */}
          <ScrollSlide y={22} delay={0.04}>
          <aside className="baganova-timo-sidebar">
            <div className="baganova-timo-profile-card">
              <div className="baganova-timo-page-orb">
                <img
                  src={timoMascotImg}
                  alt="Timo — Asisten Virtual BAGANOVA"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="baganova-timo-profile-meta">
                <h2>TIMO AI</h2>
                <span>Asisten Virtual BAGANOVA</span>
                <p>
                  Siap membantu untuk mendapatkan informasi, memahami fitur, dan menjawab berbagai pertanyaan seputar penggunaan BAGANOVA.
                </p>
              </div>
            </div>

            <div className="baganova-timo-topics-card">
              <h3>
                <i className="fas fa-bolt" aria-hidden="true"></i> Topik Tanya Cepat
              </h3>
              <div className="baganova-timo-topic-list">
                {TOPIC_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="baganova-timo-topic-item"
                    disabled={isSending}
                    onClick={() => void sendMessage(item.prompt)}
                  >
                    <div className="baganova-timo-topic-icon" aria-hidden="true">
                      <i className={item.icon}></i>
                    </div>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="baganova-timo-nav-links">
              <button
                type="button"
                className="baganova-timo-side-link"
                onClick={() => {
                  setCurrentView('articles');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <i className="fas fa-newspaper" aria-hidden="true"></i>
                <span>Baca Artikel Bagan Terkini</span>
                <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                className="baganova-timo-side-link"
                onClick={navigateToFaq}
              >
                <i className="fas fa-question-circle" aria-hidden="true"></i>
                <span>Lihat Daftar FAQ Umum</span>
                <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </button>
            </div>
          </aside>
          </ScrollSlide>

          {/* RIGHT WORKSPACE: CHAT CONSOLE */}
          <ScrollSlide y={24} delay={0.1}>
          <div className="baganova-timo-workspace">
            <div className="baganova-timo-workspace-head">
              <div className="baganova-timo-ws-title">
                <span className="baganova-timo-live-dot" aria-hidden="true"></span>
                <div>
                  <strong>Ruang Konsultasi TIMO AI</strong>
                  <span>Terhubung dengan sistem pengetahuan BAGANOVA</span>
                </div>
              </div>

              <button
                type="button"
                className="baganova-timo-ws-reset"
                onClick={handleReset}
                disabled={isSending || messages.length <= 1}
              >
                <i className="fas fa-rotate-right" aria-hidden="true"></i>
                <span>Percakapan Baru</span>
              </button>
            </div>

            <div className="baganova-timo-ws-messages" ref={messagesBoxRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`baganova-timo-msg-row ${msg.role === 'user' ? 'user' : 'model'}`}
                >
                  {msg.role === 'model' && (
                    <div className="baganova-timo-mini-badge" aria-hidden="true">
                      <img src={timoMascotImg} alt="" />
                    </div>
                  )}
                  <div
                    className={`baganova-timo-bubble ${msg.role === 'user' ? 'user' : 'model'} ${
                      msg.isError ? 'error' : ''
                    }`}
                  >
                    {msg.role === 'model' ? renderFormattedText(msg.text) : msg.text}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="baganova-timo-sources">
                        <span>Sumber referensi:</span>
                        <div className="baganova-timo-source-links">
                          {msg.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="fas fa-external-link-alt" aria-hidden="true"></i>
                              <span>{src.domain}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="baganova-timo-msg-row model">
                  <div className="baganova-timo-mini-badge is-thinking" aria-hidden="true">
                    <img src={timoMascotImg} alt="" />
                  </div>
                  <div className="baganova-timo-bubble model typing">
                    <TimoLoader
                      variant="inline"
                      cycleMessages={[
                        'Timo lagi mikir jawabannya...',
                        'Timo lagi ngecek catatan bagan...',
                        'Sebentar ya, Timo siap jelasin!'
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>

            <form className="baganova-timo-ws-input" onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tulis pertanyaan Anda untuk TIMO AI (misal: cara kalibrasi tara jaring)..."
                disabled={isSending}
                aria-label="Pertanyaan untuk TIMO AI"
              />
              <button
                type="submit"
                className="baganova-timo-send-btn"
                disabled={isSending || !inputValue.trim()}
              >
                <i className="fas fa-paper-plane" aria-hidden="true"></i>
                <span>Kirim</span>
              </button>
            </form>
          </div>
          </ScrollSlide>
        </div>
      </section>
    </div>
  );
};

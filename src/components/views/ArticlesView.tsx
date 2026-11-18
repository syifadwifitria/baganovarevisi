/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Dedicated Maritime & Bagan Catch Articles Page
 * Menampilkan berita dan artikel nyata ter-update seputar bagan tancap,
 * hasil tangkapan bagan & pelagis, serta teknologi penangkapan bagan.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useBagan } from '../../context/BaganContext';
import { ScrollSlide, ScrollSectionSlide } from '../common/ScrollSlide';
import { TimoLoader } from '../TimoLoader';

interface BaganArticle {
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  publishedAt?: string;
  topicTag: string;
  imageUrl?: string;
}

interface ArticlesPayload {
  topic: string;
  topicLabel: string;
  fetchedAt: string;
  overview: string;
  articles: BaganArticle[];
}

const ARTICLE_TOPICS = [
  { id: 'semua', label: 'Semua Topik Bagan', icon: 'fas fa-globe-asia' },
  { id: 'tangkapan', label: 'Hasil Tangkapan Bagan', icon: 'fas fa-fish' },
  { id: 'teri', label: 'Ikan Pelagis & Pesisir', icon: 'fas fa-water' },
  { id: 'teknologi', label: 'Teknologi & Lampu Bagan', icon: 'fas fa-lightbulb' }
] as const;

export const ArticlesView: React.FC = () => {
  const { setCurrentView } = useBagan();
  const [selectedTopic, setSelectedTopic] = useState<string>('semua');
  const [articlesMap, setArticlesMap] = useState<Record<string, ArticlesPayload>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const loadArticles = useCallback(
    async (topic: string, forceRefresh = false) => {
      if (!forceRefresh && articlesMap[topic]) {
        setErrorMsg(null);
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const qs = new URLSearchParams({ topic });
        if (forceRefresh) qs.set('refresh', '1');

        const res = await fetch(`/api/bagan-articles?${qs.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Gagal memuat artikel berita bagan terbaru.');
        }

        setArticlesMap((prev) => ({
          ...prev,
          [topic]: data as ArticlesPayload
        }));
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Terjadi gangguan saat memuat artikel terbaru.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [articlesMap]
  );

  useEffect(() => {
    void loadArticles(selectedTopic);
  }, [selectedTopic, loadArticles]);

  const currentData = articlesMap[selectedTopic];

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
            <span className="crumb-current">Artikel Bagan &amp; Tangkapan</span>
          </div>

          <h1 className="page-banner-title">Artikel &amp; Berita Terkini Seputar Bagan</h1>
          <p className="page-banner-subtitle">
            Kumpulan berita dan artikel nyata yang diperbarui otomatis mengenai hasil tangkapan bagan, perikanan pesisir, dan teknologi alat bantu nelayan di Indonesia.
          </p>
        </div>
      </div>

      {/* Main Editorial Section */}
      <section className="about-section" style={{ padding: '2.5rem 1.5rem 4rem' }}>
        <ScrollSectionSlide className="about-container">
          {/* Filter & Refresh Toolbar */}
          <ScrollSlide y={20}>
          <div className="baganova-articles-page-toolbar">
            <div className="baganova-articles-topics" role="tablist" aria-label="Kategori Artikel Bagan">
              {ARTICLE_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedTopic === topic.id}
                  className={`baganova-articles-topic-btn ${
                    selectedTopic === topic.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedTopic(topic.id)}
                  disabled={isLoading}
                >
                  <i className={topic.icon} style={{ marginRight: '6px' }} aria-hidden="true"></i>
                  <span>{topic.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="baganova-articles-refresh-btn"
              onClick={() => void loadArticles(selectedTopic, true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <TimoLoader variant="button" />
              ) : (
                <i className="fas fa-sync-alt" aria-hidden="true"></i>
              )}
              <span>{isLoading ? 'Timo lagi nyari...' : 'Perbarui Artikel'}</span>
            </button>
          </div>
          </ScrollSlide>

          {isLoading && (
            <TimoLoader
              variant="card"
              cycleMessages={[
                'Timo lagi berenang cari kabar bagan terbaru...',
                'Sedang menyelam mengumpulkan berita tangkapan laut...',
                'Sebentar ya, jaring artikel lagi ditarik ke permukaan!'
              ]}
              subtext="Memuat berita nyata terbaru seputar bagan tancap dan hasil laut"
            />
          )}

          {!isLoading && errorMsg && (
            <div className="baganova-articles-error" style={{ padding: '32px 20px' }}>
              <p>{errorMsg}</p>
              <button
                type="button"
                className="baganova-articles-retry-btn"
                onClick={() => void loadArticles(selectedTopic, true)}
              >
                Coba Muat Ulang
              </button>
            </div>
          )}

          {!isLoading && !errorMsg && currentData && (
            <>
              <ScrollSlide y={22}>
              <div className="baganova-articles-overview" style={{ marginBottom: '22px' }}>
                <div className="baganova-articles-overview-head">
                  <strong>
                    <i className="fas fa-compass" aria-hidden="true"></i> Sorotan Berita &amp; Tren
                    Terkini ({currentData.topicLabel})
                  </strong>
                  <span>
                    Diperbarui:{' '}
                    {new Date(currentData.fetchedAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p>{currentData.overview}</p>
              </div>
              </ScrollSlide>

              <div className="baganova-articles-page-grid">
                {currentData.articles.map((article, idx) => {
                  const showImage = Boolean(article.imageUrl && !failedImages[article.url]);
                  return (
                    <ScrollSlide key={`${article.url}-${idx}`} delay={Math.min(idx * 0.05, 0.25)} y={24}>
                    <article className="baganova-article-card" style={{ height: '100%' }}>
                      {showImage && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="baganova-article-media"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="baganova-article-thumb"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) =>
                                prev[article.url] ? prev : { ...prev, [article.url]: true }
                              )
                            }
                          />
                        </a>
                      )}
                      <div className="baganova-article-meta">
                        <span className="baganova-article-domain">{article.sourceName}</span>
                        <span className="baganova-article-topic">
                          {article.publishedAt || article.topicTag}
                        </span>
                      </div>
                      <h2 className="baganova-article-title">{article.title}</h2>
                      <p className="baganova-article-summary">{article.summary}</p>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="baganova-article-link"
                      >
                        <span>Baca Artikel Asli</span>
                        <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                      </a>
                    </article>
                    </ScrollSlide>
                  );
                })}
              </div>
            </>
          )}

          {/* Cross-navigation CTA to TIMO AI & FAQ */}
          <ScrollSlide delay={0.08}>
          <div className="baganova-articles-cta-box">
            <div>
              <h3>Ingin Tanya Lebih Lanjut Tentang Berita atau Teknologi Bagan?</h3>
              <p>
                Diskusikan topik hasil tangkapan laut, operasional bagan tancap, atau cara kerja BAGANOVA langsung bersama TIMO AI.
              </p>
            </div>
            <div className="baganova-articles-cta-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCurrentView('timo-ai');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <i className="fas fa-robot" aria-hidden="true"></i>
                <span>Tanya TIMO AI</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={navigateToFaq}
              >
                <i className="fas fa-question-circle" aria-hidden="true"></i>
                <span>Kembali ke FAQ</span>
              </button>
            </div>
          </div>
          </ScrollSlide>
        </ScrollSectionSlide>
      </section>
    </div>
  );
};

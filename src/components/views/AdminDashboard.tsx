/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Dashboard Pengembang / Admin (Engineer & Super Admin Mode)
 * Terhubung dengan seluruh akun nelayan terdaftar, kalibrasi teknis, dan telemetri lengkap.
 */

import React, { useState } from 'react';
import { useBagan } from '../../context/BaganContext';
import { ScrollSlide } from '../common/ScrollSlide';
import { TensionWaveformCanvas } from '../common/TensionWaveformCanvas';
import { AnalyticsView } from './AnalyticsView';
import { HistoryView } from './HistoryView';
import { SettingsView } from './SettingsView';
import { Simulation3DView } from './Simulation3DView';
import { FisheriesIntelView } from './FisheriesIntelView';
import { AddBaganModal } from '../modals/AuthModals';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    bagans,
    activeBaganId,
    activeBagan,
    selectBagan,
    deleteBagan,
    approveUser,
    deleteFisherman,
    contactMessages,
    toggleContactMessageStatus,
    deleteContactMessage,
    logout
  } = useBagan();

  const [activeTab, setActiveTab] = useState<'nelayan' | 'messages' | 'monitoring' | 'sim3d' | 'fisheries' | 'analytics' | 'calibration' | 'history'>('nelayan');
  const [addBaganModalOpen, setAddBaganModalOpen] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmDeleteBaganId, setConfirmDeleteBaganId] = useState<string | null>(null);

  // Fishermen users registered in the system
  const registeredFishermen = users.filter((u) => u.role === 'fisherman');
  const unreadMessagesCount = contactMessages.filter((m) => m.status === 'unread').length;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Admin Top Header Banner */}
      <ScrollSlide y={20}>
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 35px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)'
            }}
          >
            <i className="fas fa-microchip"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--status-info-text)',
                  background: 'var(--status-info-bg)',
                  border: '1px solid var(--status-info-border)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}
              >
                Hak Akses Pengembang / Admin
              </span>
              {activeBagan.isRealHardware && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--status-ok-text)',
                    fontWeight: 700
                  }}
                >
                  <i className="fas fa-circle" style={{ fontSize: '0.5rem', marginRight: '4px' }}></i>
                  Sistem Online
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
              {currentUser?.fullName || 'Pengembang BAGANOVA'}
            </h1>
          </div>
        </div>

        {/* Admin Header Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Active Bagan Dropdown */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '0.82rem'
            }}
          >
            <span style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>Bagan:</span>
            <select
              value={activeBaganId}
              onChange={(e) => selectBagan(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {bagans.map((b) => (
                <option key={b.id} value={b.id} style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                  {b.name} ({b.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setAddBaganModalOpen(true)}
          >
            <i className="fas fa-plus"></i> Tambah Bagan
          </button>

          {bagans.length > 1 && (
            confirmDeleteBaganId === activeBagan.id ? (
              <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    deleteBagan(activeBagan.id);
                    setConfirmDeleteBaganId(null);
                  }}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Yakin Hapus?
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirmDeleteBaganId(null)}
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmDeleteBaganId(activeBagan.id)}
                title={`Hapus unit bagan ${activeBagan.id}`}
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
              >
                <i className="fas fa-trash"></i> Hapus Bagan
              </button>
            )
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={logout}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      </div>
      </ScrollSlide>

      {/* Admin KPI Summary Strip */}
      <ScrollSlide delay={0.05} y={24}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        <div className="stat-card" style={{ padding: '16px', textAlign: 'left' }}>
          <span className="stat-label">Nelayan Terdaftar (Tersambung)</span>
          <div className="stat-number text-val" style={{ color: 'var(--primary)', margin: '4px 0' }}>
            {registeredFishermen.length} Orang
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Akun nelayan yang terhubung</small>
        </div>

        <div className="stat-card" style={{ padding: '16px', textAlign: 'left' }}>
          <span className="stat-label">Total Unit Bagan</span>
          <div className="stat-number text-val" style={{ color: 'var(--primary)', margin: '4px 0' }}>
            {bagans.length} Bagan
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>1 Prototipe Fisik + {bagans.length - 1} Uji</small>
        </div>

        <div className="stat-card" style={{ padding: '16px', textAlign: 'left' }}>
          <span className="stat-label">Beban Bagan Aktif ({activeBagan.id})</span>
          <div className="stat-number text-val" style={{ color: 'var(--text-primary)', margin: '4px 0', fontFamily: 'JetBrains Mono' }}>
            {activeBagan.loadSensor.currentFiltered.toFixed(1)} kg
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Target: {activeBagan.loadSensor.targetThreshold} kg</small>
        </div>

        <div className="stat-card" style={{ padding: '16px', textAlign: 'left' }}>
          <span className="stat-label">Status Proteksi Limit Switch</span>
          <div className="stat-number text-val" style={{ color: 'var(--status-ok-text)', margin: '4px 0' }}>
            Normal (Siaga)
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Cut-off hardware mandiri</small>
        </div>
      </div>
      </ScrollSlide>

      {/* Admin Sub-Navigation Tabs */}
      <ScrollSlide delay={0.08} y={20}>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          background: 'var(--bg-secondary)',
          padding: '8px',
          borderRadius: '16px',
          border: '1px solid var(--card-border)'
        }}
      >
        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'nelayan' ? 'active' : ''}`}
          onClick={() => setActiveTab('nelayan')}
        >
          <i className="fas fa-users"></i>
          <span>Daftar Akun Nelayan ({registeredFishermen.length})</span>
        </button>

        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <i className="fas fa-inbox"></i>
          <span>Pesan / Pengaduan ({contactMessages.length})</span>
          {unreadMessagesCount > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '1px 7px',
                borderRadius: '999px',
                marginLeft: '2px'
              }}
            >
              {unreadMessagesCount} Baru
            </span>
          )}
        </button>

        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <i className="fas fa-wave-square"></i>
          <span>Monitoring Sensor 20 Hz</span>
        </button>

        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'sim3d' ? 'active' : ''}`}
          onClick={() => setActiveTab('sim3d')}
        >
          <i className="fas fa-cube"></i>
          <span>Simulasi 3D Prototipe</span>
        </button>

        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'calibration' ? 'active' : ''}`}
          onClick={() => setActiveTab('calibration')}
        >
          <i className="fas fa-tools"></i>
          <span>Kalibrasi Load Cell & ESP32</span>
        </button>

        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <i className="fas fa-chart-line"></i>
          <span>Analisis Sistem & Uji Laut</span>
        </button>

        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'fisheries' ? 'active' : ''}`}
          onClick={() => setActiveTab('fisheries')}
        >
          <i className="fas fa-cloud-sun-rain"></i>
          <span>Cuaca, Tangkap &amp; Konservasi</span>
        </button>

        <button
          type="button"
          className={`about-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i>
          <span>Log Operasi & Ekspor CSV</span>
        </button>
      </div>
      </ScrollSlide>

      {/* TAB CONTENT 1: DAFTAR AKUN NELAYAN YANG TERSAMBUNG KE PENGEMBANG */}
      {activeTab === 'nelayan' && (
        <ScrollSlide delay={0.05} y={24}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
              <i className="fas fa-users-cog"></i> Akun Nelayan &amp; Daftar Bagan
            </h3>
          </div>

          <div className="table-wrap-glass">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Lengkap Nelayan</th>
                  <th>Nomor HP / WhatsApp</th>
                  <th>Lokasi Penempatan Bagan</th>
                  <th>Kode Serial Perangkat</th>
                  <th>Status Akun</th>
                  <th>Tanggal Daftar</th>
                  <th>Tindakan Admin</th>
                </tr>
              </thead>
              <tbody>
                {registeredFishermen.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                      Belum ada akun nelayan terdaftar.
                    </td>
                  </tr>
                ) : (
                  registeredFishermen.map((fisherman, idx) => (
                    <tr key={fisherman.id}>
                      <td>
                        <span className="table-badge">{idx + 1}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{fisherman.fullName}</strong>
                        <small style={{ display: 'block', color: 'var(--primary)' }}>
                          Username: @{fisherman.username}
                        </small>
                      </td>
                      <td>
                        <span style={{ color: 'var(--primary)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                          <i className="fab fa-whatsapp"></i> {fisherman.phoneNumber}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: 'var(--text-secondary)' }}>{fisherman.location}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {fisherman.registeredBaganIds.map((bId) => (
                            <span
                              key={bId}
                              style={{
                                fontSize: '0.75rem',
                                fontFamily: 'JetBrains Mono',
                                background: 'var(--status-info-bg)',
                                color: 'var(--status-info-text)',
                                border: '1px solid var(--status-info-border)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700
                              }}
                            >
                              {bId}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              fisherman.status === 'active'
                                ? 'var(--status-ok-bg)'
                                : 'var(--status-warn-bg)',
                            color: fisherman.status === 'active' ? 'var(--status-ok-text)' : 'var(--status-warn-text)',
                            border: `1px solid ${fisherman.status === 'active' ? 'var(--status-ok-border)' : 'var(--status-warn-border)'}`
                          }}
                        >
                          {fisherman.status === 'active' ? 'Aktif (Terverifikasi)' : 'Menunggu Verifikasi'}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: 'var(--text-muted)' }}>{fisherman.createdAt}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {fisherman.status === 'pending_verification' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => approveUser(fisherman.id)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Verifikasi
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${fisherman.phoneNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            title="Hubungi Nelayan via WhatsApp"
                          >
                            <i className="fab fa-whatsapp"></i> Chat
                          </a>
                          {confirmDeleteUserId === fisherman.id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => {
                                  deleteFisherman(fisherman.id);
                                  setConfirmDeleteUserId(null);
                                }}
                                style={{
                                  padding: '4px 9px',
                                  fontSize: '0.74rem',
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Hapus?
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setConfirmDeleteUserId(null)}
                                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setConfirmDeleteUserId(fisherman.id)}
                              title={`Hapus akun ${fisherman.fullName}`}
                              style={{ padding: '4px 9px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Daftar Unit Bagan Terdaftar + Hapus Bagan */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1.08rem', color: 'var(--text-primary)', margin: 0 }}>
                <i className="fas fa-ship" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                Daftar Unit Bagan ({bagans.length})
              </h4>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setAddBaganModalOpen(true)}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <i className="fas fa-plus"></i> Tambah Bagan
              </button>
            </div>

            <div className="table-wrap-glass">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode Bagan</th>
                    <th>Nama Unit</th>
                    <th>Lokasi</th>
                    <th>Target Beban</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bagans.map((b) => {
                    const isActive = b.id === activeBaganId;
                    return (
                      <tr key={b.id}>
                        <td>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontFamily: 'JetBrains Mono',
                              background: 'var(--status-info-bg)',
                              color: 'var(--status-info-text)',
                              border: '1px solid var(--status-info-border)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700
                            }}
                          >
                            {b.id}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong>
                          {isActive && (
                            <span style={{ marginLeft: '8px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-ok-text)' }}>
                              · Aktif
                            </span>
                          )}
                        </td>
                        <td>
                          <small style={{ color: 'var(--text-secondary)' }}>{b.location}</small>
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                          {b.loadSensor.targetThreshold} kg
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {!isActive && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => selectBagan(b.id)}
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              >
                                Pilih
                              </button>
                            )}
                            {bagans.length > 1 && (
                              confirmDeleteBaganId === b.id ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => {
                                      deleteBagan(b.id);
                                      setConfirmDeleteBaganId(null);
                                    }}
                                    style={{
                                      padding: '4px 9px',
                                      fontSize: '0.74rem',
                                      background: '#ef4444',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Yakin Hapus?
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setConfirmDeleteBaganId(null)}
                                    style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setConfirmDeleteBaganId(b.id)}
                                  title={`Hapus bagan ${b.name}`}
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                                >
                                  <i className="fas fa-trash"></i> Hapus
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </ScrollSlide>
      )}

      {/* TAB CONTENT 1B: KOTAK MASUK PESAN & PENGADUAN */}
      {activeTab === 'messages' && (
        <ScrollSlide delay={0.05} y={24}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '18px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                <i className="fas fa-inbox"></i> Kotak Masuk Pesan & Pengaduan Nelayan
              </h3>
            </div>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: '14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: unreadMessagesCount > 0 ? 'var(--status-danger-bg)' : 'var(--status-ok-bg)',
                color: unreadMessagesCount > 0 ? 'var(--status-danger-text)' : 'var(--status-ok-text)',
                border: `1px solid ${unreadMessagesCount > 0 ? 'var(--status-danger-border)' : 'var(--status-ok-border)'}`
              }}
            >
              {unreadMessagesCount > 0 ? `${unreadMessagesCount} Pesan Belum Ditangani` : 'Semua Pesan Sudah Ditangani'}
            </span>
          </div>

          {contactMessages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px dashed var(--card-border)',
                color: 'var(--text-secondary)'
              }}
            >
              <i className="fas fa-envelope-open-text" style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '10px', opacity: 0.7 }}></i>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                Belum ada pesan atau pengaduan yang masuk.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {contactMessages.map((msg) => {
                const isUnread = msg.status === 'unread';
                const cleanWa = msg.phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
                return (
                  <div
                    key={msg.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1.5px solid ${isUnread ? 'rgba(0, 229, 208, 0.45)' : 'var(--card-border)'}`,
                      borderRadius: '16px',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {msg.name}
                          </strong>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: isUnread ? 'var(--status-warn-bg)' : 'var(--status-ok-bg)',
                              color: isUnread ? 'var(--status-warn-text)' : 'var(--status-ok-text)',
                              border: `1px solid ${isUnread ? 'var(--status-warn-border)' : 'var(--status-ok-border)'}`
                            }}
                          >
                            {isUnread ? 'Baru Masuk' : 'Selesai Ditangani'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <span>
                            <i className="fab fa-whatsapp" style={{ color: '#10b981' }}></i>{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>{msg.phone}</strong>
                          </span>
                          <span>
                            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)' }}></i> {msg.location}
                          </span>
                          <span>
                            <i className="fas fa-clock"></i> {msg.createdAt}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <a
                          href={`https://wa.me/${cleanWa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <i className="fab fa-whatsapp"></i> Balas WA
                        </a>
                        <button
                          type="button"
                          className={`btn btn-sm ${isUnread ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => toggleContactMessageStatus(msg.id)}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <i className={`fas ${isUnread ? 'fa-check' : 'fa-undo'}`}></i>{' '}
                          {isUnread ? 'Tandai Selesai' : 'Tandai Baru'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => deleteContactMessage(msg.id)}
                          style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                          title="Hapus pesan"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        fontSize: '0.92rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </ScrollSlide>
      )}

      {/* TAB CONTENT 2: MONITORING 20 HZ SENSOR */}
      {activeTab === 'monitoring' && (
        <ScrollSlide delay={0.05} y={24}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '24px', border: '1px solid var(--card-border)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: '0 0 6px 0' }}>
              <i className="fas fa-wave-square"></i> Osiloskop Digital Gaya Tarik Tali Utama (20 Hz)
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Membandingkan pembacaan sinyal mentah (raw dengan derau ombak) dan sinyal terfilter (Moving Average 15 Sampel).
            </p>
          </div>
          <TensionWaveformCanvas />
        </div>
        </ScrollSlide>
      )}

      {/* TAB CONTENT 3: SIMULASI 3D PROTOTIPE */}
      {activeTab === 'sim3d' && (
        <ScrollSlide delay={0.05} y={24}>
        <Simulation3DView embedded />
        </ScrollSlide>
      )}

      {/* TAB CONTENT 4: KALIBRASI SENSOR & PARAMETER ESP32 */}
      {activeTab === 'calibration' && (
        <ScrollSlide delay={0.05} y={24}>
          <SettingsView />
        </ScrollSlide>
      )}

      {/* TAB CONTENT 5: ANALISIS SISTEM */}
      {activeTab === 'analytics' && (
        <ScrollSlide delay={0.05} y={24}>
          <AnalyticsView />
        </ScrollSlide>
      )}

      {/* TAB CONTENT 5B: CUACA, TANGKAP, POPULASI & KONSERVASI */}
      {activeTab === 'fisheries' && (
        <ScrollSlide delay={0.05} y={24}>
          <FisheriesIntelView embedded />
        </ScrollSlide>
      )}

      {/* TAB CONTENT 6: LOG RIWAYAT & CSV */}
      {activeTab === 'history' && (
        <ScrollSlide delay={0.05} y={24}>
          <HistoryView />
        </ScrollSlide>
      )}

      <AddBaganModal isOpen={addBaganModalOpen} onClose={() => setAddBaganModalOpen(false)} />
    </div>
  );
};

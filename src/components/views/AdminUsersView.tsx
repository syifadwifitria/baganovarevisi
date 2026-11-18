/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — User & Device Registration Approval (Engineer / Super Admin View)
 */

import React from 'react';
import { useBagan } from '../../context/BaganContext';

export const AdminUsersView: React.FC = () => {
  const { users, bagans, approveUser, rejectUser, setCurrentView } = useBagan();

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
            <span className="crumb-current">Pusat Verifikasi Akun & Perangkat</span>
          </div>

          <h1 className="page-banner-title">
            Verifikasi Pendaftaran Nelayan & Registrasi Bagan
          </h1>
          <p className="page-banner-subtitle">
            Otoritas Teknisi dan Super Admin untuk memvalidasi pendaftaran baru nelayan, lokasi penempatan, serta pemetaan ID seri mikrokontroler bagan tancap.
          </p>
        </div>
      </div>

      <section className="history-section">
        <div className="history-container">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '8px' }}>
              Daftar Akun Pengguna Terdaftar ({users.length} Akun)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Verifikasi akun sebelum nelayan diberikan hak akses operasional kendali motor bagan.
            </p>
          </div>

          <div className="table-wrap-glass" style={{ marginBottom: '3rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Lengkap & Username</th>
                  <th>Nomor Kontak</th>
                  <th>Peran (Role)</th>
                  <th>Wilayah Pesisir</th>
                  <th>ID Bagan Terdaftar</th>
                  <th>Status Verifikasi</th>
                  <th>Tindakan Otoritas</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td>
                      <span className="table-badge">{i + 1}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{u.fullName}</strong>
                      <small style={{ display: 'block', color: 'var(--primary)', fontWeight: 600 }}>@{u.username}</small>
                    </td>
                    <td>{u.phoneNumber}</td>
                    <td>
                      <span
                        className="badge-status"
                        style={{
                          background:
                            u.role === 'fisherman'
                              ? 'var(--status-ok-bg)'
                              : u.role === 'engineer'
                              ? 'var(--status-info-bg)'
                              : 'var(--status-warn-bg)',
                          color:
                            u.role === 'fisherman'
                              ? 'var(--status-ok-text)'
                              : u.role === 'engineer'
                              ? 'var(--status-info-text)'
                              : 'var(--status-warn-text)',
                          border: `1px solid ${
                            u.role === 'fisherman'
                              ? 'var(--status-ok-border)'
                              : u.role === 'engineer'
                              ? 'var(--status-info-border)'
                              : 'var(--status-warn-border)'
                          }`
                        }}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: 'var(--text-secondary)' }}>{u.location}</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {u.registeredBaganIds.map((bid) => (
                          <span
                            key={bid}
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: 'JetBrains Mono',
                              background: 'var(--status-info-bg)',
                              border: '1px solid var(--status-info-border)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: 'var(--status-info-text)',
                              fontWeight: 700
                            }}
                          >
                            {bid}
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
                            u.status === 'active'
                              ? 'var(--status-ok-bg)'
                              : u.status === 'pending_verification'
                              ? 'var(--status-warn-bg)'
                              : 'var(--status-danger-bg)',
                          color:
                            u.status === 'active'
                              ? 'var(--status-ok-text)'
                              : u.status === 'pending_verification'
                              ? 'var(--status-warn-text)'
                              : 'var(--status-danger-text)',
                          border: `1px solid ${
                            u.status === 'active'
                              ? 'var(--status-ok-border)'
                              : u.status === 'pending_verification'
                              ? 'var(--status-warn-border)'
                              : 'var(--status-danger-border)'
                          }`
                        }}
                      >
                        {u.status === 'active'
                          ? 'Aktif (Terverifikasi)'
                          : u.status === 'pending_verification'
                          ? 'Menunggu Verifikasi'
                          : 'Ditolak'}
                      </span>
                    </td>
                    <td>
                      {u.status === 'pending_verification' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => approveUser(u.id)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => rejectUser(u.id)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--status-danger-text)' }}
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <i className="fas fa-check"></i> Siap Operasi
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Device Provisioning Summary */}
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '8px' }}>
              Pemetaan Seri Hardware Bagan ({bagans.length} Unit Fisik & Digital)
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}
            >
              {bagans.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '16px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                      {b.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div>IP ESP32: <code style={{ color: 'var(--text-accent)', fontWeight: 700 }}>{b.technical.espIp}</code></div>
                    <div>Sampling: {b.technical.samplingRateHz} Hz · Baud: {b.technical.baudRate} bps</div>
                    <div>Tipe: <span style={{ color: b.isRealHardware ? 'var(--status-ok-text)' : 'var(--primary)', fontWeight: 700 }}>{b.isRealHardware ? 'Prototipe Perangkat Keras' : 'Simulasi'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

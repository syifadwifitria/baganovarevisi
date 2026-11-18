/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Operation Audit Log & CSV Export View
 */

import React, { useState } from 'react';
import { useBagan } from '../../context/BaganContext';
import { HoistingRecord } from '../../types/bagan';

export const HistoryView: React.FC = () => {
  const { bagans, activeBaganId, selectBagan, showToast, setCurrentView } = useBagan();
  const [filterBaganId, setFilterBaganId] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Collect all history across bagans or filter
  const allRecords: HoistingRecord[] = bagans.flatMap((b) => b.history);

  const filteredRecords = allRecords.filter((rec) => {
    if (filterBaganId !== 'all' && rec.baganId !== filterBaganId) return false;
    if (filterMode !== 'all' && rec.mode !== filterMode) return false;
    return true;
  });

  const exportCsv = () => {
    if (filteredRecords.length === 0) {
      showToast('Tidak ada data riwayat yang dapat diekspor.', 'info');
      return;
    }

    const headers = [
      'No',
      'ID Bagan',
      'Nama Bagan',
      'Tanggal',
      'Waktu Operasi',
      'Beban Pemicu (kg)',
      'Mode Pemicu',
      'Durasi Angkat (detik)',
      'Status Limit Switch',
      'Hasil Pengangkatan',
      'Operator'
    ];

    const rows = filteredRecords.map((log, index) => [
      index + 1,
      `"${log.baganId}"`,
      `"${log.baganName}"`,
      `"${log.date}"`,
      `"${log.time}"`,
      log.triggerLoad,
      `"${log.mode}"`,
      log.duration,
      `"${log.limitSwitchStatus}"`,
      `"${log.status}"`,
      `"${log.operator}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BAGANOVA_Log_Otomatisasi_Bagan_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('File CSV riwayat pengoperasian bagan berhasil diunduh.', 'success');
  };

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
            <span className="crumb-current">Riwayat Operasi Pengangkatan</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <h1 className="page-banner-title">
                Riwayat Pengoperasian Jaring Bagan
              </h1>
              <p className="page-banner-subtitle">
                Catatan Audit Digital Waktu Hauling, Beban Pemicu, Durasi Motor, dan Status Limit Switch.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={exportCsv}
              >
                <i className="fas fa-file-csv"></i> Ekspor CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table Section */}
      <section className="history-section" id="history">
        <div className="history-container">
          {/* Filter Bar */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Filter Perangkat Bagan:
                </label>
                <select
                  value={filterBaganId}
                  onChange={(e) => setFilterBaganId(e.target.value)}
                  className="select-modern"
                >
                  <option value="all">Semua Bagan Terdaftar ({allRecords.length} Log)</option>
                  {bagans.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Filter Mode Pemicu:
                </label>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="select-modern"
                >
                  <option value="all">Semua Mode</option>
                  <option value="Otomatis ESP32">Otomatis ESP32</option>
                  <option value="Manual Nelayan">Manual Nelayan</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filteredRecords.length}</strong> catatan pengangkatan
            </div>
          </div>

          {/* Data Table */}
          <div className="table-wrap-glass">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">ID & Nama Bagan</th>
                  <th scope="col">Waktu & Tanggal</th>
                  <th scope="col">Beban Pemicu</th>
                  <th scope="col">Mode</th>
                  <th scope="col">Durasi Angkat</th>
                  <th scope="col">Limit Switch</th>
                  <th scope="col">Hasil Pengangkatan</th>
                  <th scope="col">Operator</th>
                </tr>
              </thead>
              <tbody id="historyTable">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      Tidak ada catatan riwayat yang sesuai dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((log, index) => (
                    <tr key={`${log.baganId}-${log.id}-${index}`}>
                      <td>
                        <span className="table-badge">{index + 1}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{log.baganName}</strong>
                        <small style={{ display: 'block', color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>
                          {log.baganId}
                        </small>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{log.time}</strong>
                        <small style={{ display: 'block', color: 'var(--text-secondary)' }}>{log.date}</small>
                      </td>
                      <td>
                        <span
                          style={{
                            color: 'var(--primary)',
                            fontFamily: 'JetBrains Mono',
                            fontWeight: 700,
                            fontSize: '0.95rem'
                          }}
                        >
                          {log.triggerLoad} kg
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge-status"
                          style={{ background: 'var(--status-info-bg)', color: 'var(--status-info-text)', border: '1px solid var(--status-info-border)' }}
                        >
                          {log.mode}
                        </span>
                      </td>
                      <td>{log.duration} dtk</td>
                      <td>
                        <span style={{ color: 'var(--status-danger-text)', fontSize: '0.8rem', fontWeight: 600 }}>
                          <i className="fas fa-check-circle"></i> {log.limitSwitchStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: 'var(--status-ok-bg)',
                            color: 'var(--status-ok-text)',
                            border: '1px solid var(--status-ok-border)',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: 'var(--text-secondary)' }}>{log.operator}</small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

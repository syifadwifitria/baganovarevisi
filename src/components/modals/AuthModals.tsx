/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Modal Masuk (Login) & Registrasi Khusus Nelayan
 * 1. Form Masuk langsung menggunakan email/username & password tanpa pilihan role
 * 2. Form Daftar dikhususkan untuk nelayan, setelah daftar langsung diarahkan untuk masuk
 */

import React, { useState, useEffect } from 'react';
import { useBagan } from '../../context/BaganContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  defaultIdentifier?: string;
  loginRoleHint?: 'fisherman' | 'admin' | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  defaultIdentifier = '',
  loginRoleHint = null
}) => {
  const { login } = useBagan();
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (defaultIdentifier) {
      setIdentifier(defaultIdentifier);
    } else if (isOpen) {
      setIdentifier('');
      setPassword('');
    }
  }, [defaultIdentifier, isOpen, loginRoleHint]);

  if (!isOpen) return null;

  const isFishermanHint = loginRoleHint === 'fisherman';
  const isAdminHint = loginRoleHint === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(identifier, password)) {
      onClose();
      setPassword('');
    }
  };

  return (
    <div className="baganova-modal-backdrop" onClick={onClose}>
      <div
        className="baganova-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <div className="modal-header">
          <h3>
            <i
              className={`fas ${isAdminHint ? 'fa-crown' : isFishermanHint ? 'fa-user' : 'fa-sign-in-alt'} text-accent`}
              style={
                isAdminHint || isFishermanHint
                  ? { color: 'var(--primary)' }
                  : undefined
              }
            ></i>{' '}
            {isAdminHint
              ? 'Login Admin / Pengembang'
              : isFishermanHint
              ? 'Login Nelayan'
              : 'Masuk ke Akun Anda'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {isAdminHint
                ? 'Masukkan akun administrator atau tim pengembang untuk mengakses panel kalibrasi sensor & telemetri IoT.'
                : isFishermanHint
                ? 'Masukkan username atau email nelayan beserta kata sandi untuk memantau berat tangkapan & kendali jaring.'
                : 'Silakan masukkan email atau username beserta kata sandi untuk mengakses akun Anda.'}
            </p>

            <div className="form-group-custom">
              <label htmlFor="loginIdentifier">
                <i className="fas fa-user"></i> Email atau Username:
              </label>
              <input
                type="text"
                id="loginIdentifier"
                className="text-input-modern"
                placeholder={
                  isAdminHint
                    ? 'Masukkan email atau username admin'
                    : isFishermanHint
                    ? 'Masukkan username atau email nelayan'
                    : 'Masukkan email atau username'
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group-custom">
              <label htmlFor="loginPassword">
                <i className="fas fa-lock"></i> Kata Sandi (Password):
              </label>
              <input
                type="password"
                id="loginPassword"
                className="text-input-modern"
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn-card-action"
              onClick={() => {
                onClose();
                onSwitchToRegister?.();
              }}
            >
              Belum punya akun? <strong style={{ color: 'var(--primary)' }}>Daftar</strong>
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                <i className="fas fa-sign-in-alt"></i> Masuk
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  onRegistrationComplete?: (registeredUsername: string) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onRegistrationComplete
}) => {
  const { registerFisherman } = useBagan();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    location: '',
    baganSerialCode: '',
    username: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = registerFisherman(formData);
    if (res.success) {
      onClose();
      // As requested: "kalo udah daftar baru diarahin untuk masuk"
      if (onRegistrationComplete) {
        onRegistrationComplete(formData.username.trim());
      } else if (onSwitchToLogin) {
        onSwitchToLogin();
      }
    }
  };

  return (
    <div className="baganova-modal-backdrop" onClick={onClose}>
      <div
        className="baganova-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>
              <i className="fas fa-user-plus text-accent"></i> Pendaftaran Akun Nelayan
            </h3>
            <small style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
              Khusus nelayan bagan tancap • Setelah daftar Anda akan diarahkan untuk masuk
            </small>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Lengkapi formulir pendaftaran di bawah ini. Akun nelayan Anda akan tersambung ke sistem pengembang.
            </p>

            <div className="form-group-custom">
              <label htmlFor="regFullName">
                <i className="fas fa-id-card"></i> Nama Lengkap Nelayan:
              </label>
              <input
                type="text"
                id="regFullName"
                className="text-input-modern"
                placeholder="Contoh: Pak Suhendra"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group-custom">
              <label htmlFor="regPhone">
                <i className="fab fa-whatsapp"></i> Nomor WhatsApp / HP:
              </label>
              <input
                type="tel"
                id="regPhone"
                className="text-input-modern"
                placeholder="Contoh: 0812-3456-7890"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group-custom">
              <label htmlFor="regLocation">
                <i className="fas fa-map-marker-alt"></i> Lokasi Pemasangan Bagan:
              </label>
              <input
                type="text"
                id="regLocation"
                className="text-input-modern"
                placeholder="Contoh: Pesisir Teluk Banten / Nusantara"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="form-group-custom">
              <label htmlFor="regBaganCode">
                <i className="fas fa-ship"></i> Nama / Kode Bagan Nelayan:
              </label>
              <input
                type="text"
                id="regBaganCode"
                className="text-input-modern"
                placeholder="Contoh: Bagan Barokah 01"
                value={formData.baganSerialCode}
                onChange={(e) => setFormData({ ...formData, baganSerialCode: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group-custom">
                <label htmlFor="regUname">
                  <i className="fas fa-user"></i> Buat Username:
                </label>
                <input
                  type="text"
                  id="regUname"
                  className="text-input-modern"
                  placeholder="hendra_bagan"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="regPassword">
                  <i className="fas fa-lock"></i> Buat Password:
                </label>
                <input
                  type="password"
                  id="regPassword"
                  className="text-input-modern"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn-card-action"
              onClick={() => {
                onClose();
                onSwitchToLogin?.();
              }}
            >
              Sudah punya akun? <strong style={{ color: 'var(--primary)' }}>Masuk</strong>
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                <i className="fas fa-user-plus"></i> Daftar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddBaganModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addBagan } = useBagan();
  const [name, setName] = useState('');
  const [id, setId] = useState(`BGN-KRG-0${Math.floor(Math.random() * 80 + 10)}`);
  const [location, setLocation] = useState('');
  const [targetThreshold, setTargetThreshold] = useState(85);
  const [baselineTare, setBaselineTare] = useState(20);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addBagan({
      name: name.trim() || `Bagan ${id}`,
      id,
      location,
      targetThreshold,
      baselineTare
    });
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="baganova-modal-backdrop" onClick={onClose}>
      <div className="baganova-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-plus-circle text-accent"></i> Daftarkan Perangkat Bagan Baru
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group-custom">
              <label>Nama Bagan:</label>
              <input
                type="text"
                className="text-input-modern"
                placeholder="Contoh: Bagan Barokah 01"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-custom">
              <label>ID Perangkat Bagan:</label>
              <input
                type="text"
                className="text-input-modern"
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group-custom">
              <label>Lokasi Perairan:</label>
              <input
                type="text"
                className="text-input-modern"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group-custom">
                <label>Target Angkat (kg):</label>
                <input
                  type="number"
                  className="text-input-modern"
                  value={targetThreshold}
                  onChange={(e) => setTargetThreshold(parseFloat(e.target.value) || 85)}
                />
              </div>

              <div className="form-group-custom">
                <label>Tara Jaring Kosong (kg):</label>
                <input
                  type="number"
                  className="text-input-modern"
                  value={baselineTare}
                  onChange={(e) => setBaselineTare(parseFloat(e.target.value) || 20)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Perangkat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

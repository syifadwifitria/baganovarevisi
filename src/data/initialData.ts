/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Initial Users, Bagan Devices, and Waveform Data
 */

import { BaganDevice, UserAccount, WaveformPoint } from '../types/bagan';

export function generateInitialWaveform(baselineKg: number, noiseAmp: number = 1.8): WaveformPoint[] {
  const points: WaveformPoint[] = [];
  const now = Date.now();
  for (let i = 89; i >= 0; i--) {
    const t = (90 - i) * 0.15;
    const waveNoise = Math.sin(t) * noiseAmp + Math.cos(t * 2.3) * (noiseAmp * 0.4);
    const raw = Math.max(0, parseFloat((baselineKg + waveNoise).toFixed(1)));
    points.push({
      raw,
      filtered: baselineKg,
      timestamp: now - i * 100
    });
  }
  return points;
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-pengembang',
    username: 'pengembang',
    email: 'pengembang@baganova.id',
    password: 'admin123',
    fullName: 'Tim Pengembang SIK UPI Serang',
    phoneNumber: '0821-4455-6677',
    role: 'engineer',
    status: 'active',
    location: 'Lab Instrumentasi Kelautan UPI Kampus Serang',
    registeredBaganIds: ['BGN-KRG-01', 'BGN-KRG-02'],
    assignedBaganIds: ['BGN-KRG-01', 'BGN-KRG-02'],
    createdAt: '2026-08-01'
  },
  {
    id: 'usr-admin',
    username: 'admin',
    email: 'admin@baganova.id',
    password: 'admin123',
    fullName: 'Syifa Dwi Fitria (Admin Pengembang)',
    phoneNumber: '0813-9988-7766',
    role: 'superadmin',
    status: 'active',
    location: 'Sistem Informasi Kelautan — UPI Kampus Serang',
    registeredBaganIds: ['BGN-KRG-01', 'BGN-KRG-02'],
    assignedBaganIds: ['BGN-KRG-01', 'BGN-KRG-02'],
    createdAt: '2026-08-01'
  },
  {
    id: 'usr-nelayan-01',
    username: 'nelayan_karangantu',
    email: 'suhendra@nelayan.id',
    password: 'nelayan123',
    fullName: 'Pak Suhendra (Nelayan Karangantu)',
    phoneNumber: '0812-8877-3321',
    role: 'fisherman',
    status: 'active',
    location: 'Pesisir Karangantu, Kasemen, Serang - Banten',
    registeredBaganIds: ['BGN-KRG-01'],
    createdAt: '2026-09-15'
  }
];

export const INITIAL_BAGANS: BaganDevice[] = [
  {
    id: 'BGN-KRG-01',
    name: 'Bagan Barokah (Karangantu)',
    ownerId: 'usr-nelayan-01',
    location: 'Perairan Karangantu, Serang - Banten',
    coordinates: '6°01\'37.2"S 106°09\'28.8"E',
    isRealHardware: false,
    status: 'standby',
    lastHeartbeat: 'Mode simulasi website',
    batteryVoltage: 12.8,
    rssi: -64,
    loadSensor: {
      baselineTare: 20.0,
      targetThreshold: 85.0,
      currentRaw: 20.0,
      currentFiltered: 20.0,
      noiseAmplitude: 1.8,
      stabilityPct: 96.4,
      isStable: true,
      stabilityDwellSec: 2.5,
      filterWindow: 15,
      historyWaveform: generateInitialWaveform(20.0, 1.8)
    },
    winch: {
      motorState: 'standby',
      netPosition: 'bottom',
      limitSwitchTop: false,
      autoMode: true,
      cableHeightPx: 190,
      speedMeterSec: 0.25
    },
    technical: {
      espIp: '192.168.4.1',
      baudRate: 115200,
      samplingRateHz: 20,
      hx711Gain: 128,
      calibrationFactor: 420.5,
      waveNoiseSpikesFiltered: 186,
      uptimeHours: 72.4
    },
    analytics: {
      avgDurationSec: 18.2,
      responseTimeSec: 1.15,
      successRatePct: 100,
      totalCyclesTested: 14,
      falseTriggerCount: 0,
      accuracyDeviationPct: 1.2
    },
    history: [
      {
        id: 1,
        baganId: 'BGN-KRG-01',
        baganName: 'Bagan Barokah (Karangantu)',
        date: '2026-11-01',
        time: '21:15 WIB',
        triggerLoad: 86.4,
        mode: 'Otomatis ESP32',
        duration: 18.1,
        limitSwitchStatus: 'Aktif (Cut-off)',
        status: 'Sukses (Panen)',
        operator: 'Sistem Otomatis (ESP32)'
      },
      {
        id: 2,
        baganId: 'BGN-KRG-01',
        baganName: 'Bagan Barokah (Karangantu)',
        date: '2026-11-01',
        time: '23:30 WIB',
        triggerLoad: 85.8,
        mode: 'Otomatis ESP32',
        duration: 18.4,
        limitSwitchStatus: 'Aktif (Cut-off)',
        status: 'Sukses (Panen)',
        operator: 'Sistem Otomatis (ESP32)'
      },
      {
        id: 3,
        baganId: 'BGN-KRG-01',
        baganName: 'Bagan Barokah (Karangantu)',
        date: '2026-11-02',
        time: '01:45 WIB',
        triggerLoad: 88.2,
        mode: 'Otomatis ESP32',
        duration: 17.9,
        limitSwitchStatus: 'Aktif (Cut-off)',
        status: 'Sukses (Puncak)',
        operator: 'Sistem Otomatis (ESP32)'
      }
    ]
  }
];

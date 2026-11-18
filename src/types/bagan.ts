/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Smart Automated Bagan System
 * Multi-Bagan Management & Maritime IoT Types
 */

export type UserRole = 'guest' | 'fisherman' | 'engineer' | 'superadmin';

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  status: 'active' | 'pending_verification' | 'rejected';
  location: string;
  registeredBaganIds: string[];
  assignedBaganIds?: string[]; // For engineers
  createdAt: string;
}

export interface WaveformPoint {
  raw: number;
  filtered: number;
  timestamp: number;
}

export interface HoistingRecord {
  id: number;
  baganId: string;
  baganName: string;
  date: string;
  time: string;
  triggerLoad: number; // in kg
  mode: 'Otomatis ESP32' | 'Manual Nelayan' | 'Uji Kalibrasi';
  duration: number; // in seconds
  limitSwitchStatus: 'Aktif (Cut-off)' | 'Normal' | 'Manual Stop';
  status: 'Sukses (Panen)' | 'Sukses (Puncak)' | 'Dihentikan Manual' | 'E-STOP';
  operator: string;
  notes?: string;
}

export interface BaganDevice {
  id: string; // e.g. 'BGN-KRG-01'
  name: string; // e.g. 'Bagan Karangantu Utama'
  ownerId: string;
  location: string; // e.g. 'Perairan Karangantu, Serang - Banten'
  coordinates?: string;
  isRealHardware: boolean; // Prototipe fisik vs simulasi
  status: 'online' | 'offline' | 'standby' | 'alert';
  lastHeartbeat: string;
  batteryVoltage: number; // e.g. 12.8
  rssi: number; // e.g. -65 dBm
  
  // Load sensor & tension parameters
  loadSensor: {
    baselineTare: number; // kg (deadweight of submerged net, e.g. 20.0 kg)
    targetThreshold: number; // kg (e.g. 85.0 kg)
    currentRaw: number; // kg (with wave noise)
    currentFiltered: number; // kg (filtered through Moving Average)
    noiseAmplitude: number; // kg
    stabilityPct: number; // e.g. 96.4%
    isStable: boolean;
    stabilityDwellSec: number; // e.g. 2.5s
    filterWindow: number; // samples (e.g. 15 samples)
    historyWaveform: WaveformPoint[];
  };

  // Winch & actuator state
  winch: {
    motorState: 'standby' | 'raising' | 'lowering' | 'stopped' | 'estop';
    netPosition: 'bottom' | 'moving_up' | 'top' | 'moving_down';
    limitSwitchTop: boolean; // false = open, true = cut-off
    autoMode: boolean;
    cableHeightPx: number; // 190 = bottom, 50 = top
    speedMeterSec: number; // ~0.25 m/s
  };

  // Technical & calibration config (accessible in Engineer mode)
  technical: {
    espIp: string;
    baudRate: number;
    samplingRateHz: number;
    hx711Gain: number; // 128 or 64
    calibrationFactor: number;
    waveNoiseSpikesFiltered: number;
    uptimeHours: number;
  };

  // Analytics performance
  analytics: {
    avgDurationSec: number;
    responseTimeSec: number;
    successRatePct: number;
    totalCyclesTested: number;
    falseTriggerCount: number;
    accuracyDeviationPct: number;
  };

  // Operation history logs
  history: HoistingRecord[];
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  location: string;
  message: string;
  status: 'unread' | 'resolved';
  createdAt: string;
}

export interface MarineConditions {
  region: string;
  stationLabel: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  fetchedAt: string;
  waveHeightM: number;
  waveDirectionDeg: number;
  wavePeriodSec: number;
  windWaveHeightM: number;
  swellWaveHeightM: number;
  currentVelocityKmh: number;
  currentVelocityMs: number;
  currentDirectionDeg: number;
  seaSurfaceTempC: number;
  seaState: 'calm' | 'moderate' | 'rough';
  recommendedNoiseAmpKg: number;
  source: string;
  cached?: boolean;
}

export interface DailyForecastPoint {
  date: string;
  isFuture: boolean;
  windSpeedMaxKmh: number;
  windSpeedMaxKnots: number;
  windGustsMaxKmh: number;
  precipitationMm: number;
  waveHeightMaxM: number;
  wavePeriodMaxSec: number;
  weatherCode: number;
}

export interface EcosystemIntel {
  region: string;
  stationLabel: string;
  fetchedAt: string;
  weather: {
    observedAt: string;
    airTempC: number;
    windSpeedKmh: number;
    windSpeedKnots: number;
    windGustsKmh: number;
    windDirectionDeg: number;
    precipitationMm: number;
    cloudCoverPct: number;
    pressureHpa: number;
    weatherCode: number;
    weatherLabel: string;
  };
  marine: MarineConditions;
  lunar: {
    phaseName: string;
    ageDays: number;
    illuminationPct: number;
    attractantEfficiency: 'Sangat Optimal' | 'Cukup Efektif' | 'Kurang Efektif';
    fishermanNote: string;
  };
  climatology: {
    seasonName: string;
    seasonCharacteristic: string;
    sstStatus: 'Normal' | 'Hangat (Waspada Ekosistem)' | 'Dingin / Upwelling';
    sstNote: string;
  };
  aiDecision: {
    score: number;
    status: 'LAYAK OPERASI' | 'WASPADA CUACA' | 'TUNDA MELAUT';
    summaryForFisherman: string;
    reasons: string[];
  };
  dailyTimeSeries: DailyForecastPoint[];
  sources: string[];
}

export type BaganSpeciesId =
  | 'teri_nasi'
  | 'teri_jengki'
  | 'rebon'
  | 'tembang'
  | 'cumi'
  | 'selar'
  | 'lainnya';

export interface FishBiometricSample {
  lengthCm: number;
  weightG: number;
}

export interface CatchLogEntry {
  id: string;
  baganId: string;
  date: string;
  species: BaganSpeciesId;
  customSpeciesName?: string;
  totalWeightKg: number;
  haulingCount: number;
  soakingHours: number;
  bycatchPct: number;
  juvenilePct: number;
  meshSizeMm: number;
  samples: FishBiometricSample[];
  notes?: string;
}


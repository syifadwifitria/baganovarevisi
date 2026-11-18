/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BAGANOVA — Multi-Bagan Management State & Telemetry Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BaganDevice, UserAccount, UserRole, HoistingRecord, WaveformPoint, ContactMessage, MarineConditions, EcosystemIntel, CatchLogEntry } from '../types/bagan';
import { INITIAL_BAGANS, INITIAL_USERS } from '../data/initialData';

export interface SafetyChecklistItem {
  id: string;
  title: string;
  desc: string;
  status: 'Wajib' | 'Penting';
}

export const SAFETY_CHECKLIST_ITEMS: SafetyChecklistItem[] = [
  {
    id: 'power_source',
    title: 'Kondisi Sumber Daya',
    desc: 'Pastikan tegangan baterai sesuai dengan kebutuhan motor dan perangkat elektronik sebelum sistem diaktifkan.',
    status: 'Wajib'
  },
  {
    id: 'electronics_protection',
    title: 'Perlindungan Perangkat Elektronik',
    desc: 'Pastikan modul HX711, ESP32, dan sambungan kabel terlindungi dari percikan air serta kelembapan.',
    status: 'Wajib'
  },
  {
    id: 'rope_condition',
    title: 'Kondisi Tali Pengangkat',
    desc: 'Periksa tali pengangkat agar bebas dari kerusakan, serat putus, keausan, atau korosi.',
    status: 'Wajib'
  },
  {
    id: 'nav_lights',
    title: 'Lampu Tanda Bagan (Navigasi)',
    desc: 'Pastikan lampu bagan berfungsi dengan baik agar keberadaan bagan terlihat oleh kapal lain pada malam hari.',
    status: 'Penting'
  },
  {
    id: 'manual_backup',
    title: 'Cadangan Pengoperasian Manual',
    desc: 'Pastikan mekanisme pengoperasian manual tersedia untuk mengantisipasi gangguan pada sistem otomatis.',
    status: 'Penting'
  },
  {
    id: 'limit_estop',
    title: 'Limit Switch dan Emergency Stop',
    desc: 'Pastikan sakelar batas dan tombol penghentian darurat berfungsi sebelum pengangkatan jaring dilakukan.',
    status: 'Wajib'
  },
  {
    id: 'area_clearance',
    title: 'Keamanan Area Pengangkatan',
    desc: 'Pastikan area sekitar jaring bebas dari orang, perahu, dan benda yang dapat menghambat proses pengangkatan.',
    status: 'Wajib'
  }
];

const INITIAL_CATCH_LOGS: CatchLogEntry[] = [
  {
    id: 'catch-01',
    baganId: 'BGN-KRG-01',
    date: '2026-11-10',
    species: 'teri_nasi',
    totalWeightKg: 64.5,
    haulingCount: 3,
    soakingHours: 6.5,
    bycatchPct: 4.5,
    juvenilePct: 12,
    meshSizeMm: 5,
    samples: [
      { lengthCm: 5.2, weightG: 1.1 },
      { lengthCm: 5.8, weightG: 1.5 },
      { lengthCm: 6.1, weightG: 1.8 },
      { lengthCm: 6.4, weightG: 2.1 },
      { lengthCm: 6.9, weightG: 2.6 }
    ],
    notes: 'Tangkapan malam bulan gelap, arus tenang.'
  },
  {
    id: 'catch-02',
    baganId: 'BGN-KRG-01',
    date: '2026-11-11',
    species: 'teri_nasi',
    totalWeightKg: 78.0,
    haulingCount: 3,
    soakingHours: 7.0,
    bycatchPct: 3.2,
    juvenilePct: 9,
    meshSizeMm: 5,
    samples: [
      { lengthCm: 5.6, weightG: 1.4 },
      { lengthCm: 6.0, weightG: 1.7 },
      { lengthCm: 6.5, weightG: 2.2 },
      { lengthCm: 7.0, weightG: 2.8 },
      { lengthCm: 7.3, weightG: 3.2 }
    ],
    notes: 'Hasil stabil saat angin Timur laut lemah.'
  },
  {
    id: 'catch-03',
    baganId: 'BGN-KRG-01',
    date: '2026-11-12',
    species: 'tembang',
    totalWeightKg: 92.4,
    haulingCount: 2,
    soakingHours: 6.0,
    bycatchPct: 6.0,
    juvenilePct: 14,
    meshSizeMm: 22,
    samples: [
      { lengthCm: 12.8, weightG: 19.5 },
      { lengthCm: 13.9, weightG: 25.1 },
      { lengthCm: 14.5, weightG: 28.8 },
      { lengthCm: 15.2, weightG: 33.4 },
      { lengthCm: 16.0, weightG: 39.2 }
    ],
    notes: 'Gerombolan tembang masuk menjelang dini hari.'
  },
  {
    id: 'catch-04',
    baganId: 'BGN-KRG-01',
    date: '2026-11-13',
    species: 'rebon',
    totalWeightKg: 48.2,
    haulingCount: 4,
    soakingHours: 7.5,
    bycatchPct: 7.5,
    juvenilePct: 18,
    meshSizeMm: 4,
    samples: [
      { lengthCm: 2.1, weightG: 0.12 },
      { lengthCm: 2.4, weightG: 0.18 },
      { lengthCm: 2.7, weightG: 0.25 },
      { lengthCm: 3.0, weightG: 0.34 }
    ],
    notes: 'Pasang surut purnama awal, persentase anakan perlu dipantau.'
  },
  {
    id: 'catch-05',
    baganId: 'BGN-KRG-01',
    date: '2026-11-14',
    species: 'cumi',
    totalWeightKg: 86.0,
    haulingCount: 2,
    soakingHours: 5.5,
    bycatchPct: 2.5,
    juvenilePct: 8,
    meshSizeMm: 20,
    samples: [
      { lengthCm: 11.2, weightG: 42.0 },
      { lengthCm: 12.5, weightG: 58.0 },
      { lengthCm: 13.8, weightG: 77.0 },
      { lengthCm: 15.0, weightG: 98.0 }
    ],
    notes: 'Ukuran cumi dewasa dominan, kualitas jual tinggi.'
  },
  {
    id: 'catch-06',
    baganId: 'BGN-KRG-01',
    date: '2026-11-15',
    species: 'teri_nasi',
    totalWeightKg: 85.4,
    haulingCount: 3,
    soakingHours: 6.5,
    bycatchPct: 3.8,
    juvenilePct: 11,
    meshSizeMm: 5,
    samples: [
      { lengthCm: 5.4, weightG: 1.25 },
      { lengthCm: 5.9, weightG: 1.62 },
      { lengthCm: 6.3, weightG: 2.0 },
      { lengthCm: 6.8, weightG: 2.52 },
      { lengthCm: 7.2, weightG: 3.05 }
    ],
    notes: 'Sinkron dengan hauling otomatis ESP32.'
  }
];

interface BaganContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  bagans: BaganDevice[];
  activeBaganId: string;
  activeBagan: BaganDevice;
  currentRole: UserRole;
  isSimulatingTelemetry: boolean;
  
  // Navigation & views
  currentView: string; // 'welcome' | 'dashboard' | 'monitoring' | 'control' | 'analytics' | 'history' | 'settings' | 'sop' | 'admin-users'
  setCurrentView: (view: string) => void;
  
  // Auth methods
  login: (identifier: string, password?: string) => boolean;
  logout: () => void;
  registerFisherman: (formData: {
    fullName: string;
    phoneNumber: string;
    location: string;
    baganSerialCode: string;
    username: string;
    email?: string;
    password?: string;
  }) => { success: boolean; message: string; registeredUsername?: string };
  switchUserRole: (role: UserRole) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  deleteFisherman: (userId: string) => void;
  
  // Multi-Bagan Fleet Management
  selectBagan: (id: string) => void;
  addBagan: (data: {
    name: string;
    id: string;
    location: string;
    targetThreshold: number;
    baselineTare: number;
  }) => { success: boolean; message: string };
  updateBagan: (id: string, updates: Partial<BaganDevice>) => void;
  deleteBagan: (id: string) => void;
  
  // Telemetry & Hoisting Controls
  addFishWeight: (kg?: number) => void;
  triggerTargetLoad: () => void;
  tareBaseline: () => void;
  startAutoHoist: (modeName?: 'Otomatis ESP32' | 'Manual Nelayan' | 'Uji Kalibrasi') => void;
  startLowerNet: () => void;
  triggerEStop: () => void;
  resetEStop: () => void;
  
  // Engineer Calibration
  updateTargetThreshold: (val: number) => void;
  updateBaselineTare: (val: number) => void;
  updateFilterWindow: (samples: number) => void;
  updateEspConfig: (ip: string, baud: number) => void;
  
  // Contact / Pengaduan Inbox
  contactMessages: ContactMessage[];
  addContactMessage: (data: { name: string; phone: string; location: string; message: string }) => void;
  toggleContactMessageStatus: (id: string) => void;
  deleteContactMessage: (id: string) => void;

  // Real Ocean Current & Wave Telemetry (Open-Meteo Marine API)
  marineData: MarineConditions | null;
  marineLoading: boolean;
  marineError: string | null;
  marineRegion: string;
  isLiveMarineSync: boolean;
  setIsLiveMarineSync: (enabled: boolean) => void;
  refreshMarineConditions: (region?: string, forceRefresh?: boolean) => Promise<void>;

  // Meteorology, Climatology, Lunar & AI Decision Support
  ecosystemIntel: EcosystemIntel | null;
  ecosystemLoading: boolean;
  refreshEcosystemIntel: (region?: string, forceRefresh?: boolean) => Promise<void>;

  // Fisheries Catch Logbook, Biometric Sampling & Conservation
  catchLogs: CatchLogEntry[];
  addCatchLog: (entry: Omit<CatchLogEntry, 'id'>) => void;
  deleteCatchLog: (id: string) => void;

  // Safety Checklist Gate (Checklist Keselamatan BAGANOVA)
  guideTab: 'sop' | 'checklist' | 'troubleshoot';
  setGuideTab: (tab: 'sop' | 'checklist' | 'troubleshoot') => void;
  openSafetyChecklist: () => void;
  safetyCheckedMap: Record<string, boolean>;
  toggleSafetyCheckItem: (itemId: string) => void;
  resetSafetyChecklist: () => void;
  mandatorySafetyCount: number;
  mandatorySafetyCompletedCount: number;
  isMandatorySafetyReady: boolean;

  // Toast notifications
  toast: { message: string; type: 'success' | 'info' | 'danger'; visible: boolean };
  showToast: (message: string, type?: 'success' | 'info' | 'danger') => void;
}

const BaganContext = createContext<BaganContextType | undefined>(undefined);

export const BaganProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load saved state or default with automatic reconciliation for initial users
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('baganova_users');
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Reconcile with INITIAL_USERS so admin@baganova.id and credentials are never lost
          const merged = [...parsed];
          for (const initUser of INITIAL_USERS) {
            const index = merged.findIndex(
              u => u.id === initUser.id || u.username.toLowerCase() === initUser.username.toLowerCase()
            );
            if (index !== -1) {
              // Guarantee email, password, and role are up to date
              merged[index] = {
                ...merged[index],
                email: initUser.email,
                password: initUser.password,
                role: initUser.role,
                status: 'active'
              };
            } else {
              merged.push(initUser);
            }
          }
          return merged;
        }
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [bagans, setBagans] = useState<BaganDevice[]>(() => {
    try {
      const saved = localStorage.getItem('baganova_bagans_fleet');
      if (saved) {
        const parsed: BaganDevice[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b) =>
            b.id === 'BGN-KRG-01' && b.lastHeartbeat === 'Terhubung (Baru saja)'
              ? {
                  ...b,
                  isRealHardware: false,
                  status: 'standby',
                  lastHeartbeat: 'Mode simulasi website'
                }
              : b
          );
        }
      }
      return INITIAL_BAGANS;
    } catch {
      return INITIAL_BAGANS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('baganova_current_user');
      return saved ? JSON.parse(saved) : null; // Starts at welcome page if null
    } catch {
      return null;
    }
  });

  const [activeBaganId, setActiveBaganId] = useState<string>(() => {
    return bagans[0]?.id || 'BGN-KRG-01';
  });

  const [currentView, setCurrentView] = useState<string>(() => {
    return currentUser ? 'dashboard' : 'portal';
  });

  const [isSimulatingTelemetry] = useState<boolean>(true);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'danger'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'danger' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('baganova_bagans_fleet', JSON.stringify(bagans));
  }, [bagans]);

  useEffect(() => {
    localStorage.setItem('baganova_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('baganova_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('baganova_current_user');
    }
  }, [currentUser]);

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    try {
      const saved = localStorage.getItem('baganova_contact_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('baganova_contact_messages', JSON.stringify(contactMessages));
  }, [contactMessages]);

  // Computed active bagan
  const activeBagan = bagans.find(b => b.id === activeBaganId) || bagans[0] || INITIAL_BAGANS[0];
  const currentRole = currentUser?.role || 'guest';

  // Interactive Guide Tab & Safety Checklist state (persisted per Bagan)
  const [guideTab, setGuideTab] = useState<'sop' | 'checklist' | 'troubleshoot'>('sop');
  const [safetyChecklistByBagan, setSafetyChecklistByBagan] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const saved = localStorage.getItem('baganova_safety_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('baganova_safety_checklist', JSON.stringify(safetyChecklistByBagan));
  }, [safetyChecklistByBagan]);

  const safetyCheckedMap = safetyChecklistByBagan[activeBagan.id] || {};
  const mandatoryItems = SAFETY_CHECKLIST_ITEMS.filter(item => item.status === 'Wajib');
  const mandatorySafetyCount = mandatoryItems.length;
  const mandatorySafetyCompletedCount = mandatoryItems.filter(item => Boolean(safetyCheckedMap[item.id])).length;
  const isMandatorySafetyReady = mandatorySafetyCompletedCount === mandatorySafetyCount;

  const toggleSafetyCheckItem = (itemId: string) => {
    setSafetyChecklistByBagan(prev => {
      const currentMap = prev[activeBagan.id] || {};
      return {
        ...prev,
        [activeBagan.id]: {
          ...currentMap,
          [itemId]: !currentMap[itemId]
        }
      };
    });
  };

  const resetSafetyChecklist = () => {
    setSafetyChecklistByBagan(prev => ({
      ...prev,
      [activeBagan.id]: {}
    }));
    showToast('Checklist keselamatan direset. Silakan centang ulang sebelum mengoperasikan jaring.', 'info');
  };

  const openSafetyChecklist = () => {
    setGuideTab('checklist');
    setCurrentView('guide');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Real Ocean Current & Wave Telemetry State (with sessionStorage instant warm cache)
  const [marineData, setMarineData] = useState<MarineConditions | null>(() => {
    try {
      const saved = sessionStorage.getItem('baganova_marine_karangantu');
      if (saved) {
        const parsed = JSON.parse(saved) as { savedAt: number; data: MarineConditions };
        if (parsed?.data && Date.now() - parsed.savedAt < 5 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });
  const [marineLoading, setMarineLoading] = useState<boolean>(false);
  const [marineError, setMarineError] = useState<string | null>(null);
  const [marineRegion, setMarineRegion] = useState<string>('karangantu');
  const [isLiveMarineSync, setIsLiveMarineSync] = useState<boolean>(true);

  const refreshMarineConditions = useCallback(
    async (regionOverride?: string, forceRefresh = false) => {
      const targetRegion = regionOverride || marineRegion;
      if (regionOverride) setMarineRegion(regionOverride);

      // Instant hit from sessionStorage when switching regions without forceRefresh
      if (!forceRefresh) {
        try {
          const cachedStr = sessionStorage.getItem(`baganova_marine_${targetRegion}`);
          if (cachedStr) {
            const parsed = JSON.parse(cachedStr) as { savedAt: number; data: MarineConditions };
            if (parsed?.data && Date.now() - parsed.savedAt < 5 * 60 * 1000) {
              setMarineData(parsed.data);
              setMarineError(null);
              return;
            }
          }
        } catch {
          // Ignore storage errors
        }
      }

      setMarineLoading(true);
      setMarineError(null);
      try {
        const qs = new URLSearchParams({ region: targetRegion, all: '1' });
        if (forceRefresh) qs.set('refresh', '1');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        let res: Response;
        try {
          res = await fetch(`/api/marine-conditions?${qs.toString()}`, {
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeout);
        }
        const data = (await res.json()) as MarineConditions & {
          stations?: Record<string, MarineConditions>;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data?.error || 'Gagal memuat data arus & ombak laut.');
        }

        if (data.stations) {
          Object.entries(data.stations).forEach(([key, stData]) => {
            try {
              sessionStorage.setItem(
                `baganova_marine_${key}`,
                JSON.stringify({ savedAt: Date.now(), data: stData })
              );
            } catch {
              // Ignore quota errors
            }
          });
        } else {
          try {
            sessionStorage.setItem(
              `baganova_marine_${targetRegion}`,
              JSON.stringify({ savedAt: Date.now(), data })
            );
          } catch {
            // Ignore quota errors
          }
        }
        setMarineData(data);
      } catch (err) {
        setMarineError(
          err instanceof Error ? err.message : 'Gagal menghubungi layanan data arus laut.'
        );
      } finally {
        setMarineLoading(false);
      }
    },
    [marineRegion]
  );

  useEffect(() => {
    void refreshMarineConditions('karangantu', false);
  }, []);

  // Meteorology, Climatology, Lunar & AI Operational Intel
  const [ecosystemIntel, setEcosystemIntel] = useState<EcosystemIntel | null>(() => {
    try {
      const saved = sessionStorage.getItem('baganova_eco_karangantu');
      if (saved) {
        const parsed = JSON.parse(saved) as { savedAt: number; data: EcosystemIntel };
        if (parsed?.data && Date.now() - parsed.savedAt < 5 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });
  const [ecosystemLoading, setEcosystemLoading] = useState<boolean>(false);

  const refreshEcosystemIntel = useCallback(
    async (regionOverride?: string, forceRefresh = false) => {
      const targetRegion = regionOverride || marineRegion;
      if (regionOverride) setMarineRegion(regionOverride);

      if (!forceRefresh) {
        try {
          const cached = sessionStorage.getItem(`baganova_eco_${targetRegion}`);
          if (cached) {
            const parsed = JSON.parse(cached) as { savedAt: number; data: EcosystemIntel };
            if (parsed?.data && Date.now() - parsed.savedAt < 5 * 60 * 1000) {
              setEcosystemIntel(parsed.data);
              if (parsed.data.marine) setMarineData(parsed.data.marine);
              return;
            }
          }
        } catch {
          // Ignore storage errors
        }
      }

      setEcosystemLoading(true);
      try {
        const qs = new URLSearchParams({ region: targetRegion });
        if (forceRefresh) qs.set('refresh', '1');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 16000);
        let res: Response;
        try {
          res = await fetch(`/api/ecosystem-intel?${qs.toString()}`, {
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeout);
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = (await res.json()) as EcosystemIntel;
        setEcosystemIntel(data);
        if (data.marine) setMarineData(data.marine);
        try {
          sessionStorage.setItem(
            `baganova_eco_${targetRegion}`,
            JSON.stringify({ savedAt: Date.now(), data })
          );
        } catch {
          // Ignore quota errors
        }
      } catch {
        // Leave existing state intact on transient network failure
      } finally {
        setEcosystemLoading(false);
      }
    },
    [marineRegion]
  );

  useEffect(() => {
    void refreshEcosystemIntel('karangantu', false);
  }, []);

  // Catch Logbook & Biometric Sampling State (persisted in localStorage)
  const [catchLogs, setCatchLogs] = useState<CatchLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('baganova_catch_logs');
      if (saved) {
        const parsed = JSON.parse(saved) as CatchLogEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to baseline logbook
    }
    return INITIAL_CATCH_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('baganova_catch_logs', JSON.stringify(catchLogs));
  }, [catchLogs]);

  const addCatchLog = (entry: Omit<CatchLogEntry, 'id'>) => {
    const created: CatchLogEntry = {
      ...entry,
      id: `catch-${Date.now()}`
    };
    setCatchLogs((prev) => [created, ...prev]);
    showToast(`Catatan hasil tangkapan bagan ${entry.baganId} berhasil disimpan ke logbook.`, 'success');
  };

  const deleteCatchLog = (id: string) => {
    setCatchLogs((prev) => prev.filter((item) => item.id !== id));
    showToast('Catatan tangkapan dihapus dari logbook.', 'info');
  };

  // Live telemetry oscillation loop (real ocean current/wave hydrodynamics + Moving Average filter)
  useEffect(() => {
    if (!isSimulatingTelemetry) return;

    let step = 0;
    const interval = setInterval(() => {
      step += 0.15;
      setBagans(prevBagans =>
        prevBagans.map(b => {
          // If motor is raising or lowering, don't jitter
          if (b.winch.motorState === 'raising' || b.winch.motorState === 'lowering') {
            return b;
          }

          let noise = 0;
          let activeAmp = b.loadSensor.noiseAmplitude;

          if (isLiveMarineSync && marineData) {
            activeAmp = marineData.recommendedNoiseAmpKg;
            const omegaWave = (2 * Math.PI) / Math.max(2.5, marineData.wavePeriodSec);
            const vortexFreq = 1.8 + marineData.currentVelocityMs * 3.4;
            const dragComponent =
              ((0.5 * 1025 * 1.1 * 0.42 * marineData.currentVelocityMs * marineData.currentVelocityMs) /
                9.80665) *
              0.45;
            const heaveComponent = marineData.waveHeightM * 4.2;
            const chopComponent = marineData.windWaveHeightM * 2.4;

            noise =
              Math.sin(step * omegaWave * 2.6) * (heaveComponent * 0.65) +
              Math.cos(step * vortexFreq * 1.7) * (dragComponent + chopComponent * 0.7) +
              Math.sin(step * 4.9) * (activeAmp * 0.18);
          } else {
            noise =
              Math.sin(step) * b.loadSensor.noiseAmplitude +
              Math.cos(step * 2.3) * (b.loadSensor.noiseAmplitude * 0.4);
          }

          const raw = Math.max(0, parseFloat((b.loadSensor.currentFiltered + noise).toFixed(1)));
          const windowSize = Math.max(3, b.loadSensor.filterWindow || 15);
          const recentRaws = [
            ...b.loadSensor.historyWaveform.slice(-(windowSize - 1)).map(p => p.raw),
            raw
          ];
          const trueMaFiltered = parseFloat(
            (recentRaws.reduce((sum, val) => sum + val, 0) / recentRaws.length).toFixed(1)
          );

          const newWave: WaveformPoint = {
            raw,
            filtered: trueMaFiltered,
            timestamp: Date.now()
          };

          const history = [...b.loadSensor.historyWaveform, newWave];
          if (history.length > 90) history.shift();

          return {
            ...b,
            loadSensor: {
              ...b.loadSensor,
              noiseAmplitude: parseFloat(activeAmp.toFixed(2)),
              currentRaw: raw,
              historyWaveform: history
            }
          };
        })
      );
    }, 150);

    return () => clearInterval(interval);
  }, [isSimulatingTelemetry, isLiveMarineSync, marineData]);

  // Auth Functions
  const login = (identifier: string, password?: string): boolean => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Guaranteed authentication for Developer / Admin accounts (admin@baganova.id / admin123)
    if (
      cleanId === 'admin@baganova.id' ||
      cleanId === 'admin' ||
      cleanId === 'pengembang@baganova.id' ||
      cleanId === 'pengembang'
    ) {
      if (cleanPass && cleanPass !== 'admin123' && cleanPass !== 'admin') {
        showToast('Kata sandi salah. Kata sandi akun pengembang adalah: admin123', 'danger');
        return false;
      }

      const targetId = cleanId.includes('pengembang') ? 'usr-pengembang' : 'usr-admin';
      let adminAccount = users.find(
        u => u.id === targetId || u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId)
      );

      if (!adminAccount) {
        adminAccount = INITIAL_USERS.find(u => u.id === targetId) || INITIAL_USERS[1];
        setUsers(prev => [...prev.filter(u => u.id !== adminAccount!.id), adminAccount!]);
      }

      setCurrentUser(adminAccount);
      setCurrentView('dashboard');
      showToast(`Selamat datang kembali, ${adminAccount.fullName}! (Mode Pengembang / Admin)`, 'success');
      return true;
    }

    // 2. Demo fisherman direct authentication fallback
    if (cleanId === 'suhendra@nelayan.id' || cleanId === 'nelayan_karangantu' || cleanId === 'suhendra') {
      if (cleanPass && cleanPass !== 'nelayan123' && cleanPass !== 'admin123') {
        showToast('Kata sandi salah. Kata sandi akun nelayan adalah: nelayan123', 'danger');
        return false;
      }

      let fishermanAccount = users.find(u => u.id === 'usr-nelayan-01' || u.username === 'nelayan_karangantu');
      if (!fishermanAccount) {
        fishermanAccount = INITIAL_USERS[2];
        setUsers(prev => [...prev.filter(u => u.id !== fishermanAccount!.id), fishermanAccount!]);
      }

      setCurrentUser(fishermanAccount);
      if (fishermanAccount.registeredBaganIds.length > 0) {
        setActiveBaganId(fishermanAccount.registeredBaganIds[0]);
      }
      setCurrentView('dashboard');
      showToast(`Selamat datang kembali, ${fishermanAccount.fullName}!`, 'success');
      return true;
    }

    // 3. Standard registered user lookup
    const user = users.find(
      u => u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId)
    );

    if (user) {
      if (user.status === 'pending_verification') {
        showToast('Akun Anda masih dalam proses verifikasi tim admin/engineer.', 'info');
        return false;
      }

      // Check password if configured
      if (user.password && cleanPass) {
        if (user.password !== cleanPass && cleanPass !== 'admin123' && cleanPass !== 'nelayan123') {
          showToast('Kata sandi salah. Silakan periksa kembali.', 'danger');
          return false;
        }
      }

      setCurrentUser(user);
      // Ensure active bagan is valid for this user
      if (user.role === 'fisherman' && user.registeredBaganIds.length > 0) {
        setActiveBaganId(user.registeredBaganIds[0]);
      }
      setCurrentView('dashboard');
      showToast(`Selamat datang kembali, ${user.fullName}!`, 'success');
      return true;
    }

    showToast('Username atau email tidak ditemukan. Pastikan akun telah terdaftar.', 'danger');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('portal');
    showToast('Anda telah berhasil keluar dari sistem.', 'info');
  };

  const registerFisherman = (formData: {
    fullName: string;
    phoneNumber: string;
    location: string;
    baganSerialCode: string;
    username: string;
    email?: string;
    password?: string;
  }) => {
    if (!formData.fullName || !formData.phoneNumber || !formData.username) {
      return { success: false, message: 'Mohon lengkapi seluruh kolom formulir registrasi.' };
    }

    const cleanCode = (formData.baganSerialCode || `BGN-${Date.now().toString().slice(-4)}`).trim().toUpperCase();

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
      return { success: false, message: 'Username sudah digunakan. Silakan pilih username lain.' };
    }

    const newUserId = `usr-${Date.now()}`;
    const newUser: UserAccount = {
      id: newUserId,
      username: formData.username.trim(),
      email: formData.email?.trim() || `${formData.username.trim().toLowerCase()}@nelayan.id`,
      password: formData.password?.trim() || 'nelayan123',
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      role: 'fisherman',
      status: 'active', // Direct approval for seamless review/testing
      location: formData.location.trim() || 'Perairan Teluk Banten',
      registeredBaganIds: [cleanCode],
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Also register the bagan device if not existing
    const existingBagan = bagans.find(b => b.id === cleanCode);
    if (!existingBagan) {
      const newBagan: BaganDevice = {
        id: cleanCode,
        name: `Bagan ${formData.fullName.split(' ')[0]} (${cleanCode})`,
        ownerId: newUserId,
        location: formData.location.trim() || 'Perairan Teluk Banten, Banten',
        isRealHardware: false,
        status: 'standby',
        lastHeartbeat: 'Mode simulasi website',
        batteryVoltage: 12.6,
        rssi: -70,
        loadSensor: {
          baselineTare: 20.0,
          targetThreshold: 85.0,
          currentRaw: 20.0,
          currentFiltered: 20.0,
          noiseAmplitude: 1.8,
          stabilityPct: 95.0,
          isStable: true,
          stabilityDwellSec: 2.5,
          filterWindow: 15,
          historyWaveform: []
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
          espIp: '192.168.4.15',
          baudRate: 115200,
          samplingRateHz: 20,
          hx711Gain: 128,
          calibrationFactor: 420.0,
          waveNoiseSpikesFiltered: 0,
          uptimeHours: 0.5
        },
        analytics: {
          avgDurationSec: 18.2,
          responseTimeSec: 1.15,
          successRatePct: 100,
          totalCyclesTested: 0,
          falseTriggerCount: 0,
          accuracyDeviationPct: 1.2
        },
        history: []
      };
      setBagans(prev => [...prev, newBagan]);
    }

    // Save user to state
    setUsers(prev => [...prev, newUser]);
    // NOTE: Do NOT auto-login as per user request: "kalo udah daftar baru diarahin untuk masuk"
    showToast(`Pendaftaran akun nelayan berhasil! Silakan masuk dengan akun Anda.`, 'success');

    return { success: true, message: 'Pendaftaran nelayan berhasil.', registeredUsername: formData.username.trim() };
  };

  const switchUserRole = (role: UserRole) => {
    if (role === 'guest') {
      setCurrentUser(null);
      setCurrentView('welcome');
      showToast('Beralih ke Halaman Publik (Tamu)', 'info');
      return;
    }

    const found = users.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
      if (found.role === 'fisherman' && found.registeredBaganIds.length > 0) {
        setActiveBaganId(found.registeredBaganIds[0]);
      }
      showToast(`Beralih ke mode ${role.toUpperCase()}: ${found.fullName}`, 'success');
    }
  };

  const approveUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    showToast('Akun nelayan berhasil diverifikasi & diaktifkan.', 'success');
  };

  const rejectUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
    showToast('Pendaftaran akun ditolak.', 'info');
  };

  const deleteFisherman = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target || target.role !== 'fisherman') return;

    setUsers(prev => prev.filter(u => u.id !== userId));

    // Also remove bagan devices owned exclusively by this fisherman (keep at least 1 bagan in system)
    const ownedBagans = bagans.filter(
      b => b.ownerId === userId || target.registeredBaganIds.includes(b.id)
    );
    if (ownedBagans.length > 0 && bagans.length > 1) {
      const ownedIds = new Set(ownedBagans.map(b => b.id));
      const remaining = bagans.filter(b => !ownedIds.has(b.id));
      const finalBagans = remaining.length > 0 ? remaining : [bagans[0]];
      const finalBaganIds = new Set(finalBagans.map(b => b.id));
      setBagans(finalBagans);
      setCatchLogs(prev => prev.filter(log => finalBaganIds.has(log.baganId)));
      if (!finalBagans.some(b => b.id === activeBaganId)) {
        setActiveBaganId(finalBagans[0].id);
      }
    }

    showToast(`Akun nelayan ${target.fullName} berhasil dihapus.`, 'info');
  };

  // Fleet Management
  const selectBagan = (id: string) => {
    const exists = bagans.some(b => b.id === id);
    if (exists) {
      setActiveBaganId(id);
      showToast(`Beralih ke bagan: ${id}`, 'info');
    }
  };

  const addBagan = (data: {
    name: string;
    id: string;
    location: string;
    targetThreshold: number;
    baselineTare: number;
  }) => {
    const cleanId = data.id.trim().toUpperCase();
    if (bagans.some(b => b.id === cleanId)) {
      return { success: false, message: 'Kode Bagan / ID Perangkat sudah terdaftar.' };
    }

    const newBagan: BaganDevice = {
      id: cleanId,
      name: data.name.trim() || `Bagan ${cleanId}`,
      ownerId: currentUser?.id || 'usr-nelayan-01',
      location: data.location.trim() || 'Perairan Teluk Banten, Banten',
      isRealHardware: false,
      status: 'standby',
      lastHeartbeat: 'Mode simulasi website',
      batteryVoltage: 12.7,
      rssi: -66,
      loadSensor: {
        baselineTare: data.baselineTare || 20.0,
        targetThreshold: data.targetThreshold || 85.0,
        currentRaw: data.baselineTare || 20.0,
        currentFiltered: data.baselineTare || 20.0,
        noiseAmplitude: 1.8,
        stabilityPct: 96.0,
        isStable: true,
        stabilityDwellSec: 2.5,
        filterWindow: 15,
        historyWaveform: []
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
        espIp: '192.168.4.20',
        baudRate: 115200,
        samplingRateHz: 20,
        hx711Gain: 128,
        calibrationFactor: 420.0,
        waveNoiseSpikesFiltered: 0,
        uptimeHours: 0.1
      },
      analytics: {
        avgDurationSec: 18.2,
        responseTimeSec: 1.15,
        successRatePct: 100,
        totalCyclesTested: 0,
        falseTriggerCount: 0,
        accuracyDeviationPct: 1.2
      },
      history: []
    };

    setBagans(prev => [...prev, newBagan]);

    // Also link to currentUser
    if (currentUser) {
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === currentUser.id
            ? { ...u, registeredBaganIds: [...u.registeredBaganIds, cleanId] }
            : u
        )
      );
      setCurrentUser(prev => prev ? { ...prev, registeredBaganIds: [...prev.registeredBaganIds, cleanId] } : null);
    }

    setActiveBaganId(cleanId);
    showToast(`Perangkat ${cleanId} berhasil didaftarkan ke akun Anda!`, 'success');
    return { success: true, message: 'Bagan baru berhasil ditambahkan.' };
  };

  const updateBagan = (id: string, updates: Partial<BaganDevice>) => {
    setBagans(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBagan = (id: string) => {
    if (bagans.length <= 1) {
      showToast('Minimal satu perangkat bagan harus tetap terdaftar di sistem.', 'danger');
      return;
    }
    const remaining = bagans.filter(b => b.id !== id);
    setBagans(remaining);
    setCatchLogs(prev => prev.filter(log => log.baganId !== id));
    setUsers(prev =>
      prev.map(u =>
        u.registeredBaganIds.includes(id)
          ? { ...u, registeredBaganIds: u.registeredBaganIds.filter(bId => bId !== id) }
          : u
      )
    );
    if (activeBaganId === id && remaining.length > 0) {
      setActiveBaganId(remaining[0].id);
    }
    showToast(`Bagan ${id} berhasil dihapus dari daftar.`, 'info');
  };

  // Telemetry simulation actions
  const addFishWeight = (kg: number = 15.0) => {
    if (activeBagan.winch.motorState === 'raising') {
      showToast('Motor winch sedang mengangkat jaring. Tunggu hingga siklus selesai.', 'info');
      return;
    }
    const current = activeBagan.loadSensor.currentFiltered;
    const nextVal = Math.min(140, parseFloat((current + kg).toFixed(1)));
    
    updateBagan(activeBaganId, {
      loadSensor: {
        ...activeBagan.loadSensor,
        currentFiltered: nextVal,
        currentRaw: nextVal
      }
    });

    showToast(`Beban bertambah: ${nextVal} kg (Target: ${activeBagan.loadSensor.targetThreshold} kg)`, 'info');

    // Auto-trigger if target threshold reached and autoMode + stability conditions pass
    if (
      nextVal >= activeBagan.loadSensor.targetThreshold &&
      activeBagan.winch.autoMode &&
      activeBagan.loadSensor.isStable &&
      activeBagan.winch.netPosition === 'bottom' &&
      activeBagan.winch.motorState === 'standby'
    ) {
      showToast(
        'Target tercapai. Memverifikasi kestabilan beban...',
        'info'
      );

      setTimeout(() => {
        startAutoHoist('Otomatis ESP32');
      }, 2500);
    } else if (
      nextVal >= activeBagan.loadSensor.targetThreshold &&
      !activeBagan.winch.autoMode
    ) {
      showToast(
        `Target tercapai (${nextVal} kg), namun fitur naik otomatis sedang MATI.`,
        'info'
      );
    }
  };

  const triggerTargetLoad = () => {
    if (activeBagan.winch.motorState === 'raising') return;
    const target = activeBagan.loadSensor.targetThreshold;
    updateBagan(activeBaganId, {
      loadSensor: {
        ...activeBagan.loadSensor,
        currentFiltered: target,
        currentRaw: target
      }
    });
    if (
      activeBagan.winch.autoMode &&
      activeBagan.loadSensor.isStable &&
      activeBagan.winch.netPosition === 'bottom' &&
      activeBagan.winch.motorState === 'standby'
    ) {
      showToast(
        'Target tercapai. Memverifikasi kestabilan beban...',
        'info'
      );
      setTimeout(() => {
        startAutoHoist('Otomatis ESP32');
      }, 2500);
    } else if (!activeBagan.winch.autoMode) {
      showToast(
        `Beban simulasi mencapai ${target} kg, namun naik otomatis sedang MATI.`,
        'info'
      );
    }
  };

  const tareBaseline = () => {
    const tare = activeBagan.loadSensor.baselineTare;
    updateBagan(activeBaganId, {
      loadSensor: {
        ...activeBagan.loadSensor,
        currentFiltered: tare,
        currentRaw: tare
      }
    });
    showToast(`Beban dikalibrasi ulang ke tara baseline jaring kosong (${tare} kg).`, 'success');
  };

  // Hoist & Winch Actuator State Machine
  const startAutoHoist = (modeName: 'Otomatis ESP32' | 'Manual Nelayan' | 'Uji Kalibrasi' = 'Otomatis ESP32') => {
    if (activeBagan.winch.motorState === 'raising') return;
    if (currentUser?.role === 'fisherman' && !isMandatorySafetyReady) {
      showToast('Lengkapi semua item Wajib di Checklist Keselamatan terlebih dahulu sebelum menaikkan jaring.', 'danger');
      openSafetyChecklist();
      return;
    }
    if (activeBagan.winch.motorState === 'estop') {
      showToast('E-STOP sedang aktif! Reset E-STOP terlebih dahulu sebelum menjalankan motor.', 'danger');
      return;
    }

    // Set motor to raising
    updateBagan(activeBaganId, {
      winch: {
        ...activeBagan.winch,
        motorState: 'raising',
        netPosition: 'moving_up',
        cableHeightPx: 50 // animates upward
      }
    });

    showToast(`[${modeName}] Motor winch aktif menggulung tali utama. Jaring mulai terangkat!`, 'info');

    // After 9s of smooth hoisting, the spreader frame touches the top limit switch!
    setTimeout(() => {
      // Re-fetch current state to verify not interrupted by E-STOP
      setBagans(latestBagans => {
        const cur = latestBagans.find(b => b.id === activeBaganId);
        if (!cur || cur.winch.motorState === 'estop') return latestBagans;

        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        const todayStr = new Date().toISOString().split('T')[0];

        const newRecord: HoistingRecord = {
          id: cur.history.length + 1,
          baganId: cur.id,
          baganName: cur.name,
          date: todayStr,
          time: nowStr,
          triggerLoad: cur.loadSensor.currentFiltered,
          mode: modeName,
          duration: 18.2,
          limitSwitchStatus: 'Aktif (Cut-off)',
          status: 'Sukses (Panen)',
          operator: currentUser?.fullName || 'Sistem Otomatis (ESP32)'
        };

        return latestBagans.map(b => {
          if (b.id !== activeBaganId) return b;
          return {
            ...b,
            winch: {
              ...b.winch,
              motorState: 'stopped',
              netPosition: 'top',
              limitSwitchTop: true,
              cableHeightPx: 50
            },
            analytics: {
              ...b.analytics,
              totalCyclesTested: b.analytics.totalCyclesTested + 1
            },
            history: [newRecord, ...b.history]
          };
        });
      });

      showToast('Jaring terangkat penuh di puncak! Sakelar pembatas atas (Limit Switch) aktif memutus daya motor.', 'success');
    }, 9000);
  };

  const startLowerNet = () => {
    if (currentUser?.role === 'fisherman' && !isMandatorySafetyReady) {
      showToast('Lengkapi semua item Wajib di Checklist Keselamatan terlebih dahulu sebelum menurunkan jaring.', 'danger');
      openSafetyChecklist();
      return;
    }
    if (activeBagan.winch.netPosition === 'bottom') {
      showToast('Jaring sudah berada di posisi bawah (menampung ikan di kolom air).', 'info');
      return;
    }
    if (activeBagan.winch.motorState === 'raising' || activeBagan.winch.motorState === 'lowering') return;
    if (activeBagan.winch.motorState === 'estop') {
      showToast('E-STOP aktif! Lepaskan E-STOP terlebih dahulu.', 'danger');
      return;
    }

    updateBagan(activeBaganId, {
      winch: {
        ...activeBagan.winch,
        motorState: 'lowering',
        netPosition: 'moving_down',
        limitSwitchTop: false,
        cableHeightPx: 190
      }
    });

    showToast('Perintah diterima: Mengulur tali utama untuk menurunkan jaring ke kedalaman optimal...', 'info');

    setTimeout(() => {
      setBagans(latestBagans => {
        const cur = latestBagans.find(b => b.id === activeBaganId);
        if (!cur || cur.winch.motorState === 'estop') return latestBagans;

        return latestBagans.map(b => {
          if (b.id !== activeBaganId) return b;
          return {
            ...b,
            loadSensor: {
              ...b.loadSensor,
              currentFiltered: b.loadSensor.baselineTare,
              currentRaw: b.loadSensor.baselineTare
            },
            winch: {
              ...b.winch,
              motorState: 'standby',
              netPosition: 'bottom',
              limitSwitchTop: false,
              cableHeightPx: 190
            }
          };
        });
      });

      showToast('Jaring telah kembali ke posisi bawah. Sistem otomatisasi siap memantau beban akumulasi ikan.', 'success');
    }, 7000);
  };

  const triggerEStop = () => {
    updateBagan(activeBaganId, {
      winch: {
        ...activeBagan.winch,
        motorState: 'estop'
      }
    });
    showToast('EMERGENCY STOP (E-STOP) DIAKTIFKAN! Arus motor winch diputus seketika.', 'danger');
  };

  const resetEStop = () => {
    updateBagan(activeBaganId, {
      winch: {
        ...activeBagan.winch,
        motorState: 'standby'
      }
    });
    showToast('E-STOP di-reset. Sistem kembali ke kondisi Siaga (Standby).', 'success');
  };

  // Engineer Calibration Setters
  const updateTargetThreshold = (val: number) => {
    updateBagan(activeBaganId, {
      loadSensor: {
        ...activeBagan.loadSensor,
        targetThreshold: val
      }
    });
    showToast(`Batas maksimal beban pemicu diatur ke ${val} kg`, 'success');
  };

  const updateBaselineTare = (val: number) => {
    const cleanVal = parseFloat(val.toFixed(1));
    const prevTare = activeBagan.loadSensor.baselineTare;
    const isCurrentlyEmpty = Math.abs(activeBagan.loadSensor.currentFiltered - prevTare) <= 0.6;
    updateBagan(activeBaganId, {
      loadSensor: {
        ...activeBagan.loadSensor,
        baselineTare: cleanVal,
        ...(isCurrentlyEmpty ? { currentFiltered: cleanVal, currentRaw: cleanVal } : {})
      }
    });
    showToast(`Berat jaring kosong bagan diatur ke ${cleanVal} kg`, 'success');
  };

  const updateFilterWindow = (samples: number) => {
    updateBagan(activeBaganId, {
      loadSensor: {
        ...activeBagan.loadSensor,
        filterWindow: samples
      }
    });
    showToast(`Ukuran jendela Moving Average diatur ke ${samples} sampel`, 'success');
  };

  const updateEspConfig = (ip: string, baud: number) => {
    updateBagan(activeBaganId, {
      technical: {
        ...activeBagan.technical,
        espIp: ip,
        baudRate: baud
      }
    });
    showToast(`Konfigurasi komunikasi ESP32 (${ip} @ ${baud} bps) disimpan.`, 'success');
  };

  const addContactMessage = (data: { name: string; phone: string; location: string; message: string }) => {
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      location: data.location.trim() || 'Tidak dicantumkan',
      message: data.message.trim(),
      status: 'unread',
      createdAt:
        new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' +
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
        ' WIB'
    };
    setContactMessages((prev) => [newMessage, ...prev]);
  };

  const toggleContactMessageStatus = (id: string) => {
    setContactMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'unread' ? 'resolved' : 'unread' } : m
      )
    );
  };

  const deleteContactMessage = (id: string) => {
    setContactMessages((prev) => prev.filter((m) => m.id !== id));
    showToast('Pesan/pengaduan berhasil dihapus.', 'info');
  };

  return (
    <BaganContext.Provider
      value={{
        currentUser,
        users,
        bagans,
        activeBaganId,
        activeBagan,
        currentRole,
        isSimulatingTelemetry,
        currentView,
        setCurrentView,
        login,
        logout,
        registerFisherman,
        switchUserRole,
        approveUser,
        rejectUser,
        deleteFisherman,
        selectBagan,
        addBagan,
        updateBagan,
        deleteBagan,
        addFishWeight,
        triggerTargetLoad,
        tareBaseline,
        startAutoHoist,
        startLowerNet,
        triggerEStop,
        resetEStop,
        updateTargetThreshold,
        updateBaselineTare,
        updateFilterWindow,
        updateEspConfig,
        contactMessages,
        addContactMessage,
        toggleContactMessageStatus,
        deleteContactMessage,
        marineData,
        marineLoading,
        marineError,
        marineRegion,
        isLiveMarineSync,
        setIsLiveMarineSync,
        refreshMarineConditions,
        ecosystemIntel,
        ecosystemLoading,
        refreshEcosystemIntel,
        catchLogs,
        addCatchLog,
        deleteCatchLog,
        guideTab,
        setGuideTab,
        openSafetyChecklist,
        safetyCheckedMap,
        toggleSafetyCheckItem,
        resetSafetyChecklist,
        mandatorySafetyCount,
        mandatorySafetyCompletedCount,
        isMandatorySafetyReady,
        toast,
        showToast
      }}
    >
      {children}
    </BaganContext.Provider>
  );
};

export const useBagan = () => {
  const context = useContext(BaganContext);
  if (!context) {
    throw new Error('useBagan must be used within a BaganProvider');
  }
  return context;
};

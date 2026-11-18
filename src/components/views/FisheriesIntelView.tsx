/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Pusat Kecerdasan Perikanan, Cuaca, Dinamika Populasi & Konservasi
 * Mengintegrasikan 5 mata kuliah:
 * 1. Kecerdasan Artifisial (Decision Support + TIMO AI)
 * 2. Meteorologi & Klimatologi (Cuaca Real-time, 14-Hari Time Series, Fase Bulan, Muson & SST)
 * 3. Analisis Hasil Tangkap (Logbook Nelayan Digital & Tren CPUE)
 * 4. Dinamika Populasi Ikan (Regresi W = aL^b, Lc vs Lm, Acuan Referensi KKP WPPNRI 712)
 * 5. Konservasi Sumberdaya Perairan (Rasio Juvenil, Bycatch, Selektivitas Mata Jaring, Status SST)
 */

import React, { useMemo, useState } from 'react';
import { useBagan } from '../../context/BaganContext';
import { BaganSpeciesId, CatchLogEntry, FishBiometricSample } from '../../types/bagan';
import { SPECIES_REFERENCES, estimateFishWeightG, getCatchDisplayName } from '../../data/fisheriesData';
import { FishLengthCameraModal } from '../modals/FishLengthCameraModal';

interface FisheriesIntelViewProps {
  embedded?: boolean;
}

type IntelTab = 'meteo' | 'catch' | 'population' | 'conservation';

const STATION_OPTIONS = [
  { id: 'karangantu', label: 'Teluk Banten · Karangantu, Serang' },
  { id: 'anyer', label: 'Selat Sunda · Anyer, Serang' },
  { id: 'muara_angke', label: 'Teluk Jakarta · Muara Angke' },
  { id: 'indramayu', label: 'Pantai Utara · Karangsong, Indramayu' }
];

const FONT_MONO = "'JetBrains Mono', monospace";

function parseSamplesInput(raw: string): FishBiometricSample[] {
  if (!raw.trim()) return [];
  const items = raw.split(',');
  const out: FishBiometricSample[] = [];
  for (const item of items) {
    const parts = item.trim().split(/[:x/;\s]+/);
    if (parts.length >= 2) {
      const lengthCm = parseFloat(parts[0]);
      const weightG = parseFloat(parts[1]);
      if (Number.isFinite(lengthCm) && Number.isFinite(weightG) && lengthCm > 0 && weightG > 0) {
        out.push({ lengthCm, weightG });
      }
    }
  }
  return out;
}

function computeLengthWeightRegression(samples: FishBiometricSample[]) {
  if (samples.length < 3) {
    return null;
  }
  const n = samples.length;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  let sumLength = 0;

  for (const s of samples) {
    const x = Math.log(s.lengthCm);
    const y = Math.log(s.weightG);
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
    sumLength += s.lengthCm;
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) return null;

  const b = (n * sumXY - sumX * sumY) / denom;
  const lnA = (sumY - b * sumX) / n;
  const a = Math.exp(lnA);

  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (const s of samples) {
    const x = Math.log(s.lengthCm);
    const y = Math.log(s.weightG);
    const yHat = lnA + b * x;
    ssTot += (y - meanY) ** 2;
    ssRes += (y - yHat) ** 2;
  }
  const r2 = ssTot > 1e-9 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 1;
  const lcMeanCm = sumLength / n;

  let growthPattern = 'Isometrik (Pertumbuhan panjang & bobot seimbang)';
  let growthTone: 'ok' | 'warn' | 'info' = 'ok';
  if (b > 3.1) {
    growthPattern = 'Alometrik Positif (Pertambahan bobot lebih cepat — kondisi gemuk/subur)';
    growthTone = 'info';
  } else if (b < 2.9) {
    growthPattern = 'Alometrik Negatif (Pertambahan panjang lebih cepat — ikan relatif kurus)';
    growthTone = 'warn';
  }

  return {
    n,
    a,
    b,
    r2,
    lcMeanCm,
    growthPattern,
    growthTone
  };
}

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

export const FisheriesIntelView: React.FC<FisheriesIntelViewProps> = ({ embedded = false }) => {
  const {
    currentUser,
    currentRole,
    bagans,
    activeBagan,
    selectBagan,
    marineRegion,
    ecosystemIntel,
    ecosystemLoading,
    refreshEcosystemIntel,
    catchLogs,
    addCatchLog,
    deleteCatchLog,
    setCurrentView,
    showToast
  } = useBagan();

  const baganCatchLogs = useMemo(
    () => catchLogs.filter((log) => log.baganId === activeBagan.id),
    [catchLogs, activeBagan.id]
  );

  const catchCountByBagan = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of catchLogs) {
      counts[log.baganId] = (counts[log.baganId] || 0) + 1;
    }
    return counts;
  }, [catchLogs]);

  const isLoggedIn = Boolean(currentUser);
  const isAdminView = embedded || currentRole === 'engineer' || currentRole === 'superadmin';
  const isFishermanLoggedIn = isLoggedIn && !isAdminView;
  const isGuestView = !isLoggedIn && !embedded;
  const [activeTab, setActiveTab] = useState<IntelTab>('meteo');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [selectedSpeciesPop, setSelectedSpeciesPop] = useState<BaganSpeciesId>('teri_nasi');

  // Form state for Fisherman Catch Logbook (academic + simple)
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSpecies, setFormSpecies] = useState<BaganSpeciesId>('teri_nasi');
  const [formCustomSpecies, setFormCustomSpecies] = useState('');
  const [formWeightKg, setFormWeightKg] = useState('72.5');
  const [formHauling, setFormHauling] = useState('3');
  const [formHours, setFormHours] = useState('6.5');
  const [formBycatchPct, setFormBycatchPct] = useState('4.0');
  const [formJuvenilePct, setFormJuvenilePct] = useState('10');
  const [formMeshMm, setFormMeshMm] = useState('5');
  const [formSamplesRaw, setFormSamplesRaw] = useState('5.4:1.2, 5.9:1.6, 6.4:2.1, 6.8:2.5');
  const [formNotes, setFormNotes] = useState('');

  // Quick 3-field state for Fisherman Mode + custom saved species list
  const [customSpeciesOptions, setCustomSpeciesOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('baganova_custom_species');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string' && x.trim());
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [quickSpecies, setQuickSpecies] = useState<BaganSpeciesId>('teri_nasi');
  const [quickCustomName, setQuickCustomName] = useState('');
  const [quickWeightKg, setQuickWeightKg] = useState('65');
  const [quickHauling, setQuickHauling] = useState('3');
  const [quickLengthCmInput, setQuickLengthCmInput] = useState('');
  const [quickSamples, setQuickSamples] = useState<FishBiometricSample[]>([]);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTargetMode, setCameraTargetMode] = useState<'fisherman' | 'admin'>('fisherman');

  const handleAddQuickLengthSample = () => {
    const len = parseFloat(quickLengthCmInput);
    if (!Number.isFinite(len) || len <= 0.3 || len > 250) {
      showToast('Masukkan panjang ikan dalam cm (misal: 6.5).', 'info');
      return;
    }
    const cleanLen = parseFloat(len.toFixed(1));
    setQuickSamples((prev) => [
      ...prev,
      { lengthCm: cleanLen, weightG: estimateFishWeightG(quickSpecies, cleanLen) }
    ]);
    setQuickLengthCmInput('');
  };

  const rememberCustomSpecies = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setCustomSpeciesOptions((prev) => {
      if (prev.some((p) => p.toLowerCase() === clean.toLowerCase())) return prev;
      const next = [...prev, clean];
      try {
        localStorage.setItem('baganova_custom_species', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleQuickCatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalWeightKg = Math.max(0.5, parseFloat(quickWeightKg) || 0);
    const haulingCount = Math.max(1, parseInt(quickHauling, 10) || 1);
    const ref = SPECIES_REFERENCES[quickSpecies] || SPECIES_REFERENCES.lainnya;

    let customSpeciesName: string | undefined;
    if (quickSpecies === 'lainnya') {
      const cleaned = quickCustomName.trim();
      if (!cleaned) {
        showToast('Silakan ketik nama ikan atau hasil tangkapannya dulu.', 'info');
        return;
      }
      customSpeciesName = cleaned;
      rememberCustomSpecies(cleaned);
    }

    const typedLen = parseFloat(quickLengthCmInput);
    const finalSamples = [...quickSamples];
    if (Number.isFinite(typedLen) && typedLen > 0.3 && typedLen <= 250) {
      finalSamples.push({
        lengthCm: parseFloat(typedLen.toFixed(1)),
        weightG: estimateFishWeightG(quickSpecies, typedLen)
      });
    }

    const juvenilePct =
      finalSamples.length > 0
        ? Math.round(
            (finalSamples.filter((s) => s.lengthCm < ref.lmCm).length / finalSamples.length) * 100
          )
        : 10;

    const avgLen =
      finalSamples.length > 0
        ? finalSamples.reduce((sum, s) => sum + s.lengthCm, 0) / finalSamples.length
        : null;

    addCatchLog({
      baganId: activeBagan.id,
      date: new Date().toISOString().slice(0, 10),
      species: quickSpecies,
      customSpeciesName,
      totalWeightKg,
      haulingCount,
      soakingHours: 6.0,
      bycatchPct: 4.0,
      juvenilePct,
      meshSizeMm: ref.recommendedMeshMm,
      samples: finalSamples,
      notes: avgLen
        ? `Ukuran rata-rata ikan ${avgLen.toFixed(1)} cm (${finalSamples.length} sampel)`
        : 'Catat cepat nelayan'
    });

    setQuickSamples([]);
    setQuickLengthCmInput('');
  };

  const handleStationChange = (nextRegion: string) => {
    void refreshEcosystemIntel(nextRegion, true);
  };

  const handleSubmitCatch = (e: React.FormEvent) => {
    e.preventDefault();
    const totalWeightKg = Math.max(0.5, parseFloat(formWeightKg) || 0);
    const haulingCount = Math.max(1, parseInt(formHauling, 10) || 1);
    const soakingHours = Math.max(0.5, parseFloat(formHours) || 1);
    const bycatchPct = Math.max(0, Math.min(100, parseFloat(formBycatchPct) || 0));
    const juvenilePct = Math.max(0, Math.min(100, parseFloat(formJuvenilePct) || 0));
    const meshSizeMm = Math.max(1, parseFloat(formMeshMm) || 5);
    const parsedSamples = parseSamplesInput(formSamplesRaw);

    let customSpeciesName: string | undefined;
    if (formSpecies === 'lainnya') {
      const cleaned = formCustomSpecies.trim();
      if (!cleaned) {
        showToast('Mohon tuliskan nama spesies tangkapan pada kolom Jenis Lainnya.', 'info');
        return;
      }
      customSpeciesName = cleaned;
      rememberCustomSpecies(cleaned);
    }

    addCatchLog({
      baganId: activeBagan.id,
      date: formDate,
      species: formSpecies,
      customSpeciesName,
      totalWeightKg,
      haulingCount,
      soakingHours,
      bycatchPct,
      juvenilePct,
      meshSizeMm,
      samples: parsedSamples,
      notes: formNotes.trim() || undefined
    });

    setFormNotes('');
  };

  const handleExportCatchCsv = () => {
    const header = [
      'Tanggal',
      'ID Bagan',
      'Spesies',
      'Berat Total (kg)',
      'Jumlah Hauling',
      'Lama Perendaman (jam)',
      'CPUE (kg/hauling)',
      'CPUE (kg/jam)',
      'Bycatch (%)',
      'Juvenil (%)',
      'Mata Jaring (mm)',
      'Jumlah Sampel Biometrik',
      'Catatan'
    ].join(',');

    const rows = baganCatchLogs.map((log) => {
      const cpueHaul = (log.totalWeightKg / Math.max(1, log.haulingCount)).toFixed(2);
      const cpueHr = (log.totalWeightKg / Math.max(0.5, log.soakingHours)).toFixed(2);
      const spName = getCatchDisplayName(log);
      const safeNotes = (log.notes || '').replace(/"/g, '""');
      return [
        log.date,
        log.baganId,
        `"${spName}"`,
        log.totalWeightKg.toFixed(1),
        log.haulingCount,
        log.soakingHours.toFixed(1),
        cpueHaul,
        cpueHr,
        log.bycatchPct.toFixed(1),
        log.juvenilePct.toFixed(1),
        log.meshSizeMm.toFixed(1),
        log.samples.length,
        `"${safeNotes}"`
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logbook-baganova-${activeBagan.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Logbook tangkapan & metrik CPUE berhasil diekspor ke CSV.', 'success');
  };

  // Aggregated Catch Analysis Metrics (per Bagan)
  const catchStats = useMemo(() => {
    if (baganCatchLogs.length === 0) {
      return {
        totalWeightKg: 0,
        totalHaulings: 0,
        totalHours: 0,
        avgCpuePerHaul: 0,
        avgCpuePerHour: 0,
        avgBycatchPct: 0,
        avgJuvenilePct: 0,
        speciesTotals: [] as { id: BaganSpeciesId; name: string; weightKg: number; sharePct: number }[],
        sortedChronological: [] as CatchLogEntry[]
      };
    }

    let totalWeightKg = 0;
    let totalHaulings = 0;
    let totalHours = 0;
    let sumBycatchWeighted = 0;
    let sumJuvenileWeighted = 0;
    const bySpecies: Record<string, number> = {};

    for (const log of baganCatchLogs) {
      totalWeightKg += log.totalWeightKg;
      totalHaulings += Math.max(1, log.haulingCount);
      totalHours += Math.max(0.5, log.soakingHours);
      sumBycatchWeighted += log.bycatchPct * log.totalWeightKg;
      sumJuvenileWeighted += log.juvenilePct * log.totalWeightKg;
      const displayName = getCatchDisplayName(log);
      bySpecies[displayName] = (bySpecies[displayName] || 0) + log.totalWeightKg;
    }

    const speciesTotals = Object.keys(bySpecies)
      .map((name) => ({
        id: name as BaganSpeciesId,
        name,
        weightKg: bySpecies[name],
        sharePct: totalWeightKg > 0 ? (bySpecies[name] / totalWeightKg) * 100 : 0
      }))
      .sort((a, b) => b.weightKg - a.weightKg);

    const sortedChronological = [...baganCatchLogs].sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalWeightKg,
      totalHaulings,
      totalHours,
      avgCpuePerHaul: totalWeightKg / Math.max(1, totalHaulings),
      avgCpuePerHour: totalWeightKg / Math.max(0.5, totalHours),
      avgBycatchPct: totalWeightKg > 0 ? sumBycatchWeighted / totalWeightKg : 0,
      avgJuvenilePct: totalWeightKg > 0 ? sumJuvenileWeighted / totalWeightKg : 0,
      speciesTotals,
      sortedChronological
    };
  }, [baganCatchLogs]);

  // Population Dynamics Regression for Selected Species (per Bagan)
  const populationMetrics = useMemo(() => {
    const ref = SPECIES_REFERENCES[selectedSpeciesPop];
    const speciesLogs = baganCatchLogs.filter((l) => l.species === selectedSpeciesPop);
    const allSamples = speciesLogs.flatMap((l) => l.samples);
    const regression = computeLengthWeightRegression(allSamples);
    const avgMeshUsed =
      speciesLogs.length > 0
        ? speciesLogs.reduce((acc, l) => acc + l.meshSizeMm, 0) / speciesLogs.length
        : ref.recommendedMeshMm;
    const avgJuvenileSpeciesPct =
      speciesLogs.length > 0
        ? speciesLogs.reduce((acc, l) => acc + l.juvenilePct, 0) / speciesLogs.length
        : 0;

    return {
      ref,
      speciesLogs,
      allSamples,
      regression,
      avgMeshUsed,
      avgJuvenileSpeciesPct
    };
  }, [baganCatchLogs, selectedSpeciesPop]);

  // Conservation Mesh Selectivity Audit per species found in baganCatchLogs
  const meshAuditList = useMemo(() => {
    const grouped: Record<BaganSpeciesId, { meshSum: number; count: number; juvSum: number }> = {} as Record<
      BaganSpeciesId,
      { meshSum: number; count: number; juvSum: number }
    >;
    for (const log of baganCatchLogs) {
      if (!grouped[log.species]) {
        grouped[log.species] = { meshSum: 0, count: 0, juvSum: 0 };
      }
      grouped[log.species].meshSum += log.meshSizeMm;
      grouped[log.species].juvSum += log.juvenilePct;
      grouped[log.species].count += 1;
    }

    return (Object.keys(grouped) as BaganSpeciesId[]).map((sp) => {
      const ref = SPECIES_REFERENCES[sp];
      const avgMesh = grouped[sp].meshSum / grouped[sp].count;
      const avgJuv = grouped[sp].juvSum / grouped[sp].count;
      const isMeshCompliant = avgMesh >= ref.recommendedMeshMm;
      return {
        species: sp,
        name: ref.name,
        avgMesh,
        recommendedMesh: ref.recommendedMeshMm,
        avgJuv,
        isMeshCompliant
      };
    });
  }, [baganCatchLogs]);

  const cardStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '18px',
    padding: '20px'
  };

  const aiStatus = ecosystemIntel?.aiDecision.status || 'LAYAK OPERASI';
  const aiStatusColors =
    aiStatus === 'LAYAK OPERASI'
      ? {
          bg: 'var(--status-ok-bg)',
          border: 'var(--status-ok-border)',
          text: 'var(--status-ok-text)',
          icon: 'fa-check-circle'
        }
      : aiStatus === 'WASPADA CUACA'
      ? {
          bg: 'var(--status-warn-bg)',
          border: 'var(--status-warn-border)',
          text: 'var(--status-warn-text)',
          icon: 'fa-exclamation-triangle'
        }
      : {
          bg: 'var(--status-danger-bg)',
          border: 'var(--status-danger-border)',
          text: 'var(--status-danger-text)',
          icon: 'fa-hand'
        };

  return (
    <div
      style={{
        maxWidth: embedded ? '100%' : '1240px',
        margin: '0 auto',
        padding: embedded ? '0' : '1.5rem 1.25rem 4.5rem 1.25rem'
      }}
    >
      {/* 1. Header & Station Control */}
      <div
        style={{
          ...cardStyle,
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.65rem)', margin: 0, color: 'var(--text-primary)' }}>
            {isAdminView
              ? 'Pusat Analisis Cuaca, Hasil Tangkap & Ekosistem Bagan'
              : isGuestView
              ? 'Data Publik Cuaca Laut, Hasil Tangkap & Dinamika Populasi'
              : 'Cuaca Melaut, Tangkapan & Konservasi Bagan'}
          </h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '72ch' }}>
            {isAdminView
              ? 'Modul lengkap admin & pengembang: Meteorologi & Klimatologi 14 hari, Logbook & Sampling Biometrik, Regresi Populasi W=aL^b, serta Audit Konservasi WPPNRI 712.'
              : isGuestView
              ? 'Pantau prakiraan cuaca laut 14 hari, data hasil tangkapan & CPUE, ekspor dataset CSV, regresi pertumbuhan W=aL^b (Lc vs Lm), serta audit selektivitas mata jaring.'
              : 'Cek kondisi ombak, angin, musim & terang bulan malam ini, catat hasil tangkapan, dan pantau anjuran ukuran tangkap ramah lingkungan.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(isAdminView || isGuestView) && bagans.length > 0 && (
            <select
              aria-label="Pilih Unit Bagan"
              value={activeBagan.id}
              onChange={(e) => selectBagan(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {bagans.map((b) => (
                <option key={b.id} value={b.id} style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                  {b.name} ({b.id}) · {catchCountByBagan[b.id] || 0} logbook
                </option>
              ))}
            </select>
          )}

          <select
            aria-label="Pilih Perairan"
            value={marineRegion}
            onChange={(e) => handleStationChange(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {STATION_OPTIONS.map((st) => (
              <option key={st.id} value={st.id} style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                {st.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => refreshEcosystemIntel(marineRegion, true)}
            disabled={ecosystemLoading}
            style={{ minHeight: '40px', whiteSpace: 'nowrap' }}
          >
            <i className={`fas fa-sync-alt ${ecosystemLoading ? 'fa-spin' : ''}`}></i>{' '}
            {ecosystemLoading ? 'Memuat...' : 'Perbarui'}
          </button>
        </div>
      </div>

      {/* 2. Operational Weather Status Banner */}
      <div
        style={{
          background: aiStatusColors.bg,
          border: `1.5px solid ${aiStatusColors.border}`,
          borderRadius: '18px',
          padding: '18px 20px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: aiStatusColors.text, display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <i className={`fas ${aiStatusColors.icon}`}></i>
              {isAdminView
                ? `Rekomendasi AI Operasional: ${aiStatus}`
                : isGuestView
                ? `Indeks Kelayakan Melaut Perairan: ${aiStatus}`
                : aiStatus === 'LAYAK OPERASI'
                ? 'AMAN UNTUK MELAUT MALAM INI'
                : aiStatus === 'WASPADA CUACA'
                ? 'HATI-HATI — PANTAU ANGIN & OMBAK'
                : 'SEBAIKNYA TUNDA MELAUT DULU'}
            </span>
            {(isAdminView || isGuestView) && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>
                Indeks Kelayakan: <strong>{ecosystemIntel ? `${ecosystemIntel.aiDecision.score}/100` : '--/100'}</strong>
              </span>
            )}
            {ecosystemIntel && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                · Update {new Date(ecosystemIntel.fetchedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            )}
          </div>

          <p style={{ margin: '0 0 6px 0', fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {ecosystemIntel
              ? ecosystemIntel.aiDecision.summaryForFisherman
              : 'Sedang mengambil data cuaca dan gelombang laut terbaru...'}
          </p>

          {(isAdminView || isGuestView) && ecosystemIntel && ecosystemIntel.aiDecision.reasons.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              {ecosystemIntel.aiDecision.reasons.map((r, i) => (
                <span key={i}>• {r}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setCurrentView('timo-ai')}
            style={{ minHeight: '42px', whiteSpace: 'nowrap' }}
          >
            <i className="fas fa-robot"></i> Tanya TIMO AI
          </button>
          {(isAdminView || isGuestView) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentView('sim3d')}
              style={{ minHeight: '42px', whiteSpace: 'nowrap' }}
            >
              <i className="fas fa-cube"></i> Buka Simulasi 3D
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* HALAMAN NELAYAN TERPADU (CUACA + TANGKAPAN + KONSERVASI PRAKTIS)     */}
      {/* ==================================================================== */}
      {isFishermanLoggedIn && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* 4 Kartu Cuaca Inti */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tinggi Ombak Sekarang</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: FONT_MONO, color: 'var(--primary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.marine.waveHeightM.toFixed(2)} m` : '--'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {ecosystemIntel
                  ? ecosystemIntel.marine.waveHeightM < 0.5
                    ? 'Ombak tenang untuk angkat jaring'
                    : ecosystemIntel.marine.waveHeightM < 1.0
                    ? 'Ombak sedang, tetap waspada'
                    : 'Ombak tinggi, berisiko di bagan'
                  : 'Memuat...'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Angin Laut</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: FONT_MONO, color: 'var(--text-primary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.weather.windSpeedKnots.toFixed(0)} knot` : '--'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.weather.windSpeedKmh.toFixed(0)} km/jam` : 'Memuat...'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Cuaca &amp; Hujan</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {ecosystemIntel ? ecosystemIntel.weather.weatherLabel : '--'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {ecosystemIntel ? `Curah hujan ${ecosystemIntel.weather.precipitationMm.toFixed(1)} mm` : 'Memuat...'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Terang Bulan (Lampu Bagan)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {ecosystemIntel ? ecosystemIntel.lunar.phaseName : '--'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {ecosystemIntel ? `Lampu ${ecosystemIntel.lunar.attractantEfficiency.toLowerCase()}` : 'Memuat...'}
              </div>
            </div>
          </div>

          {/* Prakiraan 7 Hari Ke Depan (Kartu Ringkas) */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.08rem', color: 'var(--text-primary)' }}>
              Prakiraan Cuaca 7 Hari Ke Depan
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '10px' }}>
              {(ecosystemIntel?.dailyTimeSeries || []).slice(-7).map((day) => {
                const isSafe = day.waveHeightMaxM < 0.8 && day.windSpeedMaxKnots < 18;
                return (
                  <div
                    key={day.date}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${isSafe ? 'var(--card-border)' : 'var(--status-warn-border)'}`,
                      borderRadius: '12px',
                      padding: '10px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: FONT_MONO }}>
                      {formatShortDate(day.date)}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0', fontFamily: FONT_MONO }}>
                      {day.waveHeightMaxM.toFixed(2)} m
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Angin {day.windSpeedMaxKnots.toFixed(0)} kt
                    </div>
                    <div
                      style={{
                        marginTop: '5px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        color: isSafe ? '#10b981' : 'var(--status-warn-text)'
                      }}
                    >
                      {isSafe ? 'Aman' : 'Waspada'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Publik (Belum Login): Informasi Umum Hasil Tangkapan, Matang Gonad (Lm) & Ukuran Jaring */}
          {isGuestView && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                    Informasi Umum Perikanan Bagan
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    Jenis Tangkapan, Ukuran Matang Gonad (Lm) &amp; Anjuran Mata Jaring
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '72ch', lineHeight: 1.55 }}>
                    <strong>Ukuran Matang Gonad (Lm)</strong> adalah panjang tubuh minimum ikan saat pertama kali siap bereproduksi/memijah. Menangkap ikan di atas ukuran Lm membantu populasi ikan di perairan pesisir tetap berkelanjutan.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setCurrentView('auth')}
                  style={{ minHeight: '40px', whiteSpace: 'nowrap' }}
                >
                  <i className="fas fa-sign-in-alt"></i> Masuk untuk Catat Tangkapan
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '12px' }}>
                {Object.values(SPECIES_REFERENCES)
                  .filter((sp) => sp.id !== 'lainnya')
                  .map((sp) => (
                    <div
                      key={sp.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{sp.name}</div>
                        <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          {sp.latinName}
                        </div>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Matang Gonad (Lm)</div>
                            <div style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: 'var(--primary)', fontSize: '0.96rem' }}>
                              &ge; {sp.lmCm.toFixed(1)} cm
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Mata Jaring Minimum</div>
                            <div style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                              &ge; {sp.recommendedMeshMm} mm
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {sp.targetCatchNote}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Nelayan Sudah Login: Catat Hasil Tangkapan Cepat (Cukup 3 Hal) + Riwayat Bagan Pribadi */}
          {isFishermanLoggedIn && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
            <form onSubmit={handleQuickCatchSubmit} style={cardStyle}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.12rem', color: 'var(--primary)' }}>
                Catat Tangkapan Hari Ini
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Cukup pilih jenis ikan, masukkan total kilo, dan berapa kali angkat jaring.
              </p>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  1. Pilih atau Tulis Jenis Tangkapan:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Object.values(SPECIES_REFERENCES)
                    .filter((sp) => sp.id !== 'lainnya')
                    .map((sp) => {
                      const selected = quickSpecies === sp.id;
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => {
                            setQuickSpecies(sp.id);
                            setQuickCustomName('');
                          }}
                          style={{
                            padding: '9px 6px',
                            borderRadius: '10px',
                            border: selected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                            background: selected ? 'var(--status-info-bg)' : 'var(--bg-secondary)',
                            color: selected ? 'var(--primary)' : 'var(--text-primary)',
                            fontSize: '0.84rem',
                            fontWeight: selected ? 800 : 600,
                            cursor: 'pointer'
                          }}
                        >
                          {sp.name}
                        </button>
                      );
                    })}

                  {customSpeciesOptions.map((customName) => {
                    const selected =
                      quickSpecies === 'lainnya' &&
                      quickCustomName.trim().toLowerCase() === customName.toLowerCase();
                    return (
                      <button
                        key={customName}
                        type="button"
                        onClick={() => {
                          setQuickSpecies('lainnya');
                          setQuickCustomName(customName);
                        }}
                        style={{
                          padding: '9px 6px',
                          borderRadius: '10px',
                          border: selected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                          background: selected ? 'var(--status-info-bg)' : 'var(--bg-secondary)',
                          color: selected ? 'var(--primary)' : 'var(--text-primary)',
                          fontSize: '0.84rem',
                          fontWeight: selected ? 800 : 600,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={customName}
                      >
                        {customName}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setQuickSpecies('lainnya');
                      if (customSpeciesOptions.some((c) => c.toLowerCase() === quickCustomName.trim().toLowerCase())) {
                        setQuickCustomName('');
                      }
                    }}
                    style={{
                      padding: '9px 6px',
                      borderRadius: '10px',
                      border:
                        quickSpecies === 'lainnya'
                          ? '2px solid var(--primary)'
                          : '1px dashed var(--card-border)',
                      background:
                        quickSpecies === 'lainnya' ? 'var(--status-info-bg)' : 'transparent',
                      color: 'var(--primary)',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      gridColumn: customSpeciesOptions.length % 3 === 0 ? '1 / -1' : undefined
                    }}
                  >
                    + Tambah Jenis Lain
                  </button>
                </div>

                {quickSpecies === 'lainnya' && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      value={quickCustomName}
                      onChange={(e) => setQuickCustomName(e.target.value)}
                      placeholder="Ketik nama hasil tangkapan (contoh: Ikan Kembung, Layang, Rajungan)"
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--primary)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  2. Total Berat (kg)
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={quickWeightKg}
                    onChange={(e) => setQuickWeightKg(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      marginTop: '5px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--card-border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      fontFamily: FONT_MONO
                    }}
                  />
                </label>

                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  3. Berapa Kali Angkat
                  <input
                    type="number"
                    min="1"
                    value={quickHauling}
                    onChange={(e) => setQuickHauling(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      marginTop: '5px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--card-border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      fontFamily: FONT_MONO
                    }}
                  />
                </label>
              </div>

              {/* 4. Ukuran Panjang Ikan (cm) + Kamera Real-Time / Upload Foto */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '14px',
                  padding: '12px',
                  marginBottom: '14px'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px' }}>
                  4. Ukuran Panjang Ikan (cm) — <span style={{ color: 'var(--primary)' }}>Kamera / Upload Foto</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="250"
                    value={quickLengthCmInput}
                    onChange={(e) => setQuickLengthCmInput(e.target.value)}
                    placeholder="Panjang (cm), mis: 6.5"
                    style={{
                      flex: '1 1 130px',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      fontFamily: FONT_MONO,
                      fontWeight: 700
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddQuickLengthSample}
                    style={{ minHeight: '40px' }}
                  >
                    <i className="fas fa-plus"></i> Tambah
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setCameraTargetMode('fisherman');
                      setCameraModalOpen(true);
                    }}
                    style={{ minHeight: '40px' }}
                  >
                    <i className="fas fa-camera"></i> Ukur Kamera / Foto
                  </button>
                </div>

                {quickSamples.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {quickSamples.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          background: 'var(--status-info-bg)',
                          border: '1px solid var(--status-info-border)',
                          fontSize: '0.78rem',
                          fontFamily: FONT_MONO,
                          color: 'var(--primary)',
                          fontWeight: 700
                        }}
                      >
                        {s.lengthCm.toFixed(1)} cm
                        <button
                          type="button"
                          onClick={() => setQuickSamples((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '48px', fontSize: '0.96rem' }}>
                <i className="fas fa-check-circle"></i> Simpan Catatan Tangkapan
              </button>
            </form>

            {/* Ringkasan Tangkapan, Rata-rata & Riwayat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--text-primary)' }}>
                    Ringkasan &amp; Catatan Tangkapan ({activeBagan.id})
                  </h3>
                  <span style={{ fontFamily: FONT_MONO, fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Total: {catchStats.totalWeightKg.toFixed(1)} kg
                  </span>
                </div>

                {/* Strip ringkas rata-rata per angkat */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Rata-rata / Angkat</div>
                    <div style={{ fontFamily: FONT_MONO, fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>
                      {catchStats.avgCpuePerHaul.toFixed(1)} kg
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Total Angkat Jaring</div>
                    <div style={{ fontFamily: FONT_MONO, fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      {catchStats.totalHaulings} kali
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {baganCatchLogs.length === 0 ? (
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px dashed var(--card-border)',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      Belum ada catatan tangkapan untuk <strong>{activeBagan.name}</strong> ({activeBagan.id}). Catat hasil tangkapan pertama pada form di sebelah.
                    </div>
                  ) : (
                    baganCatchLogs.slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {getCatchDisplayName(log)}
                          </strong>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {log.date} · {log.haulingCount} kali angkat jaring
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: FONT_MONO, fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                            {log.totalWeightKg.toFixed(1)} kg
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteCatchLog(log.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Info Musim, Lampu & Suhu Laut */}
          {(() => {
            const eff = ecosystemIntel?.lunar.attractantEfficiency;
            const effColor =
              eff === 'Sangat Optimal'
                ? '#10b981'
                : eff === 'Cukup Efektif'
                ? 'var(--primary)'
                : 'var(--status-warn-text)';
            const tempC = ecosystemIntel?.marine.seaSurfaceTempC ?? 29.0;
            const tempPct = Math.max(5, Math.min(95, ((tempC - 25) / 9) * 100));
            const tempLabel =
              ecosystemIntel?.climatology.sstStatus === 'Hangat (Waspada Ekosistem)'
                ? 'Agak Hangat'
                : ecosystemIntel?.climatology.sstStatus === 'Dingin / Upwelling'
                ? 'Sejuk (Subur)'
                : 'Normal Ideal';
            const illumPct = ecosystemIntel?.lunar.illuminationPct ?? 50;
            const lampStrengthPct = Math.max(20, 100 - illumPct * 0.7);

            return (
              <div
                style={{
                  ...cardStyle,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em', marginBottom: '4px' }}>
                      Kondisi Melaut &amp; Efektivitas Lampu
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                      {ecosystemIntel?.climatology.seasonName || 'Memuat kondisi musim...'}
                    </h3>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'var(--status-info-bg)',
                      border: '1px solid var(--status-info-border)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.15rem',
                      flexShrink: 0
                    }}
                  >
                    <i className="fas fa-lightbulb"></i>
                  </div>
                </div>

                {/* 3-Column Visual Scannable Metrics (Hairline divided, zero card nesting) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '12px',
                    padding: '14px 0',
                    borderTop: '1px solid var(--card-border)',
                    borderBottom: '1px solid var(--card-border)'
                  }}
                >
                  {/* Lampu Bagan */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Daya Tarik Lampu
                    </div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 800, color: effColor, lineHeight: 1.2 }}>
                      {eff || '--'}
                    </div>
                    <div
                      style={{
                        marginTop: '8px',
                        height: '6px',
                        borderRadius: '999px',
                        background: 'var(--bg-secondary)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${lampStrengthPct}%`,
                          height: '100%',
                          background: effColor,
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>
                      Bulan {illumPct}%
                    </div>
                  </div>

                  {/* Suhu Permukaan Laut */}
                  <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Suhu Air Laut
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', lineHeight: 1.15 }}>
                      {ecosystemIntel ? `${ecosystemIntel.marine.seaSurfaceTempC.toFixed(1)} °C` : '--'}
                    </div>
                    <div
                      style={{
                        marginTop: '8px',
                        height: '6px',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, #0284c7, #00e5d0, #6366f1)',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '-3px',
                          left: `calc(${tempPct}% - 6px)`,
                          width: '12px',
                          height: '12px',
                          borderRadius: '999px',
                          background: 'var(--card-bg)',
                          border: '2.5px solid var(--primary)'
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {tempLabel}
                    </div>
                  </div>

                  {/* Arah Angin / Musim */}
                  <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Fase Bulan
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                      {ecosystemIntel?.lunar.phaseName || '--'}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>
                      {ecosystemIntel ? `Umur ${ecosystemIntel.lunar.ageDays} hr` : '--'}
                    </div>
                  </div>
                </div>

                {/* Two concise, actionable fisherman notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <i className="fas fa-moon" style={{ color: 'var(--primary)', marginTop: '3px', fontSize: '0.9rem', width: '16px', textAlign: 'center' }}></i>
                    <div style={{ fontSize: '0.87rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--primary)' }}>Efek ke Lampu:</strong>{' '}
                      {ecosystemIntel?.lunar.fishermanNote || 'Menghitung efektivitas cahaya lampu bagan berdasarkan fase bulan.'}
                    </div>
                  </div>

                  {ecosystemIntel?.climatology.seasonCharacteristic && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <i className="fas fa-wind" style={{ color: 'var(--primary)', marginTop: '3px', fontSize: '0.9rem', width: '16px', textAlign: 'center' }}></i>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Catatan Angin Musim:</strong>{' '}
                        {ecosystemIntel.climatology.seasonCharacteristic}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODUL ANALISIS LENGKAP: ADMIN (CRUD) & UMUM / PENELITI (READ-ONLY)   */}
      {/* ==================================================================== */}
      {(isAdminView || isGuestView) && (
      <>
      {/* 3. Sub-Navigation Tabs for Analytical Suite */}
      <div
        role="tablist"
        aria-label="Modul Analisis Cuaca, Tangkapan dan Ekosistem"
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '18px',
          background: 'var(--bg-secondary)',
          padding: '8px',
          borderRadius: '14px',
          border: '1px solid var(--card-border)'
        }}
      >
        {[
          { id: 'meteo', icon: 'fa-cloud-sun-rain', label: 'Meteorologi, Bulan & Klimatologi' },
          {
            id: 'catch',
            icon: 'fa-clipboard-list',
            label: isAdminView
              ? `Logbook, CPUE & CSV (${baganCatchLogs.length})`
              : `Data Tangkapan, CPUE & CSV (${baganCatchLogs.length})`
          },
          { id: 'population', icon: 'fa-fish', label: 'Dinamika Populasi (W=aL^b & Lc/Lm)' },
          { id: 'conservation', icon: 'fa-shield-alt', label: 'Konservasi & Audit Mata Jaring' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`about-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as IntelTab)}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: METEOROLOGI, FASE BULAN & KLIMATOLOGI (REAL-TIME + 14 HARI TIME SERIES) */}
      {activeTab === 'meteo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Provenance notice */}
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span><strong>Cadence Data:</strong> Real-Time Per Jam (keselamatan melaut &amp; hauling) + Time-Series 14 Hari (7 hari historis + 7 hari prakiraan pola cuaca).</span>
            <span>· Sumber: Open-Meteo Forecast &amp; Marine (ECMWF/Copernicus) + Efemeris Astronomi.</span>
          </div>

          {/* Real-time Weather + Marine Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kecepatan &amp; Arah Angin</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.weather.windSpeedKnots.toFixed(1)} kt` : '--'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: FONT_MONO }}>
                {ecosystemIntel
                  ? `${ecosystemIntel.weather.windSpeedKmh.toFixed(1)} km/j · Arah ${ecosystemIntel.weather.windDirectionDeg}° · Gust ${ecosystemIntel.weather.windGustsKmh.toFixed(1)} km/j`
                  : 'Memuat data angin...'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tinggi Ombak &amp; Arus Laut</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.marine.waveHeightM.toFixed(2)} m` : '--'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: FONT_MONO }}>
                {ecosystemIntel
                  ? `Periode ${ecosystemIntel.marine.wavePeriodSec.toFixed(1)} s · Arus ${ecosystemIntel.marine.currentVelocityMs.toFixed(2)} m/s`
                  : 'Memuat data laut...'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Curah Hujan &amp; Tekanan Udara</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.weather.precipitationMm.toFixed(1)} mm` : '--'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: FONT_MONO }}>
                {ecosystemIntel
                  ? `${ecosystemIntel.weather.weatherLabel} · ${ecosystemIntel.weather.pressureHpa.toFixed(0)} hPa · Awan ${ecosystemIntel.weather.cloudCoverPct}%`
                  : 'Memuat cuaca...'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Suhu Udara &amp; Suhu Permukaan Laut (SST)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.marine.seaSurfaceTempC.toFixed(1)} °C` : '--'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: FONT_MONO }}>
                {ecosystemIntel
                  ? `SST Laut · Udara ${ecosystemIntel.weather.airTempC.toFixed(1)} °C · ${ecosystemIntel.climatology.sstStatus}`
                  : 'Memuat suhu...'}
              </div>
            </div>
          </div>

          {/* Lunar Phase + Climatology Split */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Siklus Bulan &amp; Efektivitas Lampu Bagan (Real-Time Astronomi)
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: 'var(--primary)' }}>
                {ecosystemIntel ? `${ecosystemIntel.lunar.phaseName} (${ecosystemIntel.lunar.illuminationPct}% cahaya bulan)` : 'Memuat fase bulan...'}
              </h3>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Efektivitas Lampu Pemikat Ikan: {ecosystemIntel?.lunar.attractantEfficiency || '--'} · Umur Bulan {ecosystemIntel ? `${ecosystemIntel.lunar.ageDays} hari` : '--'}
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {ecosystemIntel?.lunar.fishermanNote || 'Menghitung fase sinodik bulan...'}
              </p>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Klimatologi Musim &amp; Kondisi Oseanografi Regional
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: 'var(--primary)' }}>
                {ecosystemIntel?.climatology.seasonName || 'Memuat data musim...'}
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {ecosystemIntel?.climatology.seasonCharacteristic || 'Menganalisis pola angin monsun Indonesia...'}
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                <strong>Status SST:</strong> {ecosystemIntel?.climatology.sstNote || '--'}
              </div>
            </div>
          </div>

          {/* 14-Day Time Series SVG Chart (Past 7d + Forecast 7d) */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Time-Series 14 Hari: Tinggi Gelombang Maksimum (m) &amp; Kecepatan Angin (knot)
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Garis putus merah = batas waspada bagan tancap (0.8 m) · Area kanan = prakiraan 7 hari ke depan
                </div>
              </div>
              {hoveredDayIdx !== null && ecosystemIntel?.dailyTimeSeries[hoveredDayIdx] && (
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: '0.8rem',
                    fontVariantNumeric: 'tabular-nums',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--card-border)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                >
                  {ecosystemIntel.dailyTimeSeries[hoveredDayIdx].date} ({ecosystemIntel.dailyTimeSeries[hoveredDayIdx].isFuture ? 'Prakiraan' : 'Historis'}) · Ombak{' '}
                  <strong>{ecosystemIntel.dailyTimeSeries[hoveredDayIdx].waveHeightMaxM.toFixed(2)}m</strong> · Angin{' '}
                  <strong>{ecosystemIntel.dailyTimeSeries[hoveredDayIdx].windSpeedMaxKnots.toFixed(1)}kt</strong> · Hujan{' '}
                  <strong>{ecosystemIntel.dailyTimeSeries[hoveredDayIdx].precipitationMm.toFixed(1)}mm</strong>
                </div>
              )}
            </div>

            {ecosystemIntel && ecosystemIntel.dailyTimeSeries.length > 0 ? (
              <div style={{ width: '100%', overflowX: 'auto' }}>
                {(() => {
                  const series = ecosystemIntel.dailyTimeSeries;
                  const W = 820;
                  const H = 240;
                  const padL = 44;
                  const padR = 44;
                  const padT = 20;
                  const padB = 34;
                  const plotW = W - padL - padR;
                  const plotH = H - padT - padB;
                  const maxWave = Math.max(1.4, ...series.map((d) => d.waveHeightMaxM));
                  const maxWind = Math.max(20, ...series.map((d) => d.windSpeedMaxKnots));
                  const xAt = (i: number) => padL + (i / Math.max(1, series.length - 1)) * plotW;
                  const yWave = (val: number) => padT + plotH - (val / maxWave) * plotH;
                  const yWind = (val: number) => padT + plotH - (val / maxWind) * plotH;

                  const wavePath = series
                    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yWave(d.waveHeightMaxM).toFixed(1)}`)
                    .join(' ');
                  const windPath = series
                    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yWind(d.windSpeedMaxKnots).toFixed(1)}`)
                    .join(' ');
                  const firstFutureIdx = series.findIndex((d) => d.isFuture);
                  const splitX = firstFutureIdx > 0 ? xAt(firstFutureIdx - 0.5) : W - padR;
                  const safetyY = yWave(0.8);

                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}>
                      {/* Forecast shaded background */}
                      {firstFutureIdx > 0 && (
                        <rect
                          x={splitX}
                          y={padT}
                          width={W - padR - splitX}
                          height={plotH}
                          fill="rgba(56, 189, 248, 0.08)"
                        />
                      )}

                      {/* Horizontal reference grid */}
                      {[0, 0.5, 1.0, 1.5].map((tick) => {
                        if (tick > maxWave) return null;
                        const ty = yWave(tick);
                        return (
                          <g key={tick}>
                            <line x1={padL} y1={ty} x2={W - padR} y2={ty} stroke="rgba(100,116,139,0.28)" strokeWidth="1" />
                            <text x={padL - 6} y={ty + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="600" fontFamily="JetBrains Mono, monospace">
                              {tick.toFixed(1)}m
                            </text>
                          </g>
                        );
                      })}

                      {/* Safety threshold 0.8m */}
                      <line x1={padL} y1={safetyY} x2={W - padR} y2={safetyY} stroke="var(--status-danger-border)" strokeWidth="1.4" strokeDasharray="5 4" />
                      <text x={padL + 6} y={safetyY - 5} fontSize="10" fill="var(--status-danger-text)" fontWeight="700">
                        Batas Waspada Bagan (0.8 m)
                      </text>

                      {/* Wind line (dashed indigo) */}
                      <path d={windPath} fill="none" stroke="var(--status-warn-border)" strokeWidth="2.2" strokeDasharray="4 3" />

                      {/* Wave height line (solid teal/mint) */}
                      <path d={wavePath} fill="none" stroke="var(--sea-mint)" strokeWidth="2.8" strokeLinejoin="round" />

                      {/* Data points + hover targets */}
                      {series.map((d, i) => {
                        const cx = xAt(i);
                        const cy = yWave(d.waveHeightMaxM);
                        const isHot = hoveredDayIdx === i;
                        return (
                          <g
                            key={d.date}
                            onMouseEnter={() => setHoveredDayIdx(i)}
                            onMouseLeave={() => setHoveredDayIdx(null)}
                            style={{ cursor: 'crosshair' }}
                          >
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isHot ? 5.5 : 3.5}
                              fill={d.waveHeightMaxM >= 0.8 ? '#dc2626' : 'var(--sea-mint)'}
                              stroke="var(--card-bg)"
                              strokeWidth="1.5"
                            />
                            <text
                              x={cx}
                              y={H - 12}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                              fill={d.isFuture ? 'var(--primary)' : 'var(--text-secondary)'}
                              fontFamily="JetBrains Mono, monospace"
                            >
                              {formatShortDate(d.date)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Legend top-right */}
                      <g transform={`translate(${W - 255}, ${padT + 2})`}>
                        <line x1="0" y1="6" x2="18" y2="6" stroke="var(--sea-mint)" strokeWidth="3" />
                        <text x="24" y="10" fontSize="10.5" fill="var(--text-primary)" fontWeight="600">Tinggi Ombak (m)</text>
                        <line x1="130" y1="6" x2="148" y2="6" stroke="var(--status-warn-border)" strokeWidth="2.2" strokeDasharray="4 3" />
                        <text x="154" y="10" fontSize="10.5" fill="var(--text-primary)" fontWeight="600">Angin (knot)</text>
                      </g>
                    </svg>
                  );
                })()}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Memuat grafik time-series 14 hari...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOGBOOK NELAYAN & ANALISIS HASIL TANGKAP (CPUE TIME-SERIES) */}
      {activeTab === 'catch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* KPI Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Hasil Tangkapan</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>
                {catchStats.totalWeightKg.toFixed(1)} kg
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Dari {baganCatchLogs.length} catatan trip ({activeBagan.id})</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rata-rata CPUE per Hauling</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {catchStats.avgCpuePerHaul.toFixed(2)} kg
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Total {catchStats.totalHaulings} kali angkat jaring</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rata-rata CPUE per Jam</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {catchStats.avgCpuePerHour.toFixed(2)} kg/jam
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Akumulasi {catchStats.totalHours.toFixed(1)} jam rendam</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rasio Bycatch &amp; Juvenil</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: catchStats.avgJuvenilePct > 15 ? 'var(--status-warn-text)' : '#10b981' }}>
                {catchStats.avgBycatchPct.toFixed(1)}% / {catchStats.avgJuvenilePct.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Target aman: &le;10% bycatch · &le;15% juvenil</div>
            </div>
          </div>

          {/* Input Form (Admin) or Read-Only Public Info Card (Guest) + CPUE Trend Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', alignItems: 'start' }}>
            {isAdminView ? (
            <form onSubmit={handleSubmitCatch} style={cardStyle}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--primary)' }}>
                Catat Tangkapan &amp; Sampling ({activeBagan.id})
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Data tersimpan khusus untuk unit <strong>{activeBagan.name}</strong> ({activeBagan.id}).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Tanggal Trip
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </label>

                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Jenis Ikan Dominan
                  <select
                    value={formSpecies}
                    onChange={(e) => {
                      const nextSp = e.target.value as BaganSpeciesId;
                      setFormSpecies(nextSp);
                      setFormMeshMm(String((SPECIES_REFERENCES[nextSp] || SPECIES_REFERENCES.lainnya).recommendedMeshMm));
                    }}
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    {Object.values(SPECIES_REFERENCES).map((sp) => (
                      <option key={sp.id} value={sp.id} style={{ background: 'var(--card-bg)' }}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </label>

                {formSpecies === 'lainnya' && (
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                    Nama Jenis Tangkapan Sendiri
                    <input
                      type="text"
                      value={formCustomSpecies}
                      onChange={(e) => setFormCustomSpecies(e.target.value)}
                      placeholder="Contoh: Ikan Kembung, Layang, Rajungan"
                      required
                      style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </label>
                )}

                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Berat Total (kg)
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={formWeightKg}
                    onChange={(e) => setFormWeightKg(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: FONT_MONO }}
                  />
                </label>

                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Jumlah Hauling (kali)
                  <input
                    type="number"
                    min="1"
                    value={formHauling}
                    onChange={(e) => setFormHauling(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: FONT_MONO }}
                  />
                </label>

                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Lama Rendam Lampu (jam)
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: FONT_MONO }}
                  />
                </label>

                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Ukuran Mata Jaring (mm)
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={formMeshMm}
                    onChange={(e) => setFormMeshMm(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: FONT_MONO }}
                  />
                </label>

                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Estimasi Bycatch (%)
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={formBycatchPct}
                    onChange={(e) => setFormBycatchPct(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: FONT_MONO }}
                  />
                </label>

                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Estimasi Anakan &lt; Lm (%)
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formJuvenilePct}
                    onChange={(e) => setFormJuvenilePct(e.target.value)}
                    required
                    style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: FONT_MONO }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Sampel Panjang:Berat (cm:gram, pisahkan koma — untuk analisis W = aL^b)
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setCameraTargetMode('admin');
                      setCameraModalOpen(true);
                    }}
                    style={{ padding: '4px 10px', fontSize: '0.76rem', minHeight: '30px' }}
                  >
                    <i className="fas fa-camera"></i> Ukur Kamera / Foto
                  </button>
                </div>
                <input
                  type="text"
                  aria-label="Sampel Panjang dan Berat"
                  value={formSamplesRaw}
                  onChange={(e) => setFormSamplesRaw(e.target.value)}
                  placeholder="Contoh: 5.4:1.2, 5.9:1.6, 6.4:2.1"
                  style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: FONT_MONO, fontSize: '0.84rem' }}
                />
              </div>

              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Catatan Lapangan (Opsional)
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Misal: Arus agak kuat, dominan bulan gelap"
                  style={{ width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </label>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '44px' }}>
                <i className="fas fa-save"></i> Simpan Catatan Tangkapan
              </button>
            </form>
            ) : (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '11px',
                    background: 'rgba(0, 229, 208, 0.14)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--primary)' }}>
                    Ringkasan Data Tangkapan Publik
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Unit Terpilih: <strong>{activeBagan.name}</strong> ({activeBagan.id})
                  </div>
                </div>
              </div>

              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Halaman ini menyajikan data hasil tangkapan bagan tancap secara terbuka tanpa perlu login. Anda dapat membandingkan CPUE harian, komposisi spesies, dan mengunduh dataset format CSV.
              </p>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '0.83rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  marginBottom: '14px'
                }}
              >
                <div><strong style={{ color: 'var(--text-primary)' }}>Lokasi Unit:</strong> {activeBagan.location}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Catatan Tercatat:</strong> {baganCatchLogs.length} trip logbook tervalidasi</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Hak Akses:</strong> Baca &amp; Ekspor CSV (Read-Only)</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" className="btn btn-primary" onClick={handleExportCatchCsv} style={{ width: '100%', minHeight: '44px' }}>
                  <i className="fas fa-file-csv"></i> Unduh Dataset Tangkapan (.CSV)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setCurrentView('auth')} style={{ width: '100%', minHeight: '42px' }}>
                  <i className="fas fa-user-lock"></i> Masuk Nelayan / Admin untuk Catat Data
                </button>
              </div>
            </div>
            )}

            {/* Right Column: CPUE Time-Series Chart & Species Composition */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--text-primary)' }}>
                    Tren CPUE Harian (kg / hauling)
                  </h3>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCatchCsv}>
                    <i className="fas fa-file-csv"></i> Ekspor CSV
                  </button>
                </div>

                {catchStats.sortedChronological.length > 0 ? (
                  (() => {
                    const logs = catchStats.sortedChronological;
                    const W = 520;
                    const H = 195;
                    const padL = 42;
                    const padR = 18;
                    const padT = 16;
                    const padB = 30;
                    const plotW = W - padL - padR;
                    const plotH = H - padT - padB;
                    const cpues = logs.map((l) => l.totalWeightKg / Math.max(1, l.haulingCount));
                    const maxCpue = Math.max(30, ...cpues) * 1.15;
                    const xAt = (i: number) =>
                      logs.length === 1 ? padL + plotW / 2 : padL + (i / (logs.length - 1)) * plotW;
                    const yAt = (val: number) => padT + plotH - (val / maxCpue) * plotH;
                    const path = logs
                      .map((l, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(cpues[i]).toFixed(1)}`)
                      .join(' ');

                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                        {[0.25, 0.5, 0.75, 1].map((f) => {
                          const val = maxCpue * f;
                          const ty = yAt(val);
                          return (
                            <g key={f}>
                              <line x1={padL} y1={ty} x2={W - padR} y2={ty} stroke="rgba(100,116,139,0.28)" />
                              <text x={padL - 6} y={ty + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="600" fontFamily="JetBrains Mono, monospace">
                                {val.toFixed(0)}
                              </text>
                            </g>
                          );
                        })}
                        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.6" strokeLinejoin="round" />
                        {logs.map((l, i) => (
                          <g key={l.id}>
                            <circle cx={xAt(i)} cy={yAt(cpues[i])} r="4" fill="var(--sea-mint)" stroke="var(--card-bg)" strokeWidth="1.5" />
                            <text x={xAt(i)} y={yAt(cpues[i]) - 8} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--text-primary)" fontFamily="JetBrains Mono, monospace">
                              {cpues[i].toFixed(1)}
                            </text>
                            <text x={xAt(i)} y={H - 10} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--text-secondary)" fontFamily="JetBrains Mono, monospace">
                              {formatShortDate(l.date)}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {isAdminView
                      ? `Belum ada data logbook tangkapan untuk ${activeBagan.name} (${activeBagan.id}). Catat trip pertama pada formulir di samping.`
                      : `Belum ada data publik logbook tangkapan untuk ${activeBagan.name} (${activeBagan.id}).`}
                  </p>
                )}
              </div>

              {/* Species Composition */}
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Komposisi Hasil Tangkapan per Spesies
                </h3>
                {catchStats.speciesTotals.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                    Belum ada data komposisi spesies untuk {activeBagan.id}.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {catchStats.speciesTotals.map((sp) => (
                      <div key={sp.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sp.name}</span>
                          <span style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                            {sp.weightKg.toFixed(1)} kg ({sp.sharePct.toFixed(1)}%)
                          </span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${sp.sharePct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #00e5d0)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Catch Logbook Table */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.08rem', color: 'var(--text-primary)' }}>
              {isAdminView
                ? `Riwayat Logbook Tangkapan Nelayan — ${activeBagan.name} (${activeBagan.id})`
                : `Data Riwayat Hasil Tangkapan — ${activeBagan.name} (${activeBagan.id})`}
            </h3>
            <div className="table-wrap-glass">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Spesies</th>
                    <th>Berat Total</th>
                    <th>CPUE / Hauling</th>
                    <th>CPUE / Jam</th>
                    <th>Bycatch</th>
                    <th>Juvenil</th>
                    <th>Mata Jaring</th>
                    {isAdminView && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {baganCatchLogs.length === 0 ? (
                    <tr>
                      <td colSpan={isAdminView ? 9 : 8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                        Belum ada catatan tangkapan tersimpan untuk {activeBagan.name} ({activeBagan.id}).
                      </td>
                    </tr>
                  ) : (
                    baganCatchLogs.map((log) => {
                      const cpueHaul = log.totalWeightKg / Math.max(1, log.haulingCount);
                      const cpueHour = log.totalWeightKg / Math.max(0.5, log.soakingHours);
                      return (
                        <tr key={log.id}>
                          <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>{log.date}</td>
                          <td>
                            <strong>{getCatchDisplayName(log)}</strong>
                            {log.notes && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{log.notes}</div>
                            )}
                          </td>
                          <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>{log.totalWeightKg.toFixed(1)} kg</td>
                          <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>{cpueHaul.toFixed(2)} kg</td>
                          <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>{cpueHour.toFixed(2)} kg/j</td>
                          <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>{log.bycatchPct.toFixed(1)}%</td>
                          <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: log.juvenilePct > 15 ? 'var(--status-warn-text)' : 'var(--text-primary)' }}>
                            {log.juvenilePct.toFixed(0)}%
                          </td>
                          <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>{log.meshSizeMm} mm</td>
                          {isAdminView && (
                            <td>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => deleteCatchLog(log.id)}
                                aria-label={`Hapus catatan ${log.date}`}
                                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              >
                                Hapus
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DINAMIKA POPULASI IKAN (W = aL^b, Lc vs Lm, REFERENSI KKP WPPNRI 712) */}
      {activeTab === 'population' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Species Selector */}
          <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.12rem', color: 'var(--primary)' }}>
                Analisis Regresi Panjang-Bobot (W = aL^b) &amp; Struktur Ukuran (Lc vs Lm)
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Dihitung langsung secara statistik (OLS log-log: ln W = ln a + b ln L) dari data sampling biometrik pada Logbook Nelayan.
              </p>
            </div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Pilih Spesies Target:
              <select
                value={selectedSpeciesPop}
                onChange={(e) => setSelectedSpeciesPop(e.target.value as BaganSpeciesId)}
                style={{
                  marginLeft: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 700
                }}
              >
                {Object.values(SPECIES_REFERENCES).map((sp) => (
                  <option key={sp.id} value={sp.id} style={{ background: 'var(--card-bg)' }}>
                    {sp.name} ({sp.latinName})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Boundary note on KKP WPPNRI 712 */}
          <div
            style={{
              background: 'var(--status-info-bg)',
              border: '1px solid var(--status-info-border)',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '0.86rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5
            }}
          >
            <strong>Acuan Referensi Resmi KKP:</strong> {populationMetrics.ref.kkpWpp712Note}
          </div>

          {/* Regression KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Persamaan &amp; Nilai Eksponen (b)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>
                {populationMetrics.regression ? `b = ${populationMetrics.regression.b.toFixed(3)}` : 'Data < 3'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: FONT_MONO }}>
                {populationMetrics.regression
                  ? `a = ${populationMetrics.regression.a.toExponential(2)} · R² = ${populationMetrics.regression.r2.toFixed(3)}`
                  : 'Tambah >= 3 sampel panjang:berat'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Pola Pertumbuhan Biologi</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.4 }}>
                {populationMetrics.regression ? populationMetrics.regression.growthPattern : 'Menunggu sampel'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Sampel terukur: {populationMetrics.allSamples.length} ekor
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rata-rata Panjang Tertangkap (Lc)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {populationMetrics.regression ? `${populationMetrics.regression.lcMeanCm.toFixed(2)} cm` : '--'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Acuan Matang Gonad (Lm): <strong>{populationMetrics.ref.lmCm.toFixed(1)} cm</strong>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status Keberlanjutan Ukuran (Lc vs Lm)</div>
              {populationMetrics.regression ? (
                <>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      marginTop: '4px',
                      color:
                        populationMetrics.regression.lcMeanCm >= populationMetrics.ref.lmCm
                          ? '#10b981'
                          : 'var(--status-warn-text)'
                    }}
                  >
                    {populationMetrics.regression.lcMeanCm >= populationMetrics.ref.lmCm
                      ? 'Layak Tangkap (Lc >= Lm)'
                      : 'Waspada Overfishing Pertumbuhan (Lc < Lm)'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {populationMetrics.regression.lcMeanCm >= populationMetrics.ref.lmCm
                      ? 'Mayoritas ikan sudah berkesempatan memijah sebelum tertangkap.'
                      : 'Disarankan perbesar mata jaring atau pindah titik pengoperasian lampu.'}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.86rem' }}>
                  Belum cukup sampel untuk evaluasi Lc vs Lm.
                </div>
              )}
            </div>
          </div>

          {/* SVG Length-Weight Scatter & Fitted Power Curve */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.08rem', color: 'var(--text-primary)' }}>
              Kurva Hubungan Panjang–Bobot ({populationMetrics.ref.name})
            </h3>
            {populationMetrics.regression && populationMetrics.allSamples.length >= 3 ? (
              (() => {
                const samples = populationMetrics.allSamples;
                const reg = populationMetrics.regression;
                const W = 760;
                const H = 250;
                const padL = 52;
                const padR = 24;
                const padT = 20;
                const padB = 38;
                const plotW = W - padL - padR;
                const plotH = H - padT - padB;

                const minL = Math.min(...samples.map((s) => s.lengthCm), populationMetrics.ref.lmCm) * 0.9;
                const maxL = Math.max(...samples.map((s) => s.lengthCm), populationMetrics.ref.lmCm) * 1.1;
                const maxW = Math.max(...samples.map((s) => s.weightG), reg.a * Math.pow(maxL, reg.b)) * 1.1;

                const xAt = (L: number) => padL + ((L - minL) / Math.max(0.1, maxL - minL)) * plotW;
                const yAt = (Wt: number) => padT + plotH - (Wt / Math.max(0.1, maxW)) * plotH;

                const curvePoints: string[] = [];
                for (let step = 0; step <= 24; step++) {
                  const L = minL + (step / 24) * (maxL - minL);
                  const Wt = reg.a * Math.pow(L, reg.b);
                  curvePoints.push(`${step === 0 ? 'M' : 'L'} ${xAt(L).toFixed(1)} ${yAt(Wt).toFixed(1)}`);
                }
                const lmX = xAt(populationMetrics.ref.lmCm);

                return (
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {[0.25, 0.5, 0.75, 1].map((f) => {
                      const val = maxW * f;
                      const ty = yAt(val);
                      return (
                        <g key={f}>
                          <line x1={padL} y1={ty} x2={W - padR} y2={ty} stroke="rgba(100,116,139,0.28)" />
                          <text x={padL - 6} y={ty + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="600" fontFamily="JetBrains Mono, monospace">
                            {val.toFixed(1)}g
                          </text>
                        </g>
                      );
                    })}

                    {/* Lm vertical reference */}
                    <line x1={lmX} y1={padT} x2={lmX} y2={padT + plotH} stroke="var(--status-warn-border)" strokeWidth="1.6" strokeDasharray="5 4" />
                    <text x={lmX + 5} y={padT + 14} fontSize="10.5" fill="var(--status-warn-text)" fontWeight="700">
                      Lm = {populationMetrics.ref.lmCm} cm
                    </text>

                    {/* Fitted curve */}
                    <path d={curvePoints.join(' ')} fill="none" stroke="var(--primary)" strokeWidth="2.6" />

                    {/* Empirical sample dots */}
                    {samples.map((s, idx) => (
                      <circle
                        key={idx}
                        cx={xAt(s.lengthCm)}
                        cy={yAt(s.weightG)}
                        r="4.5"
                        fill="var(--sea-mint)"
                        stroke="var(--card-bg)"
                        strokeWidth="1.5"
                      />
                    ))}

                    <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-secondary)">
                      Panjang Tubuh (cm) — rentang {minL.toFixed(1)} hingga {maxL.toFixed(1)} cm
                    </text>
                  </svg>
                );
              })()
            ) : (
              <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Belum tersedia minimal 3 sampel panjang-berat untuk spesies {populationMetrics.ref.name} pada unit {activeBagan.id}.
                {isAdminView && ' Tambahkan data pada tab Logbook, CPUE & CSV.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: KONSERVASI SUMBERDAYA PERAIRAN */}
      {activeTab === 'conservation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rasio Tangkapan Juvenil (&lt; Lm)</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: catchStats.avgJuvenilePct <= 15 ? '#10b981' : '#ef4444' }}>
                {catchStats.avgJuvenilePct.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {catchStats.avgJuvenilePct <= 15
                  ? 'Aman — di bawah ambang konservasi 15%'
                  : 'Tinggi — disarankan perlebar mata jaring'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rasio Tangkapan Sampingan (Bycatch)</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', color: catchStats.avgBycatchPct <= 10 ? '#10b981' : 'var(--status-warn-text)' }}>
                {catchStats.avgBycatchPct.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {catchStats.avgBycatchPct <= 10
                  ? 'Selektif — di bawah ambang batas 10%'
                  : 'Perlu pelepasan spesies non-target saat hauling'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status Stres Suhu Laut (SST)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {ecosystemIntel?.climatology.sstStatus || 'Normal'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                SST Terkini: {ecosystemIntel ? `${ecosystemIntel.marine.seaSurfaceTempC.toFixed(1)} °C` : '--'}
              </div>
            </div>
          </div>

          {/* Mesh Size Compliance Audit Table */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Evaluasi Selektivitas Mata Jaring Waring (Mesh Size Compliance)
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Membandingkan mata jaring rata-rata dari logbook nelayan dengan rekomendasi ukuran minimum konservasi agar anakan ikan lolos dan sempat bereproduksi.
            </p>
            <div className="table-wrap-glass">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Spesies Target</th>
                    <th>Mata Jaring Dipakai</th>
                    <th>Rekomendasi Minimum</th>
                    <th>Rata-rata Juvenil</th>
                    <th>Status Selektivitas</th>
                  </tr>
                </thead>
                <tbody>
                  {meshAuditList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-secondary)' }}>
                        Belum ada data logbook tangkapan untuk audit mata jaring pada {activeBagan.id}.
                      </td>
                    </tr>
                  ) : (
                    meshAuditList.map((row) => (
                      <tr key={row.species}>
                        <td><strong>{row.name}</strong></td>
                        <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>{row.avgMesh.toFixed(1)} mm</td>
                        <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>&ge; {row.recommendedMesh.toFixed(1)} mm</td>
                        <td style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>{row.avgJuv.toFixed(1)}%</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: row.isMeshCompliant ? '#10b981' : 'var(--status-warn-text)'
                            }}
                          >
                            {row.isMeshCompliant ? 'Sesuai Standar Selektif' : 'Perlu Perbesar Mesh Size'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Practical Fisherman Conservation SOP */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.08rem', color: 'var(--primary)' }}>
              Tindakan Konservasi Praktis di Bagan Tancap (WPPNRI 712)
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              <li>Gunakan fitur <strong>Auto-Hoist BAGANOVA (misal batas 60–85 kg)</strong> agar jaring tidak dibiarkan terendam terlalu lama hingga ikan terjepit dan mati massal (mengurangi ikan rusak/terbuang).</li>
              <li>Apabila persentase anakan &lt; Lm melampaui <strong>15%</strong> dalam dua hari berturut-turut, matikan sementara lampu pemikat sekunder dan naikkan jaring lebih cepat.</li>
              <li>Lepaskan segera tangkapan sampingan dilindungi atau anakan kakap/kerapu yang masih hidup saat jaring mulai mencapai permukaan dek.</li>
              <li>Sesuaikan jadwal operasi dengan fase <strong>Bulan Mati/Selesai Purnama</strong> agar penggunaan BBM genset/aki lampu bagan lebih hemat dan ramah lingkungan.</li>
            </ul>
          </div>
        </div>
      )}

      </>
      )}

      {/* Modal Kamera Real-Time & Upload Foto Pengukur Panjang Ikan */}
      <FishLengthCameraModal
        isOpen={cameraModalOpen}
        initialSpecies={cameraTargetMode === 'admin' ? formSpecies : quickSpecies}
        onClose={() => setCameraModalOpen(false)}
        onApplySamples={(samples, detectedSpecies) => {
          if (cameraTargetMode === 'admin') {
            if (detectedSpecies) setFormSpecies(detectedSpecies);
            const formatted = samples.map((s) => `${s.lengthCm.toFixed(1)}:${s.weightG}`).join(', ');
            setFormSamplesRaw((prev) => (prev.trim() ? `${prev.trim()}, ${formatted}` : formatted));
            showToast(`${samples.length} sampel panjang:berat ditambahkan dari kamera/foto.`, 'success');
          } else {
            if (detectedSpecies) setQuickSpecies(detectedSpecies);
            setQuickSamples((prev) => [...prev, ...samples]);
            if (samples.length === 1) {
              setQuickLengthCmInput(String(samples[0].lengthCm));
            }
            showToast(
              `${samples.length} ukuran panjang ikan ditambahkan (rata-rata ${(
                samples.reduce((sum, s) => sum + s.lengthCm, 0) / samples.length
              ).toFixed(1)} cm).`,
              'success'
            );
          }
        }}
      />
    </div>
  );
};

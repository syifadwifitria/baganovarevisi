/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Referensi Spesies Ikan Bagan & Konstanta Alometrik (W = aL^b)
 */

import { BaganSpeciesId, CatchLogEntry } from '../types/bagan';

export interface SpeciesReference {
  id: BaganSpeciesId;
  name: string;
  latinName: string;
  lmCm: number; // Panjang pertama kali matang gonad (Length at first maturity)
  recommendedMeshMm: number;
  allometricA: number; // Konstanta a untuk W(g) = a * L(cm)^b
  allometricB: number; // Eksponen b untuk W(g) = a * L(cm)^b
  kkpWpp712Note: string;
  targetCatchNote: string;
}

export const SPECIES_REFERENCES: Record<BaganSpeciesId, SpeciesReference> = {
  teri_nasi: {
    id: 'teri_nasi',
    name: 'Teri Nasi',
    latinName: 'Stolephorus commersonnii',
    lmCm: 5.5,
    recommendedMeshMm: 5,
    allometricA: 0.008,
    allometricB: 3.0,
    kkpWpp712Note: 'Kelompok Pelagis Kecil WPPNRI 712 (Kepmen KP No. 19/2022) — tangkapan utama bagan Teluk Banten.',
    targetCatchNote: 'Responsif terhadap lampu 5000K pada malam bulan mati.'
  },
  teri_jengki: {
    id: 'teri_jengki',
    name: 'Teri Jengki',
    latinName: 'Encrasicholina heteroloba',
    lmCm: 8.5,
    recommendedMeshMm: 8,
    allometricA: 0.0075,
    allometricB: 3.02,
    kkpWpp712Note: 'Kelompok Pelagis Kecil WPPNRI 712 — biomassa muson peralihan hingga timur.',
    targetCatchNote: 'Menyukai arus lemah hingga sedang di perairan pantai.'
  },
  rebon: {
    id: 'rebon',
    name: 'Udang Rebon',
    latinName: 'Acetes japonicus',
    lmCm: 2.2,
    recommendedMeshMm: 4,
    allometricA: 0.0125,
    allometricB: 3.0,
    kkpWpp712Note: 'Kelompok Udang Pesisir WPPNRI 712 — perlu kontrol ketat rasio anakan ikan pelagis.',
    targetCatchNote: 'Gunakan waktu perendaman singkat agar anakan tidak banyak terjaring.'
  },
  tembang: {
    id: 'tembang',
    name: 'Ikan Tembang',
    latinName: 'Sardinella fimbriata',
    lmCm: 13.5,
    recommendedMeshMm: 22,
    allometricA: 0.0092,
    allometricB: 3.01,
    kkpWpp712Note: 'Pelagis Kecil WPPNRI 712 (Laut Jawa) — status pemanfaatan diawasi ketat KKP.',
    targetCatchNote: 'Cocok dengan target hauling 85–100 kg di bagan tancap.'
  },
  cumi: {
    id: 'cumi',
    name: 'Cumi-cumi',
    latinName: 'Uroteuthis chinensis',
    lmCm: 11.5,
    recommendedMeshMm: 20,
    allometricA: 0.036,
    allometricB: 2.91,
    kkpWpp712Note: 'Kelompok Cumi WPPNRI 712 — nilai ekonomi tinggi di TPI Karangantu.',
    targetCatchNote: 'Berkumpul di pinggir lingkar cahaya bagan pada arus tenang.'
  },
  selar: {
    id: 'selar',
    name: 'Ikan Selar',
    latinName: 'Selaroides leptolepis',
    lmCm: 12.0,
    recommendedMeshMm: 20,
    allometricA: 0.0115,
    allometricB: 3.0,
    kkpWpp712Note: 'Pelagis Kecil WPPNRI 712 — umum tertangkap bersama tembang di Teluk Banten.',
    targetCatchNote: 'Sering masuk menjelang pergantian pasang laut.'
  },
  lainnya: {
    id: 'lainnya',
    name: 'Jenis Lainnya',
    latinName: 'Hasil tangkapan pesisir lainnya',
    lmCm: 10.0,
    recommendedMeshMm: 15,
    allometricA: 0.01,
    allometricB: 3.0,
    kkpWpp712Note: 'Catatan tangkapan spesifik nelayan lokal (di luar 6 komoditas utama preset).',
    targetCatchNote: 'Catat nama spesies agar memudahkan pemantauan hasil harian.'
  }
};

export function estimateFishWeightG(species: BaganSpeciesId, lengthCm: number): number {
  const ref = SPECIES_REFERENCES[species] || SPECIES_REFERENCES.lainnya;
  const safeL = Math.max(0.5, lengthCm);
  const weight = ref.allometricA * Math.pow(safeL, ref.allometricB);
  return parseFloat(Math.max(0.05, weight).toFixed(2));
}

export function getCatchDisplayName(log: CatchLogEntry): string {
  if (log.customSpeciesName && log.customSpeciesName.trim()) {
    return log.customSpeciesName.trim();
  }
  return SPECIES_REFERENCES[log.species]?.name || log.species;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BAGANOVA — Pengukur Panjang Hasil Tangkapan Laut (Kamera & Upload Foto)
 * Fitur utama:
 * 1. Tab "Kamera Langsung" (support Mirror & ganti kamera depan/belakang) dan "Upload Foto".
 * 2. Pengenalan semantik khusus hasil tangkapan laut (ikan, teri, udang rebon, cumi, gurita, dll.)
 *    sehingga wajah, tangan, bantal, atau benda ruangan tidak pernah terdeteksi sebagai ikan.
 * 3. Pengukur manual 2 titik (Ketuk atau geser titik 1 Kepala & 2 Ekor) + patokan benda pembanding
 *    (KTP/ATM, Korek Gas, Penggaris, Koin) yang selalu siap dipakai kapan saja.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BaganSpeciesId, FishBiometricSample } from '../../types/bagan';
import { SPECIES_REFERENCES, estimateFishWeightG } from '../../data/fisheriesData';

interface PointNorm {
  x: number;
  y: number;
}

interface DetectedCatch {
  id: number;
  label: string;
  speciesId: BaganSpeciesId;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  head: PointNorm;
  tail: PointNorm;
  estimatedLengthCm: number;
  estimatedWeightG: number;
}

interface ReferencePreset {
  id: 'none' | 'ktp_atm' | 'korek' | 'penggaris_10' | 'koin_500' | 'koin_1000' | 'custom';
  label: string;
  lengthCm: number;
}

const REFERENCE_PRESETS: ReferencePreset[] = [
  { id: 'none', label: 'Pembanding: Otomatis (Deteksi Pembanding di Foto)', lengthCm: 0 },
  { id: 'ktp_atm', label: 'Pembanding: KTP / ATM (8,56 cm)', lengthCm: 8.56 },
  { id: 'korek', label: 'Pembanding: Korek Gas (8,0 cm)', lengthCm: 8.0 },
  { id: 'penggaris_10', label: 'Pembanding: Penggaris (10,0 cm)', lengthCm: 10.0 },
  { id: 'koin_500', label: 'Pembanding: Koin Rp 500 (2,7 cm)', lengthCm: 2.7 },
  { id: 'koin_1000', label: 'Pembanding: Koin Rp 1.000 (2,4 cm)', lengthCm: 2.4 },
  { id: 'custom', label: 'Pembanding: Isi Panjang Sendiri (cm)', lengthCm: 10.0 }
];

interface ApiCatchItem {
  label?: string;
  speciesId?: string;
  boxXMin?: number;
  boxYMin?: number;
  boxXMax?: number;
  boxYMax?: number;
  headX?: number;
  headY?: number;
  tailX?: number;
  tailY?: number;
  estimatedLengthCm?: number;
  estimatedWeightG?: number;
}

interface AiVisionResult {
  fishDetected?: boolean;
  speciesId?: string;
  speciesNameId?: string;
  estimatedLengthCm?: number;
  estimatedWeightG?: number;
  referenceDetected?: boolean;
  referenceName?: string;
  referenceLengthCm?: number;
  refAX?: number;
  refAY?: number;
  refBX?: number;
  refBY?: number;
  headX?: number;
  headY?: number;
  tailX?: number;
  tailY?: number;
  noteForFisherman?: string;
  catches?: ApiCatchItem[];
}

interface FishLengthCameraModalProps {
  isOpen: boolean;
  initialSpecies: BaganSpeciesId;
  onClose: () => void;
  onApplySamples: (samples: FishBiometricSample[], detectedSpecies?: BaganSpeciesId) => void;
}

const FONT_MONO = "'JetBrains Mono', monospace";

function clamp01(v: number): number {
  return Math.max(0.02, Math.min(0.98, v));
}

function normalizeSpeciesId(raw?: string, fallback: BaganSpeciesId = 'lainnya'): BaganSpeciesId {
  if (raw && raw in SPECIES_REFERENCES) {
    return raw as BaganSpeciesId;
  }
  return fallback;
}

export const FishLengthCameraModal: React.FC<FishLengthCameraModalProps> = ({
  isOpen,
  initialSpecies,
  onClose,
  onApplySamples
}) => {
  const [sourceMode, setSourceMode] = useState<'camera' | 'upload'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenDataUrl, setFrozenDataUrl] = useState<string | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [mediaAspect, setMediaAspect] = useState<number>(16 / 9);

  // Semantic AI Vision availability & results
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [aiHasScannedOnce, setAiHasScannedOnce] = useState(false);
  const [emptyScanCount, setEmptyScanCount] = useState(0);
  const [detectedCatches, setDetectedCatches] = useState<DetectedCatch[]>([]);
  const [selectedCatchIdx, setSelectedCatchIdx] = useState<number>(0);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [useAiOverrideCm, setUseAiOverrideCm] = useState<number | null>(null);

  // Manual 2-point caliper state (works on frozen snaps, uploaded photos, or live manual mode)
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [tapGroup, setTapGroup] = useState<'fish' | 'ref'>('fish');
  const [nextTapPin, setNextTapPin] = useState<'fishA' | 'fishB'>('fishA');
  const [nextRefTapPin, setNextRefTapPin] = useState<'refA' | 'refB'>('refA');
  const [selectedSpecies, setSelectedSpecies] = useState<BaganSpeciesId>(initialSpecies);
  const [refPresetId, setRefPresetId] = useState<ReferencePreset['id']>('none');
  const [customRefCm, setCustomRefCm] = useState<number>(10.0);
  const [detectedAutoRef, setDetectedAutoRef] = useState<{ name: string; lengthCm: number } | null>(null);
  const [refManuallyMoved, setRefManuallyMoved] = useState<boolean>(false);

  const [fishA, setFishA] = useState<PointNorm>({ x: 0.25, y: 0.5 });
  const [fishB, setFishB] = useState<PointNorm>({ x: 0.75, y: 0.5 });
  const [refA, setRefA] = useState<PointNorm>({ x: 0.28, y: 0.78 });
  const [refB, setRefB] = useState<PointNorm>({ x: 0.58, y: 0.78 });

  const [stageSize, setStageSize] = useState({ width: 620, height: 225 });
  const [draggingHandle, setDraggingHandle] = useState<'fishA' | 'fishB' | 'refA' | 'refB' | null>(null);

  const [measuredSamples, setMeasuredSamples] = useState<FishBiometricSample[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mediaFrameRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const aiInFlightRef = useRef<boolean>(false);
  const scanSessionRef = useRef<number>(0);
  const emptyScanStreakRef = useRef<number>(0);
  const hasDetectedRef = useRef<boolean>(false);
  const lastScannedSigRef = useRef<Uint8Array | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScanEndRef = useRef<number>(0);
  const rateLimitUntilRef = useRef<number>(0);
  const mirrorStateRef = useRef<boolean>(false);
  mirrorStateRef.current = isMirrored;
  const [rateLimitedNotice, setRateLimitedNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    scanSessionRef.current += 1;
    emptyScanStreakRef.current = 0;
    hasDetectedRef.current = false;
    lastScannedSigRef.current = null;
    lastScanTimestampRef.current = 0;
    lastScanEndRef.current = 0;
    rateLimitUntilRef.current = 0;
    setRateLimitedNotice(false);
    setSelectedSpecies(initialSpecies);
    setMeasuredSamples([]);
    setDetectedCatches([]);
    setSelectedCatchIdx(0);
    setAiNote(null);
    setAiError(null);
    setAiHasScannedOnce(false);
    setEmptyScanCount(0);
    setIsLiveScanning(false);
    setUseAiOverrideCm(null);
    setDetectedAutoRef(null);
    setRefManuallyMoved(false);
    setTapGroup('fish');
    setIsFrozen(false);
    setFrozenDataUrl(null);
    setManualMode(false);
    setNextTapPin('fishA');
    setNextRefTapPin('refA');

    let cancelled = false;
    fetch('/api/ai-vision-status')
      .then((r) => (r.ok ? r.json() : { aiConfigured: false }))
      .then((d: { aiConfigured?: boolean }) => {
        if (!cancelled) {
          setAiConfigured(Boolean(d?.aiConfigured));
        }
      })
      .catch(() => {
        if (!cancelled) setAiConfigured(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, initialSpecies]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser tidak mendukung kamera langsung. Silakan pakai tab Upload Foto.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraActive(true);
    } catch {
      setCameraError('Kamera tidak bisa dibuka atau izin ditolak. Gunakan tab Upload Foto di atas.');
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    if (sourceMode === 'camera' && !isFrozen) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, sourceMode, isFrozen, startCamera, stopCamera]);

  // Sync mediaAspect smoothly when live video frames arrive
  useEffect(() => {
    if (!isOpen || sourceMode !== 'camera' || isFrozen || !cameraActive) return;
    const syncAspect = () => {
      const v = videoRef.current;
      if (v && v.videoWidth > 0 && v.videoHeight > 0) {
        const nat = v.videoWidth / v.videoHeight;
        setMediaAspect((prev) => (Math.abs(prev - nat) > 0.02 ? nat : prev));
      }
    };
    syncAspect();
    const timer = window.setInterval(syncAspect, 400);
    return () => window.clearInterval(timer);
  }, [isOpen, sourceMode, isFrozen, cameraActive]);

  useEffect(() => {
    if (!isOpen) return;
    const updateDims = () => {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setStageSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateDims();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateDims) : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', updateDims);
    return () => {
      window.removeEventListener('resize', updateDims);
      ro?.disconnect();
    };
  }, [isOpen, sourceMode, frozenDataUrl, uploadedDataUrl]);

  const mediaBox = useMemo(() => {
    const sw = Math.max(100, stageSize.width);
    const sh = Math.max(100, stageSize.height);
    const safeAspect = Math.max(0.5, Math.min(2.4, mediaAspect || 16 / 9));
    if (sw / sh > safeAspect) {
      const drawH = sh;
      const drawW = drawH * safeAspect;
      return { left: (sw - drawW) / 2, top: 0, width: drawW, height: drawH };
    }
    const drawW = sw;
    const drawH = drawW / safeAspect;
    return { left: 0, top: (sh - drawH) / 2, width: drawW, height: drawH };
  }, [stageSize, mediaAspect]);

  const activePreset = useMemo(
    () => REFERENCE_PRESETS.find((p) => p.id === refPresetId) || REFERENCE_PRESETS[0],
    [refPresetId]
  );

  const effectiveRefCm = useMemo(() => {
    if (refPresetId === 'custom') {
      return Math.max(0.5, Number.isFinite(customRefCm) ? customRefCm : 10.0);
    }
    if (activePreset.id !== 'none' && activePreset.lengthCm > 0) {
      return activePreset.lengthCm;
    }
    if (detectedAutoRef && detectedAutoRef.lengthCm > 0) {
      return detectedAutoRef.lengthCm;
    }
    return 0;
  }, [refPresetId, customRefCm, activePreset, detectedAutoRef]);

  const showRefBar = refPresetId !== 'none' || Boolean(detectedAutoRef);

  const pxPerCm = useMemo(() => {
    if (effectiveRefCm > 0) {
      const refPx = Math.max(
        8,
        Math.hypot((refB.x - refA.x) * mediaBox.width, (refB.y - refA.y) * mediaBox.height)
      );
      return Math.max(1, refPx / effectiveRefCm);
    }
    return Math.max(1, mediaBox.width / 25.0);
  }, [effectiveRefCm, refA, refB, mediaBox.width, mediaBox.height]);

  const measureChordCm = useCallback(
    (p1: PointNorm, p2: PointNorm): number => {
      const px = Math.hypot((p2.x - p1.x) * mediaBox.width, (p2.y - p1.y) * mediaBox.height);
      return parseFloat(Math.max(0.5, px / pxPerCm).toFixed(1));
    },
    [mediaBox.width, mediaBox.height, pxPerCm]
  );

  const selectedCatch = detectedCatches[selectedCatchIdx] || null;

  const effectiveLengthCm = useMemo(() => {
    if (effectiveRefCm === 0 && useAiOverrideCm && useAiOverrideCm > 0 && !manualMode) {
      return parseFloat(useAiOverrideCm.toFixed(1));
    }
    return measureChordCm(fishA, fishB);
  }, [effectiveRefCm, useAiOverrideCm, manualMode, measureChordCm, fishA, fishB]);

  const speciesRef = SPECIES_REFERENCES[selectedSpecies] || SPECIES_REFERENCES.lainnya;
  const estimatedWeightG = useMemo(() => {
    if (
      effectiveRefCm === 0 &&
      !manualMode &&
      selectedCatch &&
      selectedCatch.estimatedWeightG > 0 &&
      selectedCatch.speciesId === selectedSpecies
    ) {
      return parseFloat(selectedCatch.estimatedWeightG.toFixed(2));
    }
    return estimateFishWeightG(selectedSpecies, effectiveLengthCm);
  }, [effectiveRefCm, manualMode, selectedCatch, selectedSpecies, effectiveLengthCm]);

  const isMature = effectiveLengthCm >= speciesRef.lmCm;

  const updatePointFromClient = (
    clientX: number,
    clientY: number,
    targetPin: 'fishA' | 'fishB' | 'refA' | 'refB'
  ) => {
    if (!mediaFrameRef.current) return;
    const rect = mediaFrameRef.current.getBoundingClientRect();
    const nx = clamp01((clientX - rect.left) / Math.max(1, rect.width));
    const ny = clamp01((clientY - rect.top) / Math.max(1, rect.height));

    if (targetPin === 'fishA' || targetPin === 'fishB') {
      setManualMode(true);
      setUseAiOverrideCm(null);
    }

    if (targetPin === 'fishA') setFishA({ x: nx, y: ny });
    else if (targetPin === 'fishB') setFishB({ x: nx, y: ny });
    else if (targetPin === 'refA') {
      setRefManuallyMoved(true);
      setUseAiOverrideCm(null);
      setRefA({ x: nx, y: ny });
    } else if (targetPin === 'refB') {
      setRefManuallyMoved(true);
      setUseAiOverrideCm(null);
      setRefB({ x: nx, y: ny });
    }
  };

  const computeFrameSignature = (
    sourceCanvas: HTMLCanvasElement
  ): Uint8Array | null => {
    const sw = 32;
    const sh = 18;
    const tiny = document.createElement('canvas');
    tiny.width = sw;
    tiny.height = sh;
    const tctx = tiny.getContext('2d', { willReadFrequently: true });
    if (!tctx) return null;
    tctx.drawImage(sourceCanvas, 0, 0, sw, sh);
    const data = tctx.getImageData(0, 0, sw, sh).data;
    const sig = new Uint8Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      const p = i * 4;
      sig[i] = Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
    }
    return sig;
  };

  const signatureDiff = (
    a: Uint8Array | null,
    b: Uint8Array | null
  ): { overall: number; center: number } => {
    if (!a || !b || a.length !== b.length) return { overall: 999, center: 999 };
    const sw = 32;
    const sh = 18;
    let sum = 0;
    let centerSum = 0;
    let centerCount = 0;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = y * sw + x;
        const d = Math.abs(a[idx] - b[idx]);
        sum += d;
        if (x >= 8 && x < 24 && y >= 4 && y < 14) {
          centerSum += d;
          centerCount += 1;
        }
      }
    }
    return {
      overall: sum / a.length,
      center: centerCount > 0 ? centerSum / centerCount : sum / a.length
    };
  };

  const captureLiveFrameWithMeta = useCallback((maxW = 512, quality = 0.72): {
    dataUrl: string;
    width: number;
    height: number;
    signature: Uint8Array | null;
  } | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }
    const scale = Math.min(1, maxW / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return {
      dataUrl: canvas.toDataURL('image/jpeg', quality),
      width: canvas.width,
      height: canvas.height,
      signature: computeFrameSignature(canvas)
    };
  }, [isMirrored]);

  const applySelectedCatch = useCallback((catchItem: DetectedCatch) => {
    setFishA(catchItem.head);
    setFishB(catchItem.tail);
    setSelectedSpecies(catchItem.speciesId);
    setUseAiOverrideCm(catchItem.estimatedLengthCm > 0 ? catchItem.estimatedLengthCm : null);
    setManualMode(false);
  }, []);

  const analyzeImageWithAi = useCallback(
    async (
      imageDataUrl: string,
      silentLiveScan = false,
      dims?: { width: number; height: number }
    ) => {
      if (aiInFlightRef.current) return;
      const mySession = scanSessionRef.current;
      const capturedMirrored = mirrorStateRef.current;
      aiInFlightRef.current = true;
      lastScanTimestampRef.current = Date.now();
      setIsLiveScanning(true);
      if (!silentLiveScan) {
        setAiLoading(true);
        setAiError(null);
        setAiNote(null);
      }

      try {
        const refPromptLabel =
          refPresetId === 'custom'
            ? `Pembanding custom ukuran ${effectiveRefCm} cm`
            : activePreset.id !== 'none'
            ? activePreset.label
            : '';

        const resp = await fetch('/api/measure-fish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageDataUrl,
            mimeType: 'image/jpeg',
            referenceLabel: refPromptLabel,
            referenceCm: activePreset.id !== 'none' ? effectiveRefCm : 0,
            imageWidth: dims?.width || 512,
            imageHeight: dims?.height || 288
          })
        });

        const data = (await resp.json()) as AiVisionResult & { error?: string };
        if (scanSessionRef.current !== mySession) return;

        if (!resp.ok) {
          if (resp.status === 503 || resp.status === 403) {
            setAiConfigured(false);
          } else if (resp.status === 429) {
            rateLimitUntilRef.current = Date.now() + 12000;
            setRateLimitedNotice(true);
          }
          if (!silentLiveScan) {
            throw new Error(data.error || 'Gagal mendeteksi hasil tangkapan laut.');
          }
          return;
        }

        setRateLimitedNotice(false);
        setAiHasScannedOnce(true);

        const flipXIfMirrorChanged = (xVal: number): number =>
          silentLiveScan && mirrorStateRef.current !== capturedMirrored ? 1000 - xVal : xVal;

        // Lock onto detected reference object if present & not manually overridden
        if (
          !refManuallyMoved &&
          data.referenceDetected &&
          typeof data.refAX === 'number' &&
          typeof data.refAY === 'number' &&
          typeof data.refBX === 'number' &&
          typeof data.refBY === 'number'
        ) {
          setRefA({ x: clamp01(flipXIfMirrorChanged(data.refAX) / 1000), y: clamp01(data.refAY / 1000) });
          setRefB({ x: clamp01(flipXIfMirrorChanged(data.refBX) / 1000), y: clamp01(data.refBY / 1000) });
          if (
            refPresetId === 'none' &&
            typeof data.referenceLengthCm === 'number' &&
            data.referenceLengthCm > 0
          ) {
            setDetectedAutoRef({
              name: (data.referenceName || 'Pembanding').trim(),
              lengthCm: parseFloat(data.referenceLengthCm.toFixed(2))
            });
          }
        } else if (refPresetId === 'none' && !refManuallyMoved) {
          setDetectedAutoRef(null);
        }

        const rawCatches = Array.isArray(data.catches) ? data.catches : [];
        const normalized: DetectedCatch[] = [];

        rawCatches.forEach((c, idx) => {
          if (
            typeof c.headX !== 'number' ||
            typeof c.headY !== 'number' ||
            typeof c.tailX !== 'number' ||
            typeof c.tailY !== 'number'
          ) {
            return;
          }
          const needsMirror = silentLiveScan && mirrorStateRef.current !== capturedMirrored;
          const mapX = (v: number) => clamp01((needsMirror ? 1000 - v : v) / 1000);
          let hx = mapX(c.headX);
          let hy = clamp01(c.headY / 1000);
          let tx = mapX(c.tailX);
          let ty = clamp01(c.tailY / 1000);
          const bx1 =
            typeof c.boxXMin === 'number' ? mapX(c.boxXMin) : Math.max(0.02, Math.min(hx, tx) - 0.03);
          const bx2 =
            typeof c.boxXMax === 'number' ? mapX(c.boxXMax) : Math.min(0.98, Math.max(hx, tx) + 0.03);
          const rawMinX = Math.min(bx1, bx2);
          const rawMaxX = Math.max(bx1, bx2);
          const rawMinY =
            typeof c.boxYMin === 'number' ? clamp01(c.boxYMin / 1000) : Math.max(0.02, Math.min(hy, ty) - 0.03);
          const rawMaxY =
            typeof c.boxYMax === 'number' ? clamp01(c.boxYMax / 1000) : Math.min(0.98, Math.max(hy, ty) + 0.03);

          const minX = Math.min(rawMinX, rawMaxX - 0.03);
          const minY = Math.min(rawMinY, rawMaxY - 0.03);
          const maxX = Math.max(rawMaxX, minX + 0.03);
          const maxY = Math.max(rawMaxY, minY + 0.03);

          // Ensure head & tail endpoints stay coherent with the bounding box
          hx = Math.max(minX - 0.015, Math.min(maxX + 0.015, hx));
          tx = Math.max(minX - 0.015, Math.min(maxX + 0.015, tx));
          hy = Math.max(minY - 0.015, Math.min(maxY + 0.015, hy));
          ty = Math.max(minY - 0.015, Math.min(maxY + 0.015, ty));

          const spId = normalizeSpeciesId(c.speciesId, initialSpecies);
          const lenCm =
            typeof c.estimatedLengthCm === 'number' && c.estimatedLengthCm > 0
              ? parseFloat(c.estimatedLengthCm.toFixed(1))
              : 0;
          const wtG =
            typeof c.estimatedWeightG === 'number' && c.estimatedWeightG > 0
              ? parseFloat(c.estimatedWeightG.toFixed(2))
              : estimateFishWeightG(spId, lenCm || 8);

          normalized.push({
            id: idx + 1,
            label: (c.label || SPECIES_REFERENCES[spId].name).trim(),
            speciesId: spId,
            bbox: { minX, minY, maxX, maxY },
            head: { x: hx, y: hy },
            tail: { x: tx, y: ty },
            estimatedLengthCm: lenCm,
            estimatedWeightG: wtG
          });
        });

        // Fallback if top-level fishDetected is true without catches[]
        if (
          normalized.length === 0 &&
          data.fishDetected &&
          typeof data.headX === 'number' &&
          typeof data.headY === 'number' &&
          typeof data.tailX === 'number' &&
          typeof data.tailY === 'number'
        ) {
          const spId = normalizeSpeciesId(data.speciesId, initialSpecies);
          const hx = clamp01(data.headX / 1000);
          const hy = clamp01(data.headY / 1000);
          const tx = clamp01(data.tailX / 1000);
          const ty = clamp01(data.tailY / 1000);
          const lenCm =
            typeof data.estimatedLengthCm === 'number' && data.estimatedLengthCm > 0
              ? parseFloat(data.estimatedLengthCm.toFixed(1))
              : 0;
          normalized.push({
            id: 1,
            label: (data.speciesNameId || SPECIES_REFERENCES[spId].name).trim(),
            speciesId: spId,
            bbox: {
              minX: Math.max(0.02, Math.min(hx, tx) - 0.04),
              minY: Math.max(0.02, Math.min(hy, ty) - 0.04),
              maxX: Math.min(0.98, Math.max(hx, tx) + 0.04),
              maxY: Math.min(0.98, Math.max(hy, ty) + 0.04)
            },
            head: { x: hx, y: hy },
            tail: { x: tx, y: ty },
            estimatedLengthCm: lenCm,
            estimatedWeightG:
              typeof data.estimatedWeightG === 'number' && data.estimatedWeightG > 0
                ? data.estimatedWeightG
                : estimateFishWeightG(spId, lenCm || 8)
          });
        }

        if (data.fishDetected && normalized.length > 0) {
          emptyScanStreakRef.current = 0;
          hasDetectedRef.current = true;
          setEmptyScanCount(0);
          setDetectedCatches(normalized);
          setSelectedCatchIdx(0);
          applySelectedCatch(normalized[0]);
          setAiNote(
            silentLiveScan
              ? null
              : data.noteForFisherman ||
                  `Terdeteksi ${normalized.length} hasil tangkapan laut (${normalized[0].label}).`
          );
          setAiError(null);
        } else {
          emptyScanStreakRef.current += 1;
          setEmptyScanCount(emptyScanStreakRef.current);

          if (!silentLiveScan || !hasDetectedRef.current || emptyScanStreakRef.current >= 2) {
            hasDetectedRef.current = false;
            setDetectedCatches([]);
            setSelectedCatchIdx(0);
            setUseAiOverrideCm(null);
          }

          if (!silentLiveScan) {
            setAiNote(
              data.noteForFisherman ||
                'Belum terlihat hasil tangkapan laut di gambar. Ketuk atau geser titik 1 & 2 untuk ukur manual.'
            );
          } else {
            setAiNote(null);
          }
        }
      } catch (err) {
        if (!silentLiveScan && scanSessionRef.current === mySession) {
          setAiError(err instanceof Error ? err.message : 'Gagal menganalisis foto tangkapan laut.');
        }
      } finally {
        aiInFlightRef.current = false;
        lastScanEndRef.current = Date.now();
        setIsLiveScanning(false);
        if (!silentLiveScan) {
          setAiLoading(false);
        }
      }
    },
    [activePreset.id, activePreset.label, applySelectedCatch, effectiveRefCm, initialSpecies, refManuallyMoved, refPresetId]
  );

  // Smart center-weighted scene-change live scanning: fast on new catches, zero RPM spam when steady
  useEffect(() => {
    if (
      !isOpen ||
      aiConfigured !== true ||
      sourceMode !== 'camera' ||
      isFrozen ||
      !cameraActive ||
      manualMode
    ) {
      return;
    }

    let cancelled = false;
    const firstTimer = window.setTimeout(() => {
      if (cancelled || Date.now() < rateLimitUntilRef.current) return;
      const snap = captureLiveFrameWithMeta(512, 0.72);
      if (snap) {
        lastScannedSigRef.current = snap.signature;
        void analyzeImageWithAi(snap.dataUrl, true, { width: snap.width, height: snap.height });
      }
    }, 250);

    const watchInterval = window.setInterval(() => {
      if (cancelled || aiInFlightRef.current || Date.now() < rateLimitUntilRef.current) return;
      const snap = captureLiveFrameWithMeta(512, 0.72);
      if (!snap) return;

      const now = Date.now();
      const sinceEnd = now - lastScanEndRef.current;
      const diff = signatureDiff(lastScannedSigRef.current, snap.signature);
      const centerMoved = diff.center >= 3.8 || diff.overall >= 3.0;
      const bigSceneChange = diff.center >= 6.0 || diff.overall >= 5.0;

      const shouldScanWhileEmpty =
        !hasDetectedRef.current && ((centerMoved && sinceEnd >= 1500) || sinceEnd >= 4200);
      const shouldScanWhileDetected =
        hasDetectedRef.current && bigSceneChange && sinceEnd >= 3200;

      if (shouldScanWhileEmpty || shouldScanWhileDetected) {
        lastScannedSigRef.current = snap.signature;
        void analyzeImageWithAi(snap.dataUrl, true, { width: snap.width, height: snap.height });
      }
    }, 550);

    return () => {
      cancelled = true;
      window.clearTimeout(firstTimer);
      window.clearInterval(watchInterval);
    };
  }, [
    isOpen,
    aiConfigured,
    sourceMode,
    isFrozen,
    cameraActive,
    manualMode,
    captureLiveFrameWithMeta,
    analyzeImageWithAi
  ]);

  const flipDataUrlHorizontally = (dataUrl: string, onDone: (flippedUrl: string) => void) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      onDone(c.toDataURL('image/jpeg', 0.86));
    };
    img.src = dataUrl;
  };

  const mirrorAllOverlaysHorizontally = () => {
    setDetectedCatches((prev) =>
      prev.map((c) => ({
        ...c,
        bbox: {
          ...c.bbox,
          minX: clamp01(1 - c.bbox.maxX),
          maxX: clamp01(1 - c.bbox.minX)
        },
        head: { ...c.head, x: clamp01(1 - c.head.x) },
        tail: { ...c.tail, x: clamp01(1 - c.tail.x) }
      }))
    );
    setFishA((p) => ({ ...p, x: clamp01(1 - p.x) }));
    setFishB((p) => ({ ...p, x: clamp01(1 - p.x) }));
    setRefA((p) => ({ ...p, x: clamp01(1 - p.x) }));
    setRefB((p) => ({ ...p, x: clamp01(1 - p.x) }));
  };

  const handleToggleMirror = () => {
    if (sourceMode === 'camera' && !isFrozen) {
      setIsMirrored((prev) => !prev);
      mirrorAllOverlaysHorizontally();
      return;
    }

    const activeUrl = sourceMode === 'upload' ? uploadedDataUrl : frozenDataUrl;
    if (activeUrl) {
      flipDataUrlHorizontally(activeUrl, (flipped) => {
        if (sourceMode === 'upload') setUploadedDataUrl(flipped);
        else setFrozenDataUrl(flipped);
        setIsMirrored((prev) => !prev);
        mirrorAllOverlaysHorizontally();
      });
    } else {
      setIsMirrored((prev) => !prev);
    }
  };

  const handleSwitchFacingCamera = () => {
    setFacingMode((prev) => {
      const next = prev === 'environment' ? 'user' : 'environment';
      setIsMirrored(next === 'user');
      return next;
    });
  };

  const handleToggleFreeze = () => {
    if (isFrozen) {
      scanSessionRef.current += 1;
      lastScannedSigRef.current = null;
      setIsFrozen(false);
      setFrozenDataUrl(null);
      setAiNote(null);
      setAiError(null);
      setUseAiOverrideCm(null);
      setDetectedCatches([]);
      setManualMode(false);
      return;
    }

    const snap = captureLiveFrameWithMeta(768, 0.82);
    if (!snap) return;
    scanSessionRef.current += 1;
    setFrozenDataUrl(snap.dataUrl);
    setIsFrozen(true);

    if (aiConfigured === true) {
      setManualMode(false);
      void analyzeImageWithAi(snap.dataUrl, false, { width: snap.width, height: snap.height });
    } else {
      setManualMode(true);
      setAiNote('Ketuk ujung kepala & ekor hasil tangkapan di foto (atau geser titik 1 & 2).');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
          scanSessionRef.current += 1;
          emptyScanStreakRef.current = 0;
          hasDetectedRef.current = false;
          setEmptyScanCount(0);
          setMediaAspect(canvas.width / canvas.height);
          setUploadedDataUrl(dataUrl);
          setSourceMode('upload');
          setDetectedCatches([]);
          setSelectedCatchIdx(0);
          setAiNote(null);
          setAiError(null);
          setUseAiOverrideCm(null);
          setFishA({ x: 0.25, y: 0.5 });
          setFishB({ x: 0.75, y: 0.5 });

          if (aiConfigured === true) {
            setManualMode(false);
            void analyzeImageWithAi(dataUrl, false, { width: canvas.width, height: canvas.height });
          } else {
            setManualMode(true);
            setAiNote('Ketuk langsung ujung kepala & ekor hasil tangkapan di foto, lalu atur titik 1 & 2.');
          }
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRunAiAnalysis = async () => {
    let imageDataUrl = sourceMode === 'upload' ? uploadedDataUrl : frozenDataUrl;
    let dims: { width: number; height: number } | undefined;
    if (!imageDataUrl && sourceMode === 'camera') {
      const snap = captureLiveFrameWithMeta(768, 0.82);
      if (snap) {
        imageDataUrl = snap.dataUrl;
        dims = { width: snap.width, height: snap.height };
        setFrozenDataUrl(snap.dataUrl);
        setIsFrozen(true);
      }
    }

    if (!imageDataUrl) {
      setAiError('Ambil atau pilih foto tangkapan laut dulu.');
      return;
    }

    rateLimitUntilRef.current = 0;
    setRateLimitedNotice(false);
    setManualMode(false);
    await analyzeImageWithAi(imageDataUrl, false, dims);
  };

  const handleAddSampleToBatch = () => {
    setMeasuredSamples((prev) => [
      ...prev,
      { lengthCm: effectiveLengthCm, weightG: estimatedWeightG }
    ]);
  };

  const handleAddAllDetectedCatches = () => {
    if (detectedCatches.length === 0) return;
    const items: FishBiometricSample[] = detectedCatches.map((c) => {
      const len = effectiveRefCm === 0 && c.estimatedLengthCm > 0
        ? c.estimatedLengthCm
        : measureChordCm(c.head, c.tail);
      const wt =
        effectiveRefCm === 0 && c.estimatedWeightG > 0
          ? c.estimatedWeightG
          : estimateFishWeightG(c.speciesId, len);
      return { lengthCm: parseFloat(len.toFixed(1)), weightG: parseFloat(wt.toFixed(2)) };
    });
    setMeasuredSamples((prev) => [...prev, ...items]);
  };

  const handleConfirmApply = () => {
    const finalSamples =
      measuredSamples.length > 0
        ? measuredSamples
        : [{ lengthCm: effectiveLengthCm, weightG: estimatedWeightG }];
    stopCamera();
    onApplySamples(finalSamples, detectedCatches.length > 0 ? selectedSpecies : undefined);
    onClose();
  };

  if (!isOpen) return null;

  const hasPhotoLoaded =
    (sourceMode === 'upload' && Boolean(uploadedDataUrl)) ||
    (sourceMode === 'camera' && isFrozen && Boolean(frozenDataUrl));

  const isLiveCamera = sourceMode === 'camera' && !isFrozen && !cameraError;
  const hasActiveCaliper =
    detectedCatches.length > 0 || manualMode || hasPhotoLoaded || showRefBar;
  const showOverlay = (isLiveCamera || hasPhotoLoaded) && hasActiveCaliper;

  const showMeasurementBox =
    detectedCatches.length > 0 || manualMode || hasPhotoLoaded;

  const showScanningSpinner =
    (isLiveScanning || aiLoading || (isLiveCamera && aiConfigured === true && !aiHasScannedOnce && !manualMode)) &&
    !cameraError;

  const statusBadgeText =
    sourceMode === 'upload'
      ? aiLoading
        ? 'Mendeteksi foto tangkapan...'
        : detectedCatches.length > 0
        ? `Terdeteksi ${detectedCatches.length} tangkapan laut`
        : 'Foto Diunggah — Ketuk Kepala & Ekor'
      : isFrozen
      ? aiLoading
        ? 'Mendeteksi jepretan...'
        : detectedCatches.length > 0
        ? `Terdeteksi ${detectedCatches.length} tangkapan laut`
        : 'Foto Dijepret — Ketuk Kepala & Ekor'
      : detectedCatches.length > 0
      ? `Terdeteksi ${detectedCatches.length} tangkapan laut`
      : aiConfigured === true
      ? !aiHasScannedOnce || emptyScanCount < 2
        ? 'Memindai kamera...'
        : 'Arahkan kamera ke tangkapan laut'
      : manualMode
      ? 'Mode Ukur Manual (Titik 1 & 2)'
      : 'Arahkan ke ikan, lalu klik Jepret';

  return createPortal(
    <div
      className="baganova-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Ukur Panjang Tangkapan Laut"
      onClick={() => {
        stopCamera();
        onClose();
      }}
      style={{ zIndex: 25000, padding: '8px' }}
    >
      <div
        className="baganova-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '650px',
          width: '100%',
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
          padding: '12px 14px'
        }}
      >
        {/* Header Ringkas */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.04rem', fontWeight: 800, color: 'var(--primary)' }}>
              <i className="fas fa-camera" style={{ marginRight: '7px' }}></i>
              Ukur Panjang Hasil Tangkapan
            </h3>
            <p style={{ margin: '1px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Arahkan kamera atau upload foto hasil tangkapan laut untuk mengukur panjangnya (cm).
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Tutup"
            style={{ minHeight: '32px', padding: '4px 10px' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 2 Pilihan Sederhana: Kamera Langsung vs Upload Foto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <button
            type="button"
            className={sourceMode === 'camera' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => {
              scanSessionRef.current += 1;
              setSourceMode('camera');
              setIsFrozen(false);
              setFrozenDataUrl(null);
              setDetectedCatches([]);
              setAiError(null);
              setAiNote(null);
              setManualMode(false);
            }}
            style={{ minHeight: '36px', fontSize: '0.86rem', padding: '6px 10px' }}
          >
            <i className="fas fa-video"></i> Kamera Langsung
          </button>

          <button
            type="button"
            className={sourceMode === 'upload' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => {
              setSourceMode('upload');
              setAiError(null);
              if (!uploadedDataUrl) {
                fileInputRef.current?.click();
              }
            }}
            style={{ minHeight: '36px', fontSize: '0.86rem', padding: '6px 10px' }}
          >
            <i className="fas fa-image"></i> Upload Foto
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Layar Kamera / Foto */}
        <div
          ref={stageRef}
          onPointerMove={(e) => {
            if (draggingHandle) {
              e.preventDefault();
              updatePointFromClient(e.clientX, e.clientY, draggingHandle);
            }
          }}
          onPointerUp={() => setDraggingHandle(null)}
          onPointerCancel={() => setDraggingHandle(null)}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            minHeight: '175px',
            maxHeight: '225px',
            background: '#040e1d',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1.5px solid var(--card-border)',
            touchAction: 'none',
            userSelect: 'none',
            marginBottom: '8px'
          }}
        >
          {/* Frame 1:1 sesuai rasio asli kamera/foto */}
          <div
            ref={mediaFrameRef}
            onClick={(e) => {
              if (draggingHandle) return;
              if (!hasPhotoLoaded && !manualMode && !(tapGroup === 'ref' && showRefBar)) return;
              if (tapGroup === 'ref' && showRefBar) {
                updatePointFromClient(e.clientX, e.clientY, nextRefTapPin);
                setNextRefTapPin((prev) => (prev === 'refA' ? 'refB' : 'refA'));
              } else {
                updatePointFromClient(e.clientX, e.clientY, nextTapPin);
                setNextTapPin((prev) => (prev === 'fishA' ? 'fishB' : 'fishA'));
              }
            }}
            style={{
              position: 'absolute',
              left: `${mediaBox.left}px`,
              top: `${mediaBox.top}px`,
              width: `${mediaBox.width}px`,
              height: `${mediaBox.height}px`,
              overflow: 'hidden',
              cursor: hasPhotoLoaded || manualMode ? 'crosshair' : 'default'
            }}
          >
            {sourceMode === 'camera' && !isFrozen && (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  display: 'block',
                  transform: isMirrored ? 'scaleX(-1)' : 'none'
                }}
              />
            )}

            {sourceMode === 'camera' && isFrozen && frozenDataUrl && (
              <img
                src={frozenDataUrl}
                alt="Hasil jepretan tangkapan"
                style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
              />
            )}

            {sourceMode === 'upload' && uploadedDataUrl && (
              <img
                src={uploadedDataUrl}
                alt="Foto tangkapan unggahan"
                style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
              />
            )}

            {/* SVG Garis Pengukur + Kotak Deteksi Semantik Biota Laut */}
            {showOverlay && (
              <svg
                viewBox={`0 0 ${mediaBox.width} ${mediaBox.height}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 3
                }}
              >
                {/* Kotak semantik biota laut (hanya dari hasil AI vision) */}
                {detectedCatches.map((item, idx) => {
                  const isPrimary = idx === selectedCatchIdx;
                  const itemCm =
                    effectiveRefCm === 0 && item.estimatedLengthCm > 0
                      ? item.estimatedLengthCm
                      : measureChordCm(item.head, item.tail);
                  const x1 = item.bbox.minX * mediaBox.width;
                  const y1 = item.bbox.minY * mediaBox.height;
                  const bw = Math.max(16, (item.bbox.maxX - item.bbox.minX) * mediaBox.width);
                  const bh = Math.max(16, (item.bbox.maxY - item.bbox.minY) * mediaBox.height);
                  const boxColor = isPrimary ? '#00e5d0' : '#38bdf8';
                  const tagText = `${item.label} · ${itemCm.toFixed(1)} cm`;
                  const tagW = Math.min(mediaBox.width - 12, Math.max(96, tagText.length * 6.4 + 14));
                  const tagX = Math.min(
                    mediaBox.width - tagW / 2 - 4,
                    Math.max(tagW / 2 + 4, x1 + bw / 2)
                  );
                  const tagY = y1 > 24 ? y1 - 6 : Math.min(mediaBox.height - 6, y1 + bh + 18);

                  return (
                    <g key={item.id}>
                      <rect
                        x={x1}
                        y={y1}
                        width={bw}
                        height={bh}
                        rx="6"
                        fill={isPrimary ? 'rgba(0, 229, 208, 0.09)' : 'rgba(56, 189, 248, 0.06)'}
                        stroke={boxColor}
                        strokeWidth={isPrimary ? '2' : '1.4'}
                      />
                      <rect
                        x={tagX - tagW / 2}
                        y={tagY - 16}
                        width={tagW}
                        height="18"
                        rx="5"
                        fill="rgba(2, 16, 36, 0.92)"
                        stroke={boxColor}
                        strokeWidth="1"
                      />
                      <text
                        x={tagX}
                        y={tagY - 4}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="800"
                        fill={boxColor}
                        fontFamily={FONT_MONO}
                      >
                        {tagText}
                      </text>
                    </g>
                  );
                })}

                {/* Garis Kuning Pembanding (KTP / Korek / Penggaris / Koin / Custom) */}
                {showRefBar && (
                  <g>
                    <line
                      x1={refA.x * mediaBox.width}
                      y1={refA.y * mediaBox.height}
                      x2={refB.x * mediaBox.width}
                      y2={refB.y * mediaBox.height}
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="5 3"
                    />
                    <rect
                      x={Math.max(4, Math.min(mediaBox.width - 112, ((refA.x + refB.x) / 2) * mediaBox.width - 54))}
                      y={Math.max(4, ((refA.y + refB.y) / 2) * mediaBox.height - 20)}
                      width="108"
                      height="17"
                      rx="5"
                      fill="rgba(15, 23, 42, 0.92)"
                      stroke="#f59e0b"
                      strokeWidth="1"
                    />
                    <text
                      x={Math.max(58, Math.min(mediaBox.width - 58, ((refA.x + refB.x) / 2) * mediaBox.width))}
                      y={Math.max(16, ((refA.y + refB.y) / 2) * mediaBox.height - 8)}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#fbbf24"
                    >
                      Pembanding {effectiveRefCm} cm
                    </text>
                  </g>
                )}

                {/* Garis Utama Kepala - Ekor */}
                {(detectedCatches.length > 0 || manualMode || hasPhotoLoaded) && (
                  <>
                    <line
                      x1={fishA.x * mediaBox.width}
                      y1={fishA.y * mediaBox.height}
                      x2={fishB.x * mediaBox.width}
                      y2={fishB.y * mediaBox.height}
                      stroke="#00e5d0"
                      strokeWidth="3.2"
                    />
                    <rect
                      x={Math.max(4, Math.min(mediaBox.width - 88, ((fishA.x + fishB.x) / 2) * mediaBox.width - 42))}
                      y={Math.max(4, ((fishA.y + fishB.y) / 2) * mediaBox.height - 26)}
                      width="84"
                      height="21"
                      rx="7"
                      fill="rgba(2, 16, 36, 0.92)"
                      stroke="#00e5d0"
                      strokeWidth="1.4"
                    />
                    <text
                      x={Math.max(46, Math.min(mediaBox.width - 46, ((fishA.x + fishB.x) / 2) * mediaBox.width))}
                      y={Math.max(18, ((fishA.y + fishB.y) / 2) * mediaBox.height - 12)}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="800"
                      fill="#00e5d0"
                      fontFamily={FONT_MONO}
                    >
                      {effectiveLengthCm.toFixed(1)} cm
                    </text>
                  </>
                )}
              </svg>
            )}

            {/* Area klik untuk memilih biota laut lain bila terdeteksi >1 */}
            {showOverlay &&
              detectedCatches.length > 1 &&
              detectedCatches.map((item, idx) => (
                <button
                  key={`hit-${item.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCatchIdx(idx);
                    applySelectedCatch(item);
                  }}
                  aria-label={`Pilih ${item.label}`}
                  style={{
                    position: 'absolute',
                    left: `${item.bbox.minX * 100}%`,
                    top: `${item.bbox.minY * 100}%`,
                    width: `${(item.bbox.maxX - item.bbox.minX) * 100}%`,
                    height: `${(item.bbox.maxY - item.bbox.minY) * 100}%`,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 2,
                    padding: 0
                  }}
                />
              ))}

            {/* 2 Titik Geser Kepala - Ekor & 2 Titik Kuning Pembanding */}
            {showOverlay && (
              <>
                {(detectedCatches.length > 0 || manualMode || hasPhotoLoaded) && (
                  <>
                    <button
                      type="button"
                      aria-label="Titik Ujung 1 (Kepala)"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        setDraggingHandle('fishA');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${fishA.x * 100}%`,
                        top: `${fishA.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#00e5d0',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
                        cursor: 'grab',
                        zIndex: 4,
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        color: '#041c2c',
                        padding: 0
                      }}
                    >
                      1
                    </button>

                    <button
                      type="button"
                      aria-label="Titik Ujung 2 (Ekor)"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        setDraggingHandle('fishB');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${fishB.x * 100}%`,
                        top: `${fishB.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#00e5d0',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
                        cursor: 'grab',
                        zIndex: 4,
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        color: '#041c2c',
                        padding: 0
                      }}
                    >
                      2
                    </button>
                  </>
                )}

                {showRefBar && (
                  <>
                    <button
                      type="button"
                      aria-label="Awal Pembanding"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        setDraggingHandle('refA');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${refA.x * 100}%`,
                        top: `${refA.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '21px',
                        height: '21px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
                        cursor: 'grab',
                        zIndex: 4,
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        padding: 0
                      }}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      aria-label="Akhir Pembanding"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        setDraggingHandle('refB');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${refB.x * 100}%`,
                        top: `${refB.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '21px',
                        height: '21px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
                        cursor: 'grab',
                        zIndex: 4,
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        padding: 0
                      }}
                    >
                      B
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Tombol cepat pojok kanan atas: Mirror & Putar Kamera */}
          {(sourceMode === 'camera' || uploadedDataUrl) && !cameraError && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', zIndex: 5 }}>
              <button
                type="button"
                onClick={handleToggleMirror}
                style={{
                  background: isMirrored ? '#00e5d0' : 'rgba(2, 16, 36, 0.82)',
                  color: isMirrored ? '#041c2c' : '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.28)',
                  borderRadius: '8px',
                  padding: '5px 9px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Mirror / Balik Kamera"
              >
                <i className="fas fa-arrows-alt-h"></i> Mirror
              </button>

              {sourceMode === 'camera' && !isFrozen && (
                <button
                  type="button"
                  onClick={handleSwitchFacingCamera}
                  style={{
                    background: 'rgba(2, 16, 36, 0.82)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: '8px',
                    padding: '5px 9px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Ganti Kamera Depan / Belakang"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              )}
            </div>
          )}

          {/* Status pojok kiri atas */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(2, 16, 36, 0.86)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '8px',
              padding: '4px 9px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: detectedCatches.length > 0 ? '#00e5d0' : '#f8fafc',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 5
            }}
          >
            {showScanningSpinner && (
              <i className="fas fa-circle-notch fa-spin" style={{ color: '#00e5d0', fontSize: '0.72rem' }}></i>
            )}
            <span>{statusBadgeText}</span>
          </div>

          {/* Pill loading ringan di bawah foto (hanya saat jepret/upload atau antrean AI padat) */}
          {(aiLoading || (isLiveCamera && rateLimitedNotice && detectedCatches.length === 0)) && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(2, 16, 36, 0.9)',
                border: `1px solid ${rateLimitedNotice ? 'rgba(245, 158, 11, 0.5)' : 'rgba(0, 229, 208, 0.5)'}`,
                color: rateLimitedNotice ? '#fbbf24' : '#ffffff',
                padding: '4px 11px',
                borderRadius: '999px',
                fontSize: '0.73rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 7,
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}
            >
              <i
                className={`fas ${rateLimitedNotice ? 'fa-clock' : 'fa-spinner fa-spin'}`}
                style={{ color: rateLimitedNotice ? '#f59e0b' : '#00e5d0' }}
              ></i>
              <span>
                {rateLimitedNotice
                  ? 'Antrean AI penuh sebentar — klik Jepret untuk ukur manual langsung'
                  : 'Mengenali tangkapan & pembanding... (bisa langsung geser 1–2)'}
              </span>
            </div>
          )}

          {/* Empty state untuk Upload */}
          {sourceMode === 'upload' && !uploadedDataUrl && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '16px',
                textAlign: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: '#00e5d0' }}></i>
              <strong style={{ fontSize: '0.92rem', color: '#ffffff' }}>
                Pilih Foto Hasil Tangkapan dari Galeri
              </strong>
            </div>
          )}

          {/* Error Kamera */}
          {sourceMode === 'camera' && cameraError && !isFrozen && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(5, 18, 36, 0.92)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                textAlign: 'center',
                gap: '8px',
                zIndex: 6
              }}
            >
              <i className="fas fa-video-slash" style={{ fontSize: '1.6rem', color: '#f59e0b' }}></i>
              <div style={{ color: '#f8fafc', fontSize: '0.84rem', maxWidth: '38ch' }}>{cameraError}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void startCamera()}>
                  Coba Lagi
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSourceMode('upload');
                    fileInputRef.current?.click();
                  }}
                >
                  Upload Foto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1 Baris Kontrol Ringkas + Pembanding Real */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
          <select
            aria-label="Patokan Pembanding Ukuran di Foto"
            value={refPresetId}
            onChange={(e) => {
              const nextId = e.target.value as ReferencePreset['id'];
              setRefPresetId(nextId);
              setUseAiOverrideCm(null);
              if (nextId === 'none') {
                setRefManuallyMoved(false);
                setTapGroup('fish');
              }
            }}
            style={{
              flex: '1 1 200px',
              minHeight: '36px',
              padding: '4px 9px',
              borderRadius: '10px',
              border: '1px solid var(--card-border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            {REFERENCE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {refPresetId === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="150"
                aria-label="Panjang benda pembanding (cm)"
                value={customRefCm}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomRefCm(Number.isFinite(val) ? val : 1);
                  setUseAiOverrideCm(null);
                }}
                style={{
                  width: '68px',
                  minHeight: '36px',
                  padding: '4px 8px',
                  borderRadius: '10px',
                  border: '1.5px solid #f59e0b',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  fontFamily: FONT_MONO
                }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>cm</span>
            </div>
          )}

          {sourceMode === 'camera' ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleToggleFreeze}
              disabled={!cameraActive && !isFrozen}
              style={{ minHeight: '36px', padding: '5px 10px' }}
            >
              <i className={`fas ${isFrozen ? 'fa-video' : 'fa-camera'}`}></i>{' '}
              {isFrozen ? 'Kamera Live' : 'Jepret'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ minHeight: '36px', padding: '5px 10px' }}
            >
              <i className="fas fa-image"></i> Ganti Foto
            </button>
          )}

          {aiConfigured === true ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleRunAiAnalysis()}
              disabled={aiLoading || (!cameraActive && !hasPhotoLoaded)}
              style={{ minHeight: '36px', padding: '5px 10px' }}
            >
              <i className={`fas ${aiLoading ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>{' '}
              {aiLoading ? 'Mengecek...' : 'Cek AI'}
            </button>
          ) : (
            sourceMode === 'camera' &&
            !isFrozen && (
              <button
                type="button"
                className={manualMode ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => {
                  setManualMode((prev) => !prev);
                  setUseAiOverrideCm(null);
                }}
                style={{ minHeight: '36px', padding: '5px 10px' }}
              >
                <i className="fas fa-ruler"></i> {manualMode ? 'Sembunyi Garis' : 'Ukur Manual'}
              </button>
            )
          )}
        </div>

        {/* Chip pilihan cepat jika >1 hasil tangkapan laut terdeteksi sekaligus */}
        {detectedCatches.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
            {detectedCatches.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedCatchIdx(idx);
                  applySelectedCatch(item);
                }}
                style={{
                  padding: '3px 9px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: idx === selectedCatchIdx ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: idx === selectedCatchIdx ? '#ffffff' : 'var(--text-primary)',
                  border: '1px solid var(--card-border)'
                }}
              >
                {item.label} ·{' '}
                {(effectiveRefCm === 0 && item.estimatedLengthCm > 0
                  ? item.estimatedLengthCm
                  : measureChordCm(item.head, item.tail)
                ).toFixed(1)}{' '}
                cm
              </button>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddAllDetectedCatches}
              style={{ minHeight: '26px', padding: '2px 8px', fontSize: '0.74rem' }}
            >
              + Catat Semua ({detectedCatches.length})
            </button>
          </div>
        )}

        {showRefBar && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#f59e0b',
              marginBottom: '6px',
              fontWeight: 600
            }}
          >
            <span>
              {detectedAutoRef && refPresetId === 'none'
                ? `Patokan otomatis (${detectedAutoRef.name} ${effectiveRefCm} cm) aktif — geser A–B bila perlu.`
                : `Geser titik kuning A–B pas di ujung benda pembanding (${effectiveRefCm} cm) agar ukuran cm nyata.`}
            </span>
            {(hasPhotoLoaded || manualMode) && (
              <button
                type="button"
                onClick={() => setTapGroup((g) => (g === 'fish' ? 'ref' : 'fish'))}
                style={{
                  background: tapGroup === 'ref' ? '#f59e0b' : 'var(--bg-secondary)',
                  color: tapGroup === 'ref' ? '#0f172a' : '#f59e0b',
                  border: '1px solid #f59e0b',
                  borderRadius: '7px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {tapGroup === 'ref' ? 'Ketuk layar: Titik A–B (Pembanding)' : 'Ketuk layar: Titik 1–2 (Tangkapan)'}
              </button>
            )}
          </div>
        )}

        {aiError && (
          <div
            style={{
              background: 'var(--status-warn-bg)',
              border: '1px solid var(--status-warn-border)',
              color: 'var(--status-warn-text)',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              marginBottom: '8px'
            }}
          >
            {aiError}
          </div>
        )}

        {aiNote && (
          <div
            style={{
              background: 'var(--status-info-bg)',
              border: '1px solid var(--status-info-border)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              marginBottom: '8px'
            }}
          >
            {aiNote}
          </div>
        )}

        {/* Kotak Hasil Besar & Jelas (hanya muncul saat ada hasil ukur / foto) */}
        {showMeasurementBox && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--primary)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Panjang {selectedCatch?.label || 'Hasil Tangkapan Laut'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.55rem', fontWeight: 900, fontFamily: FONT_MONO, color: 'var(--primary)' }}>
                  {effectiveLengthCm.toFixed(1)} cm
                </span>
                <span style={{ fontSize: '0.82rem', fontFamily: FONT_MONO, color: 'var(--text-secondary)' }}>
                  (~{estimatedWeightG} g)
                </span>
              </div>
            </div>

            {selectedCatch && (
              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: '9px',
                  background: isMature ? 'var(--status-ok-bg)' : 'var(--status-warn-bg)',
                  border: `1px solid ${isMature ? 'var(--status-ok-border)' : 'var(--status-warn-border)'}`,
                  color: isMature ? 'var(--status-ok-text)' : 'var(--status-warn-text)',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                {isMature ? `✅ Layak Tangkap (≥ ${speciesRef.lmCm} cm)` : `⚠️ Masih Kecil (< ${speciesRef.lmCm} cm)`}
              </span>
            )}
          </div>
        )}

        {/* Daftar Sampel Jika Mengukur >1 Tangkapan */}
        {measuredSamples.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {measuredSamples.map((s, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--card-border)',
                  fontSize: '0.76rem',
                  fontFamily: FONT_MONO
                }}
              >
                {s.lengthCm.toFixed(1)} cm
                <button
                  type="button"
                  onClick={() => setMeasuredSamples((prev) => prev.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tombol Simpan Akhir */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddSampleToBatch}
            disabled={!showMeasurementBox}
            style={{ flex: '1 1 130px', minHeight: '40px', fontSize: '0.86rem' }}
          >
            <i className="fas fa-plus"></i> Catat 1 Lagi
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmApply}
            disabled={!showMeasurementBox && measuredSamples.length === 0}
            style={{ flex: '2 1 190px', minHeight: '40px', fontSize: '0.9rem' }}
          >
            <i className="fas fa-check-circle"></i>{' '}
            {measuredSamples.length > 0
              ? `Pakai ${measuredSamples.length} Ukuran`
              : showMeasurementBox
              ? `Pakai Ukuran (${effectiveLengthCm.toFixed(1)} cm)`
              : 'Ambil / Ukur Foto Dulu'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

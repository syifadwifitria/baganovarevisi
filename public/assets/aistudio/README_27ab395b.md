# BAGANOVA — Smart Fishing Dashboard

Prototipe Sistem Pemantauan dan Analisis Bagan Tancap Berbasis Teknologi untuk Nelayan dan Akuakultur.

## Fitur Utama

- **Dashboard**: Ikhtisar status objek terdeteksi, status kamera bawah air, status lampu LED pemikat ikan, status mekanisme jaring bagan, pratinjau kamera waktu-nyata, kontrol cepat, dan umpan aktivitas terbaru.
- **Monitoring Kamera**: Simulasi visual kamera bawah air interaktif dengan pendeteksian objek ikan (bounding box AI, jenis spesies, skor keyakinan), telemetri kedalaman/lux, serta dukungan pengujian siaran langsung kamera webcam laptop.
- **Kontrol Bagan**: Simulasi pengendalian aktuator bagan tancap meliputi lampu LED pemikat (kontrol status, pilihan warna atraktan hijau/biru/putih, pengaturan intensitas lux) dan motor pengangkat jaring (mekanisme angkat dan turun).
- **Analisis Data**: Visualisasi grafik batang/tren objek terdeteksi lintas sesi pengujian, rata-rata objek per sesi, dan deteksi puncak.
- **Riwayat Pengujian**: Pencatatan log sesi pengujian lengkap dengan stempel waktu, jenis aktivitas, hasil, dan sumber pemicu beserta opsi pembersihan log.

## Teknologi

- React 18 + TypeScript
- Vite
- Tailwind CSS
- HTML5 Canvas Simulation Engine

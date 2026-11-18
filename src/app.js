/**
 * BAGANOVA — Smart Automated Bagan System
 * Production Client Script (app.js)
 * 
 * Features:
 * 1. Load Cell / Tension Sensor Telemetry Engine with Wave Noise Filtering
 * 2. Real-Time Oscilloscope / Waveform Canvas (Raw vs Filtered Signals)
 * 3. Automated Hoisting State Machine (Threshold Detection -> Auto Motor Winch -> Top Limit Switch Cut-off)
 * 4. Manual Lowering Command Protocol for Bagan Operators
 * 5. Interactive Bagan Tancap Schematic (1 Motor, 1 Winch, 1 Main Cable with Inline Load Cell, Square Spreader Bridle, 4 Corner Ropes to Net)
 * 6. Analytics Engine (Target vs Actual Load SVG Chart, Wave Noise Rejection Metrics)
 * 7. Operations Audit Log & CSV Export
 * 8. System Calibration & ESP32 Configuration
 * 9. Neon Particle Engine, Theme Toggle & Smooth Navigation
 */

// ==========================================================================
// 1. SYSTEM STATE & HARDWARE CONFIGURATION
// ==========================================================================
const BAGANOVA_SYS = {
  theme: localStorage.getItem('baganova_theme') || 'dark',

  // ESP32 Microcontroller State
  esp32: {
    mode: 'simulation', // 'simulation' | 'hardware'
    connected: true,
    ip: localStorage.getItem('baganova_esp_ip') || '192.168.4.1',
    baudRate: parseInt(localStorage.getItem('baganova_esp_baud'), 10) || 115200,
    samplingRate: 20, // Hz
    filterWindow: parseInt(localStorage.getItem('baganova_filter_window'), 10) || 15, // samples
    waveNoiseSpikesFiltered: 186,
    stabilityPct: 96.4,
  },

  // Load & Tension Sensor Parameters
  loadSensor: {
    baselineTare: parseFloat(localStorage.getItem('baganova_baseline_tare')) || 20.0, // kg (empty net deadweight)
    targetThreshold: parseFloat(localStorage.getItem('baganova_target_threshold')) || 85.0, // kg
    currentRaw: 24.5,
    currentFiltered: 24.5,
    noiseAmplitude: 1.8, // kg (wave disturbance)
    isStable: true,
    historyWaveform: [],
  },

  // Winch & Actuator Mechanism
  winch: {
    motorState: 'standby', // 'standby' | 'raising' | 'lowering' | 'stopped' | 'estop'
    netPosition: 'bottom', // 'bottom' | 'moving_up' | 'top' | 'moving_down'
    limitSwitchTop: false, // false = open, true = triggered
    autoMode: true,
    cableHeightPx: 190, // 190px = bottom, 50px = top
  },

  // Operational Hoisting History
  history: [
    { id: 1, time: '21:15 WIB', triggerLoad: 86.4, mode: 'Otomatis ESP32', duration: 18.1, limitSwitch: 'Aktif (Cut-off)', status: 'Sukses (Panen)' },
    { id: 2, time: '23:30 WIB', triggerLoad: 85.8, mode: 'Otomatis ESP32', duration: 18.4, limitSwitch: 'Aktif (Cut-off)', status: 'Sukses (Panen)' },
    { id: 3, time: '01:45 WIB', triggerLoad: 88.2, mode: 'Otomatis ESP32', duration: 17.9, limitSwitch: 'Aktif (Cut-off)', status: 'Sukses (Puncak)' },
    { id: 4, time: '04:10 WIB', triggerLoad: 85.1, mode: 'Otomatis ESP32', duration: 18.5, limitSwitch: 'Aktif (Cut-off)', status: 'Sukses (Panen)' },
  ],

  // Analytics Metrics
  analytics: {
    avgDurationSec: 18.2,
    responseTimeSec: 1.15,
    successRatePct: 100,
    totalCyclesTested: 14,
  }
};

// Populate initial waveform array
for (let i = 0; i < 90; i++) {
  BAGANOVA_SYS.loadSensor.historyWaveform.push({
    raw: BAGANOVA_SYS.loadSensor.currentRaw + (Math.sin(i * 0.3) * 1.8),
    filtered: BAGANOVA_SYS.loadSensor.currentRaw
  });
}

// ==========================================================================
// 2. DOM INITIALIZATION & SAFE UTILITIES
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPageRouter();
  initTeamManager();
  initAboutTabs();
  initFaqAccordion();
  initParticleBackground();
  initHeroAquaticCanvas();
  initRealtimeWaveformCanvas();
  initActuatorMechanism();
  initAnalyticsChart();
  initHistoryTable();
  initSettingsForm();
  initInfiniteCarousel();
  initScrollUpButton();
  initHeroActions();
});

// Toast / Notification Messenger
function showToast(message, type = 'success') {
  const feedbackEl = document.getElementById('cameraFeedback');
  if (!feedbackEl) return;
  
  feedbackEl.className = `feedback-banner feedback-${type}`;
  const icon = type === 'danger' ? 'fa-exclamation-triangle' : (type === 'info' ? 'fa-info-circle' : 'fa-check-circle');
  feedbackEl.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  feedbackEl.classList.remove('hidden');

  clearTimeout(feedbackEl._timeout);
  feedbackEl._timeout = setTimeout(() => {
    feedbackEl.classList.add('hidden');
  }, 4000);
}

// ==========================================================================
// 3. THEME TOGGLE & PERSISTENCE
// ==========================================================================
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  
  root.setAttribute('data-theme', BAGANOVA_SYS.theme);
  if (themeToggle) {
    themeToggle.textContent = BAGANOVA_SYS.theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', `Ganti ke tema ${BAGANOVA_SYS.theme === 'dark' ? 'terang' : 'gelap'}`);
    
    themeToggle.addEventListener('click', () => {
      const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', nextTheme);
      BAGANOVA_SYS.theme = nextTheme;
      localStorage.setItem('baganova_theme', nextTheme);
      themeToggle.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
    });
  }
}

// ==========================================================================
// 4. MULTI-PAGE ROUTER & NAVIGATION ENGINE
// ==========================================================================
function initPageRouter() {
  const pageViews = document.querySelectorAll('.app-page-view');
  const desktopMenuLinks = document.querySelectorAll('.menu-link');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const mobileNavMenu = document.getElementById('mobileNavMenu');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');

  const ROUTE_MAP = {
    'beranda': 'view-beranda',
    'tentang': 'view-tentang',
    'monitoring': 'view-monitoring',
    'kontrol': 'view-kontrol',
    'analisis': 'view-analisis',
    'riwayat': 'view-riwayat',
    'pengaturan': 'view-pengaturan',
    // Fallback aliases for legacy anchors
    'hero': 'view-beranda',
    'about': 'view-tentang',
    'control': 'view-kontrol',
    'analytics': 'view-analisis',
    'history': 'view-riwayat',
    'settings': 'view-pengaturan'
  };

  const PAGE_TITLES = {
    'beranda': 'BAGANOVA — Smart Monitoring System | SIK UPI Kampus Serang',
    'tentang': 'BAGANOVA — Tentang Kami | Pusat Kendali Bagan Tancap Otomatis',
    'monitoring': 'BAGANOVA — Monitoring Real-Time Gaya Tarik & Beban Net',
    'kontrol': 'BAGANOVA — Kendali Motor DC Gearbox 12V & Skematik Bagan',
    'analisis': 'BAGANOVA — Analisis Kinerja Filter Gelombang & Respon Sistem',
    'riwayat': 'BAGANOVA — Riwayat Operasi & Log Pengangkatan Otomatis',
    'pengaturan': 'BAGANOVA — Kalibrasi Beban & Parameter Firebase ESP32'
  };

  function closeMobileNav() {
    mobileNavMenu?.classList.remove('open');
    mobileNavOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigateTo(pageKey, subTab = null) {
    const cleanKey = (pageKey || 'beranda').replace(/^[#/]+/, '').toLowerCase();
    const targetViewId = ROUTE_MAP[cleanKey] || 'view-beranda';
    const canonicalKey = Object.keys(ROUTE_MAP).find(k => ROUTE_MAP[k] === targetViewId) || 'beranda';

    // 1. Toggle visibility of page containers
    pageViews.forEach(view => {
      if (view.id === targetViewId) {
        view.classList.add('active-page');
      } else {
        view.classList.remove('active-page');
      }
    });

    // 2. Synchronize active state on desktop navbar
    desktopMenuLinks.forEach(link => {
      const linkPage = link.getAttribute('data-page');
      const href = link.getAttribute('href') || '';
      if (linkPage === canonicalKey || href === `#/${canonicalKey}` || href === `#${canonicalKey}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 3. Synchronize active state on mobile drawer
    mobileNavLinks.forEach(link => {
      const linkPage = link.getAttribute('data-page');
      const href = link.getAttribute('href') || '';
      if (linkPage === canonicalKey || href === `#/${canonicalKey}` || href === `#${canonicalKey}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 4. Update document title
    if (PAGE_TITLES[canonicalKey]) {
      document.title = PAGE_TITLES[canonicalKey];
    }

    // 5. Close mobile drawer if opened
    closeMobileNav();

    // 6. Smooth scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 7. Support switching directly to sub-tab inside Tentang (e.g. #/tentang/tim)
    if (subTab) {
      const tabBtn = document.querySelector(`.about-tab-btn[data-tab="${subTab}"]`);
      if (tabBtn) tabBtn.click();
    }

    // 8. Trigger layout re-calc for canvases and charts
    if (canonicalKey === 'monitoring') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 60);
    } else if (canonicalKey === 'analisis') {
      setTimeout(() => {
        if (typeof renderAnalyticsChart === 'function') renderAnalyticsChart();
      }, 60);
    } else if (canonicalKey === 'kontrol') {
      setTimeout(() => {
        if (typeof updateActuatorVisuals === 'function') updateActuatorVisuals();
      }, 60);
    }
  }

  function handleHashChange() {
    const rawHash = window.location.hash || '#/beranda';
    const parts = rawHash.replace(/^[#/]+/, '').split('/');
    const mainPage = parts[0] || 'beranda';
    const subTab = parts[1] || null;
    navigateTo(mainPage, subTab);
  }

  window.addEventListener('hashchange', handleHashChange);

  // Intercept clicks on links targeting pages
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#/"], a[data-page], .portal-nav-card');
    if (!link) return;

    const dataPage = link.getAttribute('data-page');
    const href = link.getAttribute('href');

    let targetPage = dataPage;
    if (!targetPage && href && href.startsWith('#/')) {
      targetPage = href.replace('#/', '');
    }

    if (targetPage) {
      e.preventDefault();
      window.location.hash = `#/${targetPage}`;
      navigateTo(targetPage);
    }
  });

  // Mobile drawer controls
  const mobileToggleBtn = document.getElementById('mobileToggleBtn');
  const mobileCloseBtn = document.getElementById('mobileCloseBtn');

  mobileToggleBtn?.addEventListener('click', () => {
    mobileNavMenu?.classList.add('open');
    mobileNavOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  mobileCloseBtn?.addEventListener('click', closeMobileNav);
  mobileNavOverlay?.addEventListener('click', closeMobileNav);

  // Initialize initial route
  handleHashChange();
}

// ==========================================================================
// 4B. TIM PENGEMBANG & FOTO IDENTITAS MAHASISWA SIK UPI SERANG
// ==========================================================================
function initTeamManager() {
  const DEFAULT_TEAM = [
    {
      id: "syifa",
      name: "Syifa Dwi Fitria",
      nim: "2201945",
      role: "Ketua Tim & Arsitektur IoT",
      prodi: "Sistem Informasi Kelautan — UPI Kampus Serang",
      photo: "",
      bio: "Memimpin perancangan konsep otomatisasi bagan tancap, koordinasi integrasi sensor gaya tarik tali utama dengan ESP32, arsitektur dashboard web, dan pengujian sistem di perairan pesisir Teluk Banten."
    },
    {
      id: "member1",
      name: "Rizky Pratama",
      nim: "2203112",
      role: "Hardware & Sensor Load Cell",
      prodi: "Sistem Informasi Kelautan — UPI Kampus Serang",
      photo: "",
      bio: "Bertanggung jawab atas kalibrasi sensor load cell S-Type 200kg, perakitan modul amplifikasi HX711 berpelindung kelembaban laut (marine waterproof), serta proteksi kelistrikan relai motor winch 12V/24V."
    },
    {
      id: "member2",
      name: "Fauzan Nur Hakim",
      nim: "2204558",
      role: "Firmware ESP32 & Algoritma Filter",
      prodi: "Sistem Informasi Kelautan — UPI Kampus Serang",
      photo: "",
      bio: "Mengembangkan algoritma Moving Average & Dynamic Noise Rejection pada firmware ESP32 untuk menyaring osilasi gelombang laut dan mencegah pemicuan pengangkatan yang salah (false trigger)."
    },
    {
      id: "member3",
      name: "Anisa Larasati",
      nim: "2205891",
      role: "Rancang Bangun Mekanikal Winch",
      prodi: "Sistem Informasi Kelautan — UPI Kampus Serang",
      photo: "",
      bio: "Merancang drum winch penggulung tali utama tunggal, rangka persegi penyeimbang 4 sudut jaring bagan, serta kalibrasi limit switch pemutus otomatis di posisi batas atas."
    },
    {
      id: "dosen",
      name: "Dosen Pembimbing Riset",
      nim: "NIP. 198705122014041001",
      role: "Pembimbing & Pakar Instrumentasi Kelautan",
      prodi: "Sistem Informasi Kelautan — UPI Kampus Serang",
      photo: "",
      bio: "Membimbing metodologi riset maritim, validasi kestabilan sistem otomatisasi penangkapan ikan, serta pengujian kelayakan alat pada bagan tancap nelayan tradisional."
    }
  ];

  function getTeamData() {
    try {
      const saved = localStorage.getItem('baganova_team_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Gagal memuat data tim dari localStorage', e);
    }
    return DEFAULT_TEAM;
  }

  function saveTeamData(data) {
    try {
      localStorage.setItem('baganova_team_members', JSON.stringify(data));
    } catch (e) {
      console.warn('Gagal menyimpan data tim ke localStorage', e);
    }
  }

  let teamMembers = getTeamData();

  function renderTeamCards() {
    const container = document.getElementById('teamCardsGrid');
    if (!container) return;

    container.innerHTML = teamMembers.map((m, idx) => {
      const hasPhoto = Boolean(m.photo && m.photo.trim().length > 0);
      const isLeader = idx === 0;

      return `
        <div class="team-member-card ${isLeader ? 'leader-card' : ''}" data-member-id="${m.id}">
          <div class="member-avatar-box">
            ${hasPhoto 
              ? `<img src="${m.photo}" alt="${m.name}" class="member-custom-photo" />`
              : `<div class="member-photo-placeholder"><i class="fas ${isLeader ? 'fa-crown' : 'fa-user-graduate'}"></i></div>`
            }
          </div>
          <div class="member-info-content">
            <div class="member-header-row">
              <h3 class="member-name">${m.name}</h3>
              <span class="member-role-badge ${isLeader ? 'badge-leader' : ''}">${m.role}</span>
            </div>
            <div class="member-nim-prodi">
              <span class="member-nim-badge"><i class="fas fa-id-card"></i> ${m.nim}</span>
              <span class="member-prodi-badge"><i class="fas fa-university"></i> ${m.prodi}</span>
            </div>
            <p class="member-bio-text">${m.bio}</p>
            <div class="member-card-footer">
              <button type="button" class="btn-edit-member" data-target-id="${m.id}">
                <i class="fas fa-camera"></i> ${hasPhoto ? 'Ganti Foto / Profil' : 'Unggah Foto & Profil'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events on edit buttons
    container.querySelectorAll('.btn-edit-member').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-target-id');
        openEditModal(id);
      });
    });
  }

  // Modal elements
  const modal = document.getElementById('teamEditModal');
  const btnOpenModal = document.getElementById('btnOpenTeamEditModal') || document.getElementById('btnOpenTeamModal');
  const btnCloseModal = document.getElementById('btnCloseTeamModal');
  const btnCancelModal = document.getElementById('btnCancelTeamModal');
  const btnResetTeam = document.getElementById('btnResetTeamData');
  const btnSaveMember = document.getElementById('btnSaveTeamMember');
  const selectMember = document.getElementById('selectTeamMember');
  const inputPhoto = document.getElementById('inputMemberPhoto');
  const previewBox = document.getElementById('memberPhotoPreview');
  const inputName = document.getElementById('inputMemberName');
  const inputNim = document.getElementById('inputMemberNim');
  const inputRole = document.getElementById('inputMemberRole');
  const inputProdi = document.getElementById('inputMemberProdi');
  const inputBio = document.getElementById('inputMemberBio');

  let currentEditingPhoto = '';

  function populateSelect() {
    if (!selectMember) return;
    selectMember.innerHTML = teamMembers.map(m => 
      `<option value="${m.id}">${m.name} (${m.role})</option>`
    ).join('');
  }

  function loadMemberIntoForm(memberId) {
    const member = teamMembers.find(m => m.id === memberId) || teamMembers[0];
    if (!member) return;

    if (selectMember) selectMember.value = member.id;
    if (inputName) inputName.value = member.name;
    if (inputNim) inputNim.value = member.nim;
    if (inputRole) inputRole.value = member.role;
    if (inputProdi) inputProdi.value = member.prodi;
    if (inputBio) inputBio.value = member.bio;

    currentEditingPhoto = member.photo || '';
    updatePreviewBox();
  }

  function updatePreviewBox() {
    if (!previewBox) return;
    if (currentEditingPhoto) {
      previewBox.innerHTML = `<img src="${currentEditingPhoto}" alt="Foto Profil" class="modal-preview-img" /><span class="preview-badge-status"><i class="fas fa-check-circle"></i> Foto Terpasang</span>`;
    } else {
      previewBox.innerHTML = `<div class="preview-empty-state"><i class="fas fa-cloud-upload-alt"></i><p>Pilih berkas foto dari komputer / ponsel (JPG, PNG)</p></div>`;
    }
  }

  function openEditModal(targetId = null) {
    if (!modal) return;
    populateSelect();
    const idToLoad = targetId || (selectMember ? selectMember.value : teamMembers[0]?.id);
    loadMemberIntoForm(idToLoad);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  btnOpenModal?.addEventListener('click', () => openEditModal());
  btnCloseModal?.addEventListener('click', closeEditModal);
  btnCancelModal?.addEventListener('click', closeEditModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeEditModal();
  });

  selectMember?.addEventListener('change', (e) => {
    loadMemberIntoForm(e.target.value);
  });

  inputPhoto?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih berkas gambar yang valid (JPG, PNG, WebP).', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran berkas maksimal 5MB.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      currentEditingPhoto = loadEvent.target.result;
      updatePreviewBox();
      showToast('Foto berhasil dimuat. Klik Simpan Perubahan untuk memperbarui.', 'info');
    };
    reader.readAsDataURL(file);
  });

  btnSaveMember?.addEventListener('click', () => {
    const selectedId = selectMember?.value;
    const memberIndex = teamMembers.findIndex(m => m.id === selectedId);
    if (memberIndex === -1) return;

    teamMembers[memberIndex] = {
      ...teamMembers[memberIndex],
      name: inputName?.value.trim() || teamMembers[memberIndex].name,
      nim: inputNim?.value.trim() || teamMembers[memberIndex].nim,
      role: inputRole?.value.trim() || teamMembers[memberIndex].role,
      prodi: inputProdi?.value.trim() || teamMembers[memberIndex].prodi,
      bio: inputBio?.value.trim() || teamMembers[memberIndex].bio,
      photo: currentEditingPhoto
    };

    saveTeamData(teamMembers);
    renderTeamCards();
    closeEditModal();
    showToast(`Profil ${teamMembers[memberIndex].name} berhasil disimpan!`, 'success');
  });

  btnResetTeam?.addEventListener('click', () => {
    if (confirm('Kembalikan seluruh identitas dan foto tim ke konfigurasi awal?')) {
      teamMembers = JSON.parse(JSON.stringify(DEFAULT_TEAM));
      saveTeamData(teamMembers);
      renderTeamCards();
      showToast('Data tim berhasil dikembalikan ke standar awal.', 'info');
    }
  });

  renderTeamCards();
}


// ==========================================================================
// 4B. ABOUT TABS & FAQ ACCORDION (PORTAL SYSTEM ARCHITECTURE)
// ==========================================================================
function initAboutTabs() {
  const tabButtons = document.querySelectorAll('.about-tab-btn');
  const tabPanels = document.querySelectorAll('.about-tab-panel');

  if (!tabButtons.length || !tabPanels.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      if (!targetTabId) return;

      // Update button state
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update panel visibility
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(targetTabId);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

function initFaqAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      if (!item) return;

      const isOpen = item.classList.contains('active');

      // Close all other accordion items for clean accordion UX
      document.querySelectorAll('.accordion-item').forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherHeader = otherItem.querySelector('.accordion-header');
        const otherContent = otherItem.querySelector('.accordion-content');
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
        if (otherContent) otherContent.style.maxHeight = null;
      });

      // Toggle clicked item
      if (!isOpen) {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
        const content = item.querySelector('.accordion-content');
        if (content) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      }
    });
  });
}

// ==========================================================================
// 5. PARTICLE BACKGROUND CANVAS (NIGHT MODE AESTHETIC)
// ==========================================================================
function initParticleBackground() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = 45;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.2 + 0.8;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = -Math.random() * 0.5 - 0.15;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.hue = Math.random() > 0.5 ? 175 : 195; // Cyan / Aqua glow
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.y < 0 || this.x < 0 || this.x > width) {
        this.reset();
        this.y = height + 10;
      }
    }
    draw() {
      ctx.save();
      ctx.fillStyle = `hsla(${this.hue}, 90%, 55%, ${this.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${this.hue}, 90%, 60%, 0.8)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      particles.forEach(p => {
        p.update();
        p.draw();
      });
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// ==========================================================================
// 6. HERO AQUATIC CANVAS (SUB-SURFACE OCEAN WATER & WAVE BIAS)
// ==========================================================================
function initHeroAquaticCanvas() {
  const canvas = document.getElementById('heroAquaticCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    const parent = canvas.parentElement;
    width = canvas.width = parent.clientWidth || window.innerWidth;
    height = canvas.height = parent.clientHeight || 500;
  }
  window.addEventListener('resize', resize);
  resize();

  // Water bubbles
  const bubbles = [];
  for (let i = 0; i < 35; i++) {
    bubbles.push({
      x: Math.random() * (width || 800),
      y: Math.random() * (height || 500),
      radius: Math.random() * 3 + 1,
      speedY: Math.random() * 0.8 + 0.4,
      wobble: Math.random() * 5,
    });
  }

  let step = 0;
  function render() {
    step += 0.02;
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Ocean gradient adapting to theme (blue, white, aqua cyan, sea mist)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (isDark) {
      grad.addColorStop(0, '#07162c');
      grad.addColorStop(0.5, '#0a2540');
      grad.addColorStop(1, '#050d1a');
    } else {
      grad.addColorStop(0, '#e0f7fa');
      grad.addColorStop(0.5, '#b9e6f2');
      grad.addColorStop(1, '#7dd3fc');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Aqua cyan & sea mint glow beam in the center
    ctx.save();
    const beam = ctx.createRadialGradient(width / 2, 0, 20, width / 2, height * 0.7, width * 0.6);
    if (isDark) {
      beam.addColorStop(0, 'rgba(0, 229, 208, 0.28)');
      beam.addColorStop(0.6, 'rgba(45, 212, 191, 0.12)');
      beam.addColorStop(1, 'rgba(2, 132, 199, 0)');
    } else {
      beam.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      beam.addColorStop(0.5, 'rgba(0, 229, 208, 0.18)');
      beam.addColorStop(1, 'rgba(2, 132, 199, 0)');
    }
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Render bubbles
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    bubbles.forEach(b => {
      b.y -= b.speedY;
      b.x += Math.sin(step + b.wobble) * 0.5;
      if (b.y < -10) {
        b.y = height + 10;
        b.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    requestAnimationFrame(render);
  }
  render();
}

// ==========================================================================
// 7. REAL-TIME TENSION WAVEFORM CANVAS & LOAD SENSOR TELEMETRY
// ==========================================================================
function initRealtimeWaveformCanvas() {
  const canvas = document.getElementById('loadWaveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // DOM Indicators
  const currentTensionDisplay = document.getElementById('currentTensionDisplay');
  const currentNewtonDisplay = document.getElementById('currentNewtonDisplay');
  const statCurrentLoad = document.getElementById('statCurrentLoad');
  const schematicLoadVal = document.getElementById('schematicLoadVal');
  const displayTargetThreshold = document.getElementById('displayTargetThreshold');
  const displayNoiseSuppression = document.getElementById('displayNoiseSuppression');
  const baselineNote = document.getElementById('baselineNote');

  // Simulation Control Buttons
  const btnSimulateFish = document.getElementById('btnSimulateFish');
  const btnTriggerTarget = document.getElementById('btnTriggerTarget');
  const btnTareBaseline = document.getElementById('btnTareBaseline');

  let waveStep = 0;

  function updateWaveformData() {
    waveStep += 0.15;
    
    // Wave noise disturbance (ocean swell & wind vibration)
    const waveNoise = Math.sin(waveStep) * BAGANOVA_SYS.loadSensor.noiseAmplitude +
                      (Math.cos(waveStep * 2.3) * (BAGANOVA_SYS.loadSensor.noiseAmplitude * 0.4));
    
    const rawVal = Math.max(0, BAGANOVA_SYS.loadSensor.currentFiltered + waveNoise);
    BAGANOVA_SYS.loadSensor.currentRaw = parseFloat(rawVal.toFixed(1));

    // Append to waveform history
    BAGANOVA_SYS.loadSensor.historyWaveform.push({
      raw: BAGANOVA_SYS.loadSensor.currentRaw,
      filtered: BAGANOVA_SYS.loadSensor.currentFiltered
    });

    if (BAGANOVA_SYS.loadSensor.historyWaveform.length > 90) {
      BAGANOVA_SYS.loadSensor.historyWaveform.shift();
    }

    // Update Telemetry Display
    const displayKg = BAGANOVA_SYS.loadSensor.currentFiltered.toFixed(1);
    const newton = (BAGANOVA_SYS.loadSensor.currentFiltered * 9.80665).toFixed(1);

    if (currentTensionDisplay) currentTensionDisplay.textContent = `${displayKg} kg`;
    if (currentNewtonDisplay) currentNewtonDisplay.textContent = `${newton} N`;
    if (statCurrentLoad) statCurrentLoad.textContent = `${displayKg} kg`;
    if (schematicLoadVal) schematicLoadVal.textContent = `${displayKg} kg`;
  }

  function renderWaveform() {
    updateWaveformData();
    ctx.clearRect(0, 0, width, height);

    // Deep oscilloscope background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#031422');
    bgGrad.addColorStop(1, '#010a12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid System
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 208, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Scale mappings (0 kg to 140 kg)
    const maxKg = 140;
    const paddingY = 40;
    const graphH = height - (paddingY * 2);

    function getY(kg) {
      const clamped = Math.max(0, Math.min(maxKg, kg));
      return height - paddingY - (clamped / maxKg) * graphH;
    }

    // 1. Target Threshold Line (Electric Aqua Cyan)
    const targetY = getY(BAGANOVA_SYS.loadSensor.targetThreshold);
    ctx.save();
    ctx.strokeStyle = '#00e5d0';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0, 229, 208, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.fillStyle = '#00e5d0';
    ctx.font = '700 12px JetBrains Mono, monospace';
    ctx.fillText(`TARGET AMBANG BATAS: ${BAGANOVA_SYS.loadSensor.targetThreshold.toFixed(1)} KG`, 20, targetY - 8);
    ctx.restore();

    // 2. Baseline Tare Line (Fresh Sea Mint)
    const baselineY = getY(BAGANOVA_SYS.loadSensor.baselineTare);
    ctx.save();
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(width, baselineY);
    ctx.stroke();
    ctx.fillStyle = '#2dd4bf';
    ctx.font = '700 11px JetBrains Mono, monospace';
    ctx.fillText(`BASELINE TARA JARING: ${BAGANOVA_SYS.loadSensor.baselineTare.toFixed(1)} KG`, 20, baselineY - 6);
    ctx.restore();

    // 3. Draw Raw Signal Waveform (Wave Disturbance Noise)
    const points = BAGANOVA_SYS.loadSensor.historyWaveform;
    const stepX = width / (points.length - 1 || 1);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = i * stepX;
      const y = getY(p.raw);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // 4. Draw Filtered Signal Line (Neon Cyan Glow)
    ctx.save();
    ctx.strokeStyle = '#00e5d0';
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 16;
    ctx.shadowColor = 'rgba(0, 229, 208, 0.9)';
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = i * stepX;
      const y = getY(p.filtered);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Glowing Dot on the Current Head Point
    const lastX = (points.length - 1) * stepX;
    const lastY = getY(points[points.length - 1]?.filtered || 20);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00e5d0';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(renderWaveform);
  }
  renderWaveform();

  // Button: Simulate Schooling Fish Gathering (+15 kg)
  btnSimulateFish?.addEventListener('click', () => {
    if (BAGANOVA_SYS.winch.motorState === 'raising') {
      showToast('Motor winch sedang mengangkat jaring. Tunggu hingga siklus selesai.', 'info');
      return;
    }
    const nextVal = BAGANOVA_SYS.loadSensor.currentFiltered + 15.0;
    BAGANOVA_SYS.loadSensor.currentFiltered = Math.min(130, parseFloat(nextVal.toFixed(1)));
    
    showToast(`Beban bertambah menjadi ${BAGANOVA_SYS.loadSensor.currentFiltered} kg.`, 'info');

    // Check if threshold reached
    checkThresholdTrigger();
  });

  // Button: Trigger Target 85 kg Directly
  btnTriggerTarget?.addEventListener('click', () => {
    if (BAGANOVA_SYS.winch.motorState === 'raising') return;
    BAGANOVA_SYS.loadSensor.currentFiltered = BAGANOVA_SYS.loadSensor.targetThreshold;
    showToast(`Ambang batas ${BAGANOVA_SYS.loadSensor.targetThreshold} kg tercapai! Memeriksa kestabilan sensor...`, 'info');
    checkThresholdTrigger();
  });

  // Button: Tare / Reset to Baseline
  btnTareBaseline?.addEventListener('click', () => {
    BAGANOVA_SYS.loadSensor.currentFiltered = BAGANOVA_SYS.loadSensor.baselineTare;
    showToast(`Beban dikalibrasi ulang ke baseline tara ${BAGANOVA_SYS.loadSensor.baselineTare} kg.`, 'success');
  });

  // Auto Hoist Trigger Checker
  function checkThresholdTrigger() {
    if (BAGANOVA_SYS.loadSensor.currentFiltered >= BAGANOVA_SYS.loadSensor.targetThreshold) {
      if (BAGANOVA_SYS.winch.netPosition === 'bottom' && BAGANOVA_SYS.winch.motorState === 'standby') {
        const badge = document.getElementById('sensorStabilityBadge');
        if (badge) {
          badge.className = 'stability-pill filtering';
          badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi Kestabilan (1.2s)...';
        }

        setTimeout(() => {
          if (badge) {
            badge.className = 'stability-pill stable';
            badge.innerHTML = '<i class="fas fa-check-circle"></i> Target Tercapai & Stabil!';
          }
          triggerAutoHoistSequence('Otomatis ESP32');
        }, 1200);
      }
    }
  }
}

// ==========================================================================
// 8. WINCH & ACTUATOR MECHANISM: 1 MOTOR, 1 WINCH, 1 TALI UTAMA, LIMIT SWITCH
// ==========================================================================
function initActuatorMechanism() {
  const btnTestAutoHoist = document.getElementById('btnTestAutoHoist');
  const btnManualHoist = document.getElementById('btnManualHoist');
  const btnManualLower = document.getElementById('btnManualLower');
  const estopActionBtn = document.getElementById('estopActionBtn');
  const quickAutoDemoBtn = document.getElementById('quickAutoDemoBtn');
  const quickLowerBtn = document.getElementById('quickLowerBtn');

  // Schematic Elements
  const singleMainCable = document.getElementById('singleMainCable');
  const singleMotorGraphic = document.getElementById('singleMotorGraphic');
  const limitSwitchGraphic = document.getElementById('limitSwitchGraphic');
  const motorDescText = document.getElementById('motorDescText');
  const motorDetailBadge = document.getElementById('motorDetailBadge');
  const limitSwitchBadge = document.getElementById('limitSwitchBadge');
  const quickMotorStatus = document.getElementById('quickMotorStatus');
  const quickNetPosition = document.getElementById('quickNetPosition');
  const quickLimitStatus = document.getElementById('quickLimitStatus');
  const statLimitSwitch = document.getElementById('statLimitSwitch');

  // Start Automatic Hoist Sequence
  window.triggerAutoHoistSequence = function(modeName = 'Otomatis ESP32') {
    if (BAGANOVA_SYS.winch.motorState === 'raising') return;
    BAGANOVA_SYS.winch.motorState = 'raising';
    BAGANOVA_SYS.winch.netPosition = 'moving_up';

    // Visual State: Motor Spinning
    if (singleMotorGraphic) singleMotorGraphic.classList.add('spinning');
    if (motorDetailBadge) {
      motorDetailBadge.textContent = 'MENGGULUNG (NAIK)';
      motorDetailBadge.style.color = '#00e5d0';
      motorDetailBadge.style.borderColor = '#00e5d0';
    }
    if (motorDescText) {
      motorDescText.textContent = 'Motor winch 24V DC aktif menggulung satu tali utama jaring...';
    }
    if (quickMotorStatus) {
      quickMotorStatus.textContent = 'Menggulung...';
      quickMotorStatus.style.color = '#00e5d0';
    }
    if (quickNetPosition) {
      quickNetPosition.textContent = 'Bergerak Naik...';
      quickNetPosition.style.color = '#38bdf8';
    }

    // Animate single main cable height: 190px -> 50px (raises square spreader frame & net!)
    if (singleMainCable) {
      singleMainCable.style.transition = 'height 3.5s cubic-bezier(0.4, 0, 0.2, 1)';
      singleMainCable.style.height = '50px';
    }

    showToast(`[${modeName}] Target terpenuhi. Motor winch mulai mengangkat jaring bagan!`, 'info');

    // Complete hoist when touching Limit Switch
    setTimeout(() => {
      if (BAGANOVA_SYS.winch.motorState === 'estop') return;

      // Top Limit Switch Hit!
      BAGANOVA_SYS.winch.motorState = 'stopped';
      BAGANOVA_SYS.winch.netPosition = 'top';
      BAGANOVA_SYS.winch.limitSwitchTop = true;

      if (singleMotorGraphic) singleMotorGraphic.classList.remove('spinning');
      if (limitSwitchGraphic) limitSwitchGraphic.classList.add('active');

      if (motorDetailBadge) {
        motorDetailBadge.textContent = 'BERHENTI (POSISI ATAS)';
        motorDetailBadge.style.color = '#34d399';
        motorDetailBadge.style.borderColor = '#10b981';
      }
      if (limitSwitchBadge) {
        limitSwitchBadge.textContent = 'TERTEKAN (CUT-OFF)';
        limitSwitchBadge.style.color = '#ef4444';
        limitSwitchBadge.style.borderColor = '#ef4444';
      }
      if (statLimitSwitch) {
        statLimitSwitch.textContent = 'Aktif (Cut-Off)';
        statLimitSwitch.style.color = '#ef4444';
      }
      if (quickLimitStatus) {
        quickLimitStatus.textContent = 'Aktif (Cut-off)';
        quickLimitStatus.style.color = '#ef4444';
      }
      if (quickMotorStatus) {
        quickMotorStatus.textContent = 'Berhenti (Top)';
        quickMotorStatus.style.color = '#34d399';
      }
      if (quickNetPosition) {
        quickNetPosition.textContent = 'Atas (Siap Panen)';
        quickNetPosition.style.color = '#34d399';
      }
      if (motorDescText) {
        motorDescText.textContent = 'Rangka menyentuh limit switch atas. Motor otomatis berhenti seketika.';
      }

      // Add to operations log
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      BAGANOVA_SYS.history.unshift({
        id: BAGANOVA_SYS.history.length + 1,
        time: nowStr,
        triggerLoad: BAGANOVA_SYS.loadSensor.currentFiltered,
        mode: modeName,
        duration: 18.2,
        limitSwitch: 'Aktif (Cut-off)',
        status: 'Sukses (Panen)',
      });

      renderHistoryTable();
      renderAnalyticsChart();

      showToast('Jaring terangkat penuh! Limit switch atas aktif memutus arus motor.', 'success');
    }, 3600);
  };

  // Lower Net Sequence (Manual Operator Command)
  window.triggerLowerNetSequence = function() {
    if (BAGANOVA_SYS.winch.netPosition === 'bottom') {
      showToast('Jaring sudah berada di posisi bawah (menampung ikan).', 'info');
      return;
    }
    if (BAGANOVA_SYS.winch.motorState === 'raising' || BAGANOVA_SYS.winch.motorState === 'lowering') return;

    BAGANOVA_SYS.winch.motorState = 'lowering';
    BAGANOVA_SYS.winch.netPosition = 'moving_down';

    if (singleMotorGraphic) singleMotorGraphic.classList.add('spinning');
    if (limitSwitchGraphic) limitSwitchGraphic.classList.remove('active');

    if (motorDetailBadge) {
      motorDetailBadge.textContent = 'MENURUNKAN JARING...';
      motorDetailBadge.style.color = '#38bdf8';
      motorDetailBadge.style.borderColor = '#38bdf8';
    }
    if (limitSwitchBadge) {
      limitSwitchBadge.textContent = 'Terbuka (Standby)';
      limitSwitchBadge.style.color = '#38bdf8';
    }
    if (statLimitSwitch) {
      statLimitSwitch.textContent = 'Terbuka (Standby)';
      statLimitSwitch.style.color = '#38bdf8';
    }
    if (quickLimitStatus) {
      quickLimitStatus.textContent = 'Terbuka (Standby)';
      quickLimitStatus.style.color = '#94a3b8';
    }
    if (quickMotorStatus) {
      quickMotorStatus.textContent = 'Menurunkan...';
      quickMotorStatus.style.color = '#38bdf8';
    }
    if (quickNetPosition) {
      quickNetPosition.textContent = 'Menurun ke Dasar...';
      quickNetPosition.style.color = '#38bdf8';
    }
    if (motorDescText) {
      motorDescText.textContent = 'Motor mengulur satu tali utama, menurunkan jaring ke kedalaman optimal...';
    }

    // Animate single main cable height: 50px -> 190px (lowers net back down)
    if (singleMainCable) {
      singleMainCable.style.transition = 'height 3.5s cubic-bezier(0.4, 0, 0.2, 1)';
      singleMainCable.style.height = '190px';
    }

    showToast('Perintah diterima: Menurunkan jaring kembali ke perairan...', 'info');

    setTimeout(() => {
      if (BAGANOVA_SYS.winch.motorState === 'estop') return;

      BAGANOVA_SYS.winch.motorState = 'standby';
      BAGANOVA_SYS.winch.netPosition = 'bottom';
      BAGANOVA_SYS.winch.limitSwitchTop = false;

      // Reset load to baseline tare
      BAGANOVA_SYS.loadSensor.currentFiltered = BAGANOVA_SYS.loadSensor.baselineTare;

      if (singleMotorGraphic) singleMotorGraphic.classList.remove('spinning');
      if (motorDetailBadge) {
        motorDetailBadge.textContent = 'Siaga (Standby)';
        motorDetailBadge.style.color = '#38bdf8';
      }
      if (quickMotorStatus) {
        quickMotorStatus.textContent = 'Standby';
        quickMotorStatus.style.color = '#38bdf8';
      }
      if (quickNetPosition) {
        quickNetPosition.textContent = 'Bawah (Menampung)';
        quickNetPosition.style.color = '#00e5d0';
      }
      if (motorDescText) {
        motorDescText.textContent = 'Jaring terbentang di posisi bawah. Siap menampung akumulasi ikan.';
      }

      showToast('Jaring telah kembali ke posisi bawah. Sistem otomatisasi siap memantau beban.', 'success');
    }, 3600);
  };

  // Wire Buttons
  btnTestAutoHoist?.addEventListener('click', () => {
    // Bring load to target then hoist
    BAGANOVA_SYS.loadSensor.currentFiltered = BAGANOVA_SYS.loadSensor.targetThreshold;
    triggerAutoHoistSequence('Otomatis ESP32');
  });

  quickAutoDemoBtn?.addEventListener('click', () => {
    BAGANOVA_SYS.loadSensor.currentFiltered = BAGANOVA_SYS.loadSensor.targetThreshold;
    triggerAutoHoistSequence('Otomatis ESP32');
  });

  btnManualHoist?.addEventListener('click', () => {
    triggerAutoHoistSequence('Manual Operator');
  });

  btnManualLower?.addEventListener('click', () => {
    triggerLowerNetSequence();
  });

  quickLowerBtn?.addEventListener('click', () => {
    triggerLowerNetSequence();
  });

  // Emergency Stop (E-STOP) Button
  estopActionBtn?.addEventListener('click', () => {
    BAGANOVA_SYS.winch.motorState = 'estop';
    
    if (singleMainCable) {
      singleMainCable.style.transition = 'none'; // Halt immediately!
    }
    if (singleMotorGraphic) singleMotorGraphic.classList.remove('spinning');

    if (motorDetailBadge) {
      motorDetailBadge.textContent = 'BERHENTI DARURAT (E-STOP)!';
      motorDetailBadge.style.color = '#ef4444';
      motorDetailBadge.style.borderColor = '#ef4444';
    }
    if (quickMotorStatus) {
      quickMotorStatus.textContent = 'E-STOP!';
      quickMotorStatus.style.color = '#ef4444';
    }
    if (motorDescText) {
      motorDescText.textContent = 'PERINGATAN: E-STOP aktif. Seluruh arus motor winch diputus demi keamanan!';
    }

    showToast('PERINGATAN: Emergency Stop diaktifkan! Motor winch dihentikan seketika.', 'danger');
  });
}

// ==========================================================================
// 9. SYSTEM ANALYTICS & TARGET VS ACTUAL LOAD SVG CHART
// ==========================================================================
function initAnalyticsChart() {
  renderAnalyticsChart();
}

function renderAnalyticsChart() {
  const chartContainer = document.getElementById('chart');
  if (!chartContainer) return;

  const data = BAGANOVA_SYS.history;
  if (!data || data.length === 0) {
    chartContainer.innerHTML = '<p style="text-align:center; padding:3rem; color:#888;">Belum ada data pengujian.</p>';
    return;
  }

  const chartWidth = 540;
  const chartHeight = 220;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const graphW = chartWidth - padding.left - padding.right;
  const graphH = chartHeight - padding.top - padding.bottom;

  const maxVal = 120;
  const targetThreshold = BAGANOVA_SYS.loadSensor.targetThreshold;
  const targetY = padding.top + (graphH - (targetThreshold / maxVal * graphH));

  const barW = Math.min(graphW / data.length * 0.5, 46);
  let barsSvg = '';
  let linePoints = [];

  data.slice(0, 6).forEach((d, i) => {
    const x = padding.left + (i * (graphW / (Math.min(data.length, 6) - 1 || 1))) - (barW / 2);
    const barHeight = (d.triggerLoad / maxVal) * graphH;
    const y = padding.top + (graphH - barHeight);

    const centerX = x + barW / 2;
    linePoints.push(`${centerX},${y}`);

    barsSvg += `
      <!-- Bar Item ${d.id} -->
      <g class="chart-bar-group" data-val="${d.triggerLoad} kg">
        <rect x="${x}" y="${y}" width="${barW}" height="${barHeight}" rx="4" fill="url(#barCyanGrad)" />
        <line x1="${x}" y1="${y}" x2="${x + barW}" y2="${y}" stroke="#00e5d0" stroke-width="2" />
        <text x="${centerX}" y="${y - 8}" text-anchor="middle" fill="#00e5d0" font-size="11" font-weight="700" font-family="'JetBrains Mono', monospace">
          ${d.triggerLoad} kg
        </text>
        <text x="${centerX}" y="${chartHeight - 12}" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="'Inter', sans-serif">
          #${d.id} (${d.time.split(' ')[0]})
        </text>
      </g>
    `;
  });

  const svg = `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="svg-trend-chart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="barCyanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00e5d0" stop-opacity="0.95" />
          <stop offset="60%" stop-color="#0284c7" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#0c2340" stop-opacity="0.25" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line x1="${padding.left}" y1="${padding.top}" x2="${chartWidth - padding.right}" y2="${padding.top}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3" />
      <line x1="${padding.left}" y1="${padding.top + graphH * 0.5}" x2="${chartWidth - padding.right}" y2="${padding.top + graphH * 0.5}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3" />
      <line x1="${padding.left}" y1="${padding.top + graphH}" x2="${chartWidth - padding.right}" y2="${chartWidth - padding.right}" stroke="rgba(255,255,255,0.2)" />

      <!-- Y Axis Labels -->
      <text x="${padding.left - 10}" y="${padding.top + 4}" text-anchor="end" fill="#64748b" font-size="9">${maxVal} kg</text>
      <text x="${padding.left - 10}" y="${padding.top + graphH * 0.5 + 3}" text-anchor="end" fill="#64748b" font-size="9">${maxVal / 2} kg</text>
      <text x="${padding.left - 10}" y="${padding.top + graphH + 3}" text-anchor="end" fill="#64748b" font-size="9">0 kg</text>

      <!-- Target Threshold Line (Sea Mint #2dd4bf) -->
      <line x1="${padding.left}" y1="${targetY}" x2="${chartWidth - padding.right}" y2="${targetY}" stroke="#2dd4bf" stroke-width="1.8" stroke-dasharray="6,4" />
      <text x="${chartWidth - padding.right - 4}" y="${targetY - 5}" text-anchor="end" fill="#2dd4bf" font-size="9" font-weight="700">TARGET: ${targetThreshold} KG</text>

      <!-- Trend Polyline -->
      <polyline points="${linePoints.join(' ')}" fill="none" stroke="#16d9e8" stroke-width="2.5" stroke-linecap="round" />

      <!-- Bars -->
      ${barsSvg}
    </svg>
  `;

  chartContainer.innerHTML = svg;
}

// ==========================================================================
// 10. HISTORY AUDIT TABLE & CSV EXPORT
// ==========================================================================
function initHistoryTable() {
  renderHistoryTable();

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  exportCsvBtn?.addEventListener('click', () => {
    exportHistoryCsv();
  });

  clearHistoryBtn?.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh riwayat operasi pengangkatan jaring?')) {
      BAGANOVA_SYS.history = [];
      renderHistoryTable();
      renderAnalyticsChart();
      showToast('Seluruh riwayat pengangkatan telah dibersihkan.', 'info');
    }
  });
}

function renderHistoryTable() {
  const historyTable = document.getElementById('historyTable');
  if (!historyTable) return;

  if (BAGANOVA_SYS.history.length === 0) {
    historyTable.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#888;">Tidak ada log aktivitas pengangkatan tersimpan.</td></tr>`;
    return;
  }

  historyTable.innerHTML = BAGANOVA_SYS.history.map((log, index) => `
    <tr>
      <td><span class="table-badge">${index + 1}</span></td>
      <td><strong>${log.time}</strong></td>
      <td><span style="color:#00e5d0; font-family:'JetBrains Mono',monospace; font-weight:700;">${log.triggerLoad} kg</span></td>
      <td><span class="badge-status" style="background:rgba(0,180,166,0.15);">${log.mode}</span></td>
      <td>${log.duration} dtk</td>
      <td><span style="color:#ef4444; font-size:0.8rem;"><i class="fas fa-check-circle"></i> ${log.limitSwitch}</span></td>
      <td><span class="status-pill-green">${log.status}</span></td>
    </tr>
  `).join('');
}

function exportHistoryCsv() {
  const headers = ['No', 'Waktu Operasi', 'Beban Pemicu (kg)', 'Mode Pemicu', 'Durasi Angkat (dtk)', 'Status Limit Switch', 'Hasil'];
  const rows = BAGANOVA_SYS.history.map((log, i) => [
    i + 1,
    `"${log.time}"`,
    log.triggerLoad,
    `"${log.mode}"`,
    log.duration,
    `"${log.limitSwitch}"`,
    `"${log.status}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BAGANOVA_Log_Otomatisasi_Jaring_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('File CSV riwayat pengoperasian bagan berhasil diunduh.', 'success');
}

// ==========================================================================
// 11. SETTINGS & SYSTEM CALIBRATION
// ==========================================================================
function initSettingsForm() {
  const inputTarget = document.getElementById('inputTargetThreshold');
  const badgeTarget = document.getElementById('badgeTargetThreshold');
  const inputTare = document.getElementById('inputBaselineTare');
  const badgeTare = document.getElementById('badgeBaselineTare');
  const inputFilter = document.getElementById('inputFilterWindow');
  const badgeFilter = document.getElementById('badgeFilterWindow');
  const inputEspIp = document.getElementById('inputEspIp');
  const inputBaud = document.getElementById('inputBaudRate');
  const btnSave = document.getElementById('btnSaveSettings');
  const displayTargetThreshold = document.getElementById('displayTargetThreshold');
  const statTargetLoad = document.getElementById('statTargetLoad');

  // Load Initial Values
  if (inputTarget && badgeTarget) {
    inputTarget.value = BAGANOVA_SYS.loadSensor.targetThreshold;
    badgeTarget.textContent = `${inputTarget.value} kg`;
    inputTarget.addEventListener('input', (e) => {
      badgeTarget.textContent = `${e.target.value} kg`;
    });
  }

  if (inputTare && badgeTare) {
    inputTare.value = BAGANOVA_SYS.loadSensor.baselineTare;
    badgeTare.textContent = `${inputTare.value} kg`;
    inputTare.addEventListener('input', (e) => {
      badgeTare.textContent = `${e.target.value} kg`;
    });
  }

  if (inputFilter && badgeFilter) {
    inputFilter.value = BAGANOVA_SYS.esp32.filterWindow;
    badgeFilter.textContent = `${inputFilter.value} Sampel (${(inputFilter.value * 0.1).toFixed(1)} dtk)`;
    inputFilter.addEventListener('input', (e) => {
      badgeFilter.textContent = `${e.target.value} Sampel (${(e.target.value * 0.1).toFixed(1)} dtk)`;
    });
  }

  btnSave?.addEventListener('click', () => {
    const newTarget = parseFloat(inputTarget?.value) || 85.0;
    const newTare = parseFloat(inputTare?.value) || 20.0;
    const newFilter = parseInt(inputFilter?.value, 10) || 15;
    const newIp = inputEspIp?.value || '192.168.4.1';
    const newBaud = parseInt(inputBaud?.value, 10) || 115200;

    BAGANOVA_SYS.loadSensor.targetThreshold = newTarget;
    BAGANOVA_SYS.loadSensor.baselineTare = newTare;
    BAGANOVA_SYS.esp32.filterWindow = newFilter;
    BAGANOVA_SYS.esp32.ip = newIp;
    BAGANOVA_SYS.esp32.baudRate = newBaud;

    localStorage.setItem('baganova_target_threshold', newTarget);
    localStorage.setItem('baganova_baseline_tare', newTare);
    localStorage.setItem('baganova_filter_window', newFilter);
    localStorage.setItem('baganova_esp_ip', newIp);
    localStorage.setItem('baganova_esp_baud', newBaud);

    if (displayTargetThreshold) displayTargetThreshold.textContent = `${newTarget.toFixed(1)} kg`;
    if (statTargetLoad) statTargetLoad.textContent = `${newTarget.toFixed(1)} kg`;

    renderAnalyticsChart();
    showToast('Parameter sistem dan kalibrasi ESP32 berhasil disimpan.', 'success');
  });
}

// ==========================================================================
// 12. HERO QUICK ACTIONS & CAROUSEL
// ==========================================================================
function initHeroActions() {
  const heroQuickDemoBtn = document.getElementById('heroQuickDemoBtn');
  heroQuickDemoBtn?.addEventListener('click', () => {
    window.location.hash = '#/kontrol';
    setTimeout(() => {
      BAGANOVA_SYS.loadSensor.currentFiltered = BAGANOVA_SYS.loadSensor.targetThreshold;
      if (typeof window.triggerAutoHoistSequence === 'function') {
        window.triggerAutoHoistSequence('Otomatis ESP32');
      }
    }, 400);
  });
}

function initInfiniteCarousel() {
  const slideItems = document.querySelectorAll('.slide-item');
  slideItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      if (targetId) {
        const routeMap = {
          'about': '#/tentang',
          'monitoring': '#/monitoring',
          'control': '#/kontrol',
          'analytics': '#/analisis',
          'gallery': '#/galeri',
          'history': '#/riwayat',
          'settings': '#/pengaturan'
        };
        window.location.hash = routeMap[targetId] || '#/beranda';
      }
    });
  });
}

function initScrollUpButton() {
  const scrollUpBtn = document.getElementById('scrollUpBtn');
  if (!scrollUpBtn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 350) {
      scrollUpBtn.classList.add('visible');
    } else {
      scrollUpBtn.classList.remove('visible');
    }
  }, { passive: true });

  scrollUpBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

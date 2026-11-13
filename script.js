/* ==========================================================================
   SCRIPT.JS - LAB MAYA INFORMATIKA: STRUKTUR DATA STACK & QUEUE (KELAS X)
   Fitur: Debugging, Web Audio API Synthesizer, Simulasi 4 Misi, Ekspor PDF
   ========================================================================== */

const DEBUG_MODE = true;

function debugLog(moduleName, message, data = null) {
  if (!DEBUG_MODE) return;
  const time = new Date().toLocaleTimeString('id-ID');
  if (data !== null) {
    console.log(`[${time}] [${moduleName}] ${message}`, data);
  } else {
    console.log(`[${time}] [${moduleName}] ${message}`);
  }
}

function debugError(moduleName, err) {
  const time = new Date().toLocaleTimeString('id-ID');
  console.error(`[${time}] [ERROR - ${moduleName}]`, err);
}

/* ==========================================================================
   1. WEB AUDIO API SYNTHESIZER (SFX & BGM TANPA MP3 EKSTERNAL)
   ========================================================================== */
let audioCtx = null;
let sfxEnabled = true;
let bgmEnabled = true;
let bgmInterval = null;
let bgmStep = 0;

function initAudioEngine() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      debugLog('AUDIO', 'AudioContext berhasil dibuat.');
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (bgmEnabled && !bgmInterval) {
      startAmbientBgm();
    }
  } catch (err) {
    debugError('AUDIO', err);
  }
}

function playTone(freq, type = 'sine', duration = 0.14, gainVal = 0.12) {
  if (!sfxEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    debugError('AUDIO_TONE', err);
  }
}

function playSfx(kind) {
  if (!sfxEnabled || !audioCtx) return;
  switch (kind) {
    case 'click':
      playTone(580, 'triangle', 0.08, 0.1);
      break;
    case 'push':
      playTone(440, 'sine', 0.1, 0.12);
      setTimeout(() => playTone(660, 'sine', 0.14, 0.12), 70);
      break;
    case 'pop':
      playTone(660, 'sine', 0.1, 0.12);
      setTimeout(() => playTone(420, 'triangle', 0.15, 0.12), 70);
      break;
    case 'peek':
      playTone(880, 'sine', 0.12, 0.09);
      break;
    case 'error':
      playTone(210, 'sawtooth', 0.18, 0.14);
      setTimeout(() => playTone(165, 'sawtooth', 0.22, 0.14), 120);
      break;
    case 'success':
      playTone(523.25, 'triangle', 0.12, 0.13);
      setTimeout(() => playTone(659.25, 'triangle', 0.12, 0.13), 100);
      setTimeout(() => playTone(783.99, 'triangle', 0.22, 0.14), 200);
      break;
    default:
      playTone(500, 'sine', 0.08, 0.08);
  }
}

function startAmbientBgm() {
  if (bgmInterval) clearInterval(bgmInterval);
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C4 E4 G4 C5
  bgmInterval = setInterval(() => {
    if (!bgmEnabled || !audioCtx || audioCtx.state !== 'running') return;
    const freq = notes[bgmStep % notes.length];
    bgmStep++;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, audioCtx.currentTime + 1.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.15);
    } catch (e) {
      debugError('BGM', e);
    }
  }, 1350);
}

function toggleSfx() {
  initAudioEngine();
  sfxEnabled = !sfxEnabled;
  const btn = document.getElementById('btnSfx');
  const icon = document.getElementById('iconSfx');
  btn.classList.toggle('active', sfxEnabled);
  btn.classList.toggle('muted', !sfxEnabled);
  icon.textContent = sfxEnabled ? '🔊' : '🔇';
  if (sfxEnabled) playSfx('click');
  showToast(sfxEnabled ? 'Efek Suara (SFX) Diaktifkan' : 'Efek Suara (SFX) Dinonaktifkan');
}

function toggleBgm() {
  initAudioEngine();
  bgmEnabled = !bgmEnabled;
  const btn = document.getElementById('btnBgm');
  const icon = document.getElementById('iconBgm');
  btn.classList.toggle('active', bgmEnabled);
  btn.classList.toggle('muted', !bgmEnabled);
  icon.textContent = bgmEnabled ? '🎵' : '🔕';
  if (bgmEnabled) {
    startAmbientBgm();
    showToast('Musik Latar Laboratorium Diaktifkan');
  } else {
    showToast('Musik Latar Laboratorium Dinonaktifkan');
  }
}

function playInteractiveCardSound(topic) {
  initAudioEngine();
  playSfx('peek');
  debugLog('TEORI', `Kartu interaktif diklik: ${topic}`);
}

/* ==========================================================================
   2. NAVIGASI LAYAR & ANIMASI LOADING SPLASH SCREEN
   ========================================================================== */
function startPracticum() {
  initAudioEngine();
  playSfx('click');
  debugLog('NAVIGATION', 'Tombol Mulai Praktikum ditekan, menjalankan loading overlay.');

  const overlay = document.getElementById('loadingOverlay');
  const bar = document.getElementById('loadingBar');
  const percent = document.getElementById('loadingPercent');
  const stepText = document.getElementById('loadingStepText');
  const nodes = document.querySelectorAll('#loadingNodes .l-node');

  overlay.classList.add('show');

  const steps = [
    'Menyiapkan blok memori Stack (LIFO) & Queue (FIFO)...',
    'Memuat skenario Loket Pendaftaran Rumah Sakit...',
    'Mengkalibrasi operasi Push, Pop, Enqueue, dan Dequeue...',
    'Menghubungkan modul Tabel Percobaan & Eksportir LKPD PDF...',
    'Laboratorium Virtual siap digunakan!'
  ];

  let progress = 0;
  const timer = setInterval(() => {
    progress += 5;
    if (progress > 100) progress = 100;

    bar.style.width = `${progress}%`;
    percent.textContent = `${progress}%`;

    const idx = Math.min(Math.floor(progress / 22), steps.length - 1);
    stepText.textContent = steps[idx];

    nodes.forEach((node, i) => {
      if (progress >= (i + 1) * 20) {
        node.classList.add('lit');
      }
    });

    if (progress % 25 === 0) {
      playTone(420 + progress * 3, 'sine', 0.07, 0.06);
    }

    if (progress >= 100) {
      clearInterval(timer);
      playSfx('success');
      setTimeout(() => {
        overlay.classList.remove('show');
        document.getElementById('mainHeader').classList.remove('hidden');
        navigateTo('home');
      }, 320);
    }
  }, 55);
}

function navigateTo(viewName) {
  initAudioEngine();
  playSfx('click');
  debugLog('NAVIGATION', `Berpindah ke layar: #view-${viewName}`);

  document.querySelectorAll('.view').forEach(sec => sec.classList.remove('active'));
  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) targetSec.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === viewName);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(msg) {
  const box = document.getElementById('toastBox');
  if (!box) return;
  box.textContent = msg;
  box.classList.add('show');
  clearTimeout(box._hideTimer);
  box._hideTimer = setTimeout(() => box.classList.remove('show'), 2600);
}

/* ==========================================================================
   3. LOGIKA SIMULASI STRUKTUR DATA STACK (LIFO) & QUEUE (FIFO)
   ========================================================================== */
const MAX_CAPACITY = 6;
let currentMode = 'STACK'; // 'STACK' atau 'QUEUE'
let currentMission = 1;
let memoryBuffer = [];     // Elemen yang saat ini berada di dalam struktur data
let inputHistory = [];     // Urutan elemen sejak masuk pertama kali
let outputHistory = [];    // Urutan elemen yang dikeluarkan (Pop / Dequeue)
let errorSteps = 0;        // Pencatat kesalahan teknik / langkah siswa
let completedMissions = { 1: false, 2: false, 3: false, 4: false };
let experimentRecords = [];

const missionCatalog = {
  1: {
    title: 'Misi 1: Kasus Loket Rumah Sakit (Stack / LIFO)',
    requiredMode: 'STACK',
    desc: 'Petugas loket menumpuk formulir baru di ATAS formulir sebelumnya. Pastikan mode STACK aktif, masukkan minimal 3 pasien berurutan (Pasien 1 s.d. Pasien 3), lalu keluarkan semuanya dengan POP untuk melihat siapa yang dipanggil duluan!',
    presetSample: ['Pasien 1 - Andi (07:00)', 'Pasien 2 - Budi (07:05)', 'Pasien 3 - Citra (07:10)', 'Pasien 4 - Dedi (07:15)']
  },
  2: {
    title: 'Misi 2: Solusi Antrean Loket Adil (Queue / FIFO)',
    requiredMode: 'QUEUE',
    desc: 'Ubah metode loket menjadi adil! Pilih mode QUEUE (Antrean / FIFO), masukkan minimal 3 pasien berurutan dengan ENQUEUE, lalu panggil semuanya dengan DEQUEUE agar pasien yang datang pertama dilayani pertama.',
    presetSample: ['Pasien 1 - Andi (07:00)', 'Pasien 2 - Budi (07:05)', 'Pasien 3 - Citra (07:10)', 'Pasien 4 - Dedi (07:15)']
  },
  3: {
    title: 'Misi 3: Tumpukan Piring Bersih (Stack / LIFO)',
    requiredMode: 'STACK',
    desc: 'Simulasikan tumpukan piring di kantin! Gunakan mode STACK, masukkan 3 piring berurutan (Piring #1 s.d. Piring #3) dengan PUSH, lalu ambil piring satu per satu dengan POP.',
    presetSample: ['Piring #1 (Biru)', 'Piring #2 (Hijau)', 'Piring #3 (Kuning)', 'Piring #4 (Putih)']
  },
  4: {
    title: 'Misi 4: Eksperimen Bebas & Pengujian PEEK/FRONT',
    requiredMode: 'ANY',
    desc: 'Pilih struktur Stack atau Queue, masukkan minimal 3 objek, gunakan tombol PEEK/FRONT untuk mengintip elemen yang siap keluar, lalu keluarkan seluruh objek hingga tuntas.',
    presetSample: ['Dokumen A.pdf', 'Dokumen B.pdf', 'Dokumen C.pdf', 'Dokumen D.pdf']
  }
};

function selectMission(mId) {
  playSfx('click');
  currentMission = mId;
  debugLog('SIMULASI', `Memilih Misi ${mId}`, missionCatalog[mId]);

  document.querySelectorAll('.m-tab').forEach(tab => {
    tab.classList.toggle('active', Number(tab.dataset.mission) === mId);
  });

  const m = missionCatalog[mId];
  document.getElementById('missionInstruction').innerHTML = `<strong>${m.title}:</strong> ${m.desc}`;

  const statusBadge = document.getElementById('missionStatusBadge');
  if (completedMissions[mId]) {
    statusBadge.textContent = '✓ Misi Tuntas';
    statusBadge.classList.add('done');
  } else {
    statusBadge.textContent = 'Belum Tuntas';
    statusBadge.classList.remove('done');
  }

  // Otomatis sesuaikan mode pada Misi 1-3 untuk memudahkan orientasi awal
  if (m.requiredMode !== 'ANY') {
    setStructureMode(m.requiredMode, true);
  }
}

function setStructureMode(mode, silent = false) {
  if (!silent) playSfx('click');
  currentMode = mode;
  debugLog('SIMULASI', `Mode struktur data diubah ke: ${mode}`);

  document.getElementById('btnModeStack').classList.toggle('active', mode === 'STACK');
  document.getElementById('btnModeQueue').classList.toggle('active', mode === 'QUEUE');

  const lblInsert = document.getElementById('lblInsertOp');
  const lblRemove = document.getElementById('lblRemoveOp');
  const stageModeLabel = document.getElementById('stageModeLabel');
  const visualContainer = document.getElementById('visualContainer');

  if (mode === 'STACK') {
    lblInsert.textContent = 'PUSH (Taruh di Atas)';
    lblRemove.textContent = 'POP (Ambil dari Atas)';
    stageModeLabel.textContent = 'MODE AKTIF: STACK (LIFO - Last In First Out)';
    visualContainer.className = 'visual-container mode-stack';
  } else {
    lblInsert.textContent = 'ENQUEUE (Masuk Antrean)';
    lblRemove.textContent = 'DEQUEUE (Panggil Depan)';
    stageModeLabel.textContent = 'MODE AKTIF: QUEUE (FIFO - First In First Out)';
    visualContainer.className = 'visual-container mode-queue';
  }

  resetWorkbench(true);
}

function syncCustomInput() {
  const select = document.getElementById('presetItemSelect');
  const custom = document.getElementById('customItemInput');
  custom.value = select.value;
}

function appendOpLog(message) {
  const list = document.getElementById('opLogList');
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
  li.textContent = `[${time}] ${message}`;
  list.prepend(li);
}

function handleInsertItem() {
  initAudioEngine();
  const inputEl = document.getElementById('customItemInput');
  const label = (inputEl.value || '').trim();

  if (!label) {
    playSfx('error');
    errorSteps++;
    updateTelemetry();
    showToast('⚠️ Ketik atau pilih nama objek terlebih dahulu!');
    return;
  }

  // Cek kesesuaian mode dengan misi aktif
  const reqMode = missionCatalog[currentMission].requiredMode;
  if (reqMode !== 'ANY' && currentMode !== reqMode) {
    playSfx('error');
    errorSteps++;
    appendOpLog(`[PERINGATAN] Misi ${currentMission} meminta mode ${reqMode}, bukan ${currentMode}!`);
    showToast(`⚠️ Misi ${currentMission} mengharuskan mode ${reqMode}!`);
  }

  if (memoryBuffer.length >= MAX_CAPACITY) {
    playSfx('error');
    errorSteps++;
    appendOpLog(`[OVERFLOW] Gagal menyimpan "${label}" — Kapasitas penuh (${MAX_CAPACITY} slot).`);
    updateTelemetry();
    showToast('⚠️ Stack/Queue Overflow! Kapasitas memori penuh (Maks 6).');
    return;
  }

  memoryBuffer.push(label);
  inputHistory.push(label);
  playSfx('push');

  const opName = currentMode === 'STACK' ? 'PUSH' : 'ENQUEUE';
  appendOpLog(`[${opName}] "${label}" disimpan ke dalam ${currentMode}.`);
  debugLog('SIMULASI', `${opName}: ${label}`, memoryBuffer);

  // Otomatis geser pilihan dropdown ke item berikutnya agar praktikum lancar
  const select = document.getElementById('presetItemSelect');
  if (select.selectedIndex < select.options.length - 1) {
    select.selectedIndex++;
    syncCustomInput();
  }

  renderVisualizer();
  updateTelemetry();
}

function handleRemoveItem() {
  initAudioEngine();
  if (memoryBuffer.length === 0) {
    playSfx('error');
    errorSteps++;
    appendOpLog(`[UNDERFLOW] Gagal mengeluarkan data — ${currentMode} sedang kosong!`);
    updateTelemetry();
    showToast(`⚠️ ${currentMode} Underflow! Tidak ada objek untuk dikeluarkan.`);
    return;
  }

  let removedItem = '';
  let opName = '';

  if (currentMode === 'STACK') {
    // LIFO: Ambil dari posisi paling atas (elemen terakhir yang masuk)
    removedItem = memoryBuffer.pop();
    opName = 'POP';
  } else {
    // FIFO: Ambil dari posisi paling depan (elemen pertama yang masuk)
    removedItem = memoryBuffer.shift();
    opName = 'DEQUEUE';
  }

  outputHistory.push(removedItem);
  playSfx('pop');
  appendOpLog(`[${opName}] "${removedItem}" dikeluarkan/dipanggil dari ${currentMode}.`);
  debugLog('SIMULASI', `${opName}: ${removedItem}`, outputHistory);

  renderVisualizer();
  updateTelemetry();
}

function handlePeekItem() {
  initAudioEngine();
  if (memoryBuffer.length === 0) {
    playSfx('error');
    showToast('⚠️ Struktur data masih kosong, belum ada elemen untuk diintip.');
    return;
  }

  playSfx('peek');
  const targetItem = currentMode === 'STACK'
    ? memoryBuffer[memoryBuffer.length - 1]
    : memoryBuffer[0];

  const ptrName = currentMode === 'STACK' ? 'TOP (Puncak Tumpukan)' : 'FRONT (Depan Antrean)';
  appendOpLog(`[PEEK] Elemen pada ${ptrName} saat ini adalah "${targetItem}".`);
  showToast(`👁️ ${ptrName}: ${targetItem}`);

  const activeNode = document.querySelector('.data-node.active-pointer');
  if (activeNode) {
    activeNode.classList.add('peek-highlight');
    setTimeout(() => activeNode.classList.remove('peek-highlight'), 900);
  }
}

function handleAutoFillSample() {
  initAudioEngine();
  resetWorkbench(true);
  const sampleItems = missionCatalog[currentMission].presetSample;
  sampleItems.forEach(item => {
    memoryBuffer.push(item);
    inputHistory.push(item);
  });
  playSfx('push');
  appendOpLog(`[AUTO-FILL] 4 data sampel Misi ${currentMission} dimasukkan secara berurutan.`);
  renderVisualizer();
  updateTelemetry();
  showToast('⚡ 4 data berurutan berhasil dimasukkan! Sekarang tekan POP / DEQUEUE.');
}

function resetWorkbench(silent = false) {
  if (!silent) playSfx('click');
  memoryBuffer = [];
  inputHistory = [];
  outputHistory = [];
  renderVisualizer();
  updateTelemetry();
  if (!silent) {
    appendOpLog('[RESET] Meja kerja dikosongkan.');
    showToast('🔄 Meja simulasi berhasil di-reset.');
  }
}

function renderVisualizer() {
  const container = document.getElementById('visualContainer');
  const capLabel = document.getElementById('stageCapacityLabel');
  const ptrLeft = document.getElementById('pointerInfoLeft');
  const ptrRight = document.getElementById('pointerInfoRight');

  capLabel.textContent = `Kapasitas Memori: ${memoryBuffer.length} / ${MAX_CAPACITY} Slot`;
  container.innerHTML = '';

  if (memoryBuffer.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-hint';
    emptyMsg.textContent = currentMode === 'STACK'
      ? 'Tumpukan (Stack) masih kosong. Tekan PUSH untuk menaruh objek.'
      : 'Antrean (Queue) masih kosong. Tekan ENQUEUE untuk memasukkan objek.';
    container.appendChild(emptyMsg);

    if (currentMode === 'STACK') {
      ptrLeft.textContent = '📌 Dasar Tumpukan (Bottom): Kosong';
      ptrRight.textContent = '🎯 Puncak Tumpukan (Top): Kosong';
    } else {
      ptrLeft.textContent = '🎯 Depan Antrean (Front): Kosong';
      ptrRight.textContent = '📌 Belakang Antrean (Rear): Kosong';
    }
    return;
  }

  if (currentMode === 'STACK') {
    memoryBuffer.forEach((item, idx) => {
      const isTop = idx === memoryBuffer.length - 1;
      const node = document.createElement('div');
      node.className = `data-node ${isTop ? 'active-pointer' : ''}`;
      node.innerHTML = `
        <span>${item}</span>
        <span class="node-badge">${isTop ? 'TOP (Keluar Duluan)' : `Slot #${idx + 1}`}</span>
      `;
      container.appendChild(node);
    });
    ptrLeft.textContent = `📌 Bottom (Pertama Masuk): ${memoryBuffer[0]}`;
    ptrRight.textContent = `🎯 Top (Siap POP): ${memoryBuffer[memoryBuffer.length - 1]}`;
  } else {
    // Mode QUEUE: Tampilkan dari Kiri (REAR / Masuk) ke Kanan (FRONT / Keluar) seperti Gambar 2.3 Buku
    const reversedForQueueView = [...memoryBuffer].reverse();
    reversedForQueueView.forEach((item, revIdx) => {
      const isFront = revIdx === reversedForQueueView.length - 1;
      const isRear = revIdx === 0;
      let badgeText = 'Mengantre';
      if (isFront) badgeText = 'FRONT (Keluar Duluan)';
      else if (isRear) badgeText = 'REAR (Baru Masuk)';

      const node = document.createElement('div');
      node.className = `data-node ${isFront ? 'active-pointer' : ''}`;
      node.innerHTML = `
        <span>${item}</span>
        <span class="node-badge">${badgeText}</span>
      `;
      container.appendChild(node);
    });
    ptrLeft.textContent = `📌 Rear (Terakhir Masuk): ${memoryBuffer[memoryBuffer.length - 1]}`;
    ptrRight.textContent = `🎯 Front (Siap DEQUEUE): ${memoryBuffer[0]}`;
  }
}

function updateTelemetry() {
  document.getElementById('teleFirstIn').textContent = inputHistory[0] || '-';
  document.getElementById('teleFirstOut').textContent = outputHistory[0] || '-';
  document.getElementById('telePrinciple').textContent = currentMode === 'STACK'
    ? 'LIFO (Last In First Out)'
    : 'FIFO (First In First Out)';
  document.getElementById('teleErrorCount').textContent = `${errorSteps} Kali`;
  document.getElementById('outCountBadge').textContent = `${outputHistory.length} Objek`;

  // Render daftar urutan objek yang sudah dikeluarkan
  const procList = document.getElementById('processedList');
  procList.innerHTML = '';
  if (outputHistory.length === 0) {
    procList.innerHTML = '<div class="empty-hint">Belum ada objek yang dikeluarkan (tekan POP atau DEQUEUE).</div>';
  } else {
    outputHistory.forEach((item, idx) => {
      const pill = document.createElement('span');
      pill.className = 'proc-pill';
      pill.textContent = `${idx + 1}. ${item}`;
      procList.appendChild(pill);
    });
  }

  // Analisis diagnostik otomatis
  const diagBox = document.getElementById('diagnosticAlert');
  const diagText = document.getElementById('diagnosticText');

  if (outputHistory.length === 0) {
    diagBox.className = 'diagnostic-box neutral';
    diagText.textContent = 'Masukkan minimal 3 data pasien/objek lalu keluarkan satu per satu untuk menguji urutan pemrosesannya.';
  } else if (currentMode === 'STACK') {
    const firstIn = inputHistory[0];
    const firstOut = outputHistory[0];
    if (firstIn.toLowerCase().includes('pasien')) {
      diagBox.className = 'diagnostic-box warn';
      diagText.innerHTML = `Pada <strong>Stack (LIFO)</strong>, yang pertama masuk adalah <em>${firstIn}</em>, tetapi yang dipanggil pertama justru <strong>${firstOut}</strong>! Untuk antrean pasien di loket rumah sakit, urutan ini <strong>Tidak Adil</strong> karena pasien yang datang paling awal tertimbun di paling bawah.`;
    } else {
      diagBox.className = 'diagnostic-box good';
      diagText.innerHTML = `Pada <strong>Stack (LIFO)</strong>, objek terakhir yang ditaruh di atas (<strong>${firstOut}</strong>) diambil pertama kali. Cocok untuk tumpukan piring, tumpukan buku, atau fitur <em>Undo</em>.`;
    }
  } else {
    const firstIn = inputHistory[0];
    const firstOut = outputHistory[0];
    diagBox.className = 'diagnostic-box good';
    diagText.innerHTML = `Pada <strong>Queue (FIFO)</strong>, objek pertama yang masuk (<strong>${firstIn}</strong>) juga menjadi yang pertama keluar/dilayani (<strong>${firstOut}</strong>). Urutan ini <strong>Adil &amp; Tepat</strong> untuk antrean loket rumah sakit!`;
  }
}

function recordAndVerifyExperiment() {
  initAudioEngine();

  if (inputHistory.length < 3 || outputHistory.length < 2) {
    playSfx('error');
    errorSteps++;
    updateTelemetry();
    showToast('⚠️ Masukkan minimal 3 data dan keluarkan minimal 2 data sebelum mencatat ke tabel!');
    return;
  }

  const reqMode = missionCatalog[currentMission].requiredMode;
  if (reqMode !== 'ANY' && currentMode !== reqMode) {
    playSfx('error');
    errorSteps++;
    updateTelemetry();
    showToast(`⚠️ Misi ${currentMission} harus dijalankan pada mode ${reqMode}!`);
    return;
  }

  const principleStr = currentMode === 'STACK' ? 'Stack (LIFO)' : 'Queue (FIFO)';
  let evaluationStr = '';

  if (currentMode === 'STACK' && inputHistory[0].toLowerCase().includes('pasien')) {
    evaluationStr = 'Tidak Adil untuk antrean loket (Pasien terakhir masuk justru dipanggil pertama / LIFO)';
  } else if (currentMode === 'QUEUE') {
    evaluationStr = 'Adil untuk antrean loket (Pasien pertama datang dilayani pertama / FIFO)';
  } else {
    evaluationStr = 'Sesuai karakteristik tumpukan fisik / LIFO (Objek paling atas diambil lebih dulu)';
  }

  const record = {
    no: experimentRecords.length + 1,
    mission: missionCatalog[currentMission].title,
    structure: principleStr,
    inputs: inputHistory.join(' → '),
    outputs: outputHistory.join(' → '),
    evaluation: evaluationStr
  };

  experimentRecords.push(record);
  completedMissions[currentMission] = true;

  playSfx('success');
  renderExperimentTable();
  selectMission(currentMission);
  debugLog('TABEL_PERCOBAAN', 'Data percobaan berhasil dicatat dan misi diverifikasi:', record);
  showToast(`✅ Data Misi ${currentMission} tercatat ke Tabel & Misi Terverifikasi!`);
}

function renderExperimentTable() {
  const tbody = document.getElementById('experimentTableBody');
  tbody.innerHTML = '';

  if (experimentRecords.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Belum ada data percobaan yang dicatat. Lakukan simulasi lalu klik tombol "Catat Data ke Tabel &amp; Verifikasi Misi".</td>
      </tr>
    `;
    return;
  }

  experimentRecords.forEach((rec, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${i + 1}</strong></td>
      <td>${rec.mission}</td>
      <td><span class="badge-mini">${rec.structure}</span></td>
      <td>${rec.inputs}</td>
      <td>${rec.outputs}</td>
      <td>${rec.evaluation}</td>
    `;
    tbody.appendChild(tr);
  });
}

function clearExperimentTable() {
  playSfx('click');
  experimentRecords = [];
  renderExperimentTable();
  showToast('🗑️ Tabel data percobaan telah dikosongkan.');
}

/* ==========================================================================
   4. VALIDASI DIAGNOSTik OTOMATIS LKPD (SOAL NOMOR 5 - 8)
   ========================================================================== */
const diagnosticKeys = {
  5: {
    accepted: ['fifo', 'first in first out'],
    okMsg: '✓ Tepat sekali! Queue (Antrean) menggunakan prinsip FIFO (First In First Out).',
    errMsg: '✗ Kurang tepat. Ingat: yang pertama masuk ke antrean adalah yang pertama keluar (4 huruf: F_F_).'
  },
  6: {
    accepted: ['lifo', 'last in first out', 'filo'],
    okMsg: '✓ Benar! Stack (Tumpukan) menggunakan prinsip LIFO (Last In First Out).',
    errMsg: '✗ Kurang tepat. Pada tumpukan piring/buku, yang terakhir masuk akan keluar pertama (4 huruf: L_F_).'
  },
  7: {
    accepted: ['pop'],
    okMsg: '✓ Tepat! Operasi mengeluarkan/mengambil data dari puncak Stack disebut POP.',
    errMsg: '✗ Belum tepat. Istilah mengambil elemen dari atas Stack adalah POP (sedangkan memasukkan adalah PUSH).'
  },
  8: {
    accepted: ['enqueue'],
    okMsg: '✓ Tepat! Operasi menambahkan objek baru ke belakang antrean (Queue) disebut ENQUEUE.',
    errMsg: '✗ Belum tepat. Istilah memasukkan objek ke dalam Queue adalah ENQUEUE (sedangkan mengeluarkan adalah DEQUEUE).'
  }
};

function checkDiagnosticAnswer(qNum) {
  initAudioEngine();
  const inputEl = document.getElementById(`q${qNum}`);
  const fbEl = document.getElementById(`fb-q${qNum}`);
  const val = (inputEl.value || '').trim().toLowerCase();

  if (!val) {
    playSfx('error');
    fbEl.className = 'diag-feedback err';
    fbEl.textContent = '⚠️ Silakan ketik jawaban Anda terlebih dahulu sebelum menekan tombol Cek.';
    return;
  }

  const rule = diagnosticKeys[qNum];
  const isCorrect = rule.accepted.includes(val);

  if (isCorrect) {
    playSfx('success');
    fbEl.className = 'diag-feedback ok';
    fbEl.textContent = rule.okMsg;
  } else {
    playSfx('error');
    fbEl.className = 'diag-feedback err';
    fbEl.textContent = rule.errMsg;
  }
  debugLog('LKPD_CEK', `Soal ${qNum} dicek: "${val}" -> ${isCorrect ? 'BENAR' : 'SALAH'}`);
}

/* ==========================================================================
   5. EKSPOR LKPD KE PDF UKURAN A4 MENGGUNAKAN JSPDF 2.5.1
   ========================================================================== */
function exportLkpdToPdf() {
  initAudioEngine();
  playSfx('click');

  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('⚠️ Pustaka jsPDF belum termuat. Periksa koneksi internet Anda.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const studentName = (document.getElementById('studentName').value || 'Siswa_Tanpa_Nama').trim();
    const studentClass = (document.getElementById('studentClass').value || '-').trim();
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    let y = 18;
    const leftMargin = 16;
    const maxLineWidth = 178;

    const checkPageBreak = (neededHeight = 14) => {
      if (y + neededHeight > 272) {
        doc.addPage();
        y = 18;
      }
    };

    // KOP LAPORAN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN PRAKTIKUM LABORATORIUM VIRTUAL INFORMATIKA', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(11);
    doc.text('Topik: Memilih Struktur Data Tumpukan (Stack) & Antrean (Queue)', 105, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SMA Negeri 12 Wajo • Fase E / Kelas X • Pengembang: Andi Wahidin Burhanuddin', 105, y, { align: 'center' });
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(leftMargin, y, 194, y);
    y += 7;

    // IDENTITAS SISWA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Nama Siswa : ${studentName}`, leftMargin, y);
    doc.text(`Tanggal : ${dateStr}`, 130, y);
    y += 6;
    doc.text(`Kelas / Rombel : ${studentClass}`, leftMargin, y);
    y += 8;

    // REKAP TABEL DATA HASIL PERCOBAAN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('I. REKAP DATA HASIL PERCOBAAN SIMULASI', leftMargin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    if (experimentRecords.length === 0) {
      doc.text('- Belum ada data percobaan yang direkam pada tabel simulasi.', leftMargin, y);
      y += 7;
    } else {
      experimentRecords.forEach((rec, idx) => {
        checkPageBreak(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${rec.mission} [${rec.structure}]`, leftMargin, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');

        const inLines = doc.splitTextToSize(`   • Urutan Masuk (Input) : ${rec.inputs}`, maxLineWidth);
        doc.text(inLines, leftMargin, y);
        y += inLines.length * 4.3;

        const outLines = doc.splitTextToSize(`   • Urutan Keluar (Output): ${rec.outputs}`, maxLineWidth);
        doc.text(outLines, leftMargin, y);
        y += outLines.length * 4.3;

        const evalLines = doc.splitTextToSize(`   • Evaluasi : ${rec.evaluation}`, maxLineWidth);
        doc.text(evalLines, leftMargin, y);
        y += evalLines.length * 4.3 + 2;
      });
    }

    y += 3;
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('II. JAWABAN LEMBAR KERJA PESERTA DIDIK (10 SOAL)', leftMargin, y);
    y += 6;

    const questionsMeta = [
      '1. Analisis urutan panggilan pasien dengan metode Stack (LIFO) di loket rumah sakit dan keadilannya:',
      '2. Perubahan urutan panggilan pasien dengan metode Queue (FIFO) dan alasan ketepatannya:',
      '3. Cara menyusun/mengambil tumpukan formulir fisik agar tetap menghasilkan urutan FIFO:',
      '4. Alasan piring pertama di bagian paling bawah tumpukan menjadi yang terakhir diambil (LIFO):',
      '5. Singkatan prinsip penyimpanan data pada Antrean (Queue):',
      '6. Singkatan prinsip penyimpanan data pada Tumpukan (Stack):',
      '7. Nama operasi untuk mengeluarkan elemen dari puncak Stack:',
      '8. Nama operasi untuk menambahkan elemen baru ke belakang Queue:',
      '9. Pemilihan struktur data yang tepat untuk fitur Undo dan Printer Spooler beserta penjelasannya:',
      '10. Kesimpulan akhir perbedaan Stack vs Queue dan pedoman pemilihannya di kehidupan nyata:'
    ];

    questionsMeta.forEach((qTitle, index) => {
      const qId = index + 1;
      const rawAns = (document.getElementById(`q${qId}`).value || '(Belum dijawab)').trim();

      checkPageBreak(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const qLines = doc.splitTextToSize(qTitle, maxLineWidth);
      doc.text(qLines, leftMargin, y);
      y += qLines.length * 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      const ansLines = doc.splitTextToSize(`Jawaban: ${rawAns}`, maxLineWidth);
      ansLines.forEach(line => {
        checkPageBreak(7);
        doc.text(line, leftMargin + 3, y);
        y += 4.5;
      });
      y += 2.5;
    });

    const safeName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `LKPD_Stack_Queue_${safeName}.pdf`;
    doc.save(fileName);

    playSfx('success');
    debugLog('PDF_EXPORT', `Berhasil mengunduh PDF: ${fileName}`);
    showToast(`📄 Laporan PDF berhasil diunduh: ${fileName}`);
  } catch (err) {
    debugError('PDF_EXPORT', err);
    showToast('⚠️ Gagal membuat berkas PDF. Cek Console (F12).');
  }
}

/* ==========================================================================
   6. ANIMASI LATAR CANVAS 2D (NODE DATA & BIT BINER INFORMATIKA)
   ========================================================================== */
function initBackgroundCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const symbols = ['0', '1', 'PUSH', 'POP', 'FIFO', 'LIFO', '[ ]'];
  const particles = Array.from({ length: 34 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    size: Math.random() * 2 + 1.5,
    text: symbols[Math.floor(Math.random() * symbols.length)],
    isGold: Math.random() > 0.68
  }));

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Garis koneksi antar node yang berdekatan
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 135) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 135) * 0.14})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = p.isGold ? 'rgba(250, 204, 21, 0.32)' : 'rgba(56, 189, 248, 0.28)';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(p.text, p.x, p.y);
    }

    requestAnimationFrame(drawFrame);
  }

  drawFrame();
}

/* ==========================================================================
   7. INISIALISASI SAAT HALAMAN SELESAI DIMUAT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  debugLog('INIT', 'Aplikasi Lab Maya Struktur Data Stack & Queue dimuat.');
  initBackgroundCanvas();
  selectMission(1);
  renderVisualizer();
  updateTelemetry();
});

/**
 * app.js — Shared Application Logic
 * Church Media PWA
 *
 * Covers:
 * - Device/viewport lockout enforcement
 * - PWA Service Worker registration & install prompt
 * - Firebase Firestore real-time listener (public data)
 * - File System Access API (private notes — never touches Firebase)
 * - IndexedDB for folder handle persistence
 * - Calendar rendering & swipe navigation
 * - Rich-text editor with autosave & Bible verse detection
 * - Audio player controller
 * - Offline Bible modal engine
 * - M3 UI helpers (ripple, snackbar, dialogs)
 */

'use strict';

// ════════════════════════════════════════════════════════
// 0.  GLOBAL STATE
// ════════════════════════════════════════════════════════
const AppState = {
  // Calendar
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-indexed
  selectedDate: null,               // 'YYYY-MM-DD'
  calendarVisible: true,

  // Firestore events cache  { 'YYYY-MM-DD': { title, preacher, verse, audioUrl, slidesUrl } }
  events: {},

  // File System
  dirHandle: null,

  // Editor
  currentNoteFile: null,
  saveDebounceTimer: null,
  verseDebounceTimer: null,
  editorDirty: false,

  // Audio
  audioEl: null,

  // Navigation
  activeTab: 'home',   // 'home' | 'notes' | 'settings'

  // Bible modal
  bibleTranslation: 'ESV',

  // PWA
  deferredInstallPrompt: null,
};

// ════════════════════════════════════════════════════════
// 1.  DEVICE / VIEWPORT LOCKOUT
// ════════════════════════════════════════════════════════
function checkViewportLock() {
  const lockout   = document.getElementById('desktop-lockout');
  const appRoot   = document.getElementById('app-root');
  if (!lockout || !appRoot) return;

  const isMobile = window.innerWidth <= 480;
  if (isMobile) {
    lockout.classList.remove('active');
    appRoot.style.display = '';
  } else {
    lockout.classList.add('active');
    appRoot.style.display = 'none';
  }
}

window.addEventListener('resize', checkViewportLock);

// ════════════════════════════════════════════════════════
// 2.  SERVICE WORKER REGISTRATION
// ════════════════════════════════════════════════════════
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    console.log('[App] SW registered, scope:', reg.scope);

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showSnackbar('update', 'App updated — refresh to apply');
        }
      });
    });
  } catch (err) {
    console.warn('[App] SW registration failed:', err);
  }
}

// ════════════════════════════════════════════════════════
// 3.  PWA INSTALL PROMPT
// ════════════════════════════════════════════════════════
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  AppState.deferredInstallPrompt = e;
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    setTimeout(() => banner.classList.add('visible'), 2000);
  }
});

window.addEventListener('appinstalled', () => {
  AppState.deferredInstallPrompt = null;
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.remove('visible');
  showSnackbar('check_circle', 'App installed successfully!');
});

function triggerPwaInstall() {
  if (!AppState.deferredInstallPrompt) return;
  AppState.deferredInstallPrompt.prompt();
  AppState.deferredInstallPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') {
      showSnackbar('check_circle', 'Installing app…');
    }
    AppState.deferredInstallPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.remove('visible');
  });
}

function dismissInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.remove('visible');
}

// ════════════════════════════════════════════════════════
// 4.  INDEXED DB — Folder Handle Persistence
// ════════════════════════════════════════════════════════
const IDB_NAME    = 'church-pwa-db';
const IDB_VERSION = 1;
const IDB_STORE   = 'folder-handles';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function saveFolderHandle(handle) {
  try {
    const db  = await openIDB();
    const tx  = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, 'notes-dir');
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    db.close();
  } catch (err) {
    console.warn('[IDB] Could not save folder handle:', err);
  }
}

async function loadFolderHandle() {
  try {
    const db     = await openIDB();
    const tx     = db.transaction(IDB_STORE, 'readonly');
    const handle = await new Promise((res, rej) => {
      const req = tx.objectStore(IDB_STORE).get('notes-dir');
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
    db.close();
    return handle || null;
  } catch (err) {
    console.warn('[IDB] Could not load folder handle:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════
// 5.  FILE SYSTEM ACCESS API — Notes
// ════════════════════════════════════════════════════════
async function requestFolderAccess(silent = false) {
  if (!('showDirectoryPicker' in window)) {
    if (!silent) showSnackbar('warning', 'File System API not supported on this browser.');
    return false;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    AppState.dirHandle = handle;
    await saveFolderHandle(handle);
    updateFolderStatus(true, handle.name);
    showSnackbar('folder', `Notes folder: "${handle.name}" connected`);
    closeFolderPrompt();
    return true;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[FS] Directory picker error:', err);
      showSnackbar('error', 'Could not access folder. Try again.');
    }
    return false;
  }
}

async function restoreFolderHandle() {
  const handle = await loadFolderHandle();
  if (!handle) return;
  try {
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      AppState.dirHandle = handle;
      updateFolderStatus(true, handle.name);
      return;
    }
    if (perm === 'prompt') {
      // Show re-auth UI gently
      updateFolderStatus(false, handle.name, true);
    }
  } catch (err) {
    console.warn('[FS] Could not restore handle:', err);
  }
}

async function reRequestPermission() {
  const handle = await loadFolderHandle();
  if (!handle) { requestFolderAccess(); return; }
  try {
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      AppState.dirHandle = handle;
      updateFolderStatus(true, handle.name);
      showSnackbar('folder', `Folder "${handle.name}" reconnected`);
    }
  } catch (err) {
    requestFolderAccess();
  }
}

function updateFolderStatus(connected, name = '', needsReauth = false) {
  const el = document.getElementById('folder-status');
  if (!el) return;
  if (connected) {
    el.innerHTML = `<span class="material-symbols-rounded status-icon">folder_open</span> Notes saved to: <strong>${name}</strong>`;
    el.className = 'save-status saved';
  } else if (needsReauth) {
    el.innerHTML = `<span class="material-symbols-rounded status-icon">folder_off</span> Tap to reconnect folder: <strong>${name}</strong>`;
    el.className = 'save-status saving';
    el.style.cursor = 'pointer';
    el.onclick = reRequestPermission;
  } else {
    el.innerHTML = `<span class="material-symbols-rounded status-icon">folder_off</span> No folder connected`;
    el.className = 'save-status';
    el.style.cursor = '';
    el.onclick = null;
  }
}

function getNoteFileName(dateStr, slideIndex = null) {
  if (slideIndex !== null) {
    return `${dateStr}_slide${slideIndex + 1}.html`;
  }
  return `${dateStr}_general.html`;
}

async function readNote(fileName) {
  if (!AppState.dirHandle) return null;
  try {
    const fileHandle = await AppState.dirHandle.getFileHandle(fileName, { create: false });
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    if (err.name === 'NotFoundError') return null;
    console.warn('[FS] readNote error:', err);
    return null;
  }
}

async function writeNote(fileName, content) {
  if (!AppState.dirHandle) return false;
  try {
    const fileHandle = await AppState.dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (err) {
    console.warn('[FS] writeNote error:', err);
    return false;
  }
}

async function listNoteFiles() {
  if (!AppState.dirHandle) return [];
  const files = [];
  for await (const [name] of AppState.dirHandle.entries()) {
    if (name.endsWith('.html')) files.push(name);
  }
  return files.sort();
}

// ════════════════════════════════════════════════════════
// 6.  FIREBASE / FIRESTORE (Public data only)
// ════════════════════════════════════════════════════════
// Firebase config is injected in manage.html.
// index.html reads events via a globally-initialized db instance.

let db = null; // Set after Firebase init

function initFirestore(firebaseConfig) {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.warn('[Firestore] No config provided — running offline/demo mode.');
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    startEventsListener();
    console.log('[Firestore] Connected.');
  } catch (err) {
    console.error('[Firestore] Init error:', err);
  }
}

function startEventsListener() {
  if (!db) return;
  db.collection('calendar_events')
    .orderBy('date', 'asc')
    .onSnapshot(snapshot => {
      AppState.events = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        AppState.events[data.date] = { id: doc.id, ...data };
      });
      renderCalendar();
      if (AppState.selectedDate) loadDateContent(AppState.selectedDate);
      console.log(`[Firestore] Events synced: ${Object.keys(AppState.events).length}`);
    }, err => {
      console.warn('[Firestore] Listener error:', err);
    });
}

// ════════════════════════════════════════════════════════
// 7.  CALENDAR COMPONENT
// ════════════════════════════════════════════════════════
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('calendar-month-label');
  if (!grid || !monthLabel) return;

  const { viewYear, viewMonth } = AppState;
  monthLabel.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  let html = '';
  // Day headers
  DAY_NAMES.forEach(d => {
    html += `<div class="calendar-day-name">${d}</div>`;
  });

  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-day"></div>`;
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = formatDate(viewYear, viewMonth, d);
    const isToday  = dateStr === todayStr;
    const isSelected = dateStr === AppState.selectedDate;
    const hasEvent = !!AppState.events[dateStr];

    let cls = 'calendar-day ripple-container';
    if (isSelected) cls += ' selected';
    else if (isToday) cls += ' today';
    if (hasEvent) cls += ' has-event';

    html += `<div class="${cls}" data-date="${dateStr}" onclick="handleDayClick('${dateStr}', event)">${d}</div>`;
  }

  grid.innerHTML = html;
}

function handleDayClick(dateStr, e) {
  addRipple(e);
  AppState.selectedDate = dateStr;
  renderCalendar();
  loadDateContent(dateStr);
}

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function navigateCalendar(direction) {
  AppState.viewMonth += direction;
  if (AppState.viewMonth > 11) { AppState.viewMonth = 0; AppState.viewYear++; }
  if (AppState.viewMonth < 0)  { AppState.viewMonth = 11; AppState.viewYear--; }
  renderCalendar();
  animateCalendarSlide(direction);
}

function animateCalendarSlide(direction) {
  const slide = document.getElementById('calendar-slide');
  if (!slide) return;
  const from = direction > 0 ? '40px' : '-40px';
  slide.style.transition = 'none';
  slide.style.transform = `translateX(${from})`;
  slide.style.opacity = '0';
  requestAnimationFrame(() => {
    slide.style.transition = 'transform 320ms cubic-bezier(0.2,0,0,1), opacity 200ms ease';
    slide.style.transform = 'translateX(0)';
    slide.style.opacity = '1';
  });
}

function toggleCalendar() {
  AppState.calendarVisible = !AppState.calendarVisible;
  const section = document.getElementById('calendar-section');
  const btn     = document.getElementById('calendar-toggle-btn');
  if (section) section.classList.toggle('collapsed', !AppState.calendarVisible);
  if (btn)     btn.textContent = AppState.calendarVisible ? 'calendar_month' : 'calendar_view_month';
  // Update content area height
  const content = document.getElementById('date-content');
  if (content) {
    content.style.marginTop = AppState.calendarVisible ? '' : '0';
  }
}

// Touch swipe for calendar
let calendarTouchStartX = 0;
let calendarTouchStartY = 0;

function initCalendarSwipe() {
  const el = document.getElementById('calendar-section');
  if (!el) return;

  el.addEventListener('touchstart', e => {
    calendarTouchStartX = e.touches[0].clientX;
    calendarTouchStartY = e.touches[0].clientY;
  }, { passive: true });

  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - calendarTouchStartX;
    const dy = e.changedTouches[0].clientY - calendarTouchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      navigateCalendar(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
}

// ════════════════════════════════════════════════════════
// 8.  DATE CONTENT LOADER
// ════════════════════════════════════════════════════════
async function loadDateContent(dateStr) {
  const event    = AppState.events[dateStr] || null;
  const section  = document.getElementById('date-content');
  if (!section) return;

  const dateDisplay = document.getElementById('selected-date-display');
  if (dateDisplay) {
    const d = new Date(dateStr + 'T00:00:00');
    dateDisplay.textContent = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (event) {
    // State A: Admin data exists
    showEventContent(event, dateStr);
  } else {
    // State B: No admin data — journal mode
    showJournalMode(dateStr);
  }
}

function showEventContent(event, dateStr) {
  // Title / Preacher / Verse header
  setEl('event-title',   event.title   || '');
  setEl('event-preacher',event.preacher ? `By ${event.preacher}` : '');
  setEl('event-verse',   event.verse   || '');

  // Visibility
  showSection('event-header-section', true);
  showSection('no-event-banner', false);
  showSection('audio-section', !!event.audioUrl);
  showSection('slides-section', !!event.slidesUrl);

  // Audio
  if (event.audioUrl) {
    setupAudioPlayer(event.audioUrl, event.title);
  }

  // Slides
  if (event.slidesUrl) {
    setupSlideViewer(event.slidesUrl);
  }

  // Notes — keyed to general or first slide
  loadNoteForContext(dateStr, event.slidesUrl ? 0 : null);
}

function showJournalMode(dateStr) {
  showSection('event-header-section', false);
  showSection('no-event-banner', true);
  showSection('audio-section', false);
  showSection('slides-section', false);
  loadNoteForContext(dateStr, null);
}

// ════════════════════════════════════════════════════════
// 9.  AUDIO PLAYER
// ════════════════════════════════════════════════════════
function convertGDriveLink(url) {
  if (!url) return null;
  // Google Drive sharing link: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url; // Return as-is if not a Drive link
}

function setupAudioPlayer(rawUrl, title) {
  const url = convertGDriveLink(rawUrl);
  const playerEl = document.getElementById('audio-player-container');
  if (!playerEl) return;

  // Create or reuse audio element
  if (AppState.audioEl) {
    AppState.audioEl.pause();
    AppState.audioEl.src = '';
  }
  AppState.audioEl = new Audio();
  AppState.audioEl.src = url;
  AppState.audioEl.preload = 'metadata';

  const playBtn   = document.getElementById('audio-play-btn');
  const progressBar = document.getElementById('audio-progress-fill');
  const progressWrap = document.getElementById('audio-progress-wrap');
  const currentTime = document.getElementById('audio-current');
  const totalTime   = document.getElementById('audio-total');
  const playerTitle = document.getElementById('audio-player-title');

  if (playerTitle) playerTitle.textContent = title || 'Sermon Audio';

  function fmtTime(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  if (AppState.audioEl) {
    AppState.audioEl.addEventListener('loadedmetadata', () => {
      if (totalTime) totalTime.textContent = fmtTime(AppState.audioEl.duration);
    });

    AppState.audioEl.addEventListener('timeupdate', () => {
      const pct = AppState.audioEl.duration
        ? (AppState.audioEl.currentTime / AppState.audioEl.duration) * 100
        : 0;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (currentTime) currentTime.textContent = fmtTime(AppState.audioEl.currentTime);
    });

    AppState.audioEl.addEventListener('ended', () => {
      if (playBtn) playBtn.textContent = 'play_arrow';
    });
  }

  if (playBtn) {
    playBtn.onclick = (e) => {
      addRipple(e);
      if (!AppState.audioEl) return;
      if (AppState.audioEl.paused) {
        AppState.audioEl.play().catch(err => {
          console.warn('[Audio]', err);
          showSnackbar('error', 'Could not play audio. Check network.');
        });
        playBtn.textContent = 'pause';
      } else {
        AppState.audioEl.pause();
        playBtn.textContent = 'play_arrow';
      }
    };
  }

  // Seek on progress bar tap
  if (progressWrap) {
    progressWrap.addEventListener('click', (e) => {
      if (!AppState.audioEl || !AppState.audioEl.duration) return;
      const rect = progressWrap.getBoundingClientRect();
      const pct  = (e.clientX - rect.left) / rect.width;
      AppState.audioEl.currentTime = pct * AppState.audioEl.duration;
    });
  }
}

function changePlaybackSpeed() {
  if (!AppState.audioEl) return;
  const speeds = [1, 1.25, 1.5, 1.75, 2, 0.75];
  const current = AppState.audioEl.playbackRate;
  const idx = speeds.indexOf(current);
  const next = speeds[(idx + 1) % speeds.length];
  AppState.audioEl.playbackRate = next;
  const btn = document.getElementById('audio-speed-btn');
  if (btn) btn.textContent = `${next}x`;
}

// ════════════════════════════════════════════════════════
// 10.  SLIDE DECK VIEWER
// ════════════════════════════════════════════════════════
let slides = [];
let currentSlideIdx = 0;

function setupSlideViewer(slidesUrl) {
  // Support Canva embed links as single-page iframes
  // Support Google Slides (presentation) by converting to embed format
  const iframeEl = document.getElementById('slides-iframe');
  if (!iframeEl) return;

  let embedUrl = slidesUrl;

  // Google Slides: convert /pub to /embed if needed
  if (slidesUrl.includes('docs.google.com/presentation')) {
    embedUrl = slidesUrl.replace('/pub?', '/embed?').replace('/edit', '/embed');
    if (!embedUrl.includes('/embed')) embedUrl = slidesUrl + '?embedded=true';
  }

  iframeEl.src = embedUrl;
  currentSlideIdx = 0;
  slides = [embedUrl]; // Single iframe source — navigation handled externally

  const indicator = document.getElementById('slide-indicator');
  if (indicator) indicator.textContent = 'Swipe or tap arrows to navigate slides';
}

// Touch swipe for slides
let slideTouchStartX = 0;

function initSlideSwipe() {
  const el = document.getElementById('slides-container');
  if (!el) return;
  el.addEventListener('touchstart', e => {
    slideTouchStartX = e.touches[0].clientX;
  }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - slideTouchStartX;
    if (Math.abs(dx) > 50) {
      // For embedded slides, we post a message to navigate or adjust index
      // Since Canva/GSlides are iframes, we track locally and reload note context
      const dir = dx < 0 ? 1 : -1;
      const newIdx = Math.max(0, currentSlideIdx + dir);
      if (newIdx !== currentSlideIdx) {
        currentSlideIdx = newIdx;
        updateSlideNote();
      }
    }
  }, { passive: true });
}

function slideNav(direction) {
  const newIdx = Math.max(0, currentSlideIdx + direction);
  if (newIdx !== currentSlideIdx) {
    currentSlideIdx = newIdx;
    updateSlideNote();
  }
}

function updateSlideNote() {
  const indicator = document.getElementById('slide-indicator');
  if (indicator) indicator.textContent = `Slide ${currentSlideIdx + 1}`;

  if (AppState.selectedDate) {
    // Auto-save current note before switching context
    autoSaveCurrentNote();
    loadNoteForContext(AppState.selectedDate, currentSlideIdx);
  }
}

// ════════════════════════════════════════════════════════
// 11.  RICH TEXT EDITOR + AUTOSAVE
// ════════════════════════════════════════════════════════
async function loadNoteForContext(dateStr, slideIdx) {
  const fileName = getNoteFileName(dateStr, slideIdx);
  AppState.currentNoteFile = fileName;

  const editor = document.getElementById('note-editor');
  if (!editor) return;

  const content = await readNote(fileName);
  editor.innerHTML = content || '';

  if (!content) {
    editor.innerHTML = '<p><br></p>';
  }

  // Process bible verses already in loaded content
  setTimeout(() => processBibleVerses(editor), 200);
}

function initEditor() {
  const editor = document.getElementById('note-editor');
  if (!editor) return;

  editor.addEventListener('input', () => {
    AppState.editorDirty = true;
    setTextSaveStatus('saving');

    clearTimeout(AppState.saveDebounceTimer);
    AppState.saveDebounceTimer = setTimeout(async () => {
      await autoSaveCurrentNote();
    }, 700);

    // Detect bible verses on pause
    clearTimeout(AppState.verseDebounceTimer);
    AppState.verseDebounceTimer = setTimeout(() => {
      processBibleVerses(editor);
    }, 1500);
  });

  editor.addEventListener('keydown', e => {
    // Tab key → indent
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  });
}

async function autoSaveCurrentNote() {
  const editor = document.getElementById('note-editor');
  if (!editor || !AppState.currentNoteFile) return;

  setTextSaveStatus('saving');
  const html = editor.innerHTML;
  const ok = await writeNote(AppState.currentNoteFile, html);

  if (ok) {
    AppState.editorDirty = false;
    setTextSaveStatus('saved');
  } else if (!AppState.dirHandle) {
    setTextSaveStatus('no-folder');
  } else {
    setTextSaveStatus('error');
  }
}

function setTextSaveStatus(state) {
  const el = document.getElementById('save-status-text');
  if (!el) return;
  const icons = { saving: 'sync', saved: 'check_circle', error: 'error', 'no-folder': 'folder_off' };
  const texts = {
    saving: 'Saving…',
    saved: 'Saved to device',
    error: 'Save failed',
    'no-folder': 'Connect folder to save'
  };
  const clsMap = { saving: 'saving', saved: 'saved', error: 'error', 'no-folder': '' };

  el.innerHTML = `<span class="material-symbols-rounded status-icon">${icons[state]}</span> ${texts[state]}`;
  el.className = `save-status ${clsMap[state] || ''}`;

  if (state === 'saved') {
    showSnackbar('check_circle', 'Saved to device folder');
  }
}

// Executes a formatting command on the content-editable editor
function formatText(cmd, value = null) {
  document.execCommand(cmd, false, value);
  document.getElementById('note-editor')?.focus();
}

function insertHeading(tag) {
  const editor = document.getElementById('note-editor');
  if (!editor) return;
  editor.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const block = document.createElement(tag);
  block.innerHTML = sel.toString() || '<br>';
  range.deleteContents();
  range.insertNode(block);
  range.setStartAfter(block);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  editor.dispatchEvent(new Event('input'));
}

function insertLink() {
  const url = prompt('Enter URL:');
  if (url) formatText('createLink', url);
}

function insertImageFromUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = `<img src="${e.target.result}" style="max-width:100%;border-radius:8px;margin:4px 0;" alt="Note image">`;
    formatText('insertHTML', img);
  };
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════════════════════
// 12.  OFFLINE BIBLE ENGINE
// ════════════════════════════════════════════════════════
// Regex: matches "John 3:16", "Gen 1:1-3", "1 Cor 13:4-7", "Philippians 4:13" etc.
const VERSE_REGEX = /\b((?:[123]\s*)?(?:John|Gen(?:esis)?|Ex(?:odus)?|Lev(?:iticus)?|Num(?:bers)?|Deut?(?:eronomy)?|Josh?(?:ua)?|Judg(?:es)?|Rut[h]?|[12]\s*Sam(?:uel)?|[12]\s*Kings?|[12]\s*Chr(?:onicles)?|Ezra|Neh(?:emiah)?|Est(?:her)?|Job|Ps(?:a(?:lms?)?)?|Prov?(?:erbs?)?|Eccl?(?:esiastes)?|Song|Isa(?:iah)?|Jer(?:emiah)?|Lam(?:entations)?|Eze(?:k(?:iel)?)?|Dan(?:iel)?|Hos(?:ea)?|Joel?|Amos|Oba(?:diah)?|Jon(?:ah)?|Mic(?:ah)?|Nah(?:um)?|Hab(?:akkuk)?|Zeph?(?:aniah)?|Hag(?:gai)?|Zech?(?:ariah)?|Mal(?:achi)?|Matt?(?:hew)?|Mar[k]?|Luke?|Acts?|Rom(?:ans)?|[12]\s*Cor(?:inthians)?|Gal(?:atians)?|Eph(?:esians)?|Phil(?:ippians)?|Col(?:ossians)?|[12]\s*Thes(?:salonians)?|[12]\s*Tim(?:othy)?|Tit(?:us)?|Phlm?|Heb(?:rews)?|Jas?(?:mes)?|[12]\s*Pet(?:er)?|[123]\s*John|Jude?|Rev(?:elation)?))\s+(\d+):(\d+)(?:-(\d+))?/gi;

function processBibleVerses(editor) {
  if (!editor || !window.BibleDB) return;

  // Avoid double-processing: skip already-linked text
  // Walk text nodes only
  const walker = document.createTreeWalker(
    editor,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.parentElement.classList.contains('bible-verse-link')) return NodeFilter.FILTER_REJECT;
        if (node.parentElement.tagName === 'A') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const toReplace = [];
  let node;
  while ((node = walker.nextNode())) {
    VERSE_REGEX.lastIndex = 0;
    if (VERSE_REGEX.test(node.textContent)) {
      toReplace.push(node);
    }
  }

  VERSE_REGEX.lastIndex = 0;
  toReplace.forEach(textNode => {
    const raw = textNode.textContent;
    VERSE_REGEX.lastIndex = 0;
    if (!VERSE_REGEX.test(raw)) return;

    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    VERSE_REGEX.lastIndex = 0;
    let m;
    while ((m = VERSE_REGEX.exec(raw)) !== null) {
      // Text before match
      if (m.index > lastIdx) {
        frag.appendChild(document.createTextNode(raw.slice(lastIdx, m.index)));
      }
      // Matched verse span
      const span = document.createElement('span');
      span.className = 'bible-verse-link';
      span.textContent = m[0];
      span.setAttribute('data-book',   m[1]);
      span.setAttribute('data-ch',     m[2]);
      span.setAttribute('data-vs',     m[3]);
      span.setAttribute('data-ve',     m[4] || m[3]);
      span.setAttribute('contenteditable', 'false');
      span.addEventListener('click', openBibleModal);
      frag.appendChild(span);
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < raw.length) {
      frag.appendChild(document.createTextNode(raw.slice(lastIdx)));
    }
    textNode.parentNode.replaceChild(frag, textNode);
  });
}

function openBibleModal(e) {
  const span = e.currentTarget;
  const book = span.getAttribute('data-book');
  const ch   = parseInt(span.getAttribute('data-ch'));
  const vs   = parseInt(span.getAttribute('data-vs'));
  const ve   = parseInt(span.getAttribute('data-ve'));

  showBibleModal(book, ch, vs, ve);
}

function showBibleModal(book, ch, vs, ve) {
  const modal = document.getElementById('bible-modal');
  if (!modal) return;

  const result = window.BibleDB.lookupVerse(AppState.bibleTranslation, book, ch, vs, ve);

  document.getElementById('bible-modal-ref').textContent = result.reference;
  renderBibleResult(result);

  modal.classList.add('open');

  // Store for re-render on translation toggle
  modal._lastQuery = { book, ch, vs, ve };
}

function renderBibleResult(result) {
  const container = document.getElementById('bible-result-text');
  if (!container) return;

  if (!result.found || result.verses.length === 0) {
    container.innerHTML = `<p style="color:var(--md-sys-color-on-surface-variant);font-style:italic;">
      Verse not found in local database. <br>Try another translation or check the reference.</p>`;
    return;
  }

  let html = '';
  result.verses.forEach(v => {
    html += `<sup class="bible-verse-number">${v.num}</sup>${v.text} `;
  });
  container.innerHTML = html;
}

function switchBibleTranslation(tr) {
  AppState.bibleTranslation = tr;
  document.querySelectorAll('.bible-tr-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tr === tr);
  });

  const modal = document.getElementById('bible-modal');
  if (modal && modal._lastQuery) {
    const { book, ch, vs, ve } = modal._lastQuery;
    const result = window.BibleDB.lookupVerse(tr, book, ch, vs, ve);
    document.getElementById('bible-modal-ref').textContent = result.reference;
    renderBibleResult(result);
  }
}

function closeBibleModal() {
  const modal = document.getElementById('bible-modal');
  if (modal) modal.classList.remove('open');
}

// ════════════════════════════════════════════════════════
// 13.  DATA PORTABILITY — Export / Import
// ════════════════════════════════════════════════════════
async function exportNotes() {
  if (!AppState.dirHandle) {
    showSnackbar('folder_off', 'No folder connected to export from.');
    return;
  }
  try {
    const files = await listNoteFiles();
    if (files.length === 0) {
      showSnackbar('info', 'No notes found to export.');
      return;
    }

    const exportData = { exportedAt: new Date().toISOString(), notes: {} };
    for (const name of files) {
      const content = await readNote(name);
      exportData.notes[name] = content;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `church-notes-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSnackbar('download', `Exported ${files.length} note(s) successfully`);
  } catch (err) {
    console.error('[Export]', err);
    showSnackbar('error', 'Export failed. Try again.');
  }
}

async function importNotes(file) {
  if (!file || !AppState.dirHandle) {
    showSnackbar('folder_off', 'Connect a folder first, then import.');
    return;
  }
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.notes) throw new Error('Invalid format');

    let count = 0;
    for (const [name, content] of Object.entries(data.notes)) {
      await writeNote(name, content);
      count++;
    }
    showSnackbar('upload', `Imported ${count} note(s) successfully`);
  } catch (err) {
    console.error('[Import]', err);
    showSnackbar('error', 'Import failed — check file format.');
  }
}

// ════════════════════════════════════════════════════════
// 14.  M3 UI HELPERS
// ════════════════════════════════════════════════════════
function showSnackbar(icon, message, duration = 3000) {
  const sb = document.getElementById('m3-snackbar');
  if (!sb) return;

  sb.querySelector('.snackbar-icon').textContent = icon;
  sb.querySelector('.snackbar-msg').textContent   = message;

  sb.classList.add('show');
  clearTimeout(sb._timer);
  sb._timer = setTimeout(() => sb.classList.remove('show'), duration);
}

function addRipple(e) {
  const el = e.currentTarget || e.target;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
  const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
  const size = Math.max(rect.width, rect.height) * 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `
    width:${size}px; height:${size}px;
    left:${x - size/2}px; top:${y - size/2}px;
  `;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showSection(id, visible) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden', !visible);
}

function openDialog(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeDialog(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function closeFolderPrompt() {
  const el = document.getElementById('folder-prompt-overlay');
  if (el) el.remove();
}

function switchTab(tab) {
  AppState.activeTab = tab;
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.m3-nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.tab === tab);
  });
  const section = document.getElementById(`section-${tab}`);
  if (section) section.classList.add('active');
}

// Month picker
function openMonthPicker() {
  const modal = document.getElementById('month-picker-modal');
  if (!modal) return;

  const yearEl = document.getElementById('mp-year');
  if (yearEl) yearEl.textContent = AppState.viewYear;

  const grid = document.getElementById('mp-month-grid');
  if (grid) {
    grid.innerHTML = MONTH_NAMES.map((name, i) =>
      `<button class="${i === AppState.viewMonth ? 'active' : ''}" onclick="selectMonthFromPicker(${i})">${name.slice(0,3)}</button>`
    ).join('');
  }

  openDialog('month-picker-modal');
}

function changePickerYear(delta) {
  const yearEl = document.getElementById('mp-year');
  if (!yearEl) return;
  const current = parseInt(yearEl.textContent);
  yearEl.textContent = current + delta;
}

function selectMonthFromPicker(monthIdx) {
  const yearEl = document.getElementById('mp-year');
  AppState.viewMonth = monthIdx;
  AppState.viewYear  = yearEl ? parseInt(yearEl.textContent) : AppState.viewYear;
  renderCalendar();
  closeDialog('month-picker-modal');
}

// ════════════════════════════════════════════════════════
// 15.  ADMIN FIRESTORE CRUD (used in manage.html)
// ════════════════════════════════════════════════════════
const AdminState = {
  editingDocId: null,
  currentMonthFilter: null,
};

async function adminSaveEvent(formData) {
  if (!db) {
    showSnackbar('error', 'Firestore not connected. Check Firebase config.');
    return false;
  }
  try {
    if (AdminState.editingDocId) {
      await db.collection('calendar_events').doc(AdminState.editingDocId).update(formData);
      showSnackbar('check_circle', 'Event updated successfully');
      AdminState.editingDocId = null;
    } else {
      await db.collection('calendar_events').add(formData);
      showSnackbar('check_circle', 'Event created successfully');
    }
    return true;
  } catch (err) {
    console.error('[Admin] Save error:', err);
    showSnackbar('error', `Save failed: ${err.message}`);
    return false;
  }
}

async function adminDeleteEvent(docId) {
  if (!db) return;
  try {
    await db.collection('calendar_events').doc(docId).delete();
    showSnackbar('delete', 'Event deleted');
  } catch (err) {
    console.error('[Admin] Delete error:', err);
    showSnackbar('error', 'Delete failed.');
  }
}

function adminEditEvent(docId) {
  const event = Object.values(AppState.events).find(e => e.id === docId);
  if (!event) return;
  AdminState.editingDocId = docId;

  const fields = ['date','title','preacher','verse','audioUrl','slidesUrl'];
  fields.forEach(f => {
    const el = document.getElementById(`admin-${f}`);
    if (el) el.value = event[f] || '';
  });

  const btn = document.getElementById('admin-submit-btn');
  if (btn) btn.textContent = 'Update Event';

  document.getElementById('admin-form-card')?.scrollIntoView({ behavior: 'smooth' });
}

function adminCancelEdit() {
  AdminState.editingDocId = null;
  const fields = ['date','title','preacher','verse','audioUrl','slidesUrl'];
  fields.forEach(f => {
    const el = document.getElementById(`admin-${f}`);
    if (el) el.value = '';
  });
  const btn = document.getElementById('admin-submit-btn');
  if (btn) btn.textContent = 'Save Event';
}

function renderAdminEventList(filter = null) {
  const container = document.getElementById('admin-event-list');
  if (!container) return;

  let events = Object.values(AppState.events).sort((a, b) => a.date.localeCompare(b.date));

  if (filter) {
    events = events.filter(e => e.date.startsWith(filter));
  }

  if (events.length === 0) {
    container.innerHTML = `<div class="m3-banner info"><span class="banner-icon material-symbols-rounded">info</span>No events found. Add one using the form above.</div>`;
    return;
  }

  container.innerHTML = events.map(event => {
    const hasAudio  = !!event.audioUrl;
    const hasSlides = !!event.slidesUrl;
    const badge = (hasAudio && hasSlides) ? 'complete'
                : (hasAudio || hasSlides) ? 'partial'
                : 'planned';
    const badgeText = badge === 'complete' ? '✓ Complete' : badge === 'partial' ? '⚡ Partial' : '📅 Planned';

    return `
    <div class="event-card ripple-container">
      <div style="display:flex;align-items:start;justify-content:space-between;gap:8px;">
        <div>
          <div class="event-card-date">${event.date}</div>
          <div class="event-card-title">${event.title || 'Untitled'}</div>
          <div class="event-card-meta">${event.preacher || 'No preacher'} · ${event.verse || 'No verse'}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
            ${hasAudio ? '<span class="status-badge complete"><span class="material-symbols-rounded" style="font-size:12px;font-family:Material Symbols Rounded;">music_note</span>Audio</span>' : ''}
            ${hasSlides ? '<span class="status-badge planned"><span class="material-symbols-rounded" style="font-size:12px;font-family:Material Symbols Rounded;">slideshow</span>Slides</span>' : ''}
          </div>
        </div>
        <span class="status-badge ${badge}">${badgeText}</span>
      </div>
      <div class="event-card-actions">
        <button class="m3-btn m3-btn-tonal ripple-container" onclick="adminEditEvent('${event.id}')" style="height:36px;font-size:13px;padding:0 16px;min-height:36px;">
          <span class="material-symbols-rounded" style="font-size:16px;font-family:Material Symbols Rounded;">edit</span> Edit
        </button>
        <button class="m3-btn m3-btn-outlined ripple-container" onclick="confirmDeleteEvent('${event.id}')" style="height:36px;font-size:13px;padding:0 16px;min-height:36px;color:var(--md-sys-color-error);border-color:var(--md-sys-color-error);">
          <span class="material-symbols-rounded" style="font-size:16px;font-family:Material Symbols Rounded;">delete</span> Delete
        </button>
      </div>
    </div>`;
  }).join('');
}

function confirmDeleteEvent(docId) {
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal._targetDocId = docId;
    openDialog('delete-confirm-modal');
  }
}

function executeDeleteEvent() {
  const modal = document.getElementById('delete-confirm-modal');
  if (modal && modal._targetDocId) {
    adminDeleteEvent(modal._targetDocId);
    closeDialog('delete-confirm-modal');
  }
}

function filterAdminByMonth(ym) {
  AdminState.currentMonthFilter = ym;
  renderAdminEventList(ym);
}

function buildAdminMonthFilters() {
  const row = document.getElementById('month-filter-row');
  if (!row) return;

  const months = new Set();
  Object.values(AppState.events).forEach(e => {
    if (e.date) months.add(e.date.slice(0, 7));
  });

  // Also add next 6 months
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.add(formatDate(d.getFullYear(), d.getMonth(), 1).slice(0, 7));
  }

  const sorted = Array.from(months).sort();
  row.innerHTML = `
    <button class="m3-chip ${!AdminState.currentMonthFilter ? 'selected' : ''}" onclick="filterAdminByMonth(null);buildAdminMonthFilters()">All</button>
    ${sorted.map(ym => {
      const [y, m] = ym.split('-');
      const label = `${MONTH_NAMES[parseInt(m) - 1].slice(0,3)} ${y}`;
      return `<button class="m3-chip ${AdminState.currentMonthFilter === ym ? 'selected' : ''}" onclick="filterAdminByMonth('${ym}');buildAdminMonthFilters()">${label}</button>`;
    }).join('')}
  `;
}

// ════════════════════════════════════════════════════════
// 16.  INIT — Called from HTML pages
// ════════════════════════════════════════════════════════
async function initApp() {
  checkViewportLock();
  registerServiceWorker();

  // Try to restore folder access silently
  await restoreFolderHandle();

  // Init calendar to today
  const today = new Date();
  AppState.selectedDate = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  renderCalendar();
  initCalendarSwipe();
  initSlideSwipe();
  initEditor();

  // Show folder prompt if no handle
  if (!AppState.dirHandle) {
    const prompt = document.getElementById('folder-prompt-overlay');
    if (prompt) prompt.style.display = 'flex';
  }

  // Load today's content
  loadDateContent(AppState.selectedDate);

  // Init active tab
  switchTab('home');

  console.log('[App] Initialized ✓');
}

async function initAdmin() {
  checkViewportLock();
  // Admin events listener is started after Firebase init (called from manage.html)

  // Override startEventsListener to also update admin list
  const origStart = startEventsListener;
  // We re-define the callback to additionally render admin list
  if (db) {
    db.collection('calendar_events')
      .orderBy('date', 'asc')
      .onSnapshot(snapshot => {
        AppState.events = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          AppState.events[data.date] = { id: doc.id, ...data };
        });
        renderAdminEventList(AdminState.currentMonthFilter);
        buildAdminMonthFilters();
      }, err => {
        showSnackbar('error', 'Firestore error: ' + err.message);
      });
  }

  console.log('[Admin] Initialized ✓');
}

// Global ripple listener for all elements with class ripple-container
document.addEventListener('click', (e) => {
  const target = e.target.closest('.ripple-container');
  if (target) addRipple({ currentTarget: target, clientX: e.clientX, clientY: e.clientY });
}, true);

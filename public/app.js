// =====================================================
// Vista Worship Planner — Shared Application Logic
// Covers: Firebase, File System API, PWA, Bible Engine
// =====================================================

// ── 🔥 FIREBASE CONFIGURATION ────────────────────────
// IMPORTANT: Replace this with your Firebase project config!
// See README.md for step-by-step setup instructions.
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ── Firebase SDK (ESM via CDN) ────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Firebase Init ─────────────────────────────────────
let firebaseApp, db, auth;

try {
  firebaseApp = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
  console.log('[Firebase] Initialized successfully');
} catch (err) {
  console.error('[Firebase] Init failed:', err);
}

export { db, auth, collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, query, orderBy, Timestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged };

// ── Constants ─────────────────────────────────────────
export const ADMIN_EMAIL = 'buenavistaaglinaodanny@gmail.com';
export const COLLECTION_NAME = 'calendar_events';

// ── IndexedDB for Folder Handle Storage ──────────────
const IDB_NAME = 'VistaWorshipDB';
const IDB_VERSION = 1;
const IDB_STORE = 'fileHandles';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFolderHandle(handle) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ id: 'noteFolder', handle });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadFolderHandle() {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get('noteFolder');
      req.onsuccess = () => resolve(req.result ? req.result.handle : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ── File System Access API ────────────────────────────
let noteFolderHandle = null;

export async function requestNotesFolder() {
  if (!('showDirectoryPicker' in window)) {
    console.warn('[FS] File System Access API not supported');
    return false;
  }
  try {
    noteFolderHandle = await window.showDirectoryPicker({
      id: 'vistaWorshipNotes',
      mode: 'readwrite',
      startIn: 'documents'
    });
    await saveFolderHandle(noteFolderHandle);
    console.log('[FS] Folder selected:', noteFolderHandle.name);
    return noteFolderHandle;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('[FS] Folder picker cancelled');
      return null;
    }
    console.error('[FS] Error picking folder:', err);
    return null;
  }
}

export async function initNotesFolder() {
  if (noteFolderHandle) return noteFolderHandle;
  try {
    const saved = await loadFolderHandle();
    if (!saved) return null;
    // Verify permission is still granted
    const perm = await saved.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      noteFolderHandle = saved;
      return noteFolderHandle;
    }
    if (perm === 'prompt') {
      const req = await saved.requestPermission({ mode: 'readwrite' });
      if (req === 'granted') {
        noteFolderHandle = saved;
        return noteFolderHandle;
      }
    }
    return null;
  } catch (err) {
    console.error('[FS] Error restoring folder:', err);
    return null;
  }
}

export function getNoteFolderHandle() {
  return noteFolderHandle;
}

export async function saveNote(filename, htmlContent) {
  const folder = await initNotesFolder();
  if (!folder) return false;
  try {
    const fileHandle = await folder.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(htmlContent);
    await writable.close();
    return true;
  } catch (err) {
    console.error('[FS] Save note failed:', err);
    return false;
  }
}

export async function loadNote(filename) {
  const folder = await initNotesFolder();
  if (!folder) return null;
  try {
    const fileHandle = await folder.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    if (err.name === 'NotFoundError') return null;
    console.error('[FS] Load note failed:', err);
    return null;
  }
}

export async function listNotes() {
  const folder = await initNotesFolder();
  if (!folder) return [];
  const files = [];
  for await (const entry of folder.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.html')) {
      files.push(entry.name);
    }
  }
  return files.sort();
}

export function buildNoteFilename(dateStr, slideIndex = null) {
  if (slideIndex !== null) {
    return `${dateStr}_slide${slideIndex}.html`;
  }
  return `${dateStr}_general.html`;
}

// ── Google Drive Link Converter ───────────────────────
export function convertDriveLinkToStream(url) {
  if (!url) return null;
  
  // Pattern 1: /file/d/{id}/view
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return `https://drive.google.com/uc?export=download&id=${m1[1]}`;
  
  // Pattern 2: id={id}
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.google.com/uc?export=download&id=${m2[1]}`;
  
  // Pattern 3: open?id={id}
  const m3 = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
  if (m3) return `https://drive.google.com/uc?export=download&id=${m3[1]}`;
  
  return url; // Return as-is if can't parse
}

// ── Firestore Helpers ─────────────────────────────────
export async function fetchEvent(dateStr) {
  if (!db) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  } catch (err) {
    console.error('[Firestore] Fetch event failed:', err);
    return null;
  }
}

export async function fetchAllEvents() {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[Firestore] Fetch all events failed:', err);
    return [];
  }
}

export function subscribeToEvents(callback) {
  if (!db) return () => {};
  const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'asc'));
  return onSnapshot(q, (snap) => {
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(events);
  }, (err) => {
    console.error('[Firestore] Subscription error:', err);
  });
}

export async function saveEvent(dateStr, data) {
  if (!db) return false;
  try {
    const docRef = doc(db, COLLECTION_NAME, dateStr);
    await setDoc(docRef, {
      ...data,
      date: dateStr,
      updatedAt: Timestamp.now()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Save event failed:', err);
    return false;
  }
}

export async function deleteEvent(dateStr) {
  if (!db) return false;
  try {
    const docRef = doc(db, COLLECTION_NAME, dateStr);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('[Firestore] Delete event failed:', err);
    return false;
  }
}

// ── PWA Service Worker Registration ──────────────────
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[SW] Registered:', reg.scope);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Update available');
            }
          });
        });
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    });
  }
}

// ── Snackbar Utility ──────────────────────────────────
export function showSnackbar(message, icon = 'check_circle', duration = 3000) {
  const existing = document.querySelector('.snackbar');
  if (existing) existing.remove();

  const snack = document.createElement('div');
  snack.className = 'snackbar';
  snack.innerHTML = `<span class="material-symbols-rounded icon-filled" style="font-size:18px">${icon}</span>${message}`;
  document.body.appendChild(snack);

  setTimeout(() => {
    snack.classList.add('hide');
    setTimeout(() => snack.remove(), 250);
  }, duration);
}

// ── Date Utilities ─────────────────────────────────────
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(dateStr) {
  const d = fromDateStr(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatMonthYear(year, month) {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Debounce ──────────────────────────────────────────
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── Ripple Effect ─────────────────────────────────────
export function addRipple(el) {
  el.addEventListener('pointerdown', (e) => {
    const circle = document.createElement('span');
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    circle.style.cssText = `
      position:absolute; width:${size}px; height:${size}px;
      top:${y}px; left:${x}px; border-radius:50%;
      background:currentColor; opacity:0.12;
      animation:ripple-expand 0.5s ease-out forwards;
      pointer-events:none;
    `;
    if (!el.style.position || el.style.position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  });
}

// Add style for ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `@keyframes ripple-expand { from{transform:scale(0);opacity:0.3} to{transform:scale(1);opacity:0} }`;
document.head.appendChild(rippleStyle);

// ── Export/Import Utilities ───────────────────────────
export async function exportNotesAsZip() {
  const folder = await initNotesFolder();
  if (!folder) {
    showSnackbar('No notes folder selected', 'error', 3000);
    return;
  }

  // Collect all note files
  const files = {};
  for await (const entry of folder.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.html')) {
      const file = await entry.getFile();
      files[entry.name] = await file.text();
    }
  }

  // Export as JSON (fallback when JSZip unavailable)
  const dataStr = JSON.stringify(files, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vista-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showSnackbar('Notes exported successfully!', 'download', 3000);
}

export async function importNotesFromJSON(jsonText) {
  const folder = await initNotesFolder();
  if (!folder) {
    showSnackbar('No notes folder selected', 'error', 3000);
    return;
  }

  try {
    const files = JSON.parse(jsonText);
    for (const [filename, content] of Object.entries(files)) {
      if (filename.endsWith('.html')) {
        const fh = await folder.getFileHandle(filename, { create: true });
        const w = await fh.createWritable();
        await w.write(content);
        await w.close();
      }
    }
    showSnackbar(`Imported ${Object.keys(files).length} notes!`, 'check_circle', 3000);
  } catch (err) {
    console.error('[Import] Error:', err);
    showSnackbar('Import failed — invalid file', 'error', 3000);
  }
}

console.log('[App] Vista Worship Planner shared module loaded');

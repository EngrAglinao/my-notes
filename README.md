# ⛪ Church Media PWA

A **Progressive Web App** for mobile-first church sermon media consumption, personal note-taking, and offline Bible access. Built entirely in **pure HTML5, CSS3, and Vanilla JavaScript** — no frameworks, no build tools, no login required.

---

## 📱 Overview

| Feature | Detail |
|---|---|
| **Target Device** | Mobile handheld only (320px–480px) |
| **Framework** | None — Pure HTML5 / CSS3 / ES6+ |
| **UI Design System** | Google Material Design 3 |
| **Authentication** | Zero login required |
| **Offline Support** | Full — via Service Worker & local Bible DB |
| **Admin Interface** | `manage.html` (mobile only) |
| **User Interface** | `index.html` (mobile only) |

---

## 🏗️ Hybrid Data Architecture

This app uses a **two-tier data strategy** to keep public content synchronized globally while keeping personal notes completely private.

### 🌐 Tier 1 — Public Data (Firebase Firestore)
**What it stores:** Event schedules, sermon titles, preachers, verse references, audio links, and slide links.

**How it works:**
- The **admin** opens `manage.html`, configures Firebase, and creates/edits events.
- Firestore stores all event data in the `calendar_events` collection.
- The **user app** (`index.html`) reads from Firestore in real-time using `onSnapshot()`.
- All connected users see event updates **instantly** without refreshing.
- Events include: Date, Title, Preacher, Verse, Google Drive Audio URL, Canva/PPT Embed URL.

**Privacy:** Event data is public to all users of the app — it is designed for shared church content.

### 🔒 Tier 2 — Private Data (Native Device File System)
**What it stores:** Personal sermon notes, journaling, typed annotations.

**How it works:**
- Uses the modern **[File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)** (`window.showDirectoryPicker()`).
- The user chooses a local folder on their device on first launch.
- Notes are saved directly as `.html` files into that folder.
- The folder handle is persisted in **IndexedDB** for seamless future access.
- Notes are **never uploaded, never sent to Firebase, never leave the device**.
- Even if the app is uninstalled, the notes remain in the chosen folder.

**File naming convention:**
```
YYYY-MM-DD_general.html      → Daily journal / no slides
YYYY-MM-DD_slide1.html       → Notes for slide 1
YYYY-MM-DD_slide2.html       → Notes for slide 2
```

---

## 📂 File Structure

```text
├── README.md           # This documentation file
├── index.html          # User Mode: Mobile-first PWA dashboard
├── manage.html         # Admin Mode: Firebase-connected event planner
├── styles.css          # Shared Material Design 3 CSS design system
├── app.js              # Shared JavaScript: Firestore, File System, PWA, UI
├── bible_data.js       # Offline Scripture Database (ESV + NIV)
├── manifest.json       # PWA manifest: icons, theme, start URL
└── sw.js               # Service Worker: offline caching strategy
```

---

## 🔥 Firebase Setup Guide (Non-Technical)

Follow these steps to connect the app to Firebase Firestore for global event sync.

### Step 1 — Create a Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter a project name (e.g., `my-church-app`)
4. Disable Google Analytics if not needed → Click **"Create project"**
5. Wait for project creation → Click **"Continue"**

### Step 2 — Create a Web App
1. In your project dashboard, click the **web icon** `</>` ("Add app")
2. Enter an app nickname (e.g., `Church PWA`)
3. **Do NOT** check "Set up Firebase Hosting"
4. Click **"Register app"**
5. You will see a config block like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```
6. **Copy this entire object** (the `{...}` part only, not the `const firebaseConfig =` part)

### Step 3 — Enable Firestore in Test Mode
1. In the left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (allows reads/writes without auth)
4. Select your preferred server region → Click **"Enable"**

> ⚠️ **Security Note:** Test mode is open to all. For production use, set up [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started) to restrict write access.

### Step 4 — Connect the Admin Panel
1. Open `manage.html` on your mobile device
2. Tap the **cloud icon** in the top bar → "Firebase Configuration"
3. Paste your Firebase config JSON into the text area
4. Tap **"Save & Connect"**
5. The app will reload and connect to Firestore ✅

The config is stored in `localStorage` on your device. The user app (`index.html`) reads the same stored config automatically when opened on the same device, or you can share the config manually.

---

## 📊 Firestore Collection Schema

**Collection:** `calendar_events`

Each document represents one service/event date.

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | ✅ | Date in `YYYY-MM-DD` format (e.g., `"2025-06-15"`) |
| `title` | `string` | ✅ | Sermon or service title |
| `preacher` | `string` | — | Speaker/preacher name |
| `verse` | `string` | — | Main scripture reference (e.g., `"John 3:16"`) |
| `audioUrl` | `string` | — | Google Drive shared file URL or direct MP3 link |
| `slidesUrl` | `string` | — | Canva embed URL or Google Slides `/pub` URL |
| `updatedAt` | `string` | — | ISO timestamp of last update |

**Example document:**
```json
{
  "date": "2025-06-15",
  "title": "Walking in the Spirit",
  "preacher": "Pastor Jane Smith",
  "verse": "Galatians 5:22-23",
  "audioUrl": "https://drive.google.com/file/d/1abc.../view?usp=sharing",
  "slidesUrl": "https://www.canva.com/design/DAFxxx/view?embed",
  "updatedAt": "2025-06-10T14:30:00.000Z"
}
```

### Audio Link Instructions (Google Drive)
1. Upload your MP3 to Google Drive
2. Right-click → **"Share"** → **"Anyone with the link"** → Copy link
3. Paste the link into the admin panel Audio URL field
4. The app automatically converts sharing links to streamable direct URLs

### Slides Link Instructions
**Canva:** Design → Share → Present & Publish → Publish to web → Copy embed URL
**Google Slides:** File → Publish to web → Embed → Copy the `src` URL from the iframe code

---

## 🚀 GitHub Pages Deployment Guide

### Step 1 — Create a GitHub Repository
1. Go to [https://github.com/new](https://github.com/new)
2. Enter a repository name (e.g., `church-media-pwa`)
3. Set visibility to **Public** (required for free GitHub Pages)
4. **Do NOT** initialize with a README (you already have one)
5. Click **"Create repository"**

### Step 2 — Initialize Git and Push Your Code

Open a terminal in your project folder and run:

```bash
# Initialize git repository
git init

# Stage all project files
git add .

# Create initial commit
git commit -m "Initial commit: Church Media PWA"

# Add GitHub remote (replace with your actual URL)
git remote add origin https://github.com/YOUR_USERNAME/church-media-pwa.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. Scroll to **"Pages"** in the left sidebar
4. Under **"Source"**, select **"Deploy from a branch"**
5. Choose **Branch: `main`** → **Folder: `/ (root)`**
6. Click **"Save"**
7. Wait 1–2 minutes for deployment
8. Your app will be live at: `https://YOUR_USERNAME.github.io/church-media-pwa/`

### Step 4 — Updating Your App
After making changes, run:
```bash
git add .
git commit -m "Update: describe your changes"
git push origin main
```
GitHub Pages will automatically redeploy within a minute.

---

## ⚠️ Critical Path Configuration for GitHub Pages Subpath

> **This is required if deploying to a GitHub Pages repository URL (e.g., `https://username.github.io/repo-name/`) instead of a custom root domain.**

When deploying to a subpath, you must update the `scope` and `start_url` in two files:

### 1. Update `manifest.json`
```json
{
  "start_url": "/church-media-pwa/index.html",
  "scope": "/church-media-pwa/"
}
```
Replace `church-media-pwa` with your actual repository name.

### 2. Update `sw.js`
Find this line near the top:
```javascript
const CACHE_BASE_URL = '/';
```
Change it to:
```javascript
const CACHE_BASE_URL = '/church-media-pwa/';
```

Then update the `STATIC_ASSETS` array entries if they don't use `CACHE_BASE_URL` as a prefix. Also ensure all relative paths in HTML files use `./` (relative) rather than `/` (root-relative) — the provided code already uses `./` throughout.

After making these changes:
```bash
git add manifest.json sw.js
git commit -m "Fix: Update PWA paths for GitHub Pages subpath"
git push origin main
```

> **Custom Domain:** If using a custom domain (e.g., `https://church.yourdomain.com`), keep `CACHE_BASE_URL = '/'` and `"scope": "./"` as the defaults provided.

---

## 📖 Offline Bible Engine

The app includes a curated offline scripture database (`bible_data.js`) covering the most-referenced passages in both **ESV** and **NIV** translations.

### How it works
1. As you type notes, the app detects standard verse formats in the background
2. Recognized references are auto-converted to tappable blue links (e.g., `John 3:16`)
3. Tapping a verse link opens a modal with the full verse text — **no internet required**
4. Toggle between ESV and NIV translations within the modal

### Supported verse formats
```
John 3:16           → Single verse
Gen 1:1-3           → Verse range
1 Cor 13:4-7        → Book with number prefix
Philippians 4:13    → Full book name
Ps 23:1             → Abbreviated name
```

### Extending the database
To add more verses, edit `bible_data.js` following this pattern:
```javascript
BIBLE_DATA.ESV.john[14][1] = "Jesus said...";
BIBLE_DATA.NIV.john[14][1] = "Jesus answered...";
```

---

## 🔧 Technical Notes

### Browser Compatibility
| Feature | Chrome Android | Safari iOS | Firefox Android |
|---|---|---|---|
| File System Access API | ✅ | ⚠️ Partial | ❌ |
| PWA Install | ✅ | ✅ (Add to Home Screen) | ✅ |
| Service Worker | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ |
| ContentEditable | ✅ | ✅ | ✅ |

> The File System Access API is best supported on Chrome for Android. On iOS Safari, notes saving will show a graceful fallback prompt. All other features work cross-browser.

### Performance
- Calendar renders via native DOM manipulation (no virtual DOM)
- Firestore uses `onSnapshot` for real-time updates without polling
- Editor autosave uses a 700ms debounce to minimize disk writes
- Bible verse detection uses a 1500ms debounce to avoid interrupting typing

### Security
- No user authentication is implemented (by design)
- Personal notes never touch Firebase or any network
- The Firebase config is stored in localStorage — keep `manage.html` access controlled
- For production Firestore, add security rules to restrict writes to known admin origins

---

## 📄 License

MIT License — Free to use, modify, and distribute for church and personal use.

---

*Built with ❤️ for mobile-first, offline-capable church communities.*

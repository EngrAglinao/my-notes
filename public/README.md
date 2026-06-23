# Vista Worship Planner — Complete Setup Guide

> A Progressive Web App for church service planning with offline Bible access, personal private notes, and real-time Firebase sync.

---

## 📐 Architecture Overview

### Hybrid Data Architecture

Vista Worship Planner uses a **two-layer data model** that cleanly separates public church data from your private personal notes:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: PUBLIC DATA                         │
│               (Admin Panel → Firebase Firestore)                │
│                                                                 │
│  Admin creates events in manage.html                            │
│       ↓ saves to Firestore                                      │
│  All users' apps sync automatically in real-time               │
│                                                                 │
│  Data includes: Date, Title, Preacher, Main Verse,             │
│                 Audio Link (Google Drive MP3),                  │
│                 Slide Link (Canva/PPT embed)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: PRIVATE DATA                        │
│             (User Notepad → Native Device Folder)               │
│                                                                 │
│  User selects a local folder on FIRST APP LAUNCH               │
│       ↓ stored via File System Access API                       │
│  Notes save directly to device — 100% private                  │
│  Notes NEVER touch Firebase or any server                       │
│                                                                 │
│  File naming: YYYY-MM-DD_slideX.html or YYYY-MM-DD_general.html│
└─────────────────────────────────────────────────────────────────┘
```

**Why this matters:**
- Church schedule = shared data → Firestore (one admin, many readers)
- Personal notes = private data → local device only (zero cloud exposure)

---

## 🔥 Firebase Setup Guide (Non-Technical Step-by-Step)

### Step 1: Create a Firebase Project

1. Go to **[https://console.firebase.google.com](https://console.firebase.google.com)**
2. Click **"Add project"** (big blue button)
3. Enter a project name (e.g., `vista-worship`)
4. Disable Google Analytics (optional) → Click **"Create project"**
5. Wait ~30 seconds → Click **"Continue"**

---

### Step 2: Set Up Firestore Database

1. In the left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** → Click **"Next"**
   > ⚠️ Test mode allows open read/write for 30 days. This is fine for initial setup.
4. Select your nearest server location → Click **"Enable"**
5. Wait for the database to initialize

---

### Step 3: Enable Authentication

1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Under the **"Sign-in method"** tab, click **"Email/Password"**
4. Toggle **"Enable"** to ON → Click **"Save"**

---

### Step 4: Create the Admin Account

1. Still in Authentication, click the **"Users"** tab
2. Click **"Add user"**
3. Enter:
   - **Email:** `buenavistaaglinaodanny@gmail.com`
   - **Password:** *(create a strong password and note it securely)*
4. Click **"Add user"**

---

### Step 5: Register Your Web App & Get Config

1. Click the gear icon ⚙️ next to **"Project Overview"** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** `</>`
4. Enter an app nickname (e.g., `Vista Worship Web`)
5. **Do NOT** check "Firebase Hosting" → Click **"Register app"**
6. You will see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

7. **Copy this entire config object**

---

### Step 6: Embed Config into the App

Open `index.html` and find this comment near the top:

```javascript
// 🔥 PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = { /* ... */ };
```

Replace the placeholder with your copied config. Do the same in `manage.html`.

---

## 📂 Firestore Database Schema

### Collection: `calendar_events`

Each document ID is the event date in `YYYY-MM-DD` format.

```
calendar_events/
  └── 2025-06-15/               ← Document ID (date)
        ├── date: "2025-06-15"  (string)
        ├── title: "Walking in Faith"  (string)
        ├── preacher: "Pastor John Doe"  (string)
        ├── verse: "Hebrews 11:1"  (string)
        ├── audioLink: "https://drive.google.com/file/d/FILE_ID/view"  (string)
        ├── slideLink: "https://www.canva.com/design/..."  (string)
        └── createdAt: (timestamp)
```

**Field Details:**
| Field | Type | Description |
|-------|------|-------------|
| `date` | string | ISO format `YYYY-MM-DD` |
| `title` | string | Service/sermon title |
| `preacher` | string | Name of the speaker |
| `verse` | string | Main scripture reference (e.g., `John 3:16`) |
| `audioLink` | string | Google Drive shareable link to MP3 |
| `slideLink` | string | Canva embed URL or Google Slides embed URL |
| `createdAt` | timestamp | Auto-set by admin panel |

---

## 🔊 Google Drive Audio Link Format

When uploading audio to Google Drive:
1. Right-click the file → **"Share"** → **"Anyone with the link"**
2. Copy the link (format: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`)
3. Paste this link directly into the admin panel

The app automatically converts it to a direct streaming URL:
```
https://drive.google.com/uc?export=download&id=FILE_ID
```

---

## 🖥️ Local Deployment Requirements

> ⚠️ **IMPORTANT:** Two critical APIs require secure context (HTTPS):

### Service Worker
- Requires HTTPS **or** `localhost`
- Will NOT work on plain `http://` domains

### File System Access API (Private Notes)
- Requires HTTPS **or** `localhost`
- Works on Chrome, Edge (Android)
- Limited support on Safari/Firefox

### Recommended Local Setup:

```bash
# Option 1: Use a local server
npx serve .

# Option 2: Use Python
python3 -m http.server 8080

# Option 3: Use VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then access at: `http://localhost:8080`

### For Production:
Deploy to any HTTPS host:
- **Firebase Hosting:** `firebase deploy`
- **Netlify:** Drag & drop the folder
- **GitHub Pages:** Push to `gh-pages` branch
- **Vercel:** `vercel deploy`

---

## 📁 File Structure

```
vista-worship/
├── index.html       # User app (calendar, notes, Bible, audio)
├── manage.html      # Admin dashboard (Firestore CRUD, auth-gated)
├── app.js           # Shared logic (Firebase, File System, PWA)
├── styles.css       # Material Design 3 shared CSS framework
├── bible_data.js    # Offline Bible (ESV + NIV, 500+ key verses)
├── manifest.json    # PWA manifest (icons, colors, shortcuts)
├── sw.js            # Service Worker (offline caching strategy)
└── README.md        # This file
```

---

## 🔒 Security Notes

- The admin panel (`manage.html`) enforces **Firebase Auth** — only `buenavistaaglinaodanny@gmail.com` can access it
- Personal notes are stored **only on the user's device** — they never leave the device
- The Service Worker caches app assets for offline use but does NOT cache personal note content
- Firestore security rules should be tightened before production:

```javascript
// Recommended Firestore Rules (Firebase Console → Firestore → Rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read calendar events
    match /calendar_events/{date} {
      allow read: if true;
      // Only authenticated admin can write
      allow write: if request.auth != null && 
                   request.auth.token.email == 'buenavistaaglinaodanny@gmail.com';
    }
  }
}
```

---

## 📱 PWA Installation

### Android (Chrome):
1. Open the app in Chrome
2. Tap the **"Install"** banner or the floating install button
3. Tap **"Add to Home Screen"**
4. The app opens full-screen like a native app

### iOS (Safari):
1. Open the app in Safari
2. Tap the **Share** icon → **"Add to Home Screen"**
3. Tap **"Add"**

---

*Vista Worship Planner — Built with ❤️ for the local church community*

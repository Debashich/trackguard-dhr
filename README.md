# 🛤️ TrackGuard DHR — Gangman's Logbook

**Offline-first track inspection PWA for the Darjeeling Himalayan Railway (DHR).**  
Built for the **GDG Siliguri — Code for Communities: Toy Train Edition** hackathon.

* **Track:** C — The Railway Itself (Problem C1: Gangman's Logbook)
* **Team:** Shahbaz 🟦 & Debashish 🟩
* **Difficulty:** 🟠 Medium

---

## 📖 The Problem

Gangmen walk the steep 88 km alignment of the UNESCO World Heritage Darjeeling Himalayan Railway daily, inspecting tracks for monsoon landslides, loose boulders, retaining wall fractures, and clogged stone culverts. 

Across most of this mountain alignment between Kurseong and Darjeeling, there is **zero cellular connectivity**. Gangmen traditionally rely on handwritten paper logbooks and spotty VHF radio calls. Critical reports often take hours or days to reach the permanent-way inspector.

---

## 💡 The Solution — TrackGuard DHR

TrackGuard DHR replaces paper logbooks with an offline-first Progressive Web App (PWA):
1. **📸 Native Camera Capture:** Snap photos of track hazards using browser-native `getUserMedia` with sunlight-readable reticle and gallery fallback.
2. **📍 GPS Auto-Tagging:** Geolocation coordinates mapped directly to known DHR kilometer markers (e.g. km 51.0 Kurseong, km 74.2 Ghum Summit, km 88.0 Darjeeling).
3. **🧠 On-Device Multimodal AI:** Gemma 4 E2B (`@litert-lm/core` via WebGPU) runs entirely in the browser to suggest hazard type, severity, and an observational note in a single pass.
4. **👷 Human-in-the-Loop Safety Model:** The AI only suggests observations—it **never** issues operational decisions. The gangman reviews, edits, and confirms every report.
5. **💾 Durable Offline Queue:** Confirmed reports and binary image blobs are stored locally in IndexedDB.
6. **🔄 Station Batch Sync:** Reports queue quietly while walking the alignment; when the gangman reaches a station with connectivity, a single tap on "Sync Now" uploads the batch to the supervisor dashboard.

---

## 🤖 On-Device AI Details

* **Model:** `litert-community/gemma-4-E2B-it-litert-lm`
* **Format:** `.litertlm` (WebGPU runtime via `@litert-lm/core`)
* **Size:** ~2.0 GB (`gemma-4-E2B-it-web.litertlm`)
* **Single Multimodal Pass:** Takes the photo blob and GPS coordinates, generates structured JSON with hazard classification and observational description.

### Graceful Fallback Behavior (When AI is Unavailable)
* **No WebGPU / Unsupported Hardware:** If WebGPU is not supported by the browser or GPU memory is constrained, the app immediately falls back to manual dropdowns and notes.
* **No Network to Download Model:** Manual mode is available instantly upon first load with zero blocking.
* **No GPS Signal:** Manual kilometer entry is provided with fallback to known DHR alignment waypoints.

### Minimum Supported Device
* **With WebGPU AI Acceleration:** Modern laptop or mobile device with WebGPU support enabled in Chrome / Chromium (tested on Apple Silicon & modern Intel/AMD GPUs with >2 GB shared memory).
* **Manual Inspection Mode:** Any device with a modern web browser and camera access (runs on low-end smartphones).

---

## 🛠️ Architecture & Tech Stack

* **Framework:** Next.js 16 (App Router with Client/Server boundary)
* **Styling:** Tailwind CSS v4 + shadcn/ui components (sunlight-optimized high-contrast UI)
* **AI Runtime:** `@litert-lm/core` (LiteRT-LM WebGPU engine)
* **Offline Storage:** IndexedDB (`idb` wrapper) + LocalStorage stubs
* **Icons:** `lucide-react`
* **Deployment:** Vercel

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/ShahbazCoder1/TraceChain.git
cd TraceChain
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Chrome with WebGPU enabled.

### 3. Test Offline Flow (Airplane Mode)
1. Open the app in your browser.
2. Tap **"New Report"** → capture a photo and confirm GPS.
3. Review AI suggestions on the **Human-in-the-Loop** review screen.
4. Confirm & save the report to the local offline logbook.
5. Turn on **Airplane Mode** — the app remains fully functional.
6. Check **"My Reports"** to view queued pending inspections.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout & PWA meta
│   ├── page.tsx                   # Gangman Home screen
│   └── report/
│       ├── layout.tsx             # ReportContext provider layout
│       ├── new/page.tsx           # Camera viewfinder & GPS locking
│       ├── review/page.tsx        # Human-in-the-loop AI review & confirmation
│       └── [id]/page.tsx          # Read-only inspection report detail view
├── lib/
│   ├── types.ts                   # Shared data contracts (HazardReport, etc.)
│   ├── stubs.ts                   # Shared stubs for independent branch development
│   ├── storage.ts                 # Storage interface (localStorage stubs -> IndexedDB)
│   ├── llm.ts                     # LiteRT-LM Gemma 4 E2B WebGPU wrapper
│   ├── geo.ts                     # DHR waypoint mapping & GPS utilities
│   └── ReportContext.tsx          # Photo & GPS draft state between screens
├── components/
│   ├── Camera.tsx                 # getUserMedia camera with snapshot & fallback
│   ├── HazardSelector.tsx         # Manual hazard & severity selector
│   ├── SeverityBadge.tsx          # High-contrast color-coded badge
│   └── BottomNav.tsx              # Bottom navigation bar
└── data/
    └── sections.json              # DHR railway section definitions
```

---

## 👥 Work Division (Zero-Dependency Parallel Execution)

* **Shahbaz (🟦 `feat/report-pipeline`):**
  * Report Creation Pipeline (`Camera.tsx`, `geo.ts`, `llm.ts`, `HazardSelector.tsx`, `SeverityBadge.tsx`, `/report/new`, `/report/review`, `/report/[id]`, Home `page.tsx`, `README.md`).
* **Debashish (🟩 `feat/data-dashboard`):**
  * Data Layer & Dashboard Pipeline (`storage.ts` IndexedDB, `sync.ts`, `/queue`, `/dashboard`, `/api/reports`, PWA Serwist service worker, `manifest.ts`).

---

*Built with passion for the Darjeeling Himalayan Railway.* 🚂🏔️

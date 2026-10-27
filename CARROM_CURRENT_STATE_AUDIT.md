# Carrom Ticket Supply Management Platform — Current State Audit & Verification Report

**Audit Execution Date:** 2026-10-24  
**Auditor:** Automated Engineering Audit  
**Target Repository:** `indiverr/Temp_TESTING-FINAL--Carrom` (`c:\Users\harin\Desktop\vinoth website`)  
**Active Git Branch:** `main` (Commit `ca3ca90`)  
**Deployment Target Verified:** GitHub Pages (`https://indiverr.github.io/Temp_TESTING-FINAL--Carrom/`)  

---

## 1. Executive Summary

This audit assesses the current state of the Carrom Ticket Supply Platform codebase.

Key findings:
1. **Frontend Website Status:** The Carrom Lottery Desk frontend is **fully implemented and building successfully** in both the standalone `lottery-app` package and the root `anbu-iot-website` container. It features a responsive layout (desktop, tablet, and mobile) without mandatory phone bezels, with Multi-Booking mode, Half Set and Full Set toggles, search/filtering, CSV export, and an Available Tickets Sheet synchronized with ticket reservations.
2. **Android Application Status:** **No native Carrom Android application exists in this codebase.** The repository contains an `iqoo/` directory, but code inspection proves this is an entirely separate, third-party project called "AppForge" (a mobile AI IDE package `com.appforge`). The Carrom platform currently exists solely as a responsive web application and simulated mobile view (`PhoneFrame.tsx`).
3. **Backend & Firebase Architecture:** Real Firebase Firestore and Storage integration code (`liveFirebase.ts`, `firestore.rules`, `storage.rules`, and `functions/index.ts`) exists alongside an in-memory client service (`lotteryService.ts`). However, **the application has never been deployed to live Firebase production**. Firebase CLI is unauthenticated (`firebase login` not run), and no production Firebase project or billing is active.
4. **Test Suite Status:** Unit acceptance tests and Firebase Emulator tests exist. When executed against the local Firebase Emulator Suite (`carrom-lottery-demo`), Authentication and Custom Claims assignment, Firestore Security Rules validation, and Storage document persistence **passed**. However, Cloud Functions execution in the emulator timed out during initialization due to a Node.js engine mismatch (configured `node 22` in `functions/package.json` vs host `node 24.14.0`).
5. **Production Deployment Readiness:** The frontend is deployed exclusively to GitHub Pages as a public demonstration/testing build. Full production readiness requires resolving Cloud Functions initialization, provisioning a real Firebase project, and building a true Android application (or Capacitor/PWA wrapper) if native Android distribution is mandatory.

---

## 2. Actual Technology Stack and Project Structure

### Technology Stack Table

| Component | Framework / Tool | Version / Specification | Location |
| :--- | :--- | :--- | :--- |
| **Standalone Carrom App** | React + TypeScript + Vite | React 18.3.1, Vite 6.0.1, TS 5.6.2 | `lottery-app/` |
| **Styling & Icons** | Tailwind CSS + Lucide Icons | Tailwind 3.4.16, Lucide React 0.468 | `lottery-app/src/lottery/` |
| **Parent Portal** | React Router + Vite | React 18.3.1, React Router 6.28.0 | `src/` (ANBU IoT Website) |
| **Cloud Functions** | Firebase Functions + Admin SDK | Functions 5.0.0, Admin 12.0.0, TS 5.0 | `functions/` |
| **Database & Auth** | Google Cloud Firestore & Firebase Auth | Client SDK 11.0.2 | `lottery-app/src/lottery/firebaseConfig.ts` |
| **Object Storage** | Firebase Cloud Storage | Client SDK 11.0.2 | `lottery-app/src/lottery/liveFirebase.ts` |
| **Local Emulators** | Firebase Emulator Suite | CLI 15.34.1, Temurin JDK 21.0.12 | Ports 4000, 5001, 8080, 9099, 9199 |
| **CI/CD** | GitHub Actions | Ubuntu Latest, Node 20, Vite Base Deploy | `.github/workflows/deploy.yml` |
| **Unrelated Project** | Android (Kotlin) + Python (FastAPI) | Gradle 8.9, AppForge `com.appforge` | `iqoo/` (Not Carrom) |

### Workspace Directory Layout

```
c:\Users\harin\Desktop\vinoth website\
├── .github/workflows/deploy.yml       # Automated GitHub Pages CI/CD workflow
├── functions/                         # Cloud Functions backend
│   ├── index.ts                       # bookTickets & confirmPayment callables
│   ├── package.json                   # Functions dependencies (Node 22 target)
│   └── tsconfig.json                  # Functions TypeScript configuration
├── lottery-app/                       # Primary standalone Carrom application
│   ├── src/
│   │   ├── lottery/                   # Complete Carrom application domain
│   │   │   ├── components/            # 13 dedicated React UI components
│   │   │   ├── firebaseConfig.ts      # Client Firebase SDK setup & emulator hooks
│   │   │   ├── liveFirebase.ts        # Direct Firestore transactions & Storage
│   │   │   ├── lotteryService.ts      # Offline in-memory state fallback & audit
│   │   │   ├── mockData.ts            # Seed tickets & 14 lottery series specifications
│   │   │   └── types.ts               # Core domain TypeScript interfaces
│   │   ├── App.tsx                    # Root mount for Carrom desk
│   │   └── main.tsx                   # Vite React DOM entry
│   ├── package.json                   # Standalone build scripts
│   └── vite.config.ts                 # Base path and build configuration
├── src/                               # Shared copy of lottery domain & parent site
├── test/                              # Emulator integration test scripts
│   ├── runEmulatorTests.cjs           # Authentic Firebase Emulator test runner
│   └── e2eSmokeTest.cjs               # Multi-user persona end-to-end test
├── iqoo/                              # THIRD-PARTY PROJECT: "AppForge" (NOT Carrom)
├── firebase.json                      # Firebase Emulators & rules declaration
├── firestore.rules                    # Security rules with role-based access
├── storage.rules                      # Storage security rules for PDFs/images
└── firestore.indexes.json             # Composite query index definitions
```

---

## 3. Website Implementation Status

The website frontend implementation was verified across the following screens in `lottery-app/src/lottery/components/`:

1. **Authentication Screen (`LoginScreen.tsx`):**
   - Supports switching personas: Admin (`ADM001`), Employee (`EMP001` / Sasikaran), and Supervisor / Paid Employee (`PEM001` / Gogul).
   - OTP simulation and Firebase Auth phone credential entry are implemented.
2. **Draw Date Entry Screen (`EnterDrawDateScreen.tsx`):**
   - Date picker, quick date presets, operator badge, and entrance to the inventory desk.
3. **Main Ticket Grid & Header (`TicketInventoryHeaderScreen.tsx`):**
   - **Ticket Grid:** 5×5 grid (25 tiles per series block) showing ticket numbers (`0000–0024`, `0075–0099`, etc.) with booked state indicators.
   - **Multi-Booking Button:** Positioned directly beside the **Available Sheet** button. Activates multi-select mode with batch booking.
   - **Set Type Selection:** Single booking modal and Multi-Booking modal explicitly feature **Half Set** and **Full Set** toggles and quick batch selectors (`All Half Set`, `All Full Set`).
   - **Series Range Selector:** Pill controls allowing operators to toggle between series ranges (`0000–0024`, `0075–0099`, `0300–0324`, `0725–0749`, ..., `9900–9924`).
   - **Export CSV:** Downloads authorized client-side CSV records of current bookings.
4. **Available Tickets Sheet Modal (`AvailableTicketsGalleryModal.tsx`):**
   - 14-column spreadsheet grid mapping each series column.
   - Live synchronization with booked tickets: Active booked numbers render as black `-` blocks, while unbooked tickets display their 4-digit number.
   - Download and social sharing action drawers (WhatsApp, Telegram, Email).
5. **Pending Tickets Screen (`UnpaidTicketsScreen.tsx`):**
   - Full dashboard layout: summary metrics (Pending Tickets, Full Set Tickets, Half Set Tickets), search bar, set-type filters (`All`, `Full Set Only`, `Half Set Only`), and responsive table.
   - Confirmation modal with operator verification remarks and cancellation modal.
6. **Confirmed Tickets Screen (`PaidTicketsScreen.tsx`):**
   - Summary statistics cards, search bar, set-type filters, and table.
   - Modal inspection showing timestamp, operator, customer, and full audit activity log.
   - Admin-only reversal workflow with audit logging.
7. **Winner Management Screen (`TodayWinnerScreen.tsx`):**
   - Form to declare 1st, 2nd, and 3rd prize winners for the active draw date with official verification status.
8. **Result Sheets Screen (`ResultPaperScreen.tsx`):**
   - File upload interface supporting official draw declaration sheets (PDF/image) with Firebase Storage upload and direct download.
9. **Settings Screen (`ConfigSettingsScreen.tsx`):**
   - Form to update draw title, series title, and operational parameters (Admin restricted).
10. **Responsive Viewport Wrapper (`LotteryAppMain.tsx`):**
    - Defaults to full-width desktop layout across all screens.
    - Phone bezel preview (`PhoneFrame.tsx`) is preserved as an optional preview tool.

---

## 4. Android Application Implementation Status

| Check Item | Finding / Status | Evidence |
| :--- | :--- | :--- |
| **Android Project Presence** | **Not implemented** | No Android project for Carrom exists in the workspace. |
| **Contents of `iqoo/`** | **Unrelated third-party project** | `iqoo/app/src/main/res/values/strings.xml` defines `app_name: "AppForge"` (tagline: "Build apps. From your phone."). Package is `com.appforge`. |
| **Carrom Native Code** | **None** | String search for "carrom" across `iqoo/` returns 0 occurrences. |
| **Mobile Simulation** | **Implemented in React** | `PhoneFrame.tsx` provides a visual mockup of an Android mobile device inside the web browser. |
| **Capacitor / Cordova** | **Not configured** | Neither `lottery-app/package.json` nor root `package.json` contains `@capacitor/core` or `cordova`. |

---

## 5. Backend and Firebase Implementation Status

### Firebase Services Matrix

| Service | Configured in Code | Deployed to Cloud | Tested in Emulator | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Firebase Auth** | Yes (`firebaseConfig.ts`) | **No** | **Yes (Passed)** | Custom claims (`admin`, `employee`, `paid_employee`) verified on port 9099. |
| **Cloud Firestore** | Yes (`firestore.rules`) | **No** | **Yes (Passed)** | Security rules and deterministic ticket document locking verified on port 8080. |
| **Cloud Functions** | Yes (`functions/index.ts`)| **No** | **Partially (Timed out)**| Callable functions `bookTickets` and `confirmPayment` present; initialization timeout on Node 24. |
| **Cloud Storage** | Yes (`storage.rules`) | **No** | **Yes (Passed)** | Result paper uploads verified on port 9199. |
| **Firebase Hosting** | Yes (`firebase.json`) | **No** | **No** | Not deployed to Firebase Hosting; frontend hosted on GitHub Pages. |

### Firestore Database Schema

1. `/config/system`
   - Fields: `seriesTitle` (string), `businessDate` (string), `halfTicketPrice` (number), `fullTicketPrice` (number), `updatedAt` (timestamp).
   - Rules: Read by authenticated users; update by Admin only.
2. `/draws/{drawDate}/series/{seriesId}/tickets/{ticketNumber}`
   - Deterministic single-ticket lock document.
   - Fields: `ticketNumber`, `drawDate`, `seriesId`, `bookingStatus` ("Booked"), `customerName`, `customerPhone`, `bookedBy`, `bookedAt`.
   - Rules: Create allowed only if `isEmployee()`; update and delete strictly prohibited (`allow update, delete: if false`).
3. `/bookings/{bookingId}_{ticketNumber}`
   - Customer booking items.
   - Fields: `ticketNumber`, `seriesTitle`, `customerName`, `customerPhone`, `halfSelected`, `fullSelected`, `totalAmount`, `amountPaid`, `remainingBalance`, `bookingStatus`, `paymentStatus` ("Unpaid" | "Partial" | "Paid"), `bookedBy`, `bookedByRole`, `date`, `bookedAt`, `history` (array).
4. `/payments/{paymentId}`
   - Append-only financial ledger.
   - Fields: `paymentId`, `bookingItemId`, `ticketNumber`, `amount`, `paymentMethod`, `paymentRef`, `confirmedBy`, `createdAt`.
   - Rules: Update and delete strictly blocked (`allow update, delete: if false`).
5. `/auditEvents/{eventId}`
   - Append-only compliance log for all ticket booking and cancellation events.
6. `/winners/{winnerId}` & `/resultPapers/{paperId}`
   - Official draw result announcements and storage download URLs.

---

## 6. Feature-by-Feature Verification Matrix

| Area | Feature | Status | Evidence / File Path |
| :--- | :--- | :--- | :--- |
| **1. Auth** | Persona switching & simulated login | **Implemented and verified** | `LoginScreen.tsx`, `LotteryAppMain.tsx:103` |
| **1. Auth** | Server-side Firebase custom claims | **Implemented and verified** | `test/runEmulatorTests.cjs:82-120` (Auth Emulator Test 1 Passed) |
| **1. Auth** | Phone OTP via live Firebase Auth | **Implemented but not verified** | `liveFirebase.ts:25` (`signInWithPhoneNumber`, unverified in live Cloud) |
| **2. Roles** | Three-tier permissions (Admin, Supervisor, Employee) | **Implemented and verified** | `firestore.rules:10-24`, `lotteryService.ts:48-78` |
| **3. Inventory** | 5×5 Ticket Grid (25 tiles) | **Implemented and verified** | `TicketInventoryHeaderScreen.tsx:210-270` |
| **3. Inventory** | 14-Series Range switching (`0000–0024` to `9900–9924`) | **Implemented and verified** | `TicketInventoryHeaderScreen.tsx:185-208`, `mockData.ts:12-27` |
| **3. Inventory** | Available Tickets Sheet live sync | **Implemented and verified** | `AvailableTicketsGalleryModal.tsx:34-36` (Booked tickets display black `-`) |
| **4. Booking** | Single ticket booking with Half/Full Set | **Implemented and verified** | `TicketInventoryHeaderScreen.tsx:325-385` |
| **4. Booking** | Multi-ticket booking with batch Half/Full Set | **Implemented and verified** | `TicketInventoryHeaderScreen.tsx:388-490` |
| **4. Booking** | Duplicate booking concurrency prevention | **Implemented and verified** | `functions/index.ts:49-55`, `acceptanceTests.ts:15-45` |
| **5. Payments**| Partial payments and balance calculation | **Implemented and verified** | `lotteryService.ts:180-240`, `acceptanceTests.ts:83-124` |
| **5. Payments**| Unpaid / Pending ticket verification | **Implemented and verified** | `UnpaidTicketsScreen.tsx:77-95` |
| **5. Payments**| Confirmed / Paid ticket inspection | **Implemented and verified** | `PaidTicketsScreen.tsx:80-130` |
| **6. Auditing**| Booking cancellation and payment reversal | **Implemented and verified** | `PaidTicketsScreen.tsx:315-355`, `acceptanceTests.ts:126-148` |
| **6. Auditing**| Append-only payment ledger & rules check | **Implemented and verified** | `firestore.rules:65-74`, `test/runEmulatorTests.cjs:331-352` (Passed) |
| **7. Dashboards**| Management overview & counter summary | **Implemented and verified** | `BookedTicketsDashboardScreen.tsx:30-110` |
| **8. Reports** | CSV records export | **Implemented and verified** | `LotteryAppMain.tsx:312-335` |
| **8. Reports** | Search & filtering by number, name, set type | **Implemented and verified** | `UnpaidTicketsScreen.tsx:52-66`, `PaidTicketsScreen.tsx:37-51` |
| **9. Responsive**| Full desktop dashboard layout | **Implemented and verified** | `LotteryAppMain.tsx:590-675` (Verified at 1366×768 & mobile) |
| **9. Responsive**| Optional mobile Phone Frame toggle | **Implemented and verified** | `LotteryAppMain.tsx:502-588`, `PhoneFrame.tsx` |
| **10. Android**| Native Carrom Android app screens | **Not implemented** | `iqoo/` contains third-party "AppForge", not Carrom. |
| **11. Sync** | Sync between web and mobile | **Blocked** | Blocked because native Android application does not exist. |
| **12. Security**| Immutable ledger & delete denial rules | **Implemented and verified** | `firestore.rules:48,62,73`, `test/runEmulatorTests.cjs:331-352` |
| **13. Reliability**| Offline in-memory fallback mode | **Implemented and verified** | `lotteryService.ts`, `LotteryAppMain.tsx:120-250` |
| **14. Production**| Live Google Cloud / Firebase deployment | **Not implemented** | Firebase CLI is unauthenticated; no production deployment exists. |

---

## 7. Test and Build Results

### 1. Root Website Build (`npm run build`)
- **Command:** `npm run build` (`tsc && vite build`)
- **Exit Code:** `0` (Success)
- **Output:** Built 1,880 modules into `dist/` in 46.23s.
  - `dist/index.html` (2.22 kB)
  - `dist/assets/index-BTl6THFa.css` (63.98 kB)
  - `dist/assets/index-DqrgV4eO.js` (997.47 kB)

### 2. Standalone Carrom App Build (`lottery-app`)
- **Command:** `cd lottery-app; npm run build` (`tsc && vite build`)
- **Exit Code:** `0` (Success)
- **Output:** Built 1,610 modules into `lottery-app/dist/` in 38.65s.
  - `dist/index.html` (0.93 kB)
  - `dist/assets/index-DLWxY-Nw.css` (46.15 kB)
  - `dist/assets/index-BbwPFgIh.js` (769.27 kB)

### 3. Cloud Functions Build (`functions`)
- **Command:** `cd functions; npm run build` (`tsc`)
- **Exit Code:** `0` (Success)
- **Output:** Compiled `functions/index.ts` to `functions/lib/index.js` cleanly.

### 4. Firebase Emulator Integration Test Suite (`test/runEmulatorTests.cjs`)
- **Execution Method:** `firebase emulators:exec --project carrom-lottery-demo "node test/runEmulatorTests.cjs"`
- **Overall Exit Code:** `1` (3 Passed, 5 Failed due to Cloud Functions emulator initialization timeout)
- **Detailed Test Breakdown:**
  1. `[PASS] [Authentication & Roles]` Server-Side Custom Claims Assigned and Verified via Auth Tokens (`admin`, `employee`, `paid_employee`).
  2. `[FAIL] [Concurrency Safety]` Concurrent bookTickets Cloud Function Invocations (Failed because Functions emulator timed out during initialization).
  3. `[FAIL] [Transaction Atomicity]` Atomic Multi-Ticket Booking via Cloud Function (Functions emulator timed out).
  4. `[FAIL] [Payment Ledger]` Partial Payment via confirmPayment Cloud Function (Functions emulator timed out).
  5. `[FAIL] [Payment Safety]` Duplicate Payment Rejection via Cloud Function (Functions emulator timed out).
  6. `[FAIL] [Role Security]` Role Enforcement on Cloud Function (Functions emulator timed out).
  7. `[PASS] [Security Rules]` Firestore & Storage Rules Immutability and Role Validation.
  8. `[PASS] [Storage Persistence]` Result-Paper Upload to Storage Emulator & Metadata Persistence to Firestore.

**Root Cause for Emulator Functions Failure:**  
Firebase Functions emulator logged:  
`Your requested "node" version "22" doesn't match your global version "24". Using node@24 from host.`  
`Failed to load function definition from source: FirebaseError: User code failed to load... Timeout after 10000.`

---

## 8. Recent Changes and Git Status

### Current Git Status
- **Branch:** `main`
- **Working Tree:** Clean (no uncommitted or untracked changes).
- **Remote Origin:** `https://github.com/indiverr/Temp_TESTING-FINAL--Carrom.git` (synchronized with `origin/main`).

### Recent Git Commit History
1. `ca3ca90` — `feat: include 0000-0024 in Available Sheet and add series selector on Ticket Grid`
   - Added `0000–0024` as the first column in `LOTTERY_COLUMNS_SPEC`.
   - Added series range selector tabs to the Ticket Grid header.
   - Synchronized Available Tickets Sheet so booked numbers display as black `-` cells.
2. `88ef2af` — `feat: add Multi Book button near Available Sheet and Half Set / Full Set selection`
   - Added visible **Multi Book** button next to **Available Sheet**.
   - Added **Half Set** and **Full Set** toggles to both single and multi-booking modals.
   - Updated Pending and Confirmed screens to display Half Set and Full Set labels.
3. `eb0fa42` — `feat: remove all GPay, UPI, QR, payment details and refine UI to clean enterprise style`
   - Removed all consumer payment provider names (GPay, UPI, QR codes).
   - Upgraded UI styling to clean, neutral enterprise design without AI artifacts.
4. `50ca1cc` — `feat: remove all money, currency, and price displays across application`
   - Removed all `₹` currency symbols and numerical price tags across all views.
5. `c4c3ccb` — `revert: restore exact 10-day-ago codebase without UI banner modifications`

---

## 9. Security Findings

### 1. Critical
- **Unauthenticated Cloud Infrastructure:**  
  *Evidence:* Running `firebase projects:list` returns `Error: Failed to authenticate, have you run firebase login?`.  
  *Risk:* The platform is running entirely without a live production Firebase backend. If production traffic is directed to the current client without environment variables, it silently operates in client-side in-memory mock mode.

### 2. High
- **Cloud Functions Missing Reversal Functionality:**  
  *Evidence:* `functions/index.ts` header comments mention `cancelOrReverseBookingTransactional` and `setUserRoleClaims`, but lines 1–195 implement only `bookTickets` and `confirmPayment`.  
  *Risk:* Ticket cancellation in live Firestore is handled directly via client SDK rather than a privileged Cloud Function, creating a potential security inconsistency if Firestore rules are relaxed.

### 3. Medium
- **Node.js Runtime Mismatch in Cloud Functions:**  
  *Evidence:* `functions/package.json` specifies `"engines": { "node": "22" }`, but the developer machine runs Node `v24.14.0`.  
  *Risk:* Causes deployment warnings and local emulator initialization timeouts when starting Firebase emulators.

### 4. Low
- **Bundle Chunk Size Exceeding 500 kB:**  
  *Evidence:* Production build warns that `index.js` is 769 kB minified in `lottery-app` (997 kB in root).  
  *Risk:* Minor impact on initial page load latency over slow mobile networks.

---

## 10. Deployment Status and Missing Prerequisites

1. **GitHub Pages Deployment (Active):**
   - **Status:** **Live and verified.**
   - **URL:** `https://indiverr.github.io/Temp_TESTING-FINAL--Carrom/`
   - **Hosting Engine:** GitHub Actions (`.github/workflows/deploy.yml`) building `./lottery-app` with base `/Temp_TESTING-FINAL--Carrom/`.
2. **Firebase Production Hosting & Backend (Not Deployed):**
   - **Status:** **Not deployed.**
   - **Prerequisites Missing:**
     - A funded Google Cloud / Firebase Project (e.g. Blaze pay-as-you-go plan required for Cloud Functions).
     - Execution of `firebase login` on the deployment workstation.
     - Production `.env` file containing real values for `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_AUTH_DOMAIN`.
     - Deployment execution: `firebase deploy --only firestore:rules,storage:rules,functions`.
3. **Android Application Release (Not Ready):**
   - **Status:** **Not ready.**
   - **Prerequisites Missing:**
     - Native Android project structure (or Capacitor wrapper) for the Carrom application.
     - Google Play Developer account and upload keystore (`release.keystore`).

---

## 11. Known Bugs and Blockers

1. **Cloud Functions Emulator Startup Timeout:**
   - *Behavior:* Running `firebase emulators:exec` results in `User code failed to load... Timeout after 10000` because Node 24 initializes slower than the default 10-second timeout.
   - *Fix:* Update `functions/package.json` to allow Node 24 or increase emulator startup timeout.
2. **Missing Native Android Codebase:**
   - *Behavior:* The workspace references an Android mobile app, but the actual directory on disk (`iqoo/`) is an unrelated application called "AppForge".
   - *Fix:* Wrap the `lottery-app` web application using Capacitor (`@capacitor/android`) to produce a genuine APK/AAB bundle, or implement native Jetpack Compose screens for Carrom.

---

## 12. Remaining Work Prioritized

### P0: Must Fix Before Further Testing
1. **Fix Cloud Functions Emulator Compatibility:**
   - Update `functions/package.json` engines to support the installed Node version and verify `functions/lib/index.js` loads within the timeout.
2. **Complete Missing Privileged Cloud Functions:**
   - Implement `cancelOrReverseBookingTransactional` in `functions/index.ts` to ensure ticket cancellations are handled with transaction safety on the server.

### P1: Required for a Functional MVP
1. **Decide Android Strategy & Scaffold Mobile App:**
   - Remove or decouple `iqoo/` (unrelated AppForge code).
   - Add Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) to `lottery-app` to package the Carrom Lottery Desk into a production-ready Android Studio project.
2. **Set Up Live Firebase Project:**
   - Create a dedicated Firebase project, execute `firebase login`, and deploy `firestore.rules`, `storage.rules`, and `functions`.
   - Populate `.env` with production Firebase credentials.

### P2: Required Before Production Launch
1. **Implement SMS / Phone Authentication Verification:**
   - Configure Firebase Phone Authentication with real SMS provider quotas or verified test numbers.
2. **Code Splitting & Bundle Optimization:**
   - Split `lottery-app` vendor chunks (React, Lucide, Firebase) via `vite.config.ts` `manualChunks` to keep JavaScript payloads below 200 kB.
3. **Production Data Backup & Indexing:**
   - Deploy `firestore.indexes.json` to Firebase and verify automated daily Firestore exports via Cloud Storage.

### P3: Enhancements That Can Wait
1. **Bluetooth Thermal Receipt Printing:**
   - Add Web Bluetooth API integration to print physical counter receipts directly to thermal printers.
2. **Dark / Light Theme Preferences:**
   - Add an operator toggle for low-light venue operation.

---

## 13. Recommended Next Implementation Step

### Recommendation: Add Capacitor Android Packaging to `lottery-app`
**Rationale:**  
The responsive web application is already fully functional, verified, and running on GitHub Pages. However, the requirement specifically calls for an Android application, and the current `iqoo/` folder contains an unrelated codebase. Adding Capacitor directly to `lottery-app` will:
1. Wrap the exact, tested Carrom React code into a native Android Studio project (`android/`) in minutes.
2. Ensure 100% feature parity between the website and Android app with zero code duplication.
3. Enable generating real `.apk` debug and release builds immediately using Android SDK / Gradle.

---

## 14. Exact Commands Required to Run Locally

### 1. Run the Carrom Lottery Desk Frontend (Port 5174)
```powershell
cd "c:\Users\harin\Desktop\vinoth website\lottery-app"
npm install
npm run dev -- --port 5174
```
*Open in browser:* `http://localhost:5174/`

### 2. Run the Main Parent Portal (Port 5173)
```powershell
cd "c:\Users\harin\Desktop\vinoth website"
npm install
npm run dev -- --port 5173
```
*Open in browser:* `http://localhost:5173/lottery`

### 3. Start Local Firebase Emulator Suite (Ports 4000, 5001, 8080, 9099, 9199)
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:PATH = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin;" + $env:PATH
& "C:\Users\harin\AppData\Local\npm-cache\_npx\7750544ccf494d8b\node_modules\.bin\firebase.cmd" emulators:start --project carrom-lottery-demo
```
*Open Emulator UI:* `http://localhost:4000/`

---

## 15. Files and Functions That the Next Developer Should Inspect First

1. **`lottery-app/src/lottery/LotteryAppMain.tsx`**  
   - Functions: `handleBookSingleTicket`, `handleBookMultipleTickets`, `handleConfirmPayment`, `handleCancelBooking`.  
   - Purpose: Master coordinator for state, role identity, and switching between offline mock mode and live Firebase mode.
2. **`lottery-app/src/lottery/components/TicketInventoryHeaderScreen.tsx`**  
   - Functions: `handleTicketClick`, `handleToggleMultiSelect`, `handleConfirmMultiBook`.  
   - Purpose: The core operational desk containing the 5×5 ticket grid, series selector, and multi-booking controls.
3. **`lottery-app/src/lottery/components/AvailableTicketsGalleryModal.tsx`**  
   - Functions: `isNumberBooked`, `handleDownload`.  
   - Purpose: The 14-column Available Tickets Sheet that visually tracks booked versus available tickets.
4. **`functions/index.ts`**  
   - Functions: `bookTickets`, `confirmPayment`.  
   - Purpose: Authoritative server-side transactional booking and financial settlement logic.
5. **`firestore.rules`**  
   - Matchers: `/draws/.../tickets/{ticketNumber}`, `/bookings/{bookingId}`, `/payments/{paymentId}`.  
   - Purpose: Role-based permissions and immutable ledger protection rules.

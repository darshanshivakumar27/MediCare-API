# MediCare Frontend Dashboard

A modern, responsive, and interview-ready Healthcare Administration Dashboard built with **React**, **Vite**, **React Router**, and **Axios**.

This application directly consumes the REST APIs exposed by the **MediCare API – Healthcare Management Backend** (Django + Django REST Framework + SimpleJWT).

---

## 🚀 Key Features

- **JWT Authentication Flow**:
  - Secure login (`/login`) and self-service registration (`/register`).
  - Automatic injection of `Authorization: Bearer <access_token>` via centralized Axios interceptor.
  - Seamless background token refresh (`POST /api/auth/refresh/`) on 401 Unauthorized responses with request queue replay.
  - Automatic session teardown and login redirection if refresh fails or tokens expire.
- **Protected Routing**:
  - Route guard `<ProtectedRoute>` restricting access to all administrative views (`/dashboard`, `/patients`, `/doctors`, `/mappings`).
- **Clinical Dashboard (`/dashboard`)**:
  - Live metric summary cards (Total Patients, Total Doctors, Total Mappings) calculated directly from existing REST list payloads without requiring ad-hoc backend endpoints.
  - Recent Patients and Recent Clinical Assignments tables.
  - Empty states with immediate action CTAs.
- **Patient Management (`/patients`)**:
  - Full CRUD lifecycle (List, Add, View, Edit, Delete).
  - Anti-IDOR client compliance: never transmits `created_by`, `id`, `created_at`, or `updated_at`.
  - Accessible modal dialogs with form validation and delete confirmations.
- **Doctor Directory (`/doctors`)**:
  - Full CRUD lifecycle (List, Add, View, Edit, Delete).
  - Medical specialization badges, active practice status toggles, and experience tracking.
  - Protective cascade deletion warning informing the administrator of downstream mapping removal.
- **Patient-Doctor Mappings (`/mappings`)**:
  - Dynamic assignment modal populated from active patient and doctor registries (`GET /api/patients/`, `GET /api/doctors/`).
  - Clean error surfacing for duplicate assignments.
  - Safe mapping disassociation (`DELETE /api/mappings/<id>/`).
- **Responsive Healthcare UI**:
  - Professional royal blue / indigo color palette with slate typography and accessible contrast.
  - Desktop sidebar with collapsible mobile/tablet drawer.
  - Real-time API connectivity pulse indicator.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios with custom interceptors
- **Styling**: Vanilla CSS Design System with responsive variables and typography (Inter)

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── api/
│   │   ├── axios.js        # Central Axios instance, interceptors, error extraction
│   │   ├── auth.js         # Authentication & token services
│   │   ├── patients.js     # Patient CRUD API methods
│   │   ├── doctors.js      # Doctor CRUD API methods
│   │   └── mappings.js     # Patient-Doctor Mapping API methods
│   │
│   ├── components/
│   │   ├── Sidebar.jsx     # Navigation sidebar with responsive offcanvas
│   │   ├── Navbar.jsx      # Top header with user profile & API status
│   │   ├── Layout.jsx      # Master layout container
│   │   ├── Loading.jsx     # Reusable spinner loader
│   │   ├── Modal.jsx       # Accessible modal dialog
│   │   └── ProtectedRoute.jsx # Route authentication guard
│   │
│   ├── pages/
│   │   ├── Login.jsx       # User authentication page
│   │   ├── Register.jsx    # User registration page
│   │   ├── Dashboard.jsx   # Clinical summary & metrics overview
│   │   ├── Patients.jsx    # Patient records & CRUD modal views
│   │   ├── Doctors.jsx     # Doctor directory & CRUD modal views
│   │   └── Mappings.jsx    # Patient-doctor assignment management
│   │
│   ├── App.jsx             # Route configuration
│   ├── main.jsx            # React root entry point
│   └── index.css           # Global MediCare CSS design system
│
├── .env.example            # Environment configuration template
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Configure Environment Variables

```bash
cd frontend
cp .env.example .env
```

Ensure `frontend/.env` points to the local Django API:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

---

## 🧪 Production Build

To verify build output and TypeScript/JSX bundle generation:

```bash
npm run build
```

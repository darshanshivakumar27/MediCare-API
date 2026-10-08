# MediCare API — Healthcare Management Backend

A secure healthcare management backend API built with Django, Django REST Framework, PostgreSQL, and JWT Authentication. Includes a modern React/Vite dashboard for demonstration and clinical administration.

---

## 1. Project Overview
**MediCare API** provides a complete solution for healthcare administrative workflows:
- **User Authentication:** Token-based authentication using JSON Web Tokens (SimpleJWT).
- **Patient Management:** Complete CRUD capabilities with strict record-ownership scoping (anti-IDOR).
- **Doctor Directory:** Healthcare practitioner catalog and credential tracking.
- **Patient-Doctor Mappings:** Relational assignments with database-level uniqueness and cascade integrity.
- **Relational Persistence:** Backed by PostgreSQL with comprehensive constraints and indexes.
- **Frontend Dashboard:** Interactive single-page application built with React, Vite, and Axios for clinical management and API demonstration.

---

## 2. Key Features
- **User Registration & Login:** Email-first custom authentication with cryptographically hashed passwords (PBKDF2).
- **JWT Access & Refresh Tokens:** Configurable token lifetimes, stateless authorization, and automatic token refresh handling.
- **Patient Ownership Isolation:** Users only see and manage patients they personally registered, preventing Insecure Direct Object References (IDOR).
- **Doctor Directory CRUD:** System-wide directory for managing licensed medical practitioners.
- **Patient-Doctor Mappings:** Assign doctors to patients with duplicate mapping rejection.
- **Database-Level Constraints:** Unique constraints on doctor emails, patient-doctor pairs, and check constraints on years of experience.
- **Clean Architecture:** Modular Django apps partitioned by bounded domain contexts (`users`, `patients`, `doctors`, `mappings`).
- **Comprehensive Test Suite:** 73 automated tests covering happy paths, edge cases, validation rejections, and anti-IDOR security.
- **Interactive UI:** Professional, responsive healthcare dashboard with status badges, modal forms, and metrics.

---

## 3. Tech Stack
- **Backend Framework:** Django 6.1
- **API Framework:** Django REST Framework (DRF) 3.18
- **Authentication:** `djangorestframework-simplejwt` 5.5
- **Database:** PostgreSQL 17
- **Database Driver:** `psycopg2-binary` 2.9
- **CORS Support:** `django-cors-headers` 4.9
- **Configuration:** `python-dotenv` 1.2
- **Frontend Framework:** React 19 + Vite 8
- **Frontend Routing & Client:** React Router DOM v7, Axios

---

## 4. Project Structure
```text
MediCare API – Healthcare Management Backend/
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py           # Database, JWT, CORS & DRF settings
│   ├── urls.py               # Root URL configuration
│   └── wsgi.py
├── apps/
│   ├── common/               # Shared base models (TimeStampedModel)
│   ├── users/                # Custom User model, managers & auth endpoints
│   ├── patients/             # Patient CRUD, serializers & scoped views
│   ├── doctors/              # Doctor directory CRUD & serializers
│   └── mappings/             # Patient-Doctor mapping endpoints & logic
├── frontend/                 # React + Vite Healthcare Administration Dashboard
│   ├── src/
│   │   ├── api/              # Axios instance, JWT interceptors & REST services
│   │   ├── components/       # Layout, Sidebar, Navbar, Modal, Loading, Route guards
│   │   └── pages/            # Dashboard, Patients, Doctors, Mappings, Auth
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── README.md
├── postman/
│   └── MediCare_API.postman_collection.json   # Postman collection with test scripts (optional)
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Quick Setup Flow (Local Development)

Follow these sequential steps to set up and run the complete application locally:

```text
Clone repository
  → Create virtual environment
  → Install backend dependencies
  → Configure PostgreSQL
  → Configure .env
  → Run migrations
  → Start Django backend
  → Install frontend dependencies
  → Start React frontend
  → Open dashboard
```

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd "MediCare API – Healthcare Management Backend"
```

### Step 2: Create & Activate Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure PostgreSQL
Ensure PostgreSQL is running locally, then create the database:
```bash
createdb medicare_db
```

Default connection settings:
- **Database Name:** `medicare_db`
- **Host:** `localhost` (or `127.0.0.1`)
- **Port:** `5432`

### Step 5: Configure Environment Variables
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```

Verify or adjust database credentials in `.env`:
```env
SECRET_KEY=your-secure-random-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=medicare_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
> **Note:** `.env` is listed in `.gitignore` and is never committed to source control.

### Step 6: Run Database Migrations
```bash
python manage.py migrate
```

### Step 7: Start Django Backend
```bash
python manage.py runserver
```
The Django REST API will be available at:
```text
http://127.0.0.1:8000/
```

### Step 8: Install Frontend Dependencies
In a **separate terminal window**, navigate to `frontend/`:
```bash
cd frontend
npm install
```

### Step 9: Start React Frontend
```bash
npm run dev
```

### Step 10: Open Dashboard
Open your browser and navigate to:
```text
http://localhost:5173
```

---

## 6. Frontend Dashboard

The repository includes a dedicated React + Vite dashboard located inside `frontend/` to demonstrate and interact with the backend APIs.

### Setup & Run
```bash
cd frontend
npm install
npm run dev
```

### URLs
- **Frontend Dashboard:** `http://localhost:5173`
- **Backend API:** `http://127.0.0.1:8000/` *(must be running separately)*

### Dashboard Capabilities
- **Authentication:** Registration (`/register`) and Login (`/login`) with JWT token storage in `localStorage`.
- **Automatic Token Refresh:** Centralized Axios response interceptor intercepts HTTP 401 and calls `POST /api/auth/refresh/` seamlessly.
- **Main Dashboard (`/dashboard`):** Real-time summary cards (Total Patients, Total Doctors, Total Mappings) calculated from API responses, plus recent patients and doctor assignment tables.
- **Patient Management (`/patients`):** Full CRUD with anti-IDOR client compliance (never transmits `created_by` or `id`).
- **Doctor Directory (`/doctors`):** Directory management with specialty badges, experience metrics, active status toggles, and cascade warning delete prompts.
- **Doctor-Patient Mappings (`/mappings`):** Dynamic dropdowns to assign specialists to patients and remove assignments.

---

## 7. API Endpoints

| Method | Endpoint | Authentication | Purpose | Status (Success / Error) |
|---|---|---|---|---|
| `POST` | `/api/auth/register/` | None (Public) | Register new user (`name`, `email`, `password`) | `201 Created` / `400` |
| `POST` | `/api/auth/login/` | None (Public) | Authenticate user & issue JWT tokens | `200 OK` / `400` |
| `POST` | `/api/auth/refresh/` | None (Public) | Exchange refresh token for fresh access token | `200 OK` / `401` |
| `POST` | `/api/patients/` | Bearer JWT | Create new patient (auto-assigns `created_by`) | `201 Created` / `400` |
| `GET` | `/api/patients/` | Bearer JWT | List patients created by authenticated user | `200 OK` / `401` |
| `GET` | `/api/patients/<id>/` | Bearer JWT | Retrieve patient details (owner only) | `200 OK` / `404` |
| `PUT` | `/api/patients/<id>/` | Bearer JWT | Full update patient details (owner only) | `200 OK` / `400`, `404` |
| `DELETE` | `/api/patients/<id>/` | Bearer JWT | Delete patient record (owner only) | `204 No Content` / `404` |
| `POST` | `/api/doctors/` | Bearer JWT | Add new healthcare practitioner | `201 Created` / `400` |
| `GET` | `/api/doctors/` | Bearer JWT | List all doctors in directory | `200 OK` / `401` |
| `GET` | `/api/doctors/<id>/` | Bearer JWT | Get details of a specific doctor | `200 OK` / `404` |
| `PUT` | `/api/doctors/<id>/` | Bearer JWT | Update doctor details | `200 OK` / `400`, `404` |
| `DELETE` | `/api/doctors/<id>/` | Bearer JWT | Delete doctor (cascades to mappings) | `204 No Content` / `404` |
| `POST` | `/api/mappings/` | Bearer JWT | Assign doctor to patient (`patient`, `doctor`) | `201 Created` / `400`, `404` |
| `GET` | `/api/mappings/` | Bearer JWT | List mappings for patients owned by user | `200 OK` / `401` |
| `GET` | `/api/mappings/<patient_id>/` | Bearer JWT | Get all doctors assigned to a patient | `200 OK` / `404` |
| `DELETE` | `/api/mappings/<id>/` | Bearer JWT | Remove assignment by mapping ID | `204 No Content` / `404` |

---

## 8. Authentication Usage

Protected endpoints require the JWT access token in the `Authorization` request header:

```http
Authorization: Bearer <your_access_token>
```

Example `curl` request:
```bash
curl -X GET http://127.0.0.1:8000/api/patients/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 9. Example Payloads

### Register (`POST /api/auth/register/`)
```json
{
  "name": "Dr. Sarah Wilson",
  "email": "sarah.wilson@hospital.org",
  "password": "SecurePassword123!"
}
```

### Login (`POST /api/auth/login/`)
```json
{
  "email": "sarah.wilson@hospital.org",
  "password": "SecurePassword123!"
}
```

### Create Patient (`POST /api/patients/`)
```json
{
  "name": "John Doe",
  "date_of_birth": "1990-05-15",
  "gender": "MALE",
  "contact_number": "+919876543210",
  "email": "john.doe@example.com",
  "address": "Mysore, Karnataka",
  "medical_history": "Mild hypertension"
}
```

### Create Doctor (`POST /api/doctors/`)
```json
{
  "name": "Dr. Sarah Wilson",
  "specialization": "Cardiology",
  "contact_number": "+919876543210",
  "email": "sarah.wilson@hospital.org",
  "years_of_experience": 12,
  "is_active": true
}
```

### Create Mapping (`POST /api/mappings/`)
```json
{
  "patient": 1,
  "doctor": 2
}
```

---

## 10. Security Considerations
- **Anti-IDOR Queryset Isolation:** Patient queries are scoped by `created_by = request.user`. Unauthorized requests return HTTP `404 Not Found` (never `403`), preventing resource enumeration.
- **Stateless JWT Authorization:** Access tokens are cryptographically signed with HMAC-SHA256 using the server's private `SECRET_KEY`.
- **Password Protection:** Plaintext passwords are never stored or logged; passwords are cryptographic PBKDF2 hashes with individual salts.
- **Read-Only Enforcements:** Sensitive fields (`created_by`, `assigned_at`, `id`, `created_at`, `updated_at`) cannot be overwritten by client payloads.
- **Relational Integrity:** PostgreSQL enforces `UNIQUE (patient_id, doctor_id)` and cascades mapping removals when a doctor or patient is deleted.
- **Scoped CORS:** Development CORS origins are strictly restricted to the local frontend (`http://localhost:5173`, `http://127.0.0.1:5173`).

---

## 11. Running Automated Tests

Run the full automated test suite using Django's test runner:

```bash
# 1. Verify Django configuration
python manage.py check

# 2. Run all tests
python manage.py test
```

### Current Test Coverage
- **Authentication Tests (`apps/users`):** 13 passed
- **Patient Tests (`apps/patients`):** 19 passed
- **Doctor Tests (`apps/doctors`):** 19 passed
- **Mapping Tests (`apps/mappings`):** 22 passed
- **Total Test Count:** **73 / 73 passing (100% pass rate)**

---

## 12. API Testing with Postman (Optional)

Testing with Postman is completely **optional**, as the included React frontend dashboard provides a full graphical interface for testing and interacting with the backend.

If you prefer testing with Postman, a complete collection is available at:
[`postman/MediCare_API.postman_collection.json`](file:///Users/darshan/MediCare%20API%20%E2%80%93%20Healthcare%20Management%20Backend/postman/MediCare_API.postman_collection.json)

### Features of the Collection:
- Organized into 4 folders: **Authentication**, **Patients**, **Doctors**, and **Patient-Doctor Mappings**.
- Covers all 17 mandatory and supporting endpoints.
- **Automated Token Chaining:** Running the *Login User* request automatically extracts the returned access token and saves it into the `{{access_token}}` collection variable.
- **Entity ID Chaining:** Creating a patient, doctor, or mapping automatically stores `{{patient_id}}`, `{{doctor_id}}`, and `{{mapping_id}}` for subsequent detail, update, and delete calls.

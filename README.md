# MediCare API – Healthcare Management Backend

A robust, secure, and production-ready healthcare management backend API built with **Django**, **Django REST Framework (DRF)**, **PostgreSQL**, and **JWT Authentication**.

---

## 📌 Project Overview
MediCare API provides secure healthcare data management capabilities:
- User Authentication (Registration & Login via JWT)
- Patient Record Management (Scoped by record owner to prevent IDOR)
- Healthcare Practitioner / Doctor Directory
- Patient-Doctor Assignments and Relationship Tracking

---

## 🛠 Tech Stack
- **Framework:** Django 6 / Django REST Framework (DRF)
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT) via `djangorestframework-simplejwt`
- **Configuration:** Environment variables via `python-dotenv`
- **Language:** Python 3.13+

---

## 📁 Project Architecture
```
MediCare API – Healthcare Management Backend/
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── apps/
    ├── common/       # Shared base models, utilities & exception handlers
    ├── users/        # Custom User model & JWT authentication
    ├── patients/     # Patient CRUD & scoped access control
    ├── doctors/      # Doctor directory CRUD
    └── mappings/     # Patient-Doctor relationship management
```

---

## ⚙️ Initial Setup & Local Development

### 1. Clone & Navigate
```bash
git clone <repository-url>
cd "MediCare API – Healthcare Management Backend"
```

### 2. Create and Activate Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and update credentials:
```bash
cp .env.example .env
```

### 5. Provision PostgreSQL Database
```bash
createdb medicare_db
```

### 6. Run Migrations & Start Server
```bash
python manage.py migrate
python manage.py runserver
```

---

## 🔐 Security Features
- **Stateless JWT Authentication:** Access & Refresh token rotation pattern.
- **Environment Isolation:** Zero credentials or secrets in source code.
- **Ownership Scoping:** Strict authorization preventing Insecure Direct Object References (IDOR).
- **Strong Password Hashing:** Powered by Django's PBKDF2 cryptography.

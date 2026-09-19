# TriNetra (त्रिनेत्र) - Smart Packaging & Compliance Verification Platform

TriNetra is an AI-powered compliance inspection platform designed to automate Legal Metrology rules validation for packaged commodities in India.

## Repository Structure

```
TriNetra/
├── trinetra-backend/   # Node.js + Express + MongoDB REST API
└── trinetra-frontend/  # React + TypeScript + Vite + Tailwind CSS Web Application
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd trinetra-backend
npm install
# Copy .env.example to .env and configure your variables
npm run dev
```

### 2. Frontend Setup

```bash
cd trinetra-frontend
npm install
npm run dev
```

The frontend client runs on `http://localhost:5173` and connects to the backend API running on `http://localhost:5000`.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, jsPDF
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, JWT Authentication, bcryptjs
- **Testing**: Playwright (E2E), Jest (API unit tests)

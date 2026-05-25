# SplitIt

> Bill splitting app, final project for Software Engineering course at BINUS.
> Team project, my role: Backend Developer.

## About

SplitIt adalah aplikasi split bill bareng temen, kayak Splitwise tapi versi
sendiri. Final project mata kuliah Software Engineering, dikerjain bertiga.

Role aku: backend (NestJS API, Prisma schema, auth, expense splitting logic).

## Tech Stack

### Backend (my contribution)
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- bcrypt + JWT auth

### Frontend (team contribution)
- React 18 + TypeScript
- Vite
- Zustand state management
- Tailwind CSS v4

## Features

- JWT authentication dengan bcrypt
- Friends system (request/accept)
- Group expenses with per-item splits
- In-group messaging
- Settlement tracking
- **Dark mode** — toggle light/dark theme, preferensi disimpan ke localStorage
- **OCR Scan Struk** — foto struk belanja → nama & total otomatis terisi pakai Groq Vision AI

## Getting Started

```bash
# Clone
git clone https://github.com/EdwardAriaTanujaya/SplitIt.git
cd SplitIt

# Backend
cd splitit-backend
npm install
cp .env.example .env
# edit .env dengan DATABASE_URL & JWT_SECRET
npx prisma migrate dev
npm run start:dev

# Frontend (terminal baru)
cd ../splitit-frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

### Backend (`splitit-backend/.env`)

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Koneksi MySQL, contoh: `mysql://root@localhost:3306/splitit_db` |
| `JWT_SECRET` | Secret key untuk signing JWT token |
| `PORT` | Port backend (default `3000`) |
| `GROQ_API_KEY` | API key dari [console.groq.com](https://console.groq.com) untuk fitur OCR scan struk |

### Frontend (`splitit-frontend/.env`)

| Variable | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | URL backend, contoh: `http://localhost:3000` |

## Fitur OCR Scan Struk

Fitur ini menggunakan **Groq Vision AI** (`meta-llama/llama-4-scout-17b-16e-instruct`) untuk membaca foto struk belanja secara otomatis.

**Cara pakai:**
1. Buka detail group → klik tombol **+** (Add Expense)
2. Klik **📷 Scan Struk Otomatis**
3. Pilih foto struk dari galeri/kamera
4. Nama toko & total otomatis terisi
5. Assign manual siapa bayar berapa

**Alur teknis:**
```
Frontend → POST /ocr/scan (multipart image)
         → Backend convert ke base64
         → Groq Vision API parse struk
         → Return { title, items[], total }
         → Frontend auto-fill form
```

## Dark Mode

Toggle dark/light mode via ikon bulan/matahari di header. Preferensi disimpan ke `localStorage` sehingga tetap aktif setelah refresh.

## What I Learned

- NestJS modular architecture
- Prisma migrations & complex relations (many-to-many)
- JWT vs session authentication tradeoffs
- Team collaboration dengan git branching
- Real backend testing mindset

## Team

2 orang, front end dan backend

## Status

Completed (submitted as final project).

---

Made by team

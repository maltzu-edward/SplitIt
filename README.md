# SplitIt

> Bill splitting app — final project for Software Engineering course at BINUS.
> Team project, my role: Backend Developer.

## About

SplitIt adalah aplikasi split bill bareng temen — kayak Splitwise tapi versi
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

## What I Learned

- NestJS modular architecture
- Prisma migrations & complex relations (many-to-many)
- JWT vs session authentication tradeoffs
- Team collaboration dengan git branching
- Real backend testing mindset

## Team

3 orang. Aku backend dev, dua temen frontend.

## Status

Completed (submitted as final project).

---

Made by [Jessen William](https://github.com/Jesssssswill) & team
# GED Learning Platform — FINAL

A no-login full-stack GED learning and practice platform.

## Feature status

| Status | Feature |
| --- | --- |
| ✅ Done | Anonymous browser identity, isolated exam attempts, server timer/autosave, simulated practice scoring, result review, mistake bank, dashboard analytics |
| ✅ Done | Admin exam creation and CSV/JSON validate-preview-import |
| ✅ Done | Math calculator/formula sheet, Writing rubric/fallback feedback, Listening timestamp transcript, persistent Tutor conversations |
| 🟡 Beta | Reading highlights/elimination workspace persistence, Science/Social subject workspaces, adaptive study plan |
| 🟠 Prototype | Drag/drop question interaction, graph/coordinate question engine, speaking local recording metrics |
| 🔴 Planned | PDF/DOCX import, production STT/word alignment/pronunciation analysis, streaming Tutor, official GED score equivalency |

## Highlights

- Four GED subjects: Mathematical Reasoning, Science, Social Studies, RLA
- Reading split-screen exam mode
- 100–200 simulated GED score scale
- Math scientific-calculator style widget and formula sheet
- Fill-in-the-blank, dropdown and graph interactions
- Science data/graph analysis
- Social Studies source-analysis workspace
- RLA editing and extended-response writing
- Writing editor with spellcheck/autocorrect disabled
- 45-minute writing timer + word counter
- AI essay scoring endpoint with safe fallback when OPENAI_API_KEY is absent
- Listening player with speed controls, seek controls, transcript
- Speaking recorder with MediaRecorder and local fluency metrics
- Reading highlighting and answer elimination
- Quick vocabulary lookup
- Floating GED AI Tutor with contextual fallback + optional OpenAI integration
- Admin CMS starter: create exams/questions and bulk import JSON/CSV
- Knowledge-gap analysis and adaptive plan
- Mistake bank
- Flashcards
- Dockerized PostgreSQL + Prisma

## Requirements

- Node.js 20+
- pnpm 10+
- Docker Desktop

## Install

```bash
pnpm install
```

## Database

```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Run

```bash
pnpm dev
```

Frontend: http://localhost:3000
Backend: http://localhost:4000
API health: http://localhost:4000/api/health

## No login

This version intentionally skips authentication. Each browser receives a locally
stored anonymous ID, so attempts, results, analytics, tutor history, and mistakes
are separated without requiring sign-in. Clearing browser storage starts a new
anonymous learner profile.

## Optional OpenAI

Add to `apps/api/.env`:

```env
OPENAI_API_KEY=your_key_here
```

The API falls back to local tutor/scoring logic if no key is configured.

## Important

This is a training/practice platform. The score bands and exam UX are simulated for learning and should not be presented as an official GED testing client.

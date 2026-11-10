# PaceUp: Every Step Has a Purpose

PaceUp is a fitness community where people share the reason behind their runs and workouts. Instead of focusing on pace or distance, every story starts with a purpose, whether it's for themselves, for someone they love, or for a cause. By sharing why they move, members inspire and encourage each other to keep going.

> **Status: early prototype.** Things will change quickly and may break.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL (in `backend/`)
- **Frontend:** Next.js with TypeScript, the App Router, and Tailwind CSS (in `web/`)
- **Tests:** pytest, using an in-memory SQLite database

## Running the backend

You'll need Python 3.10+ and PostgreSQL installed.

All commands below are run from the `backend/` folder:

```bash
cd backend
```

1. Create and activate a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the tests (these don't need Postgres):

   ```bash
   pytest
   ```

4. Create the database (first time only):

   ```bash
   createdb paceup
   ```

   By default the app connects to `postgresql+psycopg://localhost/paceup`. To use a different database, set `DATABASE_URL` in your environment or in a `backend/.env` file (never commit it).

5. Start the server:

   ```bash
   uvicorn app.main:app --reload
   ```

   The API runs at http://localhost:8000. Open http://localhost:8000/docs to try the endpoints in your browser.

## Running the frontend

You'll need Node.js installed. Start the backend first, then in a second terminal:

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 to see the story wall. The frontend finds the backend through `NEXT_PUBLIC_API_URL` in `web/.env.local` (default `http://127.0.0.1:8000`).

## API

| Method | Path       | What it does                                   |
| ------ | ---------- | ---------------------------------------------- |
| GET    | `/health`  | Checks that the server is running              |
| GET    | `/stories` | Lists stories, newest first (`?limit=`, max 100) |
| POST   | `/stories` | Shares a new story                             |

A story has a `purpose` (one of: `for_myself`, `for_someone_i_love`, `for_mental_wellbeing`, `for_a_cause`, `for_my_family`, `to_prove_i_can`, `for_my_community`), a `body` (1–1000 characters), and an optional `display_name`.

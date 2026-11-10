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
| GET    | `/activities` | Lists logged activities, newest first (`?limit=`, default 50) |
| POST   | `/activities` | Logs a new activity                         |
| POST   | `/activities/import` | Reads a GPX, TCX, or FIT file (max 5 MB) and returns a summary preview. Nothing is saved |

A story has a `purpose` (one of: `for_myself`, `for_someone_i_love`, `for_mental_wellbeing`, `for_a_cause`, `for_my_family`, `to_prove_i_can`, `for_my_community`), a `body` (1–1000 characters), and an optional `display_name`.

An activity has an `activity_type` (`run`, `swim`, `ride`, `gym`, `walk`, `other`) and a `duration_s` (1 second to 24 hours). These are optional:

- `distance_m`: 0 to 500,000 meters
- `avg_heart_rate`: 30 to 250 bpm
- `purpose`: same values as stories
- `note`: up to 500 characters
- `display_name`

Distance is stored in meters and time in seconds. The API also returns `pace_s_per_km`, which is calculated when activities are sent back and never stored.

### Importing from Strava, Garmin, or other apps

`POST /activities/import` takes one workout file as form data (field name `file`). It returns only a summary: type, distance, duration, average heart rate, and start time. The file itself is never stored, and GPS points and routes are never kept. The person checks the preview, adds a purpose and note, and then it's saved through `POST /activities`.

XML files are checked with `defusedxml` first, so files with DTDs or entities are refused. FIT files must pass their checksum.

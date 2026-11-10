# PaceUp

PaceUp is a fitness community app. Tagline: **"Every Step Has a Purpose."**

## Stack

- **Backend** (`/backend`): FastAPI + SQLAlchemy + Postgres. Tests live in `backend/tests` and run with pytest.
- **Frontend** (`/web`): Next.js with TypeScript, App Router, and Tailwind. Check with `npm run lint` and `npm run build`. See `web/AGENTS.md`: read the docs in `web/node_modules/next/dist/docs/` before writing Next.js code.

## How to work in this repo

1. **Make small changes, one feature at a time.** Don't bundle unrelated changes together.
2. **Run pytest after every change** (from `/backend`: `pytest`). Report the result, and if tests fail, say so and show the output.
3. **Explain each change in plain language.** The owner is learning, so say what changed, why, and how it fits into the app. Avoid jargon, or define it when you use it.
4. **Never commit `.env` files or secrets.** API keys, passwords, database URLs with credentials, and tokens stay out of git. Load them from environment variables, and check `git status` before committing.

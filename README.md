# AI Site Builder (Local MVP)

## Quickstart

1) Prerequisites

- Node 20+ and pnpm 9+
- Python 3.11+

2) Install JS dependencies (from repo root)

```bash
cd /home/odoo/rush
pnpm i
```

3) Backend Python environment (from apps/api)

```bash
cd /home/odoo/rush/apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

4) Configure env files

- Create `apps/web/.env.local` with:

```bash
GEMINI_API_KEY=your_key_here
```

- Create `apps/api/.env` with:

```bash
DATABASE_URL="file:../data/dev.db"
```

5) Initialize the SQLite database with Prisma (from repo root + API)

Option A (recommended): Node CLI pinned to 5.11.0 + Python client generate

```bash
cd /home/odoo/rush
pnpm run prisma:migrate
pnpm run prisma:generate:py
```

Option B (manual within apps/api)

```bash
cd /home/odoo/rush/apps/api
pnpm dlx prisma@5.11.0 migrate dev --schema prisma/schema.prisma
python -m prisma generate
```

6) Run dev servers

- Backend API (in one terminal):

```bash
cd /home/odoo/rush/apps/api
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Frontend Web (in a second terminal):

```bash
cd /home/odoo/rush/apps/web
pnpm dev
```

Endpoints:
- Web: http://localhost:3000
- API: http://localhost:8000/health

## Structure
- apps/web: Next.js
- apps/api: FastAPI + Prisma (SQLite dev)
- packages/shared: Shared zod schemas

## Notes
- No Docker/Redis/MinIO in MVP
- Background generation runs inline
- Files stored on local disk under API

---

## Directory-specific command map

- Repo root `/home/odoo/rush`:
  - Install JS deps: `pnpm i`
  - (Optional) Run both dev servers with Turbo once API venv is active in same shell: `pnpm dev`

- API `/home/odoo/rush/apps/api`:
  - Create/activate venv: `python3 -m venv .venv && source .venv/bin/activate`
  - Install Python deps: `pip install -r requirements.txt`
  - Prisma migrate: `pnpm dlx prisma migrate dev --schema prisma/schema.prisma`
  - Prisma generate: `pnpm dlx prisma generate --schema prisma/schema.prisma`
  - Run API: `uvicorn app.main:app --reload --port 8000`

- Web `/home/odoo/rush/apps/web`:
  - Dev server: `pnpm dev`
  - Build: `pnpm build && pnpm start`

## Common issues

- `uvicorn: command not found`: Ensure your Python venv is activated: `source .venv/bin/activate`.
- Prisma not finding schema: Run commands from `apps/api` or pass `--schema prisma/schema.prisma`.
- `GEMINI_API_KEY` errors: Ensure `apps/web/.env.local` is set and restart the dev server.




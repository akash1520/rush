# Rush - AI Site Builder

Build beautiful websites with AI assistance. Rush is a local development tool that combines the power of AI with professional code editing and live preview.

## ✨ Features

- 🤖 **AI-Powered Code Generation** - Chat with Gemini 2.5 Flash to generate HTML/CSS/JS
- 💻 **Monaco Code Editor** - Professional code editing with syntax highlighting
- 👁️ **Live Preview** - See your changes instantly with Sandpack
- 📁 **File Management** - Intuitive file tree and tab system
- 💾 **Auto-Save** - Track and save changes across multiple files
- ⬇️ **Export** - Download projects as ZIP files
- 🎨 **Modern UI** - Beautiful gradient design with Tailwind CSS

## 🚀 Quickstart

### Prerequisites

- Node 20+ and pnpm 9+
- Python 3.11+
- Google Gemini API Key ([Get one here](https://ai.google.dev))

### 1. Install Dependencies

```bash
cd /home/odoo/rush
pnpm i
```

### 2. Setup Python Environment

```bash
cd /home/odoo/rush/apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `apps/web/.env.local`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `apps/api/.env`:
```bash
DATABASE_URL="file:../data/dev.db"

# Optional: Custom storage location for generated app files
# Default: /home/odoo/rush-storage
STORAGE_BASE_DIR="/home/odoo/rush-storage"
```

### 4. Initialize Database

**Option A (Recommended):**
```bash
cd /home/odoo/rush
pnpm run prisma:migrate
pnpm run prisma:generate:py
```

**Option B (Manual):**
```bash
cd /home/odoo/rush/apps/api
pnpm dlx prisma@5.11.0 migrate dev --schema prisma/schema.prisma
python -m prisma generate
```

### 5. Start Development Environment

**🎯 One-Command Startup (Recommended):**
```bash
cd /home/odoo/rush
./dev.sh
```

This starts both API and web servers with:
- Automatic process management
- Centralized logging
- Graceful shutdown with Ctrl+C

**Stop servers:**
```bash
./dev-stop.sh
```

**Manual Startup (Alternative):**

Terminal 1 - API Backend:
```bash
cd /home/odoo/rush/apps/api
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 - Web Frontend:
```bash
cd /home/odoo/rush/apps/web
pnpm dev
```

### 6. Access the Application

- 🌐 **Web UI**: http://localhost:3000
- 🔌 **API**: http://localhost:8000/health
- 📊 **API Docs**: http://localhost:8000/docs

When using `dev.sh`, logs are available at:
- API: `.dev-logs/api.log`
- Web: `.dev-logs/web.log`

## 📖 How to Use

1. **Create a Project** - Start from the dashboard
2. **Chat with AI** - Describe what you want to build
3. **Generate Code** - AI creates HTML/CSS/JS files automatically
4. **Edit Code** - Fine-tune with Monaco editor
5. **Live Preview** - See changes in real-time
6. **Save & Download** - Export your project

## 🏗️ Architecture

### Frontend (`apps/web`)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand + TanStack Query
- **Editor**: Monaco Editor
- **Preview**: Sandpack (CodeSandbox)
- **AI**: Vercel AI SDK + Google Gemini

### Backend (`apps/api`)
- **Framework**: FastAPI
- **Database**: Prisma + SQLite
- **Storage**: Local filesystem (outside project root)
- **AI**: Google Generative AI SDK

### Shared (`packages/shared`)
- **Validation**: Zod schemas
- **Types**: TypeScript definitions

## 💾 Storage Location

Generated app files are stored **outside the project root** to keep the repository clean:

**Default Location**: `/home/odoo/rush-storage/projects/`

**Custom Location**: Set `STORAGE_BASE_DIR` in `apps/api/.env`:
```bash
STORAGE_BASE_DIR="/path/to/your/storage"
```

**Structure**:
```
/home/odoo/rush-storage/
└── projects/
    ├── project-id-1/
    │   ├── index.html
    │   ├── css/
    │   └── js/
    └── project-id-2/
        └── ...
```

## 📁 Project Structure

```
rush/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py         # API routes + CORS
│   │   │   ├── models.py       # Pydantic models
│   │   │   ├── config.py       # Configuration
│   │   │   └── services/
│   │   │       ├── db.py       # Database service
│   │   │       ├── storage.py  # File storage
│   │   │       └── generator.py # AI code generation
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── storage/            # Project files
│   │
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── page.tsx        # Landing page
│       │   ├── dashboard/      # Project list
│       │   ├── editor/         # Code editor
│       │   └── api/ai/         # AI generation endpoint
│       └── lib/
│           ├── api.ts          # TanStack Query hooks
│           ├── store.ts        # Zustand store
│           └── providers.tsx   # Query client
│
├── packages/
│   └── shared/                 # Shared types & schemas
│       └── src/
│           └── schemas.ts      # Zod schemas
│
├── dev.sh                      # Start dev environment
├── dev-stop.sh                 # Stop dev environment
└── README.md                   # This file
```

## 🛠️ Development

### Quick Commands

| Command | Description |
|---------|-------------|
| `./dev.sh` | Start all dev servers |
| `./dev-stop.sh` | Stop all dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type check all packages |

### Workspace Commands

**Root (`/home/odoo/rush`)**
```bash
pnpm i                  # Install dependencies
pnpm dev                # Run with Turbo (requires venv active)
pnpm build              # Build all apps
pnpm lint               # Lint all apps
```

**API (`/home/odoo/rush/apps/api`)**
```bash
source .venv/bin/activate                           # Activate venv
pip install -r requirements.txt                     # Install deps
uvicorn app.main:app --reload --port 8000          # Run server
pnpm dlx prisma migrate dev --schema prisma/schema.prisma  # Migrate DB
python -m prisma generate                           # Generate client
```

**Web (`/home/odoo/rush/apps/web`)**
```bash
pnpm dev                # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
```

**Shared (`/home/odoo/rush/packages/shared`)**
```bash
pnpm build              # Build TypeScript
pnpm dev                # Watch mode
```

## 🎨 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Monaco Editor** - VS Code editor component
- **Sandpack** - Live preview sandbox
- **AI SDK** - Streaming AI responses
- **Zod** - Schema validation

### Backend
- **FastAPI** - Modern Python web framework
- **Prisma** - Type-safe database ORM
- **SQLite** - Embedded database
- **Pydantic** - Data validation
- **Google Generative AI** - AI code generation
- **Uvicorn** - ASGI server

## 🔧 Configuration

### Environment Variables

**Frontend** (`apps/web/.env.local`):
```bash
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`apps/api/.env`):
```bash
DATABASE_URL="file:../data/dev.db"

# Storage directory for generated app files (outside project root)
# Default: /home/odoo/rush-storage
STORAGE_BASE_DIR="/home/odoo/rush-storage"

# Optional: GEMINI_API_KEY (for backend generation endpoint)
```

### AI Models

Currently using **Gemini 2.5 Flash** (free tier):
- Context: 1,048,576 tokens
- Output: 65,535 tokens
- Fast and cost-effective

Alternative models available:
- `gemini-2.5-pro` - More capable, slower
- `gemini-1.5-flash` - Previous generation
- `gemini-1.5-pro` - Previous generation, more capable

## 🐛 Troubleshooting

### Common Issues

**`uvicorn: command not found`**
- Activate Python venv: `source apps/api/.venv/bin/activate`

**CORS errors**
- Ensure API is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Prisma errors**
- Run migrations: `pnpm run prisma:migrate`
- Regenerate client: `pnpm run prisma:generate:py`

**TypeScript errors**
- Build shared package: `cd packages/shared && pnpm build`
- Restart TypeScript server in your IDE

**AI generation fails**
- Verify `GEMINI_API_KEY` is set correctly
- Check API key has access to Gemini models
- Review logs: `tail -f .dev-logs/web.log`

**Preview not loading**
- Ensure files are saved to backend
- Check browser console for errors
- Verify API endpoint is accessible

### Debug Logs

When using `dev.sh`, check logs:
```bash
# API logs
tail -f .dev-logs/api.log

# Web logs
tail -f .dev-logs/web.log

# Both
tail -f .dev-logs/*.log
```

## 📚 Documentation

- **Frontend Guide**: See `FRONTEND_GUIDE.md` for detailed frontend documentation
- **Storage Migration**: See `STORAGE_MIGRATION.md` for storage configuration and migration
- **API Docs**: http://localhost:8000/docs (when API is running)

## 🚦 Development Workflow

1. **Start development**: `./dev.sh`
2. **Make changes**: Edit code in your IDE
3. **Auto-reload**: Both servers reload automatically
4. **Check logs**: Monitor `.dev-logs/` directory
5. **Test features**: Use the web UI at localhost:3000
6. **Stop servers**: Press `Ctrl+C` or run `./dev-stop.sh`

## 🎯 Features Roadmap

### Current (v1.0)
- ✅ AI code generation
- ✅ Monaco editor
- ✅ Live preview
- ✅ File management
- ✅ Project CRUD
- ✅ ZIP export

### Planned
- [ ] Dark mode toggle
- [ ] Multiple AI models selection
- [ ] File upload/import
- [ ] Collaborative editing
- [ ] Version history
- [ ] Template library
- [ ] Custom editor themes
- [ ] Keyboard shortcuts
- [ ] Search in files
- [ ] Git integration

## 📄 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm lint && pnpm typecheck`
5. Submit a pull request

## 💬 Support

- Issues: [GitHub Issues]
- Docs: See `FRONTEND_GUIDE.md`
- API: http://localhost:8000/docs

---

Built with ❤️ using Next.js, FastAPI, and AI

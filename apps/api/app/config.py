import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

# Storage directory - configurable via environment variable
# Railway: Use /app/storage (persistent volume) or /tmp/storage (ephemeral)
# Local dev: Use /home/odoo/rush-storage
STORAGE_BASE = os.getenv("STORAGE_BASE_DIR")
if not STORAGE_BASE:
    # Default to Railway path if RAILWAY_ENVIRONMENT is set, otherwise local dev path
    if os.getenv("RAILWAY_ENVIRONMENT"):
        STORAGE_BASE = "/app/storage"
    else:
        STORAGE_BASE = "/home/odoo/rush-storage"

STORAGE_DIR = Path(STORAGE_BASE) / "projects"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Environment variables
# Railway provides DATABASE_URL automatically when PostgreSQL service is added
DATABASE_URL = os.getenv("DATABASE_URL", f"file:{DATA_DIR}/dev.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# CORS Configuration
# Set ALLOWED_ORIGINS environment variable with comma-separated origins
# Example: ALLOWED_ORIGINS=https://rush-web.vercel.app,https://example.com
# Note: Browsers send origins without trailing slashes, so trailing slashes are automatically removed
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    # Parse and normalize origins (remove trailing slashes)
    ALLOWED_ORIGINS = [origin.strip().rstrip("/") for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]
else:
    # Default: allow all origins (useful for development)
    # In production, you should set ALLOWED_ORIGINS environment variable for security
    ALLOWED_ORIGINS = ["*"]

# API Configuration
GEMINI_MODEL = "gemini-1.5-flash"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB



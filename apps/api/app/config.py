import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

# Storage directory - configurable via environment variable
# Default: Outside project root at /home/odoo/rush-storage
STORAGE_BASE = os.getenv("STORAGE_BASE_DIR", "/home/odoo/rush-storage")
STORAGE_DIR = Path(STORAGE_BASE) / "projects"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Environment variables
DATABASE_URL = os.getenv("DATABASE_URL", f"file:{DATA_DIR}/dev.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# API Configuration
GEMINI_MODEL = "gemini-1.5-flash"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB



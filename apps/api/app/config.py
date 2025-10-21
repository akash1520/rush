import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
STORAGE_DIR = BASE_DIR / "storage" / "projects"
DATA_DIR = BASE_DIR / "data"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Environment variables
DATABASE_URL = os.getenv("DATABASE_URL", f"file:{DATA_DIR}/dev.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# API Configuration
GEMINI_MODEL = "gemini-1.5-flash"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB



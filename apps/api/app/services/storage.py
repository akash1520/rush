import os
import aiofiles
from pathlib import Path
from typing import Optional
import zipfile
from io import BytesIO

from app.config import STORAGE_DIR


def get_project_storage_path(project_id: str) -> Path:
    """Get the storage directory path for a project."""
    path = STORAGE_DIR / project_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def sanitize_path(file_path: str) -> str:
    """
    Sanitize file path to prevent directory traversal attacks.
    Removes leading slashes and ensures path doesn't escape project directory.
    """
    # Remove leading slashes
    clean_path = file_path.lstrip("/")

    # Normalize path to prevent directory traversal
    normalized = os.path.normpath(clean_path)

    # Ensure the path doesn't try to escape upward
    if normalized.startswith("..") or normalized.startswith("/"):
        raise ValueError(f"Invalid file path: {file_path}")

    return normalized


async def write_file(project_id: str, file_path: str, content: str) -> str:
    """
    Write file content to disk for a project.
    Returns the local file path relative to storage root.
    """
    clean_path = sanitize_path(file_path)
    project_dir = get_project_storage_path(project_id)
    full_path = project_dir / clean_path

    # Create parent directories if needed
    full_path.parent.mkdir(parents=True, exist_ok=True)

    # Write file
    async with aiofiles.open(full_path, "w", encoding="utf-8") as f:
        await f.write(content)

    # Return relative path from storage root
    return str(Path(project_id) / clean_path)


async def read_file(project_id: str, file_path: str) -> Optional[str]:
    """
    Read file content from disk for a project.
    Returns None if file doesn't exist.
    """
    clean_path = sanitize_path(file_path)
    project_dir = get_project_storage_path(project_id)
    full_path = project_dir / clean_path

    if not full_path.exists():
        return None

    async with aiofiles.open(full_path, "r", encoding="utf-8") as f:
        return await f.read()


def create_zip_archive(project_id: str) -> BytesIO:
    """
    Create a ZIP archive of all files in a project.
    Returns BytesIO buffer containing the ZIP file.
    """
    project_dir = get_project_storage_path(project_id)

    # Create in-memory ZIP file
    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Walk through all files in project directory
        for root, dirs, files in os.walk(project_dir):
            for file in files:
                file_path = Path(root) / file
                # Get path relative to project directory
                arcname = file_path.relative_to(project_dir)
                zip_file.write(file_path, arcname)

    # Reset buffer position to beginning
    zip_buffer.seek(0)
    return zip_buffer


def check_filesystem_health() -> bool:
    """Check if filesystem is accessible and writable."""
    try:
        test_file = STORAGE_DIR / ".health_check"
        test_file.write_text("ok")
        test_file.unlink()
        return True
    except Exception:
        return False



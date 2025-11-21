"""
Command execution service for running npm commands.
"""
import asyncio
import logging
from pathlib import Path
from typing import Optional, Callable, AsyncIterator
import json

from app.services.storage import get_project_storage_path

logger = logging.getLogger(__name__)


async def run_command(
    command: str,
    cwd: Path,
    env: Optional[dict] = None,
    timeout: Optional[float] = None,
) -> tuple[int, str, str]:
    """
    Run a command and return exit code, stdout, and stderr.

    Args:
        command: Command to run (e.g., "npm install")
        cwd: Working directory
        env: Environment variables
        timeout: Timeout in seconds (None for no timeout)

    Returns:
        Tuple of (exit_code, stdout, stderr)
    """
    try:
        cmd_parts = command.split()

        process_env = None
        if env:
            import os
            process_env = os.environ.copy()
            process_env.update(env)

        process = await asyncio.create_subprocess_exec(
            *cmd_parts,
            cwd=cwd,
            env=process_env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            return (1, "", f"Command timed out after {timeout} seconds")

        exit_code = process.returncode
        stdout_text = stdout.decode('utf-8', errors='replace')
        stderr_text = stderr.decode('utf-8', errors='replace')

        return (exit_code, stdout_text, stderr_text)

    except Exception as e:
        logger.error(f"Error running command '{command}': {e}")
        return (1, "", str(e))


async def stream_command_output(
    command: str,
    cwd: Path,
    env: Optional[dict] = None,
    on_output: Optional[Callable[[str, bool], None]] = None,
) -> int:
    """
    Run a command and stream output line by line.

    Args:
        command: Command to run
        cwd: Working directory
        env: Environment variables
        on_output: Callback function (line, is_stderr) -> None

    Returns:
        Exit code
    """
    try:
        cmd_parts = command.split()

        process_env = None
        if env:
            import os
            process_env = os.environ.copy()
            process_env.update(env)

        process = await asyncio.create_subprocess_exec(
            *cmd_parts,
            cwd=cwd,
            env=process_env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        async def read_stream(stream, is_stderr: bool):
            """Read from stream and call on_output for each line."""
            while True:
                line = await stream.readline()
                if not line:
                    break
                text = line.decode('utf-8', errors='replace').rstrip()
                if text and on_output:
                    on_output(text, is_stderr)

        # Read from both streams concurrently
        await asyncio.gather(
            read_stream(process.stdout, False),
            read_stream(process.stderr, True),
        )

        # Wait for process to complete
        exit_code = await process.wait()
        return exit_code

    except Exception as e:
        logger.error(f"Error streaming command '{command}': {e}")
        if on_output:
            on_output(f"Error: {str(e)}", True)
        return 1


async def check_npm_installed() -> bool:
    """Check if npm is installed and available."""
    exit_code, _, _ = await run_command("npm --version", Path.cwd(), timeout=5.0)
    return exit_code == 0


async def check_node_modules_exists(project_id: str) -> bool:
    """Check if node_modules exists for a project."""
    project_dir = get_project_storage_path(project_id)
    return (project_dir / "node_modules").exists()


async def install_dependencies(project_id: str) -> tuple[bool, str]:
    """
    Install npm dependencies for a project.

    Returns:
        Tuple of (success, message)
    """
    project_dir = get_project_storage_path(project_id)
    package_json = project_dir / "package.json"

    if not package_json.exists():
        return (False, "package.json not found")

    logger.info(f"Installing dependencies for project {project_id}")

    exit_code, stdout, stderr = await run_command(
        "npm install",
        cwd=project_dir,
        timeout=300.0,  # 5 minutes timeout
    )

    if exit_code == 0:
        return (True, "Dependencies installed successfully")
    else:
        error_msg = stderr or stdout or "Unknown error"
        return (False, f"Failed to install dependencies: {error_msg}")


async def stream_npm_install(
    project_id: str,
    on_output: Callable[[str, bool], None],
) -> int:
    """
    Stream npm install output in real-time.

    Returns:
        Exit code
    """
    project_dir = get_project_storage_path(project_id)
    package_json = project_dir / "package.json"

    if not package_json.exists():
        on_output("Error: package.json not found", True)
        return 1

    logger.info(f"Installing dependencies for project {project_id} (streaming)")

    exit_code = await stream_command_output(
        "npm install",
        cwd=project_dir,
        on_output=on_output,
    )

    return exit_code


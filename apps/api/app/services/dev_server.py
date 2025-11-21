"""
Dev server process management service.
Manages lifecycle of Next.js dev servers per project.
"""
import asyncio
import socket
import signal
import os
from pathlib import Path
from typing import Optional, Dict
from datetime import datetime
from enum import Enum
import logging

from app.services.storage import get_project_storage_path

logger = logging.getLogger(__name__)


class ServerStatus(str, Enum):
    """Dev server status."""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    ERROR = "error"


class DevServerInfo:
    """Information about a running dev server."""
    def __init__(
        self,
        project_id: str,
        port: int,
        status: ServerStatus,
        process: Optional[asyncio.subprocess.Process] = None,
        pid: Optional[int] = None,
        started_at: Optional[datetime] = None,
        error_message: Optional[str] = None,
    ):
        self.project_id = project_id
        self.port = port
        self.status = status
        self.process = process
        self.pid = pid or (process.pid if process else None)
        self.started_at = started_at or datetime.now()
        self.error_message = error_message


class DevServerManager:
    """Manages Next.js dev servers for projects."""

    def __init__(self, base_port: int = 3001):
        self.base_port = base_port
        self.servers: Dict[str, DevServerInfo] = {}
        self.port_allocations: Dict[int, str] = {}  # port -> project_id

    def _find_available_port(self) -> Optional[int]:
        """Find an available port starting from base_port."""
        port = self.base_port
        max_attempts = 100  # Try up to 100 ports

        for _ in range(max_attempts):
            if port not in self.port_allocations and self._is_port_available(port):
                return port
            port += 1

        return None

    def _is_port_available(self, port: int) -> bool:
        """Check if a port is available."""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('localhost', port))
                return result != 0  # Port is available if connection fails
        except Exception:
            return False

    def allocate_port(self, project_id: str) -> Optional[int]:
        """Allocate a port for a project."""
        # If server already exists, return its port (don't reallocate)
        if project_id in self.servers:
            existing_port = self.servers[project_id].port
            # Make sure it's still in port_allocations
            if existing_port not in self.port_allocations:
                self.port_allocations[existing_port] = project_id
            return existing_port

        # Find and allocate a new port
        port = self._find_available_port()
        if port:
            self.port_allocations[port] = project_id
        return port

    def release_port(self, port: int):
        """Release a port allocation."""
        if port in self.port_allocations:
            del self.port_allocations[port]

    async def start_server(
        self,
        project_id: str,
        command: str,
        cwd: Path,
        env: Optional[Dict[str, str]] = None,
        port: Optional[int] = None,
    ) -> DevServerInfo:
        """Start a dev server for a project."""
        # Check if server is already running
        if project_id in self.servers:
            info = self.servers[project_id]
            if info.status == ServerStatus.RUNNING:
                logger.info(f"Server already running for project {project_id} on port {info.port}")
                return info
            elif info.status == ServerStatus.STARTING:
                logger.info(f"Server already starting for project {project_id}")
                return info
            else:
                # Clean up previous server info
                await self.stop_server(project_id)

        # Use provided port or allocate a new one
        if port is None:
            port = self.allocate_port(project_id)
            if not port:
                raise RuntimeError("No available ports for dev server")
        else:
            # Ensure the provided port is allocated to this project
            if port not in self.port_allocations:
                self.port_allocations[port] = project_id
            elif self.port_allocations[port] != project_id:
                raise RuntimeError(f"Port {port} is already allocated to another project")

        # Create server info with STARTING status
        server_info = DevServerInfo(
            project_id=project_id,
            port=port,
            status=ServerStatus.STARTING,
        )
        self.servers[project_id] = server_info

        try:
            # Prepare environment
            server_env = os.environ.copy()
            server_env["PORT"] = str(port)
            server_env["NEXT_PORT"] = str(port)
            if env:
                server_env.update(env)

            # Start process
            logger.info(f"Starting dev server for project {project_id} on port {port}")
            process = await asyncio.create_subprocess_exec(
                *command.split(),
                cwd=cwd,
                env=server_env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            server_info.process = process
            server_info.pid = process.pid
            server_info.status = ServerStatus.RUNNING

            logger.info(f"Dev server started for project {project_id} (PID: {process.pid})")
            return server_info

        except Exception as e:
            logger.error(f"Failed to start dev server for project {project_id}: {e}")
            server_info.status = ServerStatus.ERROR
            server_info.error_message = str(e)
            self.release_port(port)
            raise

    async def stop_server(self, project_id: str) -> bool:
        """Stop a dev server for a project."""
        if project_id not in self.servers:
            return True  # Already stopped

        server_info = self.servers[project_id]

        if server_info.status == ServerStatus.STOPPED:
            return True

        if server_info.status == ServerStatus.STOPPING:
            # Already stopping, wait for it to complete
            for _ in range(10):  # Wait up to 5 seconds
                await asyncio.sleep(0.5)
                if project_id not in self.servers or self.servers[project_id].status == ServerStatus.STOPPED:
                    return True
            # If still stopping after timeout, force cleanup
            if project_id in self.servers:
                port = self.servers[project_id].port
                del self.servers[project_id]
                self.release_port(port)
            return True

        # Mark as stopping to prevent race conditions
        server_info.status = ServerStatus.STOPPING
        port_to_release = server_info.port

        try:
            if server_info.process:
                logger.info(f"Stopping dev server for project {project_id} (PID: {server_info.pid})")

                # Try graceful shutdown first
                try:
                    server_info.process.terminate()
                    try:
                        await asyncio.wait_for(server_info.process.wait(), timeout=5.0)
                    except asyncio.TimeoutError:
                        # Force kill if graceful shutdown fails
                        logger.warning(f"Force killing dev server for project {project_id}")
                        server_info.process.kill()
                        await server_info.process.wait()
                except ProcessLookupError:
                    # Process already terminated
                    pass

            # Release port
            self.release_port(port_to_release)

            # Remove from servers
            if project_id in self.servers:
                del self.servers[project_id]

            # Mark server as stopped
            server_info.status = ServerStatus.STOPPED

            logger.info(f"Dev server stopped for project {project_id}")
            return True

        except Exception as e:
            logger.error(f"Error stopping dev server for project {project_id}: {e}")
            # Still clean up even on error
            if project_id in self.servers:
                self.servers[project_id].status = ServerStatus.ERROR
                self.servers[project_id].error_message = str(e)
            return False

    def get_server_info(self, project_id: str) -> Optional[DevServerInfo]:
        """Get server info for a project."""
        return self.servers.get(project_id)

    def get_server_status(self, project_id: str) -> ServerStatus:
        """Get server status for a project."""
        if project_id not in self.servers:
            return ServerStatus.STOPPED
        return self.servers[project_id].status

    async def stop_all_servers(self):
        """Stop all running dev servers."""
        project_ids = list(self.servers.keys())
        for project_id in project_ids:
            await self.stop_server(project_id)

    def is_running(self, project_id: str) -> bool:
        """Check if a server is running for a project."""
        return (
            project_id in self.servers
            and self.servers[project_id].status == ServerStatus.RUNNING
        )


# Global instance
_dev_server_manager: Optional[DevServerManager] = None


def get_dev_server_manager() -> DevServerManager:
    """Get the global dev server manager instance."""
    global _dev_server_manager
    if _dev_server_manager is None:
        _dev_server_manager = DevServerManager()
    return _dev_server_manager


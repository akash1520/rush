from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Path as PathParam, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Set, Dict
import json
import asyncio

from app.models import (
    ProjectCreate,
    ProjectResponse,
    ProjectWithFiles,
    FileUpsert,
    FileResponse,
    GenerateRequest,
    GenerationResponse,
    GeneratedFile,
    HealthResponse,
    DevServerStatusResponse,
    ChatMessageCreate,
    ChatMessageResponse,
)
from app.services.db import db, get_db_lifespan
from app.services.storage import (
    write_file,
    read_file,
    create_zip_archive,
    check_filesystem_health,
    get_project_storage_path,
)
from app.services.generator import generate_code, check_gemini_health
from app.services.dev_server import (
    get_dev_server_manager,
    ServerStatus,
)
from app.services.commands import (
    check_npm_installed,
    check_node_modules_exists,
    stream_npm_install,
)
from app.services.nextjs_init import (
    initialize_nextjs_project,
    is_nextjs_project,
)


# WebSocket connections for dev server logs
# Map project_id -> set of WebSocket connections
active_websockets: Dict[str, Set[WebSocket]] = {}

# Log buffering for late-connecting WebSockets
# Map project_id -> list of recent log lines (max 200 lines)
log_buffers: Dict[str, List[dict]] = {}
MAX_BUFFER_SIZE = 200


async def broadcast_to_project(project_id: str, message: dict):
    """Broadcast a message to all WebSocket connections for a project."""
    # Buffer output messages for late-connecting WebSockets
    if message.get("type") == "output":
        if project_id not in log_buffers:
            log_buffers[project_id] = []
        log_buffers[project_id].append(message)
        # Keep only recent logs (FIFO)
        if len(log_buffers[project_id]) > MAX_BUFFER_SIZE:
            log_buffers[project_id] = log_buffers[project_id][-MAX_BUFFER_SIZE:]

    # Broadcast to all connected WebSockets
    if project_id in active_websockets and active_websockets[project_id]:
        disconnected = set()
        for ws in active_websockets[project_id]:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.add(ws)
        # Remove disconnected websockets
        if disconnected:
            active_websockets[project_id] -= disconnected
            if not active_websockets[project_id]:
                del active_websockets[project_id]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect/disconnect database."""
    await db.connect()
    yield
    # Stop all dev servers on shutdown
    dev_server_manager = get_dev_server_manager()
    await dev_server_manager.stop_all_servers()
    await db.disconnect()


app = FastAPI(title="AI Site Builder API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005"],  # Next.js dev servers
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint - verifies database and filesystem."""
    db_status = "ok"
    fs_status = "ok"

    # Check database
    try:
        await db.query_raw("SELECT 1")
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Check filesystem
    if not check_filesystem_health():
        fs_status = "error: cannot write to storage"

    is_ok = db_status == "ok" and fs_status == "ok"

    return HealthResponse(
        ok=is_ok,
        service="api",
        database=db_status,
        filesystem=fs_status,
    )


@app.post("/projects", response_model=ProjectResponse)
async def create_project(data: ProjectCreate):
    """Create a new project."""
    project = await db.project.create(
        data={
            "name": data.name,
        }
    )
    return ProjectResponse(
        id=project.id,
        name=project.name,
        createdAt=project.createdAt,
        updatedAt=project.updatedAt,
    )


@app.get("/projects", response_model=List[ProjectResponse])
async def list_projects():
    """List all projects."""
    projects = await db.project.find_many(
        order={"createdAt": "desc"}
    )
    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            createdAt=p.createdAt,
            updatedAt=p.updatedAt,
        )
        for p in projects
    ]


@app.get("/projects/{project_id}", response_model=ProjectWithFiles)
async def get_project(project_id: str = PathParam(..., description="Project ID")):
    """Get project with all its files."""
    project = await db.project.find_unique(
        where={"id": project_id},
        include={"files": True}
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return ProjectWithFiles(
        id=project.id,
        name=project.name,
        createdAt=project.createdAt,
        updatedAt=project.updatedAt,
        files=[
            FileResponse(
                id=f.id,
                projectId=f.projectId,
                path=f.path,
                localPath=f.localPath,
                createdAt=f.createdAt,
                updatedAt=f.updatedAt,
            )
            for f in (project.files or [])
        ],
    )


@app.post("/projects/{project_id}/files", response_model=FileResponse)
async def upsert_file(
    data: FileUpsert,
    project_id: str = PathParam(..., description="Project ID")
):
    """Upsert a file (write to disk and update database)."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Write to disk
    try:
        local_path = await write_file(project_id, data.path, data.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {str(e)}")

    # Upsert in database
    file_record = await db.file.upsert(
        where={
            "projectId_path": {
                "projectId": project_id,
                "path": data.path,
            }
        },
        data={
            "create": {
                "projectId": project_id,
                "path": data.path,
                "localPath": local_path,
            },
            "update": {
                "localPath": local_path,
            },
        },
    )

    return FileResponse(
        id=file_record.id,
        projectId=file_record.projectId,
        path=file_record.path,
        localPath=file_record.localPath,
        createdAt=file_record.createdAt,
        updatedAt=file_record.updatedAt,
    )


@app.get("/projects/{project_id}/files/{file_path:path}")
async def get_file(
    project_id: str = PathParam(..., description="Project ID"),
    file_path: str = PathParam(..., description="File path")
):
    """Read a file's content from disk."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Read from disk
    try:
        content = await read_file(project_id, file_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    if content is None:
        raise HTTPException(status_code=404, detail="File not found")

    return {"path": file_path, "content": content}


@app.post("/generate", response_model=GenerationResponse)
async def generate(data: GenerateRequest):
    """
    Generate code files using AI.
    Creates a Generation record, calls Gemini API, writes files to disk and DB.
    """
    # Verify project exists
    project = await db.project.find_unique(where={"id": data.projectId})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check Gemini is configured
    if not check_gemini_health():
        raise HTTPException(
            status_code=503,
            detail="AI service not configured (missing GEMINI_API_KEY)"
        )

    # Create generation record
    generation = await db.generation.create(
        data={
            "projectId": data.projectId,
            "prompt": data.prompt,
            "model": data.model or "gemini-2.5-flash",
            "status": "processing",
        }
    )

    try:
        # Initialize Next.js project if needed (before generating code)
        if not await is_nextjs_project(data.projectId):
            await initialize_nextjs_project(data.projectId)

        # Call Gemini API
        files = await generate_code(data.prompt, data.model or "gemini-2.5-flash")

        # Write files to disk and database
        for file in files:
            local_path = await write_file(data.projectId, file.path, file.content)
            await db.file.upsert(
                where={
                    "projectId_path": {
                        "projectId": data.projectId,
                        "path": file.path,
                    }
                },
                data={
                    "create": {
                        "projectId": data.projectId,
                        "path": file.path,
                        "localPath": local_path,
                    },
                    "update": {
                        "localPath": local_path,
                    },
                },
            )

        # Update generation status
        generation = await db.generation.update(
            where={"id": generation.id},
            data={"status": "completed"}
        )

        return GenerationResponse(
            id=generation.id,
            projectId=generation.projectId,
            status=generation.status,
            prompt=generation.prompt,
            model=generation.model,
            createdAt=generation.createdAt,
            files=files,
        )

    except Exception as e:
        # Update generation status to failed
        await db.generation.update(
            where={"id": generation.id},
            data={"status": f"failed: {str(e)}"}
        )
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/projects/{project_id}/zip")
async def download_zip(project_id: str = PathParam(..., description="Project ID")):
    """Download all project files as a ZIP archive."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        zip_buffer = create_zip_archive(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create ZIP: {str(e)}")

    # Return as streaming response
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={project.name or project_id}.zip"
        },
    )


# Dev Server Endpoints

@app.post("/projects/{project_id}/dev-server/start", response_model=DevServerStatusResponse)
async def start_dev_server(project_id: str = PathParam(..., description="Project ID")):
    """Start a Next.js dev server for a project."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check if npm is installed
    if not await check_npm_installed():
        raise HTTPException(
            status_code=503,
            detail="npm is not installed or not available"
        )

    dev_server_manager = get_dev_server_manager()

    # Check if already running or starting
    current_status = dev_server_manager.get_server_status(project_id)
    if current_status == ServerStatus.RUNNING:
        server_info = dev_server_manager.get_server_info(project_id)
        return DevServerStatusResponse(
            status=server_info.status.value,
            port=server_info.port,
            pid=server_info.pid,
        )
    elif current_status == ServerStatus.STARTING:
        # Already starting, return current status
        server_info = dev_server_manager.get_server_info(project_id)
        return DevServerStatusResponse(
            status=server_info.status.value,
            port=server_info.port,
            pid=server_info.pid,
        )

    try:
        project_dir = get_project_storage_path(project_id)

        # Initialize Next.js project if needed
        if not await is_nextjs_project(project_id):
            await initialize_nextjs_project(project_id)

        # Check if node_modules exists, if not, install dependencies
        if not await check_node_modules_exists(project_id):
            # Broadcast that we're installing dependencies
            await broadcast_to_project(project_id, {
                "type": "output",
                "line": "Installing dependencies...",
                "is_stderr": False,
            })

            # Stream npm install output
            from app.services.commands import stream_npm_install

            def on_npm_output(line: str, is_stderr: bool):
                # This will be called from the streaming function
                # We need to broadcast it, but we're in an async context
                # So we'll collect output and broadcast after
                pass

            # For now, do a blocking install and broadcast messages
            from app.services.commands import install_dependencies
            success, message = await install_dependencies(project_id)

            if success:
                await broadcast_to_project(project_id, {
                    "type": "output",
                    "line": "✓ Dependencies installed successfully",
                    "is_stderr": False,
                })
            else:
                await broadcast_to_project(project_id, {
                    "type": "output",
                    "line": f"✗ Failed to install dependencies: {message}",
                    "is_stderr": True,
                })
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to install dependencies: {message}"
                )

        # Allocate port first (before starting server)
        port = dev_server_manager.allocate_port(project_id)
        if not port:
            raise HTTPException(
                status_code=503,
                detail="No available ports for dev server"
            )

        # Broadcast that we're starting the server
        await broadcast_to_project(project_id, {
            "type": "output",
            "line": f"Starting Next.js dev server on port {port}...",
            "is_stderr": False,
        })

        # Start the dev server with explicit port
        # Pass the port explicitly to ensure consistency
        server_info = await dev_server_manager.start_server(
            project_id=project_id,
            command=f"npm run dev -- -p {port}",
            cwd=project_dir,
            env={"PORT": str(port), "NEXT_PORT": str(port)},
            port=port,  # Explicitly pass the port
        )

        # Broadcast status update
        await broadcast_to_project(project_id, {
            "type": "status",
            "status": server_info.status.value,
            "port": server_info.port,
            "pid": server_info.pid,
        })

        # Initialize log buffer for this project
        if project_id not in log_buffers:
            log_buffers[project_id] = []

        # Initialize log buffer for this project
        if project_id not in log_buffers:
            log_buffers[project_id] = []

        # Start background task to stream process output to all WebSockets
        if server_info.process:
            asyncio.create_task(stream_process_to_websockets(project_id, server_info.process))

        return DevServerStatusResponse(
            status=server_info.status.value,
            port=server_info.port,
            pid=server_info.pid,
            error_message=server_info.error_message,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start dev server: {str(e)}"
        )


@app.get("/projects/{project_id}/dev-server/status", response_model=DevServerStatusResponse)
async def get_dev_server_status(project_id: str = PathParam(..., description="Project ID")):
    """Get the status of a dev server for a project."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    dev_server_manager = get_dev_server_manager()
    server_info = dev_server_manager.get_server_info(project_id)

    if not server_info:
        return DevServerStatusResponse(status=ServerStatus.STOPPED.value)

    return DevServerStatusResponse(
        status=server_info.status.value,
        port=server_info.port,
        pid=server_info.pid,
        error_message=server_info.error_message,
    )


@app.post("/projects/{project_id}/dev-server/stop")
async def stop_dev_server(project_id: str = PathParam(..., description="Project ID")):
    """Stop a dev server for a project."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    dev_server_manager = get_dev_server_manager()
    success = await dev_server_manager.stop_server(project_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Dev server not running for this project"
        )

    await broadcast_to_project(project_id, {
        "type": "status",
        "status": ServerStatus.STOPPED.value,
    })
    await broadcast_to_project(project_id, {
        "type": "output",
        "line": "Dev server stopped.",
        "is_stderr": False,
    })

    # Clear log buffer when server stops
    if project_id in log_buffers:
        del log_buffers[project_id]

    return {"message": "Dev server stopped"}


async def stream_process_to_websockets(project_id: str, process: asyncio.subprocess.Process):
    """Stream process output to all WebSocket connections for a project."""
    async def read_stream(stream, is_stderr: bool):
        """Read from stream and broadcast to all WebSockets."""
        try:
            while True:
                if stream:
                    line = await stream.readline()
                    if not line:
                        await asyncio.sleep(0.1)  # Small delay before checking again
                        continue
                    text = line.decode('utf-8', errors='replace').rstrip()
                    if text:
                        await broadcast_to_project(project_id, {
                            "type": "output",
                            "line": text,
                            "is_stderr": is_stderr,
                        })
        except Exception as e:
            await broadcast_to_project(project_id, {
                "type": "error",
                "message": str(e),
            })

    # Read from both streams concurrently
    tasks = []
    if process.stdout:
        tasks.append(read_stream(process.stdout, False))
    if process.stderr:
        tasks.append(read_stream(process.stderr, True))

    if tasks:
        await asyncio.gather(*tasks)


@app.websocket("/projects/{project_id}/dev-server/ws")
async def dev_server_websocket(websocket: WebSocket, project_id: str):
    """WebSocket endpoint for streaming dev server logs and output."""
    await websocket.accept()

    # Add to project's WebSocket set
    if project_id not in active_websockets:
        active_websockets[project_id] = set()
    active_websockets[project_id].add(websocket)

    try:
        dev_server_manager = get_dev_server_manager()
        server_info = dev_server_manager.get_server_info(project_id)

        # Send initial status
        if server_info:
            await websocket.send_json({
                "type": "status",
                "status": server_info.status.value,
                "port": server_info.port,
                "pid": server_info.pid,
            })

            # Send buffered logs if server is already running
            if server_info.status == ServerStatus.RUNNING and project_id in log_buffers:
                for buffered_message in log_buffers[project_id]:
                    try:
                        await websocket.send_json(buffered_message)
                    except Exception:
                        pass  # Skip if connection is broken
        else:
            await websocket.send_json({
                "type": "status",
                "status": ServerStatus.STOPPED.value,
            })

        # If server is running, start streaming its output (if not already streaming)
        # The stream_process_to_websockets task handles this for all connections

        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                # Handle client messages if needed
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                break
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e),
                })

    except WebSocketDisconnect:
        pass
    finally:
        # Remove from project's WebSocket set
        if project_id in active_websockets:
            active_websockets[project_id].discard(websocket)
            if not active_websockets[project_id]:
                del active_websockets[project_id]


@app.post("/projects/{project_id}/dev-server/install")
async def install_dependencies_endpoint(project_id: str = PathParam(..., description="Project ID")):
    """Install npm dependencies for a project (streaming via WebSocket)."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.services.commands import install_dependencies
    success, message = await install_dependencies(project_id)

    if not success:
        raise HTTPException(status_code=500, detail=message)

    return {"message": message}


# Chat History Endpoints

@app.get("/projects/{project_id}/chat/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(project_id: str = PathParam(..., description="Project ID")):
    """Get all chat messages for a project."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    messages = await db.chatmessage.find_many(
        where={"projectId": project_id},
        order={"createdAt": "asc"}
    )

    return [
        ChatMessageResponse(
            id=m.id,
            projectId=m.projectId,
            role=m.role,
            content=m.content,
            createdAt=m.createdAt,
        )
        for m in messages
    ]


@app.post("/projects/{project_id}/chat/messages", response_model=ChatMessageResponse)
async def create_chat_message(
    project_id: str = PathParam(..., description="Project ID"),
    data: ChatMessageCreate = ...,
):
    """Create a new chat message."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate role
    if data.role not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'assistant'")

    message = await db.chatmessage.create(
        data={
            "projectId": project_id,
            "role": data.role,
            "content": data.content,
        }
    )

    return ChatMessageResponse(
        id=message.id,
        projectId=message.projectId,
        role=message.role,
        content=message.content,
        createdAt=message.createdAt,
    )


@app.delete("/projects/{project_id}/chat/messages")
async def clear_chat_messages(project_id: str = PathParam(..., description="Project ID")):
    """Clear all chat messages for a project."""
    # Verify project exists
    project = await db.project.find_unique(where={"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.chatmessage.delete_many(where={"projectId": project_id})

    return {"message": "Chat messages cleared"}

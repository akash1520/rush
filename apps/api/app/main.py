from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Path as PathParam
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List

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
)
from app.services.db import db, get_db_lifespan
from app.services.storage import (
    write_file,
    read_file,
    create_zip_archive,
    check_filesystem_health,
)
from app.services.generator import generate_code, check_gemini_health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect/disconnect database."""
    await db.connect()
    yield
    await db.disconnect()


app = FastAPI(title="AI Site Builder API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
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

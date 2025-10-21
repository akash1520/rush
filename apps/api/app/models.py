from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Project models
class ProjectCreate(BaseModel):
    name: str


class ProjectResponse(BaseModel):
    id: str
    name: str
    createdAt: datetime
    updatedAt: datetime


class ProjectWithFiles(ProjectResponse):
    files: List["FileResponse"] = []


# File models
class FileUpsert(BaseModel):
    path: str
    content: str


class FileResponse(BaseModel):
    id: str
    projectId: str
    path: str
    localPath: str
    createdAt: datetime
    updatedAt: datetime


# Generation models
class GenerateRequest(BaseModel):
    projectId: str
    prompt: str
    model: Optional[str] = "gemini-1.5-flash"


class GeneratedFile(BaseModel):
    path: str
    content: str


class GenerationResponse(BaseModel):
    id: str
    projectId: str
    status: str
    prompt: str
    model: str
    createdAt: datetime
    files: List[GeneratedFile] = []


# Health check
class HealthResponse(BaseModel):
    ok: bool
    service: str
    database: str
    filesystem: str



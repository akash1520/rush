from prisma import Prisma
from contextlib import asynccontextmanager

# Global Prisma client instance
db = Prisma()


@asynccontextmanager
async def get_db_lifespan(app):
    """
    FastAPI lifespan context manager for Prisma client.
    Handles connection and disconnection on app startup/shutdown.
    """
    await db.connect()
    yield
    await db.disconnect()


async def get_db() -> Prisma:
    """
    Dependency to get database client.
    Returns the global Prisma instance.
    """
    return db



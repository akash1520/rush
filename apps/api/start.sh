#!/bin/sh

# Start the server with PORT from environment (Railway sets this)
# Use default 8000 if PORT is not set
PORT=${PORT:-8000}

# Run Prisma migrations for PostgreSQL (Railway)
# migrate deploy is safe for production - it only runs pending migrations
echo "Running database migrations..."
prisma migrate deploy --schema prisma/schema.prisma || {
    echo "Migration failed, attempting db push as fallback..."
    prisma db push --schema prisma/schema.prisma --accept-data-loss || {
        echo "Warning: Database setup failed, but continuing..."
    }
}

# Generate Prisma client (in case it wasn't generated during build)
echo "Generating Prisma client..."
prisma generate --schema prisma/schema.prisma || {
    echo "Warning: Prisma client generation failed, but continuing..."
}

# Start the server
echo "Starting FastAPI server on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"


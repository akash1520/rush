# Multi-stage build for Railway deployment
FROM python:3.13-slim

# Install Node.js for Prisma (combine commands for smaller layers)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only requirements first for better caching
# Note: Build context is repo root, so paths are relative to that
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Prisma CLI globally
RUN npm install -g prisma@5.11.0

# Copy Prisma schema and migrations
COPY apps/api/prisma/ ./prisma/

# Generate Prisma client (will be regenerated at runtime if needed)
# Note: We generate here for build-time validation, but also generate at runtime
# to ensure it matches the actual database connection
RUN prisma generate --schema prisma/schema.prisma || echo "Warning: Prisma generate failed (may need DATABASE_URL)"

# Copy application code (only Python files, exclude __pycache__)
COPY apps/api/app/ ./app/

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/storage && \
    chmod -R 755 /app/data /app/storage

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Set default PORT if not provided
ENV PORT=8000

# Set environment variables for proper paths
# Note: DATABASE_URL will be provided by Railway when PostgreSQL service is added
# STORAGE_BASE_DIR defaults to /app/storage (Railway persistent volume)
ENV STORAGE_BASE_DIR=/app/storage

# Copy startup script
COPY apps/api/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Start command - Railway will set PORT env var
CMD ["/app/start.sh"]


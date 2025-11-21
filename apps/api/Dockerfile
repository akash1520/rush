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
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Prisma CLI globally
RUN npm install -g prisma@5.11.0

# Copy only Prisma schema (not migrations to reduce size)
COPY prisma/schema.prisma ./prisma/

# Generate Prisma client
RUN prisma generate --schema prisma/schema.prisma

# Copy application code (only Python files, exclude __pycache__)
COPY app/ ./app/

# Create necessary directories
RUN mkdir -p /app/data /app/storage

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Set default PORT if not provided
ENV PORT=8000

# Start command - Railway will set PORT env var
# Use shell form to allow env var expansion
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]


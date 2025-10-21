#!/bin/bash

# AI Site Builder - Development Environment Startup Script
# This script starts both the API backend and web frontend for local development

set -e

# Color codes for better output readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/home/odoo/rush"
API_DIR="${PROJECT_ROOT}/apps/api"
WEB_DIR="${PROJECT_ROOT}/apps/web"
VENV_PATH="${API_DIR}/.venv"

# Log file paths
LOG_DIR="${PROJECT_ROOT}/.dev-logs"
API_LOG="${LOG_DIR}/api.log"
WEB_LOG="${LOG_DIR}/web.log"
PID_FILE="${LOG_DIR}/dev.pid"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup processes on exit
cleanup() {
    print_info "Shutting down development servers..."

    if [ -f "${PID_FILE}" ]; then
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                print_info "Stopping process $pid"
                kill "$pid" 2>/dev/null || true
                # Wait a bit and force kill if still running
                sleep 2
                if kill -0 "$pid" 2>/dev/null; then
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
        done < "${PID_FILE}"
        rm -f "${PID_FILE}"
    fi

    print_success "Development environment stopped"
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Check prerequisites
print_info "Checking prerequisites..."

# Check if Python venv exists
if [ ! -d "${VENV_PATH}" ]; then
    print_error "Python virtual environment not found at ${VENV_PATH}"
    print_info "Please run: cd ${API_DIR} && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if API .env file exists
if [ ! -f "${API_DIR}/.env" ]; then
    print_warning "API .env file not found. Creating with default values..."
    echo 'DATABASE_URL="file:../data/dev.db"' > "${API_DIR}/.env"
    print_success "Created ${API_DIR}/.env"
fi

# Check if Web .env.local file exists
if [ ! -f "${WEB_DIR}/.env.local" ]; then
    print_warning "Web .env.local file not found."
    print_warning "You may need to create ${WEB_DIR}/.env.local with GEMINI_API_KEY"
fi

# Check if node_modules exist
if [ ! -d "${WEB_DIR}/node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    cd "${PROJECT_ROOT}"
    pnpm i
    print_success "Dependencies installed"
fi

# Check if uvicorn is available in venv
if ! "${VENV_PATH}/bin/python" -c "import uvicorn" 2>/dev/null; then
    print_error "uvicorn not found in virtual environment"
    print_info "Please run: cd ${API_DIR} && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

print_success "Prerequisites check passed"

# Clear old log files
> "${API_LOG}"
> "${WEB_LOG}"
> "${PID_FILE}"

print_info "Starting development environment..."
echo ""

# Start API Backend
print_info "Starting API backend on http://localhost:8000 ..."
cd "${API_DIR}"
# Activate virtual environment and run uvicorn
(
    source "${VENV_PATH}/bin/activate"
    export PYTHONPATH="${API_DIR}:${PYTHONPATH}"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > "${API_LOG}" 2>&1
) &
API_PID=$!
echo "${API_PID}" >> "${PID_FILE}"
print_success "API backend started (PID: ${API_PID})"
print_info "API logs: ${API_LOG}"

# Wait a moment for API to start
sleep 2

# Start Web Frontend
print_info "Starting web frontend on http://localhost:3000 ..."
cd "${WEB_DIR}"
pnpm dev > "${WEB_LOG}" 2>&1 &
WEB_PID=$!
echo "${WEB_PID}" >> "${PID_FILE}"
print_success "Web frontend started (PID: ${WEB_PID})"
print_info "Web logs: ${WEB_LOG}"

echo ""
print_success "=========================================="
print_success "Development environment is running!"
print_success "=========================================="
echo ""
echo -e "${GREEN}Endpoints:${NC}"
echo -e "  ${BLUE}Web:${NC}     http://localhost:3000"
echo -e "  ${BLUE}API:${NC}     http://localhost:8000/health"
echo ""
echo -e "${GREEN}Logs:${NC}"
echo -e "  ${BLUE}API:${NC}     tail -f ${API_LOG}"
echo -e "  ${BLUE}Web:${NC}     tail -f ${WEB_LOG}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Follow logs in the terminal (showing both API and Web)
tail -f "${API_LOG}" "${WEB_LOG}" 2>/dev/null || {
    # If tail fails, just wait
    print_info "Processes running in background..."
    wait
}

